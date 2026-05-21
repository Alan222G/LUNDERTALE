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
    
    var bb = Cbbox.getBound();
    var isFiring = false;
    
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        
        if (l.timer < l.telegraph) {
            // Telegraph with vacuum particles
            var progress = l.timer / l.telegraph;
            
            // Growing glow zone
            ctx.fillStyle = "rgba(0, 255, 255, " + (0.05 + progress * 0.2) + ")";
            ctx.fillRect(l.x, l.y, l.w, l.h);
            
            // Pulsing border
            ctx.strokeStyle = "rgba(0, 255, 255, " + (0.3 + Math.sin(l.timer * 25) * 0.3) + ")";
            ctx.lineWidth = 1 + progress * 2;
            ctx.strokeRect(l.x, l.y, l.w, l.h);
            
            // Vacuum particles being sucked toward the laser
            var numParts = Math.floor(progress * 12);
            for (var p = 0; p < numParts; p++) {
                var seed = l.timer * 3 + p * 1.7;
                var t = (seed % 1.0); // 0-1 cycling
                var cx, cy;
                if (l.horiz) {
                    cx = l.x + Math.random() * l.w;
                    cy = l.y + l.h/2 + (1 - t) * (Math.random() > 0.5 ? 1 : -1) * 60;
                } else {
                    cx = l.x + l.w/2 + (1 - t) * (Math.random() > 0.5 ? 1 : -1) * 60;
                    cy = l.y + Math.random() * l.h;
                }
                ctx.fillStyle = "rgba(0, 255, 255, " + (t * 0.8) + ")";
                ctx.beginPath();
                ctx.arc(cx, cy, 2 * (1 - t), 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Fire phase
            isFiring = true;
            if (!l.soundPlayed) {
                Sound.playSound("select", true);
                l.soundPlayed = true;
            }
            
            var fadeProgress = (l.timer - l.telegraph) / l.activeTime;
            
            // Intense bloom
            ctx.globalCompositeOperation = "lighter";
            ctx.shadowBlur = 35;
            ctx.shadowColor = "#00FFFF";
            
            // Outer glow
            ctx.fillStyle = "rgba(0, 200, 255, " + (0.8 * (1 - fadeProgress)) + ")";
            if (l.horiz) {
                ctx.fillRect(l.x, l.y - 8, l.w, l.h + 16);
            } else {
                ctx.fillRect(l.x - 8, l.y, l.w + 16, l.h);
            }
            
            // Core white
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#FFFFFF";
            ctx.fillStyle = "rgba(255, 255, 255, " + (1 - fadeProgress) + ")";
            ctx.fillRect(l.x, l.y, l.w, l.h);
            
            // Sparks flying off
            ctx.shadowBlur = 0;
            for (var s = 0; s < 6; s++) {
                var sx, sy;
                if (l.horiz) {
                    sx = l.x + Math.random() * l.w;
                    sy = l.y + l.h/2 + (Math.random() - 0.5) * (l.h + 30);
                } else {
                    sx = l.x + l.w/2 + (Math.random() - 0.5) * (l.w + 30);
                    sy = l.y + Math.random() * l.h;
                }
                ctx.fillStyle = Math.random() > 0.5 ? "#00FFFF" : "#FFFFFF";
                ctx.beginPath();
                ctx.arc(sx, sy, Math.random() * 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalCompositeOperation = "source-over";
        }
    }
    
    // Screen shake when firing
    if (isFiring) {
        ctx.translate((Math.random()-0.5)*6, (Math.random()-0.5)*6);
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
