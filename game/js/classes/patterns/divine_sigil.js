// divine_sigil.js — Seraphina Phase 1 Exclusive: sacred sigil fires circular bullet pattern
var DivineSigilPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 6;
    this.sigils = [];
    this.sigilTimer = 0;
    this.sigilInterval = 0.6;
    this.battleBox = null;
};
DivineSigilPattern.prototype = Object.create(BulletPattern.prototype);

DivineSigilPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.sigils = [];
    this.sigilTimer = 1.0;
};

DivineSigilPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    var bb = Cbbox.getBound();
    this.sigilTimer += dt;
    if (this.sigilTimer >= this.sigilInterval && this.elapsed < this.duration - 2) {
        this.sigilTimer = 0;
        this.sigils.push({
            x: bb[0] + 40 + Math.random() * (bb[2] - bb[0] - 80),
            y: bb[1] + 40 + Math.random() * (bb[3] - bb[1] - 80),
            rot: 0, scale: 0, maxScale: 1,
            chargeTime: 1.2, timer: 0, fired: false
        });
    }
    for (var i = this.sigils.length - 1; i >= 0; i--) {
        var s = this.sigils[i];
        s.timer += dt;
        s.rot += 1.5 * dt;
        s.scale = Math.min(s.maxScale, s.timer / (s.chargeTime * 0.6));
        if (s.timer >= s.chargeTime && !s.fired) {
            s.fired = true;
            var numBullets = 18;
            for (var b = 0; b < numBullets; b++) {
                var angle = (b / numBullets) * Math.PI * 2 + (Math.random() * 0.2);
                this.bullets.push(new Bullet({
                    x: s.x - 5, y: s.y - 5, width: 10, height: 10,
                    speed: 0, damVal: this.damVal, rotation: 0, fadeSpeed: 0.8,
                    color: "#FFD700", vx: Math.cos(angle) * 100, vy: Math.sin(angle) * 100, useVelocity: true
                }));
            }
        }
        if (s.fired && s.timer > s.chargeTime + 0.5) this.sigils.splice(i, 1);
    }
    BulletPattern.prototype.update.call(this, dt);
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        if (this.bullets[i].isOutOfBounds([bb[0]-50,bb[1]-50,bb[2]+50,bb[3]+50])) this.bullets.splice(i, 1);
    }
};

DivineSigilPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.sigils.length; i++) {
        var s = this.sigils[i];
        var progress = s.timer / s.chargeTime;
        ctx.save();
        ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.scale(s.scale, s.scale);
        // Outer ring
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(255, 200, 0, 0.6)";
        ctx.strokeStyle = "rgba(255, 215, 0, " + (0.4 + progress * 0.5).toFixed(2) + ")";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.stroke();
        // Inner ring
        ctx.strokeStyle = "rgba(255, 240, 150, " + (0.3 + progress * 0.4).toFixed(2) + ")";
        ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.stroke();
        // Cross
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255, 220, 100, " + (0.5 + progress * 0.4).toFixed(2) + ")";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0,-25); ctx.lineTo(0,25); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-25,0); ctx.lineTo(25,0); ctx.stroke();
        // Diagonal lines
        ctx.globalAlpha = 0.4;
        ctx.beginPath(); ctx.moveTo(-18,-18); ctx.lineTo(18,18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(18,-18); ctx.lineTo(-18,18); ctx.stroke();
        ctx.globalAlpha = 1;
        // Center glow
        var cGrad = ctx.createRadialGradient(0,0,0,0,0,10);
        cGrad.addColorStop(0, "rgba(255,255,200," + (0.6 * progress).toFixed(2) + ")");
        cGrad.addColorStop(1, "rgba(255,200,0,0)");
        ctx.fillStyle = cGrad;
        ctx.beginPath(); ctx.arc(0,0,10,0,Math.PI*2); ctx.fill();
        ctx.restore();
    }
    // Draw bullets with golden glow
    ctx.shadowBlur = 6;
    ctx.shadowColor = "rgba(255, 200, 0, 0.5)";
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        var bx = b.x + b.width/2, by = b.y + b.height/2;
        ctx.fillStyle = "rgba(255, 215, 0, 0.8)";
        ctx.beginPath(); ctx.arc(bx, by, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255, 255, 200, 0.6)";
        ctx.beginPath(); ctx.arc(bx, by, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
};

DivineSigilPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0 && this.sigils.length === 0;
};
