// shatteredGlass.js - Paradoja: Shards of glass fall and bounce
var ShatteredGlassPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    
    this.shards = [];
    this.spawnTimer = 0;
};

ShatteredGlassPattern.prototype = Object.create(BulletPattern.prototype);

ShatteredGlassPattern.prototype.generateBullets = function(battleBox) {
    this.elapsed = 0;
    this.shards = [];
    this.spawnTimer = 0.5;
};

ShatteredGlassPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 0.4 && this.elapsed < this.duration - 2) {
        this.spawnTimer = 0;
        
        // Spawn 2-3 shards at the top
        var num = 2 + Math.floor(Math.random() * 2);
        for(var i=0; i<num; i++) {
            this.shards.push({
                x: bb[0] + 10 + Math.random() * (bb[2] - bb[0] - 20),
                y: bb[1] - 20,
                vx: (Math.random() - 0.5) * 150,
                vy: 50 + Math.random() * 100,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 10,
                size: 8 + Math.random() * 8,
                bounces: 0
            });
        }
    }
    
    for (var i = this.shards.length - 1; i >= 0; i--) {
        var s = this.shards[i];
        
        s.vy += dt * 300; // Gravity
        
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.rotation += s.rotSpeed * dt;
        
        // Bounce off walls
        if (s.x < bb[0] + s.size) {
            s.x = bb[0] + s.size;
            s.vx *= -0.8;
            s.bounces++;
        } else if (s.x > bb[2] - s.size) {
            s.x = bb[2] - s.size;
            s.vx *= -0.8;
            s.bounces++;
        }
        
        // Bounce off floor
        if (s.y > bb[3] - s.size) {
            s.y = bb[3] - s.size;
            s.vy *= -0.7; // Bounce
            s.vx *= 0.9; // Friction
            s.bounces++;
        }
        
        // Shatter after 3 bounces or if it flies out top
        if (s.bounces > 3 && s.y > bb[3] - s.size - 5) {
            this.shards.splice(i, 1); // Disappears/breaks on floor
        }
    }
};

ShatteredGlassPattern.prototype.draw = function(ctx) {
    ctx.save();
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#FFF";
    ctx.fillStyle = "rgba(200, 255, 255, 0.7)";
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 1;
    
    for (var i = 0; i < this.shards.length; i++) {
        var s = this.shards[i];
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        
        ctx.beginPath();
        ctx.moveTo(0, -s.size);
        ctx.lineTo(s.size * 0.7, s.size * 0.5);
        ctx.lineTo(-s.size * 0.4, s.size * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.rotate(-s.rotation);
        ctx.translate(-s.x, -s.y);
    }
    
    ctx.restore();
};

ShatteredGlassPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var px = sx + sw / 2;
    var py = sy + sh / 2;
    var pr = sw / 2;
    
    for (var i = 0; i < this.shards.length; i++) {
        var s = this.shards[i];
        var dx = px - s.x;
        var dy = py - s.y;
        var dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < s.size + pr) {
            return this.damVal;
        }
    }
    return 0;
};

ShatteredGlassPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.shards.length === 0;
};
