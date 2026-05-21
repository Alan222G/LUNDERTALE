// sachielHaloCrush.js - An angelic halo shrinks the play area while beams shoot down
var SachielHaloCrushPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
    
    this.haloRadius = 300;
    this.haloTargetRadius = 70;
    
    this.beams = [];
    this.beamTimer = 0;
    this.beamInterval = 0.6;

    // --- VFX state ---
    this.haloParticles = [];   // angelic motes inside the halo
    this.sparkles = [];        // star sparkles on the ring
    this.shakeOffset = { x: 0, y: 0 };
    this.shimmerPhase = 0;
};

SachielHaloCrushPattern.prototype = Object.create(BulletPattern.prototype);

SachielHaloCrushPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.beamTimer += dt;
    this.shimmerPhase += dt;
    
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    // Halo shrinks over time
    if (this.elapsed < this.duration - 2) {
        var progress = this.elapsed / (this.duration - 2);
        if (progress > 1) progress = 1;
        // Ease out quad
        progress = progress * (2 - progress);
        this.haloRadius = 300 - (300 - this.haloTargetRadius) * progress;
    } else {
        // Expand rapidly at the end
        this.haloRadius += 300 * dt;
    }
    
    // Spawn beams that fall within the halo
    if (this.beamTimer >= this.beamInterval && this.elapsed < this.duration - 1) {
        this.beamTimer = 0;
        
        var numBeams = 1 + Math.floor(Math.random() * 2);
        for (var i = 0; i < numBeams; i++) {
            // Pick a random spot inside the current halo radius (X coordinate)
            var angle = Math.random() * Math.PI * 2;
            var dist = Math.random() * (this.haloRadius - 20);
            var px = cx + Math.cos(angle) * dist;
            
            // Keep strictly inside the battle box horizontally
            px = Math.max(bb[0] + 10, Math.min(bb[2] - 10, px));
            
            this.beams.push({
                x: px,
                y: bb[1] - 50,
                width: 15 + Math.random() * 15,
                warningTime: 0.5,
                warningTimer: 0,
                active: false,
                duration: 0.8,
                timer: 0
            });
        }
        
        if (this.beamInterval > 0.3) this.beamInterval -= 0.05;
    }
    
    // Update beams
    for (var i = this.beams.length - 1; i >= 0; i--) {
        var b = this.beams[i];
        if (!b.active) {
            b.warningTimer += dt;
            if (b.warningTimer >= b.warningTime) {
                b.active = true;
            }
        } else {
            b.timer += dt;
            if (b.timer >= b.duration) {
                this.beams.splice(i, 1);
            }
        }
    }

    // --- VFX: Angelic mote particles ---
    // Spawn motes inside the halo circle
    if (this.haloRadius > 30) {
        var moteRate = Math.max(1, Math.floor(4 * (300 / Math.max(this.haloRadius, 50))));
        for (var m = 0; m < moteRate; m++) {
            var a = Math.random() * Math.PI * 2;
            var r = Math.random() * (this.haloRadius - 10);
            this.haloParticles.push({
                x: cx + Math.cos(a) * r,
                y: cy + Math.sin(a) * r,
                vx: (Math.random() - 0.5) * 15,
                vy: -10 - Math.random() * 25,
                life: 0.6 + Math.random() * 0.8,
                maxLife: 0.6 + Math.random() * 0.8,
                size: 1 + Math.random() * 2.5
            });
        }
    }
    // Update motes
    for (var i = this.haloParticles.length - 1; i >= 0; i--) {
        var p = this.haloParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) {
            this.haloParticles.splice(i, 1);
        }
    }

    // --- VFX: Sparkles on the halo ring ---
    if (Math.random() < 0.4) {
        var sa = Math.random() * Math.PI * 2;
        this.sparkles.push({
            angle: sa,
            life: 0.3 + Math.random() * 0.4,
            maxLife: 0.3 + Math.random() * 0.4,
            size: 2 + Math.random() * 3
        });
    }
    for (var i = this.sparkles.length - 1; i >= 0; i--) {
        this.sparkles[i].life -= dt;
        if (this.sparkles[i].life <= 0) {
            this.sparkles.splice(i, 1);
        }
    }

    // --- VFX: Screen shake when halo is small ---
    if (this.haloRadius < 120 && this.elapsed < this.duration - 2) {
        var intensity = (1 - this.haloRadius / 120) * 3.5;
        this.shakeOffset.x = (Math.random() - 0.5) * intensity;
        this.shakeOffset.y = (Math.random() - 0.5) * intensity;
    } else {
        this.shakeOffset.x *= 0.85;
        this.shakeOffset.y *= 0.85;
    }
};

SachielHaloCrushPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;

    ctx.save();
    // Apply screen shake
    ctx.translate(this.shakeOffset.x, this.shakeOffset.y);

    // --- VFX: Divine light rays emanating outward ---
    var numRays = 12;
    var rayTime = this.shimmerPhase * 0.3;
    var shrinkRatio = Math.max(0, 1 - this.haloRadius / 300);
    var rayAlpha = 0.06 + shrinkRatio * 0.12;
    ctx.save();
    for (var r = 0; r < numRays; r++) {
        var angle = (r / numRays) * Math.PI * 2 + rayTime;
        var rayLen = this.haloRadius + 60 + Math.sin(this.shimmerPhase * 3 + r) * 20;
        var spread = 0.07 + 0.03 * Math.sin(this.shimmerPhase * 2 + r * 0.7);
        ctx.fillStyle = "rgba(255, 255, 180, " + rayAlpha + ")";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
            cx + Math.cos(angle - spread) * rayLen,
            cy + Math.sin(angle - spread) * rayLen
        );
        ctx.lineTo(
            cx + Math.cos(angle + spread) * rayLen,
            cy + Math.sin(angle + spread) * rayLen
        );
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();

    // --- VFX: Pulsing glow behind the halo ring (intensifies as shrinks) ---
    var pulseGlowAlpha = (0.08 + shrinkRatio * 0.18) * (0.7 + 0.3 * Math.sin(this.shimmerPhase * 5));
    var glowGrad = ctx.createRadialGradient(cx, cy, this.haloRadius * 0.6, cx, cy, this.haloRadius + 15);
    glowGrad.addColorStop(0, "rgba(255, 255, 100, 0)");
    glowGrad.addColorStop(0.7, "rgba(255, 230, 50, " + pulseGlowAlpha + ")");
    glowGrad.addColorStop(1, "rgba(255, 200, 0, 0)");
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, this.haloRadius + 15, 0, Math.PI * 2);
    ctx.fill();

    // --- Draw Halo: Multiple golden shimmer rings ---
    var ringCount = 3;
    for (var ri = 0; ri < ringCount; ri++) {
        var ringRadius = this.haloRadius + (ri - 1) * 4;
        var shimmerAlpha = 0.3 + 0.5 * Math.sin(this.shimmerPhase * 4 + ri * 2.2);
        shimmerAlpha = Math.max(0.2, Math.min(1.0, shimmerAlpha));
        var lw = (ri === 1) ? 4 : 2;
        ctx.shadowBlur = (ri === 1) ? 18 : 8;
        ctx.shadowColor = "#FFDD00";
        ctx.strokeStyle = "rgba(255, " + (230 + Math.floor(25 * Math.sin(this.shimmerPhase * 3 + ri))) + ", " + (50 + ri * 30) + ", " + shimmerAlpha + ")";
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1, ringRadius), 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.shadowBlur = 0;
    
    // --- VFX: Star-like sparkles on the halo ring ---
    for (var i = 0; i < this.sparkles.length; i++) {
        var sp = this.sparkles[i];
        var sAlpha = sp.life / sp.maxLife;
        var sx = cx + Math.cos(sp.angle) * this.haloRadius;
        var sy = cy + Math.sin(sp.angle) * this.haloRadius;
        var sz = sp.size * (0.5 + 0.5 * sAlpha);
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(sp.angle + this.shimmerPhase);
        // 4-pointed star
        ctx.fillStyle = "rgba(255, 255, 220, " + sAlpha + ")";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(255, 255, 150, " + sAlpha + ")";
        ctx.beginPath();
        ctx.moveTo(0, -sz * 2);
        ctx.lineTo(sz * 0.4, -sz * 0.4);
        ctx.lineTo(sz * 2, 0);
        ctx.lineTo(sz * 0.4, sz * 0.4);
        ctx.lineTo(0, sz * 2);
        ctx.lineTo(-sz * 0.4, sz * 0.4);
        ctx.lineTo(-sz * 2, 0);
        ctx.lineTo(-sz * 0.4, -sz * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Dim the outside of the halo
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.beginPath();
    // Big rectangle covering screen
    ctx.rect(bb[0]-100, bb[1]-100, (bb[2]-bb[0])+200, (bb[3]-bb[1])+200);
    // Hole for halo
    ctx.arc(cx, cy, this.haloRadius, 0, Math.PI*2, true);
    ctx.fill();
    
    // --- VFX: Angelic mote particles ---
    for (var i = 0; i < this.haloParticles.length; i++) {
        var p = this.haloParticles[i];
        var pAlpha = (p.life / p.maxLife) * 0.7;
        ctx.fillStyle = "rgba(255, 255, 200, " + pAlpha + ")";
        ctx.shadowBlur = 4;
        ctx.shadowColor = "rgba(255, 255, 150, " + pAlpha + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Draw beams
    for (var i = 0; i < this.beams.length; i++) {
        var b = this.beams[i];
        if (!b.active) {
            var alpha = (b.warningTimer / b.warningTime);
            ctx.fillStyle = "rgba(255, 255, 0, " + (alpha * 0.4) + ")";
            ctx.fillRect(b.x - b.width/2, bb[1], b.width, bb[3] - bb[1]);
        } else {
            var alpha = 1.0;
            if (b.timer > b.duration - 0.2) alpha = (b.duration - b.timer) / 0.2;
            
            // Outer beam glow
            ctx.shadowBlur = 14;
            ctx.shadowColor = "#FFFF00";
            ctx.fillStyle = "rgba(255, 255, 255, " + alpha + ")";
            ctx.fillRect(b.x - b.width/2, bb[1] - 20, b.width, (bb[3] - bb[1]) + 40);

            // Inner bright core
            ctx.shadowBlur = 6;
            ctx.shadowColor = "#FFFFAA";
            ctx.fillStyle = "rgba(255, 255, 200, " + (alpha * 0.5) + ")";
            ctx.fillRect(b.x - b.width/4, bb[1] - 20, b.width/2, (bb[3] - bb[1]) + 40);
            ctx.shadowBlur = 0;
        }
    }

    ctx.restore(); // undo shake translate
};

SachielHaloCrushPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    var soulCX = sx + sw / 2;
    var soulCY = sy + sh / 2;
    
    // 1. Halo constraint damage (If player leaves the circle)
    var dx = soulCX - cx;
    var dy = soulCY - cy;
    var dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > this.haloRadius) {
        return this.damVal;
    }
    
    // 2. Beam damage
    for (var i = 0; i < this.beams.length; i++) {
        var b = this.beams[i];
        if (b.active && b.timer > 0.1 && b.timer < b.duration - 0.1) {
            if (sx + sw > b.x - b.width/2 && sx < b.x + b.width/2) {
                return this.damVal;
            }
        }
    }
    
    return 0;
};

SachielHaloCrushPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.beams.length === 0;
};
