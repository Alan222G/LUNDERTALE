// thanosSpaceCompress.js — Space Stone. Spatial compression walls.
// Blue glowing forcefields move inwards from the left and right borders of the battle box,
// restricting player movement space. Blue cosmic sparks drift from above.

var ThanosSpaceCompressPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 10;
    this.compressWidth = 0;
};

ThanosSpaceCompressPattern.prototype = Object.create(BulletPattern.prototype);

ThanosSpaceCompressPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.compressWidth = 0;
};

ThanosSpaceCompressPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    
    // Linearly compress walls inwards (up to 33% of the box width on each side)
    var maxCompress = bbW * 0.32;
    var progress = Math.min(1.0, this.elapsed / (this.duration - 1.5));
    this.compressWidth = maxCompress * progress;

    // Constrain player soul position so they are pushed inwards by the walls
    if (typeof Soul !== "undefined" && Soul.getPos) {
        var spos = Soul.getPos();
        var sw = Soul.getWidth();
        
        var leftLimit = bb[0] + this.compressWidth;
        var rightLimit = bb[2] - this.compressWidth;

        if (spos.x < leftLimit) {
            Soul.setPos(leftLimit, spos.y);
        } else if (spos.x + sw > rightLimit) {
            Soul.setPos(rightLimit - sw, spos.y);
        }
    }

    // Spawn space sparks falling down
    if (this.spawnTimer >= 0.28 && this.elapsed < this.duration - 0.8) {
        this.spawnTimer = 0;
        
        // Spawn sparks only within the compressed safe zone
        var leftLimit = bb[0] + this.compressWidth + 10;
        var rightLimit = bb[2] - this.compressWidth - 10;
        var safeW = rightLimit - leftLimit;
        
        if (safeW > 15) {
            var bx = leftLimit + Math.random() * (safeW - 10);
            var spark = new Bullet({
                x: bx,
                y: bb[1] - 10,
                width: 10,
                height: 10,
                speed: 0,
                damVal: this.damVal - 1,
                color: "#00BFFF",
                vx: (Math.random() - 0.5) * 40,
                vy: 110 + Math.random() * 50,
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

ThanosSpaceCompressPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    var cx = sx + sw / 2;

    // 1. Collide with left or right compression wall forcefields
    var leftLimit = bb[0] + this.compressWidth;
    var rightLimit = bb[2] - this.compressWidth;
    if (cx < leftLimit + 2 || cx > rightLimit - 2) {
        return this.damVal;
    }

    // 2. Collide with sparks
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && b.fadeTick >= 1) {
            if (rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
                return this.damVal - 1;
            }
        }
    }

    return 0;
};

ThanosSpaceCompressPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var bbH = bb[3] - bb[1];

    // 1. Draw Left & Right Compression Walls
    if (this.compressWidth > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00BFFF";

        // Left Wall
        var leftGrad = ctx.createLinearGradient(bb[0], bb[1], bb[0] + this.compressWidth, bb[1]);
        leftGrad.addColorStop(0, "rgba(0, 191, 255, 0.45)");
        leftGrad.addColorStop(1, "rgba(0, 191, 255, 0.05)");
        ctx.fillStyle = leftGrad;
        ctx.fillRect(bb[0], bb[1], this.compressWidth, bbH);
        
        ctx.strokeStyle = "#00BFFF";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bb[0] + this.compressWidth, bb[1]);
        ctx.lineTo(bb[0] + this.compressWidth, bb[3]);
        ctx.stroke();

        // Right Wall
        var rightGrad = ctx.createLinearGradient(bb[2] - this.compressWidth, bb[1], bb[2], bb[1]);
        rightGrad.addColorStop(0, "rgba(0, 191, 255, 0.05)");
        rightGrad.addColorStop(1, "rgba(0, 191, 255, 0.45)");
        ctx.fillStyle = rightGrad;
        ctx.fillRect(bb[2] - this.compressWidth, bb[1], this.compressWidth, bbH);

        ctx.beginPath();
        ctx.moveTo(bb[2] - this.compressWidth, bb[1]);
        ctx.lineTo(bb[2] - this.compressWidth, bb[3]);
        ctx.stroke();

        ctx.restore();
    }

    // 2. Draw Space Sparks
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#00BFFF";
        
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#00BFFF";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    ctx.restore();
};

ThanosSpaceCompressPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
