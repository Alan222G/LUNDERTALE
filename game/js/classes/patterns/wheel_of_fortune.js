// wheel_of_fortune.js — Seraphina Phase 2 Exclusive: spinning eye wheels with tracking beams
var WheelOfFortunePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 7;
    this.wheels = [];
    this.beams = [];
    this.battleBox = null;
};
WheelOfFortunePattern.prototype = Object.create(BulletPattern.prototype);

WheelOfFortunePattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.beams = [];
    var cx = (battleBox[0] + battleBox[2]) / 2, cy = (battleBox[1] + battleBox[3]) / 2;
    // Two wheels on opposite sides
    this.wheels = [
        { x: cx - 60, y: cy - 40, rot: 0, speed: 2.5, eyes: 6, radius: 30, beamTimer: 0, beamInterval: 0.8 },
        { x: cx + 60, y: cy + 40, rot: Math.PI, speed: -2.0, eyes: 5, radius: 25, beamTimer: 0.4, beamInterval: 0.9 }
    ];
};

WheelOfFortunePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    var soulPos = Soul.getPos();
    for (var w = 0; w < this.wheels.length; w++) {
        var wheel = this.wheels[w];
        wheel.rot += wheel.speed * dt;
        wheel.beamTimer += dt;
        if (wheel.beamTimer >= wheel.beamInterval && this.elapsed < this.duration - 1.5) {
            wheel.beamTimer = 0;
            // Fire tracking beam from one eye
            var eyeAngle = wheel.rot;
            var ex = wheel.x + Math.cos(eyeAngle) * wheel.radius;
            var ey = wheel.y + Math.sin(eyeAngle) * wheel.radius;
            var dx = soulPos.x - ex, dy = soulPos.y - ey;
            var dist = Math.sqrt(dx * dx + dy * dy);
            var bAngle = Math.atan2(dy, dx);
            this.beams.push({
                x: ex, y: ey, angle: bAngle,
                length: 0, maxLength: 350, speed: 700,
                thickness: 6, life: 1.2, maxLife: 1.2, growing: true
            });
        }
    }
    // Update beams
    for (var i = this.beams.length - 1; i >= 0; i--) {
        var b = this.beams[i];
        if (b.growing) {
            b.length += b.speed * dt;
            if (b.length >= b.maxLength) b.growing = false;
        }
        b.life -= dt;
        if (b.life <= 0) this.beams.splice(i, 1);
    }
};

WheelOfFortunePattern.prototype.draw = function(ctx) {
    ctx.save();
    // Draw wheels
    for (var w = 0; w < this.wheels.length; w++) {
        var wheel = this.wheels[w];
        ctx.save();
        ctx.translate(wheel.x, wheel.y);
        // Outer ring
        ctx.shadowBlur = 12;
        ctx.shadowColor = "rgba(255, 200, 0, 0.5)";
        ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, wheel.radius, 0, Math.PI * 2); ctx.stroke();
        // Inner ring
        ctx.strokeStyle = "rgba(255, 240, 150, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, wheel.radius * 0.6, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;
        // Eyes
        for (var e = 0; e < wheel.eyes; e++) {
            var eAngle = wheel.rot + (e / wheel.eyes) * Math.PI * 2;
            var ex = Math.cos(eAngle) * wheel.radius;
            var ey = Math.sin(eAngle) * wheel.radius;
            // Eye glow
            var eGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 6);
            eGrad.addColorStop(0, "rgba(255, 255, 200, 0.9)");
            eGrad.addColorStop(0.4, "rgba(255, 200, 50, 0.7)");
            eGrad.addColorStop(1, "rgba(255, 150, 0, 0)");
            ctx.fillStyle = eGrad;
            ctx.beginPath(); ctx.arc(ex, ey, 6, 0, Math.PI * 2); ctx.fill();
            // Pupil
            ctx.fillStyle = "rgba(100, 50, 0, 0.8)";
            ctx.beginPath(); ctx.arc(ex, ey, 2, 0, Math.PI * 2); ctx.fill();
        }
        // Spokes
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = "rgba(255, 220, 100, 0.5)";
        ctx.lineWidth = 1;
        for (var s = 0; s < wheel.eyes; s++) {
            var sAngle = wheel.rot + (s / wheel.eyes) * Math.PI * 2;
            ctx.beginPath(); ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(sAngle) * wheel.radius, Math.sin(sAngle) * wheel.radius); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    }
    // Draw beams
    for (var i = 0; i < this.beams.length; i++) {
        var b = this.beams[i];
        var bAlpha = Math.min(1, b.life / b.maxLife * 2).toFixed(2);
        var endX = b.x + Math.cos(b.angle) * b.length;
        var endY = b.y + Math.sin(b.angle) * b.length;
        // Beam glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(255, 200, 0, 0.5)";
        ctx.strokeStyle = "rgba(255, 200, 50, " + (bAlpha * 0.5).toFixed(2) + ")";
        ctx.lineWidth = b.thickness * 2;
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(endX, endY); ctx.stroke();
        // Core
        ctx.strokeStyle = "rgba(255, 240, 150, " + bAlpha + ")";
        ctx.lineWidth = b.thickness;
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(endX, endY); ctx.stroke();
        // Bright center
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255, 255, 230, " + (bAlpha * 0.8).toFixed(2) + ")";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(endX, endY); ctx.stroke();
    }
    ctx.restore();
};

WheelOfFortunePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2, cy = sy + sh / 2;
    for (var i = 0; i < this.beams.length; i++) {
        var b = this.beams[i];
        // Point to line segment distance
        var endX = b.x + Math.cos(b.angle) * b.length;
        var endY = b.y + Math.sin(b.angle) * b.length;
        var dx = endX - b.x, dy = endY - b.y;
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1) continue;
        var t = Math.max(0, Math.min(1, ((cx - b.x) * dx + (cy - b.y) * dy) / (len * len)));
        var px = b.x + t * dx, py = b.y + t * dy;
        var dist = Math.sqrt((cx - px) * (cx - px) + (cy - py) * (cy - py));
        if (dist < b.thickness + sw / 2) return this.damVal;
    }
    return 0;
};

WheelOfFortunePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.beams.length === 0;
};
