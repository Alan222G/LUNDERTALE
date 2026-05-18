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
            rotation: 0, fadeSpeed: 1.0, color: this.color,
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
    BulletPattern.prototype.draw.call(this, ctx);

    // Draw gravity wells
    ctx.save();
    for (var i = 0; i < this.wells.length; i++) {
        var w = this.wells[i];
        
        // Warning outline — pulsating red ring
        var pulse = Math.sin(this.elapsed * 15) * 5;
        var percent = w.timer / w.explodeTime;
        
        // Growing danger ring
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.radius + pulse + (percent * 25), 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 0, 0, " + (1 - percent).toFixed(2) + ")";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dark core with gravitational distortion
        var coreSize = w.radius * (0.3 + percent * 0.7);
        var coreGrad = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, coreSize);
        coreGrad.addColorStop(0, "#000000");
        coreGrad.addColorStop(0.7, "rgba(80, 0, 120, 0.8)");
        coreGrad.addColorStop(1, "rgba(255, 0, 255, 0.4)");
        
        ctx.beginPath();
        ctx.arc(w.x, w.y, coreSize, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.fill();
        
        // Inner magenta ring
        ctx.strokeStyle = "#FF00FF";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
    ctx.restore();
};

EventHorizonPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0 && this.wells.length === 0;
};
