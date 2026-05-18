// gravity_well.js — Singularity Phase 1 Exclusive: gravity distortion zones that bend soul trajectory
var GravityWellPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 6;
    this.wells = [];
    this.wellTimer = 0;
    this.wellInterval = 0.8;
    this.orbs = [];
    this.battleBox = null;
};
GravityWellPattern.prototype = Object.create(BulletPattern.prototype);

GravityWellPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.wells = [];
    this.orbs = [];
    this.wellTimer = 0.5;
};

GravityWellPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    var bb = Cbbox.getBound();
    this.wellTimer += dt;
    if (this.wellTimer >= this.wellInterval && this.elapsed < this.duration - 2 && this.wells.length < 8) {
        this.wellTimer = 0;
        this.wells.push({
            x: bb[0] + 40 + Math.random() * (bb[2] - bb[0] - 80),
            y: bb[1] + 40 + Math.random() * (bb[3] - bb[1] - 80),
            strength: 70 + Math.random() * 50,
            radius: 80 + Math.random() * 40,
            life: 3.0 + Math.random(), maxLife: 4.0,
            orbTimer: 0, orbInterval: 0.2
        });
    }
    // Apply gravity to soul
    var soulPos = Soul.getPos();
    for (var i = this.wells.length - 1; i >= 0; i--) {
        var w = this.wells[i];
        w.life -= dt;
        w.orbTimer += dt;
        // Pull soul
        if (soulPos) {
            var dx = w.x - soulPos.x, dy = w.y - soulPos.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < w.radius && dist > 5) {
                var force = w.strength * (1 - dist / w.radius) * dt;
                soulPos.x += (dx / dist) * force;
                soulPos.y += (dy / dist) * force;
            }
        }
        // Spawn danger orbs
        if (w.orbTimer >= w.orbInterval) {
            w.orbTimer = 0;
            var angle = Math.random() * Math.PI * 2;
            this.orbs.push({
                x: w.x + Math.cos(angle) * w.radius * 0.8,
                y: w.y + Math.sin(angle) * w.radius * 0.8,
                vx: Math.cos(angle) * 100, vy: Math.sin(angle) * 100,
                size: 5 + Math.random() * 4, life: 2.5
            });
        }
        if (w.life <= 0) this.wells.splice(i, 1);
    }
    for (var i = this.orbs.length - 1; i >= 0; i--) {
        var o = this.orbs[i];
        o.x += o.vx * dt; o.y += o.vy * dt; o.life -= dt;
        if (o.life <= 0 || o.x < bb[0]-30 || o.x > bb[2]+30 || o.y < bb[1]-30 || o.y > bb[3]+30)
            this.orbs.splice(i, 1);
    }
};

GravityWellPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.wells.length; i++) {
        var w = this.wells[i];
        var lifeAlpha = Math.min(1, w.life / w.maxLife * 2);
        // Distortion field
        var dGrad = ctx.createRadialGradient(w.x, w.y, 5, w.x, w.y, w.radius);
        dGrad.addColorStop(0, "rgba(80, 0, 150, " + (lifeAlpha * 0.3).toFixed(2) + ")");
        dGrad.addColorStop(0.5, "rgba(40, 0, 80, " + (lifeAlpha * 0.15).toFixed(2) + ")");
        dGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = dGrad;
        ctx.beginPath(); ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2); ctx.fill();
        // Spiral effect
        ctx.globalAlpha = lifeAlpha * 0.3;
        ctx.strokeStyle = "rgba(160, 80, 255, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (var t = 0; t < 30; t++) {
            var sAngle = this.elapsed * 3 + t * 0.2 + i;
            var sR = 5 + t * (w.radius / 35);
            var sx = w.x + Math.cos(sAngle) * sR;
            var sy = w.y + Math.sin(sAngle) * sR;
            if (t === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        // Core
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(120, 0, 255, 0.6)";
        var cGrad = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, 10);
        cGrad.addColorStop(0, "rgba(0, 0, 0, 0.9)");
        cGrad.addColorStop(0.6, "rgba(60, 0, 120, 0.6)");
        cGrad.addColorStop(1, "rgba(120, 0, 255, 0)");
        ctx.fillStyle = cGrad;
        ctx.beginPath(); ctx.arc(w.x, w.y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    }
    // Draw orbs
    for (var i = 0; i < this.orbs.length; i++) {
        var o = this.orbs[i];
        var oAlpha = Math.min(1, o.life * 0.7).toFixed(2);
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(150, 0, 255, 0.5)";
        var oGrad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.size);
        oGrad.addColorStop(0, "rgba(0, 0, 0, " + oAlpha + ")");
        oGrad.addColorStop(0.6, "rgba(80, 0, 150, " + (oAlpha * 0.7).toFixed(2) + ")");
        oGrad.addColorStop(1, "rgba(150, 0, 255, 0)");
        ctx.fillStyle = oGrad;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
};

GravityWellPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2, cy = sy + sh / 2;
    // Well core damage
    for (var i = 0; i < this.wells.length; i++) {
        var w = this.wells[i];
        var dist = Math.sqrt((cx - w.x) * (cx - w.x) + (cy - w.y) * (cy - w.y));
        if (dist < 12 + sw / 2) return this.damVal;
    }
    for (var i = 0; i < this.orbs.length; i++) {
        var o = this.orbs[i];
        var dx = cx - o.x, dy = cy - o.y;
        if (Math.sqrt(dx * dx + dy * dy) < o.size + sw / 2) return this.damVal;
    }
    return 0;
};

GravityWellPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.wells.length === 0 && this.orbs.length === 0;
};
