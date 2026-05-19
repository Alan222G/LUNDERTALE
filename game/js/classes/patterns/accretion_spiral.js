// accretion_spiral.js — Void orbs spiral inward toward the center, then explode outward
// Phase 2 exclusive attack for Singularity
var AccretionSpiralPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.spiralArms = [];
    this.spawnTimer = 0;
    this.spawnInterval = 0.12;
    this.damVal = config.damVal || 7;
    this.centerX = 0;
    this.centerY = 0;
    this.burstTimer = 0;
    this.burstInterval = 2.5; // Every 2.5s a burst from center
    this.burstBullets = [];
};

AccretionSpiralPattern.prototype = Object.create(BulletPattern.prototype);

AccretionSpiralPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.centerX = (battleBox[0] + battleBox[2]) / 2;
    this.centerY = (battleBox[1] + battleBox[3]) / 2;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.burstTimer = 1.5; // First burst after 1s
    this.spiralArms = [];
    this.burstBullets = [];
};

AccretionSpiralPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    this.burstTimer += dt;
    var bb = Cbbox.getBound();
    this.centerX = (bb[0] + bb[2]) / 2;
    this.centerY = (bb[1] + bb[3]) / 2;

    // Spawn spiraling orbs that move inward
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 2) {
        this.spawnTimer = 0;
        this.spawnSpiralOrb();
    }

    // Update spiral orbs (move toward center with spiral motion)
    for (var i = this.spiralArms.length - 1; i >= 0; i--) {
        var orb = this.spiralArms[i];
        orb.angle += orb.spinSpeed * dt;
        orb.radius -= orb.inwardSpeed * dt;
        orb.x = this.centerX + Math.cos(orb.angle) * orb.radius;
        orb.y = this.centerY + Math.sin(orb.angle) * orb.radius;
        orb.life += dt;
        
        // Remove if reached center
        if (orb.radius <= 12) {
            this.spiralArms.splice(i, 1);
        }
    }

    // Periodic burst from center
    if (this.burstTimer >= this.burstInterval && this.elapsed < this.duration - 1.5) {
        this.burstTimer = 0;
        this.spawnBurst();
    }

    // Update burst bullets
    for (var i = this.burstBullets.length - 1; i >= 0; i--) {
        var b = this.burstBullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life += dt;
        if (b.life > 3.0) {
            this.burstBullets.splice(i, 1);
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

AccretionSpiralPattern.prototype.spawnSpiralOrb = function() {
    var bb = Cbbox.getBound();
    var angle = this.elapsed * 2.5 + Math.random() * 0.5;
    var maxR = Math.min(bb[2] - bb[0], bb[3] - bb[1]) / 2;
    var radius = maxR * (0.7 + Math.random() * 0.3);
    
    this.spiralArms.push({
        x: this.centerX + Math.cos(angle) * radius,
        y: this.centerY + Math.sin(angle) * radius,
        angle: angle,
        radius: radius,
        spinSpeed: 2.0 + Math.random() * 1.0,
        inwardSpeed: 40 + Math.random() * 25,
        life: 0,
        size: 5 + Math.random() * 3
    });
};

AccretionSpiralPattern.prototype.spawnBurst = function() {
    var numBullets = 10;
    for (var i = 0; i < numBullets; i++) {
        var angle = (i / numBullets) * Math.PI * 2 + this.elapsed * 0.5;
        var speed = 100 + Math.random() * 40;
        this.burstBullets.push({
            x: this.centerX,
            y: this.centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0,
            size: 6
        });
    }
};

AccretionSpiralPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;
    var sR = Math.min(sw, sh) / 2;
    
    // Check spiral orbs
    for (var i = 0; i < this.spiralArms.length; i++) {
        var orb = this.spiralArms[i];
        var dx = scx - orb.x;
        var dy = scy - orb.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < sR + orb.size / 2) {
            return this.damVal;
        }
    }
    
    // Check burst bullets
    for (var i = 0; i < this.burstBullets.length; i++) {
        var b = this.burstBullets[i];
        var dx = scx - b.x;
        var dy = scy - b.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < sR + b.size / 2) {
            return this.damVal;
        }
    }
    
    return 0;
};

AccretionSpiralPattern.prototype.draw = function(ctx) {
    BulletPattern.prototype.draw.call(this, ctx);
    ctx.save();
    
    // Draw spiral orbs with trails
    for (var i = 0; i < this.spiralArms.length; i++) {
        var orb = this.spiralArms[i];
        
        // Trail (fading line toward where it came from)
        var trailAngle = orb.angle - 0.6;
        var trailR = orb.radius + 15;
        var tx = this.centerX + Math.cos(trailAngle) * trailR;
        var ty = this.centerY + Math.sin(trailAngle) * trailR;
        ctx.strokeStyle = "rgba(150, 50, 255, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(orb.x, orb.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        
        // Orb glow
        var orbGrad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size);
        orbGrad.addColorStop(0, "rgba(200, 100, 255, 0.9)");
        orbGrad.addColorStop(0.5, "rgba(100, 0, 200, 0.5)");
        orbGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Bright core
        ctx.fillStyle = "rgba(255, 200, 255, 0.9)";
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw burst bullets with void aesthetic
    for (var i = 0; i < this.burstBullets.length; i++) {
        var b = this.burstBullets[i];
        var fadeAlpha = Math.max(0, 1 - b.life / 2.5);
        
        // Outer glow
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(80, 0, 180, 0.6)";
        
        // Dark void core
        ctx.fillStyle = "rgba(0, 0, 0, " + fadeAlpha.toFixed(2) + ")";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Purple rim
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(180, 80, 255, " + (fadeAlpha * 0.8).toFixed(2) + ")";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Center singularity glow (pulsing)
    if (this.elapsed < this.duration - 1) {
        var pulse = Math.sin(this.elapsed * 5) * 0.15 + 0.4;
        var cGrad = ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, 18);
        cGrad.addColorStop(0, "rgba(200, 100, 255, " + pulse.toFixed(2) + ")");
        cGrad.addColorStop(0.5, "rgba(80, 0, 160, " + (pulse * 0.4).toFixed(2) + ")");
        cGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = cGrad;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 18, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
};

AccretionSpiralPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.spiralArms.length === 0 && this.burstBullets.length === 0;
};
