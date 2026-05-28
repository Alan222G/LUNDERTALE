// thanosMeteorRain.js — Space & Power Stone. Falling meteors.
// Large glowing red meteors rain down. When they hit the floor, they detonate
// and scatter smaller fire shards upwards.

var ThanosMeteorRainPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 12;
    
    this.meteors = []; // active falling meteors: { x, y, size, vy, vx, rotation, active }
};

ThanosMeteorRainPattern.prototype = Object.create(BulletPattern.prototype);

ThanosMeteorRainPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2; // Start quickly
    this.meteors = [];
};

ThanosMeteorRainPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];

    // 1. Spawn falling meteors
    if (this.spawnTimer >= 0.72 && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        
        var rx = bb[0] + 20 + Math.random() * (bbW - 40);
        this.meteors.push({
            x: rx,
            y: bb[1] - 30,
            size: 20 + Math.random() * 10,
            vy: 140 + Math.random() * 60,
            vx: (Math.random() - 0.5) * 40,
            rotation: Math.random() * Math.PI,
            active: true
        });
    }

    // Update active meteors
    for (var i = this.meteors.length - 1; i >= 0; i--) {
        var m = this.meteors[i];
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.rotation += dt * 3.0;

        // Ground collision (detonation)
        if (m.y + m.size / 2 >= bb[3]) {
            m.active = false;
            this.meteors.splice(i, 1);
            Sound.playSound("impact", true); // Detonation sound
            
            // Scatter 4 small fire shards upwards
            for (var s = 0; s < 4; s++) {
                var angle = -Math.PI/6 - (s/3) * (Math.PI * 2/3); // Upward cone
                var speed = 90 + Math.random() * 45;
                var shard = new Bullet({
                    x: m.x - 5,
                    y: bb[3] - 15,
                    width: 10,
                    height: 10,
                    speed: 0,
                    damVal: this.damVal - 3,
                    color: "#FF5500",
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    useVelocity: true
                });
                this.bullets.push(shard);
            }
        }
    }

    // 2. Update standard bullets (fire shards)
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        
        if (b.isOutOfBounds(bb)) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

ThanosMeteorRainPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    // 1. Check falling meteors
    for (var i = 0; i < this.meteors.length; i++) {
        var m = this.meteors[i];
        if (rectsOverlap(m.x - m.size/2, m.y - m.size/2, m.size, m.size, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }

    // 2. Check shards
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && b.fadeTick >= 1) {
            if (rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
                return this.damVal - 3;
            }
        }
    }

    return 0;
};

ThanosMeteorRainPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();

    // 1. Draw Falling Meteors (Giant glowing red boulders)
    for (var i = 0; i < this.meteors.length; i++) {
        var m = this.meteors[i];
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.rotation);
        
        ctx.shadowBlur = 18;
        ctx.shadowColor = "#FF3300";
        
        // Outer red-orange glow
        ctx.fillStyle = "#FF5500";
        ctx.beginPath();
        ctx.arc(0, 0, m.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner hot yellow core
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(0, 0, m.size / 3.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    // 2. Draw Fire Shards
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FF3300";
        
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#FF5500";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    ctx.restore();
};

ThanosMeteorRainPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0 && this.meteors.length === 0;
};
