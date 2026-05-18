// vortex_pull.js — Ramiel Phase 2 Exclusive: gravitational vortex that pulls soul while launching fragments
var VortexPullPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.vortexX = 0; this.vortexY = 0;
    this.pullStrength = 0;
    this.maxPull = 60;
    this.fragments = [];
    this.fragmentTimer = 0;
    this.fragmentInterval = 0.3;
    this.vortexParticles = [];
    this.battleBox = null;
    this.vortexAngle = 0;
};
VortexPullPattern.prototype = Object.create(BulletPattern.prototype);

VortexPullPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.vortexX = (battleBox[0] + battleBox[2]) / 2;
    this.vortexY = (battleBox[1] + battleBox[3]) / 2;
    this.pullStrength = 0;
    this.fragments = [];
    this.vortexParticles = [];
    this.fragmentTimer = 0;
    this.vortexAngle = 0;
    // Create vortex orbit particles
    for (var i = 0; i < 30; i++) {
        this.vortexParticles.push({
            angle: Math.random() * Math.PI * 2,
            radius: 20 + Math.random() * 80,
            speed: 2 + Math.random() * 3,
            size: 1 + Math.random() * 2
        });
    }
};

VortexPullPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.vortexAngle += 2.5 * dt;
    var bb = this.battleBox;
    // Ramp up pull strength
    if (this.elapsed < 1.0) this.pullStrength = (this.elapsed / 1.0) * this.maxPull;
    else if (this.elapsed > this.duration - 1.0) this.pullStrength = Math.max(0, this.maxPull * (1 - (this.elapsed - (this.duration - 1.0))));
    else this.pullStrength = this.maxPull;
    // Apply gravitational pull to soul
    var soulPos = Soul.getPos();
    if (soulPos && this.pullStrength > 0) {
        var dx = this.vortexX - soulPos.x, dy = this.vortexY - soulPos.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
            var force = this.pullStrength / Math.max(30, dist) * dt;
            soulPos.x += (dx / dist) * force * 40;
            soulPos.y += (dy / dist) * force * 40;
        }
    }
    // Spawn outward fragments
    this.fragmentTimer += dt;
    if (this.fragmentTimer >= this.fragmentInterval && this.elapsed > 0.5 && this.elapsed < this.duration - 1) {
        this.fragmentTimer = 0;
        var numFrags = 3;
        for (var i = 0; i < numFrags; i++) {
            var angle = this.vortexAngle + (i / numFrags) * Math.PI * 2;
            var speed = 80 + Math.random() * 60;
            this.fragments.push({
                x: this.vortexX, y: this.vortexY,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 3,
                rot: Math.random() * Math.PI, rotSpeed: (Math.random() - 0.5) * 8,
                life: 2.5
            });
        }
    }
    // Update fragments
    for (var i = this.fragments.length - 1; i >= 0; i--) {
        var f = this.fragments[i];
        f.x += f.vx * dt; f.y += f.vy * dt;
        f.rot += f.rotSpeed * dt; f.life -= dt;
        if (f.life <= 0 || f.x < bb[0] - 40 || f.x > bb[2] + 40 || f.y < bb[1] - 40 || f.y > bb[3] + 40)
            this.fragments.splice(i, 1);
    }
    // Update vortex orbit particles
    for (var i = 0; i < this.vortexParticles.length; i++) {
        var vp = this.vortexParticles[i];
        vp.angle += vp.speed * dt;
        vp.radius = Math.max(5, vp.radius - 8 * dt);
        if (vp.radius < 8) { vp.radius = 20 + Math.random() * 80; vp.angle = Math.random() * Math.PI * 2; }
    }
};

VortexPullPattern.prototype.draw = function(ctx) {
    ctx.save();
    var alpha = Math.min(1, Math.min(this.elapsed, this.duration - this.elapsed) * 2).toFixed(2);
    // Vortex distortion background
    var vGrad = ctx.createRadialGradient(this.vortexX, this.vortexY, 5, this.vortexX, this.vortexY, 120);
    vGrad.addColorStop(0, "rgba(60, 0, 180, " + (alpha * 0.3).toFixed(2) + ")");
    vGrad.addColorStop(0.4, "rgba(30, 0, 100, " + (alpha * 0.15).toFixed(2) + ")");
    vGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = vGrad;
    ctx.beginPath(); ctx.arc(this.vortexX, this.vortexY, 120, 0, Math.PI * 2); ctx.fill();
    // Spinning spiral arms
    ctx.globalAlpha = parseFloat(alpha) * 0.4;
    for (var arm = 0; arm < 3; arm++) {
        ctx.strokeStyle = "rgba(120, 80, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (var t = 0; t < 40; t++) {
            var spiralAngle = this.vortexAngle + arm * Math.PI * 2 / 3 + t * 0.15;
            var spiralR = 8 + t * 2.5;
            var sx = this.vortexX + Math.cos(spiralAngle) * spiralR;
            var sy = this.vortexY + Math.sin(spiralAngle) * spiralR;
            if (t === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Orbit particles
    for (var i = 0; i < this.vortexParticles.length; i++) {
        var vp = this.vortexParticles[i];
        var vpx = this.vortexX + Math.cos(vp.angle) * vp.radius;
        var vpy = this.vortexY + Math.sin(vp.angle) * vp.radius;
        var vpAlpha = (0.3 + (1 - vp.radius / 100) * 0.5).toFixed(2);
        ctx.fillStyle = "rgba(150, 120, 255, " + vpAlpha + ")";
        ctx.beginPath(); ctx.arc(vpx, vpy, vp.size, 0, Math.PI * 2); ctx.fill();
    }
    // Core
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(100, 50, 255, 0.8)";
    var coreGrad = ctx.createRadialGradient(this.vortexX, this.vortexY, 0, this.vortexX, this.vortexY, 15);
    coreGrad.addColorStop(0, "rgba(200, 150, 255, 0.9)");
    coreGrad.addColorStop(0.5, "rgba(100, 50, 200, 0.6)");
    coreGrad.addColorStop(1, "rgba(50, 0, 120, 0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath(); ctx.arc(this.vortexX, this.vortexY, 15, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Draw fragments (crystal shards)
    for (var i = 0; i < this.fragments.length; i++) {
        var f = this.fragments[i];
        var fAlpha = Math.min(1, f.life * 0.6).toFixed(2);
        ctx.save();
        ctx.translate(f.x, f.y); ctx.rotate(f.rot);
        ctx.fillStyle = "rgba(80, 120, 255, " + fAlpha + ")";
        ctx.beginPath();
        ctx.moveTo(0, -f.size); ctx.lineTo(f.size * 0.5, 0);
        ctx.lineTo(0, f.size); ctx.lineTo(-f.size * 0.5, 0);
        ctx.closePath(); ctx.fill();
        ctx.restore();
    }
    ctx.restore();
};

VortexPullPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2, cy = sy + sh / 2;
    // Vortex core damage
    var coreDist = Math.sqrt((cx - this.vortexX) * (cx - this.vortexX) + (cy - this.vortexY) * (cy - this.vortexY));
    if (coreDist < 18 && this.pullStrength > 10) return this.damVal;
    // Fragment collision
    for (var i = 0; i < this.fragments.length; i++) {
        var f = this.fragments[i];
        var dx = cx - f.x, dy = cy - f.y;
        if (Math.sqrt(dx * dx + dy * dy) < f.size + sw / 2) return this.damVal;
    }
    return 0;
};

VortexPullPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.fragments.length === 0;
};
