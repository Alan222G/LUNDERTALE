// thanosSoulTrap.js — Soul Stone. Soul chains.
// Two orange vertical energy chains block the left and right sectors, restricting the player's
// movement to the center column. Orange soul particles drift from the sides.

var ThanosSoulTrapPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 10;
    this.chainWidth = 0;
};

ThanosSoulTrapPattern.prototype = Object.create(BulletPattern.prototype);

ThanosSoulTrapPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.chainWidth = 0;
};

ThanosSoulTrapPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];
    var midX = bb[0] + bbW / 2;

    // Linear chain activation: blocks left and right sectors
    var progress = Math.min(1.0, this.elapsed / 1.5);
    this.chainWidth = (bbW * 0.3) * progress; // Chains close in from the edges

    // Pushing player soul inside the center column
    if (typeof Soul !== "undefined" && Soul.getPos) {
        var spos = Soul.getPos();
        var sw = Soul.getWidth();
        
        var leftLimit = bb[0] + this.chainWidth;
        var rightLimit = bb[2] - this.chainWidth;

        if (spos.x < leftLimit) {
            Soul.setPos(leftLimit, spos.y);
        } else if (spos.x + sw > rightLimit) {
            Soul.setPos(rightLimit - sw, spos.y);
        }
    }

    // Spawn orange soul particles drifting horizontally
    if (this.spawnTimer >= 0.32 && this.elapsed < this.duration - 0.8) {
        this.spawnTimer = 0;
        
        var leftLimit = bb[0] + this.chainWidth;
        var rightLimit = bb[2] - this.chainWidth;
        var safeW = rightLimit - leftLimit;

        if (safeW > 12) {
            // Alternate left-to-right and right-to-left
            var alternateLeft = Math.random() < 0.5;
            var bx = alternateLeft ? leftLimit - 10 : rightLimit + 10;
            var by = bb[1] + 12 + Math.random() * (bbH - 24);
            var vx = alternateLeft ? 130 : -130;

            var spark = new Bullet({
                x: bx,
                y: by,
                width: 10,
                height: 10,
                speed: 0,
                damVal: this.damVal - 2,
                color: "#FF6D00",
                vx: vx,
                vy: (Math.random() - 0.5) * 40,
                useVelocity: true
            });
            this.bullets.push(spark);
        }
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

ThanosSoulTrapPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    var cx = sx + sw / 2;

    // 1. Collide with chain walls
    var leftLimit = bb[0] + this.chainWidth;
    var rightLimit = bb[2] - this.chainWidth;
    if (cx < leftLimit + 2 || cx > rightLimit - 2) {
        return this.damVal;
    }

    // 2. Collide with sparks
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && b.fadeTick >= 1) {
            if (rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
                return this.damVal - 2;
            }
        }
    }

    return 0;
};

ThanosSoulTrapPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var bbH = bb[3] - bb[1];

    // 1. Draw Orange Chain Barriers
    if (this.chainWidth > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#FF6D00";

        // Left Barrier
        ctx.fillStyle = "rgba(255, 109, 0, 0.18)";
        ctx.fillRect(bb[0], bb[1], this.chainWidth, bbH);
        
        ctx.strokeStyle = "#FF6D00";
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.moveTo(bb[0] + this.chainWidth, bb[1]);
        ctx.lineTo(bb[0] + this.chainWidth, bb[3]);
        ctx.stroke();

        // Right Barrier
        ctx.fillStyle = "rgba(255, 109, 0, 0.18)";
        ctx.fillRect(bb[2] - this.chainWidth, bb[1], this.chainWidth, bbH);

        ctx.beginPath();
        ctx.moveTo(bb[2] - this.chainWidth, bb[1]);
        ctx.lineTo(bb[2] - this.chainWidth, bb[3]);
        ctx.stroke();

        ctx.restore();
    }

    // 2. Draw Orange Soul Sparks
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF6D00";
        
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#FF6D00";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    ctx.restore();
};

ThanosSoulTrapPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
