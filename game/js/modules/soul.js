// soul.js — Player soul module with Soul Modes for LUNDERTALE
var spx, spy;

var Soul = (function() {
    var pos;
    var sprite, spriteDmg, spriteOver;
    var speed;
    var colData;
    var floatingTexts = []; // List of active floating text animations
    var shieldParticles = []; // Particles spawned on shield break

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

        // Update shield particles
        for (var i = shieldParticles.length - 1; i >= 0; i--) {
            var p = shieldParticles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.age += dt;
            if (p.age >= p.maxAge) {
                shieldParticles.splice(i, 1);
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
        else if (sClass === 15) ctx.filter = "hue-rotate(200deg) saturate(1.8) brightness(1.1)"; // Subaru Dark Teal
        else if (sClass === 16) ctx.filter = "hue-rotate(50deg) saturate(2.5) brightness(1.4)"; // All Might Gold
        else if (sClass === 17) ctx.filter = "hue-rotate(330deg) saturate(2.5) brightness(1.3)"; // Itadori Cursed Pink
        else if (sClass === 18) ctx.filter = "hue-rotate(45deg) saturate(1.8) brightness(1.5)"; // Nanami Professional Gold
        else if (sClass === 19) ctx.filter = "grayscale(100%) brightness(2.5) contrast(1.5)"; // Sans Bone White
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
            var cx = drawPos.x + sw/2;
            var cy = drawPos.y + sh/2;
            var time = Date.now() / 1000;
            
            // 1. Draw Six Eyes Perception Zone (80px radius glowing sphere)
            ctx.save();
            ctx.strokeStyle = "rgba(0, 229, 255, 0.2)";
            ctx.lineWidth = 1.0;
            
            // Draw outer dotted circle boundary
            ctx.beginPath();
            ctx.setLineDash([4, 4]);
            ctx.arc(cx, cy, 80, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            
            ctx.save();
            // Draw filled gradient area within 80px
            var radGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 80);
            radGrad.addColorStop(0, "rgba(0, 229, 255, 0.08)");
            radGrad.addColorStop(0.5, "rgba(0, 229, 255, 0.03)");
            radGrad.addColorStop(1, "rgba(0, 229, 255, 0)");
            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, 80, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw rotating thin sweep lines inside the zone
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(time * 0.15);
            ctx.strokeStyle = "rgba(0, 229, 255, 0.1)";
            ctx.lineWidth = 0.5;
            for (var r = 0; r < 4; r++) {
                var ra = r * Math.PI / 2;
                ctx.beginPath();
                ctx.moveTo(-75, 0);
                ctx.lineTo(75, 0);
                ctx.stroke();
            }
            ctx.restore();
            ctx.restore();

            // 2. Limitless Infinity Shield (Active when charged: Player.getGojoTurns() >= 3)
            var infCharged = (typeof Player !== "undefined" && Player.getGojoTurns && Player.getGojoTurns() >= 3);
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(-time * 0.6);
            
            if (infCharged) {
                // Charged shield: Hexagonal glowing rotating shield
                ctx.strokeStyle = "rgba(0, 240, 255, 0.9)";
                ctx.fillStyle = "rgba(0, 240, 255, 0.08)";
                ctx.lineWidth = 2.0;
                ctx.shadowBlur = 12;
                ctx.shadowColor = "#00F0FF";
                
                ctx.beginPath();
                var shieldRadius = sw * 1.35 + Math.sin(time * 5.0) * 1.5;
                for (var h = 0; h < 6; h++) {
                    var hAngle = (h * Math.PI / 3);
                    var hx = Math.cos(hAngle) * shieldRadius;
                    var hy = Math.sin(hAngle) * shieldRadius;
                    if (h === 0) ctx.moveTo(hx, hy);
                    else ctx.lineTo(hx, hy);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else {
                // Uncharged/recharging ring: faint dashed circular boundary
                ctx.strokeStyle = "rgba(0, 229, 255, 0.4)";
                ctx.lineWidth = 1.0;
                ctx.setLineDash([3, 2]);
                ctx.beginPath();
                ctx.arc(0, 0, sw * 1.2, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();

            // 3. Six Eyes Iris/Pupil overlay (always active in center of soul, rotates)
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(time * 0.8);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
            ctx.shadowBlur = 4;
            ctx.shadowColor = "#00FFFF";
            ctx.lineWidth = 1.0;
            
            // Faint pupil core
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.stroke();
            
            // Six radiating points (representing the Six Eyes sight rays)
            ctx.strokeStyle = "rgba(0, 255, 255, 0.85)";
            for (var sp = 0; sp < 6; sp++) {
                var sAngle = (sp * Math.PI / 3);
                ctx.beginPath();
                ctx.moveTo(Math.cos(sAngle) * 2.5, Math.sin(sAngle) * 2.5);
                ctx.lineTo(Math.cos(sAngle) * 7.0, Math.sin(sAngle) * 7.0);
                ctx.stroke();
            }
            ctx.restore();
            
            // RCT active healing indicator (pulsing green glow)
            if (typeof Player !== "undefined" && Player.isGojoRctActive && Player.isGojoRctActive()) {
                ctx.save();
                var rctAlpha = 0.2 + Math.sin(time * 6) * 0.15;
                var rctGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, sw * 1.5);
                rctGrad.addColorStop(0, "rgba(0, 255, 136, " + rctAlpha + ")");
                rctGrad.addColorStop(1, "rgba(0, 255, 136, 0)");
                ctx.fillStyle = rctGrad;
                ctx.beginPath();
                ctx.arc(cx, cy, sw * 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        } else if (sClass === 15) { // Subaru — Return By Death (shadow tendrils + revival dots)
            var cx = drawPos.x + sw/2;
            var cy = drawPos.y + sh/2;
            var time = Date.now() / 1000;
            
            // Dark shadow tendrils emanating from the soul
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(time * 0.3);
            ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 6;
            ctx.shadowColor = "rgba(0, 100, 200, 0.6)";
            for (var t = 0; t < 5; t++) {
                var tAngle = (t * Math.PI * 2 / 5);
                var tLen = 10 + Math.sin(time * 2.5 + t) * 4;
                ctx.beginPath();
                ctx.moveTo(Math.cos(tAngle) * 6, Math.sin(tAngle) * 6);
                ctx.quadraticCurveTo(
                    Math.cos(tAngle + 0.3) * (tLen * 0.6),
                    Math.sin(tAngle + 0.3) * (tLen * 0.6),
                    Math.cos(tAngle) * tLen,
                    Math.sin(tAngle) * tLen
                );
                ctx.stroke();
            }
            ctx.restore();
            
            // Revival counter dots below the soul
            if (typeof Player !== "undefined" && Player.getSubaruRevives) {
                var revives = Player.getSubaruRevives();
                var dotY = drawPos.y + sh + 6;
                var dotStartX = cx - (revives - 1) * 4;
                ctx.save();
                for (var d = 0; d < revives; d++) {
                    ctx.fillStyle = "rgba(0, 180, 255, 0.9)";
                    ctx.shadowBlur = 4;
                    ctx.shadowColor = "#00B4FF";
                    ctx.beginPath();
                    ctx.arc(dotStartX + d * 8, dotY, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        } else if (sClass === 16) { // All Might — One For All (power aura + lightning)
            var cx = drawPos.x + sw/2;
            var cy = drawPos.y + sh/2;
            var time = Date.now() / 1000;
            
            // Power aura glow
            ctx.save();
            var auraGrad = ctx.createRadialGradient(cx, cy, 3, cx, cy, sw * 1.8);
            auraGrad.addColorStop(0, "rgba(255, 220, 50, 0.25)");
            auraGrad.addColorStop(0.5, "rgba(255, 180, 0, 0.1)");
            auraGrad.addColorStop(1, "rgba(255, 180, 0, 0)");
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, sw * 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // Lightning bolts (random flickers)
            ctx.save();
            ctx.translate(cx, cy);
            ctx.strokeStyle = "rgba(255, 255, 100, 0.9)";
            ctx.lineWidth = 1.2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#FFE600";
            for (var b = 0; b < 3; b++) {
                var bAngle = (b * Math.PI * 2 / 3) + Math.sin(time * 4.0 + b) * 0.5;
                var bLen = 12 + Math.sin(time * 6.0 + b * 2) * 5;
                ctx.beginPath();
                var bx1 = Math.cos(bAngle) * 5;
                var by1 = Math.sin(bAngle) * 5;
                var bx2 = Math.cos(bAngle + 0.15) * (bLen * 0.5);
                var by2 = Math.sin(bAngle + 0.15) * (bLen * 0.5);
                var bx3 = Math.cos(bAngle - 0.1) * bLen;
                var by3 = Math.sin(bAngle - 0.1) * bLen;
                ctx.moveTo(bx1, by1);
                ctx.lineTo(bx2, by2);
                ctx.lineTo(bx3, by3);
                ctx.stroke();
            }
            ctx.restore();
            
            // HP decay warning glow (redder as HP gets lower)
            if (typeof Player !== "undefined" && Player.getHPCur && Player.getHPMax) {
                var hpRatio = Player.getHPCur() / Player.getHPMax();
                if (hpRatio < 0.5) {
                    ctx.save();
                    var warnAlpha = (1 - hpRatio * 2) * 0.3;
                    ctx.strokeStyle = "rgba(255, 50, 50, " + warnAlpha + ")";
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([2, 3]);
                    ctx.beginPath();
                    ctx.arc(cx, cy, sw * 1.3, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        } else if (sClass === 17) { // Itadori — Cursed Energy Vortex + Blood Piercing
            var cx = drawPos.x + sw/2;
            var cy = drawPos.y + sh/2;
            var time = Date.now() / 1000;
            
            // Cursed energy vortex (rotating pink/black spiral)
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(time * 1.5);
            for (var v = 0; v < 6; v++) {
                var vAngle = (v * Math.PI / 3) + time * 0.8;
                var vLen = 12 + Math.sin(time * 3.0 + v * 1.5) * 5;
                ctx.strokeStyle = v % 2 === 0 ? "rgba(255, 20, 147, 0.8)" : "rgba(30, 0, 50, 0.7)";
                ctx.lineWidth = 1.5;
                ctx.shadowBlur = 6;
                ctx.shadowColor = "#FF1493";
                ctx.beginPath();
                ctx.moveTo(Math.cos(vAngle) * 4, Math.sin(vAngle) * 4);
                ctx.quadraticCurveTo(
                    Math.cos(vAngle + 0.4) * (vLen * 0.6),
                    Math.sin(vAngle + 0.4) * (vLen * 0.6),
                    Math.cos(vAngle) * vLen,
                    Math.sin(vAngle) * vLen
                );
                ctx.stroke();
            }
            ctx.restore();
            
            // Blood piercing veins (pulsing red lines from center)
            ctx.save();
            ctx.translate(cx, cy);
            ctx.strokeStyle = "rgba(180, 0, 0, 0.6)";
            ctx.lineWidth = 0.8;
            for (var bv = 0; bv < 4; bv++) {
                var bvAngle = (bv * Math.PI / 2) + Math.sin(time * 2) * 0.2;
                var bvLen = 8 + Math.sin(time * 4 + bv) * 3;
                ctx.beginPath();
                ctx.moveTo(Math.cos(bvAngle) * 5, Math.sin(bvAngle) * 5);
                ctx.lineTo(Math.cos(bvAngle) * bvLen, Math.sin(bvAngle) * bvLen);
                ctx.stroke();
            }
            ctx.restore();
            
            // RCT active healing indicator (pulsing green-pink glow)
            if (typeof Player !== "undefined" && Player.isGojoRctActive && Player.isGojoRctActive()) {
                ctx.save();
                var rctAlpha = 0.2 + Math.sin(time * 6) * 0.15;
                var rctGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, sw * 1.5);
                rctGrad.addColorStop(0, "rgba(0, 255, 136, " + rctAlpha + ")");
                rctGrad.addColorStop(1, "rgba(255, 105, 180, 0)");
                ctx.fillStyle = rctGrad;
                ctx.beginPath();
                ctx.arc(cx, cy, sw * 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            
        } else if (sClass === 18) { // Nanami — 7:3 Ratio Grid + Overtime
            var cx = drawPos.x + sw/2;
            var cy = drawPos.y + sh/2;
            var time = Date.now() / 1000;
            var isOvertime = (typeof Player !== "undefined" && Player.isNanamiOvertime && Player.isNanamiOvertime());
            
            // 7:3 ratio grid overlay (thin golden crosshair showing weak point detection)
            ctx.save();
            ctx.strokeStyle = isOvertime ? "rgba(255, 200, 50, 0.9)" : "rgba(200, 170, 80, 0.5)";
            ctx.lineWidth = isOvertime ? 1.5 : 0.8;
            ctx.shadowBlur = isOvertime ? 8 : 3;
            ctx.shadowColor = "#FFD700";
            
            // Horizontal ratio line (7:3 split)
            var lineW = 20;
            ctx.beginPath();
            ctx.moveTo(cx - lineW, cy);
            ctx.lineTo(cx + lineW, cy);
            ctx.stroke();
            // Vertical crosshair
            ctx.beginPath();
            ctx.moveTo(cx, cy - lineW);
            ctx.lineTo(cx, cy + lineW);
            ctx.stroke();
            // 7:3 ratio mark (dot at 70% position)
            ctx.fillStyle = "rgba(255, 215, 0, 0.9)";
            ctx.beginPath();
            ctx.arc(cx + lineW * 0.4, cy, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // Tie/collar accent (small tie shape below soul)
            ctx.save();
            ctx.fillStyle = isOvertime ? "rgba(255, 50, 50, 0.9)" : "rgba(100, 100, 120, 0.7)";
            ctx.beginPath();
            ctx.moveTo(cx, drawPos.y + sh + 2);
            ctx.lineTo(cx - 3, drawPos.y + sh + 5);
            ctx.lineTo(cx, drawPos.y + sh + 10);
            ctx.lineTo(cx + 3, drawPos.y + sh + 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            
            // Overtime countdown/status
            if (typeof Player !== "undefined" && Player.getCombatTurnCount) {
                var turns = Player.getCombatTurnCount();
                if (!isOvertime && turns < 12) {
                    ctx.save();
                    ctx.font = "7px monospace";
                    ctx.fillStyle = "rgba(200, 170, 80, 0.6)";
                    ctx.textAlign = "center";
                    ctx.fillText((12 - turns) + "T", cx, drawPos.y - 4);
                    ctx.restore();
                } else if (isOvertime) {
                    // Golden pulsing aura when overtime active
                    ctx.save();
                    var otAlpha = 0.15 + Math.sin(time * 4) * 0.1;
                    var otGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, sw * 2);
                    otGrad.addColorStop(0, "rgba(255, 215, 0, " + otAlpha + ")");
                    otGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
                    ctx.fillStyle = otGrad;
                    ctx.beginPath();
                    ctx.arc(cx, cy, sw * 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
            
        } else if (sClass === 19) { // Sans — Bone Orbit + Blue Eye Flame + Dodge Counter
            var cx = drawPos.x + sw/2;
            var cy = drawPos.y + sh/2;
            var time = Date.now() / 1000;
            
            // Orbiting bone fragments
            ctx.save();
            ctx.translate(cx, cy);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 2.0;
            for (var bn = 0; bn < 4; bn++) {
                var bnAngle = (bn * Math.PI / 2) + time * 1.2;
                var bnDist = 14 + Math.sin(time * 2 + bn) * 2;
                var bnX = Math.cos(bnAngle) * bnDist;
                var bnY = Math.sin(bnAngle) * bnDist;
                ctx.beginPath();
                ctx.moveTo(bnX - 2, bnY);
                ctx.lineTo(bnX + 2, bnY);
                ctx.stroke();
                // Bone end caps
                ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
                ctx.beginPath();
                ctx.arc(bnX - 2, bnY, 1.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(bnX + 2, bnY, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            
            // Blue eye flame (left eye position, flickers)
            ctx.save();
            var eyeX = cx - 3;
            var eyeY = cy - 2;
            var eyeFlicker = Math.sin(time * 8) * 0.3 + 0.7;
            var eyeGrad = ctx.createRadialGradient(eyeX, eyeY, 0, eyeX, eyeY, 6);
            eyeGrad.addColorStop(0, "rgba(0, 200, 255, " + eyeFlicker + ")");
            eyeGrad.addColorStop(0.5, "rgba(0, 100, 255, " + (eyeFlicker * 0.5) + ")");
            eyeGrad.addColorStop(1, "rgba(0, 50, 255, 0)");
            ctx.fillStyle = eyeGrad;
            ctx.beginPath();
            ctx.arc(eyeX, eyeY, 6, 0, Math.PI * 2);
            ctx.fill();
            // Flame trail upward
            ctx.strokeStyle = "rgba(0, 180, 255, " + (eyeFlicker * 0.6) + ")";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(eyeX, eyeY - 2);
            ctx.quadraticCurveTo(eyeX - 2 + Math.sin(time * 6) * 2, eyeY - 8, eyeX + Math.sin(time * 4) * 3, eyeY - 12);
            ctx.stroke();
            ctx.restore();
            
            // Dodge counter (remaining auto-dodges as small white dots)
            if (typeof Player !== "undefined" && Player.getSansAutoDodges) {
                var dodges = Player.getSansAutoDodges();
                var dotY = drawPos.y + sh + 5;
                var maxDots = Math.min(dodges, 15);
                var totalW = maxDots * 3;
                var startX = cx - totalW / 2;
                ctx.save();
                for (var d = 0; d < maxDots; d++) {
                    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
                    ctx.beginPath();
                    ctx.arc(startX + d * 3, dotY, 1, 0, Math.PI * 2);
                    ctx.fill();
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
        var boxCenterX = (bb[0] + bb[2]) / 2;
        var mirrorCenterX = 2 * boxCenterX - mainCenterX;
        return { x: mirrorCenterX - sw / 2, y: pos.y };
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

