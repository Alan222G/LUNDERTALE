// bloodBoil.js — Sachiel Phase 3: Red energy geysers erupt from the ground
var BloodBoilPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 11;
    
    this.geysers = [];
    this.spawnTimer = 0;
    this.screenShake = 0;
};

BloodBoilPattern.prototype = Object.create(BulletPattern.prototype);

BloodBoilPattern.prototype.generateBullets = function(battleBox) {
    this.elapsed = 0;
    this.geysers = [];
    this.spawnTimer = 0.5;
};

BloodBoilPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    var bb = Cbbox.getBound();
    
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.duration - this.elapsed > 2.0) {
        // Spawn geyser
        this.geysers.push({
            x: bb[0] + 10 + Math.random() * (bb[2] - bb[0] - 20),
            width: 20 + Math.random() * 20,
            state: 0, // 0: warn, 1: erupt, 2: fade
            timer: 0,
            warnDuration: 0.8 + Math.random() * 0.4,
            eruptDuration: 0.5,
            fadeDuration: 0.3,
            particles: []
        });
        this.spawnTimer = 0.3 + Math.random() * 0.4;
    }
    
    this.screenShake = 0;
    
    for (var i = this.geysers.length - 1; i >= 0; i--) {
        var g = this.geysers[i];
        g.timer += dt;
        
        if (g.state === 0) {
            if (g.timer >= g.warnDuration) {
                g.state = 1;
                g.timer = 0;
                // Generate eruption particles
                for (var p = 0; p < 20; p++) {
                    g.particles.push({
                        x: g.x + (Math.random() - 0.5) * g.width,
                        y: bb[3],
                        vx: (Math.random() - 0.5) * 50,
                        vy: -200 - Math.random() * 300,
                        size: 2 + Math.random() * 4
                    });
                }
            }
        } else if (g.state === 1) {
            this.screenShake = Math.max(this.screenShake, 3);
            if (g.timer >= g.eruptDuration) {
                g.state = 2;
                g.timer = 0;
            }
        } else if (g.state === 2) {
            if (g.timer >= g.fadeDuration) {
                this.geysers.splice(i, 1);
                continue;
            }
        }
        
        // Update particles
        for (var p = g.particles.length - 1; p >= 0; p--) {
            var part = g.particles[p];
            part.x += part.vx * dt;
            part.y += part.vy * dt;
            if (part.y < bb[1] - 50) g.particles.splice(p, 1);
        }
    }
};

BloodBoilPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();
    
    if (this.screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
    }
    
    ctx.globalCompositeOperation = "lighter";
    
    for (var i = 0; i < this.geysers.length; i++) {
        var g = this.geysers[i];
        
        if (g.state === 0) {
            // Warning: bubbling blood at the bottom and rising heat lines
            var progress = g.timer / g.warnDuration;
            
            // Floor puddle
            ctx.fillStyle = "rgba(200, 0, 0, " + (progress * 0.8) + ")";
            ctx.beginPath();
            ctx.ellipse(g.x, bb[3], g.width/2 + progress * 10, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Heat lines
            ctx.strokeStyle = "rgba(255, 50, 0, " + (progress * 0.5) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(g.x - g.width/4, bb[3]);
            ctx.lineTo(g.x - g.width/4, bb[1]);
            ctx.moveTo(g.x + g.width/4, bb[3]);
            ctx.lineTo(g.x + g.width/4, bb[1]);
            ctx.stroke();
            
        } else if (g.state === 1 || g.state === 2) {
            // Eruption!
            var alpha = 1.0;
            if (g.state === 2) {
                alpha = 1.0 - (g.timer / g.fadeDuration);
            }
            
            // Main pillar
            var grad = ctx.createLinearGradient(g.x - g.width/2, 0, g.x + g.width/2, 0);
            grad.addColorStop(0, "rgba(255, 0, 0, 0)");
            grad.addColorStop(0.2, "rgba(255, 0, 0, " + (alpha * 0.8) + ")");
            grad.addColorStop(0.5, "rgba(255, 200, 200, " + alpha + ")");
            grad.addColorStop(0.8, "rgba(255, 0, 0, " + (alpha * 0.8) + ")");
            grad.addColorStop(1, "rgba(255, 0, 0, 0)");
            
            ctx.fillStyle = grad;
            ctx.fillRect(g.x - g.width/2, bb[1], g.width, bb[3] - bb[1]);
            
            // Particles
            ctx.fillStyle = "rgba(255, 100, 100, " + alpha + ")";
            for (var p = 0; p < g.particles.length; p++) {
                var part = g.particles[p];
                ctx.beginPath();
                ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    ctx.restore();
};

BloodBoilPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw/2;
    var bb = Cbbox.getBound();
    
    for (var i = 0; i < this.geysers.length; i++) {
        var g = this.geysers[i];
        if (g.state === 1) { // Only damage during eruption
            if (Math.abs(cx - g.x) < g.width/2 + sw/2) {
                return this.damVal;
            }
        }
    }
    return 0;
};

BloodBoilPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};
