// thanosTimeParadox.js — Time Stone. Chronal freeze fields.
// Green warning lasers slice down. Periodically, time freezes for the player's soul
// (soul freezes in place with a green clock flash for 0.45s), requiring careful timing.

var ThanosTimeParadoxPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.freezeTimer = 0;
    this.damVal = config.damVal || 12;
    
    this.lasers = []; // active vertical lasers: { x, thickness, warningTimer, maxWarning: 1.0, activeTimer: 0.0, maxActive: 0.6, phase: 'warning'|'active' }
    this.isFrozen = false;
    this.freezeVisualTimer = 0.0;
};

ThanosTimeParadoxPattern.prototype = Object.create(BulletPattern.prototype);

ThanosTimeParadoxPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.3; // Start lasers soon
    this.freezeTimer = 0.8; // First freeze after 0.8 seconds
    this.lasers = [];
    this.isFrozen = false;
    this.freezeVisualTimer = 0;
};

ThanosTimeParadoxPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    this.freezeTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    
    // 1. Periodically Freeze the player in place
    if (this.freezeTimer >= 2.0 && this.elapsed < this.duration - 1.0) {
        this.freezeTimer = 0;
        this.isFrozen = true;
        this.freezeVisualTimer = 0.45; // Freeze duration
        Sound.playSound("impact", true); // Timestop chime sound
    }

    if (this.isFrozen) {
        this.freezeVisualTimer -= dt;
        if (this.freezeVisualTimer <= 0) {
            this.isFrozen = false;
        } else {
            // Keep the player locked at their current position!
            if (typeof Soul !== "undefined" && Soul.getPos) {
                var spos = Soul.getPos();
                Soul.setPos(spos.x, spos.y); // Lock movement
            }
        }
    }

    // 2. Spawn vertical green lasers
    if (this.spawnTimer >= 0.8 && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        
        var rx = bb[0] + 15 + Math.random() * (bbW - 30);
        this.lasers.push({
            x: rx,
            thickness: 24,
            warningTimer: 0.0,
            maxWarning: 0.95,
            activeTimer: 0.0,
            maxActive: 0.6,
            phase: 'warning',
            soundPlayed: false
        });
    }

    // Update active lasers
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

ThanosTimeParadoxPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2;
    var radius = (sw + sh) / 4;

    // Check laser sweeps
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.phase === 'active') {
            var laserLeft = l.x - l.thickness / 2;
            var laserRight = l.x + l.thickness / 2;
            if (cx + radius > laserLeft && cx - radius < laserRight) {
                return this.damVal;
            }
        }
    }

    return 0;
};

ThanosTimeParadoxPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var bbH = bb[3] - bb[1];

    // 1. Draw vertical green lasers
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.phase === 'warning') {
            ctx.save();
            var alpha = 0.15 + Math.sin(l.warningTimer * 20) * 0.08;
            ctx.fillStyle = "rgba(0, 230, 118, " + alpha + ")";
            ctx.fillRect(l.x - l.thickness / 2, bb[1], l.thickness, bbH);

            // Dotted green warning outlines
            ctx.strokeStyle = "#00E676";
            ctx.lineWidth = 1.2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(l.x - l.thickness / 2, bb[1]); ctx.lineTo(l.x - l.thickness / 2, bb[3]);
            ctx.moveTo(l.x + l.thickness / 2, bb[1]); ctx.lineTo(l.x + l.thickness / 2, bb[3]);
            ctx.stroke();
            ctx.restore();
        } else if (l.phase === 'active') {
            ctx.save();
            var progress = l.activeTimer / l.maxActive;
            ctx.globalAlpha = Math.max(0.1, 1.0 - progress * 0.35);

            ctx.shadowBlur = 18;
            ctx.shadowColor = "#00FF66";

            // Outer green beam
            ctx.fillStyle = "rgba(0, 230, 118, 0.85)";
            ctx.fillRect(l.x - l.thickness / 2, bb[1], l.thickness, bbH);

            // Pure white inner core
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(l.x - l.thickness / 5, bb[1], l.thickness * 0.4, bbH);

            ctx.restore();
        }
    }

    // 2. Draw full-screen green freeze overlay overlaying the box
    if (this.isFrozen) {
        ctx.fillStyle = "rgba(0, 230, 118, 0.15)";
        ctx.fillRect(bb[0], bb[1], bb[2] - bb[0], bbH);
        
        ctx.strokeStyle = "rgba(0, 230, 118, 0.4)";
        ctx.lineWidth = 2.0;
        ctx.strokeRect(bb[0], bb[1], bb[2] - bb[0], bbH);
    }

    ctx.restore();
};

ThanosTimeParadoxPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.lasers.length === 0;
};
