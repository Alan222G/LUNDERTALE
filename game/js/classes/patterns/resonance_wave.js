// resonance_wave.js — Ramiel: Resonance Pillars (energy columns with warnings)
var ResonanceWavePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 7;
    this.pillars = [];
    this.pillarTimer = 0;
    this.pillarInterval = 1.0;
    this.battleBox = null;
    this.sparks = [];
};
ResonanceWavePattern.prototype = Object.create(BulletPattern.prototype);

ResonanceWavePattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.pillars = [];
    this.sparks = [];
    this.pillarTimer = 0.5;
};

ResonanceWavePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    var bb = Cbbox.getBound();
    var bw = bb[2] - bb[0];
    var bh = bb[3] - bb[1];

    this.pillarTimer += dt;
    if (this.pillarTimer >= this.pillarInterval && this.elapsed < this.duration - 1.5) {
        this.pillarTimer = 0;
        // Spawn 2-3 pillars at random X positions
        var count = 2 + Math.floor(Math.random() * 2);
        for (var i = 0; i < count; i++) {
            var px = bb[0] + 25 + Math.random() * (bw - 50);
            this.pillars.push({
                x: px,
                width: 16 + Math.random() * 6,
                phase: 0,          // 0=warning, 1=active, 2=fade
                timer: 0,
                warnDur: 0.8,
                activeDur: 0.6,
                fadeDur: 0.3,
                hue: Math.floor(Math.random() * 3)
            });
        }
    }

    // Update pillars
    for (var i = this.pillars.length - 1; i >= 0; i--) {
        var p = this.pillars[i];
        p.timer += dt;
        if (p.phase === 0 && p.timer >= p.warnDur) {
            p.phase = 1;
            p.timer = 0;
            // Spawn activation sparks
            for (var s = 0; s < 8; s++) {
                this.sparks.push({
                    x: p.x + (Math.random() - 0.5) * p.width,
                    y: bb[1] + Math.random() * bh,
                    vx: (Math.random() - 0.5) * 60,
                    vy: (Math.random() - 0.5) * 80,
                    size: 1 + Math.random() * 2,
                    life: 0.4 + Math.random() * 0.3
                });
            }
        } else if (p.phase === 1 && p.timer >= p.activeDur) {
            p.phase = 2;
            p.timer = 0;
        } else if (p.phase === 2 && p.timer >= p.fadeDur) {
            this.pillars.splice(i, 1);
        }
    }

    // Update sparks
    for (var i = this.sparks.length - 1; i >= 0; i--) {
        var s = this.sparks[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt;
        if (s.life <= 0) this.sparks.splice(i, 1);
    }
};

ResonanceWavePattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var bh = bb[3] - bb[1];
    ctx.save();

    for (var i = 0; i < this.pillars.length; i++) {
        var p = this.pillars[i];
        var colors = [
            ["rgba(40, 100, 255,", "rgba(80, 180, 255,", "rgba(200, 230, 255,"],
            ["rgba(80, 200, 255,", "rgba(120, 240, 255,", "rgba(220, 250, 255,"],
            ["rgba(100, 60, 255,", "rgba(160, 120, 255,", "rgba(230, 200, 255,"]
        ];
        var c = colors[p.hue];

        if (p.phase === 0) {
            // Warning: thin pulsing line
            var pulse = Math.sin(p.timer * 20) * 0.3 + 0.5;
            ctx.globalAlpha = (p.timer / p.warnDur) * pulse;
            ctx.strokeStyle = c[1] + "0.7)";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 6]);
            ctx.beginPath();
            ctx.moveTo(p.x, bb[1]);
            ctx.lineTo(p.x, bb[3]);
            ctx.stroke();
            ctx.setLineDash([]);
            // Warning glow at top and bottom
            ctx.globalAlpha = (p.timer / p.warnDur) * 0.4;
            ctx.fillStyle = c[0] + "0.4)";
            ctx.fillRect(p.x - p.width / 2, bb[1], p.width, bh);
            ctx.globalAlpha = 1;
        } else if (p.phase === 1) {
            // Active: full damaging energy column
            var intensity = Math.min(1, p.timer / 0.1); // Quick ramp up
            ctx.globalAlpha = intensity;

            // Outer glow
            ctx.shadowBlur = 25;
            ctx.shadowColor = c[1] + "0.9)";

            // Main pillar body
            var grad = ctx.createLinearGradient(p.x - p.width / 2, 0, p.x + p.width / 2, 0);
            grad.addColorStop(0, c[0] + "0.3)");
            grad.addColorStop(0.3, c[1] + "0.8)");
            grad.addColorStop(0.5, c[2] + "0.95)");
            grad.addColorStop(0.7, c[1] + "0.8)");
            grad.addColorStop(1, c[0] + "0.3)");
            ctx.fillStyle = grad;
            ctx.fillRect(p.x - p.width / 2, bb[1], p.width, bh);

            // Bright core
            ctx.shadowBlur = 0;
            ctx.fillStyle = c[2] + "0.8)";
            ctx.fillRect(p.x - 2, bb[1], 4, bh);

            // Edge shimmer lines
            var shimmer = Math.sin(this.elapsed * 12 + p.x) * 0.3 + 0.5;
            ctx.strokeStyle = c[2] + shimmer.toFixed(2) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x - p.width / 2, bb[1]);
            ctx.lineTo(p.x - p.width / 2, bb[3]);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(p.x + p.width / 2, bb[1]);
            ctx.lineTo(p.x + p.width / 2, bb[3]);
            ctx.stroke();

            ctx.globalAlpha = 1;
        } else if (p.phase === 2) {
            // Fade out
            var fadeAlpha = 1 - (p.timer / p.fadeDur);
            ctx.globalAlpha = Math.max(0, fadeAlpha);
            ctx.fillStyle = c[1] + (fadeAlpha * 0.5).toFixed(2) + ")";
            ctx.fillRect(p.x - p.width / 2, bb[1], p.width, bh);
            ctx.globalAlpha = 1;
        }
    }

    // Draw sparks
    for (var i = 0; i < this.sparks.length; i++) {
        var s = this.sparks[i];
        var sAlpha = Math.min(1, s.life * 3);
        ctx.fillStyle = "rgba(200, 230, 255, " + sAlpha.toFixed(2) + ")";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
};

ResonanceWavePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2;
    for (var i = 0; i < this.pillars.length; i++) {
        var p = this.pillars[i];
        if (p.phase !== 1) continue; // Only active pillars damage
        var halfW = p.width / 2 + sw / 2;
        if (Math.abs(cx - p.x) < halfW) {
            return this.damVal;
        }
    }
    return 0;
};

ResonanceWavePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.pillars.length === 0;
};
