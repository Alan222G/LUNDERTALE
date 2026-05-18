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
    var bb = this.battleBox;
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
            // Warning lines
            var flash = Math.floor(r.timer * 12) % 2 === 0;
            ctx.globalAlpha = flash ? 0.4 : 0.1;
            ctx.fillStyle = "#FF4444";
            ctx.fillRect(r.x, r.y, r.w, r.h);
        } else if (r.timer <= this.warningDuration + this.activeDuration) {
            // Active laser
            var life = r.timer - this.warningDuration;
            var alpha = 1 - (life / this.activeDuration);
            ctx.globalAlpha = alpha;
            
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#FF2200";
            
            // Core
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8);
            
            // Edges
            ctx.fillStyle = "rgba(255, 200, 0, 0.8)";
            ctx.fillRect(r.x, r.y, r.w, r.h);
        }
    }
    ctx.restore();
};

HeavenlyRaysPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};
