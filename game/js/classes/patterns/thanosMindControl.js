// thanosMindControl.js — Mind Stone. Inverted mind control spears.
// The player's controls are warped to be inverted.
// Glowing yellow telepathic spears spawn at the top and seek the player's current X coordinate.

var ThanosMindControlPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 10;
};

ThanosMindControlPattern.prototype = Object.create(BulletPattern.prototype);

ThanosMindControlPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    
    // Invert the player's mind control at the start of the turn
    if (typeof Soul !== "undefined") {
        Soul.setSoulMode(Soul.SOUL_MODE.INVERSE);
    }
};

ThanosMindControlPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];

    // Spawn falling Yellow Mind Spears targeting player's X coordinate
    if (this.spawnTimer >= 0.28 && this.elapsed < this.duration - 0.8) {
        this.spawnTimer = 0;
        
        var sx;
        if (typeof Soul !== "undefined" && Math.random() < 0.65) {
            var spos = Soul.getPos();
            sx = spos.x + Soul.getWidth() / 2 - 5 + (Math.random() - 0.5) * 40; // Aim near player
        } else {
            sx = bb[0] + Math.random() * (bbW - 14);
        }

        // Keep within box bounds
        sx = clamp(sx, bb[0] + 5, bb[2] - 15);
        
        var spear = new Bullet({
            x: sx,
            y: bb[1] - 15,
            width: 10,
            height: 24,
            speed: 0,
            damVal: this.damVal,
            color: "#FFD600", // Yellow
            vx: 0,
            vy: 160 + Math.random() * 50,
            useVelocity: true
        });
        this.bullets.push(spear);
    }

    // Update bullets
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

ThanosMindControlPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
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

ThanosMindControlPattern.prototype.draw = function(ctx) {
    ctx.save();
    
    // Draw yellow telepathic mind spears
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FFD700";
        
        var cx = b.x + b.width / 2;
        var cy = b.y + b.height / 2;
        
        ctx.translate(cx, cy);
        
        // Draw sharp yellow spear pointing down
        ctx.fillStyle = "rgba(255, 215, 0, 0.9)";
        ctx.beginPath();
        ctx.moveTo(0, b.height / 2);
        ctx.lineTo(b.width / 2, -b.height / 2);
        ctx.lineTo(-b.width / 2, -b.height / 2);
        ctx.closePath();
        ctx.fill();
        
        // Solid white inner core
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.moveTo(0, b.height / 4);
        ctx.lineTo(b.width / 4, -b.height / 4);
        ctx.lineTo(-b.width / 4, -b.height / 4);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    ctx.restore();
};

ThanosMindControlPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration && this.bullets.length === 0) {
        // Reset soul mode controls
        if (typeof Soul !== "undefined") {
            Soul.setSoulMode(Soul.SOUL_MODE.RED);
        }
        return true;
    }
    return false;
};
