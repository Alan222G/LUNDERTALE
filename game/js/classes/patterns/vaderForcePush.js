// vaderForcePush.js — Darth Vader pushes the player with Force waves, spawning flying debris.
var VaderForcePushPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 2.4; // 3 wave sequences
    this.damVal = config.damVal || 8;
    this.waves = []; // active Force push waves: { side: 'left'|'right', warningTimer: 0.0, maxWarning: 0.9, activeTimer: 0.0, maxActive: 0.9, phase: 'warning'|'active'|'done' }
    this.debrisSpawnTimer = 0;
};

VaderForcePushPattern.prototype = Object.create(BulletPattern.prototype);

VaderForcePushPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 2.0; // Trigger first wave quickly
    this.debrisSpawnTimer = 0;
    this.waves = [];
};

VaderForcePushPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];

    // Spawn a new Force Wave
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        var side = Math.random() < 0.5 ? 'left' : 'right';
        this.waves.push({
            side: side,
            warningTimer: 0.0,
            maxWarning: 0.9,
            activeTimer: 0.0,
            maxActive: 0.9,
            phase: 'warning',
            soundPlayed: false
        });
    }

    // Process waves and apply push mechanics to the player soul
    var currentPushX = 0;
    var activeWaveSide = null;

    for (var i = this.waves.length - 1; i >= 0; i--) {
        var w = this.waves[i];
        if (w.phase === 'warning') {
            w.warningTimer += dt;
            if (w.warningTimer >= w.maxWarning) {
                w.phase = 'active';
            }
        } else if (w.phase === 'active') {
            w.activeTimer += dt;
            activeWaveSide = w.side;
            if (!w.soundPlayed) {
                Sound.playSound("impact", true);
                w.soundPlayed = true;
            }

            // Apply push speed
            var pushStrength = 220; // Pushing force pixels per second
            if (w.side === 'left') {
                currentPushX += pushStrength;
            } else {
                currentPushX -= pushStrength;
            }

            // Spawn debris from the active side
            this.debrisSpawnTimer += dt;
            if (this.debrisSpawnTimer >= 0.12) {
                this.debrisSpawnTimer = 0;
                this.spawnDebris(w.side, bb);
            }

            if (w.activeTimer >= w.maxActive) {
                w.phase = 'done';
                this.waves.splice(i, 1);
            }
        }
    }

    // Apply push velocity directly to Soul position if Soul is present
    if (currentPushX !== 0 && typeof Soul !== "undefined" && Soul.getPos) {
        var spos = Soul.getPos();
        spos.x += currentPushX * dt;
    }

    // Update debris bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        b.rotation += dt * 3.5; // slow tumble
        
        // Remove off-bounds
        if (b.isOutOfBounds([bb[0] - 30, bb[1] - 30, bb[2] + 30, bb[3] + 30])) {
            this.bullets.splice(i, 1);
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

VaderForcePushPattern.prototype.spawnDebris = function(side, bb) {
    var bbH = bb[3] - bb[1];
    var sy = bb[1] + 10 + Math.random() * (bbH - 20);
    var sx = (side === 'left') ? bb[0] - 15 : bb[2] + 15;
    
    // Speed towards the opposite side
    var vx = (side === 'left') ? 220 + Math.random() * 80 : -220 - Math.random() * 80;
    var vy = (Math.random() - 0.5) * 40;

    var debrisSize = 10 + Math.floor(Math.random() * 12);
    
    this.bullets.push(new Bullet({
        x: sx, y: sy,
        width: debrisSize, height: debrisSize,
        speed: 0,
        damVal: this.damVal,
        rotation: Math.random() * Math.PI,
        fadeSpeed: 1.0,
        color: "#696969", // Dark Grey metallic metal chunks
        vx: vx, vy: vy, useVelocity: true
    }));
};

VaderForcePushPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];

    // 1. Draw Force Waves indicators/shocks
    for (var i = 0; i < this.waves.length; i++) {
        var w = this.waves[i];
        ctx.save();
        if (w.phase === 'warning') {
            // Pulsing purple warning band on the pushing side
            var alpha = 0.15 + Math.sin(w.warningTimer * 12) * 0.1;
            ctx.fillStyle = "rgba(138, 43, 226, " + alpha + ")";
            if (w.side === 'left') {
                ctx.fillRect(bb[0], bb[1], 40, bbH);
            } else {
                ctx.fillRect(bb[2] - 40, bb[1], 40, bbH);
            }
        } else if (w.phase === 'active') {
            // Translucent glowing force blast expanding across screen
            var progress = w.activeTimer / w.maxActive;
            ctx.save();
            ctx.globalAlpha = 0.35 * (1.0 - progress);
            
            var grad = ctx.createLinearGradient(bb[0], 0, bb[2], 0);
            if (w.side === 'left') {
                grad.addColorStop(0, "rgba(186, 85, 211, 0.9)");
                grad.addColorStop(Math.min(1.0, progress * 1.3), "rgba(138, 43, 226, 0.4)");
                grad.addColorStop(1, "rgba(75, 0, 130, 0)");
            } else {
                grad.addColorStop(1, "rgba(186, 85, 211, 0.9)");
                grad.addColorStop(Math.max(0.0, 1.0 - progress * 1.3), "rgba(138, 43, 226, 0.4)");
                grad.addColorStop(0, "rgba(75, 0, 130, 0)");
            }
            ctx.fillStyle = grad;
            ctx.fillRect(bb[0], bb[1], bbW, bbH);
            ctx.restore();
        }
        ctx.restore();
    }

    // 2. Draw debris cubes
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.translate(b.x + b.width / 2, b.y + b.height / 2);
        ctx.rotate(b.rotation);

        // Volumetric metallic boxes
        ctx.fillStyle = "#4a4a4a";
        ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
        
        ctx.strokeStyle = "#8c8c8c";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);

        // Highlight
        ctx.fillStyle = "#777777";
        ctx.fillRect(-b.width / 2 + 1, -b.height / 2 + 1, b.width - 2, 2);

        ctx.restore();
    }
    ctx.restore();
};

VaderForcePushPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
