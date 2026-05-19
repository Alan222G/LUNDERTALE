// resonance_wave.js — Ramiel Phase 1 Exclusive: concentric sound waves pulse from center
var ResonanceWavePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 7;
    this.rings = [];
    this.ringTimer = 0;
    this.ringInterval = 0.8;
    this.battleBox = null;
    this.centerX = 0;
    this.centerY = 0;
};
ResonanceWavePattern.prototype = Object.create(BulletPattern.prototype);

ResonanceWavePattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.rings = [];
    this.ringTimer = 0.6;
    this.centerX = (battleBox[0] + battleBox[2]) / 2;
    this.centerY = (battleBox[1] + battleBox[3]) / 2;
};

ResonanceWavePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    var bb = Cbbox.getBound();
    this.centerX = (bb[0] + bb[2]) / 2;
    this.centerY = (bb[1] + bb[3]) / 2;
    this.ringTimer += dt;
    if (this.ringTimer >= this.ringInterval && this.elapsed < this.duration - 1.5) {
        this.ringTimer = 0;
        this.rings.push({
            x: this.centerX + (Math.random() - 0.5) * 60,
            y: this.centerY + (Math.random() - 0.5) * 40,
            radius: 8,
            speed: 90 + Math.random() * 40,
            thickness: 10 + Math.random() * 6,
            maxRadius: 200,
            life: 1,
            hue: Math.floor(Math.random() * 3)
        });
    }
    for (var i = this.rings.length - 1; i >= 0; i--) {
        var r = this.rings[i];
        r.radius += r.speed * dt;
        r.life = 1 - (r.radius / r.maxRadius);
        if (r.radius > r.maxRadius) this.rings.splice(i, 1);
    }
};

ResonanceWavePattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.rings.length; i++) {
        var r = this.rings[i];
        var alpha = Math.max(0, r.life * 0.8).toFixed(2);
        var colors = [
            "rgba(40, 100, 255, " + alpha + ")",
            "rgba(80, 200, 255, " + alpha + ")",
            "rgba(100, 60, 255, " + alpha + ")"
        ];
        // Outer ring glow
        ctx.shadowBlur = 12;
        ctx.shadowColor = colors[r.hue];
        ctx.strokeStyle = colors[r.hue];
        ctx.lineWidth = r.thickness * r.life;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        // Inner bright ring
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(200, 230, 255, " + (alpha * 0.6).toFixed(2) + ")";
        ctx.lineWidth = Math.max(1, r.thickness * r.life * 0.3);
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
};

ResonanceWavePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2, cy = sy + sh / 2;
    for (var i = 0; i < this.rings.length; i++) {
        var r = this.rings[i];
        var dist = Math.sqrt((cx - r.x) * (cx - r.x) + (cy - r.y) * (cy - r.y));
        var halfThick = r.thickness * r.life / 2 + sw / 2;
        if (Math.abs(dist - r.radius) < halfThick) return this.damVal;
    }
    return 0;
};

ResonanceWavePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.rings.length === 0;
};
