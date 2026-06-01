// soul.js — Player soul module with Soul Modes for LUNDERTALE
var spx, spy;

var Soul = (function() {
    var pos;
    var sprite, spriteDmg, spriteOver;
    var speed;
    var colData;
    var floatingTexts = []; // List of active floating text animations

    // Soul mode system
    var soulMode;
    var SOUL_MODE = Object.freeze({
        RED: 0,       // Normal free movement
        BLUE: 1,      // Gravity mode (platformer)
        YELLOW: 2,    // Can shoot projectiles
        INVERSE: 3,   // Inverted controls
    });

    // Blue mode physics
    var blueVelY = 0;
    var GRAVITY = 600;
    var JUMP_FORCE = -280;
    var onGround = false;

    // State
    var state;
    var STATE = Object.freeze({
        OKAY: 0,
        DAMAGED: 1,
        FLASH: 2,
        TRANSITION: 3,
        FADEIN: 4,
    });

    var duration, durationCounter;
    var soulWidth = 16, soulHeight = 16;

    function init() {
        sprite = document.getElementById("heart");
        spriteDmg = document.getElementById("heart_dmg");
        spriteOver = document.getElementById("heart_over");
        if (sprite) {
            soulWidth = sprite.width;
            soulHeight = sprite.height;
        }
    }

    function setup(_pos) {
        pos = _pos;
        state = STATE.FLASH;
        durationCounter = 0;
        duration = 0.4;
        speed = 150;
        soulMode = SOUL_MODE.RED;
        blueVelY = 0;
        floatingTexts = [];
        Sound.playSound("flash", true);
        Sound.playSound("bgm", true);
    }

    function reset() {
        pos = new Vect(310, 309, 0);
        state = STATE.OKAY;
        floatingTexts = [];
    }

    function setSoulMode(mode) {
        soulMode = mode;
        if (mode === SOUL_MODE.BLUE) {
            blueVelY = 0;
            onGround = false;
        }
    }

    function getSoulMode() { return soulMode; }

    function update(dt) {
        // Update floating texts
        for (var i = floatingTexts.length - 1; i >= 0; i--) {
            floatingTexts[i].y -= 45 * dt; // Rise
            floatingTexts[i].age += dt;
            if (floatingTexts[i].age >= floatingTexts[i].maxAge) {
                floatingTexts.splice(i, 1);
            }
        }

        switch (state) {
            case STATE.DAMAGED:
                durationCounter += dt;
                if (durationCounter > duration) {
                    state = STATE.OKAY;
                }
                break;
            case STATE.FLASH:
                durationCounter += dt;
                if (durationCounter > duration) {
                    durationCounter = 0;
                    duration = 2;
                    state = STATE.TRANSITION;
                }
                break;
            case STATE.TRANSITION:
                durationCounter += dt;
                pos.add(pos.getSub(new Vect(40, 446, 0)).getNorm().getMult(-400 * dt));
                if (pos.x < 40) {
                    pos = new Vect(310, 309, 0);
                    durationCounter = 0;
                    duration = 0.5;
                    state = STATE.FADEIN;
                    return true;
                }
                break;
            case STATE.FADEIN:
                durationCounter += dt;
                if (durationCounter > duration) {
                    state = STATE.OKAY;
                }
                return true;
        }

        // Slow mode with X key
        var spdMult = Player.getBuffSpd ? Player.getBuffSpd() : 1.0;
        if (myKeys.isCancel()) speed = 65 * spdMult;
        else speed = 130 * spdMult;

        return false;
    }

    function getOpacity() {
        if (state === STATE.OKAY || state === STATE.DAMAGED) return 1.0;
        if (state === STATE.FADEIN) return Math.min(1.0, durationCounter * 4);
        return durationCounter * 4;
    }

    function applySoulFilter(ctx) {
        if (!Player || !Player.getSoulClass) return;
        var sClass = Player.getSoulClass();
        if (sClass === 1) ctx.filter = "hue-rotate(120deg) saturate(1.5)"; // Green
        else if (sClass === 2) ctx.filter = "hue-rotate(60deg) saturate(2)"; // Yellow
        else if (sClass === 3) ctx.filter = "hue-rotate(270deg)"; // Purple
        else if (sClass === 4) ctx.filter = "hue-rotate(210deg) saturate(1.2)"; // Blue
        else if (sClass === 5) ctx.filter = "hue-rotate(30deg) saturate(1.5)"; // Orange
        else if (sClass === 6) ctx.filter = "hue-rotate(180deg) saturate(1.5)"; // Cyan
        else if (sClass === 7) ctx.filter = "hue-rotate(50deg) saturate(3) brightness(1.5)"; // Caffeine
        else if (sClass === 8) ctx.filter = "hue-rotate(200deg) saturate(2.5) contrast(1.2)"; // Magnetic
        else if (sClass === 9) ctx.filter = "hue-rotate(185deg) saturate(1.2) brightness(1.4)"; // Crystal
        else if (sClass === 10) ctx.filter = "hue-rotate(350deg) saturate(2.5) brightness(0.8)"; // Vampire
        else if (sClass === 11) ctx.filter = "hue-rotate(" + ((Date.now() / 4) % 360) + "deg) saturate(2)"; // Chaos (Rainbow)
        else if (sClass === 12) ctx.filter = "grayscale(100%) brightness(2.0)"; // Divergent zilla (Mahoraga White)
        else if (sClass === 13) ctx.filter = "hue-rotate(290deg) saturate(2.2) brightness(1.2)"; // Eva 01 Purple/Green
        else if (sClass === 14) ctx.filter = "hue-rotate(190deg) saturate(3) brightness(1.6)"; // Gojo Celestial Blue
    }

    function drawDecorations(ctx, drawPos, sw, sh, sClass) {
        if (sClass === 12) { // Divergent zilla (Mahoraga wheel)
            ctx.save();
            ctx.translate(drawPos.x + sw/2, drawPos.y - 8);
            
            var isSpinning = (typeof Player !== "undefined" && Player.getMahoragaWheelSpinTimer && Player.getMahoragaWheelSpinTimer() > 0);
            var spinSpeed = isSpinning ? 40 : 600; // Super fast spin on adaptation hit!
            ctx.rotate((Date.now() / spinSpeed) % (Math.PI * 2));
            
            if (isSpinning) {
                ctx.shadowBlur = 12;
                ctx.shadowColor = "#FFD700";
            }
            
            ctx.strokeStyle = "#DAA520"; // Golden wheel
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.stroke();
            for (var sp = 0; sp < 8; sp++) {
                var sAngle = (sp * Math.PI / 4);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(sAngle)*9, Math.sin(sAngle)*9);
                ctx.stroke();
                ctx.fillStyle = "#FFD700"; // Gold spokes/knobs
                ctx.fillRect(Math.cos(sAngle)*9 - 1, Math.sin(sAngle)*9 - 1, 2.5, 2.5);
            }
            ctx.restore();
        } else if (sClass === 13) { // Eva 01 Aura
            ctx.save();
            ctx.strokeStyle = "rgba(0, 255, 100, 0.6)";
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#00FF66";
            ctx.beginPath();
            ctx.ellipse(drawPos.x + sw/2, drawPos.y + sh/2, sw * 0.9, sh * 0.9, 0, 0, Math.PI * 2);
            ctx.stroke();
            if (Player && Player.getHPCur() < Player.getHPMax() * 0.3) {
                ctx.strokeStyle = "#FF0000";
                ctx.shadowColor = "#FF0000";
                ctx.lineWidth = 1.0;
                for (var sp = 0; sp < 3; sp++) {
                    ctx.beginPath();
                    var sx = drawPos.x + Math.random() * sw;
                    var sy = drawPos.y + Math.random() * sh;
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(sx + (Math.random()-0.5)*10, sy + (Math.random()-0.5)*10);
                    ctx.stroke();
                }
            }
            ctx.restore();
        } else if (sClass === 14) { // Gojo (Limitless Ring + Six Eyes)
            // 1. Limitless barrier ring (pulses and glows extra thick if charged/active)
            ctx.save();
            var infCharged = (typeof Player !== "undefined" && Player.getGojoTurns && Player.getGojoTurns() >= 4);
            ctx.strokeStyle = infCharged ? "rgba(0, 229, 255, 0.95)" : "rgba(0, 229, 255, 0.45)";
            ctx.lineWidth = infCharged ? 3.0 : 1.5;
            ctx.shadowBlur = infCharged ? 18 : 8;
            ctx.shadowColor = "#00E5FF";
            ctx.beginPath();
            ctx.arc(drawPos.x + sw/2, drawPos.y + sh/2, sw * 1.1 + Math.sin(Date.now()/250)*2, 0, Math.PI*2);
            ctx.stroke();
            ctx.restore();
            
            // 2. Six Eyes pupil/radial lines (active when Cancel / X is held down)
            if (typeof myKeys !== "undefined" && myKeys.isCancel()) {
                ctx.save();
                ctx.translate(drawPos.x + sw/2, drawPos.y + sh/2);
                ctx.rotate((Date.now() / 400) % (Math.PI * 2));
                ctx.strokeStyle = "rgba(0, 255, 255, 0.85)";
                ctx.lineWidth = 1.0;
                ctx.shadowBlur = 6;
                ctx.shadowColor = "#00FFFF";
                
                // Iris ring
                ctx.beginPath();
                ctx.arc(0, 0, sw * 0.45, 0, Math.PI * 2);
                ctx.stroke();
                
                // 6 spokes
                for (var sp = 0; sp < 6; sp++) {
                    var sAngle = (sp * Math.PI / 3);
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(sAngle) * (sw * 0.2), Math.sin(sAngle) * (sw * 0.2));
                    ctx.lineTo(Math.cos(sAngle) * (sw * 0.75), Math.sin(sAngle) * (sw * 0.75));
                    ctx.stroke();
                }
                ctx.restore();
            }
        }
    }

    function draw(ctx) {
        ctx.save();
        applySoulFilter(ctx);
        var sw = getWidth();
        var sh = getHeight();
        switch (state) {
            case STATE.OKAY:
                ctx.drawImage(sprite, pos.x, pos.y, sw, sh);
                break;
            case STATE.DAMAGED:
                if (Math.floor(durationCounter * 5) % 2) {
                    ctx.drawImage(spriteDmg, pos.x, pos.y, sw, sh);
                } else {
                    ctx.drawImage(sprite, pos.x, pos.y, sw, sh);
                }
                break;
            case STATE.FLASH:
                if (Math.floor(durationCounter * 50) % 5 > 2) break;
                // Fall through
            case STATE.TRANSITION:
                ctx.drawImage(spriteOver, pos.x, pos.y, sw, sh);
                break;
        }

        // Draw soul mode indicator (colored border)
        if (state === STATE.OKAY || state === STATE.DAMAGED) {
            if (soulMode === SOUL_MODE.BLUE) {
                ctx.strokeStyle = "#00F";
                ctx.lineWidth = 1;
                ctx.strokeRect(pos.x - 1, pos.y - 1, sw + 2, sh + 2);
            } else if (soulMode === SOUL_MODE.YELLOW) {
                ctx.strokeStyle = "#FF0";
                ctx.lineWidth = 1;
                ctx.strokeRect(pos.x - 1, pos.y - 1, sw + 2, sh + 2);
            } else if (soulMode === SOUL_MODE.INVERSE) {
                ctx.strokeStyle = "#F0F";
                ctx.lineWidth = 1;
                ctx.strokeRect(pos.x - 1, pos.y - 1, sw + 2, sh + 2);
            }
        }
        
        var sClass = Player.getSoulClass();
        drawDecorations(ctx, pos, sw, sh, sClass);
        ctx.restore();

        // Draw floating texts (independent of filter/decorations)
        for (var i = 0; i < floatingTexts.length; i++) {
            var ft = floatingTexts[i];
            var alpha = 1.0 - (ft.age / ft.maxAge);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = ft.color || "#FFD700"; // Default gold
            ctx.shadowBlur = 6;
            ctx.shadowColor = "#000000";
            ctx.font = "14pt 'Determination Mono', monospace";
            ctx.textAlign = "center";
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }
    }

    function drawAt(ctx, posForced, opacity) {
        ctx.save();
        ctx.globalAlpha = (opacity !== undefined) ? opacity : 1.0;
        applySoulFilter(ctx);
        var sw = getWidth();
        var sh = getHeight();
        ctx.drawImage(sprite, posForced.x, posForced.y, sw, sh);
        var sClass = Player.getSoulClass();
        drawDecorations(ctx, posForced, sw, sh, sClass);
        ctx.restore();
    }

    function getCollision(ctx) {
        // Disabled: replaced by BossController.update() collision checks.
    }

    function takeDamage() {
        if (state === STATE.OKAY) {
            durationCounter = 0;
            duration = 1.5;
            state = STATE.DAMAGED;
            triggerShake(4, 200);
            return true;
        }
        return false;
    }

    function checkCollision(ctx) {
        // Disabled: replaced by BossController.update() collision checks.
    }

    // Move based on soul mode
    function move(dt) {
        if (typeof Player !== "undefined" && Player.isGravityAnchor && Player.isGravityAnchor()) {
            var bb = Cbbox.getBound();
            pos.x = (bb[0] + bb[2]) / 2 - getWidth() / 2;
            pos.y = (bb[1] + bb[3]) / 2 - getHeight() / 2;
            spx = pos.x;
            spy = pos.y;
            return;
        }
        switch (soulMode) {
            case SOUL_MODE.RED:
                moveNormal(dt);
                break;
            case SOUL_MODE.BLUE:
                moveBlue(dt);
                break;
            case SOUL_MODE.YELLOW:
                moveNormal(dt);
                break;
            case SOUL_MODE.INVERSE:
                moveInverse(dt);
                break;
        }
        spx = pos.x;
        spy = pos.y;
    }

    function moveNormal(dt) {
        var noHoriz = (typeof Player !== "undefined" && Player.isNoHorizontalMovement && Player.isNoHorizontalMovement());
        if (myKeys.isUp()) pos.y -= speed * dt;
        if (myKeys.isRight() && !noHoriz) pos.x += speed * dt;
        if (myKeys.isDown()) pos.y += speed * dt;
        if (myKeys.isLeft() && !noHoriz) pos.x -= speed * dt;
    }

    function moveBlue(dt) {
        var noHoriz = (typeof Player !== "undefined" && Player.isNoHorizontalMovement && Player.isNoHorizontalMovement());
        if (myKeys.isRight() && !noHoriz) pos.x += speed * dt;
        if (myKeys.isLeft() && !noHoriz) pos.x -= speed * dt;
        blueVelY += GRAVITY * dt;
        pos.y += blueVelY * dt;
        if (myKeys.isUp() && onGround) {
            blueVelY = JUMP_FORCE;
            onGround = false;
        }
    }

    function moveInverse(dt) {
        var noHoriz = (typeof Player !== "undefined" && Player.isNoHorizontalMovement && Player.isNoHorizontalMovement());
        if (myKeys.isDown()) pos.y -= speed * dt;
        if (myKeys.isLeft() && !noHoriz) pos.x += speed * dt;
        if (myKeys.isUp()) pos.y += speed * dt;
        if (myKeys.isRight() && !noHoriz) pos.x -= speed * dt;
    }

    function limit(bound) {
        var sw = getWidth();
        var sh = getHeight();
        if (pos.x < bound[0]) pos.x = bound[0];
        if (pos.y < bound[1]) pos.y = bound[1];
        if (pos.x + sw > bound[2]) pos.x = bound[2] - sw;
        if (pos.y + sh > bound[3]) {
            pos.y = bound[3] - sh;
            if (soulMode === SOUL_MODE.BLUE) {
                blueVelY = 0;
                onGround = true;
            }
        }
    }

    function getPos() { return pos; }
    function setPos(x, y) { pos.x = x; pos.y = y; }
    function getWidth() {
        var baseW = soulWidth;
        if (typeof Player !== "undefined" && Player.isShrunk && Player.isShrunk()) {
            baseW = soulWidth * 0.5;
        } else if (typeof Player !== "undefined" && Player.isGiant && Player.isGiant()) {
            baseW = soulWidth * 1.8;
        }
        var scale = (typeof Player !== "undefined" && Player.getHitboxScaleMultiplier) ? Player.getHitboxScaleMultiplier() : 1.0;
        return baseW * scale;
    }
    function getHeight() {
        var baseH = soulHeight;
        if (typeof Player !== "undefined" && Player.isShrunk && Player.isShrunk()) {
            baseH = soulHeight * 0.5;
        } else if (typeof Player !== "undefined" && Player.isGiant && Player.isGiant()) {
            baseH = soulHeight * 1.8;
        }
        var scale = (typeof Player !== "undefined" && Player.getHitboxScaleMultiplier) ? Player.getHitboxScaleMultiplier() : 1.0;
        return baseH * scale;
    }
    function getMirrorPos() {
        if (typeof Cbbox === "undefined" || !pos) return { x: 0, y: 0 };
        var bb = Cbbox.getBound();
        var sw = getWidth();
        var sh = getHeight();
        var mainCenterX = pos.x + sw / 2;
        var mainCenterY = pos.y + sh / 2;
        var boxCenterX = (bb[0] + bb[2]) / 2;
        var mirrorCenterX = 2 * boxCenterX - mainCenterX;
        return { x: mirrorCenterX, y: mainCenterY };
    }
    function getState() { return state; }
    function isOkay() { return state === STATE.OKAY; }

    function addFloatingText(text, x, y, color) {
        floatingTexts.push({
            text: text,
            x: x,
            y: y,
            age: 0,
            maxAge: 1.2,
            color: color
        });
    }

    return {
        init: init, setup: setup, reset: reset,
        setSoulMode: setSoulMode, getSoulMode: getSoulMode,
        SOUL_MODE: SOUL_MODE,
        update: update, getOpacity: getOpacity,
        draw: draw, drawAt: drawAt,
        getCollision: getCollision, checkCollision: checkCollision,
        move: move, limit: limit,
        getPos: getPos, setPos: setPos, getWidth: getWidth, getHeight: getHeight,
        getState: getState, isOkay: isOkay, takeDamage: takeDamage,
        dualActive: false, getMirrorPos: getMirrorPos,
        addFloatingText: addFloatingText
    };
}());

