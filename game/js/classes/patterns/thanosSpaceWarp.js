// thanosSpaceWarp.js — Space Stone. Spatial Teleportation Portals.
// Two glowing blue vortex portals appear on the left and right walls.
// Blue space energy bolts enter the portal on one side, and instantly teleport out of
// the opposite side's portal at a different height!

var ThanosSpaceWarpPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 9;
    
    this.portals = []; // { side: 0|1, y, time }
};

ThanosSpaceWarpPattern.prototype = Object.create(BulletPattern.prototype);

ThanosSpaceWarpPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.3; // Start quickly
    this.portals = [];
};

ThanosSpaceWarpPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];

    // Maintain 2 active portal gateways at all times (left and right)
    if (this.portals.length === 0) {
        var midY = bb[1] + bbH / 2;
        this.portals.push({ side: 0, y: midY - 30, time: 0 }); // Left portal
        this.portals.push({ side: 1, y: midY + 30, time: 0 }); // Right portal
    }

    // Spin portals
    for (var i = 0; i < this.portals.length; i++) {
        this.portals[i].time += dt;
        // Slowly drift portal vertical positions up and down to change teleportation lanes!
        this.portals[i].y = bb[1] + 35 + ((Math.sin(this.elapsed * 2 + i * Math.PI) * 0.3 + 0.5) * (bbH - 70));
    }

    // Spawn Space Bolts from the top/sides
    if (this.spawnTimer >= 0.38 && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;

        // Space bolts firing from left to right (going towards the portals)
        var by = bb[1] + 15 + Math.random() * (bbH - 30);
        var vx = 140;

        var bolt = new Bullet({
            x: bb[0] - 15,
            y: by,
            width: 14,
            height: 10,
            speed: 0,
            damVal: this.damVal,
            color: "#00BFFF", // Space Blue
            vx: vx,
            vy: 0,
            useVelocity: true
        });
        bolt.teleported = false;
        this.bullets.push(bolt);
    }

    // Update bullets & handle portal teleportation!
    var leftP = this.portals[0];
    var rightP = this.portals[1];

    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);

        // Teleportation logic:
        // If a bolt moving right reaches the right wall (near right portal Y range), teleport it back to the left!
        if (!b.teleported) {
            // Reaching right border
            if (b.x + b.width >= bb[2] - 5) {
                // Teleport to left portal
                b.x = bb[0] + 8;
                b.y = leftP.y - b.height / 2;
                b.teleported = true;
                Sound.playSound("flash", true); // Portal sound effect
            }
        }

        // Out of bounds cleanup
        if (b.isOutOfBounds(bb)) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

ThanosSpaceWarpPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
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

ThanosSpaceWarpPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();

    // 1. Draw Space Portals (Left and Right glowing vertical vortex ovals)
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (var i = 0; i < this.portals.length; i++) {
        var p = this.portals[i];
        var px = p.side === 0 ? bb[0] : bb[2];
        var py = p.y;
        
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(p.time * 4);
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#0099FF";
        
        // Draw swirling blue vortex arcs
        ctx.strokeStyle = "#00BFFF";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 22, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Swirling gold inner rings
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 12, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    ctx.restore();

    // 2. Draw Space Bolt bullets
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00BFFF";
        
        var cx = b.x + b.width / 2;
        var cy = b.y + b.height / 2;
        
        // Draw horizontal space-plasma bolt
        ctx.strokeStyle = "#00BFFF";
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx - 7, cy);
        ctx.lineTo(cx + 7, cy);
        ctx.stroke();
        
        // White center core
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy);
        ctx.lineTo(cx + 5, cy);
        ctx.stroke();
        
        ctx.restore();
    }

    ctx.restore();
};

ThanosSpaceWarpPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
