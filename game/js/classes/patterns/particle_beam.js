// particle_beam.js — Ramiel's devastating Particle Beam attack
// Charge phase: particles sucked into focal point → massive vertical laser sweeps across the box
var ParticleBeamPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 10;
    this.chargeTime = 1.8;        // Charge-up duration
    this.beamActiveTime = 0;      // Time since beam fired
    this.beamWidth = 0;           // Current beam width (animates in)
    this.beamMaxWidth = 110;      // Full beam width
    this.beamX = 0;               // Beam center X position
    this.beamTargetX = 0;         // Where beam is sweeping to
    this.beamSweepSpeed = 65;     // Pixels per second
    this.chargeParticles = [];    // Particles being sucked in during charge
    this.focalX = 0;
    this.focalY = 0;
    this.battleBox = null;
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.sweepDir = 1;            // 1 = right, -1 = left
    this.sparks = [];
};

ParticleBeamPattern.prototype = Object.create(BulletPattern.prototype);

ParticleBeamPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.beamActiveTime = 0;
    this.beamWidth = 0;
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.sparks = [];

    var bbCX = (battleBox[0] + battleBox[2]) / 2;
    this.focalX = bbCX;
    this.focalY = battleBox[1] + 15;
    this.beamX = bbCX;
    this.beamTargetX = bbCX;
    this.sweepDir = Math.random() > 0.5 ? 1 : -1;

    // Generate charge particles
    this.chargeParticles = [];
    for (var i = 0; i < 80; i++) {
        var angle = Math.random() * Math.PI * 2;
        var dist = 60 + Math.random() * 180;
        this.chargeParticles.push({
            x: this.focalX + Math.cos(angle) * dist,
            y: this.focalY + Math.sin(angle) * dist,
            origX: this.focalX + Math.cos(angle) * dist,
            origY: this.focalY + Math.sin(angle) * dist,
            speed: 0.5 + Math.random() * 1.5,
            size: 1 + Math.random() * 2.5,
            hue: Math.random() > 0.5 ? 0 : 1, // 0=blue, 1=cyan
            alive: true
        });
    }
};

ParticleBeamPattern.prototype.update = function(dt) {
    this.elapsed += dt;

    if (this.elapsed < this.chargeTime) {
        // Charge phase: suck particles toward focal point
        var progress = this.elapsed / this.chargeTime;
        for (var i = 0; i < this.chargeParticles.length; i++) {
            var p = this.chargeParticles[i];
            if (!p.alive) continue;
            var dx = this.focalX - p.x;
            var dy = this.focalY - p.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 3) {
                p.alive = false;
                continue;
            }
            var pullForce = p.speed * (0.5 + progress * 3.0);
            p.x += (dx / dist) * pullForce;
            p.y += (dy / dist) * pullForce;
        }
    } else {
        // Beam active phase
        this.beamActiveTime += dt;

        // Beam expansion (instant burst then settle)
        if (this.beamActiveTime < 0.15) {
            this.beamWidth = (this.beamActiveTime / 0.15) * this.beamMaxWidth * 1.3;
            this.flashAlpha = 1.0 - (this.beamActiveTime / 0.15) * 0.7;
        } else if (this.beamActiveTime < 0.4) {
            this.beamWidth = this.beamMaxWidth * 1.3 - ((this.beamActiveTime - 0.15) / 0.25) * (this.beamMaxWidth * 0.3);
        } else {
            this.beamWidth = this.beamMaxWidth;
        }

        // Beam sweep
        var bb = this.battleBox;
        var margin = this.beamMaxWidth / 2 + 10;
        this.beamX += this.sweepDir * this.beamSweepSpeed * dt;

        if (this.beamX > bb[2] - margin) {
            this.beamX = bb[2] - margin;
            this.sweepDir = -1;
        } else if (this.beamX < bb[0] + margin) {
            this.beamX = bb[0] + margin;
            this.sweepDir = 1;
        }

        // Screen shake (stronger at start)
        this.screenShake = Math.max(0, 4 - this.beamActiveTime * 0.8);

        // Flash fade
        if (this.flashAlpha > 0) this.flashAlpha -= dt * 3;

        // Beam end fade
        if (this.elapsed > this.duration - 0.5) {
            var fadeProgress = (this.elapsed - (this.duration - 0.5)) / 0.5;
            this.beamWidth = this.beamMaxWidth * (1 - fadeProgress);
        }

        // Generate sparks at beam edges
        if (Math.random() < 0.4 && this.beamWidth > 10) {
            var side = Math.random() > 0.5 ? 1 : -1;
            this.sparks.push({
                x: this.beamX + side * this.beamWidth / 2 + (Math.random() - 0.5) * 10,
                y: bb[1] + Math.random() * (bb[3] - bb[1]),
                vx: side * (40 + Math.random() * 80),
                vy: (Math.random() - 0.5) * 60,
                life: 0.3 + Math.random() * 0.3,
                maxLife: 0.3 + Math.random() * 0.3,
                size: 1 + Math.random() * 2
            });
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

ParticleBeamPattern.prototype.draw = function(ctx) {
    if (this.elapsed > this.duration) return;
    var bb = this.battleBox;

    ctx.save();

    // Apply screen shake
    if (this.screenShake > 0) {
        var sx = (Math.random() - 0.5) * this.screenShake * 2;
        var sy = (Math.random() - 0.5) * this.screenShake * 2;
        ctx.translate(sx, sy);
    }

    if (this.elapsed < this.chargeTime) {
        // === CHARGE PHASE ===
        var progress = this.elapsed / this.chargeTime;

        // Draw converging particles
        for (var i = 0; i < this.chargeParticles.length; i++) {
            var p = this.chargeParticles[i];
            if (!p.alive) continue;
            var alpha = (0.4 + progress * 0.6).toFixed(2);
            var size = p.size * (0.5 + progress * 0.5);
            ctx.fillStyle = p.hue === 0
                ? "rgba(50, 120, 255, " + alpha + ")"
                : "rgba(100, 220, 255, " + alpha + ")";
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Focal point glow (grows with charge)
        var glowR = 8 + progress * 25;
        var focalGrad = ctx.createRadialGradient(this.focalX, this.focalY, 0, this.focalX, this.focalY, glowR);
        focalGrad.addColorStop(0, "rgba(255, 255, 255, " + (0.5 + progress * 0.5).toFixed(2) + ")");
        focalGrad.addColorStop(0.3, "rgba(100, 180, 255, " + (0.3 + progress * 0.4).toFixed(2) + ")");
        focalGrad.addColorStop(1, "rgba(30, 80, 255, 0)");
        ctx.fillStyle = focalGrad;
        ctx.beginPath();
        ctx.arc(this.focalX, this.focalY, glowR, 0, Math.PI * 2);
        ctx.fill();

        // Warning line (thin beam preview)
        if (progress > 0.5) {
            var lineAlpha = (progress - 0.5) * 2 * 0.3;
            var pulse = Math.sin(this.elapsed * 25) * 0.1;
            ctx.globalAlpha = lineAlpha + pulse;
            ctx.strokeStyle = "#4488FF";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.focalX, this.focalY);
            ctx.lineTo(this.focalX, bb[3]);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    } else {
        // === BEAM ACTIVE PHASE ===
        if (this.beamWidth < 2) { ctx.restore(); return; }

        var halfW = this.beamWidth / 2;

        // Outer aura (wide, subtle)
        ctx.globalAlpha = 0.2;
        var auraGrad = ctx.createLinearGradient(this.beamX - halfW * 1.6, 0, this.beamX + halfW * 1.6, 0);
        auraGrad.addColorStop(0, "rgba(0, 50, 255, 0)");
        auraGrad.addColorStop(0.3, "rgba(30, 100, 255, 0.3)");
        auraGrad.addColorStop(0.5, "rgba(80, 150, 255, 0.4)");
        auraGrad.addColorStop(0.7, "rgba(30, 100, 255, 0.3)");
        auraGrad.addColorStop(1, "rgba(0, 50, 255, 0)");
        ctx.fillStyle = auraGrad;
        ctx.fillRect(this.beamX - halfW * 1.6, bb[1] - 100, halfW * 3.2, bb[3] - bb[1] + 150);
        ctx.globalAlpha = 1;

        // Main beam body (blue electric gradient)
        ctx.shadowBlur = 30;
        ctx.shadowColor = "#2266FF";
        var bodyGrad = ctx.createLinearGradient(this.beamX - halfW, 0, this.beamX + halfW, 0);
        bodyGrad.addColorStop(0, "rgba(0, 30, 180, 0.5)");
        bodyGrad.addColorStop(0.15, "rgba(30, 80, 255, 0.75)");
        bodyGrad.addColorStop(0.5, "rgba(80, 160, 255, 0.9)");
        bodyGrad.addColorStop(0.85, "rgba(30, 80, 255, 0.75)");
        bodyGrad.addColorStop(1, "rgba(0, 30, 180, 0.5)");
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(this.beamX - halfW, bb[1] - 100, this.beamWidth, bb[3] - bb[1] + 150);

        // Inner core (white-cyan, intense)
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#AADDFF";
        var coreW = this.beamWidth * 0.4;
        var coreGrad = ctx.createLinearGradient(this.beamX - coreW / 2, 0, this.beamX + coreW / 2, 0);
        coreGrad.addColorStop(0, "rgba(150, 220, 255, 0.6)");
        coreGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
        coreGrad.addColorStop(1, "rgba(150, 220, 255, 0.6)");
        ctx.fillStyle = coreGrad;
        ctx.fillRect(this.beamX - coreW / 2, bb[1] - 100, coreW, bb[3] - bb[1] + 150);

        // Ultra-bright center line
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillRect(this.beamX - 1.5, bb[1] - 100, 3, bb[3] - bb[1] + 150);

        // Beam edge energy lines (flickering)
        for (var side = -1; side <= 1; side += 2) {
            var edgeX = this.beamX + side * halfW;
            var edgeAlpha = (0.3 + Math.sin(this.elapsed * 20 + side * 3) * 0.15).toFixed(2);
            ctx.strokeStyle = "rgba(100, 200, 255, " + edgeAlpha + ")";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(edgeX, bb[1] - 100);
            ctx.lineTo(edgeX, bb[3] + 50);
            ctx.stroke();
        }

        // Focal point at top (source)
        var srcGrad = ctx.createRadialGradient(this.beamX, bb[1], 0, this.beamX, bb[1], halfW * 1.2);
        srcGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        srcGrad.addColorStop(0.3, "rgba(100, 180, 255, 0.7)");
        srcGrad.addColorStop(0.7, "rgba(30, 80, 255, 0.3)");
        srcGrad.addColorStop(1, "rgba(0, 30, 180, 0)");
        ctx.fillStyle = srcGrad;
        ctx.beginPath();
        ctx.arc(this.beamX, bb[1], halfW * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Draw sparks
        for (var i = 0; i < this.sparks.length; i++) {
            var sp = this.sparks[i];
            var spAlpha = (sp.life / sp.maxLife).toFixed(2);
            ctx.fillStyle = "rgba(180, 220, 255, " + spAlpha + ")";
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.size * (sp.life / sp.maxLife), 0, Math.PI * 2);
            ctx.fill();
        }

        // Full-screen flash on beam fire
        if (this.flashAlpha > 0) {
            ctx.fillStyle = "rgba(200, 230, 255, " + Math.min(1, this.flashAlpha).toFixed(2) + ")";
            ctx.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
        }
    }

    ctx.restore();
};

ParticleBeamPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    if (this.elapsed < this.chargeTime || this.elapsed > this.duration) return 0;
    if (this.beamWidth < 5) return 0;

    var soulCX = sx + sw / 2;
    var halfW = this.beamWidth / 2;

    // Check if soul overlaps beam column
    if (Math.abs(soulCX - this.beamX) < (halfW + sw / 2)) {
        return this.damVal;
    }
    return 0;
};

ParticleBeamPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};
