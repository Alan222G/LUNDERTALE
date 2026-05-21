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
    
    var hasActive = false;
    
    for (var i = 0; i < this.zones.length; i++) {
        var z = this.zones[i];
        
        if (z.timer < z.telegraph) {
            // Telegraph — RGB scanline warning
            var progress = z.timer / z.telegraph;
            
            // Red channel offset
            ctx.fillStyle = "rgba(255, 0, 0, " + (0.1 + progress * 0.15) + ")";
            ctx.fillRect(z.x - 3, z.y, z.w, z.h);
            // Green channel
            ctx.fillStyle = "rgba(0, 255, 0, " + (0.1 + progress * 0.15) + ")";
            ctx.fillRect(z.x, z.y, z.w, z.h);
            // Blue channel offset
            ctx.fillStyle = "rgba(0, 0, 255, " + (0.1 + progress * 0.15) + ")";
            ctx.fillRect(z.x + 3, z.y, z.w, z.h);
            
            // Scanlines across the zone
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            for (var sl = z.y; sl < z.y + z.h; sl += 4) {
                if (Math.random() > 0.5) {
                    ctx.fillRect(z.x, sl, z.w, 1);
                }
            }
            
            // Pulsing border
            ctx.strokeStyle = "rgba(255, 0, 255, " + (0.3 + Math.sin(z.timer * 20) * 0.3) + ")";
            ctx.lineWidth = 2;
            ctx.strokeRect(z.x, z.y, z.w, z.h);
        } else {
            // Active — Full RGB glitch
            hasActive = true;
            if (!z.soundPlayed) {
                Sound.playSound("select", true);
                z.soundPlayed = true;
            }
            
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#FF00FF";
            
            // RGB Channel Separation
            ctx.globalCompositeOperation = "lighter";
            
            // Red channel
            ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
            ctx.fillRect(z.x - 4 + Math.random()*2, z.y, z.w, z.h);
            // Green channel
            ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
            ctx.fillRect(z.x + Math.random()*2, z.y + 2, z.w, z.h);
            // Blue channel
            ctx.fillStyle = "rgba(0, 0, 255, 0.6)";
            ctx.fillRect(z.x + 4 + Math.random()*2, z.y - 2, z.w, z.h);
            
            ctx.globalCompositeOperation = "source-over";
            ctx.shadowBlur = 0;
            
            // TV Static noise
            for (var n = 0; n < 30; n++) {
                var nx = z.x + Math.random() * z.w;
                var ny = z.y + Math.random() * z.h;
                var nw = Math.random() * 15 + 2;
                var nh = Math.random() * 3 + 1;
                var colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFFFF", "#FF00FF", "#000000"];
                ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                ctx.fillRect(nx, ny, nw, nh);
            }
            
            // Horizontal glitch bars
            for (var g = 0; g < 4; g++) {
                var gy = z.y + Math.random() * z.h;
                var gOffset = (Math.random() - 0.5) * 20;
                ctx.fillStyle = "rgba(255, 255, 255, " + (Math.random() * 0.5) + ")";
                ctx.fillRect(z.x + gOffset, gy, z.w, 2);
            }
        }
    }
    
    // Screen shake when active
    if (hasActive) {
        ctx.translate((Math.random()-0.5)*5, (Math.random()-0.5)*5);
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
