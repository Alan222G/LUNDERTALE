// sachielBloodRain.js - Heavy rain of purple/red blood that pools at the bottom
var SachielBloodRainPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    
    this.drops = [];
    this.spawnTimer = 0;
    this.spawnInterval = 0.35; // Was 0.15
    
    // Blood pool at bottom
    this.poolHeight = 0;
    this.maxPoolHeight = 70; // Half of 140 (combat box height)
    // VFX particles
    this.splashes = [];
    this.mist = [];
    this.dropColors = [
        [160, 0, 80], [180, 0, 50], [140, 0, 100],
        [120, 10, 90], [200, 0, 60], [150, 20, 70]
    ];
};

SachielBloodRainPattern.prototype = Object.create(BulletPattern.prototype);

SachielBloodRainPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    
    // Spawn drops
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 2) {
        this.spawnTimer = 0;
        
        var numDrops = 1 + Math.floor(Math.random() * 3);
        for (var i = 0; i < numDrops; i++) {
            var col = this.dropColors[Math.floor(Math.random() * this.dropColors.length)];
            var isHeavy = Math.random() < 0.12; // 12% chance for a heavy drop
            this.drops.push({
                x: bb[0] + Math.random() * (bb[2] - bb[0]),
                y: bb[1] - 20, // Start above
                vx: (Math.random() - 0.5) * 20, // Slight wind
                vy: 200 + Math.random() * 100, // Falling fast
                radius: isHeavy ? (5 + Math.random() * 3) : (3 + Math.random() * 3),
                active: true,
                color: col,
                heavy: isHeavy,
                prevY: bb[1] - 20
            });
        }
        
        if (this.spawnInterval > 0.15) this.spawnInterval -= 0.01;
    }
    
    // Drain pool at the end
    if (this.elapsed >= this.duration - 2 && this.poolHeight > 0) {
        this.poolHeight -= 40 * dt;
        if (this.poolHeight < 0) this.poolHeight = 0;
    }
    
    // Update drops
    for (var i = this.drops.length - 1; i >= 0; i--) {
        var d = this.drops[i];
        d.prevY = d.y;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.vy += 200 * dt; // Gravity
        
        // If it hits the pool (or bottom)
        if (d.y >= bb[3] - this.poolHeight) {
            // Increase pool height slightly
            if (this.elapsed < this.duration - 2 && this.poolHeight < this.maxPoolHeight) {
                this.poolHeight += d.radius * 0.15;
            }
            // VFX: Spawn splash particles
            var splashCount = d.heavy ? 8 : 4;
            for (var s = 0; s < splashCount; s++) {
                var angle = Math.PI + (Math.random() - 0.5) * Math.PI;
                var spd = 40 + Math.random() * (d.heavy ? 80 : 50);
                this.splashes.push({
                    x: d.x + (Math.random() - 0.5) * 4,
                    y: bb[3] - this.poolHeight,
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd - 20,
                    life: 0.3 + Math.random() * 0.3,
                    maxLife: 0.6,
                    size: 1 + Math.random() * (d.heavy ? 3 : 1.5),
                    color: d.color || [160, 0, 80]
                });
            }
            this.drops.splice(i, 1);
        }
    }
    
    // VFX: Update splashes
    for (var i = this.splashes.length - 1; i >= 0; i--) {
        var sp = this.splashes[i];
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.vy += 120 * dt; // Gravity on splashes
        sp.life -= dt;
        if (sp.life <= 0) this.splashes.splice(i, 1);
    }

    // VFX: Spawn mist from pool
    if (this.poolHeight > 5 && Math.random() < 0.25) {
        this.mist.push({
            x: bb[0] + Math.random() * (bb[2] - bb[0]),
            y: bb[3] - this.poolHeight + Math.random() * 5,
            vx: (Math.random() - 0.5) * 10,
            vy: -(10 + Math.random() * 20),
            life: 0.8 + Math.random() * 0.6,
            maxLife: 1.4,
            size: 4 + Math.random() * 8
        });
    }
    for (var i = this.mist.length - 1; i >= 0; i--) {
        var v = this.mist[i];
        v.x += v.vx * dt;
        v.y += v.vy * dt;
        v.size += 4 * dt; // Expand over time
        v.life -= dt;
        if (v.life <= 0) this.mist.splice(i, 1);
    }

    // Drain pool at the end
    if (this.elapsed > this.duration - 2) {
        this.poolHeight -= 80 * dt;
        if (this.poolHeight < 0) this.poolHeight = 0;
    }
};

SachielBloodRainPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    
    // Draw pool at bottom
    if (this.poolHeight > 0) {
        // Bubbling effect
        var pulse = Math.sin(this.elapsed * 10) * 3;
        var poolTop = bb[3] - this.poolHeight + pulse;
        var poolW = bb[2] - bb[0];
        
        // VFX: Pulsing glow underneath pool
        ctx.save();
        var glowPulse = 0.15 + Math.sin(this.elapsed * 4) * 0.08;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(200, 0, 80, " + glowPulse.toFixed(2) + ")";
        
        // Pool gradient body
        var poolGrad = ctx.createLinearGradient(bb[0], poolTop, bb[0], bb[3]);
        poolGrad.addColorStop(0, "rgba(150, 0, 90, 0.75)");
        poolGrad.addColorStop(0.4, "rgba(120, 0, 80, 0.85)");
        poolGrad.addColorStop(1, "rgba(80, 0, 60, 0.9)");
        ctx.fillStyle = poolGrad;
        ctx.fillRect(bb[0], poolTop, poolW, this.poolHeight - pulse);
        
        // Surface highlight with animated shimmer
        var surfGrad = ctx.createLinearGradient(bb[0], poolTop, bb[0] + poolW, poolTop);
        var shimOffset = (Math.sin(this.elapsed * 3) * 0.5 + 0.5);
        surfGrad.addColorStop(Math.max(0, shimOffset - 0.3), "rgba(200, 0, 100, 0.6)");
        surfGrad.addColorStop(shimOffset, "rgba(255, 60, 140, 0.95)");
        surfGrad.addColorStop(Math.min(1, shimOffset + 0.3), "rgba(200, 0, 100, 0.6)");
        ctx.fillStyle = surfGrad;
        ctx.fillRect(bb[0], poolTop, poolW, 4);
        
        // Subtle secondary surface line
        ctx.fillStyle = "rgba(255, 150, 200, 0.2)";
        ctx.fillRect(bb[0], poolTop + 1, poolW, 1);
        ctx.restore();
    }
    
    // --- VFX: Draw mist/vapor rising from pool ---
    for (var i = 0; i < this.mist.length; i++) {
        var v = this.mist[i];
        var vAlpha = (v.life / v.maxLife) * 0.3;
        ctx.save();
        ctx.globalAlpha = vAlpha;
        var mistGrad = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, v.size);
        mistGrad.addColorStop(0, "rgba(180, 0, 80, 0.4)");
        mistGrad.addColorStop(1, "rgba(100, 0, 60, 0)");
        ctx.fillStyle = mistGrad;
        ctx.beginPath();
        ctx.arc(v.x, v.y, v.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    // --- VFX: Draw splash particles ---
    for (var i = 0; i < this.splashes.length; i++) {
        var sp = this.splashes[i];
        var spAlpha = sp.life / sp.maxLife;
        ctx.save();
        ctx.globalAlpha = spAlpha;
        ctx.fillStyle = "rgba(" + sp.color[0] + "," + sp.color[1] + "," + sp.color[2] + "," + spAlpha.toFixed(2) + ")";
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size * spAlpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    // Draw drops with trailing streaks and color variation
    for (var i = 0; i < this.drops.length; i++) {
        var d = this.drops[i];
        var col = d.color || [160, 0, 80];
        
        // VFX: Trailing streak behind drop
        ctx.save();
        var trailLen = d.heavy ? d.radius * 5 : d.radius * 3;
        var trailGrad = ctx.createLinearGradient(d.x, d.y - d.radius * 2 - trailLen, d.x, d.y);
        trailGrad.addColorStop(0, "rgba(" + col[0] + "," + col[1] + "," + col[2] + ", 0)");
        trailGrad.addColorStop(1, "rgba(" + col[0] + "," + col[1] + "," + col[2] + ", 0.5)");
        ctx.strokeStyle = trailGrad;
        ctx.lineWidth = d.heavy ? d.radius * 0.9 : d.radius * 0.6;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - d.radius * 2 - trailLen);
        ctx.lineTo(d.x, d.y - d.radius * 2);
        ctx.stroke();
        ctx.restore();
        
        // Main drop body
        ctx.save();
        if (d.heavy) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(" + col[0] + "," + col[1] + "," + col[2] + ", 0.7)";
        }
        ctx.fillStyle = "rgb(" + col[0] + "," + col[1] + "," + col[2] + ")";
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - d.radius * 2);
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI);
        ctx.fill();
        
        // VFX: Bright specular highlight on drop
        ctx.fillStyle = "rgba(255, 150, 200, 0.35)";
        ctx.beginPath();
        ctx.arc(d.x - d.radius * 0.3, d.y - d.radius * 0.2, d.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
};

SachielBloodRainPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    var soulCX = sx + sw / 2;
    var soulCY = sy + sh / 2;
    
    // Check pool collision (if soul touches the surface)
    var surfaceY = bb[3] - this.poolHeight;
    if (sy + sh > surfaceY) {
        return this.damVal;
    }
    
    // Check drop collision
    for (var i = 0; i < this.drops.length; i++) {
        var d = this.drops[i];
        var dx = soulCX - d.x;
        var dy = soulCY - d.y;
        if (Math.sqrt(dx*dx + dy*dy) < d.radius + sw/2) {
            this.drops.splice(i, 1);
            return this.damVal;
        }
    }
    
    return 0;
};

SachielBloodRainPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.drops.length === 0 && this.poolHeight <= 0;
};
