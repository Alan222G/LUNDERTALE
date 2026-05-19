// heavenly_rays.js — Grid of intersecting holy lasers
var HeavenlyRaysPattern = function(config) {
    BulletPattern.call(this, config);
    this.rays = [];
    this.duration = config.duration || 6;
    this.elapsed = 0;
    this.phaseTimer = 0;
    this.damVal = config.damVal || 8;
    this.rayWidth = config.rayWidth || 20;
    this.warningDuration = 0.8;
    this.activeDuration = 0.6;
};

HeavenlyRaysPattern.prototype = Object.create(BulletPattern.prototype);

HeavenlyRaysPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.rays = [];
    this.elapsed = 0;
    this.phaseTimer = 0;
    this.spawnGrid();
};

HeavenlyRaysPattern.prototype.spawnGrid = function() {
    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];
    
    // Pick 2 safe horizontal gaps and 2 safe vertical gaps
    var numRaysH = 5;
    var numRaysV = 5;
    var safeH = Math.floor(Math.random() * numRaysH);
    var safeV = Math.floor(Math.random() * numRaysV);
    
    // Vertical rays
    var spacingV = bbW / numRaysV;
    for (var i = 0; i <= numRaysV; i++) {
        if (i === safeV) continue;
        this.rays.push({
            x: bb[0] + i * spacingV - this.rayWidth / 2,
            y: bb[1] - 50,
            w: this.rayWidth,
            h: bbH + 100,
            timer: 0
        });
    }
    
    // Horizontal rays
    var spacingH = bbH / numRaysH;
    for (var i = 0; i <= numRaysH; i++) {
        if (i === safeH) continue;
        this.rays.push({
            x: bb[0] - 50,
            y: bb[1] + i * spacingH - this.rayWidth / 2,
            w: bbW + 100,
            h: this.rayWidth,
            timer: 0
        });
    }
};

HeavenlyRaysPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.phaseTimer += dt;
    
    var cycleTime = this.warningDuration + this.activeDuration;
    
    if (this.phaseTimer > cycleTime && this.elapsed < this.duration - cycleTime) {
        this.phaseTimer = 0;
        this.rays = [];
        this.spawnGrid();
    }
    
    for (var i = 0; i < this.rays.length; i++) {
        this.rays[i].timer += dt;
    }
};

HeavenlyRaysPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.rays.length; i++) {
        var r = this.rays[i];
        if (r.timer > this.warningDuration && r.timer < this.warningDuration + this.activeDuration) {
            if (rectsOverlap(r.x, r.y, r.w, r.h, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }
    return 0;
};

HeavenlyRaysPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.rays.length; i++) {
        var r = this.rays[i];
        
        if (r.timer <= this.warningDuration) {
            // Warning lines — pulsing red with inner highlight
            var flash = Math.floor(r.timer * 14) % 2 === 0;
            ctx.globalAlpha = flash ? 0.4 : 0.1;
            ctx.fillStyle = "#FF2200";
            ctx.fillRect(r.x, r.y, r.w, r.h);
            // Inner warning line
            ctx.globalAlpha = flash ? 0.5 : 0.15;
            ctx.fillStyle = "#FF8800";
            if (r.w > r.h) {
                ctx.fillRect(r.x, r.y + r.h / 2 - 1, r.w, 2);
            } else {
                ctx.fillRect(r.x + r.w / 2 - 1, r.y, 2, r.h);
            }
        } else if (r.timer <= this.warningDuration + this.activeDuration) {
            // Active laser — multi-layered
            var life = r.timer - this.warningDuration;
            var alpha = 1 - (life / this.activeDuration);
            ctx.globalAlpha = alpha;
            
            // Outer crimson aura
            ctx.fillStyle = "rgba(255, 50, 0, 0.25)";
            ctx.fillRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6);
            
            // Main golden beam
            ctx.shadowBlur = 18;
            ctx.shadowColor = "#FF4400";
            ctx.fillStyle = "rgba(255, 180, 0, 0.75)";
            ctx.fillRect(r.x, r.y, r.w, r.h);
            
            // White-hot core
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#FFFFFF";
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8);
            
            // Center line
            ctx.shadowBlur = 0;
            ctx.fillStyle = "rgba(255, 255, 220, 0.9)";
            if (r.w > r.h) {
                ctx.fillRect(r.x, r.y + r.h / 2 - 1, r.w, 2);
            } else {
                ctx.fillRect(r.x + r.w / 2 - 1, r.y, 2, r.h);
            }
            
            // Edge sparks
            for (var s = 0; s < 3; s++) {
                var sx, sy;
                if (r.w > r.h) {
                    sx = r.x + Math.random() * r.w;
                    sy = r.y + (Math.random() > 0.5 ? -2 : r.h + 2);
                } else {
                    sx = r.x + (Math.random() > 0.5 ? -2 : r.w + 2);
                    sy = r.y + Math.random() * r.h;
                }
                ctx.fillStyle = "rgba(255, 200, 50, " + (0.3 + Math.random() * 0.4).toFixed(2) + ")";
                ctx.beginPath();
                ctx.arc(sx, sy, 1 + Math.random(), 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    ctx.restore();
};

HeavenlyRaysPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};
