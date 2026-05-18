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
            // WARNING — golden cross indicator flashing with gradient
            var flashRate = Math.floor(p.timer * 14) % 2;
            ctx.globalAlpha = flashRate ? 0.4 : 0.12;
            
            // Gradient warning fill
            var wGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
            wGrad.addColorStop(0, "rgba(255, 215, 0, 0.8)");
            wGrad.addColorStop(0.5, "rgba(255, 180, 0, 0.4)");
            wGrad.addColorStop(1, "rgba(255, 215, 0, 0.8)");
            ctx.fillStyle = wGrad;
            ctx.fillRect(p.x, p.y, p.w, p.h);
            
            // Cross symbol at top
            var cx = p.x + p.w / 2;
            ctx.globalAlpha = flashRate ? 0.7 : 0.3;
            ctx.strokeStyle = "#FFD700";
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#FFD700";
            ctx.beginPath();
            ctx.moveTo(cx, p.y + 5);
            ctx.lineTo(cx, p.y + 22);
            ctx.moveTo(cx - 8, p.y + 13);
            ctx.lineTo(cx + 8, p.y + 13);
            ctx.stroke();
        } else {
            // ACTIVE — blazing pillar of divine light
            var life = p.timer - this.warningDuration;
            var fadeOut = 1 - (life / this.pillarDuration);
            ctx.globalAlpha = fadeOut;

            // Outer divine glow (widest layer)
            ctx.shadowBlur = 30;
            ctx.shadowColor = "#FFD700";
            ctx.fillStyle = "rgba(255, 215, 0, 0.35)";
            ctx.fillRect(p.x - 4, p.y, p.w + 8, p.h);
            
            // Main golden body
            ctx.shadowBlur = 15;
            ctx.fillStyle = "rgba(255, 220, 80, 0.7)";
            ctx.fillRect(p.x, p.y, p.w, p.h);
            
            // Bright white core
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#FFFFFF";
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.fillRect(p.x + p.w/2 - 5, p.y, 10, p.h);
            
            // Ultra-bright center line
            ctx.shadowBlur = 0;
            ctx.fillStyle = "rgba(255, 255, 240, 0.95)";
            ctx.fillRect(p.x + p.w/2 - 1.5, p.y, 3, p.h);
            
            // Radiating edge particles
            for (var sp = 0; sp < 4; sp++) {
                var spy = p.y + Math.random() * p.h;
                var spx = p.x + (Math.random() > 0.5 ? -1 : p.w + 1) + (Math.random() - 0.5) * 6;
                ctx.fillStyle = "rgba(255, 215, 0, " + (0.2 + Math.random() * 0.4).toFixed(2) + ")";
                ctx.beginPath();
                ctx.arc(spx, spy, 1 + Math.random() * 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }
};

DivinePillarsPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.pillars.length === 0;
};
