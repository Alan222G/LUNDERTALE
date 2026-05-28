// thanosMindMaze.js — Mind Stone. Telepathic block walls.
// Stationary yellow energy walls subdivide the battle box into quadrants.
// The walls periodically pulse, and the player must stay in safe open quadrants.
// Bouncing yellow thoughts float around.

var ThanosMindMazePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.pulseTimer = 0;
    this.damVal = config.damVal || 10;
    
    this.walls = []; // { x1, y1, x2, y2, width, height, side }
    this.pulseActive = false;
};

ThanosMindMazePattern.prototype = Object.create(BulletPattern.prototype);

ThanosMindMazePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.pulseTimer = 0;
    this.pulseActive = false;
    this.walls = [];

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];
    var midX = bb[0] + bbW / 2;
    var midY = bb[1] + bbH / 2;

    // Define 2 static maze walls forming a cross dividing the box
    this.walls.push({
        x: midX - 8,
        y: bb[1],
        w: 16,
        h: bbH,
        isHorizontal: false
    });
    this.walls.push({
        x: bb[0],
        y: midY - 8,
        w: bbW,
        h: 16,
        isHorizontal: true
    });
};

ThanosMindMazePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    this.pulseTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];

    // Maze Wall Pulsing (activates collision every 1.5 seconds)
    if (this.pulseTimer >= 1.5) {
        this.pulseTimer = 0;
        this.pulseActive = !this.pulseActive;
        if (this.pulseActive) {
            Sound.playSound("impact", true); // Flash/pulse sound
        }
    }

    // Spawn yellow thoughts floating inside the box
    if (this.spawnTimer >= 0.38 && this.elapsed < this.duration - 0.8) {
        this.spawnTimer = 0;
        
        var rx = bb[0] + 12 + Math.random() * (bbW - 24);
        var ry = bb[1] - 10;
        
        var spark = new Bullet({
            x: rx,
            y: ry,
            width: 10,
            height: 10,
            speed: 0,
            damVal: this.damVal - 2,
            color: "#FFD600",
            vx: (Math.random() - 0.5) * 50,
            vy: 90 + Math.random() * 50,
            useVelocity: true
        });
        this.bullets.push(spark);
    }

    // Update bullets
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

ThanosMindMazePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    // 1. Collide with pulsing walls
    if (this.pulseActive) {
        for (var i = 0; i < this.walls.length; i++) {
            var w = this.walls[i];
            if (rectsOverlap(w.x, w.y, w.w, w.h, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }

    // 2. Collide with bouncing thoughts
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && b.fadeTick >= 1) {
            if (rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
                return this.damVal - 2;
            }
        }
    }

    return 0;
};

ThanosMindMazePattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();

    // 1. Draw Maze Grid Walls
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.shadowBlur = this.pulseActive ? 16 : 6;
    ctx.shadowColor = "#FFD700";

    for (var i = 0; i < this.walls.length; i++) {
        var w = this.walls[i];
        
        if (this.pulseActive) {
            var pulseAlpha = 0.5 + Math.sin(this.elapsed * 25) * 0.2;
            ctx.fillStyle = "rgba(255, 215, 0, " + pulseAlpha.toFixed(2) + ")";
            ctx.fillRect(w.x, w.y, w.w, w.h);
            
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(w.x + 2, w.y + 2, w.w - 4, w.h - 4);
        } else {
            ctx.fillStyle = "rgba(255, 215, 0, 0.15)";
            ctx.fillRect(w.x, w.y, w.w, w.h);
            
            ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
            ctx.lineWidth = 1.0;
            ctx.strokeRect(w.x, w.y, w.w, w.h);
        }
    }
    ctx.restore();

    // 2. Draw Bouncing Yellow Thoughts
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FFD700";
        
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#FFD600";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    ctx.restore();
};

ThanosMindMazePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
