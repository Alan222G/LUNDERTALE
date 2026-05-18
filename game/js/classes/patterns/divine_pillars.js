// divine_pillars.js — Vertical columns of holy light slamming down
var DivinePillarsPattern = function(config) {
    BulletPattern.call(this, config);
    this.pillars = [];
    this.maxPillars = config.maxPillars || 8;
    this.pillarCount = 0;
    this.pillarInterval = config.pillarInterval || 0.5;
    this.pillarTimer = 0;
    this.warningDuration = config.warningDuration || 0.6;
    this.pillarDuration = config.pillarDuration || 0.7;
    this.pillarWidth = config.pillarWidth || 36;
    this.duration = config.duration || 6;
    this.elapsed = 0;
    this.damVal = config.damVal || 7;
};

DivinePillarsPattern.prototype = Object.create(BulletPattern.prototype);

DivinePillarsPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.pillars = [];
    this.pillarCount = 0;
    this.pillarTimer = this.pillarInterval * 0.3;
    this.elapsed = 0;
};

DivinePillarsPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.pillarTimer += dt;

    if (this.pillarTimer >= this.pillarInterval && this.pillarCount < this.maxPillars) {
        this.pillarTimer -= this.pillarInterval;
        this.spawnPillar();
        this.pillarCount++;
        // 40% chance to spawn a second pillar simultaneously
        if (Math.random() < 0.4 && this.pillarCount < this.maxPillars) {
            this.spawnPillar();
            this.pillarCount++;
        }
    }

    // Update pillar states
    for (var i = this.pillars.length - 1; i >= 0; i--) {
        this.pillars[i].timer += dt;
        if (this.pillars[i].timer > this.warningDuration + this.pillarDuration) {
            this.pillars.splice(i, 1);
        }
    }
};

DivinePillarsPattern.prototype.spawnPillar = function() {
    var bb = this.battleBox;
    var x = randomRange(bb[0] + 10, bb[2] - this.pillarWidth - 10);
    this.pillars.push({
        x: x,
        y: bb[1],
        w: this.pillarWidth,
        h: bb[3] - bb[1],
        timer: 0
    });
};

DivinePillarsPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.pillars.length; i++) {
        var p = this.pillars[i];
        if (p.timer > this.warningDuration && p.timer < this.warningDuration + this.pillarDuration) {
            if (rectsOverlap(p.x, p.y, p.w, p.h, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }
    return 0;
};

DivinePillarsPattern.prototype.draw = function(ctx) {
    for (var i = 0; i < this.pillars.length; i++) {
        var p = this.pillars[i];
        ctx.save();

        if (p.timer <= this.warningDuration) {
            // WARNING — golden cross indicator flashing
            var flashRate = Math.floor(p.timer * 14) % 2;
            ctx.globalAlpha = flashRate ? 0.35 : 0.15;
            
            // Vertical warning line
            ctx.fillStyle = "#FFD700";
            ctx.fillRect(p.x, p.y, p.w, p.h);
            
            // Small cross at top
            var cx = p.x + p.w / 2;
            ctx.strokeStyle = "#FFD700";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, p.y + 5);
            ctx.lineTo(cx, p.y + 20);
            ctx.moveTo(cx - 7, p.y + 12);
            ctx.lineTo(cx + 7, p.y + 12);
            ctx.stroke();
        } else {
            // ACTIVE — blazing pillar of light
            var life = p.timer - this.warningDuration;
            var fadeOut = 1 - (life / this.pillarDuration);
            ctx.globalAlpha = fadeOut;

            // Outer divine glow
            ctx.shadowBlur = 25;
            ctx.shadowColor = "#FFD700";
            
            // Bright white core
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(p.x + 4, p.y, p.w - 8, p.h);
            
            // Golden edges
            ctx.fillStyle = "rgba(255, 215, 0, 0.7)";
            ctx.fillRect(p.x, p.y, p.w, p.h);
            
            // Inner white hotspot
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.fillRect(p.x + p.w/2 - 4, p.y, 8, p.h);
        }
        ctx.restore();
    }
};

DivinePillarsPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.pillars.length === 0;
};
