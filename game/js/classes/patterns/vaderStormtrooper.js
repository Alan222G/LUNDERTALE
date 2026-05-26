// vaderStormtrooper.js — Darth Vader summons Imperial Stormtroopers to fire blaster barrages.
var VaderStormtrooperPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 0.45; // Rapid blaster fire
    this.damVal = config.damVal || 7;
};

VaderStormtrooperPattern.prototype = Object.create(BulletPattern.prototype);

VaderStormtrooperPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
};

VaderStormtrooperPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];

    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        
        // Fire 2 blaster bolts from random edges towards the center area
        for (var i = 0; i < 2; i++) {
            var side = Math.floor(Math.random() * 4); // 0=Top, 1=Right, 2=Bottom, 3=Left
            var sx, sy, vx, vy;
            var speed = 250 + Math.random() * 120;

            if (side === 0) {
                // From Top
                sx = bb[0] + 15 + Math.random() * (bbW - 30);
                sy = bb[1] - 15;
                vx = (Math.random() - 0.5) * 80;
                vy = speed;
            } else if (side === 1) {
                // From Right
                sx = bb[2] + 15;
                sy = bb[1] + 15 + Math.random() * (bbH - 30);
                vx = -speed;
                vy = (Math.random() - 0.5) * 80;
            } else if (side === 2) {
                // From Bottom
                sx = bb[0] + 15 + Math.random() * (bbW - 30);
                sy = bb[3] + 15;
                vx = (Math.random() - 0.5) * 80;
                vy = -speed;
            } else {
                // From Left
                sx = bb[0] - 15;
                sy = bb[1] + 15 + Math.random() * (bbH - 30);
                vx = speed;
                vy = (Math.random() - 0.5) * 80;
            }

            this.bullets.push(new Bullet({
                x: sx, y: sy,
                width: 14, height: 14,
                speed: 0,
                damVal: this.damVal,
                rotation: Math.atan2(vy, vx),
                fadeSpeed: 1.0,
                color: "#FF1414", // Bright Imperial red blaster bolt
                vx: vx, vy: vy, useVelocity: true
            }));
        }

        if (Math.random() < 0.35) {
            Sound.playSound("soul_hit", true); // blaster laser sound
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
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.translate(b.x + b.width / 2, b.y + b.height / 2);
        ctx.rotate(b.rotation);

        // Glowing red capsule shape blaster bullet
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FF0000";
        
        ctx.fillStyle = "#FFFFFF"; // Pure white core
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#FF3333";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.restore();
    }
    ctx.restore();
};

VaderStormtrooperPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
