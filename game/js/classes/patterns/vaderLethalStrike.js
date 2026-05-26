// vaderLethalStrike.js — Darth Vader slashes with his lightsaber, indicating warnings before cutting.
var VaderLethalStrikePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 1.0; // Slashes frequency
    this.damVal = config.damVal || 9;
    this.slashes = []; // active slashes: {x1, y1, x2, y2, warningTime, activeTime, maxWarning: 0.6, maxActive: 0.3, phase: 'warning'|'active'}
};

VaderLethalStrikePattern.prototype = Object.create(BulletPattern.prototype);

VaderLethalStrikePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.5; // Start quickly
    this.slashes = [];
};

VaderLethalStrikePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];

    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        
        // Generate a slash: can be horizontal, vertical, or diagonal
        var type = Math.floor(Math.random() * 3);
        var slash = {
            x1: 0, y1: 0, x2: 0, y2: 0,
            warningTime: 0,
            activeTime: 0,
            maxWarning: 0.65,
            maxActive: 0.3,
            phase: 'warning',
            soundPlayed: false
        };

        if (type === 0) {
            // Horizontal slash across a random y in the battle box
            var ry = bb[1] + 15 + Math.random() * (bbH - 30);
            slash.x1 = bb[0] - 10;
            slash.y1 = ry;
            slash.x2 = bb[2] + 10;
            slash.y2 = ry;
        } else if (type === 1) {
            // Vertical slash across a random x
            var rx = bb[0] + 15 + Math.random() * (bbW - 30);
            slash.x1 = rx;
            slash.y1 = bb[1] - 10;
            slash.x2 = rx;
            slash.y2 = bb[3] + 10;
        } else {
            // Diagonal slash
            if (Math.random() < 0.5) {
                slash.x1 = bb[0] - 10;
                slash.y1 = bb[1] - 10;
                slash.x2 = bb[2] + 10;
                slash.y2 = bb[3] + 10;
            } else {
                slash.x1 = bb[2] + 10;
                slash.y1 = bb[1] - 10;
                slash.x2 = bb[0] - 10;
                slash.y2 = bb[3] + 10;
            }
        }
        this.slashes.push(slash);
    }

    // Update slashes status
    for (var i = this.slashes.length - 1; i >= 0; i--) {
        var s = this.slashes[i];
        if (s.phase === 'warning') {
            s.warningTime += dt;
            if (s.warningTime >= s.maxWarning) {
                s.phase = 'active';
                if (!s.soundPlayed) {
                    Sound.playSound("slash", true);
                    s.soundPlayed = true;
                }
            }
        } else if (s.phase === 'active') {
            s.activeTime += dt;
            if (s.activeTime >= s.maxActive) {
                this.slashes.splice(i, 1);
            }
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

// Check line collision with player soul (circle approximation of soul)
VaderLethalStrikePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var radius = (sw + sh) / 4;
    var cx = sx + sw / 2;
    var cy = sy + sh / 2;

    for (var i = 0; i < this.slashes.length; i++) {
        var s = this.slashes[i];
        if (s.phase !== 'active') continue;

        // Distance from point (cx, cy) to segment (s.x1, s.y1) - (s.x2, s.y2)
        var dx = s.x2 - s.x1;
        var dy = s.y2 - s.y1;
        var lenSq = dx * dx + dy * dy;
        if (lenSq === 0) continue;

        var t = ((cx - s.x1) * dx + (cy - s.y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));

        var closestX = s.x1 + t * dx;
        var closestY = s.y1 + t * dy;

        var distSq = (cx - closestX) * (cx - closestX) + (cy - closestY) * (cy - closestY);
        // Collision if distance is less than radius + slash thickness (e.g. 10px)
        var colDist = radius + 6;
        if (distSq < colDist * colDist) {
            return this.damVal;
        }
    }
    return 0;
};

VaderLethalStrikePattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.slashes.length; i++) {
        var s = this.slashes[i];
        if (s.phase === 'warning') {
            // Draw flashing red warning line
            var isBlink = Math.floor(s.warningTime * 15) % 2 === 0;
            ctx.strokeStyle = isBlink ? "rgba(255, 0, 0, 0.85)" : "rgba(255, 0, 0, 0.2)";
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();

            // Draw small indicator circles at bounds
            ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
            ctx.beginPath();
            ctx.arc(s.x1, s.y1, 4, 0, Math.PI * 2);
            ctx.arc(s.x2, s.y2, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (s.phase === 'active') {
            // Draw glowing lightsaber slash trace
            var alpha = 1.0 - (s.activeTime / s.maxActive);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowBlur = 18;
            ctx.shadowColor = "#FF0000";
            
            // Outer crimson strike
            ctx.strokeStyle = "#FF3333";
            ctx.lineWidth = 12.0;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();

            // Inner white laser core
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();

            ctx.restore();
        }
    }
    ctx.restore();
};

VaderLethalStrikePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.slashes.length === 0;
};
