// vaderDarkPresence.js — Shadow of Vader slashes an expanding circle of energy waves.
var VaderDarkPresencePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 2.4; // Fling events
    this.damVal = config.damVal || 9;
    this.shadows = []; // active shadows: { x, y, timer, maxWarning: 0.9, maxActive: 0.8, phase: 'warning'|'active', shockwavesSpawned: false }
};

VaderDarkPresencePattern.prototype = Object.create(BulletPattern.prototype);

VaderDarkPresencePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 1.8; // Trigger first shadow quickly
    this.shadows = [];
};

VaderDarkPresencePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    var bb = Cbbox.getBound();
    var centerX = (bb[0] + bb[2]) / 2;
    var centerY = (bb[1] + bb[3]) / 2;

    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        
        // Spawn shadow presence in the center
        this.shadows.push({
            x: centerX,
            y: centerY,
            timer: 0.0,
            maxWarning: 0.9,
            maxActive: 0.8,
            phase: 'warning',
            shockwavesSpawned: false
        });
    }

    // Process shadows
    for (var i = this.shadows.length - 1; i >= 0; i--) {
        var s = this.shadows[i];
        s.timer += dt;

        if (s.phase === 'warning') {
            if (s.timer >= s.maxWarning) {
                s.phase = 'active';
            }
        } else if (s.phase === 'active') {
            if (!s.shockwavesSpawned) {
                s.shockwavesSpawned = true;
                Sound.playSound("slash", true); // Slash sound

                // Spawn 12 expanding fireballs/sparks in all directions from the center
                var numShocks = 10;
                var speed = 190;
                for (var sh = 0; sh < numShocks; sh++) {
                    var angle = (sh / numShocks) * Math.PI * 2;
                    var vx = Math.cos(angle) * speed;
                    var vy = Math.sin(angle) * speed;

                    this.bullets.push(new Bullet({
                        x: s.x - 6, y: s.y - 6,
                        width: 12, height: 12,
                        speed: 0,
                        damVal: this.damVal,
                        rotation: angle,
                        fadeSpeed: 1.0,
                        color: "#FF0000",
                        vx: vx, vy: vy, useVelocity: true
                    }));
                }
            }

            if (s.timer >= s.maxWarning + s.maxActive) {
                this.shadows.splice(i, 1);
            }
        }
    }

    // Update bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);

        if (b.isOutOfBounds([bb[0] - 20, bb[1] - 20, bb[2] + 20, bb[3] + 20])) {
            this.bullets.splice(i, 1);
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

VaderDarkPresencePattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();

    // 1. Draw glowing red shadow outline in the center
    for (var i = 0; i < this.shadows.length; i++) {
        var s = this.shadows[i];
        ctx.save();
        ctx.translate(s.x, s.y);

        if (s.phase === 'warning') {
            var alpha = 0.25 + Math.sin(s.timer * 12) * 0.15;
            ctx.fillStyle = "rgba(255, 0, 0, " + alpha + ")";
            ctx.strokeStyle = "#FF3333";
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#FF0000";

            // Draw a Vader-like helmet shape outline in the center
            ctx.beginPath();
            ctx.arc(0, -12, 14, Math.PI, 0, false);
            ctx.lineTo(12, 12);
            ctx.lineTo(-12, 12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Draw outline of crossing red lightsabers
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(-20, 10); ctx.lineTo(20, -25);
            ctx.stroke();
        } else {
            // Active phase fadeout
            var progress = (s.timer - s.maxWarning) / s.maxActive;
            var alpha = 0.4 * (1.0 - progress);
            ctx.fillStyle = "rgba(139, 0, 0, " + alpha + ")";
            ctx.beginPath();
            ctx.arc(0, 0, 28 * progress, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // 2. Draw expanding slash energy bullets
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FF0000";

        var bx = b.x + b.width / 2;
        var by = b.y + b.height / 2;
        var rad = b.width / 2;

        // Draw dynamic crimson blade slice arcs
        ctx.strokeStyle = "#FF3333";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(bx, by, rad, b.rotation - 0.4, b.rotation + 0.4);
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF"; // inner spark
        ctx.beginPath();
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    ctx.restore();
};

VaderDarkPresencePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
