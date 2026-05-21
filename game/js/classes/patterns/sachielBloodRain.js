// sachielBloodRain.js - Heavy rain of purple/red blood that pools at the bottom
var SachielBloodRainPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    
    this.drops = [];
    this.spawnTimer = 0;
    this.spawnInterval = 0.15;
    
    // Blood pool at bottom
    this.poolHeight = 0;
    this.maxPoolHeight = 120; // Will cover the bottom portion of the box
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
            this.drops.push({
                x: bb[0] + Math.random() * (bb[2] - bb[0]),
                y: bb[1] - 20, // Start above
                vx: (Math.random() - 0.5) * 20, // Slight wind
                vy: 200 + Math.random() * 100, // Falling fast
                radius: 3 + Math.random() * 3,
                active: true
            });
        }
        
        if (this.spawnInterval > 0.05) this.spawnInterval -= 0.01;
    }
    
    // Update drops
    for (var i = this.drops.length - 1; i >= 0; i--) {
        var d = this.drops[i];
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.vy += 200 * dt; // Gravity
        
        // If it hits the pool (or bottom)
        if (d.y >= bb[3] - this.poolHeight) {
            // Increase pool height slightly
            if (this.elapsed < this.duration - 2 && this.poolHeight < this.maxPoolHeight) {
                this.poolHeight += d.radius * 0.15;
            }
            this.drops.splice(i, 1);
        }
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
        
        ctx.fillStyle = "rgba(120, 0, 80, 0.8)"; // Dark purple/red blood
        ctx.fillRect(bb[0], bb[3] - this.poolHeight + pulse, bb[2] - bb[0], this.poolHeight - pulse);
        
        // Surface highlight
        ctx.fillStyle = "rgba(200, 0, 100, 0.9)";
        ctx.fillRect(bb[0], bb[3] - this.poolHeight + pulse, bb[2] - bb[0], 4);
    }
    
    // Draw drops
    ctx.fillStyle = "#A00050";
    for (var i = 0; i < this.drops.length; i++) {
        var d = this.drops[i];
        ctx.beginPath();
        // Draw tear-drop shape
        ctx.moveTo(d.x, d.y - d.radius * 2);
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI);
        ctx.fill();
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
