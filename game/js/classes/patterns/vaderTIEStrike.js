// vaderTIEStrike.js — Cazas TIE Fighter imperiales disparan ráfagas láser verde sobre la arena
var VaderTIEStrikePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 1.35; // Spawn a firing sweep frequently
    this.damVal = config.damVal || 8;
    this.lines = []; // active warning/active laser lines: { x1, y1, x2, y2, angle, timer, maxWarning: 0.6, maxActive: 0.45, speed: 450, bulletsSpawned: false }
};

VaderTIEStrikePattern.prototype = Object.create(BulletPattern.prototype);

VaderTIEStrikePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.8; // Trigger quickly
    this.lines = [];
};

VaderTIEStrikePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];

    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        
        // Spawn 2 parallel TIE laser lines
        var isVertical = Math.random() < 0.5;
        var offset = 35 + Math.random() * 40;
        var baseCoord = isVertical
            ? bb[0] + 30 + Math.random() * (bbW - 60 - offset)
            : bb[1] + 20 + Math.random() * (bbH - 40 - offset);

        for (var n = 0; n < 2; n++) {
            var coord = baseCoord + n * offset;
            var x1, y1, x2, y2;
            if (isVertical) {
                x1 = coord;
                y1 = bb[1] - 15;
                x2 = coord;
                y2 = bb[3] + 15;
            } else {
                x1 = bb[0] - 15;
                y1 = coord;
                x2 = bb[2] + 15;
                y2 = coord;
            }

            this.lines.push({
                x1: x1, y1: y1, x2: x2, y2: y2,
                isVertical: isVertical,
                timer: 0.0,
                maxWarning: 0.7,
                maxActive: 0.4,
                bulletsSpawned: false
            });
        }
        Sound.playSound("menu_navigate", true); // chirp sound for warning
    }

    // Process laser lines and spawn fast laser bullets
    for (var i = this.lines.length - 1; i >= 0; i--) {
        var l = this.lines[i];
        l.timer += dt;

        if (l.timer >= l.maxWarning && !l.bulletsSpawned) {
            l.bulletsSpawned = true;
            Sound.playSound("soul_shatter", true); // TIE blast screech/laser sound
            
            // Spawn 3 laser pulse bullets moving down the line
            var bulletSpeed = 500;
            var numPulses = 4;
            for (var bp = 0; bp < numPulses; bp++) {
                var delay = bp * 0.06;
                var sx = l.x1;
                var sy = l.y1;
                var vx = 0;
                var vy = 0;

                if (l.isVertical) {
                    vy = bulletSpeed;
                    sy -= (delay * bulletSpeed);
                } else {
                    vx = bulletSpeed;
                    sx -= (delay * bulletSpeed);
                }

                this.bullets.push(new Bullet({
                    x: sx, y: sy,
                    width: l.isVertical ? 6 : 22,
                    height: l.isVertical ? 22 : 6,
                    speed: 0,
                    damVal: this.damVal,
                    rotation: 0,
                    fadeSpeed: 1.0,
                    color: "#39FF14", // Acid Neon green TIE laser
                    vx: vx, vy: vy, useVelocity: true
                }));
            }
        }

        if (l.timer >= l.maxWarning + l.maxActive) {
            this.lines.splice(i, 1);
        }
    }

    // Update bullets and clear offscreen
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        
        if (b.isOutOfBounds([bb[0] - 120, bb[1] - 120, bb[2] + 120, bb[3] + 120])) {
            this.bullets.splice(i, 1);
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

VaderTIEStrikePattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();

    // 1. Draw glowing neon green warning lines
    for (var i = 0; i < this.lines.length; i++) {
        var l = this.lines[i];
        if (l.timer < l.maxWarning) {
            ctx.save();
            var alpha = 0.2 + Math.sin(l.timer * 15) * 0.15;
            ctx.strokeStyle = "rgba(57, 255, 20, " + alpha + ")";
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(l.x1, l.y1);
            ctx.lineTo(l.x2, l.y2);
            ctx.stroke();
            ctx.restore();
        }
    }

    // 2. Draw TIE laser bolts
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.fillStyle = "#FFFFFF"; // Pure white core
        
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#39FF14"; // Acid neon green outer glow

        // Rounded laser pulse rectangle
        ctx.beginPath();
        ctx.rect(b.x, b.y, b.width, b.height);
        ctx.fill();

        ctx.strokeStyle = "#39FF14";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
    }

    ctx.restore();
};

VaderTIEStrikePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
