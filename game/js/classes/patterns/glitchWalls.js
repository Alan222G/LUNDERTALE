// glitchWalls.js - Paradoja: Rectangular damage zones appear randomly
var GlitchWallsPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
    
    this.zones = [];
    this.spawnTimer = 0;
};

GlitchWallsPattern.prototype = Object.create(BulletPattern.prototype);

GlitchWallsPattern.prototype.generateBullets = function(battleBox) {
    this.elapsed = 0;
    this.zones = [];
    this.spawnTimer = 0.5;
};

GlitchWallsPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    
    // Spawn zones fast
    if (this.spawnTimer >= 0.8 && this.elapsed < this.duration - 1) {
        this.spawnTimer = 0;
        
        // Horizontal or vertical wall
        var isHoriz = Math.random() > 0.5;
        
        var zx, zy, zw, zh;
        if (isHoriz) {
            zw = bb[2] - bb[0];
            zh = 30 + Math.random() * 40;
            zx = bb[0];
            zy = bb[1] + Math.random() * (bb[3] - bb[1] - zh);
        } else {
            zw = 30 + Math.random() * 40;
            zh = bb[3] - bb[1];
            zx = bb[0] + Math.random() * (bb[2] - bb[0] - zw);
            zy = bb[1];
        }
        
        this.zones.push({
            x: zx,
            y: zy,
            w: zw,
            h: zh,
            timer: 0,
            telegraph: 0.6, // 0.6s warning
            activeTime: 0.5 // 0.5s damage
        });
    }
    
    for (var i = this.zones.length - 1; i >= 0; i--) {
        var z = this.zones[i];
        z.timer += dt;
        if (z.timer > z.telegraph + z.activeTime) {
            this.zones.splice(i, 1);
        }
    }
};

GlitchWallsPattern.prototype.draw = function(ctx) {
    ctx.save();
    
    for (var i = 0; i < this.zones.length; i++) {
        var z = this.zones[i];
        
        if (z.timer < z.telegraph) {
            // Telegraph
            ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
            ctx.fillRect(z.x, z.y, z.w, z.h);
            
            // Draw warning border
            ctx.strokeStyle = (Math.floor(z.timer * 20) % 2 === 0) ? "#FFF" : "#F00";
            ctx.lineWidth = 1;
            ctx.strokeRect(z.x, z.y, z.w, z.h);
        } else {
            // Active damage
            // Static glitch effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#F0F";
            
            for (var g = 0; g < 5; g++) {
                ctx.fillStyle = Math.random() > 0.5 ? "#FFF" : "#F0F";
                var gHeight = z.h / 5;
                ctx.fillRect(
                    z.x + (Math.random()-0.5)*10, 
                    z.y + g * gHeight, 
                    z.w, 
                    gHeight
                );
            }
        }
    }
    
    ctx.restore();
};

GlitchWallsPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var px = sx + sw / 2;
    var py = sy + sh / 2;
    var r = sw / 2;
    
    for (var i = 0; i < this.zones.length; i++) {
        var z = this.zones[i];
        if (z.timer >= z.telegraph && z.timer <= z.telegraph + z.activeTime) {
            // AABB collision approximation
            var nearestX = Math.max(z.x, Math.min(px, z.x + z.w));
            var nearestY = Math.max(z.y, Math.min(py, z.y + z.h));
            var dx = px - nearestX;
            var dy = py - nearestY;
            if (dx*dx + dy*dy < r*r) {
                return this.damVal;
            }
        }
    }
    return 0;
};

GlitchWallsPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.zones.length === 0;
};
