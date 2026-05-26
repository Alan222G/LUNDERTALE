// vaderSaberThrow.js — Darth Vader throws his spinning lightsaber
var VaderSaberThrowPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 2.2; // Every 2.2 seconds
    this.damVal = config.damVal || 9;
};

VaderSaberThrowPattern.prototype = Object.create(BulletPattern.prototype);

VaderSaberThrowPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 1.5; // Start sooner
};

VaderSaberThrowPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        this.throwSaber();
    }

    // Update custom saber bullet physics
    var bb = Cbbox.getBound();
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.spinAngle += dt * 18; // Fast spin

        // Custom bounce/return logic
        b.timer += dt;
        if (b.timer < 1.0) {
            // Throwing outwards
            b.x += b.vx * dt;
            b.y += b.vy * dt;
        } else if (b.timer < 1.3) {
            // Hovering at peak
            b.x += b.vx * 0.1 * dt;
            b.y += b.vy * 0.1 * dt;
        } else if (b.timer < 2.3) {
            // Returning back
            b.x -= b.vx * dt;
            b.y -= b.vy * dt;
        } else {
            // Fade out and delete
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

VaderSaberThrowPattern.prototype.throwSaber = function() {
    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];

    // Decide side: 0 = Top-to-Bottom, 1 = Left-to-Right, 2 = Diagonal
    var type = Math.floor(Math.random() * 3);
    var sx, sy, vx, vy;

    if (type === 0) {
        // Top to Bottom
        sx = bb[0] + Math.random() * (bbW - 60) + 30;
        sy = bb[1] - 20;
        vx = 0;
        vy = bbH * 0.9;
    } else if (type === 1) {
        // Left to Right
        sx = bb[0] - 20;
        sy = bb[1] + Math.random() * (bbH - 60) + 30;
        vx = bbW * 0.9;
        vy = 0;
    } else {
        // Diagonal
        var left = Math.random() < 0.5;
        sx = left ? bb[0] - 20 : bb[2] + 20;
        sy = bb[1] - 20;
        vx = left ? bbW * 0.75 : -bbW * 0.75;
        vy = bbH * 0.75;
    }

    var saberBullet = new Bullet({
        x: sx, y: sy,
        width: 45, height: 45, // Big hit box
        speed: 0,
        damVal: this.damVal,
        rotation: 0, fadeSpeed: 1.0, color: "#F00",
        vx: vx, vy: vy, useVelocity: true
    });
    saberBullet.spinAngle = 0;
    saberBullet.timer = 0;
    saberBullet.vx = vx;
    saberBullet.vy = vy;

    this.bullets.push(saberBullet);
    Sound.playSound("impact", true); // Hum / Throw sound
};

VaderSaberThrowPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        var cx = b.x + b.width / 2;
        var cy = b.y + b.height / 2;

        ctx.translate(cx, cy);
        ctx.rotate(b.spinAngle);

        // Huge red saber glow
        ctx.shadowBlur = 24;
        ctx.shadowColor = "#FF0000";

        // Draw double bladed spinning saber
        ctx.strokeStyle = "#FFFFFF"; // Solid white core
        ctx.lineWidth = 4.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-50, 0);
        ctx.lineTo(50, 0);
        ctx.stroke();

        // Handle in center
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#555";
        ctx.fillRect(-10, -3, 20, 6);
        ctx.fillStyle = "#C0C0C0";
        ctx.fillRect(-8, -2, 16, 4);

        ctx.restore();
    }
    ctx.restore();
};

VaderSaberThrowPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
