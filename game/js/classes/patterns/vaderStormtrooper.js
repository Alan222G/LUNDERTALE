// vaderStormtrooper.js — Summons Imperial Stormtroopers targeting the player with crosshairs and firing fast laser lines.
var VaderStormtrooperPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 1.25; // timing of targeted squad firing
    this.damVal = config.damVal || 7;
    
    this.targets = []; // active locks: { tx, ty, timer, maxLock: 0.75, fired: false }
};

VaderStormtrooperPattern.prototype = Object.create(BulletPattern.prototype);

VaderStormtrooperPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.5;
    this.targets = [];
};

VaderStormtrooperPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    var bb = Cbbox.getBound();

    // Player lock position
    var px = 320;
    var py = 320;
    if (typeof Soul !== "undefined" && Soul.getPos) {
        var sp = Soul.getPos();
        px = sp.x + Soul.getWidth() / 2;
        py = sp.y + Soul.getHeight() / 2;
    }

    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        
        // Spawn 2 target lock-on points targeting the player
        this.targets.push({
            tx: px + (Math.random() - 0.5) * 15,
            ty: py + (Math.random() - 0.5) * 15,
            timer: 0.0,
            maxLock: 0.75,
            fired: false
        });
        Sound.playSound("menu_navigate", true); // chirp warning
    }

    // Process targets and fire blaster bolts
    for (var i = this.targets.length - 1; i >= 0; i--) {
        var t = this.targets[i];
        t.timer += dt;

        if (t.timer >= t.maxLock && !t.fired) {
            t.fired = true;
            Sound.playSound("soul_hit", true); // blaster fire sound

            // Spawn 4 blaster bolts from the edges meeting at (t.tx, t.ty) and flying across
            var directions = [
                { sx: t.tx, sy: bb[1] - 15, vx: 0, vy: 320 }, // from top
                { sx: t.tx, sy: bb[3] + 15, vx: 0, vy: -320 }, // from bottom
                { sx: bb[0] - 15, sy: t.ty, vx: 320, vy: 0 }, // from left
                { sx: bb[2] + 15, sy: t.ty, vx: -320, vy: 0 }  // from right
            ];

            for (var d = 0; d < directions.length; d++) {
                var dir = directions[d];
                this.bullets.push(new Bullet({
                    x: dir.sx - 7, y: dir.sy - 7,
                    width: 14, height: 14,
                    speed: 0,
                    damVal: this.damVal,
                    rotation: Math.atan2(dir.vy, dir.vx),
                    fadeSpeed: 1.0,
                    color: "#FF1414", // Bright red blaster
                    vx: dir.vx, vy: dir.vy, useVelocity: true
                }));
            }
        }

        if (t.timer >= t.maxLock + 0.3) {
            this.targets.splice(i, 1);
        }
    }

    // Update bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);

        if (b.isOutOfBounds([bb[0] - 30, bb[1] - 30, bb[2] + 30, bb[3] + 30])) {
            this.bullets.splice(i, 1);
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

VaderStormtrooperPattern.prototype.draw = function(ctx) {
    ctx.save();

    // 1. Draw target crosshair lock-on guides
    for (var i = 0; i < this.targets.length; i++) {
        var t = this.targets[i];
        if (!t.fired) {
            ctx.save();
            ctx.strokeStyle = "rgba(255, 0, 0, 0.75)";
            ctx.lineWidth = 1.2;

            // Reticle scaling down to center
            var progress = t.timer / t.maxLock;
            var reticleSize = 35 * (1.0 - progress * 0.75);

            ctx.beginPath();
            // Horizontal cross
            ctx.moveTo(t.tx - reticleSize, t.ty); ctx.lineTo(t.tx + reticleSize, t.ty);
            // Vertical cross
            ctx.moveTo(t.tx, t.ty - reticleSize); ctx.lineTo(t.tx, t.ty + reticleSize);
            ctx.stroke();

            // Lock circle
            ctx.beginPath();
            ctx.arc(t.tx, t.ty, reticleSize * 0.6, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        }
    }

    // 2. Draw flying laser bolts
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.translate(b.x + b.width / 2, b.y + b.height / 2);
        ctx.rotate(b.rotation);

        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FF0000";

        // Red laser capsule
        ctx.fillStyle = "#FFFFFF"; // hot center
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#FF1e1e";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
    }

    ctx.restore();
};

VaderStormtrooperPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
