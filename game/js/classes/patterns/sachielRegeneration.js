// sachielRegeneration.js - Replaced by user request: Floor Spike Trap
// Glowing energy spikes thrust up from the floor
var SachielRegenerationPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 12;
    
    this.spikes = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.0;
    this.spikeWidth = 25;

    // --- VFX state ---
    this.debrisParticles = [];
    this.shockwaves = [];
    this.shakeOffset = { x: 0, y: 0 };
    this.vfxTime = 0;
};

SachielRegenerationPattern.prototype = Object.create(BulletPattern.prototype);

SachielRegenerationPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    this.vfxTime += dt;
    
    var bb = Cbbox.getBound();
    
    // Spawn new spikes
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        
        // Spawn 1 spike at a time, but more often
        var numSpikes = 1;
        for (var i = 0; i < numSpikes; i++) {
            var sx = bb[0] + 15 + Math.random() * (bb[2] - bb[0] - 30);
            
            this.spikes.push({
                x: sx,
                state: "WARN", // WARN -> THRUST -> RETRACT
                timer: 0,
                warnTime: 1.0,
                thrustTime: 0.3,
                retractTime: 0.3,
                height: 0,
                targetHeight: (bb[3] - bb[1]) + 10, // Spikes reach beyond the top of the box
                hasSpawnedDebris: false,
                hasSpawnedShockwave: false
            });
        }
        
        if (this.spawnInterval > 0.5) this.spawnInterval -= 0.05;
    }
    
    // Update spikes
    var shakeThisFrame = false;
    for (var i = this.spikes.length - 1; i >= 0; i--) {
        var s = this.spikes[i];
        s.timer += dt;
        
        if (s.state === "WARN") {
            if (s.timer >= s.warnTime) {
                s.state = "THRUST";
                s.timer = 0;
            }
        } else if (s.state === "THRUST") {
            // Rapidly increase height
            var progress = s.timer / s.thrustTime;
            s.height = s.targetHeight * Math.min(1, progress);

            // --- VFX: Spawn debris and shockwave at thrust start ---
            if (!s.hasSpawnedDebris) {
                s.hasSpawnedDebris = true;
                shakeThisFrame = true;
                // Debris particles
                for (var d = 0; d < 12; d++) {
                    this.debrisParticles.push({
                        x: s.x + (Math.random() - 0.5) * this.spikeWidth * 1.5,
                        y: bb[3] - 5 - Math.random() * 10,
                        vx: (Math.random() - 0.5) * 80,
                        vy: -40 - Math.random() * 100,
                        life: 0.4 + Math.random() * 0.5,
                        maxLife: 0.4 + Math.random() * 0.5,
                        size: 1.5 + Math.random() * 2.5,
                        color: Math.random() > 0.4 ? "dust" : "spark"
                    });
                }
            }
            if (!s.hasSpawnedShockwave) {
                s.hasSpawnedShockwave = true;
                this.shockwaves.push({
                    x: s.x,
                    y: bb[3],
                    radius: 5,
                    maxRadius: 40 + Math.random() * 15,
                    life: 0.35,
                    maxLife: 0.35
                });
            }
            
            if (s.timer >= s.thrustTime) {
                s.state = "RETRACT";
                s.timer = 0;
            }
        } else if (s.state === "RETRACT") {
            // Quickly pull back down
            var progress = s.timer / s.retractTime;
            s.height = s.targetHeight * (1 - Math.min(1, progress));
            
            if (s.timer >= s.retractTime) {
                this.spikes.splice(i, 1);
            }
        }
    }

    // --- VFX: Screen shake on thrust ---
    if (shakeThisFrame) {
        this.shakeOffset.x = (Math.random() - 0.5) * 5;
        this.shakeOffset.y = (Math.random() - 0.5) * 4;
    } else {
        this.shakeOffset.x *= 0.8;
        this.shakeOffset.y *= 0.8;
    }

    // --- VFX: Update debris particles ---
    for (var i = this.debrisParticles.length - 1; i >= 0; i--) {
        var p = this.debrisParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt; // gravity
        p.life -= dt;
        if (p.life <= 0) {
            this.debrisParticles.splice(i, 1);
        }
    }

    // --- VFX: Update shockwaves ---
    for (var i = this.shockwaves.length - 1; i >= 0; i--) {
        var sw = this.shockwaves[i];
        sw.life -= dt;
        var prog = 1 - (sw.life / sw.maxLife);
        sw.radius = 5 + (sw.maxRadius - 5) * prog;
        if (sw.life <= 0) {
            this.shockwaves.splice(i, 1);
        }
    }
};

SachielRegenerationPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    
    ctx.save();
    // Apply screen shake
    ctx.translate(this.shakeOffset.x, this.shakeOffset.y);

    for (var i = 0; i < this.spikes.length; i++) {
        var s = this.spikes[i];
        
        if (s.state === "WARN") {
            var alpha = (s.timer / s.warnTime);

            // --- VFX: Ground crack effects in warning zone ---
            ctx.save();
            ctx.strokeStyle = "rgba(180, 40, 0, " + (alpha * 0.7) + ")";
            ctx.lineWidth = 1;
            // Main cracks radiating from center
            var numCracks = 5;
            for (var c = 0; c < numCracks; c++) {
                var ca = (c / numCracks) * Math.PI - Math.PI / 2;
                var crackLen = 8 + alpha * 14;
                ctx.beginPath();
                ctx.moveTo(s.x, bb[3] - 3);
                var cx1 = s.x + Math.cos(ca) * crackLen * 0.5 + (Math.sin(c * 3.7) * 3);
                var cy1 = bb[3] - 3 + Math.sin(ca) * crackLen * 0.4;
                var cx2 = s.x + Math.cos(ca) * crackLen + (Math.cos(c * 2.3) * 2);
                var cy2 = bb[3] - 3 + Math.sin(ca) * crackLen * 0.3;
                ctx.lineTo(cx1, cy1);
                ctx.lineTo(cx2, cy2);
                ctx.stroke();
            }
            ctx.restore();

            // Draw warning zone on the floor
            ctx.fillStyle = "rgba(255, 0, 0, " + (alpha * 0.5) + ")";
            ctx.fillRect(s.x - this.spikeWidth/2, bb[3] - 10, this.spikeWidth, 10);

            // --- VFX: Pulsing glow under the warning zone ---
            var pulseVal = 0.5 + 0.5 * Math.sin(this.vfxTime * 8);
            ctx.fillStyle = "rgba(255, 60, 0, " + (alpha * 0.25 * pulseVal) + ")";
            ctx.fillRect(s.x - this.spikeWidth/2 - 4, bb[3] - 14, this.spikeWidth + 8, 14);

            // Draw a thin rising warning line
            ctx.strokeStyle = "rgba(255, 0, 0, " + (alpha * 0.8) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(s.x, bb[3]);
            ctx.lineTo(s.x, bb[3] - s.targetHeight);
            ctx.stroke();
            
        } else if (s.state === "THRUST" || s.state === "RETRACT") {
            var spikeTop = bb[3] - s.height;

            // --- VFX: Crystalline edge glow (outer glow layer) ---
            ctx.save();
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#FF3300";
            ctx.strokeStyle = "rgba(255, 100, 50, 0.3)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(s.x - this.spikeWidth/2, bb[3]);
            ctx.lineTo(s.x - this.spikeWidth/2, spikeTop + 20);
            ctx.lineTo(s.x, spikeTop);
            ctx.lineTo(s.x + this.spikeWidth/2, spikeTop + 20);
            ctx.lineTo(s.x + this.spikeWidth/2, bb[3]);
            ctx.stroke();
            ctx.restore();

            // Draw the energy spike (original)
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#FF0000";
            
            // A sharp bone-like or energy-like spike
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.moveTo(s.x - this.spikeWidth/2, bb[3]);
            ctx.lineTo(s.x - this.spikeWidth/2, bb[3] - s.height + 20); // base of tip
            ctx.lineTo(s.x, bb[3] - s.height); // tip
            ctx.lineTo(s.x + this.spikeWidth/2, bb[3] - s.height + 20);
            ctx.lineTo(s.x + this.spikeWidth/2, bb[3]);
            ctx.fill();

            // --- VFX: Crystalline highlight edge ---
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "rgba(255, 200, 200, 0.5)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(s.x - this.spikeWidth/2 + 2, bb[3]);
            ctx.lineTo(s.x - this.spikeWidth/2 + 2, spikeTop + 22);
            ctx.lineTo(s.x, spikeTop + 2);
            ctx.stroke();
            
            // Inner red core - with pulsing and flicker
            var corePulse = 0.6 + 0.4 * Math.sin(this.vfxTime * 12 + i * 2);
            var flickerJitter = Math.random() > 0.85 ? 0.3 : 0;
            var coreAlpha = Math.min(1.0, corePulse + flickerJitter);
            var coreR = Math.floor(200 + 55 * corePulse);
            var coreG = Math.floor(20 * (1 - corePulse));
            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(255, 0, 0, " + (coreAlpha * 0.6) + ")";
            ctx.fillStyle = "rgba(" + coreR + ", " + coreG + ", 0, " + coreAlpha + ")";
            ctx.beginPath();
            ctx.moveTo(s.x - this.spikeWidth/4, bb[3]);
            ctx.lineTo(s.x - this.spikeWidth/4, bb[3] - s.height + 25);
            ctx.lineTo(s.x, bb[3] - s.height + 5);
            ctx.lineTo(s.x + this.spikeWidth/4, bb[3] - s.height + 25);
            ctx.lineTo(s.x + this.spikeWidth/4, bb[3]);
            ctx.fill();
            ctx.shadowBlur = 0;

            // --- VFX: Bright tip highlight ---
            if (s.height > 30) {
                ctx.fillStyle = "rgba(255, 255, 200, 0.6)";
                ctx.beginPath();
                ctx.arc(s.x, spikeTop + 4, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // --- VFX: Ground impact shockwave rings ---
    for (var i = 0; i < this.shockwaves.length; i++) {
        var sw = this.shockwaves[i];
        var swAlpha = (sw.life / sw.maxLife) * 0.6;
        ctx.save();
        ctx.strokeStyle = "rgba(255, 120, 50, " + swAlpha + ")";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(255, 80, 0, " + swAlpha + ")";
        // Draw as a horizontal ellipse (ground-level shockwave)
        ctx.beginPath();
        ctx.ellipse(sw.x, sw.y, sw.radius, sw.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // --- VFX: Dust/debris particles ---
    for (var i = 0; i < this.debrisParticles.length; i++) {
        var p = this.debrisParticles[i];
        var pAlpha = (p.life / p.maxLife) * 0.9;
        if (p.color === "spark") {
            ctx.fillStyle = "rgba(255, 180, 80, " + pAlpha + ")";
            ctx.shadowBlur = 4;
            ctx.shadowColor = "rgba(255, 150, 50, " + pAlpha + ")";
        } else {
            ctx.fillStyle = "rgba(180, 160, 140, " + pAlpha + ")";
            ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;

    ctx.restore(); // undo shake translate
};

SachielRegenerationPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    
    for (var i = 0; i < this.spikes.length; i++) {
        var s = this.spikes[i];
        if (s.state === "THRUST" || s.state === "RETRACT") {
            var spikeTopY = bb[3] - s.height;
            var spikeLeft = s.x - this.spikeWidth/2;
            var spikeRight = s.x + this.spikeWidth/2;
            
            // Simple AABB collision with the spike rect
            if (sx + sw > spikeLeft && sx < spikeRight) {
                if (sy + sh > spikeTopY) { // If soul is lower than the spike top
                    return this.damVal;
                }
            }
        }
    }
    return 0;
};

SachielRegenerationPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.spikes.length === 0;
};
