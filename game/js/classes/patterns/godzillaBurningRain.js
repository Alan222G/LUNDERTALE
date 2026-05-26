// godzillaBurningRain.js — Burning Rain attack for Godzilla Phase 3 (Meltdown).
// Heavy rain of pink burning magma balls that fall vertically. Upon touching the box floor, they create small burning magma pools that damage on contact.
var GodzillaBurningRainPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    
    this.rainTimer = 0;
    this.rainInterval = 0.16; // Rapid falling raindrops
    this.pools = [];
    this.bullets = [];
};

GodzillaBurningRainPattern.prototype = Object.create(BulletPattern.prototype);

GodzillaBurningRainPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.rainTimer = 0;
    this.pools = [];
    this.bullets = [];
};

GodzillaBurningRainPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    
    // 1. Spawn falling magma bullets
    if (this.elapsed < this.duration - 2.0) {
        this.rainTimer += dt;
        if (this.rainTimer >= this.rainInterval) {
            this.rainTimer = 0;
            
            // Random horizontal spawning position
            var rx = bb[0] + 15 + Math.random() * (boxW - 30);
            var fallSpeed = 220 + Math.random() * 80;
            
            this.bullets.push(new Bullet({
                x: rx - 6,
                y: bb[1] - 15,
                width: 12, height: 12,
                speed: 0,
                damVal: this.damVal,
                rotation: 0, fadeSpeed: 1.0, color: "#FF007F",
                vx: 0, vy: fallSpeed, useVelocity: true
            }));
        }
    }
    
    // 2. Update falling bullets and check floor impact
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        
        // Check floor impact
        if (b.y + b.height >= bb[3]) {
            // Spawn a magma pool on the floor
            this.pools.push({
                x: b.x + b.width / 2,
                y: bb[3],
                width: 32,
                height: 10,
                timer: 0,
                duration: 1.6, // Magma pool lasts 1.6s
                fadeStart: 1.2
            });
            
            Sound.playSound("impact", true);
            this.bullets.splice(i, 1);
            continue;
        }
        
        // Out of bounds check (shouldn't happen because of floor check, but safe fallback)
        if (b.isOutOfBounds([bb[0]-50, bb[1]-50, bb[2]+50, bb[3]+50])) {
            this.bullets.splice(i, 1);
        }
    }
    
    // 3. Update magma pools
    for (var i = this.pools.length - 1; i >= 0; i--) {
        var pool = this.pools[i];
        pool.timer += dt;
        if (pool.timer >= pool.duration) {
            this.pools.splice(i, 1);
        }
    }
};

GodzillaBurningRainPattern.prototype.draw = function(ctx) {
    ctx.save();
    
    var glowColor = "rgba(255, 0, 128, 0.75)";
    var coreColor = "#FF007F";
    
    // 1. Draw falling fireballs
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        
        var bx = b.x + b.width / 2;
        var by = b.y + b.height / 2;
        
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = glowColor;
        ctx.fillStyle = coreColor;
        
        ctx.beginPath();
        ctx.arc(bx, by, b.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw trailing flame particle
        ctx.fillStyle = "rgba(255, 64, 150, 0.4)";
        ctx.beginPath();
        ctx.moveTo(bx - 5, by);
        ctx.lineTo(bx, by - 14);
        ctx.lineTo(bx + 5, by);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    // 2. Draw magma pools
    for (var i = 0; i < this.pools.length; i++) {
        var pool = this.pools[i];
        var opacity = 1.0;
        if (pool.timer > pool.fadeStart) {
            opacity = 1.0 - (pool.timer - pool.fadeStart) / (pool.duration - pool.fadeStart);
        }
        
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.shadowBlur = 14;
        ctx.shadowColor = glowColor;
        
        // Oval base
        ctx.fillStyle = "#FF4500"; // Red/Orange lava core
        ctx.beginPath();
        ctx.ellipse(pool.x, pool.y - 3, pool.width / 2, pool.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Shimmering outer edge
        ctx.strokeStyle = coreColor;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.ellipse(pool.x, pool.y - 3, pool.width / 2 + Math.sin(pool.timer * 8) * 1.5, pool.height / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    ctx.restore();
};

GodzillaBurningRainPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    // Check falling fireballs collision
    var dmg = BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
    if (dmg > 0) return dmg;
    
    // Check magma pools contact collision
    for (var i = 0; i < this.pools.length; i++) {
        var pool = this.pools[i];
        if (pool.timer > pool.duration - 0.15) continue; // Skip fading pools
        
        // Simple overlap checking for the pool oval bounds
        var px = pool.x - pool.width / 2;
        var py = pool.y - pool.height;
        if (rectsOverlap(px, py, pool.width, pool.height + 4, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    
    return 0;
};

GodzillaBurningRainPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0 && this.pools.length === 0;
};
