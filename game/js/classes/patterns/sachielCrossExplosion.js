// sachielCrossExplosion.js - Iconic Evangelion cross-shaped explosions
var SachielCrossExplosionPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 12;
    this.crosses = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.3;
    // VFX arrays
    this.particles = [];
    this.shockwaves = [];
    this.flashes = [];
    this.screenShake = { x: 0, y: 0, intensity: 0 };
};

SachielCrossExplosionPattern.prototype = Object.create(BulletPattern.prototype);

SachielCrossExplosionPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 2) {
        this.spawnTimer = 0;
        
        // Spawn 1 to 2 crosses
        var numCrosses = 1 + Math.floor(Math.random() * 2);
        for (var i = 0; i < numCrosses; i++) {
            this.crosses.push({
                x: bb[0] + 20 + Math.random() * (bb[2] - bb[0] - 40),
                y: bb[1] + 20 + Math.random() * (bb[3] - bb[1] - 40),
                state: "WARN", // WARN -> EXPLODE
                timer: 0,
                warnTime: 1.3,
                explodeTime: 1.2,
                width: 25, // Width of the beams
                height: 1000 // Huge beams extending out
            });
        }
        
        if (this.spawnInterval > 0.8) this.spawnInterval -= 0.1;
    }
    
    for (var i = this.crosses.length - 1; i >= 0; i--) {
        var c = this.crosses[i];
        c.timer += dt;
        
        if (c.state === "WARN") {
            if (c.timer >= c.warnTime) {
                c.state = "EXPLODE";
                c.timer = 0;
                // VFX: spawn shockwave rings on explosion
                this.shockwaves.push({
                    x: c.x, y: c.y,
                    radius: 0, maxRadius: 120,
                    alpha: 1.0, life: 0, maxLife: 0.5
                });
                this.shockwaves.push({
                    x: c.x, y: c.y,
                    radius: 0, maxRadius: 70,
                    alpha: 0.8, life: 0, maxLife: 0.35
                });
                // VFX: bright initial flash
                this.flashes.push({
                    x: c.x, y: c.y,
                    life: 0.15, maxLife: 0.15,
                    radius: 60
                });
                // VFX: screen shake on explosion
                this.screenShake.intensity = Math.min(this.screenShake.intensity + 5, 8);
                // VFX: spawn debris particles
                for (var d = 0; d < 16; d++) {
                    var angle = Math.random() * Math.PI * 2;
                    var spd = 80 + Math.random() * 250;
                    this.particles.push({
                        x: c.x, y: c.y,
                        vx: Math.cos(angle) * spd,
                        vy: Math.sin(angle) * spd,
                        life: 0.4 + Math.random() * 0.5,
                        maxLife: 0.4 + Math.random() * 0.5,
                        size: 1.5 + Math.random() * 3,
                        type: "debris",
                        color: Math.random() > 0.5 ? "gold" : "orange"
                    });
                    this.particles[this.particles.length - 1].maxLife = this.particles[this.particles.length - 1].life;
                }
            }
        } else if (c.state === "EXPLODE") {
            if (c.timer >= c.explodeTime) {
                this.crosses.splice(i, 1);
            }
        }
    }

    // VFX: update particles
    for (var i = this.particles.length - 1; i >= 0; i--) {
        var p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.97; // friction
        p.vy *= 0.97;
        p.life -= dt;
        if (p.life <= 0) this.particles.splice(i, 1);
    }

    // VFX: update shockwaves
    for (var i = this.shockwaves.length - 1; i >= 0; i--) {
        var sw = this.shockwaves[i];
        sw.life += dt;
        var prog = sw.life / sw.maxLife;
        sw.radius = sw.maxRadius * prog;
        sw.alpha = (1.0 - prog) * 0.9;
        if (sw.life >= sw.maxLife) this.shockwaves.splice(i, 1);
    }

    // VFX: update flashes
    for (var i = this.flashes.length - 1; i >= 0; i--) {
        var f = this.flashes[i];
        f.life -= dt;
        if (f.life <= 0) this.flashes.splice(i, 1);
    }

    // VFX: decay screen shake
    if (this.screenShake.intensity > 0) {
        this.screenShake.x = (Math.random() - 0.5) * 2 * this.screenShake.intensity;
        this.screenShake.y = (Math.random() - 0.5) * 2 * this.screenShake.intensity;
        this.screenShake.intensity *= 0.85;
        if (this.screenShake.intensity < 0.3) this.screenShake.intensity = 0;
    } else {
        this.screenShake.x = 0;
        this.screenShake.y = 0;
    }
};

SachielCrossExplosionPattern.prototype.draw = function(ctx) {
    // VFX: apply screen shake
    ctx.save();
    ctx.translate(this.screenShake.x, this.screenShake.y);

    for (var i = 0; i < this.crosses.length; i++) {
        var c = this.crosses[i];
        
        if (c.state === "WARN") {
            // Draw warning orb
            var pulse = Math.abs(Math.sin(this.elapsed * 15)) * 10;

            // VFX: rotating energy lines around the orb
            ctx.save();
            ctx.translate(c.x, c.y);
            var numLines = 6;
            var orbRadius = 5 + pulse;
            for (var r = 0; r < numLines; r++) {
                var lineAngle = this.elapsed * 3.5 + (r / numLines) * Math.PI * 2;
                var innerR = orbRadius + 4;
                var outerR = orbRadius + 12 + Math.sin(this.elapsed * 8 + r) * 4;
                var lx1 = Math.cos(lineAngle) * innerR;
                var ly1 = Math.sin(lineAngle) * innerR;
                var lx2 = Math.cos(lineAngle) * outerR;
                var ly2 = Math.sin(lineAngle) * outerR;
                ctx.strokeStyle = "rgba(255, 220, 80, " + (0.4 + Math.sin(this.elapsed * 10 + r) * 0.2) + ")";
                ctx.lineWidth = 1.5;
                ctx.shadowBlur = 6;
                ctx.shadowColor = "#FFD700";
                ctx.beginPath();
                ctx.moveTo(lx1, ly1);
                ctx.lineTo(lx2, ly2);
                ctx.stroke();
            }
            ctx.restore();
            
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#FFD700"; // Golden glow
            
            // VFX: outer orb glow ring
            ctx.save();
            ctx.strokeStyle = "rgba(255, 200, 50, " + (0.2 + Math.sin(this.elapsed * 12) * 0.1) + ")";
            ctx.lineWidth = 2;
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#FFD700";
            ctx.beginPath();
            ctx.arc(c.x, c.y, orbRadius + 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.beginPath();
            ctx.arc(c.x, c.y, 5 + pulse, 0, Math.PI * 2);
            ctx.fill();
            
            // Thin warning laser lines
            ctx.shadowBlur = 0;

            // VFX: pulsing glow on warning lines
            var warnPulse = 0.3 + Math.sin(this.elapsed * 20) * 0.1;
            ctx.save();
            ctx.strokeStyle = "rgba(255, 200, 0, " + (warnPulse * 0.4) + ")";
            ctx.lineWidth = 6;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "rgba(255, 200, 0, 0.3)";
            ctx.beginPath();
            ctx.moveTo(c.x, c.y - 500); ctx.lineTo(c.x, c.y + 500);
            ctx.moveTo(c.x - 500, c.y); ctx.lineTo(c.x + 500, c.y);
            ctx.stroke();
            ctx.restore();

            ctx.strokeStyle = "rgba(255, 200, 0, 0.3)";
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.moveTo(c.x, c.y - 500); ctx.lineTo(c.x, c.y + 500);
            ctx.moveTo(c.x - 500, c.y); ctx.lineTo(c.x + 500, c.y);
            ctx.stroke();
            
        } else if (c.state === "EXPLODE") {
            // Giant cross explosion
            var alpha = 1.0;
            if (c.timer > c.explodeTime - 0.3) {
                alpha = (c.explodeTime - c.timer) / 0.3; // Fade out
            }
            
            var scale = 1.0;
            if (c.timer < 0.1) {
                scale = c.timer / 0.1; // Blast expanding
            }
            
            var curWidth = c.width * scale;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            ctx.shadowBlur = 30;
            ctx.shadowColor = "#FFD700";
            
            // Draw vertical and horizontal beams
            var gradX = ctx.createLinearGradient(c.x - curWidth/2, 0, c.x + curWidth/2, 0);
            gradX.addColorStop(0, "rgba(255, 150, 0, 0)");
            gradX.addColorStop(0.2, "rgba(255, 200, 50, 0.8)");
            gradX.addColorStop(0.5, "#FFFFFF");
            gradX.addColorStop(0.8, "rgba(255, 200, 50, 0.8)");
            gradX.addColorStop(1, "rgba(255, 150, 0, 0)");
            
            var gradY = ctx.createLinearGradient(0, c.y - curWidth/2, 0, c.y + curWidth/2);
            gradY.addColorStop(0, "rgba(255, 150, 0, 0)");
            gradY.addColorStop(0.2, "rgba(255, 200, 50, 0.8)");
            gradY.addColorStop(0.5, "#FFFFFF");
            gradY.addColorStop(0.8, "rgba(255, 200, 50, 0.8)");
            gradY.addColorStop(1, "rgba(255, 150, 0, 0)");
            
            // Vertical beam
            ctx.fillStyle = gradX;
            ctx.fillRect(c.x - curWidth/2, c.y - c.height/2, curWidth, c.height);
            
            // Horizontal beam
            ctx.fillStyle = gradY;
            ctx.fillRect(c.x - c.height/2, c.y - curWidth/2, c.height, curWidth);

            // VFX: heat shimmer lines along beams
            var shimmerCount = 5;
            for (var s = 0; s < shimmerCount; s++) {
                var shimmerOffset = (s - shimmerCount / 2) * (curWidth * 0.4);
                var shimmerWave = Math.sin(this.elapsed * 15 + s * 2) * 3;
                ctx.strokeStyle = "rgba(255, 255, 200, " + (alpha * 0.15) + ")";
                ctx.lineWidth = 1;
                // vertical shimmer
                ctx.beginPath();
                ctx.moveTo(c.x + shimmerOffset + shimmerWave, c.y - c.height / 2);
                ctx.quadraticCurveTo(
                    c.x + shimmerOffset - shimmerWave, c.y,
                    c.x + shimmerOffset + shimmerWave, c.y + c.height / 2
                );
                ctx.stroke();
                // horizontal shimmer
                ctx.beginPath();
                ctx.moveTo(c.x - c.height / 2, c.y + shimmerOffset + shimmerWave);
                ctx.quadraticCurveTo(
                    c.x, c.y + shimmerOffset - shimmerWave,
                    c.x + c.height / 2, c.y + shimmerOffset + shimmerWave
                );
                ctx.stroke();
            }
            
            ctx.restore();
        }
    }

    // VFX: draw shockwave rings
    for (var i = 0; i < this.shockwaves.length; i++) {
        var sw = this.shockwaves[i];
        ctx.save();
        ctx.strokeStyle = "rgba(255, 200, 50, " + sw.alpha + ")";
        ctx.lineWidth = 3 * (1 - sw.life / sw.maxLife) + 1;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(255, 180, 0, " + sw.alpha * 0.5 + ")";
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        // inner bright ring
        ctx.strokeStyle = "rgba(255, 255, 200, " + sw.alpha * 0.4 + ")";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // VFX: draw explosion flashes
    for (var i = 0; i < this.flashes.length; i++) {
        var f = this.flashes[i];
        var fAlpha = f.life / f.maxLife;
        ctx.save();
        ctx.globalAlpha = fAlpha * 0.7;
        var flashGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * (1 + (1 - fAlpha) * 0.5));
        flashGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
        flashGrad.addColorStop(0.3, "rgba(255, 240, 150, 0.8)");
        flashGrad.addColorStop(0.7, "rgba(255, 180, 0, 0.3)");
        flashGrad.addColorStop(1, "rgba(255, 100, 0, 0)");
        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius * (1 + (1 - fAlpha) * 0.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // VFX: draw debris particles
    for (var i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        var pAlpha = p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = pAlpha;
        ctx.shadowBlur = 4;
        ctx.shadowColor = p.color === "gold" ? "#FFD700" : "#FF8800";
        ctx.fillStyle = p.color === "gold" ? "rgba(255, 215, 0, 1)" : "rgba(255, 140, 0, 1)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * pAlpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    ctx.restore(); // end screen shake
};

SachielCrossExplosionPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.crosses.length; i++) {
        var c = this.crosses[i];
        if (c.state === "EXPLODE" && c.timer > 0.1 && c.timer < c.explodeTime - 0.2) {
            // Hitbox for vertical beam
            if (sx + sw > c.x - c.width/3 && sx < c.x + c.width/3) {
                return this.damVal;
            }
            // Hitbox for horizontal beam
            if (sy + sh > c.y - c.width/3 && sy < c.y + c.width/3) {
                return this.damVal;
            }
        }
    }
    return 0;
};

SachielCrossExplosionPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.crosses.length === 0;
};
