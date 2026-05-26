// godzillaClawSlash.js — Claw slash attack for Godzilla Phase 2.
// Godzilla slashes the box, indicator lines show where the claws will strike, then energetic slash lines deal damage and release sparks.
var GodzillaClawSlashPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
    
    this.slashes = [];
    this.slashTimer = 0;
    this.slashInterval = 1.8; // Slash every 1.8s
    this.bullets = [];
};

GodzillaClawSlashPattern.prototype = Object.create(BulletPattern.prototype);

GodzillaClawSlashPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.slashTimer = 1.0; // Trigger first slash quickly
    this.slashes = [];
    this.bullets = [];
};

GodzillaClawSlashPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.slashTimer += dt;
    
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];
    
    // 1. Spawn a claw slash warning
    if (this.slashTimer >= this.slashInterval && this.elapsed < this.duration - 1.5) {
        this.slashTimer = 0;
        
        Sound.playSound("flash", true);
        
        var warningTime = 0.8;
        var dir = Math.random() < 0.5 ? "left" : "right"; // Direction of claw strike
        var yLevel = bb[1] + 30 + Math.random() * (boxH - 60);
        
        // Spawn 3 parallel claw lines
        for (var i = -1; i <= 1; i++) {
            var offset = i * 22;
            var angle = (Math.random() - 0.5) * 0.15; // Small random tilt
            this.slashes.push({
                x1: dir === "left" ? bb[0] : bb[2],
                y1: yLevel + offset,
                x2: dir === "left" ? bb[2] : bb[0],
                y2: yLevel + offset + Math.sin(angle) * boxW,
                thickness: 12,
                warningTimer: warningTime,
                activeTimer: 0.45,
                elapsed: 0,
                fired: false,
                direction: dir
            });
        }
    }
    
    // 2. Update slashes
    for (var i = this.slashes.length - 1; i >= 0; i--) {
        var slash = this.slashes[i];
        slash.elapsed += dt;
        
        if (slash.elapsed >= slash.warningTimer && !slash.fired) {
            slash.fired = true;
            Sound.playSound("hit_2", true);
            if (typeof triggerShake === "function") triggerShake(2, 80);
            
            // Release some energetic sparks along the claw path
            var steps = 8;
            for (var s = 0; s <= steps; s++) {
                var ratio = s / steps;
                var px = slash.x1 + (slash.x2 - slash.x1) * ratio;
                var py = slash.y1 + (slash.y2 - slash.y1) * ratio;
                
                // Spawn a spark bullet that flies perpendicular to the slash
                var vx = (slash.direction === "left" ? 40 : -40) * (Math.random() + 0.5);
                var vy = (Math.random() - 0.5) * 120;
                
                this.bullets.push(new Bullet({
                    x: px - 4,
                    y: py - 4,
                    width: 8, height: 8,
                    speed: 0,
                    damVal: this.damVal - 2,
                    rotation: 0, fadeSpeed: 1.0, color: "#0FF",
                    vx: vx, vy: vy, useVelocity: true
                }));
            }
        }
        
        // Remove slash when done
        if (slash.elapsed >= slash.warningTimer + slash.activeTimer) {
            this.slashes.splice(i, 1);
        }
    }
    
    // Update bullets (sparks)
    BulletPattern.prototype.update.call(this, dt);
    
    // Out of bounds check
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        if (this.bullets[i].isOutOfBounds([bb[0]-50, bb[1]-50, bb[2]+50, bb[3]+50])) {
            this.bullets.splice(i, 1);
        }
    }
};

GodzillaClawSlashPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();
    
    var isMeltdown = (this.battleBox && Cgroup.getBossId() === "godzilla" && Cgroup.getEnemy(0) && Cgroup.getEnemy(0).renderType === "godzilla_meltdown");
    var glowColor = isMeltdown ? "rgba(255, 0, 160, 0.85)" : "rgba(0, 160, 255, 0.85)";
    var strokeColor = isMeltdown ? "#FF00A0" : "#00FFFF";
    var warningColor = "rgba(255, 0, 0, 0.45)";
    
    // 1. Draw warnings & active claw slashes
    for (var i = 0; i < this.slashes.length; i++) {
        var slash = this.slashes[i];
        
        if (!slash.fired) {
            // Draw Warning Line
            ctx.save();
            ctx.strokeStyle = warningColor;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(slash.x1, slash.y1);
            ctx.lineTo(slash.x2, slash.y2);
            ctx.stroke();
            ctx.restore();
        } else {
            // Draw Claw swipe line
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = glowColor;
            ctx.strokeStyle = strokeColor;
            
            var lifeRemaining = (slash.warningTimer + slash.activeTimer) - slash.elapsed;
            var opacity = Math.min(1.0, lifeRemaining / 0.15);
            ctx.globalAlpha = opacity;
            
            ctx.lineWidth = slash.thickness;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(slash.x1, slash.y1);
            ctx.lineTo(slash.x2, slash.y2);
            ctx.stroke();
            
            // White core
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = slash.thickness * 0.35;
            ctx.beginPath();
            ctx.moveTo(slash.x1, slash.y1);
            ctx.lineTo(slash.x2, slash.y2);
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    ctx.restore();
    
    // 2. Draw bullet sparks
    BulletPattern.prototype.draw.call(this, ctx);
};

GodzillaClawSlashPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    // Check collision with sparks
    var dmg = BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
    if (dmg > 0) return dmg;
    
    // Check collision with claw slashes
    for (var i = 0; i < this.slashes.length; i++) {
        var slash = this.slashes[i];
        if (!slash.fired) continue;
        
        // Slash segment collision (AABB approximation for diagonal line segment)
        var halfThick = slash.thickness / 2;
        var lx = Math.min(slash.x1, slash.x2);
        var ly = Math.min(slash.y1, slash.y2) - halfThick;
        var lw = Math.abs(slash.x2 - slash.x1);
        var lh = Math.abs(slash.y2 - slash.y1) + slash.thickness;
        
        if (rectsOverlap(lx, ly, lw, lh, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    
    return 0;
};

GodzillaClawSlashPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.slashes.length === 0 && this.bullets.length === 0;
};
