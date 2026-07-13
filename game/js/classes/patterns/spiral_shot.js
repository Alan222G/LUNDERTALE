// spiral_shot.js — Trigonometric spiral bullet pattern (Jevil-style)
// NEW pattern for LUNDERTALE — uses sin/cos for radial distribution

var SpiralShotPattern = function(config) {
    BulletPattern.call(this, config);
    this.numBullets = config.numBullets || 16;      // More Bullets per ring
    this.ringInterval = config.ringInterval || 0.25; // Faster spawn
    this.maxRings = config.maxRings || 15;           // More rings
    this.ringCount = 0;
    this.ringTimer = 0;
    this.angleOffset = 0;                            // Rotating offset for spiral effect
    this.spinSpeed = config.spinSpeed || 3.5;        // Faster rotation
    this.duration = config.duration || 6;
    this.elapsed = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.bulletSpeed = config.bulletSpeed || 90;     // Slower initial speed to allow curving
};

SpiralShotPattern.prototype = Object.create(BulletPattern.prototype);

SpiralShotPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.ringCount = 0;
    this.ringTimer = 0;
    this.angleOffset = 0;
    this.elapsed = 0;
    // Center of battle box
    this.centerX = (battleBox[0] + battleBox[2]) / 2;
    this.centerY = (battleBox[1] + battleBox[3]) / 2;
};

SpiralShotPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.ringTimer += dt;
    this.angleOffset += this.spinSpeed * dt;

    // Dynamically update center of battle box as it animates
    var bb = Cbbox.getBound();
    this.centerX = (bb[0] + bb[2]) / 2;
    this.centerY = (bb[1] + bb[3]) / 2;

    // Spawn new ring
    if (this.ringTimer >= this.ringInterval && this.ringCount < this.maxRings) {
        this.ringTimer -= this.ringInterval;
        this.spawnRing();
        this.ringCount++;
    }

    // Update bullets
    BulletPattern.prototype.update.call(this, dt);

    // Remove out-of-bounds
    var bb = Cbbox.getBound();
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        if (this.bullets[i].isOutOfBounds([bb[0] - 100, bb[1] - 100, bb[2] + 100, bb[3] + 100])) {
            this.bullets.splice(i, 1);
        }
    }
};

SpiralShotPattern.prototype.spawnRing = function() {
    var angleStep = (Math.PI * 2) / this.numBullets;

    for (var i = 0; i < this.numBullets; i++) {
        var theta = angleStep * i + this.angleOffset;
        var vx = Math.cos(theta) * this.bulletSpeed;
        var vy = Math.sin(theta) * this.bulletSpeed;
        
        // Tangential acceleration for curving effect
        var ax = -vy * 0.8;
        var ay = vx * 0.8;

        this.bullets.push(new Bullet({
            x: this.centerX - this.bulletWidth / 2,
            y: this.centerY - this.bulletHeight / 2,
            width: this.bulletWidth,
            height: this.bulletHeight,
            speed: 0,
            damVal: this.damVal,
            rotation: 0,
            fadeSpeed: 0.5,
            color: this.color,
            vx: vx,
            vy: vy,
            ax: ax,
            ay: ay,
            useVelocity: true
        }));
    }
};

SpiralShotPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        
        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        var bx = b.x + b.width / 2;
        var by = b.y + b.height / 2;
        var r = b.width / 2;
        
        // Outer glow
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(0, 200, 255, 0.6)";
        
        // Dark void core
        var vGrad = ctx.createRadialGradient(bx, by, 0, bx, by, r + 1);
        vGrad.addColorStop(0, "rgba(0, 0, 0, 0.9)");
        vGrad.addColorStop(0.6, "rgba(40, 0, 80, 0.7)");
        vGrad.addColorStop(1, "rgba(0, 200, 255, 0)");
        ctx.fillStyle = vGrad;
        ctx.beginPath();
        ctx.arc(bx, by, r + 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Chromatic edge
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(0, 255, 255, 0.8)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.stroke();
        
        // Bright center dot
        ctx.fillStyle = "rgba(180, 220, 255, 0.7)";
        ctx.beginPath();
        ctx.arc(bx, by, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    ctx.restore();
};

SpiralShotPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
