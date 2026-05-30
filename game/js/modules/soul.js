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
        else if (sClass === 7) ctx.filter = "hue-rotate(50deg) saturate(3) brightness(1.5)"; // Caffeine
        else if (sClass === 8) ctx.filter = "hue-rotate(200deg) saturate(2.5) contrast(1.2)"; // Magnetic
        else if (sClass === 9) ctx.filter = "hue-rotate(185deg) saturate(1.2) brightness(1.4)"; // Crystal
        else if (sClass === 10) ctx.filter = "hue-rotate(350deg) saturate(2.5) brightness(0.8)"; // Vampire
        else if (sClass === 11) ctx.filter = "hue-rotate(" + ((Date.now() / 4) % 360) + "deg) saturate(2)"; // Chaos (Rainbow)
        else if (sClass === 12) ctx.filter = "grayscale(40%) sepia(80%) brightness(1.1)"; // Divergent zilla (Mahoraga Bronze)
        else if (sClass === 13) ctx.filter = "hue-rotate(290deg) saturate(2.2) brightness(1.2)"; // Eva 01 Purple/Green
        else if (sClass === 14) ctx.filter = "hue-rotate(190deg) saturate(3) brightness(1.6)"; // Gojo Celestial Blue
        else if (sClass === 15) ctx.filter = "hue-rotate(260deg) saturate(0.6) brightness(0.7)"; // Subaru Dark Cursed
        else if (sClass === 16) ctx.filter = "hue-rotate(355deg) saturate(2.5) brightness(1.2)"; // Yuji Crimson
        else if (sClass === 17) ctx.filter = "hue-rotate(55deg) saturate(2.5) brightness(1.8) contrast(1.2)"; // All Might Gold
        else if (sClass === 18) ctx.filter = "hue-rotate(45deg) saturate(2) brightness(1.3)"; // Saitama Yellow
        else if (sClass === 19) ctx.filter = "hue-rotate(35deg) saturate(1.8) brightness(1.2)"; // Luffy Straw-Hat
        else if (sClass === 20) ctx.filter = "hue-rotate(25deg) saturate(3.5) brightness(1.4)"; // Naruto Orange
        else if (sClass === 21) ctx.filter = "hue-rotate(130deg) saturate(1.2) brightness(0.8) contrast(1.4)"; // Tanjiro Dark Checkered
        else if (sClass === 22) ctx.filter = "hue-rotate(145deg) saturate(2.5) brightness(1.3)"; // Deku Emerald
        else if (sClass === 23) ctx.filter = "hue-rotate(110deg) saturate(2.2) brightness(0.8)"; // Zoro Moss
        else if (sClass === 24) ctx.filter = "hue-rotate(195deg) saturate(2.0) brightness(1.5)"; // Rimuru Slime
        else if (sClass === 25) {
            // Sans flashing glowing eye
            if (Math.floor(Date.now() / 150) % 2 === 0) {
                ctx.filter = "hue-rotate(190deg) saturate(3.5) brightness(1.8)";
            } else {
                ctx.filter = "hue-rotate(55deg) saturate(2.5) brightness(1.6)";
            }
        }
        else if (sClass === 26) ctx.filter = "hue-rotate(15deg) saturate(2.8) brightness(1.1)"; // Denji Chainsaw Orange
    }

    function drawDecorations(ctx, drawPos, sw, sh, sClass) {
        if (sClass === 12) { // Divergent zilla (Mahoraga wheel)
            ctx.save();
            ctx.translate(drawPos.x + sw/2, drawPos.y - 8);
            ctx.rotate((Date.now() / 600) % (Math.PI * 2));
            ctx.strokeStyle = "#D2691E"; // Bronze wheel
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
                ctx.fillStyle = "#8B4513";
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
        } else if (sClass === 14) { // Gojo (Limitless Ring)
            ctx.save();
            ctx.strokeStyle = "rgba(0, 229, 255, 0.75)";
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#00E5FF";
            ctx.beginPath();
            ctx.arc(drawPos.x + sw/2, drawPos.y + sh/2, sw * 1.1 + Math.sin(Date.now()/250)*2, 0, Math.PI*2);
            ctx.stroke();
            ctx.restore();
        } else if (sClass === 15) { // Subaru (Shadow Hands)
            ctx.save();
            ctx.strokeStyle = "rgba(75, 0, 130, 0.8)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(drawPos.x - 4, drawPos.y + sh - 2);
            ctx.bezierCurveTo(drawPos.x - 8, drawPos.y + sh/2, drawPos.x - 2, drawPos.y + 2, drawPos.x + 3, drawPos.y - 2);
            ctx.moveTo(drawPos.x + sw + 4, drawPos.y + sh - 2);
            ctx.bezierCurveTo(drawPos.x + sw + 8, drawPos.y + sh/2, drawPos.x + sw + 2, drawPos.y + 2, drawPos.x + sw - 3, drawPos.y - 2);
            ctx.stroke();
            ctx.restore();
        } else if (sClass === 16) { // Yuji Itadori (Crimson / Cursed Sparks)
            ctx.save();
            ctx.strokeStyle = Math.random() < 0.15 ? "#000000" : "#FF0055";
            ctx.shadowBlur = 6;
            ctx.shadowColor = "#FF0055";
            ctx.lineWidth = 1.5;
            for (var sp = 0; sp < 2; sp++) {
                ctx.beginPath();
                var sx = drawPos.x + Math.random() * sw;
                var sy = drawPos.y + Math.random() * sh;
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx + (Math.random()-0.5)*12, sy + (Math.random()-0.5)*12);
                ctx.stroke();
            }
            ctx.restore();
        } else if (sClass === 17) { // All Might Gold Sparkles
            ctx.save();
            ctx.strokeStyle = "#FFD700";
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#FFD700";
            for (var sp = 0; sp < 3; sp++) {
                var sa = (Date.now() / 200) + sp * Math.PI / 1.5;
                var sx = drawPos.x + sw/2 + Math.cos(sa) * 12;
                var sy = drawPos.y + sh/2 + Math.sin(sa) * 12;
                ctx.strokeRect(sx - 1, sy - 1, 2, 2);
            }
            ctx.restore();
        } else if (sClass === 18) { // Saitama (Red Cape trails)
            ctx.save();
            ctx.strokeStyle = "#FF1744";
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(drawPos.x, drawPos.y + 4);
            ctx.lineTo(drawPos.x - 6, drawPos.y + sh/2);
            ctx.moveTo(drawPos.x + sw, drawPos.y + 4);
            ctx.lineTo(drawPos.x + sw + 6, drawPos.y + sh/2);
            ctx.stroke();
            ctx.restore();
        } else if (sClass === 19) { // Luffy (Gear 5 Clouds)
            ctx.save();
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.beginPath();
            ctx.arc(drawPos.x - 3, drawPos.y + sh/2, 3, 0, Math.PI*2);
            ctx.arc(drawPos.x + sw + 3, drawPos.y + sh/2, 3, 0, Math.PI*2);
            ctx.arc(drawPos.x + sw/2, drawPos.y - 3, 2, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
        } else if (sClass === 20) { // Naruto Orange Chakra
            ctx.save();
            ctx.strokeStyle = "#FF9100";
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#FF9100";
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.ellipse(drawPos.x + sw/2, drawPos.y + sh/2, sw * 0.9, sh * 0.9, Math.sin(Date.now()/150)*0.2, 0, Math.PI*2);
            ctx.stroke();
            ctx.restore();
        } else if (sClass === 21) { // Tanjiro Water Trail
            ctx.save();
            ctx.strokeStyle = "#00FFFF";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            var ts = (Date.now() / 300) % (Math.PI * 2);
            ctx.arc(drawPos.x + sw/2, drawPos.y + sh/2, sw * 1.0, ts, ts + Math.PI);
            ctx.stroke();
            ctx.restore();
        } else if (sClass === 22) { // Deku Emerald sparks
            ctx.save();
            ctx.strokeStyle = "#00FF66";
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#00FF66";
            ctx.lineWidth = 1.2;
            for (var sp = 0; sp < 4; sp++) {
                ctx.beginPath();
                var sx = drawPos.x + Math.random() * sw;
                var sy = drawPos.y + Math.random() * sh;
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx + (Math.random()-0.5)*14, sy + (Math.random()-0.5)*14);
                ctx.stroke();
            }
            ctx.restore();
        } else if (sClass === 23) { // Zoro slashes
            ctx.save();
            ctx.strokeStyle = "#2E7D32";
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(drawPos.x - 4, drawPos.y - 2); ctx.lineTo(drawPos.x + sw + 4, drawPos.y + sh + 2);
            ctx.moveTo(drawPos.x - 4, drawPos.y + sh/2 - 2); ctx.lineTo(drawPos.x + sw + 4, drawPos.y + sh/2 + 2);
            ctx.moveTo(drawPos.x - 4, drawPos.y + sh + 2); ctx.lineTo(drawPos.x + sw + 4, drawPos.y - 2);
            ctx.stroke();
            ctx.restore();
        } else if (sClass === 24) { // Rimuru core
            ctx.save();
            ctx.fillStyle = "rgba(0, 229, 255, 0.4)";
            ctx.beginPath();
            ctx.arc(drawPos.x + sw/2, drawPos.y + sh/2 + 2, 4, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
        } else if (sClass === 25) { // Sans Glowing Left Eye
            ctx.save();
            ctx.fillStyle = (Math.floor(Date.now() / 100) % 2 === 0) ? "#00FFFF" : "#FFFF00";
            ctx.shadowBlur = 8;
            ctx.shadowColor = ctx.fillStyle;
            ctx.beginPath();
            ctx.arc(drawPos.x + sw/3, drawPos.y + sh/3, 2, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
        } else if (sClass === 26) { // Denji Chainsaw Spikes
            ctx.save();
            ctx.translate(drawPos.x + sw/2, drawPos.y + sh/2);
            ctx.rotate((Date.now() / 150) % (Math.PI * 2));
            ctx.fillStyle = "#A0A0A0";
            for (var t = 0; t < 8; t++) {
                var tAngle = (t * Math.PI / 4);
                ctx.beginPath();
                ctx.moveTo(Math.cos(tAngle)*9, Math.sin(tAngle)*9);
                ctx.lineTo(Math.cos(tAngle + 0.1)*12, Math.sin(tAngle + 0.1)*12);
                ctx.lineTo(Math.cos(tAngle + 0.2)*9, Math.sin(tAngle + 0.2)*9);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
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
    }

    function drawAt(ctx, posForced) {
        ctx.save();
        ctx.globalAlpha = 1;
        applySoulFilter(ctx);
        var sw = getWidth();
        var sh = getHeight();
        ctx.drawImage(sprite, posForced.x, posForced.y, sw, sh);
        var sClass = Player.getSoulClass();
        drawDecorations(ctx, posForced, sw, sh, sClass);
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
        var baseW = soulWidth;
        if (typeof Player !== "undefined" && Player.isShrunk && Player.isShrunk()) {
            baseW = soulWidth * 0.5;
        } else if (typeof Player !== "undefined" && Player.isGiant && Player.isGiant()) {
            baseW = soulWidth * 1.8;
        } else if (typeof Player !== "undefined" && Player.getSoulClass && Player.getSoulClass() === 23) {
            baseW = soulWidth * 1.25; // Zoro larger hitbox
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
        } else if (typeof Player !== "undefined" && Player.getSoulClass && Player.getSoulClass() === 23) {
            baseH = soulHeight * 1.25; // Zoro larger hitbox
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
    };
}());
