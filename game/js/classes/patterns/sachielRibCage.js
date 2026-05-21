// sachielRibCage.js - Massive bone ribs close in from the sides, restricting space while spikes shoot horizontally
var SachielRibCagePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 10;
    this.ribs = [];
    this.spikes = [];
    
    this.state = "WARN"; // WARN -> CLOSE -> ATTACK -> OPEN
    this.stateTimer = 0;
    
    // Rib positions
    this.leftRibX = 0;
    this.rightRibX = 0;
    
    this.spikeTimer = 0;

    // VFX: particle arrays
    this.dustParticles = [];
    this.impactFlashes = [];
    this.spawnGlowAlpha = 0;
    this.screenShakeTimer = 0;
    this.screenShakeIntensity = 0;
};

SachielRibCagePattern.prototype = Object.create(BulletPattern.prototype);

SachielRibCagePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.stateTimer += dt;
    
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var ribWidth = 60; // How far they extend into the box
    
    if (this.state === "WARN") {
        this.leftRibX = bb[0] - ribWidth;
        this.rightRibX = bb[2] + ribWidth;
        if (this.stateTimer >= 1.0) {
            this.state = "CLOSE";
            this.stateTimer = 0;
            // VFX: trigger spawn glow + screen shake
            this.spawnGlowAlpha = 1.0;
            this.screenShakeTimer = 0.3;
            this.screenShakeIntensity = 4;
        }
    } else if (this.state === "CLOSE") {
        // Move ribs inward
        var progress = this.stateTimer / 0.5;
        if (progress > 1) progress = 1;
        
        // Easing out
        progress = 1 - Math.pow(1 - progress, 3);
        
        this.leftRibX = (bb[0] - ribWidth) + (ribWidth * progress);
        this.rightRibX = (bb[2] + ribWidth) - (ribWidth * progress);
        
        if (this.stateTimer >= 0.5) {
            this.state = "ATTACK";
            this.stateTimer = 0;
        }
    } else if (this.state === "ATTACK") {
        // Ribs are closed, shoot spikes
        this.spikeTimer += dt;
        if (this.spikeTimer >= 0.4) {
            this.spikeTimer = 0;
            
            // Randomly choose left or right rib to shoot from
            var fromLeft = Math.random() > 0.5;
            var startX = fromLeft ? this.leftRibX : this.rightRibX;
            var targetX = fromLeft ? this.rightRibX : this.leftRibX;
            
            // Random height
            var startY = bb[1] + 20 + Math.random() * (bb[3] - bb[1] - 40);
            
            this.spikes.push({
                x: startX,
                y: startY,
                targetX: targetX,
                vx: fromLeft ? 400 : -400,
                width: 30,
                height: 8,
                warningTime: 0.3,
                warningTimer: 0,
                active: false
            });
        }
        
        // Update spikes
        for (var i = this.spikes.length - 1; i >= 0; i--) {
            var s = this.spikes[i];
            if (!s.active) {
                s.warningTimer += dt;
                if (s.warningTimer >= s.warningTime) {
                    s.active = true;
                }
            } else {
                s.x += s.vx * dt;

                // VFX: emit bone dust trail behind moving spikes
                if (Math.random() < 0.6) {
                    this.dustParticles.push({
                        x: s.x + (s.vx > 0 ? -s.width * 0.5 : s.width * 0.5),
                        y: s.y + (Math.random() - 0.5) * s.height,
                        vx: (Math.random() - 0.5) * 30 - s.vx * 0.05,
                        vy: (Math.random() - 0.5) * 20 - 10,
                        life: 0.5 + Math.random() * 0.3,
                        size: 1 + Math.random() * 2
                    });
                }

                // Remove if it passes the other rib
                if ((s.vx > 0 && s.x > s.targetX) || (s.vx < 0 && s.x < s.targetX)) {
                    // VFX: impact flash when spike leaves screen
                    this.impactFlashes.push({
                        x: s.x,
                        y: s.y,
                        life: 0.25,
                        maxLife: 0.25,
                        radius: 15
                    });
                    this.spikes.splice(i, 1);
                }
            }
        }
        
        if (this.elapsed >= this.duration - 1.0) {
            this.state = "OPEN";
            this.stateTimer = 0;
        }
    } else if (this.state === "OPEN") {
        // Move ribs outward
        var progress = this.stateTimer / 0.5;
        if (progress > 1) progress = 1;
        
        this.leftRibX = bb[0] - (ribWidth * progress);
        this.rightRibX = bb[2] + (ribWidth * progress);
        
        // Let spikes finish
        for (var i = this.spikes.length - 1; i >= 0; i--) {
            var s = this.spikes[i];
            if (s.active) {
                s.x += s.vx * dt;
            }
        }
    }

    // VFX: update dust particles
    for (var i = this.dustParticles.length - 1; i >= 0; i--) {
        var p = this.dustParticles[i];
        p.life -= dt;
        if (p.life <= 0) {
            this.dustParticles.splice(i, 1);
            continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 30 * dt; // slight gravity
    }

    // VFX: update impact flashes
    for (var i = this.impactFlashes.length - 1; i >= 0; i--) {
        this.impactFlashes[i].life -= dt;
        if (this.impactFlashes[i].life <= 0) {
            this.impactFlashes.splice(i, 1);
        }
    }

    // VFX: decay spawn glow
    if (this.spawnGlowAlpha > 0) {
        this.spawnGlowAlpha -= dt * 2.5;
        if (this.spawnGlowAlpha < 0) this.spawnGlowAlpha = 0;
    }

    // VFX: decay screen shake
    if (this.screenShakeTimer > 0) {
        this.screenShakeTimer -= dt;
        if (this.screenShakeTimer < 0) this.screenShakeTimer = 0;
    }
};

SachielRibCagePattern.prototype.drawRibLine = function(ctx, startX, startY, isRight) {
    var sign = isRight ? -1 : 1;
    ctx.save();
    ctx.translate(startX, startY);
    ctx.scale(sign, 1); // Flip if right side
    
    // VFX: bone-white glow behind the rib
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(255, 250, 230, 0.5)";

    // Bone color and style
    ctx.fillStyle = "#e0dad0";
    ctx.strokeStyle = "rgba(50, 40, 30, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    
    // Draw a jagged rib structure
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(-60, -10);
    ctx.lineTo(-40, 0);
    ctx.lineTo(-50, 20);
    ctx.lineTo(0, 30);
    ctx.fill();
    ctx.stroke();

    // VFX: inner bone highlight for extra glow
    ctx.fillStyle = "rgba(255, 255, 245, 0.12)";
    ctx.beginPath();
    ctx.moveTo(-5, -20);
    ctx.lineTo(-45, -5);
    ctx.lineTo(-30, 2);
    ctx.lineTo(-38, 14);
    ctx.lineTo(-5, 20);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
};

SachielRibCagePattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();

    // VFX: apply screen shake
    ctx.save();
    if (this.screenShakeTimer > 0) {
        var shakeAmt = this.screenShakeIntensity * (this.screenShakeTimer / 0.3);
        ctx.translate(
            (Math.random() - 0.5) * shakeAmt * 2,
            (Math.random() - 0.5) * shakeAmt * 2
        );
    }

    // VFX: spawn fracture glow effect (flashes when ribs first appear)
    if (this.spawnGlowAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = this.spawnGlowAlpha * 0.6;
        // Left side fracture glow
        var fracGradL = ctx.createRadialGradient(bb[0], (bb[1] + bb[3]) / 2, 0, bb[0], (bb[1] + bb[3]) / 2, 80);
        fracGradL.addColorStop(0, "rgba(255, 250, 220, 0.9)");
        fracGradL.addColorStop(0.3, "rgba(255, 200, 150, 0.5)");
        fracGradL.addColorStop(1, "rgba(200, 180, 140, 0)");
        ctx.fillStyle = fracGradL;
        ctx.fillRect(bb[0] - 20, bb[1], 100, bb[3] - bb[1]);
        // Right side fracture glow
        var fracGradR = ctx.createRadialGradient(bb[2], (bb[1] + bb[3]) / 2, 0, bb[2], (bb[1] + bb[3]) / 2, 80);
        fracGradR.addColorStop(0, "rgba(255, 250, 220, 0.9)");
        fracGradR.addColorStop(0.3, "rgba(255, 200, 150, 0.5)");
        fracGradR.addColorStop(1, "rgba(200, 180, 140, 0)");
        ctx.fillStyle = fracGradR;
        ctx.fillRect(bb[2] - 80, bb[1], 100, bb[3] - bb[1]);

        // Fracture crack lines radiating from edges
        ctx.strokeStyle = "rgba(255, 255, 200, " + (this.spawnGlowAlpha * 0.7) + ")";
        ctx.lineWidth = 1.5;
        for (var fc = 0; fc < 6; fc++) {
            var fcY = bb[1] + (bb[3] - bb[1]) * (fc + 0.5) / 6;
            // Left cracks
            ctx.beginPath();
            ctx.moveTo(bb[0], fcY);
            ctx.lineTo(bb[0] + 20 + Math.random() * 15, fcY + (Math.random() - 0.5) * 20);
            ctx.lineTo(bb[0] + 35 + Math.random() * 15, fcY + (Math.random() - 0.5) * 30);
            ctx.stroke();
            // Right cracks
            ctx.beginPath();
            ctx.moveTo(bb[2], fcY);
            ctx.lineTo(bb[2] - 20 - Math.random() * 15, fcY + (Math.random() - 0.5) * 20);
            ctx.lineTo(bb[2] - 35 - Math.random() * 15, fcY + (Math.random() - 0.5) * 30);
            ctx.stroke();
        }
        ctx.restore();
    }
    
    // 1. Draw Warnings for Spikes
    for (var i = 0; i < this.spikes.length; i++) {
        var s = this.spikes[i];
        if (!s.active) {
            var alpha = (s.warningTimer / s.warningTime);
            ctx.fillStyle = "rgba(255, 0, 0, " + (alpha * 0.5) + ")";
            // Draw warning line across
            if (s.vx > 0) {
                ctx.fillRect(s.x, s.y - s.height/2, bb[2] - bb[0], s.height);
            } else {
                ctx.fillRect(bb[0], s.y - s.height/2, bb[2] - bb[0], s.height);
            }
        }
    }
    
    // 2. Draw Active Spikes (with bone-white glow)
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ff0000";
    for (var i = 0; i < this.spikes.length; i++) {
        var s = this.spikes[i];
        if (s.active) {
            // VFX: bone-white outer glow layer
            ctx.save();
            ctx.shadowBlur = 14;
            ctx.shadowColor = "rgba(255, 240, 200, 0.6)";
            ctx.beginPath();
            if (s.vx > 0) {
                // Pointing right
                ctx.moveTo(s.x - s.width, s.y - s.height/2);
                ctx.lineTo(s.x, s.y);
                ctx.lineTo(s.x - s.width, s.y + s.height/2);
            } else {
                // Pointing left
                ctx.moveTo(s.x + s.width, s.y - s.height/2);
                ctx.lineTo(s.x, s.y);
                ctx.lineTo(s.x + s.width, s.y + s.height/2);
            }
            ctx.fill();
            ctx.restore();

            // Original spike shape on top
            ctx.beginPath();
            if (s.vx > 0) {
                ctx.moveTo(s.x - s.width, s.y - s.height/2);
                ctx.lineTo(s.x, s.y);
                ctx.lineTo(s.x - s.width, s.y + s.height/2);
            } else {
                ctx.moveTo(s.x + s.width, s.y - s.height/2);
                ctx.lineTo(s.x, s.y);
                ctx.moveTo(s.x + s.width, s.y - s.height/2);
                ctx.lineTo(s.x, s.y);
                ctx.lineTo(s.x + s.width, s.y + s.height/2);
            }
            ctx.fill();
        }
    }
    ctx.shadowBlur = 0;
    
    // 3. Draw The Giant Ribs
    var numRibs = 4;
    var spaceY = (bb[3] - bb[1]) / (numRibs + 1);
    
    // Left Ribs
    for (var r = 1; r <= numRibs; r++) {
        this.drawRibLine(ctx, this.leftRibX, bb[1] + r * spaceY, false);
    }
    
    // Right Ribs
    for (var r = 1; r <= numRibs; r++) {
        this.drawRibLine(ctx, this.rightRibX, bb[1] + r * spaceY, true);
    }
    
    // 4. Draw Warning if in WARN state
    if (this.state === "WARN") {
        var alpha = (this.stateTimer / 1.0);
        ctx.fillStyle = "rgba(255, 0, 0, " + (alpha * 0.3) + ")";
        ctx.fillRect(bb[0], bb[1], 60, bb[3] - bb[1]); // Left warn
        ctx.fillRect(bb[2] - 60, bb[1], 60, bb[3] - bb[1]); // Right warn
    }

    // VFX: Draw bone dust particles
    for (var i = 0; i < this.dustParticles.length; i++) {
        var p = this.dustParticles[i];
        var pAlpha = (p.life / 0.8) * 0.7;
        if (pAlpha > 0.7) pAlpha = 0.7;
        ctx.save();
        ctx.globalAlpha = pAlpha;
        ctx.fillStyle = "rgba(230, 220, 200, 0.9)";
        ctx.shadowBlur = 4;
        ctx.shadowColor = "rgba(255, 250, 230, 0.4)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // VFX: Draw impact flashes
    for (var i = 0; i < this.impactFlashes.length; i++) {
        var fl = this.impactFlashes[i];
        var flProgress = 1 - (fl.life / fl.maxLife);
        var flAlpha = (1 - flProgress) * 0.8;
        var flR = fl.radius + flProgress * 20;
        ctx.save();
        ctx.globalAlpha = flAlpha;
        var impGrad = ctx.createRadialGradient(fl.x, fl.y, 0, fl.x, fl.y, flR);
        impGrad.addColorStop(0, "rgba(255, 255, 230, 0.9)");
        impGrad.addColorStop(0.4, "rgba(255, 200, 150, 0.5)");
        impGrad.addColorStop(1, "rgba(255, 100, 50, 0)");
        ctx.fillStyle = impGrad;
        ctx.beginPath();
        ctx.arc(fl.x, fl.y, flR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // End screen shake save
    ctx.restore();
};

SachielRibCagePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    // 1. Rib collision (they act as solid walls that hurt)
    if (sx < this.leftRibX) return this.damVal;
    if (sx + sw > this.rightRibX) return this.damVal;
    
    // 2. Spike collision
    for (var i = 0; i < this.spikes.length; i++) {
        var s = this.spikes[i];
        if (s.active) {
            // Treat spike as a rectangle for collision
            var spX = s.vx > 0 ? s.x - s.width : s.x;
            var spY = s.y - s.height/2;
            
            if (sx + sw > spX && sx < spX + s.width &&
                sy + sh > spY && sy < spY + s.height) {
                return this.damVal;
            }
        }
    }
    
    return 0;
};

SachielRibCagePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.state === "OPEN";
};
