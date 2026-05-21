// sachielWaterBlast.js - Phase 1 Sachiel attack: Water geysers erupting from below
var SachielWaterBlastPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.geysers = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.5;
};

SachielWaterBlastPattern.prototype = Object.create(BulletPattern.prototype);

SachielWaterBlastPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    var bw = bb[2] - bb[0];
    
    // Spawn new geysers
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 2) {
        this.spawnTimer = 0;
        
        // Spawn 1 or 2 geysers
        var numGeysers = Math.random() > 0.7 ? 2 : 1;
        var safeWidth = bw / (numGeysers + 1);
        
        for (var i = 0; i < numGeysers; i++) {
            var xPos = bb[0] + (i * safeWidth) + (Math.random() * safeWidth) + 10;
            this.geysers.push({
                x: xPos,
                width: 20 + Math.random() * 10,
                warningTime: 1.3,
                warningTimer: 0,
                erupting: false,
                eruptTimer: 0,
                eruptDuration: 1.5,
                particles: []
            });
        }
        
        // Decrease interval slightly to increase difficulty
        if (this.spawnInterval > 0.9) this.spawnInterval -= 0.05;
    }
    
    // Update geysers
    for (var i = this.geysers.length - 1; i >= 0; i--) {
        var g = this.geysers[i];
        
        if (!g.erupting) {
            g.warningTimer += dt;
            if (g.warningTimer >= g.warningTime) {
                g.erupting = true;
                // Initial burst of particles
                for (var p = 0; p < 15; p++) {
                    g.particles.push({
                        x: g.x + (Math.random() - 0.5) * g.width,
                        y: bb[3],
                        vx: (Math.random() - 0.5) * 50,
                        vy: -150 - Math.random() * 200,
                        life: 1.0,
                        size: 3 + Math.random() * 4
                    });
                }
            }
        } else {
            g.eruptTimer += dt;
            
            // Continuous particles
            if (g.eruptTimer < g.eruptDuration - 0.3) {
                g.particles.push({
                    x: g.x + (Math.random() - 0.5) * g.width,
                    y: bb[3],
                    vx: (Math.random() - 0.5) * 30,
                    vy: -200 - Math.random() * 250,
                    life: 0.8,
                    size: 2 + Math.random() * 5
                });
            }
            
            // Update particles
            for (var p = g.particles.length - 1; p >= 0; p--) {
                var part = g.particles[p];
                part.x += part.vx * dt;
                part.y += part.vy * dt;
                part.vy += 400 * dt; // Gravity
                part.life -= dt;
                if (part.life <= 0) g.particles.splice(p, 1);
            }
            
            if (g.eruptTimer >= g.eruptDuration && g.particles.length === 0) {
                this.geysers.splice(i, 1);
            }
        }
    }
};

SachielWaterBlastPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var bh = bb[3] - bb[1];
    
    for (var i = 0; i < this.geysers.length; i++) {
        var g = this.geysers[i];
        
        if (!g.erupting) {
            // Draw warning area
            var alpha = (g.warningTimer / g.warningTime);
            var pulse = Math.abs(Math.sin(this.elapsed * 20)) * 0.3;
            
            ctx.fillStyle = "rgba(0, 150, 255, " + (alpha * 0.4 + pulse) + ")";
            ctx.fillRect(g.x - g.width/2, bb[1], g.width, bh);
            
            // Red exclamation mark at bottom
            ctx.fillStyle = "red";
            ctx.font = "20px Arial";
            ctx.textAlign = "center";
            ctx.fillText("!", g.x, bb[3] - 10);
            
        } else {
            // Draw erupting pillar
            if (g.eruptTimer < g.eruptDuration) {
                var widthMult = 1.0;
                if (g.eruptTimer < 0.2) widthMult = g.eruptTimer / 0.2; // Expand
                if (g.eruptTimer > g.eruptDuration - 0.3) widthMult = (g.eruptDuration - g.eruptTimer) / 0.3; // Contract
                
                var currentWidth = g.width * widthMult;
                
                var grad = ctx.createLinearGradient(g.x - currentWidth/2, 0, g.x + currentWidth/2, 0);
                grad.addColorStop(0, "rgba(50, 150, 255, 0.4)");
                grad.addColorStop(0.5, "rgba(200, 240, 255, 0.9)");
                grad.addColorStop(1, "rgba(50, 150, 255, 0.4)");
                
                ctx.fillStyle = grad;
                ctx.fillRect(g.x - currentWidth/2, bb[1], currentWidth, bh);
            }
            
            // Draw particles (water droplets)
            ctx.fillStyle = "#AADDFF";
            for (var p = 0; p < g.particles.length; p++) {
                var part = g.particles[p];
                ctx.beginPath();
                ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
};

SachielWaterBlastPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    
    for (var i = 0; i < this.geysers.length; i++) {
        var g = this.geysers[i];
        if (g.erupting && g.eruptTimer < g.eruptDuration - 0.2) {
            // Check pillar collision
            if (sx + sw > g.x - g.width/2 && sx < g.x + g.width/2) {
                return this.damVal;
            }
            // Optional: check individual particles if we want it extra hard, 
            // but the pillar itself is usually the main threat.
        }
    }
    return 0;
};

SachielWaterBlastPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.geysers.length === 0;
};
