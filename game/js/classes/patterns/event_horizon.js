// event_horizon.js — Gravity wells that explode into void orbs
// When a bullet hits the player, spawn an extra bomb automatically
var EventHorizonPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.wells = [];
    this.wellSpawnTimer = 0;
    this.wellSpawnInterval = 1.0; // Faster spawning
    this.damVal = config.damVal || 9;
    this.color = "#000000";
    this.hitSpawnQueued = false;
};

EventHorizonPattern.prototype = Object.create(BulletPattern.prototype);

EventHorizonPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.wells = [];
    this.wellSpawnTimer = this.wellSpawnInterval; // Spawn first one immediately
};

EventHorizonPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.wellSpawnTimer += dt;

    if (this.wellSpawnTimer >= this.wellSpawnInterval && this.elapsed < this.duration - 2) {
        this.wellSpawnTimer = 0;
        this.spawnWell();
    }

    // Update wells
    for (var i = this.wells.length - 1; i >= 0; i--) {
        var w = this.wells[i];
        w.timer += dt;
        if (w.timer >= w.explodeTime) {
            this.explodeWell(w);
            this.wells.splice(i, 1);
        }
    }

    // Update exploding bullets
    BulletPattern.prototype.update.call(this, dt);

    var bb = this.battleBox;
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        if (this.bullets[i].isOutOfBounds([bb[0] - 100, bb[1] - 100, bb[2] + 100, bb[3] + 100])) {
            this.bullets.splice(i, 1);
        }
    }
};

EventHorizonPattern.prototype.spawnWell = function() {
    var bb = this.battleBox;
    this.wells.push({
        x: bb[0] + 30 + Math.random() * (bb[2] - bb[0] - 60),
        y: bb[1] + 30 + Math.random() * (bb[3] - bb[1] - 60),
        timer: 0,
        explodeTime: 1.3, // 1.3 seconds warning
        radius: 22
    });
};

EventHorizonPattern.prototype.explodeWell = function(w) {
    var numBullets = 14;
    var angleStep = (Math.PI * 2) / numBullets;
    for (var i = 0; i < numBullets; i++) {
        var theta = angleStep * i;
        var speed = 140;
        var vx = Math.cos(theta) * speed;
        var vy = Math.sin(theta) * speed;

        this.bullets.push(new Bullet({
            x: w.x - 6,
            y: w.y - 6,
            width: 12, height: 12,
            speed: 0,
            damVal: this.damVal,
            rotation: 0, fadeSpeed: 1.0, color: "#220044",
            vx: vx, vy: vy, useVelocity: true
        }));
    }
};

// Override checkCollision to spawn an extra bomb when player gets hit
EventHorizonPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var dmg = BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
    if (dmg > 0 && this.elapsed < this.duration - 1) {
        // Spawn a revenge bomb near the player's position!
        this.wells.push({
            x: sx + sw/2 + (Math.random() - 0.5) * 60,
            y: sy + sh/2 + (Math.random() - 0.5) * 60,
            timer: 0,
            explodeTime: 1.0, // Faster revenge bomb
            radius: 18
        });
    }
    return dmg;
};

EventHorizonPattern.prototype.draw = function(ctx) {
    // Draw bullets with void aesthetic
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        var bx = b.x + b.width / 2;
        var by = b.y + b.height / 2;
        
        // Outer purple glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(150, 0, 255, 0.6)";
        
        // Dark void core
        var vGrad = ctx.createRadialGradient(bx, by, 0, bx, by, 7);
        vGrad.addColorStop(0, "rgba(0, 0, 0, 0.95)");
        vGrad.addColorStop(0.6, "rgba(60, 0, 120, 0.7)");
        vGrad.addColorStop(1, "rgba(150, 0, 255, 0)");
        ctx.fillStyle = vGrad;
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fill();
        
        // Bright rim
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(200, 80, 255, 0.7)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(bx, by, 6, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();

    // Draw gravity wells
    ctx.save();
    for (var i = 0; i < this.wells.length; i++) {
        var w = this.wells[i];
        var percent = w.timer / w.explodeTime;
        
        // Suction particles spiraling inward
        for (var sp = 0; sp < 4; sp++) {
            var spAngle = this.elapsed * 6 + sp * Math.PI / 2 + i;
            var spR = w.radius * 2 * (1 - percent) + 8;
            var spx = w.x + Math.cos(spAngle) * spR;
            var spy = w.y + Math.sin(spAngle) * spR;
            ctx.fillStyle = "rgba(180, 80, 255, " + (0.3 * (1 - percent)).toFixed(2) + ")";
            ctx.beginPath();
            ctx.arc(spx, spy, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Growing danger ring — double ring
        var pulse = Math.sin(this.elapsed * 15) * 5;
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.radius + pulse + (percent * 25), 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 0, 0, " + (1 - percent).toFixed(2) + ")";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.radius + pulse + (percent * 20) - 3, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 100, 0, " + ((1 - percent) * 0.5).toFixed(2) + ")";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Dark core with gravitational distortion
        var coreSize = w.radius * (0.3 + percent * 0.7);
        var coreGrad = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, coreSize);
        coreGrad.addColorStop(0, "#000000");
        coreGrad.addColorStop(0.5, "rgba(60, 0, 100, 0.85)");
        coreGrad.addColorStop(0.8, "rgba(120, 0, 200, 0.5)");
        coreGrad.addColorStop(1, "rgba(200, 0, 255, 0.2)");
        
        ctx.beginPath();
        ctx.arc(w.x, w.y, coreSize, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.fill();
        
        // Inner magenta ring
        ctx.strokeStyle = "rgba(255, 0, 255, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
    ctx.restore();
};

EventHorizonPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0 && this.wells.length === 0;
};
