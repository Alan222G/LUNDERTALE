// combat.js — Combat state machine for LUNDERTALE
// Refactored from UGE with BossController integration

var Combat = (function() {
    var combatState;
    var COMBAT_STATE = Object.freeze({
        MAIN: 0, FIGHT: 1, ACT: 2, ITEM: 3, MERCY: 4,
        EFFECT: 5, RESPOND: 6, DEFEND: 7, DEATH: 8, NAME: 9, WIN: 10,
    });

    var menuState;
    var MENU_STATE = Object.freeze({ FIGHT: 1, ACT: 2, ITEM: 3, MERCY: 4 });

    var selectStateEnemy = 0;
    var selectStateOther = 0;
    var gravityDmgTimer = 0;
    var deathTimer = 0; // Timer for center black hole contact damage
    var victoryType = "killed";

    function init(bossId) {
        combatState = COMBAT_STATE.MAIN;
        menuState = MENU_STATE.FIGHT;
        selectStateEnemy = 0;
        selectStateOther = 0;
        gravityDmgTimer = 0;
        victoryType = "killed";
        Cbbox.setup(574, 140);
        Cgroup.setup(bossId);

        Sound.pauseSoundHard("bgm_overworld");
        
        // Pause all potential boss tracks first
        Sound.pauseSoundHard("bgm_singularity");
        Sound.pauseSoundHard("bgm_seraphina");
        Sound.pauseSoundHard("bgm_evangelion");
        Sound.pauseSoundHard("bgm_paradox");
        Sound.pauseSoundHard("bgm_godzilla");
        Sound.pauseSoundHard("bgm_prism");

        if (bossId === "ramiel" || bossId === "sachiel") {
            Sound.playSound("bgm_evangelion", true);
        } else if (bossId === "paradox") {
            Sound.playSound("bgm_paradox", true);
        } else if (bossId === "godzilla") {
            Sound.playSound("bgm_godzilla", true);
        } else if (bossId === "prism") {
            Sound.playSound("bgm_prism", true);
        } else if (bossId === "singularity" || bossId === "vader") {
            Sound.playSound("bgm_singularity", true);
        } else {
            Sound.playSound("bgm_seraphina", true);
        }
        
        // Eva 01 Anti-Angel Protocol: +20% all stats vs angel bosses
        if (typeof Player !== "undefined" && Player.getSoulClass() === 13) {
            if (bossId === "seraphina" || bossId === "ramiel" || bossId === "sachiel") {
                Player.applyAngelBonus();
                if (typeof Soul !== "undefined" && Soul.addFloatingText) {
                    setTimeout(function() {
                        var sPos = Soul.getPos();
                        Soul.addFloatingText("ANTI-ANGEL", sPos.x + Soul.getWidth() / 2, sPos.y - 12, "#9900FF");
                    }, 500);
                }
            }
        }
    }

    function setup(ctx) {
        Soul.getCollision(ctx);
        Writer.setupTimes(0.50, 0.33, 0.21, 0.033);
        Writer.setupText(Cgroup.getText());
        Cattack.setup();
    }

    function update(dt) {
        Cgroup.update(dt);
        if (combatState != COMBAT_STATE.FLASH) Soul.update(dt);

        // Karma damage update
        if (Player.updateKarma(dt)) {
            combatState = COMBAT_STATE.DEATH;
        }

        switch (combatState) {
            case COMBAT_STATE.MAIN:
                if (Cbbox.update(dt)) {
                    Writer.update(dt);
                    if (myKeys.isRight()) {
                        menuState++;
                        if (menuState > MENU_STATE.MERCY) menuState = MENU_STATE.FIGHT;
                        Sound.playSound("button", true);
                    }
                    if (myKeys.isLeft()) {
                        menuState--;
                        if (menuState < MENU_STATE.FIGHT) menuState = MENU_STATE.MERCY;
                        Sound.playSound("button", true);
                    }
                    if (myKeys.isConfirm()) {
                        switch (menuState) {
                            case MENU_STATE.FIGHT:
                            case MENU_STATE.ACT:
                                combatState = COMBAT_STATE.NAME;
                                selectStateOther = 0;
                                Sound.pauseSoundHard("text");
                                break;
                            case MENU_STATE.ITEM:
                                if (Inventory.getLength() <= 0) {
                                    combatState = COMBAT_STATE.MAIN;
                                } else {
                                    combatState = menuState;
                                    selectStateOther = 0;
                                    Sound.pauseSoundHard("text");
                                }
                                break;
                            case MENU_STATE.MERCY:
                                combatState = menuState;
                                selectStateOther = 0;
                                Sound.pauseSoundHard("text");
                                break;
                        }
                        Sound.playSound("button", true);
                    }
                }
                break;

            case COMBAT_STATE.FIGHT:
                if (Cattack.update(dt)) {
                    if (Cgroup.getCurHP(selectStateEnemy) <= 0) {
                        Sound.playSound("heal", true);
                        combatState = COMBAT_STATE.WIN;
                        return;
                    }
                    combatState = COMBAT_STATE.RESPOND;
                    Cbubble.setup(Cgroup.getEnemy(selectStateEnemy).getRandomSpeech());
                    Writer.reset();
                }
                break;

            case COMBAT_STATE.ACT:
                if (myKeys.isCancel()) {
                    combatState = COMBAT_STATE.NAME;
                    Sound.playSound("button", true);
                }
                if (myKeys.isConfirm()) {
                    Writer.setupText(Cgroup.getRes(selectStateEnemy, selectStateOther));
                    combatState = COMBAT_STATE.EFFECT;
                }
                selectStateOther = detectHorizontalSelect(Cgroup.getActs(selectStateEnemy), selectStateOther);
                break;

            case COMBAT_STATE.ITEM:
                if (myKeys.isConfirm()) {
                    myKeys.keydown[myKeys.KEYBOARD.KEY_Z] = false;
                    myKeys.keydown[myKeys.KEYBOARD.KEY_ENTER] = false;
                    
                    // Eva 01 Berserk Mode check
                    if (Player.getSoulClass() === 13 && Player.getHPCur() < Player.getHPMax() * 0.3) {
                        Writer.setupText("* ¡Eva 01 esta en modo BERSERK!\n* ¡Imposible usar objetos!");
                        combatState = COMBAT_STATE.EFFECT;
                    } else {
                        Writer.setupText(Inventory.getText(selectStateOther));
                        Inventory.activate(selectStateOther);
                        Inventory.removeItem(selectStateOther);
                        combatState = COMBAT_STATE.EFFECT;
                    }
                }
                if (myKeys.isCancel()) {
                    combatState = COMBAT_STATE.MAIN;
                    Writer.reset();
                    Sound.playSound("button", true);
                }
                selectStateOther = detectHorizontalSelect(Inventory.getNames(), selectStateOther);
                break;

            case COMBAT_STATE.MERCY:
                if (myKeys.isCancel()) {
                    combatState = COMBAT_STATE.MAIN;
                    Writer.reset();
                    Sound.playSound("button", true);
                } else if (myKeys.isConfirm()) {
                    Sound.playSound("button", true);
                    if (selectStateOther === 0) { // Spare
                        var em = Cgroup.getEnemy(0); // target first enemy
                        if (em.spareable && em.currentPhase === 0 && em.mercyHP <= 0) {
                            victoryType = "spared";
                            combatState = COMBAT_STATE.WIN;
                        } else {
                            // Cannot spare
                            var msg = "* " + em.name + " is not\n  ready to be spared.";
                            if (!em.spareable) {
                                msg = "* Sparing is useless\n  against " + em.name + ".";
                            } else if (em.currentPhase > 0) {
                                msg = "* It is too late\n  to spare " + em.name + "!";
                            }
                            Cbubble.setup(em.bubblePos, msg, em.bubbleOff, 4);
                            combatState = COMBAT_STATE.RESPOND;
                        }
                    } else if (selectStateOther === 1) { // Flee
                        if (typeof Overworld !== "undefined" && Overworld.resetBossTrigger) {
                            Overworld.resetBossTrigger();
                        }
                        Player.init();
                        Inventory.init();
                        BossController.reset();
                        Sound.playSound("flash", true);
                        Transition.start("overworld", function() {
                            main.gameState = main.GAME_STATE.OVERWORLD;
                            Overworld.setup(main.ctx);
                        });
                        combatState = -1;
                    }
                    myKeys.keydown = [];
                }
                selectStateOther = detectVerticalSelect(Cgroup.getMercies(), selectStateOther);
                break;

            case COMBAT_STATE.EFFECT:
                Writer.update(dt);
                if (myKeys.isConfirm()) {
                    if (Writer.isFinished()) {
                        combatState = COMBAT_STATE.RESPOND;
                        Cbubble.setup(Cgroup.getEnemy(selectStateEnemy).getRandomSpeech());
                        Writer.setupText(Cgroup.getText());
                        Sound.pauseSound("text");
                        myKeys.keydown[myKeys.KEYBOARD.KEY_Z] = false;
                        myKeys.keydown[myKeys.KEYBOARD.KEY_ENTER] = false;
                    } else {
                        Writer.skip();
                        myKeys.keydown[myKeys.KEYBOARD.KEY_Z] = false;
                        myKeys.keydown[myKeys.KEYBOARD.KEY_ENTER] = false;
                    }
                }
                break;

            case COMBAT_STATE.RESPOND:
                if (Cbbox.update(dt) && Cbubble.update(dt) && myKeys.isConfirm()) {
                    combatState = COMBAT_STATE.DEFEND;
                    // Start boss attack
                    var enemy = Cgroup.getEnemy(selectStateEnemy);
                    var details = BossController.getAttackDetails(enemy);
                    var w = details.width;
                    var h = details.height;
                    if (Player.consumeNextBoxBigger()) {
                        w = Math.min(600, w * 1.5);
                        h = Math.min(400, h * 1.5);
                    }
                    Cbbox.setSize(w, h, false);
                    BossController.startAttack(enemy, Cbbox.getBound(), details.patternName);
                }
                break;

            case COMBAT_STATE.DEFEND:
                Cbbox.update(dt);
                Soul.update(dt);
                
                var enemy = Cgroup.getEnemy(selectStateEnemy);
                
                // Gravity Pull Mechanic for Phase 2 (Singularity ONLY)
                if (Cgroup.getBossId() === "singularity" && enemy && enemy.currentPhase === 1) {
                    var soulPos = Soul.getPos();
                    var _bb = Cbbox.getBound();
                    var center = new Vect((_bb[0]+_bb[2])/2, (_bb[1]+_bb[3])/2, 0);
                    var dir = center.getSub(soulPos);
                    var dist = dir.getMagnitude();
                    if (dist > 10) {
                        dir = dir.getNorm();
                        var pullStrength = 41.6; // +8% pull (was 38.5)
                        soulPos.x += dir.x * pullStrength * dt;
                        soulPos.y += dir.y * pullStrength * dt;
                        Soul.setPos(soulPos.x, soulPos.y);
                    }
                    // Contact damage: 1 HP/sec if touching the edge of the mini black hole
                    if (dist < 30) {
                        gravityDmgTimer += dt;
                        if (gravityDmgTimer >= 1.0) {
                            gravityDmgTimer -= 1.0;
                            Player.damage(1);
                        }
                    } else {
                        gravityDmgTimer = 0;
                    }
                }
                
                Soul.move(dt);
                Soul.limit(Cbbox.getBound());

                // Update boss controller (handles patterns + collision)
                if (BossController.update(dt, Cgroup.getEnemy(selectStateEnemy))) {
                    // Attack finished
                    Soul.reset();
                    Soul.setSoulMode(Soul.SOUL_MODE.RED);
                    Cbbox.setSize(574, 140, false);
                    Player.resetBuffs();

                    if (typeof Player !== 'undefined' && Player.isPoisonEnemy && Player.isPoisonEnemy()) {
                        var _enemy = Cgroup.getEnemy(selectStateEnemy);
                        if (_enemy && _enemy.mercyHP !== undefined) {
                            _enemy.mercyHP = Math.max(0, _enemy.mercyHP - 15);
                            Sound.playSound("damage", true);
                        }
                    }
                    combatState = COMBAT_STATE.MAIN;
                    Writer.setupText(Cgroup.getText());
                }

                // Check death
                if (Player.getHPCur() <= 0) {
                    combatState = COMBAT_STATE.DEATH;
                    deathTimer = 0;
                    selectStateOther = 0; // 0 = Try Again, 1 = Overworld
                }
                break;

            case COMBAT_STATE.DEATH:
                deathTimer += dt;
                if (deathTimer > 1.0) {
                    if (myKeys.isUp() || myKeys.isDown()) {
                        selectStateOther = 1 - selectStateOther;
                        Sound.playSound("button", true);
                        myKeys.keydown = [];
                    }
                    if (myKeys.isConfirm()) {
                        myKeys.keydown = [];
                        if (selectStateOther === 0) {
                            deaths++;
                            Player.init();
                            Inventory.init();
                            BossController.reset();
                            init(Cgroup.getBossId());
                            setup(main.ctx);
                        } else {
                            // Return to overworld — boss stays on map!
                            if (typeof Overworld !== "undefined" && Overworld.resetBossTrigger) {
                                Overworld.resetBossTrigger();
                            }
                            Player.init();
                            Inventory.init();
                            BossController.reset();
                            Sound.playSound("flash", true);
                            Transition.start("overworld", function() {
                                main.gameState = main.GAME_STATE.OVERWORLD;
                                Overworld.setup(main.ctx);
                            });
                        }
                    }
                }
                break;

            case COMBAT_STATE.WIN:
                // Mark boss as defeated in overworld ONLY on victory!
                if (typeof Overworld !== "undefined" && Overworld.markBossDefeated) {
                    Overworld.markBossDefeated(victoryType);
                }
                Transition.start(function() {
                    main.gameState = main.GAME_STATE.OVERWORLD;
                    Overworld.setup(main.ctx);
                });
                combatState = -1;
                break;

            case COMBAT_STATE.NAME:
                if (myKeys.isConfirm()) {
                    combatState = menuState;
                    Sound.playSound("button", true);
                }
                if (myKeys.isCancel()) {
                    combatState = COMBAT_STATE.MAIN;
                    Writer.reset();
                    Sound.playSound("button", true);
                }
                if (combatState == COMBAT_STATE.FIGHT) Cattack.setup();
                selectStateEnemy = detectVerticalSelect(Cgroup.getNames(), selectStateEnemy);
                break;
        }

        Sound.update();
        if (combatState != COMBAT_STATE.DEFEND) myKeys.keydown = [];
    }

    function draw(ctx) {
        Cgroup.draw(ctx);
        if (combatState !== COMBAT_STATE.DEATH && combatState !== COMBAT_STATE.WIN && combatState !== -1) {
            drawSpareProgressBar(ctx);
        }

        switch (combatState) {
            case COMBAT_STATE.MAIN:
                ctx.save();
                ctx.globalAlpha = Soul.getOpacity();
                Cbbox.draw(ctx);
                Chp.draw(ctx, Player.getHPCur(), Player.getHPMax());
                Cmenu.draw(ctx, menuState, MENU_STATE);
                Writer.drawText(ctx);
                switch (menuState) {
                    case MENU_STATE.FIGHT: Soul.drawAt(ctx, new Vect(90, 531, 0)); break;
                    case MENU_STATE.ACT: Soul.drawAt(ctx, new Vect(243, 531, 0)); break;
                    case MENU_STATE.ITEM: Soul.drawAt(ctx, new Vect(403, 531, 0)); break;
                    case MENU_STATE.MERCY: Soul.drawAt(ctx, new Vect(558, 531, 0)); break;
                }
                ctx.restore();
                break;

            case COMBAT_STATE.FIGHT:
                Cbbox.draw(ctx);
                Chp.draw(ctx, Player.getHPCur(), Player.getHPMax());
                Cmenu.draw(ctx, 0, MENU_STATE);
                Cattack.draw(ctx);
                break;

            case COMBAT_STATE.ACT:
                Cbbox.draw(ctx);
                Chp.draw(ctx, Player.getHPCur(), Player.getHPMax());
                Cmenu.draw(ctx, 0, MENU_STATE);
                Writer.drawMenu(ctx, Cgroup.getActs(selectStateEnemy), menuState, MENU_STATE);
                Soul.drawAt(ctx, Writer.getSoulPos(selectStateOther, 0));
                break;

            case COMBAT_STATE.ITEM:
                Cbbox.draw(ctx);
                Chp.draw(ctx, Player.getHPCur(), Player.getHPMax());
                Cmenu.draw(ctx, 0, MENU_STATE);
                Writer.drawMenu(ctx, Inventory.getNames(), menuState, MENU_STATE);
                Soul.drawAt(ctx, Writer.getSoulPos(selectStateOther, 0));
                break;

            case COMBAT_STATE.MERCY:
                Cbbox.draw(ctx);
                Chp.draw(ctx, Player.getHPCur(), Player.getHPMax());
                Cmenu.draw(ctx, 0, MENU_STATE);
                Writer.drawMenu(ctx, Cgroup.getMercies(), menuState, MENU_STATE);
                Soul.drawAt(ctx, Writer.getSoulPos(selectStateOther, 1));
                break;

            case COMBAT_STATE.EFFECT:
                Cbbox.draw(ctx);
                Chp.draw(ctx, Player.getHPCur(), Player.getHPMax());
                Cmenu.draw(ctx, 0, MENU_STATE);
                Writer.drawText(ctx);
                break;

            case COMBAT_STATE.RESPOND:
                Cbbox.draw(ctx);
                Chp.draw(ctx, Player.getHPCur(), Player.getHPMax());
                Cmenu.draw(ctx, 0, MENU_STATE);
                Soul.draw(ctx);
                Cbubble.draw(ctx);
                break;

            case COMBAT_STATE.DEFEND:
                Cbbox.draw(ctx);
                Chp.draw(ctx, Player.getHPCur(), Player.getHPMax(), 55);
                // Draw center gravity well for Phase 2 (Singularity only) — Mini supermassive black hole
                var defEnemy = Cgroup.getEnemy(selectStateEnemy);
                if (Cgroup.getBossId() === "singularity" && defEnemy && defEnemy.currentPhase === 1) {
                    ctx.save();
                    var gwTime = defEnemy.timeCounter || 0;
                    var _gwBB = Cbbox.getBound();
                    var gwCX = (_gwBB[0]+_gwBB[2])/2, gwCY = (_gwBB[1]+_gwBB[3])/2;
                    
                    // Outer distortion halo
                    var gwHaloGrad = ctx.createRadialGradient(gwCX, gwCY, 9, gwCX, gwCY, 41);
                    gwHaloGrad.addColorStop(0, "rgba(100, 0, 200, 0.2)");
                    gwHaloGrad.addColorStop(0.5, "rgba(40, 0, 80, 0.08)");
                    gwHaloGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
                    ctx.fillStyle = gwHaloGrad;
                    ctx.beginPath();
                    ctx.arc(gwCX, gwCY, 41, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Mini accretion disk (tilted ellipse)
                    ctx.save();
                    ctx.translate(gwCX, gwCY);
                    ctx.rotate(0.12);
                    ctx.scale(1, 0.3);
                    var gwDiskR = 30 + Math.sin(gwTime * 2.5) * 2;
                    var gwDiskGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, gwDiskR);
                    gwDiskGrad.addColorStop(0, "rgba(255, 255, 255, 0.7)");
                    gwDiskGrad.addColorStop(0.2, "rgba(255, 180, 60, 0.6)");
                    gwDiskGrad.addColorStop(0.5, "rgba(200, 60, 0, 0.35)");
                    gwDiskGrad.addColorStop(0.8, "rgba(80, 0, 120, 0.12)");
                    gwDiskGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
                    ctx.fillStyle = gwDiskGrad;
                    ctx.beginPath();
                    ctx.arc(0, 0, gwDiskR, 0, Math.PI * 2);
                    ctx.fill();
                    // Mini swirling streaks
                    ctx.globalAlpha = 0.35;
                    for (var ms = 0; ms < 4; ms++) {
                        var msOff = gwTime * 2 + ms * Math.PI / 2;
                        ctx.strokeStyle = ms % 2 === 0 ? "rgba(255, 180, 60, 0.4)" : "rgba(180, 80, 255, 0.3)";
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.arc(0, 0, 11 + ms * 4.3, msOff, msOff + Math.PI * 0.5);
                        ctx.stroke();
                    }
                    ctx.globalAlpha = 1;
                    ctx.restore();
                    
                    // Event horizon (pure black core)
                    ctx.fillStyle = "#000000";
                    ctx.beginPath();
                    ctx.arc(gwCX, gwCY, 9, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Photon ring (bright pulsing edge)
                    var gwPhoton = Math.sin(gwTime * 6) * 0.12 + 0.88;
                    ctx.shadowBlur = 9;
                    ctx.shadowColor = "rgba(255, 180, 50, 0.6)";
                    ctx.strokeStyle = "rgba(255, 220, 120, " + gwPhoton.toFixed(2) + ")";
                    ctx.lineWidth = 1.6;
                    ctx.beginPath();
                    ctx.arc(gwCX, gwCY, 9, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                    
                    // Secondary ring
                    ctx.strokeStyle = "rgba(200, 50, 255, 0.3)";
                    ctx.lineWidth = 3.2;
                    ctx.beginPath();
                    ctx.arc(gwCX, gwCY, 13, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Mini orbiting particles
                    for (var mp = 0; mp < 5; mp++) {
                        var mpAngle = gwTime * (2.0 + mp * 0.5) + mp * Math.PI * 2 / 5;
                        var mpR = 15 + mp * 2.2;
                        var mpx = gwCX + Math.cos(mpAngle) * mpR;
                        var mpy = gwCY + Math.sin(mpAngle) * mpR * 0.3;
                        var mpA = (0.5 + Math.sin(gwTime * 4 + mp) * 0.3).toFixed(2);
                        ctx.fillStyle = "rgba(255, 180, 80, " + mpA + ")";
                        ctx.beginPath();
                        ctx.arc(mpx, mpy, 1.1, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    
                    ctx.restore();
                }
                BossController.draw(ctx);
                Soul.draw(ctx);
                
                // Draw Mirror reflection soul if Coloso de Espejos (prism) is active and mirror is enabled!
                if (Cgroup.getBossId() === "prism" && typeof BossController !== "undefined" && BossController.isMirrorActive && BossController.isMirrorActive()) {
                    var mPos = Soul.getMirrorPos();
                    Soul.drawAt(ctx, mPos, 0.5); // semi-translucent mirror reflection!
                }
                break;

            case COMBAT_STATE.DEATH:
                Soul.draw(ctx);
                // Death screen
                ctx.save();
                ctx.font = "32pt Determination Mono";
                ctx.fillStyle = "#F00";
                ctx.textAlign = "center";
                ctx.fillText("YOU DIED", 370, 250);
                
                if (deathTimer > 1.0) {
                    ctx.font = "16pt Determination Mono";
                    ctx.fillStyle = selectStateOther === 0 ? "#FF0" : "#FFF";
                    ctx.fillText("Try Again", 370, 290);
                    ctx.fillStyle = selectStateOther === 1 ? "#FF0" : "#FFF";
                    ctx.fillText("Return to Overworld", 370, 330);
                    // Draw mini soul next to selection
                    ctx.globalAlpha = 1.0;
                    var soulY = selectStateOther === 0 ? 283 : 323;
                    Soul.drawAt(ctx, new Vect(260, soulY, 0));
                }
                ctx.restore();
                break;

            case COMBAT_STATE.NAME:
                Cbbox.draw(ctx);
                Chp.draw(ctx, Player.getHPCur(), Player.getHPMax());
                Cmenu.draw(ctx, menuState, MENU_STATE);
                if (menuState == MENU_STATE.FIGHT) {
                    Writer.drawMenu(ctx, Cgroup.getNames(), menuState, MENU_STATE);
                } else {
                    Writer.drawMenu(ctx, Cgroup.getNames(), 4, MENU_STATE);
                }
                Soul.drawAt(ctx, Writer.getSoulPos(selectStateEnemy, 1));
                break;
        }
    }

    function getSelectStateEnemy() { return selectStateEnemy; }

    function detectHorizontalSelect(options, state) {
        if (myKeys.isLeft()) {
            if (state % 2) { state--; Sound.playSound("button", true); }
        }
        if (myKeys.isRight()) {
            if ((state + 1) % 2 && state < options.length - 1) { state++; Sound.playSound("button", true); }
        }
        if (myKeys.isUp()) {
            if (state > 1) { state -= 2; Sound.playSound("button", true); }
        }
        if (myKeys.isDown()) {
            if (state < options.length - 2) { state += 2; Sound.playSound("button", true); }
        }
        return state;
    }

    function detectVerticalSelect(options, state) {
        if (myKeys.isUp()) {
            if (state > 0) { state--; Sound.playSound("button", true); }
        }
        if (myKeys.isDown()) {
            if (state < options.length - 1) { state++; Sound.playSound("button", true); }
        }
        return state;
    }

    function drawSpareProgressBar(ctx) {
        var em = Cgroup.getEnemy(0);
        if (!em || em.currentPhase > 0) return; // Only in Phase 1

        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "14pt 'Determination Mono', monospace";

        if (em.spareable) {
            // Draw progress bar
            var barWidth = 200;
            var barHeight = 12;
            var x = 370 - barWidth / 2;
            var y = 315;
            
            // Background (dark grey)
            ctx.fillStyle = "#333";
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Border
            ctx.strokeStyle = "#FFF";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x, y, barWidth, barHeight);
            
            // Progress percentage
            var progress = Math.max(0, Math.min(1.0, (em.totalMercyHP - em.mercyHP) / em.totalMercyHP));
            ctx.fillStyle = "#FFD700"; // Gold / Yellow
            ctx.fillRect(x + 1, y + 1, (barWidth - 2) * progress, barHeight - 2);

            // Text label
            ctx.fillStyle = "#FFD700";
            ctx.fillText("SPARE", 370, y - 8);
        } else {
            // Not spareable (Godzilla, Ramiel, Sachiel, Darth Vader)
            ctx.fillStyle = "#888";
            ctx.fillText("SPARE: IMPOSIBLE", 370, 310);
        }
        ctx.restore();
    }

    return {
        init: init, setup: setup, update: update, draw: draw,
        getSelectStateEnemy: getSelectStateEnemy,
    };
}());
