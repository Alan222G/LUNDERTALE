// thanosTimeDagger.js — Time Stone. Chronal daggers and blades.
// Green time daggers fall vertically from the top, and chronal blades sweep horizontally.
// Contact with these time-warped projectiles inflicts Time Dilation, slowing player speed by 50%.

var ThanosTimeDaggerPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.bladeTimer = 0;
    this.damVal = config.damVal || 10;
    
    this.blades = []; // active horizontal blades: { y, vx, x, width, height }
};

ThanosTimeDaggerPattern.prototype = Object.create(BulletPattern.prototype);

ThanosTimeDaggerPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.bladeTimer = 0.5; // Start first blade quickly
    this.blades = [];
};

ThanosTimeDaggerPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    this.bladeTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];

    // 1. Spawn falling Time Daggers (Green needles)
    if (this.spawnTimer >= 0.28 && this.elapsed < this.duration - 0.8) {
        this.spawnTimer = 0;
        
        var bx = bb[0] + Math.random() * (bbW - 10);
        var dagger = new Bullet({
            x: bx,
            y: bb[1] - 12,
            width: 8,
            height: 18,
            speed: 0,
            damVal: this.damVal,
            color: "#00E676", // Green
            vx: 0,
            vy: 130 + Math.random() * 40,
            useVelocity: true
        });
        dagger.isTimeDagger = true;
        this.bullets.push(dagger);
    }

    // 2. Spawn horizontal sweeping Chronal Blades
    if (this.bladeTimer >= 1.9 && this.elapsed < this.duration - 1.2) {
        this.bladeTimer = 0;
        
        var ry = bb[1] + 20 + Math.random() * (bbH - 40);
        var alternateLeft = Math.random() < 0.5;
        
        this.blades.push({
            x: alternateLeft ? bb[0] - 50 : bb[2] + 10,
            y: ry,
            width: 40,
            height: 14,
            vx: alternateLeft ? 165 : -165,
            fade: 0.0
        });
        Sound.playSound("impact", true); // Blade slice warning sound
    }

    // Update active horizontal blades
    for (var i = this.blades.length - 1; i >= 0; i--) {
        var bl = this.blades[i];
        bl.x += bl.vx * dt;
        if (bl.fade < 1) bl.fade += dt * 5;

        // Cleanup out of bounds
        if ((bl.vx > 0 && bl.x > bb[2]) || (bl.vx < 0 && bl.x + bl.width < bb[0])) {
            this.blades.splice(i, 1);
        }
    }

    // 3. Update standard bullets (falling daggers)
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        
        if (b.isOutOfBounds(bb)) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }

    // Apply speed reduction if player touches any active time projectile
    if (typeof Soul !== "undefined" && typeof Player !== "undefined" && Soul.isOkay()) {
        var spos = Soul.getPos();
        var sw = Soul.getWidth();
        var sh = Soul.getHeight();

        var hitTimeProject = false;

        // Check horizontal blades
        for (var i = 0; i < this.blades.length; i++) {
            var bl = this.blades[i];
            if (rectsOverlap(bl.x, bl.y, bl.width, bl.height, spos.x, spos.y, sw, sh)) {
                hitTimeProject = true;
                break;
            }
        }

        // Check falling daggers
        if (!hitTimeProject) {
            for (var i = 0; i < this.bullets.length; i++) {
                var b = this.bullets[i];
                if (b.active && rectsOverlap(b.x, b.y, b.width, b.height, spos.x, spos.y, sw, sh)) {
                    hitTimeProject = true;
                    break;
                }
            }
        }

        if (hitTimeProject) {
            if (Player.addSpeedBuff) {
                Player.addSpeedBuff(0.5, 1.2); // Slow player speed by 50% for 1.2s
            }
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

ThanosTimeDaggerPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    // Check horizontal blades
    for (var i = 0; i < this.blades.length; i++) {
        var bl = this.blades[i];
        if (rectsOverlap(bl.x, bl.y, bl.width, bl.height, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }

    // Check falling daggers
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && b.fadeTick >= 1) {
            if (rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }

    return 0;
};

ThanosTimeDaggerPattern.prototype.draw = function(ctx) {
    ctx.save();

    // 1. Draw horizontal chronal blades (green glowing sweeps)
    for (var i = 0; i < this.blades.length; i++) {
        var bl = this.blades[i];
        ctx.save();
        ctx.globalAlpha = bl.fade;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00FF66";
        
        ctx.fillStyle = "rgba(0, 230, 118, 0.85)";
        ctx.fillRect(bl.x, bl.y, bl.width, bl.height);
        
        // Inner white blade core
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(bl.x + 3, bl.y + 4, bl.width - 6, bl.height - 8);
        
        ctx.restore();
    }

    // 2. Draw falling daggers (vertical green needles)
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#00E676";
        
        var cx = b.x + b.width / 2;
        var cy = b.y + b.height / 2;
        
        ctx.translate(cx, cy);
        
        // Draw green needle dagger
        ctx.fillStyle = "rgba(0, 230, 118, 0.9)";
        ctx.beginPath();
        ctx.moveTo(0, -b.height / 2);
        ctx.lineTo(b.width / 2, b.height / 2);
        ctx.lineTo(-b.width / 2, b.height / 2);
        ctx.closePath();
        ctx.fill();
        
        // White center shine
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.moveTo(0, -b.height / 4);
        ctx.lineTo(b.width / 4, b.height / 4);
        ctx.lineTo(-b.width / 4, b.height / 4);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    ctx.restore();
};

ThanosTimeDaggerPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0 && this.blades.length === 0;
};
