// soul.js — Player soul module with Soul Modes for LUNDERTALE
var spx, spy;

var Soul = (function() {
    var pos;
    var sprite, spriteDmg, spriteOver;
    var speed;
    var colData;

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
        Sound.playSound("flash", true);
        Sound.playSound("bgm", true);
    }

    function reset() {
        pos = new Vect(310, 309, 0);
        state = STATE.OKAY;
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
        else if (sClass === 7) ctx.filter = "hue-rotate(300deg) saturate(1.5)"; // Pink
        else if (sClass === 8) ctx.filter = "hue-rotate(285deg) saturate(0.8)"; // Dark Purple
        else if (sClass === 9) ctx.filter = "grayscale(100%) brightness(1.5)"; // White
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
        ctx.restore();
    }

    function drawAt(ctx, posForced) {
        ctx.save();
        ctx.globalAlpha = 1;
        applySoulFilter(ctx);
        ctx.drawImage(sprite, posForced.x, posForced.y, getWidth(), getHeight());
        ctx.restore();
    }

    function getCollision(ctx) {
        // Disabled: getImageData crashes on file:// protocol in Chrome.
        // New engine uses AABB collision in BossController.
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
        if (typeof Player !== "undefined" && Player.isShrunk && Player.isShrunk()) {
            return soulWidth * 0.5;
        }
        if (typeof Player !== "undefined" && Player.isGiant && Player.isGiant()) {
            return soulWidth * 1.8;
        }
        return soulWidth;
    }
    function getHeight() {
        if (typeof Player !== "undefined" && Player.isShrunk && Player.isShrunk()) {
            return soulHeight * 0.5;
        }
        if (typeof Player !== "undefined" && Player.isGiant && Player.isGiant()) {
            return soulHeight * 1.8;
        }
        return soulHeight;
    }
    function getState() { return state; }
    function isOkay() { return state === STATE.OKAY; }

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
    };
}());
