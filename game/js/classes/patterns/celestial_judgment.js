// celestial_judgment.js — Seraphina Phase 3 Exclusive: divine hammer falls from sky with shockwave
var CelestialJudgmentPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 10;
    this.hammers = [];
    this.shockwaves = [];
    this.hammerTimer = 0;
    this.hammerInterval = 1.8;
    this.battleBox = null;
};
CelestialJudgmentPattern.prototype = Object.create(BulletPattern.prototype);

CelestialJudgmentPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.hammers = [];
    this.shockwaves = [];
    this.hammerTimer = 1.0;
};

CelestialJudgmentPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    var bb = this.battleBox;
    this.hammerTimer += dt;
    if (this.hammerTimer >= this.hammerInterval && this.elapsed < this.duration - 2) {
        this.hammerTimer = 0;
        var soulPos = Soul.getPos();
        this.hammers.push({
            targetX: soulPos.x + (Math.random() - 0.5) * 40,
            targetY: soulPos.y + (Math.random() - 0.5) * 40,
            y: bb[1] - 80, // start above
            fallSpeed: 300, warnTimer: 0, warnDuration: 0.8,
            falling: false, landed: false, width: 30, height: 50
        });
    }
    // Update hammers
    for (var i = this.hammers.length - 1; i >= 0; i--) {
        var h = this.hammers[i];
        if (!h.falling) {
            h.warnTimer += dt;
            if (h.warnTimer >= h.warnDuration) h.falling = true;
        } else if (!h.landed) {
            h.y += h.fallSpeed * dt;
            h.fallSpeed += 800 * dt; // Accelerate
            if (h.y >= h.targetY) {
                h.landed = true;
                h.y = h.targetY;
                // Create shockwave
                this.shockwaves.push({
                    x: h.targetX, y: h.targetY,
                    radius: 10, maxRadius: 140, speed: 180,
                    thickness: 12, life: 1.0
                });
            }
        } else {
            h.warnTimer += dt; // reuse for fade
            if (h.warnTimer > h.warnDuration + 1.0) this.hammers.splice(i, 1);
        }
    }
    // Update shockwaves
    for (var i = this.shockwaves.length - 1; i >= 0; i--) {
        var s = this.shockwaves[i];
        s.radius += s.speed * dt;
        s.life -= dt;
        if (s.radius > s.maxRadius || s.life <= 0) this.shockwaves.splice(i, 1);
    }
};

CelestialJudgmentPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = this.battleBox;
    // Draw warning zones
    for (var i = 0; i < this.hammers.length; i++) {
        var h = this.hammers[i];
        if (!h.falling && !h.landed) {
            var wProg = h.warnTimer / h.warnDuration;
            var pulse = Math.sin(this.elapsed * 15) * 0.15;
            // Target zone
            ctx.fillStyle = "rgba(255, 50, 0, " + (wProg * 0.3 + pulse).toFixed(2) + ")";
            ctx.beginPath(); ctx.arc(h.targetX, h.targetY, 25, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = "rgba(255, 100, 0, " + (wProg * 0.6).toFixed(2) + ")";
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(h.targetX, h.targetY, 25, 0, Math.PI * 2); ctx.stroke();
            // Descending light pillar
            ctx.globalAlpha = wProg * 0.3;
            ctx.fillStyle = "rgba(255, 220, 100, 0.3)";
            ctx.fillRect(h.targetX - 8, bb[1] - 20, 16, h.targetY - bb[1] + 20);
            ctx.globalAlpha = 1;
        }
        if (h.falling && !h.landed) {
            // Falling hammer
            ctx.save();
            ctx.translate(h.targetX, h.y);
            ctx.shadowBlur = 20;
            ctx.shadowColor = "rgba(255, 200, 0, 0.8)";
            // Hammer head
            var hGrad = ctx.createLinearGradient(-15, -20, 15, 20);
            hGrad.addColorStop(0, "rgba(255, 240, 150, 0.95)");
            hGrad.addColorStop(0.5, "rgba(255, 200, 50, 0.9)");
            hGrad.addColorStop(1, "rgba(200, 150, 0, 0.85)");
            ctx.fillStyle = hGrad;
            ctx.fillRect(-15, -10, 30, 20);
            // Handle
            ctx.fillStyle = "rgba(180, 140, 60, 0.9)";
            ctx.fillRect(-4, -50, 8, 45);
            // Cross detail
            ctx.strokeStyle = "rgba(255, 255, 200, 0.6)";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.restore();
        }
        if (h.landed) {
            // Embedded hammer (fading)
            var fadeAlpha = Math.max(0, 1 - (h.warnTimer - h.warnDuration));
            ctx.globalAlpha = fadeAlpha;
            ctx.save();
            ctx.translate(h.targetX, h.targetY);
            ctx.fillStyle = "rgba(255, 200, 50, 0.6)";
            ctx.fillRect(-12, -8, 24, 16);
            ctx.fillStyle = "rgba(180, 140, 60, 0.5)";
            ctx.fillRect(-3, -35, 6, 30);
            ctx.restore();
            ctx.globalAlpha = 1;
        }
    }
    // Draw shockwaves
    for (var i = 0; i < this.shockwaves.length; i++) {
        var s = this.shockwaves[i];
        var sAlpha = Math.max(0, s.life).toFixed(2);
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(255, 180, 0, 0.4)";
        ctx.strokeStyle = "rgba(255, 200, 50, " + (sAlpha * 0.6).toFixed(2) + ")";
        ctx.lineWidth = s.thickness * s.life;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255, 255, 200, " + (sAlpha * 0.4).toFixed(2) + ")";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
};

CelestialJudgmentPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2, cy = sy + sh / 2;
    // Hammer impact zone
    for (var i = 0; i < this.hammers.length; i++) {
        var h = this.hammers[i];
        if (h.falling && !h.landed) {
            var dx = cx - h.targetX, dy = cy - h.y;
            if (Math.abs(dx) < 18 + sw / 2 && Math.abs(dy) < 28 + sh / 2) return this.damVal;
        }
    }
    // Shockwave collision
    for (var i = 0; i < this.shockwaves.length; i++) {
        var s = this.shockwaves[i];
        var dist = Math.sqrt((cx - s.x) * (cx - s.x) + (cy - s.y) * (cy - s.y));
        var halfThick = s.thickness * s.life / 2 + sw / 2;
        if (Math.abs(dist - s.radius) < halfThick) return this.damVal;
    }
    return 0;
};

CelestialJudgmentPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.hammers.length === 0 && this.shockwaves.length === 0;
};
