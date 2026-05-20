// timeReverse.js - Paradoja: Projectiles moving from outside inwards
var TimeReversePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 7;
    
    this.bullets = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.0;
    this.battleBox = null;
    this.angleOffset = 0;
};

TimeReversePattern.prototype = Object.create(BulletPattern.prototype);

TimeReversePattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.bullets = [];
    this.spawnTimer = 0.5;
    this.angleOffset = 0;
};

TimeReversePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;

    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 2) {
        this.spawnTimer = 0;
        this.angleOffset += Math.PI / 8; // Rotate the spawn ring slightly
        
        // Spawn a ring of 12 projectiles outside that move towards the center
        var numProjectiles = 12;
        var radius = 300; // Far outside the box
        var speed = 150; // Fast inwards
        
        for (var i = 0; i < numProjectiles; i++) {
            var angle = this.angleOffset + (i / numProjectiles) * Math.PI * 2;
            var px = cx + Math.cos(angle) * radius;
            var py = cy + Math.sin(angle) * radius;
            
            // They fly towards the center and beyond
            this.bullets.push({
                x: px,
                y: py,
                vx: -Math.cos(angle) * speed,
                vy: -Math.sin(angle) * speed,
                angle: angle,
                size: 8,
                trail: []
            });
        }
    }

    // Update bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        
        // Save trail
        b.trail.unshift({x: b.x, y: b.y});
        if (b.trail.length > 5) b.trail.pop();
        
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        
        // If they went past center and are way outside again, remove
        if (Math.abs(b.x - cx) > 400 || Math.abs(b.y - cy) > 400) {
            this.bullets.splice(i, 1);
        }
    }
};

TimeReversePattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        
        // Draw trail
        if (b.trail.length > 0) {
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            for (var t = 0; t < b.trail.length; t++) {
                ctx.lineTo(b.trail[t].x, b.trail[t].y);
            }
            ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
            ctx.lineWidth = b.size;
            ctx.lineCap = "round";
            ctx.stroke();
        }
        
        // Draw diamond shape
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#0FF";
        ctx.fillStyle = "#FFF";
        
        ctx.beginPath();
        ctx.moveTo(0, -b.size);
        ctx.lineTo(b.size, 0);
        ctx.lineTo(0, b.size);
        ctx.lineTo(-b.size, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.rotate(-b.angle);
        ctx.translate(-b.x, -b.y);
    }
    ctx.restore();
};

TimeReversePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2;
    var cy = sy + sh / 2;
    
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (Math.abs(cx - b.x) < b.size + sw / 2 && Math.abs(cy - b.y) < b.size + sh / 2) {
            return this.damVal;
        }
    }
    return 0;
};

TimeReversePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
