// vaderForceCrush.js — Darth Vader compresses the arena from both sides and fires lightning.
var VaderForceCrushPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.lightningTimer = 0;
    this.lightningInterval = 0.55; // Shoot lightning frequently
    this.damVal = config.damVal || 10;
    
    // Crushing walls state
    this.wallProgress = 0.0; // 0.0 to 1.0 (reaches peak and goes back)
    this.peakReachTime = 3.8; // compression peaks around 4 seconds
    this.wallWidth = 0.0; // dynamic size in pixels
    this.lightnings = []; // active lightning arcs: { points: [], duration: 0.28, elapsed: 0.0, damVal: 10 }
};

VaderForceCrushPattern.prototype = Object.create(BulletPattern.prototype);

VaderForceCrushPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.lightningTimer = 0;
    this.wallProgress = 0;
    this.wallWidth = 0;
    this.lightnings = [];
};

VaderForceCrushPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.lightningTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];

    // Compute crushing walls compression
    // We want the walls to squeeze the arena up to 35% from each side, then relax
    var maxCompression = bbW * 0.38; 
    var factor = Math.sin((this.elapsed / this.duration) * Math.PI); // sine curve 0 -> 1 -> 0
    this.wallWidth = maxCompression * factor;

    // Apply lightning bursts
    if (this.lightningTimer >= this.lightningInterval && this.elapsed < this.duration - 1.0) {
        this.lightningTimer = 0;
        this.spawnLightning(bb);
    }

    // Update existing lightnings
    for (var i = this.lightnings.length - 1; i >= 0; i--) {
        var lt = this.lightnings[i];
        lt.elapsed += dt;
        if (lt.elapsed >= lt.duration) {
            this.lightnings.splice(i, 1);
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

VaderForceCrushPattern.prototype.spawnLightning = function(bb) {
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];

    // Spawn a vertical zigzag lightning inside the safe zone
    var safeLeft = bb[0] + this.wallWidth;
    var safeRight = bb[2] - this.wallWidth;
    var safeW = safeRight - safeLeft;

    // Pick target x coordinate in safe zone
    var lx = safeLeft + 15 + Math.random() * (safeW - 30);
    var points = [];
    var segments = 6;
    var curY = bb[1];
    var segH = bbH / segments;

    points.push({ x: lx, y: curY });
    for (var s = 1; s <= segments; s++) {
        var nextY = bb[1] + s * segH;
        var nextX = lx + (Math.random() - 0.5) * 32;
        // Keep it inside box
        nextX = Math.max(bb[0], Math.min(bb[2], nextX));
        points.push({ x: nextX, y: nextY });
        curY = nextY;
    }

    this.lightnings.push({
        points: points,
        duration: 0.28,
        elapsed: 0.0,
        damVal: this.damVal
    });

    Sound.playSound("soul_hit", true); // electric snap sound
};

VaderForceCrushPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2;
    var cy = sy + sh / 2;
    var radius = (sw + sh) / 4;
    var bb = Cbbox.getBound();

    // 1. Check crushing walls collision (left and right edges)
    if (cx - radius < bb[0] + this.wallWidth || cx + radius > bb[2] - this.wallWidth) {
        return this.damVal;
    }

    // 2. Check collision with lightning lines
    for (var i = 0; i < this.lightnings.length; i++) {
        var lt = this.lightnings[i];
        
        // Lightning segment collision check
        for (var p = 0; p < lt.points.length - 1; p++) {
            var p1 = lt.points[p];
            var p2 = lt.points[p + 1];

            var dx = p2.x - p1.x;
            var dy = p2.y - p1.y;
            var lenSq = dx * dx + dy * dy;
            if (lenSq === 0) continue;

            var t = ((cx - p1.x) * dx + (cy - p1.y) * dy) / lenSq;
            t = Math.max(0, Math.min(1, t));

            var closestX = p1.x + t * dx;
            var closestY = p1.y + t * dy;

            var distSq = (cx - closestX) * (cx - closestX) + (cy - closestY) * (cy - closestY);
            if (distSq < (radius + 5) * (radius + 5)) {
                return lt.damVal;
            }
        }
    }

    return 0;
};

VaderForceCrushPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];

    // 1. Draw crushing Force walls (left/right red electricity fields)
    if (this.wallWidth > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        
        // Left wall gradient
        var gradLeft = ctx.createLinearGradient(bb[0], 0, bb[0] + this.wallWidth, 0);
        gradLeft.addColorStop(0, "rgba(255, 0, 0, 0.85)");
        gradLeft.addColorStop(0.7, "rgba(139, 0, 0, 0.45)");
        gradLeft.addColorStop(1, "rgba(255, 0, 255, 0.1)");
        ctx.fillStyle = gradLeft;
        ctx.fillRect(bb[0], bb[1], this.wallWidth, bbH);

        // Right wall gradient
        var gradRight = ctx.createLinearGradient(bb[2] - this.wallWidth, 0, bb[2], 0);
        gradRight.addColorStop(0, "rgba(255, 0, 255, 0.1)");
        gradRight.addColorStop(0.3, "rgba(139, 0, 0, 0.45)");
        gradRight.addColorStop(1, "rgba(255, 0, 0, 0.85)");
        ctx.fillStyle = gradRight;
        ctx.fillRect(bb[2] - this.wallWidth, bb[1], this.wallWidth, bbH);

        // Electric edge borders
        ctx.strokeStyle = "#FF33FF";
        ctx.lineWidth = 2.0;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#FF00FF";
        
        ctx.beginPath();
        // Left edge zigzag
        var ly = bb[1];
        ctx.moveTo(bb[0] + this.wallWidth, ly);
        while (ly < bb[3]) {
            ly += 8;
            var offset = (Math.random() - 0.5) * 6;
            ctx.lineTo(bb[0] + this.wallWidth + offset, ly);
        }
        
        // Right edge zigzag
        var ry = bb[1];
        ctx.moveTo(bb[2] - this.wallWidth, ry);
        while (ry < bb[3]) {
            ry += 8;
            var offset = (Math.random() - 0.5) * 6;
            ctx.lineTo(bb[2] - this.wallWidth + offset, ry);
        }
        ctx.stroke();
        ctx.restore();
    }

    // 2. Draw active lightning bolts
    for (var i = 0; i < this.lightnings.length; i++) {
        var lt = this.lightnings[i];
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.shadowBlur = 16;
        ctx.shadowColor = "#FF3399";
        
        // Outer broad colored arc
        ctx.strokeStyle = "rgba(255, 0, 128, 0.8)";
        ctx.lineWidth = 4.0;
        ctx.beginPath();
        ctx.moveTo(lt.points[0].x, lt.points[0].y);
        for (var p = 1; p < lt.points.length; p++) {
            ctx.lineTo(lt.points[p].x, lt.points[p].y);
        }
        ctx.stroke();

        // Inner glowing white core
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(lt.points[0].x, lt.points[0].y);
        for (var p = 1; p < lt.points.length; p++) {
            ctx.lineTo(lt.points[p].x, lt.points[p].y);
        }
        ctx.stroke();

        ctx.restore();
    }

    ctx.restore();
};

VaderForceCrushPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};
