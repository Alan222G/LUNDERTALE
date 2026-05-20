// timeLasers.js - Paradoja: Lasers that freeze in time then fire
var TimeLasersPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 7;
    
    this.lasers = [];
    this.spawnTimer = 0;
};

TimeLasersPattern.prototype = Object.create(BulletPattern.prototype);

TimeLasersPattern.prototype.generateBullets = function(battleBox) {
    this.elapsed = 0;
    this.lasers = [];
    this.spawnTimer = 0.5; // Initial delay
};

TimeLasersPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 1.5 && this.elapsed < this.duration - 2) {
        this.spawnTimer = 0;
        
        // Spawn 2-3 lasers horizontally or vertically
        var isHoriz = Math.random() > 0.5;
        var num = 2 + Math.floor(Math.random() * 2);
        
        for (var i = 0; i < num; i++) {
            if (isHoriz) {
                this.lasers.push({
                    x: bb[0],
                    y: bb[1] + 20 + Math.random() * (bb[3] - bb[1] - 40),
                    w: bb[2] - bb[0],
                    h: 20,
                    horiz: true,
                    timer: 0,
                    telegraph: 0.8,
                    activeTime: 0.4
                });
            } else {
                this.lasers.push({
                    x: bb[0] + 20 + Math.random() * (bb[2] - bb[0] - 40),
                    y: bb[1],
                    w: 20,
                    h: bb[3] - bb[1],
                    horiz: false,
                    timer: 0,
                    telegraph: 0.8,
                    activeTime: 0.4
                });
            }
        }
    }
    
    for (var i = this.lasers.length - 1; i >= 0; i--) {
        var l = this.lasers[i];
        l.timer += dt;
        if (l.timer > l.telegraph + l.activeTime) {
            this.lasers.splice(i, 1);
        }
    }
};

TimeLasersPattern.prototype.draw = function(ctx) {
    ctx.save();
    
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        
        if (l.timer < l.telegraph) {
            // Telegraph
            ctx.fillStyle = "rgba(0, 255, 255, 0.3)";
            ctx.fillRect(l.x, l.y, l.w, l.h);
            
            ctx.strokeStyle = (Math.floor(l.timer * 20) % 2 === 0) ? "#FFF" : "#0FF";
            ctx.lineWidth = 1;
            ctx.strokeRect(l.x, l.y, l.w, l.h);
        } else {
            // Fire
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#0FF";
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.fillRect(l.x, l.y, l.w, l.h);
            
            ctx.shadowBlur = 0;
            ctx.fillStyle = "rgba(0, 255, 255, 0.5)";
            if (l.horiz) {
                ctx.fillRect(l.x, l.y - 5, l.w, l.h + 10);
            } else {
                ctx.fillRect(l.x - 5, l.y, l.w + 10, l.h);
            }
        }
    }
    
    ctx.restore();
};

TimeLasersPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var px = sx + sw / 2;
    var py = sy + sh / 2;
    var pr = sw / 2;
    
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.timer >= l.telegraph && l.timer <= l.telegraph + l.activeTime) {
            if (l.horiz) {
                if (Math.abs(py - (l.y + l.h/2)) < l.h/2 + pr) return this.damVal;
            } else {
                if (Math.abs(px - (l.x + l.w/2)) < l.w/2 + pr) return this.damVal;
            }
        }
    }
    return 0;
};

TimeLasersPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.lasers.length === 0;
};
