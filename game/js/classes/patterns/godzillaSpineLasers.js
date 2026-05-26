// godzillaSpineLasers.js — Lasers fire from Godzilla's dorsal plates in warning grids
var GodzillaSpineLasersPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
    
    this.lasers = [];
    this.waveTimer = 0;
    this.waveInterval = 1.6; // New laser wave every 1.6s
    this.bullets = [];
};

GodzillaSpineLasersPattern.prototype = Object.create(BulletPattern.prototype);

GodzillaSpineLasersPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.waveTimer = 1.0; // Trigger first wave quickly
    this.lasers = [];
    this.bullets = [];
};

GodzillaSpineLasersPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.waveTimer += dt;
    
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];
    
    // 1. Spawn waves of lasers
    if (this.waveTimer >= this.waveInterval && this.elapsed < this.duration - 1.5) {
        this.waveTimer = 0;
        
        Sound.playSound("flash", true);
        
        var waveType = Math.floor(Math.random() * 3); // 0: Cross grid, 1: Horizontal stripes, 2: Vertical stripes
        var warningTime = 0.75;
        
        if (waveType === 0) {
            // Cross grid (random offsets)
            var offsetMultiplierX = Math.random() < 0.5 ? 0.3 : 0.7;
            var offsetMultiplierY = Math.random() < 0.5 ? 0.3 : 0.7;
            
            this.lasers.push({
                x1: bb[0] + boxW * offsetMultiplierX, y1: bb[1],
                x2: bb[0] + boxW * offsetMultiplierX, y2: bb[3],
                thickness: 16,
                warningTimer: warningTime,
                activeTimer: 0.5,
                elapsed: 0,
                fired: false
            });
            this.lasers.push({
                x1: bb[0], y1: bb[1] + boxH * offsetMultiplierY,
                x2: bb[2], y2: bb[1] + boxH * offsetMultiplierY,
                thickness: 16,
                warningTimer: warningTime,
                activeTimer: 0.5,
                elapsed: 0,
                fired: false
            });
        } else if (waveType === 1) {
            // 2 Horizontal lines
            this.lasers.push({
                x1: bb[0], y1: bb[1] + boxH * 0.25,
                x2: bb[2], y2: bb[1] + boxH * 0.25,
                thickness: 14,
                warningTimer: warningTime,
                activeTimer: 0.5,
                elapsed: 0,
                fired: false
            });
            this.lasers.push({
                x1: bb[0], y1: bb[1] + boxH * 0.75,
                x2: bb[2], y2: bb[1] + boxH * 0.75,
                thickness: 14,
                warningTimer: warningTime,
                activeTimer: 0.5,
                elapsed: 0,
                fired: false
            });
        } else {
            // 2 Vertical lines
            this.lasers.push({
                x1: bb[0] + boxW * 0.25, y1: bb[1],
                x2: bb[0] + boxW * 0.25, y2: bb[3],
                thickness: 14,
                warningTimer: warningTime,
                activeTimer: 0.5,
                elapsed: 0,
                fired: false
            });
            this.lasers.push({
                x1: bb[0] + boxW * 0.75, y1: bb[1],
                x2: bb[0] + boxW * 0.75, y2: bb[3],
                thickness: 14,
                warningTimer: warningTime,
                activeTimer: 0.5,
                elapsed: 0,
                fired: false
            });
        }
    }
    
    // 2. Update lasers state
    for (var i = this.lasers.length - 1; i >= 0; i--) {
        var las = this.lasers[i];
        las.elapsed += dt;
        
        if (las.elapsed >= las.warningTimer && !las.fired) {
            las.fired = true;
            Sound.playSound("impact", true);
            if (typeof triggerShake === "function") triggerShake(3, 100);
        }
        
        // Remove laser when done
        if (las.elapsed >= las.warningTimer + las.activeTimer) {
            this.lasers.splice(i, 1);
        }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};

GodzillaSpineLasersPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();
    
    var isMeltdown = (this.battleBox && Cgroup.getBossId() === "godzilla" && Cgroup.getEnemy(0) && Cgroup.getEnemy(0).renderType === "godzilla_meltdown");
    var laserColor = isMeltdown ? "rgba(255, 0, 160, 0.85)" : "rgba(0, 160, 255, 0.85)";
    var laserCore = isMeltdown ? "rgba(255, 200, 240, 0.9)" : "rgba(200, 240, 255, 0.9)";
    var warningColor = "rgba(255, 0, 0, 0.4)";
    
    for (var i = 0; i < this.lasers.length; i++) {
        var las = this.lasers[i];
        
        if (!las.fired) {
            // Draw Warning Line
            ctx.save();
            ctx.strokeStyle = warningColor;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.shadowBlur = 6;
            ctx.shadowColor = "#FF0000";
            
            ctx.beginPath();
            ctx.moveTo(las.x1, las.y1);
            ctx.lineTo(las.x2, las.y2);
            ctx.stroke();
            
            // Subtle transparent warning band
            ctx.globalAlpha = 0.08 + Math.sin(las.elapsed * 15) * 0.04;
            ctx.fillStyle = "#FF0000";
            ctx.beginPath();
            if (las.x1 === las.x2) {
                // Vertical
                ctx.fillRect(las.x1 - las.thickness / 2, bb[1], las.thickness, bb[3] - bb[1]);
            } else {
                // Horizontal
                ctx.fillRect(bb[0], las.y1 - las.thickness / 2, bb[2] - bb[0], las.thickness);
            }
            ctx.restore();
        } else {
            // Draw Active Laser
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = laserColor;
            ctx.strokeStyle = laserColor;
            
            // Fading out slightly at the end
            var lifeRemaining = (las.warningTimer + las.activeTimer) - las.elapsed;
            var opacity = Math.min(1.0, lifeRemaining / 0.15);
            ctx.globalAlpha = opacity;
            
            // Outer thick laser beam
            ctx.lineWidth = las.thickness;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(las.x1, las.y1);
            ctx.lineTo(las.x2, las.y2);
            ctx.stroke();
            
            // Inner white-hot laser core
            ctx.strokeStyle = laserCore;
            ctx.lineWidth = las.thickness * 0.4;
            ctx.beginPath();
            ctx.moveTo(las.x1, las.y1);
            ctx.lineTo(las.x2, las.y2);
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    ctx.restore();
};

GodzillaSpineLasersPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.lasers.length; i++) {
        var las = this.lasers[i];
        if (!las.fired) continue;
        
        var halfThick = las.thickness / 2;
        var lx, ly, lw, lh;
        
        if (Math.abs(las.x1 - las.x2) < 0.01) {
            // Vertical laser line
            lx = las.x1 - halfThick;
            ly = Math.min(las.y1, las.y2);
            lw = las.thickness;
            lh = Math.abs(las.y1 - las.y2);
        } else {
            // Horizontal laser line
            lx = Math.min(las.x1, las.x2);
            ly = las.y1 - halfThick;
            lw = Math.abs(las.x1 - las.x2);
            lh = las.thickness;
        }
        
        if (rectsOverlap(lx, ly, lw, lh, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    
    return 0;
};

GodzillaSpineLasersPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.lasers.length === 0;
};
