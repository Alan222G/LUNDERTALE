// vaderImperialBarrage.js — Red Imperial laser beams rain down with warning indicators
var VaderImperialBarragePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 0.8; // Every 0.8s spawn a laser
    this.damVal = config.damVal || 9;
    this.lasers = []; // { x, w, warning, duration, active }
};

VaderImperialBarragePattern.prototype = Object.create(BulletPattern.prototype);

VaderImperialBarragePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.5; // Start quickly
    this.lasers = [];
};

VaderImperialBarragePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        this.spawnLaser();
    }

    // Update lasers
    for (var i = this.lasers.length - 1; i >= 0; i--) {
        var l = this.lasers[i];
        if (l.warning > 0) {
            l.warning -= dt;
            if (l.warning <= 0) {
                l.active = true;
                Sound.playSound("impact", true); // Laser blast sound
            }
        } else if (l.active) {
            l.duration -= dt;
            if (l.duration <= 0) {
                l.active = false;
                this.lasers.splice(i, 1);
            }
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

VaderImperialBarragePattern.prototype.spawnLaser = function() {
    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];

    // Pick random X lane
    var lx = bb[0] + Math.random() * (bbW - 30) + 15;
    this.lasers.push({
        x: lx,
        w: 16,
        warning: 0.75, // 0.75 seconds warning
        duration: 0.45, // active for 0.45s
        active: false
    });
};

VaderImperialBarragePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    
    // Check if the player is in any active laser beam
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.active) {
            // Check bounding box intersection between player soul and vertical laser beam
            var lx1 = l.x - l.w / 2;
            var lx2 = l.x + l.w / 2;
            if (rectsOverlap(lx1, bb[1], l.w, bb[3] - bb[1], sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }

    return BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
};

VaderImperialBarragePattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();

    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        
        if (l.warning > 0) {
            // Draw flashing red warning guide line
            ctx.save();
            ctx.strokeStyle = "rgba(255, 0, 0, " + (0.3 + Math.sin(this.elapsed * 18) * 0.15) + ")";
            ctx.lineWidth = 2.0;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(l.x, bb[1]);
            ctx.lineTo(l.x, bb[3]);
            ctx.stroke();

            // Draw faint warning rectangle
            ctx.fillStyle = "rgba(255, 0, 0, 0.08)";
            ctx.fillRect(l.x - l.w / 2, bb[1], l.w, bb[3] - bb[1]);
            ctx.restore();
        } else if (l.active) {
            // Draw massive glowing Imperial crimson laser beam
            ctx.save();
            ctx.shadowBlur = 18;
            ctx.shadowColor = "#FF0000";
            
            // Outer red blast
            ctx.fillStyle = "rgba(255, 0, 0, 0.85)";
            ctx.fillRect(l.x - l.w / 2, bb[1], l.w, bb[3] - bb[1]);

            // Inner hot white core
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(l.x - l.w / 4, bb[1], l.w / 2, bb[3] - bb[1]);

            // Energy spark details
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            for (var sp = 0; sp < 4; sp++) {
                var spy = bb[1] + ((this.elapsed * 450 + sp * 50) % (bb[3] - bb[1]));
                ctx.fillRect(l.x - 3, spy, 6, 2);
            }
            
            ctx.restore();
        }
    }

    ctx.restore();
};

VaderImperialBarragePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.lasers.length === 0;
};
