// vaderRedemptionShock.js — Blue/white redemption lightning shocks crossing the screen.
var VaderRedemptionShockPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 0.95; // frequent shock events
    this.damVal = config.damVal || 9;
    this.shocks = []; // active shocks: { x1, y1, x2, y2, points: [], timer: 0.0, maxWarning: 0.65, maxActive: 0.35, phase: 'warning'|'active', soundPlayed: false }
};

VaderRedemptionShockPattern.prototype = Object.create(BulletPattern.prototype);

VaderRedemptionShockPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.5;
    this.shocks = [];
};

VaderRedemptionShockPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];

    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        
        // Pick random direction: diagonal top-left to bottom-right or top-right to bottom-left
        var points = [];
        var segments = 5;
        var x1, y1, x2, y2;
        var diagonal = Math.random() < 0.5;

        if (diagonal) {
            x1 = bb[0] - 10;
            y1 = bb[1] - 10;
            x2 = bb[2] + 10;
            y2 = bb[3] + 10;
        } else {
            x1 = bb[2] + 10;
            y1 = bb[1] - 10;
            x2 = bb[0] - 10;
            y2 = bb[3] + 10;
        }

        var dx = x2 - x1;
        var dy = y2 - y1;
        var segW = dx / segments;
        var segH = dy / segments;

        points.push({ x: x1, y: y1 });
        for (var s = 1; s <= segments; s++) {
            var targetX = x1 + s * segW;
            var targetY = y1 + s * segH;
            if (s < segments) {
                // Add lightning jitter
                targetX += (Math.random() - 0.5) * 32;
                targetY += (Math.random() - 0.5) * 20;
            }
            points.push({ x: targetX, y: targetY });
        }

        this.shocks.push({
            x1: x1, y1: y1, x2: x2, y2: y2,
            points: points,
            timer: 0.0,
            maxWarning: 0.65,
            maxActive: 0.35,
            phase: 'warning',
            soundPlayed: false
        });
    }

    // Process shock states
    for (var i = this.shocks.length - 1; i >= 0; i--) {
        var s = this.shocks[i];
        s.timer += dt;
        if (s.phase === 'warning') {
            if (s.timer >= s.maxWarning) {
                s.phase = 'active';
            }
        } else {
            if (!s.soundPlayed) {
                Sound.playSound("soul_hit", true); // electric shock sound
                s.soundPlayed = true;
            }
            if (s.timer >= s.maxWarning + s.maxActive) {
                this.shocks.splice(i, 1);
            }
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

VaderRedemptionShockPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2;
    var cy = sy + sh / 2;
    var radius = (sw + sh) / 4;

    for (var i = 0; i < this.shocks.length; i++) {
        var s = this.shocks[i];
        if (s.phase !== 'active') continue;

        // Collision with segments
        for (var p = 0; p < s.points.length - 1; p++) {
            var p1 = s.points[p];
            var p2 = s.points[p + 1];

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
                return this.damVal;
            }
        }
    }

    return 0;
};

VaderRedemptionShockPattern.prototype.draw = function(ctx) {
    ctx.save();

    for (var i = 0; i < this.shocks.length; i++) {
        var s = this.shocks[i];
        if (s.phase === 'warning') {
            // Draw electric blue warning line
            ctx.save();
            var alpha = 0.2 + Math.sin(s.timer * 18) * 0.15;
            ctx.strokeStyle = "rgba(0, 191, 255, " + alpha + ")";
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(s.points[0].x, s.points[0].y);
            for (var p = 1; p < s.points.length; p++) {
                ctx.lineTo(s.points[p].x, s.points[p].y);
            }
            ctx.stroke();
            ctx.restore();
        } else if (s.phase === 'active') {
            // Glowing cyan/white electric bolt
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#00FFFF";
            
            // Outer cyan glow
            ctx.strokeStyle = "rgba(0, 255, 255, 0.85)";
            ctx.lineWidth = 5.0;
            ctx.beginPath();
            ctx.moveTo(s.points[0].x, s.points[0].y);
            for (var p = 1; p < s.points.length; p++) {
                ctx.lineTo(s.points[p].x, s.points[p].y);
            }
            ctx.stroke();

            // Inner white core
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(s.points[0].x, s.points[0].y);
            for (var p = 1; p < s.points.length; p++) {
                ctx.lineTo(s.points[p].x, s.points[p].y);
            }
            ctx.stroke();

            ctx.restore();
        }
    }

    ctx.restore();
};

VaderRedemptionShockPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.shocks.length === 0;
};
