// judgment_rings.js — Expanding golden rings
var JudgmentRingsPattern = function(config) {
    BulletPattern.call(this, config);
    this.rings = [];
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.spawnInterval = config.spawnInterval || 1.2;
    this.damVal = config.damVal || 6;
    this.ringSpeed = config.ringSpeed || 60;
    this.ringThickness = config.ringThickness || 12;
};

JudgmentRingsPattern.prototype = Object.create(BulletPattern.prototype);

JudgmentRingsPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.rings = [];
    this.elapsed = 0;
    this.spawnTimer = this.spawnInterval * 0.5;
};

JudgmentRingsPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 2) {
        this.spawnTimer = 0;
        this.spawnRing();
    }

    var bb = Cbbox.getBound();
    var maxRadius = 400; // Big enough to clear the screen
    for (var i = this.rings.length - 1; i >= 0; i--) {
        this.rings[i].radius += this.ringSpeed * dt;
        if (this.rings[i].radius > maxRadius) {
            this.rings.splice(i, 1);
        }
    }
};

JudgmentRingsPattern.prototype.spawnRing = function() {
    var bb = Cbbox.getBound();
    // Spawn mostly near the center but with some variation
    var cx = (bb[0] + bb[2]) / 2 + (Math.random() - 0.5) * 80;
    var cy = (bb[1] + bb[3]) / 2 + (Math.random() - 0.5) * 80;
    
    this.rings.push({
        x: cx,
        y: cy,
        radius: 10, // Start small
        gapAngle: Math.random() * Math.PI * 2,
        gapSize: Math.PI / 2 // 90 degree gap
    });
};

JudgmentRingsPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;
    var soulRadius = Math.min(sw, sh) / 2;

    for (var i = 0; i < this.rings.length; i++) {
        var r = this.rings[i];
        var dx = scx - r.x;
        var dy = scy - r.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        
        // Check if soul angle is inside the gap
        var angle = Math.atan2(dy, dx);
        if (angle < 0) angle += Math.PI * 2;
        var rGapAngle = r.gapAngle % (Math.PI * 2);
        if (rGapAngle < 0) rGapAngle += Math.PI * 2;
        var angleDiff = Math.abs(angle - rGapAngle);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
        
        // Ring collision: distance to center must be within [radius - thickness/2, radius + thickness/2]
        var halfThick = this.ringThickness / 2;
        if (dist + soulRadius > r.radius - halfThick && dist - soulRadius < r.radius + halfThick) {
            if (angleDiff < r.gapSize / 2) {
                // Safely inside the gap!
                continue;
            }
            return this.damVal;
        }
    }
    return 0;
};

JudgmentRingsPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.rings.length; i++) {
        var r = this.rings[i];
        
        var startAngle = r.gapAngle + r.gapSize / 2;
        var endAngle = r.gapAngle - r.gapSize / 2 + Math.PI * 2;

        // Outer golden aura
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(255, 200, 0, 0.6)";
        ctx.strokeStyle = "rgba(255, 200, 50, 0.4)";
        ctx.lineWidth = this.ringThickness + 6;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, startAngle, endAngle);
        ctx.stroke();
        
        // Main golden ring
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#FFD700";
        ctx.strokeStyle = "rgba(255, 215, 0, 0.9)";
        ctx.lineWidth = this.ringThickness;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, startAngle, endAngle);
        ctx.stroke();
        
        // Inner white core
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = this.ringThickness * 0.4;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, startAngle, endAngle);
        ctx.stroke();
        
        // Ultra-bright center line in ring
        ctx.strokeStyle = "rgba(255, 255, 220, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, startAngle, endAngle);
        ctx.stroke();
        
        // Gap indicator — subtle glow at gap edges
        var gapStart = r.gapAngle - r.gapSize / 2;
        var gapEnd = r.gapAngle + r.gapSize / 2;
        for (var g = 0; g < 2; g++) {
            var gAngle = g === 0 ? gapStart : gapEnd;
            var gx = r.x + Math.cos(gAngle) * r.radius;
            var gy = r.y + Math.sin(gAngle) * r.radius;
            ctx.fillStyle = "rgba(255, 255, 200, 0.5)";
            ctx.beginPath();
            ctx.arc(gx, gy, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Trailing sparkle particles along ring path
        for (var sp = 0; sp < 3; sp++) {
            var spAngle = startAngle + Math.random() * (endAngle - startAngle);
            var spx = r.x + Math.cos(spAngle) * r.radius + (Math.random() - 0.5) * 6;
            var spy = r.y + Math.sin(spAngle) * r.radius + (Math.random() - 0.5) * 6;
            ctx.fillStyle = "rgba(255, 215, 0, " + (0.2 + Math.random() * 0.3).toFixed(2) + ")";
            ctx.beginPath();
            ctx.arc(spx, spy, 0.8 + Math.random() * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
};

JudgmentRingsPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.rings.length === 0;
};
