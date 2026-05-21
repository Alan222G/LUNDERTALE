// sachielEyeSpark.js - Sachiel shoots fast, bouncing golden sparks from its eyes
var SachielEyeSparkPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 6;
    this.sparks = [];
    this.spawnTimer = 0;
    this.spawnInterval = 0.8;

    // VFX arrays
    this.embers = [];
    this.bounceFlashes = [];
    this.shakeOffset = {x: 0, y: 0};
    this.shakeIntensity = 0;
};

SachielEyeSparkPattern.prototype = Object.create(BulletPattern.prototype);

SachielEyeSparkPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    
    // Spawn new sparks
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        
        // Spawn 2 sparks at a time (like from two eyes)
        for (var i = 0; i < 2; i++) {
            var angle = Math.PI/2 + (Math.random() - 0.5) * 1.5; // Downwards with some spread
            var speed = 250 + Math.random() * 100;
            
            this.sparks.push({
                x: (bb[0] + bb[2]) / 2 + (i === 0 ? -20 : 20), // Left and right "eyes"
                y: bb[1] - 30, // Start slightly above the box
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 4 + Math.random() * 2,
                trail: [],
                bounces: 0,
                maxBounces: 3
            });
        }
        
        // Increase spawn rate slightly less
        if (this.spawnInterval > 0.4) this.spawnInterval -= 0.05;
    }

    // Decay screen shake
    this.shakeIntensity *= 0.85;
    if (this.shakeIntensity < 0.1) this.shakeIntensity = 0;
    this.shakeOffset.x = (Math.random() - 0.5) * 2 * this.shakeIntensity;
    this.shakeOffset.y = (Math.random() - 0.5) * 2 * this.shakeIntensity;

    // Update ember particles
    for (var e = this.embers.length - 1; e >= 0; e--) {
        var em = this.embers[e];
        em.x += em.vx * dt;
        em.y += em.vy * dt;
        em.vy += 120 * dt; // Gravity pulls embers down
        em.life -= dt;
        if (em.life <= 0) this.embers.splice(e, 1);
    }

    // Update bounce flashes
    for (var f = this.bounceFlashes.length - 1; f >= 0; f--) {
        var fl = this.bounceFlashes[f];
        fl.radius += 100 * dt;
        fl.life -= dt;
        if (fl.life <= 0) this.bounceFlashes.splice(f, 1);
    }
    
    // Update sparks
    for (var i = this.sparks.length - 1; i >= 0; i--) {
        var s = this.sparks[i];
        
        // Save trail
        s.trail.push({x: s.x, y: s.y});
        if (s.trail.length > 5) s.trail.shift();
        
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        // Shed ember particles
        if (Math.random() < 0.4) {
            this.embers.push({
                x: s.x + (Math.random() - 0.5) * 4,
                y: s.y + (Math.random() - 0.5) * 4,
                vx: (Math.random() - 0.5) * 30,
                vy: 10 + Math.random() * 20,
                life: 0.3 + Math.random() * 0.4,
                maxLife: 0.7,
                size: 1 + Math.random() * 1.5
            });
        }
        
        // Bounce logic inside the battle box
        var bounced = false;
        if (s.x - s.radius < bb[0]) { s.x = bb[0] + s.radius; s.vx *= -1; bounced = true; }
        if (s.x + s.radius > bb[2]) { s.x = bb[2] - s.radius; s.vx *= -1; bounced = true; }
        if (s.y - s.radius < bb[1] && s.vy < 0) { s.y = bb[1] + s.radius; s.vy *= -1; bounced = true; }
        if (s.y + s.radius > bb[3]) { s.y = bb[3] - s.radius; s.vy *= -1; bounced = true; }
        
        if (bounced) {
            s.bounces++;
            // Slightly speed up on bounce
            s.vx *= 1.05;
            s.vy *= 1.05;

            // VFX: screen shake on bounce
            this.shakeIntensity = 2.5;

            // VFX: bounce flash ring
            this.bounceFlashes.push({
                x: s.x,
                y: s.y,
                radius: s.radius,
                life: 0.25,
                maxLife: 0.25
            });

            // VFX: burst of embers on bounce
            for (var e = 0; e < 5; e++) {
                this.embers.push({
                    x: s.x,
                    y: s.y,
                    vx: (Math.random() - 0.5) * 80,
                    vy: (Math.random() - 0.5) * 80,
                    life: 0.3 + Math.random() * 0.3,
                    maxLife: 0.6,
                    size: 1.5 + Math.random() * 2
                });
            }
            
            if (s.bounces > s.maxBounces) {
                this.sparks.splice(i, 1);
            }
        }
    }
};

SachielEyeSparkPattern.prototype.draw = function(ctx) {
    ctx.save();

    // Apply screen shake
    if (this.shakeIntensity > 0) {
        ctx.translate(this.shakeOffset.x, this.shakeOffset.y);
    }

    // Draw electric arcs between nearby sparks
    for (var i = 0; i < this.sparks.length; i++) {
        for (var j = i + 1; j < this.sparks.length; j++) {
            var s1 = this.sparks[i];
            var s2 = this.sparks[j];
            var dx = s2.x - s1.x;
            var dy = s2.y - s1.y;
            var dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) {
                var arcAlpha = (1 - dist / 100) * 0.6;
                ctx.save();
                ctx.strokeStyle = "rgba(255, 230, 80, " + arcAlpha + ")";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(s1.x, s1.y);

                // Jagged lightning path with 3 segments
                var segments = 3;
                for (var seg = 1; seg <= segments; seg++) {
                    var t = seg / (segments + 1);
                    var midX = s1.x + dx * t + (Math.random() - 0.5) * 20;
                    var midY = s1.y + dy * t + (Math.random() - 0.5) * 20;
                    ctx.lineTo(midX, midY);
                }
                ctx.lineTo(s2.x, s2.y);
                ctx.stroke();

                // Brighter inner arc
                ctx.strokeStyle = "rgba(255, 255, 200, " + (arcAlpha * 0.5) + ")";
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(s1.x, s1.y);
                for (var seg = 1; seg <= segments; seg++) {
                    var t2 = seg / (segments + 1);
                    var midX2 = s1.x + dx * t2 + (Math.random() - 0.5) * 12;
                    var midY2 = s1.y + dy * t2 + (Math.random() - 0.5) * 12;
                    ctx.lineTo(midX2, midY2);
                }
                ctx.lineTo(s2.x, s2.y);
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    // Draw all sparks and their trails
    for (var i = 0; i < this.sparks.length; i++) {
        var s = this.sparks[i];
        
        ctx.save();
        
        // Draw gradient trail (gold -> orange -> red fade)
        if (s.trail.length > 1) {
            for (var t = 1; t < s.trail.length; t++) {
                var trailAlpha = (t / s.trail.length) * 0.7;
                var trailWidth = s.radius * 1.5 * (t / s.trail.length);

                // Color shifts from red (oldest) to gold (newest)
                var r = 255;
                var g = Math.floor(100 + 155 * (t / s.trail.length)); // 100 -> 255 (red -> gold)
                var b = Math.floor(0 + 50 * (t / s.trail.length));

                ctx.beginPath();
                ctx.moveTo(s.trail[t-1].x, s.trail[t-1].y);
                ctx.lineTo(s.trail[t].x, s.trail[t].y);
                ctx.strokeStyle = "rgba(" + r + ", " + g + ", " + b + ", " + trailAlpha + ")";
                ctx.lineWidth = trailWidth;
                ctx.lineCap = "round";
                ctx.stroke();
            }

            // Bright core trail line
            ctx.beginPath();
            ctx.moveTo(s.trail[0].x, s.trail[0].y);
            for (var t = 1; t < s.trail.length; t++) {
                ctx.lineTo(s.trail[t].x, s.trail[t].y);
            }
            ctx.strokeStyle = "rgba(255, 255, 180, 0.3)";
            ctx.lineWidth = s.radius * 0.5;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
        }
        
        // Draw spark head with pulsing glow
        var pulse = 0.7 + Math.sin(this.elapsed * 12 + i * 2) * 0.3;
        var glowRadius = s.radius * (2.5 + pulse);

        // Outer glow halo
        var headGlow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowRadius);
        headGlow.addColorStop(0, "rgba(255, 220, 50, " + (0.4 * pulse) + ")");
        headGlow.addColorStop(0.5, "rgba(255, 160, 0, " + (0.15 * pulse) + ")");
        headGlow.addColorStop(1, "rgba(255, 100, 0, 0)");
        ctx.fillStyle = headGlow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 15 + pulse * 5;
        ctx.shadowColor = "#FFD700"; // Golden
        
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#FF8C00"; // Darker orange core
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    // Draw bounce flash rings
    for (var f = 0; f < this.bounceFlashes.length; f++) {
        var fl = this.bounceFlashes[f];
        var flashAlpha = (fl.life / fl.maxLife);
        ctx.save();
        ctx.beginPath();
        ctx.arc(fl.x, fl.y, fl.radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 240, 100, " + (flashAlpha * 0.9) + ")";
        ctx.lineWidth = 2;
        ctx.stroke();
        // Inner white flash
        ctx.beginPath();
        ctx.arc(fl.x, fl.y, fl.radius * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 220, " + (flashAlpha * 0.6) + ")";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }

    // Draw ember particles
    for (var e = 0; e < this.embers.length; e++) {
        var em = this.embers[e];
        var emberAlpha = Math.max(0, em.life / em.maxLife);
        ctx.beginPath();
        ctx.arc(em.x, em.y, em.size, 0, Math.PI * 2);
        // Embers fade from yellow-orange to red
        var eR = 255;
        var eG = Math.floor(200 * emberAlpha);
        var eB = Math.floor(50 * emberAlpha);
        ctx.fillStyle = "rgba(" + eR + ", " + eG + ", " + eB + ", " + (emberAlpha * 0.8) + ")";
        ctx.fill();
    }

    ctx.restore();
};

SachielEyeSparkPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.sparks.length; i++) {
        var s = this.sparks[i];
        
        // Simple circle-AABB collision roughly
        var closeX = Math.max(sx, Math.min(s.x, sx + sw));
        var closeY = Math.max(sy, Math.min(s.y, sy + sh));
        
        var dx = s.x - closeX;
        var dy = s.y - closeY;
        
        if ((dx * dx + dy * dy) < (s.radius * s.radius)) {
            // Hit! Remove spark so it doesn't multi-hit
            this.sparks.splice(i, 1);
            return this.damVal;
        }
    }
    return 0;
};

SachielEyeSparkPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.sparks.length === 0;
};
