// sachielCrossExplosion.js - Iconic Evangelion cross-shaped explosions
var SachielCrossExplosionPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 12;
    this.crosses = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.0;
};

SachielCrossExplosionPattern.prototype = Object.create(BulletPattern.prototype);

SachielCrossExplosionPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 2) {
        this.spawnTimer = 0;
        
        // Spawn 2 to 3 crosses
        var numCrosses = 2 + Math.floor(Math.random() * 2);
        for (var i = 0; i < numCrosses; i++) {
            this.crosses.push({
                x: bb[0] + 20 + Math.random() * (bb[2] - bb[0] - 40),
                y: bb[1] + 20 + Math.random() * (bb[3] - bb[1] - 40),
                state: "WARN", // WARN -> EXPLODE
                timer: 0,
                warnTime: 1.0,
                explodeTime: 1.2,
                width: 40, // Width of the beams
                height: 1000 // Huge beams extending out
            });
        }
        
        if (this.spawnInterval > 0.6) this.spawnInterval -= 0.1;
    }
    
    for (var i = this.crosses.length - 1; i >= 0; i--) {
        var c = this.crosses[i];
        c.timer += dt;
        
        if (c.state === "WARN") {
            if (c.timer >= c.warnTime) {
                c.state = "EXPLODE";
                c.timer = 0;
            }
        } else if (c.state === "EXPLODE") {
            if (c.timer >= c.explodeTime) {
                this.crosses.splice(i, 1);
            }
        }
    }
};

SachielCrossExplosionPattern.prototype.draw = function(ctx) {
    for (var i = 0; i < this.crosses.length; i++) {
        var c = this.crosses[i];
        
        if (c.state === "WARN") {
            // Draw warning orb
            var pulse = Math.abs(Math.sin(this.elapsed * 15)) * 10;
            
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#FFD700"; // Golden glow
            
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.beginPath();
            ctx.arc(c.x, c.y, 5 + pulse, 0, Math.PI * 2);
            ctx.fill();
            
            // Thin warning laser lines
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "rgba(255, 200, 0, 0.3)";
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.moveTo(c.x, c.y - 500); ctx.lineTo(c.x, c.y + 500);
            ctx.moveTo(c.x - 500, c.y); ctx.lineTo(c.x + 500, c.y);
            ctx.stroke();
            
        } else if (c.state === "EXPLODE") {
            // Giant cross explosion
            var alpha = 1.0;
            if (c.timer > c.explodeTime - 0.3) {
                alpha = (c.explodeTime - c.timer) / 0.3; // Fade out
            }
            
            var scale = 1.0;
            if (c.timer < 0.1) {
                scale = c.timer / 0.1; // Blast expanding
            }
            
            var curWidth = c.width * scale;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            ctx.shadowBlur = 30;
            ctx.shadowColor = "#FFD700";
            
            // Draw vertical and horizontal beams
            var gradX = ctx.createLinearGradient(c.x - curWidth/2, 0, c.x + curWidth/2, 0);
            gradX.addColorStop(0, "rgba(255, 150, 0, 0)");
            gradX.addColorStop(0.2, "rgba(255, 200, 50, 0.8)");
            gradX.addColorStop(0.5, "#FFFFFF");
            gradX.addColorStop(0.8, "rgba(255, 200, 50, 0.8)");
            gradX.addColorStop(1, "rgba(255, 150, 0, 0)");
            
            var gradY = ctx.createLinearGradient(0, c.y - curWidth/2, 0, c.y + curWidth/2);
            gradY.addColorStop(0, "rgba(255, 150, 0, 0)");
            gradY.addColorStop(0.2, "rgba(255, 200, 50, 0.8)");
            gradY.addColorStop(0.5, "#FFFFFF");
            gradY.addColorStop(0.8, "rgba(255, 200, 50, 0.8)");
            gradY.addColorStop(1, "rgba(255, 150, 0, 0)");
            
            // Vertical beam
            ctx.fillStyle = gradX;
            ctx.fillRect(c.x - curWidth/2, c.y - c.height/2, curWidth, c.height);
            
            // Horizontal beam
            ctx.fillStyle = gradY;
            ctx.fillRect(c.x - c.height/2, c.y - curWidth/2, c.height, curWidth);
            
            ctx.restore();
        }
    }
};

SachielCrossExplosionPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.crosses.length; i++) {
        var c = this.crosses[i];
        if (c.state === "EXPLODE" && c.timer > 0.1 && c.timer < c.explodeTime - 0.2) {
            // Hitbox for vertical beam
            if (sx + sw > c.x - c.width/3 && sx < c.x + c.width/3) {
                return this.damVal;
            }
            // Hitbox for horizontal beam
            if (sy + sh > c.y - c.width/3 && sy < c.y + c.width/3) {
                return this.damVal;
            }
        }
    }
    return 0;
};

SachielCrossExplosionPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.crosses.length === 0;
};
