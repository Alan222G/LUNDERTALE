// hawking_burst.js — Singularity Phase 2 Exclusive: Hawking radiation rings expanding outward
var HawkingBurstPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.bursts = [];
    this.burstTimer = 0;
    this.burstInterval = 0.8;
    this.particles = [];
    this.battleBox = null;
    this.centerX = 0; this.centerY = 0;
};
HawkingBurstPattern.prototype = Object.create(BulletPattern.prototype);

HawkingBurstPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.bursts = [];
    this.particles = [];
    this.burstTimer = 0.5;
    this.centerX = 370;
    this.centerY = 200;
};

HawkingBurstPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.burstTimer += dt;
    if (this.burstTimer >= this.burstInterval && this.elapsed < this.duration - 2) {
        this.burstTimer = 0;
        // Multiple concentric rings
        var numRings = 2 + Math.floor(Math.random() * 2);
        for (var r = 0; r < numRings; r++) {
            this.bursts.push({
                x: this.centerX + (Math.random() - 0.5) * 40,
                y: this.centerY + (Math.random() - 0.5) * 40,
                radius: 5, maxRadius: 260 + r * 40,
                speed: 140 + r * 30, thickness: 10 - r * 2,
                life: 1, gap: Math.random() * Math.PI * 2,
                gapSize: 0.5 + Math.random() * 0.3 // gap opening in radians
            });
        }
        // Scatter particles
        for (var p = 0; p < 16; p++) {
            var angle = Math.random() * Math.PI * 2;
            this.particles.push({
                x: this.centerX, y: this.centerY,
                vx: Math.cos(angle) * (90 + Math.random() * 120),
                vy: Math.sin(angle) * (90 + Math.random() * 120),
                size: 2.5 + Math.random() * 2, life: 2.0 + Math.random(),
                hue: Math.random() > 0.5 // true=purple, false=blue
            });
        }
    }
    // Update bursts
    for (var i = this.bursts.length - 1; i >= 0; i--) {
        var b = this.bursts[i];
        b.radius += b.speed * dt;
        b.life = 1 - (b.radius / b.maxRadius);
        b.gap += 0.8 * dt; // Rotate gap
        if (b.radius > b.maxRadius) this.bursts.splice(i, 1);
    }
    // Update particles
    var bb = this.battleBox;
    for (var i = this.particles.length - 1; i >= 0; i--) {
        var p = this.particles[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
        if (p.life <= 0 || p.x < bb[0]-30 || p.x > bb[2]+30 || p.y < bb[1]-30 || p.y > bb[3]+30)
            this.particles.splice(i, 1);
    }
};

HawkingBurstPattern.prototype.draw = function(ctx) {
    ctx.save();
    // Draw burst rings with gaps
    for (var i = 0; i < this.bursts.length; i++) {
        var b = this.bursts[i];
        var alpha = Math.max(0, b.life * 0.8).toFixed(2);
        // Outer glow ring
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(150, 0, 255, 0.4)";
        ctx.strokeStyle = "rgba(120, 0, 200, " + alpha + ")";
        ctx.lineWidth = b.thickness * b.life + 1;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, b.gap + b.gapSize, b.gap + Math.PI * 2 - b.gapSize);
        ctx.stroke();
        // Inner bright ring
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(200, 100, 255, " + (alpha * 0.7).toFixed(2) + ")";
        ctx.lineWidth = Math.max(1, b.thickness * b.life * 0.3);
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, b.gap + b.gapSize, b.gap + Math.PI * 2 - b.gapSize);
        ctx.stroke();
    }
    ctx.shadowBlur = 0;
    // Draw particles
    for (var i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        var pAlpha = Math.min(1, p.life * 0.8).toFixed(2);
        var pGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        if (p.hue) {
            pGrad.addColorStop(0, "rgba(200, 100, 255, " + pAlpha + ")");
            pGrad.addColorStop(1, "rgba(100, 0, 200, 0)");
        } else {
            pGrad.addColorStop(0, "rgba(100, 150, 255, " + pAlpha + ")");
            pGrad.addColorStop(1, "rgba(0, 50, 200, 0)");
        }
        ctx.fillStyle = pGrad;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
};

HawkingBurstPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2, cy = sy + sh / 2;
    // Ring collision (with gap check)
    for (var i = 0; i < this.bursts.length; i++) {
        var b = this.bursts[i];
        var dist = Math.sqrt((cx - b.x) * (cx - b.x) + (cy - b.y) * (cy - b.y));
        var halfThick = b.thickness * b.life / 2 + sw / 2;
        if (Math.abs(dist - b.radius) < halfThick) {
            // Check if in gap
            var angleToSoul = Math.atan2(cy - b.y, cx - b.x);
            var gapCenter = b.gap;
            var angleDiff = Math.abs(((angleToSoul - gapCenter + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
            if (angleDiff > b.gapSize) return this.damVal; // Not in gap
        }
    }
    // Particle collision
    for (var i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        var dx = cx - p.x, dy = cy - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < p.size + sw / 2) return this.damVal;
    }
    return 0;
};

HawkingBurstPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bursts.length === 0 && this.particles.length === 0;
};
