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

    function init(bossId) {
        combatState = COMBAT_STATE.MAIN;
        menuState = MENU_STATE.FIGHT;
        selectStateEnemy = 0;
        selectStateOther = 0;
        gravityDmgTimer = 0;
        Cbbox.setup(574, 140);
        Cgroup.setup(bossId);

        Sound.pauseSoundHard("bgm_overworld");
        if (bossId === "singularity") {
            Sound.playSound("bgm_singularity", true);
            Sound.pauseSoundHard("bgm_seraphina");
        } else {
            Sound.playSound("bgm_seraphina", true);
            Sound.pauseSoundHard("bgm_singularity");
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
                    if (myKeys.keydown[myKeys.KEYBOARD.KEY_RIGHT]) {
                        menuState++;
                        if (menuState > MENU_STATE.MERCY) menuState = MENU_STATE.FIGHT;
                        Sound.playSound("button", true);
                    }
                    if (myKeys.keydown[myKeys.KEYBOARD.KEY_LEFT]) {
                        menuState--;
                        if (menuState < MENU_STATE.FIGHT) menuState = MENU_STATE.MERCY;
                        Sound.playSound("button", true);
                    }
                    if (myKeys.keydown[myKeys.KEYBOARD.KEY_Z]) {
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
                    Cbubble.setup();
                    Writer.reset();
                }
                break;

            case COMBAT_STATE.ACT:
                if (myKeys.keydown[myKeys.KEYBOARD.KEY_X]) {
                    combatState = COMBAT_STATE.NAME;
                    Sound.playSound("button", true);
                }
                if (myKeys.keydown[myKeys.KEYBOARD.KEY_Z]) {
                    Writer.setupText(Cgroup.getRes(selectStateEnemy, selectStateOther));
                    combatState = COMBAT_STATE.EFFECT;
                }
                selectStateOther = detectHorizontalSelect(Cgroup.getActs(selectStateEnemy), selectStateOther);
                break;

            case COMBAT_STATE.ITEM:
                if (myKeys.keydown[myKeys.KEYBOARD.KEY_Z]) {
                    Writer.setupText(Inventory.getText(selectStateOther));
                    Inventory.activate(selectStateOther);
                    Inventory.removeItem(selectStateOther);
                    combatState = COMBAT_STATE.EFFECT;
                }
                if (myKeys.keydown[myKeys.KEYBOARD.KEY_X]) {
                    combatState = COMBAT_STATE.MAIN;
                    Writer.reset();
                    Sound.playSound("button", true);
                }
                selectStateOther = detectHorizontalSelect(Inventory.getNames(), selectStateOther);
                break;

            case COMBAT_STATE.MERCY:
                if (myKeys.keydown[myKeys.KEYBOARD.KEY_X]) {
                    combatState = COMBAT_STATE.MAIN;
                    Writer.reset();
                    Sound.playSound("button", true);
                } else if (myKeys.keydown[myKeys.KEYBOARD.KEY_Z]) {
                    Sound.playSound("button", true);
                    if (selectStateOther === 0) { // Spare
                        var em = Cgroup.getEnemy(0); // target first enemy
                        if (em.mercyHP <= 0) {
                            combatState = COMBAT_STATE.WIN;
                        } else {
                            // Cannot spare
                            Cbubble.setup(em.bubblePos, "* " + em.name + " is not\n  ready to be spared.", em.bubbleOff, 4);
                            combatState = COMBAT_STATE.RESPOND;
                        }
                    } else if (selectStateOther === 1) { // Flee
                        combatState = COMBAT_STATE.WIN;
                    }
                    myKeys.keydown = [];
                }
                selectStateOther = detectVerticalSelect(Cgroup.getMercies(), selectStateOther);
                break;

            case COMBAT_STATE.EFFECT:
                Writer.update(dt);
                if (myKeys.keydown[myKeys.KEYBOARD.KEY_Z]) {
                    combatState = COMBAT_STATE.RESPOND;
                    Cbubble.setup();
                    Writer.setupText(Cgroup.getText());
                    Sound.pauseSound("text");
                }
                break;

            case COMBAT_STATE.RESPOND:
                if (Cbbox.update(dt) && Cbubble.update(dt) && myKeys.keydown[myKeys.KEYBOARD.KEY_Z]) {
                    combatState = COMBAT_STATE.DEFEND;
                    // Start boss attack
                    var enemy = Cgroup.getEnemy(selectStateEnemy);
                    var details = BossController.getAttackDetails(enemy);
                    Cbbox.setSize(details.width, details.height, false);
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
                    var center = new Vect(320, 320, 0); // Center of the Battle Box
                    var dir = center.getSub(soulPos);
                    var dist = dir.getMagnitude();
                    if (dist > 10) {
                        dir = dir.getNorm();
                        var pullStrength = 38.5; // Pixels per second pull
                        soulPos.x += dir.x * pullStrength * dt;
                        soulPos.y += dir.y * pullStrength * dt;
                        Soul.setPos(soulPos.x, soulPos.y);
                    }
                    // Contact damage: 1 HP/sec if directly on the center black hole
                    if (dist < 18) {
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
                    if (myKeys.keydown[myKeys.KEYBOARD.KEY_UP] || myKeys.keydown[myKeys.KEYBOARD.KEY_DOWN]) {
                        selectStateOther = 1 - selectStateOther;
                        Sound.playSound("button", true);
                        myKeys.keydown = [];
                    }
                    if (myKeys.keydown[myKeys.KEYBOARD.KEY_Z]) {
                        myKeys.keydown = [];
                        if (selectStateOther === 0) {
                            deaths++;
                            Player.init();
                            Inventory.init();
                            BossController.reset();
                            init(Cgroup.getBossId());
                            setup(main.ctx);
                        } else {
                            // Return to overworld
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
                Transition.start(function() {
                    main.gameState = main.GAME_STATE.OVERWORLD;
                    Overworld.setup(main.ctx);
                });
                combatState = -1;
                break;

            case COMBAT_STATE.NAME:
                if (myKeys.keydown[myKeys.KEYBOARD.KEY_Z]) {
                    combatState = menuState;
                    Sound.playSound("button", true);
                }
                if (myKeys.keydown[myKeys.KEYBOARD.KEY_X]) {
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

        switch (combatState) {
            case COMBAT_STATE.MAIN:
                ctx.save();
                ctx.globalAlpha = Soul.getOpacity();
                Cbbox.draw(ctx);
                Chp.draw(ctx, Player.getHPCur(), Player.getHPMax());
                Cmenu.draw(ctx, menuState, MENU_STATE);
                Writer.drawText(ctx);
                switch (menuState) {
                    case MENU_STATE.FIGHT: Soul.drawAt(ctx, new Vect(40, 446, 0)); break;
                    case MENU_STATE.ACT: Soul.drawAt(ctx, new Vect(193, 446, 0)); break;
                    case MENU_STATE.ITEM: Soul.drawAt(ctx, new Vect(353, 446, 0)); break;
                    case MENU_STATE.MERCY: Soul.drawAt(ctx, new Vect(508, 446, 0)); break;
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
                // Draw center gravity well for Phase 2 (Singularity only)
                var defEnemy = Cgroup.getEnemy(selectStateEnemy);
                if (Cgroup.getBossId() === "singularity" && defEnemy && defEnemy.currentPhase === 1) {
                    ctx.save();
                    var gwTime = defEnemy.timeCounter || 0;
                    var gwPulse = Math.sin(gwTime * 6) * 3;
                    // Outer glow ring
                    var gwGrad = ctx.createRadialGradient(320, 320, 0, 320, 320, 20 + gwPulse);
                    gwGrad.addColorStop(0, "rgba(0,0,0,1)");
                    gwGrad.addColorStop(0.6, "rgba(80,0,160,0.6)");
                    gwGrad.addColorStop(1, "rgba(0,0,0,0)");
                    ctx.beginPath();
                    ctx.arc(320, 320, 20 + gwPulse, 0, Math.PI * 2);
                    ctx.fillStyle = gwGrad;
                    ctx.fill();
                    // Ring
                    ctx.beginPath();
                    ctx.arc(320, 320, 14, 0, Math.PI * 2);
                    ctx.strokeStyle = "rgba(200,50,255,0.7)";
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                    ctx.restore();
                }
                BossController.draw(ctx);
                Soul.draw(ctx);
                break;

            case COMBAT_STATE.DEATH:
                Soul.draw(ctx);
                // Death screen
                ctx.save();
                ctx.font = "32pt Determination Mono";
                ctx.fillStyle = "#F00";
                ctx.textAlign = "center";
                ctx.fillText("YOU DIED", 320, 200);
                
                if (deathTimer > 1.0) {
                    ctx.font = "16pt Determination Mono";
                    ctx.fillStyle = selectStateOther === 0 ? "#FF0" : "#FFF";
                    ctx.fillText("Try Again", 320, 270);
                    ctx.fillStyle = selectStateOther === 1 ? "#FF0" : "#FFF";
                    ctx.fillText("Return to Overworld", 320, 310);
                    // Draw mini soul next to selection
                    ctx.globalAlpha = 1.0;
                    var soulY = selectStateOther === 0 ? 263 : 303;
                    Soul.drawAt(ctx, new Vect(210, soulY, 0));
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
        if (myKeys.keydown[myKeys.KEYBOARD.KEY_LEFT]) {
            if (state % 2) { state--; Sound.playSound("button", true); }
        }
        if (myKeys.keydown[myKeys.KEYBOARD.KEY_RIGHT]) {
            if ((state + 1) % 2 && state < options.length - 1) { state++; Sound.playSound("button", true); }
        }
        if (myKeys.keydown[myKeys.KEYBOARD.KEY_UP]) {
            if (state > 1) { state -= 2; Sound.playSound("button", true); }
        }
        if (myKeys.keydown[myKeys.KEYBOARD.KEY_DOWN]) {
            if (state < options.length - 2) { state += 2; Sound.playSound("button", true); }
        }
        return state;
    }

    function detectVerticalSelect(options, state) {
        if (myKeys.keydown[myKeys.KEYBOARD.KEY_UP]) {
            if (state > 0) { state--; Sound.playSound("button", true); }
        }
        if (myKeys.keydown[myKeys.KEYBOARD.KEY_DOWN]) {
            if (state < options.length - 1) { state++; Sound.playSound("button", true); }
        }
        return state;
    }

    return {
        init: init, setup: setup, update: update, draw: draw,
        getSelectStateEnemy: getSelectStateEnemy,
    };
}());
