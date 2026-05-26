// vaderForceChoke.js — Darth Vader chokes the arena, shrinking it and pulling the player
var VaderForceChokePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 0.25;
    this.damVal = config.damVal || 8;
};

VaderForceChokePattern.prototype = Object.create(BulletPattern.prototype);

VaderForceChokePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    
    // Set soul to BLUE gravity mode to simulate Force choke pull
    if (typeof Soul !== "undefined" && Soul.setSoulMode) {
        Soul.setSoulMode(Soul.SOUL_MODE.BLUE);
    }
};

VaderForceChokePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    // Squeeze the combat arena slowly
    var currentW = Math.max(220, 574 - this.elapsed * 45);
    var currentH = Math.max(110, 140 - this.elapsed * 4);
    if (typeof Cbbox !== "undefined" && Cbbox.setup) {
        Cbbox.setup(currentW, currentH);
    }

    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        this.spawnForceSphere();
    }

    BulletPattern.prototype.update.call(this, dt);

    var bb = Cbbox.getBound();
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        if (this.bullets[i].isOutOfBounds([bb[0] - 20, bb[1] - 20, bb[2] + 20, bb[3] + 20])) {
            this.bullets.splice(i, 1);
        }
    }

    // Restore red soul and arena size at the very end
    if (this.elapsed >= this.duration) {
        if (typeof Soul !== "undefined" && Soul.setSoulMode) {
            Soul.setSoulMode(Soul.SOUL_MODE.RED);
        }
        if (typeof Cbbox !== "undefined" && Cbbox.setup) {
            Cbbox.setup(574, 140);
        }
    }
};

VaderForceChokePattern.prototype.spawnForceSphere = function() {
    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];

    // Spawn around the edges flying towards the center
    var angle = Math.random() * Math.PI * 2;
    var dist = Math.max(bbW, bbH) * 0.7;
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;

    var sx = cx + Math.cos(angle) * dist;
    var sy = cy + Math.sin(angle) * dist;

    // Homing angle
    var targetAngle = Math.atan2(cy - sy, cx - sx) + (Math.random() - 0.5) * 0.25;
    var speed = 120 + Math.random() * 60;
    var vx = Math.cos(targetAngle) * speed;
    var vy = Math.sin(targetAngle) * speed;

    this.bullets.push(new Bullet({
        x: sx, y: sy,
        width: 12, height: 12,
        speed: 0,
        damVal: this.damVal,
        rotation: 0, fadeSpeed: 1.0, color: "#9370DB",
        vx: vx, vy: vy, useVelocity: true
    }));
};

VaderForceChokePattern.prototype.draw = function(ctx) {
    ctx.save();
    
    // Draw an ominous purple haze inside the battle box
    var bb = Cbbox.getBound();
    ctx.save();
    ctx.globalAlpha = 0.08 + Math.sin(this.elapsed * 3) * 0.03;
    ctx.fillStyle = "#8B008B";
    ctx.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
    ctx.restore();

    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        var cx = b.x + b.width / 2;
        var cy = b.y + b.height / 2;
        var rad = b.width / 2;

        // Dark Force Haze Glow
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#BA55D3";

        // Swirling dark force orb
        var grad = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, rad);
        grad.addColorStop(0, "#E6E6FA");
        grad.addColorStop(0.3, "#DA70D6");
        grad.addColorStop(0.7, "#4B0082");
        grad.addColorStop(1, "#000000");
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
    ctx.restore();
};

VaderForceChokePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
