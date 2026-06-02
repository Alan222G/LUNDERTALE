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
    var t = Date.now() / 1000;

    for (var i = 0; i < this.slashes.length; i++) {
        var s = this.slashes[i];
        if (s.phase === 'warning') {
            var progress = s.warningTime / s.maxWarning;
            var isBlink = Math.floor(s.warningTime * 15) % 2 === 0;

            // Dark energy tendrils emanating from endpoints
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            for (var te = 0; te < 3; te++) {
                var tendrilAlpha = 0.12 + progress * 0.15;
                var ox = Math.sin(t * 8 + te * 2.1) * (12 + te * 5);
                var oy = Math.cos(t * 6 + te * 1.7) * (10 + te * 4);
                ctx.strokeStyle = "rgba(139, 0, 0, " + tendrilAlpha + ")";
                ctx.lineWidth = 1.0;
                ctx.beginPath();
                ctx.moveTo(s.x1, s.y1);
                ctx.quadraticCurveTo(s.x1 + ox, s.y1 + oy, (s.x1 + s.x2) / 2, (s.y1 + s.y2) / 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(s.x2, s.y2);
                ctx.quadraticCurveTo(s.x2 - ox, s.y2 - oy, (s.x1 + s.x2) / 2, (s.y1 + s.y2) / 2);
                ctx.stroke();
            }
            ctx.restore();

            // Pulsing red aura along the slash path
            ctx.save();
            ctx.globalAlpha = 0.04 + progress * 0.08;
            ctx.shadowBlur = 20 + progress * 15;
            ctx.shadowColor = "#FF0000";
            ctx.strokeStyle = "rgba(255, 0, 0, 0.6)";
            ctx.lineWidth = 6 + progress * 8;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();
            ctx.restore();

            // Draw flashing red warning line
            ctx.strokeStyle = isBlink ? "rgba(255, 0, 0, 0.85)" : "rgba(255, 0, 0, 0.2)";
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();

            // Pulsing indicator circles at endpoints
            var circleSize = 4 + Math.sin(t * 12) * 2;
            ctx.save();
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#FF0000";
            ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
            ctx.beginPath();
            ctx.arc(s.x1, s.y1, circleSize, 0, Math.PI * 2);
            ctx.arc(s.x2, s.y2, circleSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

        } else if (s.phase === 'active') {
            var alpha = 1.0 - (s.activeTime / s.maxActive);
            var impactFlash = Math.max(0, 1.0 - s.activeTime / 0.06);

            // Screen flash on initial impact
            if (impactFlash > 0) {
                ctx.save();
                ctx.globalAlpha = impactFlash * 0.15;
                ctx.fillStyle = "#FF3333";
                ctx.fillRect(-2000, -2000, 6000, 6000);
                ctx.restore();
            }

            // Ghost afterimage trails (offset copies that fade)
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            for (var g = 2; g >= 1; g--) {
                var ghostAlpha = alpha * 0.15 / g;
                var perpX = -(s.y2 - s.y1);
                var perpY = (s.x2 - s.x1);
                var perpLen = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
                perpX /= perpLen; perpY /= perpLen;
                var gOff = g * 4 * Math.sin(t * 10 + g);
                ctx.globalAlpha = ghostAlpha;
                ctx.strokeStyle = "rgba(255, 50, 50, 0.6)";
                ctx.lineWidth = 8;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(s.x1 + perpX * gOff, s.y1 + perpY * gOff);
                ctx.lineTo(s.x2 + perpX * gOff, s.y2 + perpY * gOff);
                ctx.stroke();
            }
            ctx.restore();

            // Main slash — multi-layer glow
            ctx.save();
            ctx.globalAlpha = alpha;

            // Layer 1: Wide dark red outer aura
            ctx.shadowBlur = 30;
            ctx.shadowColor = "#FF0000";
            ctx.strokeStyle = "rgba(139, 0, 0, 0.5)";
            ctx.lineWidth = 22;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();

            // Layer 2: Crimson mid-glow
            ctx.shadowBlur = 18;
            ctx.strokeStyle = "#FF3333";
            ctx.lineWidth = 12.0;
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();

            // Layer 3: Hot pink transition
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#FF6666";
            ctx.strokeStyle = "#FF8888";
            ctx.lineWidth = 6.0;
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();

            // Layer 4: Inner white-hot laser core
            ctx.shadowBlur = 4;
            ctx.shadowColor = "#FFFFFF";
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();

            ctx.restore();

            // Ember spark particles along the slash
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            var dx = s.x2 - s.x1;
            var dy = s.y2 - s.y1;
            var slashLen = Math.sqrt(dx * dx + dy * dy) || 1;
            var numSparks = Math.floor(slashLen / 12);
            for (var sp = 0; sp < numSparks; sp++) {
                var frac = sp / numSparks;
                var sparkSeed = sp * 7.13 + i * 3.7;
                var jitterX = Math.sin(t * 15 + sparkSeed) * 8;
                var jitterY = Math.cos(t * 13 + sparkSeed * 1.3) * 6;
                var sparkX = s.x1 + dx * frac + jitterX;
                var sparkY = s.y1 + dy * frac + jitterY;
                var sparkAlpha = alpha * (0.4 + Math.sin(t * 20 + sparkSeed) * 0.3);
                var sparkSize = 1.5 + Math.sin(t * 18 + sparkSeed * 0.7) * 1.0;
                ctx.globalAlpha = sparkAlpha;
                ctx.fillStyle = Math.random() > 0.3 ? "#FFAA33" : "#FFFFFF";
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }
    ctx.restore();
};

VaderLethalStrikePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.slashes.length === 0;
};
