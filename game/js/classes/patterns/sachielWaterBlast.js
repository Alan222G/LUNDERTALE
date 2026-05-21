// sachielWaterBlast.js - Phase 1 Sachiel attack: Water geysers erupting from below
var SachielWaterBlastPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.geysers = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.5;

    // VFX arrays
    this.mistParticles = [];
    this.splashRings = [];
    this.shakeOffset = {x: 0, y: 0};
    this.shakeIntensity = 0;
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
                particles: [],
                justErupted: false  // VFX flag for splash ring
            });
        }
        
        // Decrease interval slightly to increase difficulty
        if (this.spawnInterval > 0.9) this.spawnInterval -= 0.05;
    }
    
    // Decay screen shake
    this.shakeIntensity *= 0.9;
    if (this.shakeIntensity < 0.1) this.shakeIntensity = 0;
    this.shakeOffset.x = (Math.random() - 0.5) * 2 * this.shakeIntensity;
    this.shakeOffset.y = (Math.random() - 0.5) * 2 * this.shakeIntensity;

    // Update mist particles
    for (var m = this.mistParticles.length - 1; m >= 0; m--) {
        var mp = this.mistParticles[m];
        mp.x += mp.vx * dt;
        mp.y += mp.vy * dt;
        mp.life -= dt;
        mp.alpha = Math.max(0, mp.life / mp.maxLife) * 0.5;
        mp.size += 8 * dt; // Expand over time
        if (mp.life <= 0) this.mistParticles.splice(m, 1);
    }

    // Update splash rings
    for (var r = this.splashRings.length - 1; r >= 0; r--) {
        var ring = this.splashRings[r];
        ring.radius += 80 * dt;
        ring.life -= dt;
        ring.alpha = Math.max(0, ring.life / ring.maxLife);
        if (ring.life <= 0) this.splashRings.splice(r, 1);
    }
    
    // Update geysers
    for (var i = this.geysers.length - 1; i >= 0; i--) {
        var g = this.geysers[i];
        
        if (!g.erupting) {
            g.warningTimer += dt;
            if (g.warningTimer >= g.warningTime) {
                g.erupting = true;
                g.justErupted = true;

                // Screen shake on eruption
                this.shakeIntensity = 5;

                // Spawn splash ring at base
                this.splashRings.push({
                    x: g.x,
                    y: bb[3],
                    radius: g.width * 0.5,
                    life: 0.5,
                    maxLife: 0.5,
                    alpha: 1.0
                });

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

                // Initial burst of mist
                for (var m = 0; m < 10; m++) {
                    this.mistParticles.push({
                        x: g.x + (Math.random() - 0.5) * g.width * 2,
                        y: bb[3] - Math.random() * 30,
                        vx: (Math.random() - 0.5) * 20,
                        vy: -30 - Math.random() * 40,
                        life: 1.2 + Math.random() * 0.5,
                        maxLife: 1.7,
                        alpha: 0.4,
                        size: 6 + Math.random() * 8
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

                // Spawn mist/spray floating upward
                if (Math.random() < 0.3) {
                    this.mistParticles.push({
                        x: g.x + (Math.random() - 0.5) * g.width * 1.5,
                        y: bb[3] - Math.random() * 20,
                        vx: (Math.random() - 0.5) * 15,
                        vy: -20 - Math.random() * 30,
                        life: 0.8 + Math.random() * 0.4,
                        maxLife: 1.2,
                        alpha: 0.3,
                        size: 5 + Math.random() * 6
                    });
                }

                // White foam particles at the top of geyser
                if (Math.random() < 0.5) {
                    g.particles.push({
                        x: g.x + (Math.random() - 0.5) * g.width * 0.8,
                        y: bb[1] + Math.random() * 15,
                        vx: (Math.random() - 0.5) * 40,
                        vy: (Math.random() - 0.5) * 20,
                        life: 0.4 + Math.random() * 0.3,
                        size: 2 + Math.random() * 3,
                        foam: true  // Mark as foam particle
                    });
                }
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

    ctx.save();

    // Apply screen shake
    if (this.shakeIntensity > 0) {
        ctx.translate(this.shakeOffset.x, this.shakeOffset.y);
    }
    
    for (var i = 0; i < this.geysers.length; i++) {
        var g = this.geysers[i];
        
        if (!g.erupting) {
            // Draw warning area
            var alpha = (g.warningTimer / g.warningTime);
            var pulse = Math.abs(Math.sin(this.elapsed * 20)) * 0.3;
            
            ctx.fillStyle = "rgba(0, 150, 255, " + (alpha * 0.4 + pulse) + ")";
            ctx.fillRect(g.x - g.width/2, bb[1], g.width, bh);

            // Bubbling effect at base during warning phase
            var bubbleCount = Math.floor(alpha * 6) + 1;
            for (var b = 0; b < bubbleCount; b++) {
                var bubblePhase = this.elapsed * 4 + b * 1.3;
                var bubbleY = bb[3] - 5 - (bubblePhase % 1) * 25;
                var bubbleX = g.x + Math.sin(bubblePhase * 3 + b) * (g.width * 0.3);
                var bubbleSize = 1.5 + Math.sin(bubblePhase * 2) * 0.8;
                var bubbleAlpha = alpha * (1.0 - (bubblePhase % 1)) * 0.7;

                ctx.beginPath();
                ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(100, 200, 255, " + bubbleAlpha + ")";
                ctx.fill();
                ctx.strokeStyle = "rgba(180, 230, 255, " + (bubbleAlpha * 0.8) + ")";
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
            
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

                // Outer glow layer
                var glowGrad = ctx.createLinearGradient(g.x - currentWidth, 0, g.x + currentWidth, 0);
                glowGrad.addColorStop(0, "rgba(0, 80, 180, 0)");
                glowGrad.addColorStop(0.3, "rgba(0, 120, 220, 0.15)");
                glowGrad.addColorStop(0.5, "rgba(80, 180, 255, 0.25)");
                glowGrad.addColorStop(0.7, "rgba(0, 120, 220, 0.15)");
                glowGrad.addColorStop(1, "rgba(0, 80, 180, 0)");
                ctx.fillStyle = glowGrad;
                ctx.fillRect(g.x - currentWidth, bb[1], currentWidth * 2, bh);

                // Main pillar with richer cyan/blue gradient
                var grad = ctx.createLinearGradient(g.x - currentWidth/2, 0, g.x + currentWidth/2, 0);
                grad.addColorStop(0, "rgba(0, 100, 200, 0.3)");
                grad.addColorStop(0.2, "rgba(30, 140, 255, 0.6)");
                grad.addColorStop(0.4, "rgba(100, 210, 255, 0.85)");
                grad.addColorStop(0.5, "rgba(200, 240, 255, 0.95)");
                grad.addColorStop(0.6, "rgba(100, 210, 255, 0.85)");
                grad.addColorStop(0.8, "rgba(30, 140, 255, 0.6)");
                grad.addColorStop(1, "rgba(0, 100, 200, 0.3)");
                
                ctx.fillStyle = grad;
                ctx.fillRect(g.x - currentWidth/2, bb[1], currentWidth, bh);

                // Vertical shimmer gradient overlay
                var vertGrad = ctx.createLinearGradient(0, bb[3], 0, bb[1]);
                var shimmer = Math.abs(Math.sin(this.elapsed * 6)) * 0.15;
                vertGrad.addColorStop(0, "rgba(255, 255, 255, " + (0.3 + shimmer) + ")");
                vertGrad.addColorStop(0.3, "rgba(150, 220, 255, 0.1)");
                vertGrad.addColorStop(0.7, "rgba(100, 200, 255, 0.05)");
                vertGrad.addColorStop(1, "rgba(200, 240, 255, " + (0.2 + shimmer) + ")");
                ctx.fillStyle = vertGrad;
                ctx.fillRect(g.x - currentWidth/2, bb[1], currentWidth, bh);
            }
            
            // Draw particles (water droplets)
            for (var p = 0; p < g.particles.length; p++) {
                var part = g.particles[p];
                var partAlpha = Math.min(1, part.life * 1.5);

                if (part.foam) {
                    // White foam particles at geyser top
                    ctx.beginPath();
                    ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
                    ctx.fillStyle = "rgba(255, 255, 255, " + (partAlpha * 0.9) + ")";
                    ctx.fill();
                } else {
                    // Water droplets with glow
                    ctx.save();
                    ctx.shadowBlur = 6;
                    ctx.shadowColor = "rgba(100, 200, 255, 0.6)";
                    ctx.beginPath();
                    ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
                    ctx.fillStyle = "rgba(170, 220, 255, " + partAlpha + ")";
                    ctx.fill();
                    // Bright center
                    ctx.beginPath();
                    ctx.arc(part.x, part.y, part.size * 0.4, 0, Math.PI * 2);
                    ctx.fillStyle = "rgba(230, 245, 255, " + partAlpha + ")";
                    ctx.fill();
                    ctx.restore();
                }
            }
        }
    }

    // Draw splash rings
    for (var r = 0; r < this.splashRings.length; r++) {
        var ring = this.splashRings[r];
        ctx.save();
        ctx.beginPath();
        // Draw as an ellipse for a "splash on ground" look
        ctx.ellipse(ring.x, ring.y, ring.radius, ring.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(150, 220, 255, " + (ring.alpha * 0.8) + ")";
        ctx.lineWidth = 2;
        ctx.stroke();
        // Inner brighter ring
        ctx.beginPath();
        ctx.ellipse(ring.x, ring.y, ring.radius * 0.6, ring.radius * 0.18, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(220, 245, 255, " + (ring.alpha * 0.5) + ")";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }

    // Draw mist particles
    for (var m = 0; m < this.mistParticles.length; m++) {
        var mp = this.mistParticles[m];
        ctx.beginPath();
        ctx.arc(mp.x, mp.y, mp.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(180, 220, 255, " + mp.alpha + ")";
        ctx.fill();
    }

    ctx.restore();
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
