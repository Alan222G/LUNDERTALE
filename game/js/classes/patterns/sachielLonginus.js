// sachielLonginus.js - The iconic Spear of Longinus: massive double-helix lance
var SachielLonginusPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 15;
    this.lances = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.5;
    // VFX arrays
    this.particles = [];
    this.shockwaves = [];
    this.screenShake = { x: 0, y: 0, intensity: 0 };
};

SachielLonginusPattern.prototype = Object.create(BulletPattern.prototype);

SachielLonginusPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        
        // Pick one horizontal (0 or 1) and one vertical (2 or 3)
        var sides = [Math.floor(Math.random() * 2), 2 + Math.floor(Math.random() * 2)];
        
        for (var i = 0; i < sides.length; i++) {
            var side = sides[i];
            var x, y, vx, vy, rot;
            var speed = 1000; // VERY FAST
            
            if (side === 0) { // Left to Right
                x = bb[0] - 300;
                y = bb[1] + 20 + Math.random() * (bb[3] - bb[1] - 40);
                vx = speed; vy = 0; rot = 0;
            } else if (side === 1) { // Right to Left
                x = bb[2] + 300;
                y = bb[1] + 20 + Math.random() * (bb[3] - bb[1] - 40);
                vx = -speed; vy = 0; rot = Math.PI;
            } else if (side === 2) { // Top to Bottom
                x = bb[0] + 20 + Math.random() * (bb[2] - bb[0] - 40);
                y = bb[1] - 300;
                vx = 0; vy = speed; rot = Math.PI/2;
            } else { // Bottom to Top
                x = bb[0] + 20 + Math.random() * (bb[2] - bb[0] - 40);
                y = bb[3] + 300;
                vx = 0; vy = -speed; rot = -Math.PI/2;
            }
            
            this.lances.push({
                x: x, y: y,
                targetX: x, targetY: y, // To track warning line
                vx: vx, vy: vy,
                rot: rot,
                state: "WARN",
                timer: 0,
                warnTime: 0.9,
                width: 200, // Length of lance
                height: 20, // Thickness
                hasEnteredBox: false, // VFX: track if shake was triggered
                trailHistory: [] // VFX: positions for energy trail
            });
        }
        
        if (this.spawnInterval > 0.8) this.spawnInterval -= 0.1;
    }
    
    for (var i = this.lances.length - 1; i >= 0; i--) {
        var l = this.lances[i];
        
        if (l.state === "WARN") {
            l.timer += dt;
            if (l.timer >= l.warnTime) {
                l.state = "FIRE";
                // VFX: spawn shockwave at launch point
                this.shockwaves.push({
                    x: l.x, y: l.y,
                    radius: 5, maxRadius: 80,
                    alpha: 1.0, life: 0, maxLife: 0.4
                });
            }
        } else if (l.state === "FIRE") {
            l.x += l.vx * dt;
            l.y += l.vy * dt;

            // VFX: save trail positions
            l.trailHistory.push({ x: l.x, y: l.y, age: 0 });
            if (l.trailHistory.length > 12) l.trailHistory.shift();
            for (var t = 0; t < l.trailHistory.length; t++) {
                l.trailHistory[t].age += dt;
            }

            // VFX: spawn sparks at lance tip
            if (Math.random() < 0.6) {
                var tipLocalX = 180;
                var cosR = Math.cos(l.rot), sinR = Math.sin(l.rot);
                var tipX = l.x + tipLocalX * cosR;
                var tipY = l.y + tipLocalX * sinR;
                this.particles.push({
                    x: tipX, y: tipY,
                    vx: (Math.random() - 0.5) * 200 + l.vx * 0.05,
                    vy: (Math.random() - 0.5) * 200 + l.vy * 0.05,
                    life: 0.3 + Math.random() * 0.25,
                    maxLife: 0.3 + Math.random() * 0.25,
                    size: 1.5 + Math.random() * 2.5,
                    type: "spark"
                });
                this.particles[this.particles.length - 1].maxLife = this.particles[this.particles.length - 1].life;
            }

            // VFX: screen shake when lance enters the battle box
            if (!l.hasEnteredBox) {
                if (l.x > bb[0] && l.x < bb[2] && l.y > bb[1] && l.y < bb[3]) {
                    l.hasEnteredBox = true;
                    this.screenShake.intensity = 4;
                }
            }
            
            // Remove if far off screen
            if (l.x < bb[0] - 800 || l.x > bb[2] + 800 ||
                l.y < bb[1] - 800 || l.y > bb[3] + 800) {
                this.lances.splice(i, 1);
            }
        }
    }

    // VFX: update particles
    for (var i = this.particles.length - 1; i >= 0; i--) {
        var p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) this.particles.splice(i, 1);
    }

    // VFX: update shockwaves
    for (var i = this.shockwaves.length - 1; i >= 0; i--) {
        var sw = this.shockwaves[i];
        sw.life += dt;
        var prog = sw.life / sw.maxLife;
        sw.radius = sw.maxRadius * prog;
        sw.alpha = 1.0 - prog;
        if (sw.life >= sw.maxLife) this.shockwaves.splice(i, 1);
    }

    // VFX: decay screen shake
    if (this.screenShake.intensity > 0) {
        this.screenShake.x = (Math.random() - 0.5) * 2 * this.screenShake.intensity;
        this.screenShake.y = (Math.random() - 0.5) * 2 * this.screenShake.intensity;
        this.screenShake.intensity *= 0.88;
        if (this.screenShake.intensity < 0.3) this.screenShake.intensity = 0;
    } else {
        this.screenShake.x = 0;
        this.screenShake.y = 0;
    }
};

SachielLonginusPattern.prototype.drawLance = function(ctx) {
    // Draws a horizontal lance pointing right
    // VFX: fiery aura glow layers
    ctx.shadowBlur = 25;
    ctx.shadowColor = "#FF4400";
    
    // VFX: outer aura glow
    ctx.save();
    ctx.globalAlpha = 0.15 + Math.sin(this.elapsed * 12) * 0.05;
    ctx.strokeStyle = "#FF4400";
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-100, 0);
    ctx.lineTo(140, 0);
    ctx.stroke();
    ctx.restore();

    // VFX: inner hot glow
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = "#FF8800";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-100, 0);
    ctx.lineTo(140, 0);
    ctx.stroke();
    ctx.restore();

    ctx.shadowBlur = 10;
    ctx.shadowColor = "#FF0000";
    
    // Main shaft (Double helix implied by overlapping wavy lines)
    ctx.strokeStyle = "#AA0000";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    
    ctx.beginPath();
    ctx.moveTo(-100, 0);
    // Forked tip
    ctx.lineTo(80, 0);
    ctx.stroke();
    
    // Top fork
    ctx.beginPath();
    ctx.moveTo(80, 0);
    ctx.quadraticCurveTo(100, -15, 120, -5);
    ctx.lineTo(140, 0); // Joining back
    ctx.stroke();
    
    // Bottom fork
    ctx.beginPath();
    ctx.moveTo(80, 0);
    ctx.quadraticCurveTo(100, 15, 120, 5);
    ctx.lineTo(140, 0); // Joining back
    ctx.stroke();
    
    // The massive sharp point
    ctx.fillStyle = "#FF0000";
    ctx.beginPath();
    ctx.moveTo(140, -4);
    ctx.lineTo(180, 0);
    ctx.lineTo(140, 4);
    ctx.fill();

    // VFX: bright hot core at tip
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#FFAA00";
    ctx.fillStyle = "#FFCC44";
    ctx.globalAlpha = 0.6 + Math.sin(this.elapsed * 20) * 0.2;
    ctx.beginPath();
    ctx.arc(180, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Helix pattern on shaft
    ctx.strokeStyle = "#FF3333";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (var x = -100; x < 80; x += 10) {
        var waveY = Math.sin(x * 0.2) * 6;
        if (x === -100) ctx.moveTo(x, waveY);
        else ctx.lineTo(x, waveY);
    }
    ctx.stroke();
};

SachielLonginusPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();

    // VFX: apply screen shake offset
    ctx.save();
    ctx.translate(this.screenShake.x, this.screenShake.y);
    
    for (var i = 0; i < this.lances.length; i++) {
        var l = this.lances[i];
        
        if (l.state === "WARN") {
            // Draw warning line across the entire screen
            var alpha = (l.timer / l.warnTime);

            // VFX: pulsing glow on warning line
            var pulse = Math.sin(this.elapsed * 25) * 0.15;
            var outerAlpha = alpha * (0.15 + pulse);
            var innerAlpha = alpha * (0.4 + pulse);

            ctx.save();
            ctx.translate(l.targetX, l.targetY);
            ctx.rotate(l.rot);

            // VFX: outer wide glow
            ctx.shadowBlur = 20;
            ctx.shadowColor = "rgba(255, 50, 0, " + outerAlpha + ")";
            ctx.fillStyle = "rgba(255, 50, 0, " + outerAlpha + ")";
            ctx.fillRect(0, -l.height * 1.5, 2000, l.height * 3);

            // Original warning line (enhanced alpha)
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#FF0000";
            ctx.fillStyle = "rgba(255, 0, 0, " + innerAlpha + ")";
            ctx.fillRect(0, -l.height/2, 2000, l.height);

            // VFX: bright center core line
            ctx.fillStyle = "rgba(255, 200, 100, " + (alpha * 0.3) + ")";
            ctx.fillRect(0, -2, 2000, 4);

            ctx.restore();
            
        } else if (l.state === "FIRE") {
            // VFX: draw energy trail behind lance
            if (l.trailHistory.length > 1) {
                ctx.save();
                for (var t = 0; t < l.trailHistory.length; t++) {
                    var tr = l.trailHistory[t];
                    var trAlpha = (1 - t / l.trailHistory.length) * 0.35;
                    var trSize = (1 - t / l.trailHistory.length) * 8;
                    ctx.fillStyle = "rgba(255, " + Math.floor(80 + t * 12) + ", 0, " + trAlpha + ")";
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = "rgba(255, 100, 0, " + trAlpha + ")";
                    ctx.beginPath();
                    ctx.arc(tr.x, tr.y, trSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }

            // Draw the actual lance
            ctx.save();
            ctx.translate(l.x, l.y);
            ctx.rotate(l.rot);
            this.drawLance(ctx);
            ctx.restore();
        }
    }

    // VFX: draw shockwave rings
    for (var i = 0; i < this.shockwaves.length; i++) {
        var sw = this.shockwaves[i];
        ctx.save();
        ctx.strokeStyle = "rgba(255, 100, 0, " + sw.alpha + ")";
        ctx.lineWidth = 3 * sw.alpha;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(255, 60, 0, " + sw.alpha * 0.6 + ")";
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        // inner brighter ring
        ctx.strokeStyle = "rgba(255, 200, 100, " + sw.alpha * 0.5 + ")";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // VFX: draw spark particles
    for (var i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        var pAlpha = p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = pAlpha;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#FFAA00";
        ctx.fillStyle = "rgba(255, " + Math.floor(150 + Math.random() * 105) + ", 0, 1)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * pAlpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    ctx.restore(); // end screen shake
};

SachielLonginusPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var soulCX = sx + sw / 2;
    var soulCY = sy + sh / 2;
    
    for (var i = 0; i < this.lances.length; i++) {
        var l = this.lances[i];
        if (l.state === "FIRE") {
            // Un-rotate soul coords relative to lance
            var dx = soulCX - l.x;
            var dy = soulCY - l.y;
            
            var rx = dx * Math.cos(-l.rot) - dy * Math.sin(-l.rot);
            var ry = dx * Math.sin(-l.rot) + dy * Math.cos(-l.rot);
            
            // Lance hitbox (approx -100 to +180 in X, -15 to +15 in Y)
            if (rx > -100 && rx < 180 && ry > -15 && ry < 15) {
                return this.damVal;
            }
        }
    }
    return 0;
};

SachielLonginusPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.lances.length === 0;
};
