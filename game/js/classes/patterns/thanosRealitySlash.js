// thanosRealitySlash.js — Reality Stone. Crimson grid slash laser beams.
// Sharp warning lines slice through the box, which then burst into red energy slash beams.

var ThanosRealitySlashPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 10;
    
    this.slashes = []; // { x1, y1, x2, y2, warningTimer, maxWarning: 1.0, activeTimer: 0.0, maxActive: 0.5, phase: 'warning'|'active', soundPlayed: false }
};

ThanosRealitySlashPattern.prototype = Object.create(BulletPattern.prototype);

ThanosRealitySlashPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.5; // Start soon
    this.slashes = [];
};

ThanosRealitySlashPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];

    // Spawn a new slash line
    if (this.spawnTimer >= 0.72 && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        
        var isHorizontal = Math.random() < 0.5;
        var x1, y1, x2, y2;
        
        if (isHorizontal) {
            var ry = bb[1] + 15 + Math.random() * (bbH - 30);
            x1 = bb[0]; y1 = ry;
            x2 = bb[2]; y2 = ry;
        } else {
            var rx = bb[0] + 15 + Math.random() * (bbW - 30);
            x1 = rx; y1 = bb[1];
            x2 = rx; y2 = bb[3];
        }
        
        this.slashes.push({
            x1: x1, y1: y1,
            x2: x2, y2: y2,
            isHorizontal: isHorizontal,
            warningTimer: 0.0,
            maxWarning: 0.9,
            activeTimer: 0.0,
            maxActive: 0.45,
            phase: 'warning',
            soundPlayed: false
        });
    }

    // Update active slashes
    for (var i = this.slashes.length - 1; i >= 0; i--) {
        var s = this.slashes[i];
        if (s.phase === 'warning') {
            s.warningTimer += dt;
            if (s.warningTimer >= s.maxWarning) {
                s.phase = 'active';
            }
        } else if (s.phase === 'active') {
            s.activeTimer += dt;
            if (!s.soundPlayed) {
                Sound.playSound("impact", true); // Slash sound
                s.soundPlayed = true;
            }
            if (s.activeTimer >= s.maxActive) {
                this.slashes.splice(i, 1);
            }
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

ThanosRealitySlashPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2;
    var cy = sy + sh / 2;
    var radius = (sw + sh) / 4;

    for (var i = 0; i < this.slashes.length; i++) {
        var s = this.slashes[i];
        if (s.phase !== 'active') continue;

        // Collision check for lines (distance to point)
        if (s.isHorizontal) {
            if (cy + radius > s.y1 - 10 && cy - radius < s.y1 + 10) {
                return this.damVal;
            }
        } else {
            if (cx + radius > s.x1 - 10 && cx - radius < s.x1 + 10) {
                return this.damVal;
            }
        }
    }
    return 0;
};

ThanosRealitySlashPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();

    for (var i = 0; i < this.slashes.length; i++) {
        var s = this.slashes[i];
        if (s.phase === 'warning') {
            // Draw thin warning slash line
            ctx.save();
            ctx.strokeStyle = "rgba(255, 30, 30, " + (0.4 + Math.sin(s.warningTimer * 25) * 0.3).toFixed(2) + ")";
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();
            ctx.restore();
        } else if (s.phase === 'active') {
            // Draw thick glowing crimson slash
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            var progress = s.activeTimer / s.maxActive;
            ctx.globalAlpha = 1.0 - progress;

            ctx.shadowBlur = 15;
            ctx.shadowColor = "#FF0000";
            
            // Red outer beam
            ctx.strokeStyle = "#FF1E27";
            ctx.lineWidth = 14.0;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();

            // White inner core
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 4.0;
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();

            ctx.restore();
        }
    }

    ctx.restore();
};

ThanosRealitySlashPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.slashes.length === 0;
};
