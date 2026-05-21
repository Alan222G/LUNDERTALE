// sachielEyeSpark.js - Sachiel shoots fast, bouncing golden sparks from its eyes
var SachielEyeSparkPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 6;
    this.sparks = [];
    this.spawnTimer = 0;
    this.spawnInterval = 0.4;
};

SachielEyeSparkPattern.prototype = Object.create(BulletPattern.prototype);

SachielEyeSparkPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    
    // Spawn new sparks
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        
        // Spawn 2 sparks at a time (like from two eyes)
        for (var i = 0; i < 2; i++) {
            var angle = Math.PI/2 + (Math.random() - 0.5) * 1.5; // Downwards with some spread
            var speed = 250 + Math.random() * 100;
            
            this.sparks.push({
                x: (bb[0] + bb[2]) / 2 + (i === 0 ? -20 : 20), // Left and right "eyes"
                y: bb[1] - 30, // Start slightly above the box
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 4 + Math.random() * 2,
                trail: [],
                bounces: 0,
                maxBounces: 3
            });
        }
        
        // Increase spawn rate slightly
        if (this.spawnInterval > 0.2) this.spawnInterval -= 0.05;
    }
    
    // Update sparks
    for (var i = this.sparks.length - 1; i >= 0; i--) {
        var s = this.sparks[i];
        
        // Save trail
        s.trail.push({x: s.x, y: s.y});
        if (s.trail.length > 5) s.trail.shift();
        
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        
        // Bounce logic inside the battle box
        var bounced = false;
        if (s.x - s.radius < bb[0]) { s.x = bb[0] + s.radius; s.vx *= -1; bounced = true; }
        if (s.x + s.radius > bb[2]) { s.x = bb[2] - s.radius; s.vx *= -1; bounced = true; }
        if (s.y - s.radius < bb[1] && s.vy < 0) { s.y = bb[1] + s.radius; s.vy *= -1; bounced = true; }
        if (s.y + s.radius > bb[3]) { s.y = bb[3] - s.radius; s.vy *= -1; bounced = true; }
        
        if (bounced) {
            s.bounces++;
            // Slightly speed up on bounce
            s.vx *= 1.05;
            s.vy *= 1.05;
            
            if (s.bounces > s.maxBounces) {
                this.sparks.splice(i, 1);
            }
        }
    }
};

SachielEyeSparkPattern.prototype.draw = function(ctx) {
    // Draw all sparks and their trails
    for (var i = 0; i < this.sparks.length; i++) {
        var s = this.sparks[i];
        
        ctx.save();
        
        // Draw trail
        if (s.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(s.trail[0].x, s.trail[0].y);
            for (var t = 1; t < s.trail.length; t++) {
                ctx.lineTo(s.trail[t].x, s.trail[t].y);
            }
            ctx.strokeStyle = "rgba(255, 200, 0, 0.5)";
            ctx.lineWidth = s.radius * 1.5;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
        }
        
        // Draw spark head
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#FFD700"; // Golden
        
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#FF8C00"; // Darker orange core
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
};

SachielEyeSparkPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.sparks.length; i++) {
        var s = this.sparks[i];
        
        // Simple circle-AABB collision roughly
        var closeX = Math.max(sx, Math.min(s.x, sx + sw));
        var closeY = Math.max(sy, Math.min(s.y, sy + sh));
        
        var dx = s.x - closeX;
        var dy = s.y - closeY;
        
        if ((dx * dx + dy * dy) < (s.radius * s.radius)) {
            // Hit! Remove spark so it doesn't multi-hit
            this.sparks.splice(i, 1);
            return this.damVal;
        }
    }
    return 0;
};

SachielEyeSparkPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.sparks.length === 0;
};
