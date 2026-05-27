// vaderImperialBarrage.js — Sith Blaster & Laser Barrage.
// Darth Vader unleashes a heavy barrage of red blaster bolts from the left and right borders,
// while coordinated high-power crimson lasers sweep horizontally across the field.
// This implementation is 100% mathematically stable and immune to canvas index errors.

var VaderImperialBarragePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 9;
    
    this.lasers = [];
    this.alternateLeft = false;
    this.laser1Spawned = false;
    this.laser2Spawned = false;
    this.laser3Spawned = false;
};

VaderImperialBarragePattern.prototype = Object.create(BulletPattern.prototype);

VaderImperialBarragePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2; // Fire almost immediately
    this.lasers = [];
    this.alternateLeft = false;
    this.laser1Spawned = false;
    this.laser2Spawned = false;
    this.laser3Spawned = false;
};

VaderImperialBarragePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    var bb = Cbbox.getBound();
    var bbH = bb[3] - bb[1];

    // 1. Coordinated Laser Sweeps Scheduling
    if (this.elapsed >= 1.0 && !this.laser1Spawned) {
        this.laser1Spawned = true;
        this.spawnLaser(bb[1] + bbH * 0.25, 26); // Top sweep
    }
    if (this.elapsed >= 3.2 && !this.laser2Spawned) {
        this.laser2Spawned = true;
        this.spawnLaser(bb[1] + bbH * 0.75, 26); // Bottom sweep
    }
    if (this.elapsed >= 5.2 && !this.laser3Spawned) {
        this.laser3Spawned = true;
        this.spawnLaser(bb[1] + bbH * 0.5, 32); // Middle sweep
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
                Sound.playSound("soul_shatter", true); // Laser sweep blast sound
                l.soundPlayed = true;
            }
            if (l.activeTimer >= l.maxActive) {
                this.lasers.splice(i, 1);
            }
        }
    }

    // 2. Continuous Blaster Fire Barrage
    if (this.spawnTimer >= 0.34 && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        this.fireBlaster(bb);
    }

    // 3. Update standard bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        if (b.isOutOfBounds(bb)) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

VaderImperialBarragePattern.prototype.spawnLaser = function(y, thickness) {
    this.lasers.push({
        y: y,
        thickness: thickness,
        warningTimer: 0.0,
        maxWarning: 1.1,
        activeTimer: 0.0,
        maxActive: 0.75,
        phase: 'warning',
        soundPlayed: false
    });
};

VaderImperialBarragePattern.prototype.fireBlaster = function(bb) {
    this.alternateLeft = !this.alternateLeft;
    var bx, vx;
    var by = bb[1] + 12 + Math.random() * (bb[3] - bb[1] - 24);

    if (this.alternateLeft) {
        bx = bb[0] - 18;
        vx = 175; // Move to the right
    } else {
        bx = bb[2] - 2;
        vx = -175; // Move to the left
    }

    var blasterBolt = new Bullet({
        x: bx,
        y: by,
        width: 20,
        height: 12,
        speed: 0,
        damVal: this.damVal,
        color: "#FF3366",
        vx: vx,
        vy: 0,
        useVelocity: true
    });

    this.bullets.push(blasterBolt);
    Sound.playSound("impact", true); // Blaster firing hum/thud sound
};

VaderImperialBarragePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cy = sy + sh / 2;
    var radius = (sw + sh) / 4;

    // 1. Check laser sweeps
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.phase === 'active') {
            var laserTop = l.y - l.thickness / 2;
            var laserBottom = l.y + l.thickness / 2;
            if (cy + radius > laserTop && cy - radius < laserBottom) {
                return this.damVal;
            }
        }
    }

    // 2. Check blaster bullets
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && b.fadeTick >= 1) {
            if (rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }

    return 0;
};

VaderImperialBarragePattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];

    // 1. Draw horizontal laser sweeps
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.phase === 'warning') {
            ctx.save();
            var alpha = 0.15 + Math.sin(l.warningTimer * 22) * 0.08;
            ctx.fillStyle = "rgba(255, 30, 30, " + alpha + ")";
            ctx.fillRect(bb[0], l.y - l.thickness / 2, bbW, l.thickness);

            // Crimson dotted outline warning
            ctx.strokeStyle = "#FF3333";
            ctx.lineWidth = 1.2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(bb[0], l.y - l.thickness / 2); ctx.lineTo(bb[2], l.y - l.thickness / 2);
            ctx.moveTo(bb[0], l.y + l.thickness / 2); ctx.lineTo(bb[2], l.y + l.thickness / 2);
            ctx.stroke();
            ctx.restore();
        } else if (l.phase === 'active') {
            ctx.save();
            var progress = l.activeTimer / l.maxActive;
            ctx.globalAlpha = Math.max(0.1, 1.0 - progress * 0.35);

            ctx.shadowBlur = 18;
            ctx.shadowColor = "#FF0000";

            // Thick outer glowing red beam
            ctx.fillStyle = "rgba(255, 25, 25, 0.85)";
            ctx.fillRect(bb[0], l.y - l.thickness / 2, bbW, l.thickness);

            // Pure white inner core
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(bb[0], l.y - l.thickness / 4, bbW, l.thickness / 2);

            ctx.restore();
        }
    }

    // 2. Draw blaster bullets custom-styled
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;

        var cx = b.x + b.width / 2;
        var cy = b.y + b.height / 2;

        ctx.shadowBlur = 12;
        ctx.shadowColor = "#FF0033";

        // Outer glowing crimson horizontal blaster bolt
        ctx.strokeStyle = "#FF3366";
        ctx.lineWidth = 4.0;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy);
        ctx.lineTo(cx + 10, cy);
        ctx.stroke();

        // High intensity white center core
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy);
        ctx.lineTo(cx + 8, cy);
        ctx.stroke();

        ctx.restore();
    }

    ctx.restore();
};

VaderImperialBarragePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.lasers.length === 0 && this.bullets.length === 0;
};
