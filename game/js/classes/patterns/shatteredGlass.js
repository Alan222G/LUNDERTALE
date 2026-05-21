// shatteredGlass.js - Paradoja: Shards of glass fall and bounce
var ShatteredGlassPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    
    this.shards = [];
    this.dustParticles = [];
    this.spawnTimer = 0;
};

ShatteredGlassPattern.prototype = Object.create(BulletPattern.prototype);

ShatteredGlassPattern.prototype.generateBullets = function(battleBox) {
    this.elapsed = 0;
    this.shards = [];
    this.dustParticles = [];
    this.spawnTimer = 0.5;
};

ShatteredGlassPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 0.4 && this.elapsed < this.duration - 2) {
        this.spawnTimer = 0;
        
        // Spawn 1 shard at the top to give space to dodge
        var num = 1;
        for(var i=0; i<num; i++) {
            this.shards.push({
                x: bb[0] + 10 + Math.random() * (bb[2] - bb[0] - 20),
                y: bb[1] - 20,
                vx: (Math.random() - 0.5) * 100, // Less horizontal speed
                vy: 80 + Math.random() * 100,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 10,
                size: 10 + Math.random() * 12,
                bounces: 0
            });
        }
    }
    
    for (var i = this.shards.length - 1; i >= 0; i--) {
        var s = this.shards[i];
        
        s.vy += dt * 300; // Slightly lower gravity
        
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.rotation += s.rotSpeed * dt;
        
        var prevBounces = s.bounces;
        
        // Bounce off walls
        if (s.x < bb[0] + s.size) {
            s.x = bb[0] + s.size;
            s.vx *= -0.6;
            s.bounces++;
        } else if (s.x > bb[2] - s.size) {
            s.x = bb[2] - s.size;
            s.vx *= -0.6;
            s.bounces++;
        }
        
        // Bounce off floor
        if (s.y > bb[3] - s.size) {
            s.y = bb[3] - s.size;
            s.vy *= -0.6; // Lower bounce
            s.vx *= 0.8; // Friction
            s.bounces++;
        }
        
        // Spawn dust on bounce
        if (s.bounces > prevBounces) {
            var dustCount = 4 + Math.floor(Math.random() * 4);
            for (var d = 0; d < dustCount; d++) {
                this.dustParticles.push({
                    x: s.x + (Math.random() - 0.5) * s.size,
                    y: s.y + (Math.random() - 0.5) * s.size,
                    vx: (Math.random() - 0.5) * 80,
                    vy: -20 - Math.random() * 60,
                    life: 0.4 + Math.random() * 0.3,
                    maxLife: 0.4 + Math.random() * 0.3,
                    size: 1 + Math.random() * 2
                });
            }
        }
        
        // Shatter after 1 bounce to reduce screen clutter
        if (s.bounces > 1 && s.y > bb[3] - s.size - 5) {
            for (var d = 0; d < 8; d++) {
                this.dustParticles.push({
                    x: s.x + (Math.random() - 0.5) * s.size * 1.5,
                    y: s.y + (Math.random() - 0.5) * s.size * 1.5,
                    vx: (Math.random() - 0.5) * 120,
                    vy: -30 - Math.random() * 80,
                    life: 0.5 + Math.random() * 0.4,
                    maxLife: 0.5 + Math.random() * 0.4,
                    size: 1.5 + Math.random() * 2.5
                });
            }
            this.shards.splice(i, 1); 
        }
    }
    
    // Update dust particles
    for (var i = this.dustParticles.length - 1; i >= 0; i--) {
        var p = this.dustParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += dt * 120; // Light gravity on dust
        p.life -= dt;
        if (p.life <= 0) {
            this.dustParticles.splice(i, 1);
        }
    }
};

ShatteredGlassPattern.prototype.draw = function(ctx) {
    ctx.save();

    // ----- Draw shards -----
    for (var i = 0; i < this.shards.length; i++) {
        var s = this.shards[i];
        var speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);

        // --- Afterimage trail for fast shards ---
        if (speed > 140) {
            ctx.save();
            var trailSteps = 3;
            for (var t = trailSteps; t >= 1; t--) {
                var frac = t / (trailSteps + 1);
                var tx = s.x - s.vx * 0.012 * t;
                var ty = s.y - s.vy * 0.012 * t;
                ctx.globalAlpha = (1 - frac) * 0.18;
                ctx.translate(tx, ty);
                ctx.rotate(s.rotation - s.rotSpeed * 0.012 * t);
                ctx.beginPath();
                ctx.moveTo(0, -s.size);
                ctx.lineTo(s.size * 0.7, s.size * 0.5);
                ctx.lineTo(-s.size * 0.3, s.size * 0.9);
                ctx.lineTo(-s.size * 0.6, -s.size * 0.2);
                ctx.closePath();
                ctx.fillStyle = "rgba(160, 220, 255, 0.5)";
                ctx.fill();
                ctx.setTransform(1,0,0,1,0,0);
            }
            ctx.restore();
        }

        // --- Main shard ---
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);

        // Crystalline glow
        ctx.shadowBlur = 12 + Math.sin(s.rotation * 2) * 4;
        ctx.shadowColor = "rgba(140, 220, 255, 0.8)";

        // Polygonal glass shard path (irregular quadrilateral)
        ctx.beginPath();
        ctx.moveTo(0, -s.size);
        ctx.lineTo(s.size * 0.7, s.size * 0.5);
        ctx.lineTo(-s.size * 0.3, s.size * 0.9);
        ctx.lineTo(-s.size * 0.6, -s.size * 0.2);
        ctx.closePath();

        // Blue-to-white gradient fill
        var grad = ctx.createLinearGradient(-s.size * 0.6, -s.size, s.size * 0.7, s.size * 0.9);
        grad.addColorStop(0, "rgba(180, 230, 255, 0.85)");
        grad.addColorStop(0.45, "rgba(100, 180, 240, 0.7)");
        grad.addColorStop(1, "rgba(220, 245, 255, 0.9)");
        ctx.fillStyle = grad;
        ctx.fill();

        // White edge highlights
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.stroke();

        // Inner edge accent (second, thinner edge for facet look)
        ctx.beginPath();
        ctx.moveTo(s.size * 0.05, -s.size * 0.85);
        ctx.lineTo(s.size * 0.6, s.size * 0.4);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // --- Glass reflection line (moves with rotation) ---
        var refOffset = Math.sin(s.rotation * 1.5) * s.size * 0.35;
        ctx.beginPath();
        ctx.moveTo(-s.size * 0.3 + refOffset, -s.size * 0.1);
        ctx.lineTo(s.size * 0.25 + refOffset, s.size * 0.35);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
        ctx.lineWidth = 1.5;
        ctx.lineCap = "round";
        ctx.stroke();

        // Additive glow overlay using lighter compositing
        ctx.globalCompositeOperation = "lighter";
        ctx.beginPath();
        ctx.moveTo(0, -s.size);
        ctx.lineTo(s.size * 0.7, s.size * 0.5);
        ctx.lineTo(-s.size * 0.3, s.size * 0.9);
        ctx.lineTo(-s.size * 0.6, -s.size * 0.2);
        ctx.closePath();
        ctx.fillStyle = "rgba(180, 230, 255, 0.12)";
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";

        ctx.restore();
    }

    // ----- Draw dust particles -----
    if (this.dustParticles && this.dustParticles.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (var i = 0; i < this.dustParticles.length; i++) {
            var p = this.dustParticles[i];
            var alpha = (p.life / p.maxLife);
            var sz = p.size * alpha;
            if (sz < 0.2) continue;

            ctx.shadowBlur = 6;
            ctx.shadowColor = "rgba(200, 240, 255, " + (alpha * 0.8).toFixed(2) + ")";
            ctx.globalAlpha = alpha;
            ctx.fillStyle = "rgba(220, 245, 255, " + alpha.toFixed(2) + ")";

            ctx.beginPath();
            ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    ctx.restore();
};

ShatteredGlassPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var px = sx + sw / 2;
    var py = sy + sh / 2;
    var pr = sw / 2;
    
    for (var i = 0; i < this.shards.length; i++) {
        var s = this.shards[i];
        var dx = px - s.x;
        var dy = py - s.y;
        var dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < s.size + pr) {
            return this.damVal;
        }
    }
    return 0;
};

ShatteredGlassPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.shards.length === 0;
};
