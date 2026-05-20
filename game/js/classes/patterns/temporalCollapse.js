// temporalCollapse.js - Paradoja: Walls close in on a small moving safe zone
var TemporalCollapsePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
    
    this.safeX = 0;
    this.safeY = 0;
    this.safeSize = 80;
    
    this.targetSafeX = 0;
    this.targetSafeY = 0;
    this.moveTimer = 0;
    
    this.glitches = [];
    this.battleBox = null;
    this.collapseProgress = 0; // 0 to 1
};

TemporalCollapsePattern.prototype = Object.create(BulletPattern.prototype);

TemporalCollapsePattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    
    var cx = (battleBox[0] + battleBox[2]) / 2;
    var cy = (battleBox[1] + battleBox[3]) / 2;
    
    this.safeX = cx;
    this.safeY = cy;
    this.targetSafeX = cx;
    this.targetSafeY = cy;
    
    this.safeSize = 80;
    this.collapseProgress = 0;
    this.moveTimer = 2.0; // Wait 2s before moving the safe zone
    this.glitches = [];
};

TemporalCollapsePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.moveTimer -= dt;
    
    var bb = Cbbox.getBound();
    
    // Animate collapse progress
    if (this.elapsed < 2) {
        this.collapseProgress = this.elapsed / 2; // Collapse over 2 seconds
    } else if (this.elapsed > this.duration - 1) {
        this.collapseProgress = (this.duration - this.elapsed); // Expand at the end
    } else {
        this.collapseProgress = 1;
    }
    
    // Move safe zone
    if (this.moveTimer <= 0 && this.collapseProgress >= 1) {
        this.moveTimer = 2.5; // Wait longer between moves
        this.targetSafeX = bb[0] + this.safeSize/2 + Math.random() * (bb[2] - bb[0] - this.safeSize);
        this.targetSafeY = bb[1] + this.safeSize/2 + Math.random() * (bb[3] - bb[1] - this.safeSize);
    }
    
    // Lerp safe zone (slower, smoother)
    this.safeX += (this.targetSafeX - this.safeX) * dt * 1.5;
    this.safeY += (this.targetSafeY - this.safeY) * dt * 1.5;
    
    // Add glitches
    if (Math.random() < 0.2) {
        this.glitches.push({
            x: bb[0] + Math.random() * (bb[2] - bb[0]),
            y: bb[1] + Math.random() * (bb[3] - bb[1]),
            w: Math.random() * 50 + 10,
            h: Math.random() * 10 + 2,
            life: 0.1
        });
    }
    
    for (var i = this.glitches.length - 1; i >= 0; i--) {
        this.glitches[i].life -= dt;
        if (this.glitches[i].life <= 0) this.glitches.splice(i, 1);
    }
};

TemporalCollapsePattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();
    
    var l = bb[0] + (this.safeX - this.safeSize/2 - bb[0]) * this.collapseProgress;
    var r = bb[2] - (bb[2] - (this.safeX + this.safeSize/2)) * this.collapseProgress;
    var t = bb[1] + (this.safeY - this.safeSize/2 - bb[1]) * this.collapseProgress;
    var b = bb[3] - (bb[3] - (this.safeY + this.safeSize/2)) * this.collapseProgress;
    
    // Draw destructive void walls
    ctx.fillStyle = "rgba(0, 255, 255, 0.5)";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#FFF";
    
    // Left wall
    ctx.fillRect(bb[0], bb[1], l - bb[0], bb[3] - bb[1]);
    // Right wall
    ctx.fillRect(r, bb[1], bb[2] - r, bb[3] - bb[1]);
    // Top wall
    ctx.fillRect(l, bb[1], r - l, t - bb[1]);
    // Bottom wall
    ctx.fillRect(l, b, r - l, bb[3] - b);
    
    // Inner border (Current Safe Zone)
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 2;
    ctx.strokeRect(l, t, r - l, b - t);
    
    // Draw telegraph for TARGET safe zone if it's far away
    if (this.collapseProgress >= 1) {
        var dist = Math.sqrt(Math.pow(this.targetSafeX - this.safeX, 2) + Math.pow(this.targetSafeY - this.safeY, 2));
        if (dist > 10) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#FFD700";
            ctx.strokeStyle = "rgba(255, 215, 0, " + (0.6 + Math.sin(this.elapsed * 15) * 0.4) + ")"; // Pulsing bright gold
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 10]);
            var tl = this.targetSafeX - this.safeSize/2;
            var tt = this.targetSafeY - this.safeSize/2;
            
            // Draw an X in the middle
            ctx.beginPath();
            ctx.moveTo(tl + 10, tt + 10);
            ctx.lineTo(tl + this.safeSize - 10, tt + this.safeSize - 10);
            ctx.moveTo(tl + this.safeSize - 10, tt + 10);
            ctx.lineTo(tl + 10, tt + this.safeSize - 10);
            ctx.stroke();
            
            ctx.strokeRect(tl, tt, this.safeSize, this.safeSize);
            ctx.setLineDash([]);
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0;
        }
    }
    
    // Draw glitches
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    for (var i = 0; i < this.glitches.length; i++) {
        var g = this.glitches[i];
        ctx.fillRect(g.x, g.y, g.w, g.h);
    }
    
    ctx.restore();
};

TemporalCollapsePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    if (this.collapseProgress < 0.2) return 0; // Too early to do damage
    
    var bb = Cbbox.getBound();
    var cx = sx + sw / 2;
    var cy = sy + sh / 2;
    var r = sw / 2;
    
    var l = bb[0] + (this.safeX - this.safeSize/2 - bb[0]) * this.collapseProgress;
    var right = bb[2] - (bb[2] - (this.safeX + this.safeSize/2)) * this.collapseProgress;
    var t = bb[1] + (this.safeY - this.safeSize/2 - bb[1]) * this.collapseProgress;
    var b = bb[3] - (bb[3] - (this.safeY + this.safeSize/2)) * this.collapseProgress;
    
    // If player is outside the safe box
    if (cx - r < l || cx + r > right || cy - r < t || cy + r > b) {
        return this.damVal;
    }
    
    return 0;
};

TemporalCollapsePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};
