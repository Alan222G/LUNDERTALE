// thanosTitanBlade.js — Thanos throws his spinning double-bladed sword.
// A giant metallic sword bounces off the battle box walls diagonally,
// while emitting golden blade sparks.

var ThanosTitanBladePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 12;
    
    this.sword = { x: 300, y: 200, vx: 180, vy: 140, spinAngle: 0.0, width: 70, height: 16 };
};

ThanosTitanBladePattern.prototype = Object.create(BulletPattern.prototype);

ThanosTitanBladePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    
    var bb = Cbbox.getBound();
    this.sword = {
        x: bb[0] + 30,
        y: bb[1] + 30,
        vx: 170,
        vy: 130,
        spinAngle: 0.0,
        width: 75,
        height: 16
    };
    Sound.playSound("impact", true); // Sword swoosh sound
};

ThanosTitanBladePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    var bb = Cbbox.getBound();
    var s = this.sword;

    // 1. Move and Spin the double blade
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.spinAngle += dt * 15; // Fast spin

    // Wall bounces
    if (s.x < bb[0]) { s.x = bb[0]; s.vx *= -1; Sound.playSound("damage", true); }
    if (s.x > bb[2]) { s.x = bb[2]; s.vx *= -1; Sound.playSound("damage", true); }
    if (s.y < bb[1]) { s.y = bb[1]; s.vy *= -1; Sound.playSound("damage", true); }
    if (s.y > bb[3]) { s.y = bb[3]; s.vy *= -1; Sound.playSound("damage", true); }

    // 2. Emit golden sparks from the sword's path
    if (this.spawnTimer >= 0.22 && this.elapsed < this.duration - 0.5) {
        this.spawnTimer = 0;
        
        var spark = new Bullet({
            x: s.x - 5,
            y: s.y - 5,
            width: 8,
            height: 8,
            speed: 0,
            damVal: this.damVal - 3,
            color: "#FFD700",
            vx: (Math.random() - 0.5) * 60,
            vy: (Math.random() - 0.5) * 60,
            useVelocity: true
        });
        this.bullets.push(spark);
    }

    // Update sparks
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

ThanosTitanBladePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var s = this.sword;
    
    // 1. Check collision with giant spinning sword (AABB circle approximation)
    var scx = s.x;
    var scy = s.y;
    var pcx = sx + sw / 2;
    var pcy = sy + sh / 2;
    var dist = Math.sqrt((pcx - scx)*(pcx - scx) + (pcy - scy)*(pcy - scy));
    
    if (dist < (sw/2 + s.width/2.5)) {
        return this.damVal;
    }

    // 2. Check collision with sparks
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && b.fadeTick >= 1) {
            if (rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
                return this.damVal - 3;
            }
        }
    }

    return 0;
};

ThanosTitanBladePattern.prototype.draw = function(ctx) {
    ctx.save();
    var s = this.sword;

    // 1. Draw Golden Sparks
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FFD700";
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    // 2. Draw Giant Double-Bladed Sword
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.spinAngle);
    
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(255, 255, 255, 0.4)";

    // Hilt / center handle
    ctx.fillStyle = "#FFB300"; // Gold
    ctx.fillRect(-10, -4, 20, 8);

    // Left blade (sliver gradient)
    var leftGrad = ctx.createLinearGradient(-s.width / 2, 0, 0, 0);
    leftGrad.addColorStop(0, "#E0E0E0");
    leftGrad.addColorStop(1, "#808080");
    ctx.fillStyle = leftGrad;
    ctx.beginPath();
    ctx.moveTo(-10, -6);
    ctx.lineTo(-s.width / 2 + 10, -6);
    ctx.lineTo(-s.width / 2, 0); // Tip
    ctx.lineTo(-s.width / 2 + 10, 6);
    ctx.lineTo(-10, 6);
    ctx.closePath();
    ctx.fill();

    // Right blade
    var rightGrad = ctx.createLinearGradient(0, 0, s.width / 2, 0);
    rightGrad.addColorStop(0, "#808080");
    rightGrad.addColorStop(1, "#E0E0E0");
    ctx.fillStyle = rightGrad;
    ctx.beginPath();
    ctx.moveTo(10, -6);
    ctx.lineTo(s.width / 2 - 10, -6);
    ctx.lineTo(s.width / 2, 0); // Tip
    ctx.lineTo(s.width / 2 - 10, 6);
    ctx.lineTo(10, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
    ctx.restore();
};

ThanosTitanBladePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
