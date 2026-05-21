// voidImplosion.js — Sachiel Phase 4: A massive gravitational vortex and blinding explosion
var VoidImplosionPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 15; // Extremely high damage
    
    this.centerX = 0;
    this.centerY = 0;
    
    this.particles = [];
    this.implosionRadius = 0;
    this.screenShake = 0;
    this.flashAlpha = 0;
    
    this.chargeTime = 3.0;
};

VoidImplosionPattern.prototype = Object.create(BulletPattern.prototype);

VoidImplosionPattern.prototype.generateBullets = function(battleBox) {
    this.elapsed = 0;
    this.centerX = (battleBox[0] + battleBox[2]) / 2;
    this.centerY = (battleBox[1] + battleBox[3]) / 2;
    
    this.particles = [];
    this.implosionRadius = 0;
    this.flashAlpha = 0;
    
    // Ambient energy motes
    for (var i = 0; i < 200; i++) {
        var angle = Math.random() * Math.PI * 2;
        var dist = 50 + Math.random() * 300;
        this.particles.push({
            x: this.centerX + Math.cos(angle) * dist,
            y: this.centerY + Math.sin(angle) * dist,
            angle: angle,
            dist: dist,
            size: 1 + Math.random() * 3,
            hue: Math.random() > 0.5 ? 0 : 1 // 0=white, 1=cyan
        });
    }
};

VoidImplosionPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    var bb = Cbbox.getBound();
    
    if (this.elapsed < this.chargeTime) {
        // Charging phase: Sucking everything into the center
        var progress = this.elapsed / this.chargeTime;
        this.implosionRadius = progress * 40; // Core gets bigger
        this.screenShake = progress * 4;
        
        for (var i = 0; i < this.particles.length; i++) {
            var p = this.particles[i];
            
            // Suction force increases exponentially as time passes
            var pull = 50 + Math.pow(progress, 3) * 500;
            p.dist -= pull * dt;
            p.angle += (10 / Math.max(1, p.dist)) * dt; // Spiraling in
            
            p.x = this.centerX + Math.cos(p.angle) * p.dist;
            p.y = this.centerY + Math.sin(p.angle) * p.dist;
            
            if (p.dist < this.implosionRadius) {
                // Eaten by the core
                p.dist = 200 + Math.random() * 150;
                p.angle = Math.random() * Math.PI * 2;
            }
        }
        
    } else if (this.elapsed < this.chargeTime + 0.3) {
        // Critical mass -> Collapse to zero instantly
        this.implosionRadius = 0;
        this.screenShake = 0;
    } else if (this.elapsed < this.chargeTime + 0.6) {
        // EXPLOSION!
        this.flashAlpha = 1.0;
        this.screenShake = 15; // Massive shake
        this.implosionRadius = (this.elapsed - (this.chargeTime + 0.3)) / 0.3 * 800; // Explodes outward rapidly
    } else {
        // Fading
        this.screenShake = Math.max(0, this.screenShake - dt * 10);
        this.flashAlpha = Math.max(0, this.flashAlpha - dt * 0.5);
    }
};

VoidImplosionPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();
    
    if (this.screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
    }
    
    ctx.globalCompositeOperation = "lighter";
    
    if (this.elapsed < this.chargeTime) {
        // Draw sucking particles
        var progress = this.elapsed / this.chargeTime;
        
        for (var i = 0; i < this.particles.length; i++) {
            var p = this.particles[i];
            var alpha = (0.5 + progress * 0.5).toFixed(2);
            ctx.fillStyle = p.hue === 0 ? "rgba(255, 255, 255, " + alpha + ")" : "rgba(0, 255, 255, " + alpha + ")";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Motion blur trail
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(this.centerX + Math.cos(p.angle - 0.3) * (p.dist + 15), this.centerY + Math.sin(p.angle - 0.3) * (p.dist + 15));
            ctx.stroke();
        }
        
        // Draw the core anomaly
        var grad = ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, this.implosionRadius + 20);
        grad.addColorStop(0, "rgba(255, 255, 255, 1)");
        grad.addColorStop(0.2, "rgba(0, 255, 255, 0.8)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.implosionRadius + 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Negative space center
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.implosionRadius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
    } else if (this.elapsed >= this.chargeTime + 0.3) {
        // Draw explosion wave
        ctx.strokeStyle = "rgba(255, 255, 255, " + this.flashAlpha + ")";
        ctx.lineWidth = 30 * this.flashAlpha;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.implosionRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Fill screen flash
        if (this.flashAlpha > 0) {
            ctx.fillStyle = "rgba(255, 255, 255, " + this.flashAlpha + ")";
            ctx.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
        }
    }
    
    ctx.restore();
};

VoidImplosionPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    if (this.elapsed < this.chargeTime + 0.3) return 0; // Only damages on explosion
    
    var cx = sx + sw/2;
    var cy = sy + sh/2;
    var dist = Math.sqrt(Math.pow(cx - this.centerX, 2) + Math.pow(cy - this.centerY, 2));
    
    // Expanding wave of death
    if (Math.abs(dist - this.implosionRadius) < 30) {
        return this.damVal;
    }
    
    return 0;
};

VoidImplosionPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};
