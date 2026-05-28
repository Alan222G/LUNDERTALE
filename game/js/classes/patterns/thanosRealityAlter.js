// thanosRealityAlter.js — Reality Stone. Warps the fabric of reality.
// Every 2.4 seconds, the Soul's active mode alternates (Normal Red -> Gravity Blue -> Inverted controls).
// Crimson reality crystal shards rain down, forcing precise dodges under changing controls.

var ThanosRealityAlterPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.warpTimer = 0;
    this.damVal = config.damVal || 10;
    
    this.currentWarpState = 0; // 0 = Red, 1 = Blue, 2 = Inverse
};

ThanosRealityAlterPattern.prototype = Object.create(BulletPattern.prototype);

ThanosRealityAlterPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.warpTimer = 0;
    this.currentWarpState = 0;
    if (typeof Soul !== "undefined") {
        Soul.setSoulMode(Soul.SOUL_MODE.RED);
    }
};

ThanosRealityAlterPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    this.warpTimer += dt;

    var bb = Cbbox.getBound();

    // 1. Reality Warp (Rotate soul modes)
    if (this.warpTimer >= 2.4 && this.elapsed < this.duration - 0.5) {
        this.warpTimer = 0;
        this.currentWarpState = (this.currentWarpState + 1) % 3;
        
        if (typeof Soul !== "undefined") {
            if (this.currentWarpState === 0) {
                Soul.setSoulMode(Soul.SOUL_MODE.RED);
            } else if (this.currentWarpState === 1) {
                Soul.setSoulMode(Soul.SOUL_MODE.BLUE);
            } else {
                Soul.setSoulMode(Soul.SOUL_MODE.INVERSE);
            }
            Sound.playSound("flash", true); // Reality shift chime
        }
    }

    // 2. Spawn falling Reality Shards
    var spawnInterval = this.currentWarpState === 1 ? 0.16 : 0.22; // Faster in blue mode to account for gravity jumping
    if (this.spawnTimer >= spawnInterval && this.elapsed < this.duration - 0.8) {
        this.spawnTimer = 0;
        
        var bx = bb[0] + Math.random() * (bb[2] - bb[0] - 16);
        var by = bb[1] - 15;
        var vy = 150 + Math.random() * 80;
        
        var shard = new Bullet({
            x: bx,
            y: by,
            width: 14,
            height: 22,
            speed: 0,
            damVal: this.damVal,
            color: "#FF1E27",
            vx: 0,
            vy: vy,
            useVelocity: true
        });
        this.bullets.push(shard);
    }

    // 3. Update bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        
        // Spin effect
        b.rotation = (b.rotation + dt * 180) % 360;

        if (b.isOutOfBounds(bb)) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

ThanosRealityAlterPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
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

ThanosRealityAlterPattern.prototype.draw = function(ctx) {
    ctx.save();
    
    // Draw Reality Shards as glowing diamond-shaped crystals
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        
        var cx = b.x + b.width / 2;
        var cy = b.y + b.height / 2;
        
        ctx.translate(cx, cy);
        ctx.rotate(degToRad(b.rotation));
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FF003C";
        
        // Diamond path
        ctx.fillStyle = "rgba(255, 30, 60, 0.85)";
        ctx.beginPath();
        ctx.moveTo(0, -b.height / 2);
        ctx.lineTo(b.width / 2, 0);
        ctx.lineTo(0, b.height / 2);
        ctx.lineTo(-b.width / 2, 0);
        ctx.closePath();
        ctx.fill();
        
        // Inner white shine
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.moveTo(0, -b.height / 4);
        ctx.lineTo(b.width / 4, 0);
        ctx.lineTo(0, b.height / 4);
        ctx.lineTo(-b.width / 4, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    ctx.restore();
};

ThanosRealityAlterPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration && this.bullets.length === 0) {
        // Reset soul mode at the end of the turn
        if (typeof Soul !== "undefined") {
            Soul.setSoulMode(Soul.SOUL_MODE.RED);
        }
        return true;
    }
    return false;
};
