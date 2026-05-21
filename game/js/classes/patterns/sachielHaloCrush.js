// sachielHaloCrush.js - An angelic halo shrinks the play area while beams shoot down
var SachielHaloCrushPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
    
    this.haloRadius = 300;
    this.haloTargetRadius = 70;
    
    this.beams = [];
    this.beamTimer = 0;
    this.beamInterval = 0.6;
};

SachielHaloCrushPattern.prototype = Object.create(BulletPattern.prototype);

SachielHaloCrushPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.beamTimer += dt;
    
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    // Halo shrinks over time
    if (this.elapsed < this.duration - 2) {
        var progress = this.elapsed / (this.duration - 2);
        if (progress > 1) progress = 1;
        // Ease out quad
        progress = progress * (2 - progress);
        this.haloRadius = 300 - (300 - this.haloTargetRadius) * progress;
    } else {
        // Expand rapidly at the end
        this.haloRadius += 300 * dt;
    }
    
    // Spawn beams that fall within the halo
    if (this.beamTimer >= this.beamInterval && this.elapsed < this.duration - 1) {
        this.beamTimer = 0;
        
        var numBeams = 1 + Math.floor(Math.random() * 2);
        for (var i = 0; i < numBeams; i++) {
            // Pick a random spot inside the current halo radius (X coordinate)
            var angle = Math.random() * Math.PI * 2;
            var dist = Math.random() * (this.haloRadius - 20);
            var px = cx + Math.cos(angle) * dist;
            
            // Keep strictly inside the battle box horizontally
            px = Math.max(bb[0] + 10, Math.min(bb[2] - 10, px));
            
            this.beams.push({
                x: px,
                y: bb[1] - 50,
                width: 15 + Math.random() * 15,
                warningTime: 0.5,
                warningTimer: 0,
                active: false,
                duration: 0.8,
                timer: 0
            });
        }
        
        if (this.beamInterval > 0.3) this.beamInterval -= 0.05;
    }
    
    // Update beams
    for (var i = this.beams.length - 1; i >= 0; i--) {
        var b = this.beams[i];
        if (!b.active) {
            b.warningTimer += dt;
            if (b.warningTimer >= b.warningTime) {
                b.active = true;
            }
        } else {
            b.timer += dt;
            if (b.timer >= b.duration) {
                this.beams.splice(i, 1);
            }
        }
    }
};

SachielHaloCrushPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    // Draw Halo Outline / Constraint Area
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#FFFF00";
    
    ctx.strokeStyle = "rgba(255, 255, 100, 0.8)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, this.haloRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Dim the outside of the halo
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.beginPath();
    // Big rectangle covering screen
    ctx.rect(bb[0]-100, bb[1]-100, (bb[2]-bb[0])+200, (bb[3]-bb[1])+200);
    // Hole for halo
    ctx.arc(cx, cy, this.haloRadius, 0, Math.PI*2, true);
    ctx.fill();
    
    // Draw beams
    for (var i = 0; i < this.beams.length; i++) {
        var b = this.beams[i];
        if (!b.active) {
            var alpha = (b.warningTimer / b.warningTime);
            ctx.fillStyle = "rgba(255, 255, 0, " + (alpha * 0.4) + ")";
            ctx.fillRect(b.x - b.width/2, bb[1], b.width, bb[3] - bb[1]);
        } else {
            var alpha = 1.0;
            if (b.timer > b.duration - 0.2) alpha = (b.duration - b.timer) / 0.2;
            
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#FFFF00";
            ctx.fillStyle = "rgba(255, 255, 255, " + alpha + ")";
            ctx.fillRect(b.x - b.width/2, bb[1] - 20, b.width, (bb[3] - bb[1]) + 40);
            ctx.shadowBlur = 0;
        }
    }
};

SachielHaloCrushPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    var soulCX = sx + sw / 2;
    var soulCY = sy + sh / 2;
    
    // 1. Halo constraint damage (If player leaves the circle)
    var dx = soulCX - cx;
    var dy = soulCY - cy;
    var dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > this.haloRadius) {
        return this.damVal;
    }
    
    // 2. Beam damage
    for (var i = 0; i < this.beams.length; i++) {
        var b = this.beams[i];
        if (b.active && b.timer > 0.1 && b.timer < b.duration - 0.1) {
            if (sx + sw > b.x - b.width/2 && sx < b.x + b.width/2) {
                return this.damVal;
            }
        }
    }
    
    return 0;
};

SachielHaloCrushPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.beams.length === 0;
};
