// vaderDeathStarLaser.js — Death Star Superlaser sweeps horizontally with a warning.
var VaderDeathStarLaserPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 2.6; // 3 sweeps
    this.damVal = config.damVal || 12;
    this.lasers = []; // active lasers: { y, warningTimer, maxWarning: 1.2, activeTimer: 0.0, maxActive: 0.8, phase: 'warning'|'active', soundPlayed: false }
};

VaderDeathStarLaserPattern.prototype = Object.create(BulletPattern.prototype);

VaderDeathStarLaserPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 1.6; // Start soon
    this.lasers = [];
};

VaderDeathStarLaserPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    var bb = Cbbox.getBound();
    var bbH = bb[3] - bb[1];

    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        
        // Pick a y position inside the battle box
        var ry = bb[1] + 20 + Math.random() * (bbH - 60);
        this.lasers.push({
            y: ry,
            warningTimer: 0.0,
            maxWarning: 1.2,
            activeTimer: 0.0,
            maxActive: 0.8,
            phase: 'warning',
            soundPlayed: false
        });
    }

    // Update lasers
    for (var i = this.lasers.length - 1; i >= 0; i--) {
        var l = this.lasers[i];
        if (l.phase === 'warning') {
            l.warningTimer += dt;
            if (l.warningTimer >= l.maxWarning) {
                l.phase = 'active';
            }
        } else if (l.phase === 'active') {
            l.activeTimer += dt;
            if (!l.soundPlayed) {
                Sound.playSound("soul_shatter", true); // Laser blast screech
                l.soundPlayed = true;
            }
            if (l.activeTimer >= l.maxActive) {
                this.lasers.splice(i, 1);
            }
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

VaderDeathStarLaserPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cy = sy + sh / 2;
    var radius = (sw + sh) / 4;

    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.phase !== 'active') continue;

        // Collision check: if player y is within the laser beam thickness (height: 36px)
        var laserTop = l.y - 18;
        var laserBottom = l.y + 18;
        if (cy + radius > laserTop && cy - radius < laserBottom) {
            return this.damVal;
        }
    }
    return 0;
};

VaderDeathStarLaserPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];

    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.phase === 'warning') {
            // Large green blinking laser warning block
            ctx.save();
            var alpha = 0.12 + Math.sin(l.warningTimer * 18) * 0.08;
            ctx.fillStyle = "rgba(57, 255, 20, " + alpha + ")";
            ctx.fillRect(bb[0], l.y - 18, bbW, 36);
            
            // Thin dotted warning lines
            ctx.strokeStyle = "#39FF14";
            ctx.lineWidth = 1.0;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(bb[0], l.y - 18); ctx.lineTo(bb[2], l.y - 18);
            ctx.moveTo(bb[0], l.y + 18); ctx.lineTo(bb[2], l.y + 18);
            ctx.stroke();
            ctx.restore();
        } else if (l.phase === 'active') {
            // Giant green laser blast
            ctx.save();
            var progress = l.activeTimer / l.maxActive;
            ctx.globalAlpha = 1.0 - progress * 0.4;
            
            ctx.shadowBlur = 24;
            ctx.shadowColor = "#39FF14";

            // Laser outer green core
            ctx.fillStyle = "rgba(57, 255, 20, 0.8)";
            ctx.fillRect(bb[0], l.y - 18, bbW, 36);

            // Laser inner pure white core
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(bb[0], l.y - 8, bbW, 16);

            ctx.restore();
        }
    }

    ctx.restore();
};

VaderDeathStarLaserPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.lasers.length === 0;
};
