// vaderSaberShield.js — Darth Vader spins his lightsaber in the center, shooting spiral projectiles
var VaderSaberShieldPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 0.08; // High frequency rapid spiral
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

    this.spiralAngle += dt * 4.5; // continuous rotation

    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        
        // Spawn 2 symmetrical bullets along the rotating spiral angle
        var bulletSpeed = 160;
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

    // 1. Draw glowing spinning red lightsaber shield in center
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.translate(centerX, centerY);
    ctx.rotate(this.spiralAngle * 3); // rotate visual shield faster

    ctx.shadowBlur = 18;
    ctx.shadowColor = "#FF0000";
    ctx.strokeStyle = "#FFFFFF"; // white core
    ctx.lineWidth = 4.0;
    ctx.lineCap = "round";
    
    ctx.beginPath();
    ctx.moveTo(-32, 0);
    ctx.lineTo(32, 0);
    ctx.stroke();

    ctx.restore();

    // 2. Draw fired spiral bullets
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF0000";
        
        var bx = b.x + b.width / 2;
        var by = b.y + b.height / 2;
        var rad = b.width / 2;

        var grad = ctx.createRadialGradient(bx - 1, by - 1, 1, bx, by, rad);
        grad.addColorStop(0, "#FFFFFF");
        grad.addColorStop(0.4, "#FF3333");
        grad.addColorStop(1, "#8B0000");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bx, by, rad, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    ctx.restore();
};

VaderSaberShieldPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
