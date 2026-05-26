// vaderForcePull.js — Vader pulls the player towards the center with Force gravity and spawns red pillars
var VaderForcePullPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 0.38; // falling pillars frequency
    this.damVal = config.damVal || 8;
};

VaderForcePullPattern.prototype = Object.create(BulletPattern.prototype);

VaderForcePullPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
};

VaderForcePullPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];
    var centerX = (bb[0] + bb[2]) / 2;
    var centerY = (bb[1] + bb[3]) / 2;

    // Apply Force pull to center
    if (typeof Soul !== "undefined" && Soul.getPos && this.elapsed < this.duration - 0.5) {
        var spos = Soul.getPos();
        var spw = Soul.getWidth();
        var sph = Soul.getHeight();
        var px = spos.x + spw / 2;
        var py = spos.y + sph / 2;

        // Pull vector towards center
        var dx = centerX - px;
        var dy = centerY - py;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 10) {
            var pullStrength = 85; // moderate pull strength
            spos.x += (dx / dist) * pullStrength * dt;
            spos.y += (dy / dist) * pullStrength * dt;
        }
    }

    // Spawn falling red pillars
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        
        // Spawn falling column bullet
        var rx = bb[0] + 15 + Math.random() * (bbW - 30);
        var ry = bb[1] - 40;
        
        this.bullets.push(new Bullet({
            x: rx, y: ry,
            width: 14, height: 40,
            speed: 0,
            damVal: this.damVal,
            rotation: 0,
            fadeSpeed: 1.0,
            color: "#FF0055", // crimson red plasma pillar
            vx: 0, vy: 280, useVelocity: true
        }));

        if (Math.random() < 0.3) {
            Sound.playSound("impact", true);
        }
    }

    // Update bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);

        if (b.isOutOfBounds([bb[0] - 20, bb[1] - 80, bb[2] + 20, bb[3] + 80])) {
            this.bullets.splice(i, 1);
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

VaderForcePullPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];
    var centerX = (bb[0] + bb[2]) / 2;
    var centerY = (bb[1] + bb[3]) / 2;

    // 1. Draw glowing purple Force whirlpool in center of the box to indicate gravitational pull
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.08 + Math.sin(this.elapsed * 5) * 0.03;
    var pullGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 70);
    pullGrad.addColorStop(0, "#BA55D3");
    pullGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = pullGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Draw falling energy pillars
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#FF0000";

        // Outer glow
        ctx.fillStyle = "rgba(255, 0, 85, 0.85)";
        ctx.fillRect(b.x - 3, b.y, b.width + 6, b.height);

        // White core
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(b.x, b.y, b.width, b.height);

        ctx.restore();
    }

    ctx.restore();
};

VaderForcePullPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
