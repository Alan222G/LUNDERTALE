// vaderSaberShield.js — Darth Vader spins his lightsaber in the center, shooting spiral projectiles
var VaderSaberShieldPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 0.18; // Balanced frequency to make it fun and dodgeable
    this.damVal = config.damVal || 8;
    this.spiralAngle = 0;
};

VaderSaberShieldPattern.prototype = Object.create(BulletPattern.prototype);

VaderSaberShieldPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.spiralAngle = 0;
};

VaderSaberShieldPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    var bb = Cbbox.getBound();
    var centerX = (bb[0] + bb[2]) / 2;
    var centerY = (bb[1] + bb[3]) / 2;

    this.spiralAngle += dt * 3.2; // slightly slower rotation for clean spiral structure

    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        
        // Spawn 2 symmetrical bullets along the rotating spiral angle
        var bulletSpeed = 95; // Reduced speed as requested
        for (var i = 0; i < 2; i++) {
            var angle = this.spiralAngle + i * Math.PI;
            var vx = Math.cos(angle) * bulletSpeed;
            var vy = Math.sin(angle) * bulletSpeed;

            this.bullets.push(new Bullet({
                x: centerX - 6, y: centerY - 6,
                width: 12, height: 12,
                speed: 0,
                damVal: this.damVal,
                rotation: angle,
                fadeSpeed: 1.0,
                color: "#FF1e1e", // Sith red fire orb
                vx: vx, vy: vy, useVelocity: true
            }));
        }

        if (Math.random() < 0.2) {
            Sound.playSound("menu_navigate", true);
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

VaderSaberShieldPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var centerX = (bb[0] + bb[2]) / 2;
    var centerY = (bb[1] + bb[3]) / 2;

    // 1. Draw glowing spinning red lightsaber shield in center with a circular motion trail
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    // Circular movement trail (plasma ring)
    var forcePulse = 1.0 + Math.sin(Date.now() / 90) * 0.08;
    var ringGrad = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, 36 * forcePulse);
    ringGrad.addColorStop(0, "rgba(255, 0, 0, 0.0)");
    ringGrad.addColorStop(0.5, "rgba(255, 0, 0, 0.22)");
    ringGrad.addColorStop(0.95, "rgba(255, 50, 50, 0.35)");
    ringGrad.addColorStop(1, "rgba(255, 0, 0, 0.0)");
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 36 * forcePulse, 0, Math.PI * 2);
    ctx.fill();

    // Actual spinning lightsaber
    ctx.translate(centerX, centerY);
    ctx.rotate(this.spiralAngle * 4.5); // rotate visual blade super fast

    ctx.shadowBlur = 24;
    ctx.shadowColor = "#FF0000";
    
    // Crimson blade energy
    ctx.strokeStyle = "#FF3333";
    ctx.lineWidth = 7.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-34, 0); ctx.lineTo(34, 0);
    ctx.stroke();

    // White hot core
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-32, 0); ctx.lineTo(32, 0);
    ctx.stroke();

    ctx.restore();

    // 2. Draw fired spiral bullets (detailed orbs of fire)
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#FF0000";
        
        var bx = b.x + b.width / 2;
        var by = b.y + b.height / 2;
        var rad = b.width / 2;

        // Radial fire plasma gradient
        var grad = ctx.createRadialGradient(bx - 1.5, by - 1.5, 0.8, bx, by, rad);
        grad.addColorStop(0, "#FFFFFF"); // white hot center
        grad.addColorStop(0.35, "#FF6666"); // orange-red transition
        grad.addColorStop(0.8, "#FF0000"); // saturated red
        grad.addColorStop(1, "rgba(139, 0, 0, 0)"); // fading edges

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bx, by, rad + 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    ctx.restore();
};

VaderSaberShieldPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
