// thanosInfinitySnap.js — The Snap. Thanos desintegrates half of the battle box.
// A golden screen flash warning appears at the start. One half of the box turns into a gold-dust
// "disintegration zone". Touching it deals massive continuous damage.
// Meanwhile, golden cosmic energy shards bounce around inside the safe half.

var ThanosInfinitySnapPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.snapTimer = 0;
    this.damVal = config.damVal || 12;
    
    this.snapTriggered = false;
    this.disintegratedSide = 0; // 0 = Left, 1 = Right
    this.particles = [];
    this.flashAlpha = 0;
};

ThanosInfinitySnapPattern.prototype = Object.create(BulletPattern.prototype);

ThanosInfinitySnapPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.snapTimer = 0;
    this.snapTriggered = false;
    this.disintegratedSide = Math.random() < 0.5 ? 0 : 1;
    this.particles = [];
    this.flashAlpha = 0;
};

ThanosInfinitySnapPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    this.snapTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];
    var midX = bb[0] + bbW / 2;

    // 1. Manage Snap Golden Flash & Triggers
    if (this.snapTimer < 1.2) {
        // Warning phase: pulsing golden glow on screen
        this.flashAlpha = Math.sin(this.snapTimer * 12) * 0.25;
    } else if (!this.snapTriggered) {
        this.snapTriggered = true;
        this.flashAlpha = 0.9; // Massive gold flash at snap moment
        Sound.playSound("soul_shatter", true); // Snap sound!
        
        // Push player to the safe side if they are on the side about to disintegrate
        if (typeof Soul !== "undefined") {
            var spos = Soul.getPos();
            var scx = spos.x + Soul.getWidth() / 2;
            if (this.disintegratedSide === 0 && scx < midX) {
                // Push to right side
                Soul.setPos(midX + 15, spos.y);
            } else if (this.disintegratedSide === 1 && scx > midX) {
                // Push to left side
                Soul.setPos(midX - 15 - Soul.getWidth(), spos.y);
            }
        }
    }

    // Decay the flash alpha quickly
    if (this.flashAlpha > 0) {
        this.flashAlpha -= dt * 2.0;
        if (this.flashAlpha < 0) this.flashAlpha = 0;
    }

    // 2. Active Disintegration Zone (Spawn Gold Dust Particles)
    if (this.snapTriggered) {
        // Spawn gold dust particles in the disintegrated side
        if (this.particles.length < 50) {
            var px = this.disintegratedSide === 0 
                ? bb[0] + Math.random() * (bbW / 2)
                : midX + Math.random() * (bbW / 2);
            var py = bb[3] - Math.random() * 15;
            this.particles.push({
                x: px,
                y: py,
                vy: -30 - Math.random() * 50,
                life: Math.random() * 1.5 + 0.5,
                maxLife: 2.0,
                size: Math.random() * 2 + 1
            });
        }

        // Update gold dust particles
        for (var i = this.particles.length - 1; i >= 0; i--) {
            var p = this.particles[i];
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0 || p.y < bb[1]) {
                this.particles.splice(i, 1);
            }
        }

        // 3. Spawn bouncing Golden Shards in the safe zone
        if (this.spawnTimer >= 0.5 && this.elapsed < this.duration - 1.0) {
            this.spawnTimer = 0;
            
            // Spawn from top center of the safe side
            var sx = this.disintegratedSide === 0
                ? midX + 15 + Math.random() * (bbW / 2 - 30)
                : bb[0] + 15 + Math.random() * (bbW / 2 - 30);
            var sy = bb[1] - 10;
            var vx = (Math.random() - 0.5) * 120;
            var vy = 120 + Math.random() * 60;

            var shard = new Bullet({
                x: sx,
                y: sy,
                width: 12,
                height: 12,
                speed: 0,
                damVal: this.damVal,
                color: "#FFD700", // Gold
                vx: vx,
                vy: vy,
                useVelocity: true
            });
            shard.bounces = 0;
            this.bullets.push(shard);
        }
    }

    // 4. Update golden shards
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);

        // Constrain shards to bounce off the walls of the safe side!
        var minX = this.disintegratedSide === 0 ? midX : bb[0];
        var maxX = this.disintegratedSide === 0 ? bb[2] : midX;

        if (b.x < minX) { b.x = minX; b.vx *= -1; b.bounces++; }
        if (b.x + b.width > maxX) { b.x = maxX - b.width; b.vx *= -1; b.bounces++; }
        if (b.y < bb[1]) { b.y = bb[1]; b.vy *= -1; b.bounces++; }
        if (b.y + b.height > bb[3]) { b.y = bb[3] - b.height; b.vy *= -1; b.bounces++; }

        // Remove after 3 bounces or if out of bounds
        if (b.bounces >= 3 || b.isOutOfBounds(bb)) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

ThanosInfinitySnapPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var midX = bb[0] + bbW / 2;

    // 1. Check disintegration zone damage (1 HP continuous damage)
    if (this.snapTriggered) {
        var cx = sx + sw / 2;
        if (this.disintegratedSide === 0 && cx < midX) {
            return 2; // Continuous damage (small but rapid tick)
        } else if (this.disintegratedSide === 1 && cx > midX) {
            return 2;
        }
    }

    // 2. Check golden shards
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

ThanosInfinitySnapPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];
    var midX = bb[0] + bbW / 2;

    // 1. Draw Gold Disintegration Zone
    if (this.snapTriggered) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        
        var zoneX = this.disintegratedSide === 0 ? bb[0] : midX;
        var zoneW = bbW / 2;
        
        // Draw deep golden dust overlay
        var zoneGrad = ctx.createLinearGradient(zoneX, bb[1], zoneX + zoneW, bb[1]);
        if (this.disintegratedSide === 0) {
            zoneGrad.addColorStop(0, "rgba(218, 165, 32, 0.45)");
            zoneGrad.addColorStop(1, "rgba(218, 165, 32, 0.0)");
        } else {
            zoneGrad.addColorStop(0, "rgba(218, 165, 32, 0.0)");
            zoneGrad.addColorStop(1, "rgba(218, 165, 32, 0.45)");
        }
        
        ctx.fillStyle = zoneGrad;
        ctx.fillRect(zoneX, bb[1], zoneW, bbH);
        
        // Draw gold dust particles
        ctx.fillStyle = "#FFD700";
        for (var i = 0; i < this.particles.length; i++) {
            var p = this.particles[i];
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        
        // Draw splitting red laser barrier
        ctx.strokeStyle = "#DAA520";
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(midX, bb[1]);
        ctx.lineTo(midX, bb[3]);
        ctx.stroke();
        
        ctx.restore();
    } else {
        // Draw warning indicator overlay on the side that will disintegrate
        ctx.save();
        var zoneX = this.disintegratedSide === 0 ? bb[0] : midX;
        var zoneW = bbW / 2;
        ctx.fillStyle = "rgba(255, 215, 0, 0.08)";
        ctx.fillRect(zoneX, bb[1], zoneW, bbH);
        
        // Draw warning text "SNAP ZONE"
        ctx.font = "14pt Determination Mono";
        ctx.fillStyle = "rgba(255, 215, 0, 0.6)";
        ctx.textAlign = "center";
        ctx.fillText("SNAP WARNING", zoneX + zoneW / 2, bb[1] + bbH / 2);
        ctx.restore();
    }

    // 2. Draw Golden Shards
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FFB300";
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    // 3. Draw full-screen golden flash
    if (this.flashAlpha > 0) {
        ctx.fillStyle = "rgba(255, 215, 0, " + this.flashAlpha.toFixed(2) + ")";
        ctx.fillRect(bb[0], bb[1], bbW, bbH);
    }

    ctx.restore();
};

ThanosInfinitySnapPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
