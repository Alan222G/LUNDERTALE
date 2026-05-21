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
    
    // Draw destructive void walls with matrix/wireframe effect
    ctx.fillStyle = "rgba(0, 50, 80, 0.7)";
    
    // Left wall
    ctx.fillRect(bb[0], bb[1], l - bb[0], bb[3] - bb[1]);
    // Right wall
    ctx.fillRect(r, bb[1], bb[2] - r, bb[3] - bb[1]);
    // Top wall
    ctx.fillRect(l, bb[1], r - l, t - bb[1]);
    // Bottom wall
    ctx.fillRect(l, b, r - l, bb[3] - b);
    
    // Grid wireframe over the entire box, masked to the void
    ctx.beginPath();
    ctx.rect(bb[0], bb[1], l - bb[0], bb[3] - bb[1]);
    ctx.rect(r, bb[1], bb[2] - r, bb[3] - bb[1]);
    ctx.rect(l, bb[1], r - l, t - bb[1]);
    ctx.rect(l, b, r - l, bb[3] - b);
    ctx.clip();
    
    ctx.strokeStyle = "rgba(0, 200, 255, 0.2)";
    ctx.lineWidth = 1;
    var offset = (this.elapsed * 20) % 20;
    for (var gx = bb[0] + offset; gx < bb[2]; gx += 20) {
        ctx.beginPath(); ctx.moveTo(gx, bb[1]); ctx.lineTo(gx, bb[3]); ctx.stroke();
    }
    for (var gy = bb[1] + offset; gy < bb[3]; gy += 20) {
        ctx.beginPath(); ctx.moveTo(bb[0], gy); ctx.lineTo(bb[2], gy); ctx.stroke();
    }
    
    // Draw glitches in void
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0, 255, 255, 0.4)";
    for (var i = 0; i < this.glitches.length; i++) {
        var g = this.glitches[i];
        ctx.fillRect(g.x, g.y, g.w, g.h);
    }
    
    ctx.restore(); // remove clip
    ctx.save();
    
    // Inner border (Current Safe Zone)
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00FFFF";
    ctx.strokeStyle = "rgba(255, 255, 255, " + (0.7 + Math.sin(this.elapsed * 10) * 0.3) + ")";
    ctx.lineWidth = 2 + Math.sin(this.elapsed * 15) * 1;
    ctx.strokeRect(l, t, r - l, b - t);
    
    // Electric sparks jumping along the safe zone edges
    ctx.globalCompositeOperation = "lighter";
    if (Math.random() > 0.3) {
        var numSparks = 2 + Math.floor(Math.random() * 3);
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 1.5;
        
        for (var s = 0; s < numSparks; s++) {
            var sparkEdge = Math.floor(Math.random() * 4);
            var startX, startY;
            if (sparkEdge === 0) { startX = l + Math.random()*(r-l); startY = t; } // Top
            else if (sparkEdge === 1) { startX = r; startY = t + Math.random()*(b-t); } // Right
            else if (sparkEdge === 2) { startX = l + Math.random()*(r-l); startY = b; } // Bottom
            else { startX = l; startY = t + Math.random()*(b-t); } // Left
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            var px = startX, py = startY;
            for (var seg = 0; seg < 4; seg++) {
                px += (Math.random()-0.5)*15;
                py += (Math.random()-0.5)*15;
                ctx.lineTo(px, py);
            }
            ctx.stroke();
        }
    }
    ctx.globalCompositeOperation = "source-over";
    
    // Draw telegraph for TARGET safe zone if it's far away
    if (this.collapseProgress >= 1) {
        var dist = Math.sqrt(Math.pow(this.targetSafeX - this.safeX, 2) + Math.pow(this.targetSafeY - this.safeY, 2));
        if (dist > 10) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#FFD700";
            ctx.strokeStyle = "rgba(255, 215, 0, " + (0.6 + Math.sin(this.elapsed * 15) * 0.4) + ")"; // Pulsing bright gold
            ctx.lineWidth = 3;
            
            var tl = this.targetSafeX - this.safeSize/2;
            var tt = this.targetSafeY - this.safeSize/2;
            var cLen = 15; // Corner length
            
            // Corner brackets
            ctx.beginPath();
            // Top left
            ctx.moveTo(tl + cLen, tt); ctx.lineTo(tl, tt); ctx.lineTo(tl, tt + cLen);
            // Top right
            ctx.moveTo(tl + this.safeSize - cLen, tt); ctx.lineTo(tl + this.safeSize, tt); ctx.lineTo(tl + this.safeSize, tt + cLen);
            // Bottom right
            ctx.moveTo(tl + this.safeSize, tt + this.safeSize - cLen); ctx.lineTo(tl + this.safeSize, tt + this.safeSize); ctx.lineTo(tl + this.safeSize - cLen, tt + this.safeSize);
            // Bottom left
            ctx.moveTo(tl, tt + this.safeSize - cLen); ctx.lineTo(tl, tt + this.safeSize); ctx.lineTo(tl + cLen, tt + this.safeSize);
            ctx.stroke();
            
            // Crosshair
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.targetSafeX - 5, this.targetSafeY); ctx.lineTo(this.targetSafeX + 5, this.targetSafeY);
            ctx.moveTo(this.targetSafeX, this.targetSafeY - 5); ctx.lineTo(this.targetSafeX, this.targetSafeY + 5);
            ctx.stroke();
        }
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
