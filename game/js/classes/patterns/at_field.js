// at_field.js — Ramiel's A.T. Field: hexagonal barriers that compress and explode
var ATFieldPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.walls = [];
    this.fragments = [];
    this.waveCount = 0;
    this.maxWaves = 4;
    this.waveTimer = 0;
    this.waveInterval = 1.7;
    this.battleBox = null;
};

ATFieldPattern.prototype = Object.create(BulletPattern.prototype);

ATFieldPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.walls = [];
    this.fragments = [];
    this.waveCount = 0;
    this.waveTimer = 0;
    this.spawnWave();
};

ATFieldPattern.prototype.spawnWave = function() {
    if (this.waveCount >= this.maxWaves) return;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    var bw = bb[2] - bb[0];
    var bh = bb[3] - bb[1];

    // Directions: 0=left, 1=right, 2=top, 3=bottom
    var dirs = [];
    if (this.waveCount === 0) dirs = [0, 1];           // Left+Right crush
    else if (this.waveCount === 1) dirs = [2, 3];       // Top+Bottom crush
    else dirs = [0, 1, 2, 3];                           // All four sides

    for (var d = 0; d < dirs.length; d++) {
        var dir = dirs[d];
        var wall = {
            dir: dir,
            warningTime: 0.8,
            warningTimer: 0,
            moving: false,
            exploded: false,
            speed: 100 + this.waveCount * 20,
            hexagons: [],
            // Position
            x: 0, y: 0, w: 0, h: 0,
            targetX: 0, targetY: 0
        };

        // Set starting position and size based on direction
        if (dir === 0) { // Left wall moving right
            wall.x = bb[0]; wall.y = bb[1]; wall.w = 16; wall.h = bh;
            wall.targetX = cx - 51; wall.targetY = bb[1];
        } else if (dir === 1) { // Right wall moving left
            wall.x = bb[2] - 16; wall.y = bb[1]; wall.w = 16; wall.h = bh;
            wall.targetX = cx + 35; wall.targetY = bb[1];
        } else if (dir === 2) { // Top wall moving down
            wall.x = bb[0]; wall.y = bb[1]; wall.w = bw; wall.h = 16;
            wall.targetX = bb[0]; wall.targetY = cy - 51;
        } else { // Bottom wall moving up
            wall.x = bb[0]; wall.y = bb[3] - 16; wall.w = bw; wall.h = 16;
            wall.targetX = bb[0]; wall.targetY = cy + 35;
        }

        // Generate hexagon positions on the wall
        var hexSize = 12;
        if (dir <= 1) { // vertical wall
            for (var hy = 0; hy < Math.ceil(bh / hexSize); hy++) {
                wall.hexagons.push({
                    ox: 0, oy: hy * hexSize,
                    shimmer: Math.random() * Math.PI * 2
                });
            }
        } else { // horizontal wall
            for (var hx = 0; hx < Math.ceil(bw / hexSize); hx++) {
                wall.hexagons.push({
                    ox: hx * hexSize, oy: 0,
                    shimmer: Math.random() * Math.PI * 2
                });
            }
        }

        this.walls.push(wall);
    }
    this.waveCount++;
};

ATFieldPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.waveTimer += dt;

    // Spawn new waves
    if (this.waveTimer >= this.waveInterval && this.waveCount < this.maxWaves && this.elapsed < this.duration - 2) {
        this.waveTimer = 0;
        this.spawnWave();
    }

    // Update walls
    for (var i = this.walls.length - 1; i >= 0; i--) {
        var w = this.walls[i];
        if (!w.moving) {
            w.warningTimer += dt;
            if (w.warningTimer >= w.warningTime) {
                w.moving = true;
            }
        } else if (!w.exploded) {
            // Move toward center
            var dx = w.targetX - w.x;
            var dy = w.targetY - w.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 3) {
                // Reached target — explode
                w.exploded = true;
                this.explodeWall(w);
            } else {
                w.x += (dx / dist) * w.speed * dt;
                w.y += (dy / dist) * w.speed * dt;
            }
        }

        // Remove exploded walls after a moment
        if (w.exploded) {
            this.walls.splice(i, 1);
        }
    }

    // Update fragments
    for (var i = this.fragments.length - 1; i >= 0; i--) {
        var f = this.fragments[i];
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.life -= dt;
        f.rot += f.rotSpeed * dt;
        if (f.life <= 0) this.fragments.splice(i, 1);
    }
};

ATFieldPattern.prototype.explodeWall = function(wall) {
    var cx = wall.x + wall.w / 2;
    var cy = wall.y + wall.h / 2;
    var numFrags = 12;
    for (var i = 0; i < numFrags; i++) {
        var angle = (i / numFrags) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        var speed = 80 + Math.random() * 120;
        this.fragments.push({
            x: cx + (Math.random() - 0.5) * wall.w,
            y: cy + (Math.random() - 0.5) * wall.h,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 5 + Math.random() * 6,
            life: 1.5 + Math.random() * 0.5,
            maxLife: 2.0,
            rot: Math.random() * Math.PI,
            rotSpeed: (Math.random() - 0.5) * 8,
            damaging: true
        });
    }
};

ATFieldPattern.prototype.drawHexagon = function(ctx, cx, cy, radius) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
        var angle = (Math.PI / 3) * i - Math.PI / 6;
        var x = cx + radius * Math.cos(angle);
        var y = cy + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
};

ATFieldPattern.prototype.draw = function(ctx) {
    ctx.save();

    // Draw walls
    for (var i = 0; i < this.walls.length; i++) {
        var w = this.walls[i];

        if (!w.moving) {
            // Warning phase: pulsing orange outline
            var wAlpha = (w.warningTimer / w.warningTime);
            var pulse = Math.sin(this.elapsed * 18) * 0.15;
            ctx.globalAlpha = wAlpha * 0.6 + pulse;
            ctx.strokeStyle = "#FF8800";
            ctx.lineWidth = 2;
            ctx.strokeRect(w.x, w.y, w.w, w.h);
            ctx.globalAlpha = 1;
        } else {
            // Active wall: hexagonal barrier with golden glow
            ctx.save();

            // Outer glow
            ctx.shadowBlur = 20;
            ctx.shadowColor = "rgba(255, 180, 0, 0.8)";

            // Wall body (semi-transparent orange)
            var wallGrad;
            if (w.dir <= 1) {
                wallGrad = ctx.createLinearGradient(w.x, w.y, w.x + w.w, w.y);
            } else {
                wallGrad = ctx.createLinearGradient(w.x, w.y, w.x, w.y + w.h);
            }
            wallGrad.addColorStop(0, "rgba(255, 160, 0, 0.7)");
            wallGrad.addColorStop(0.5, "rgba(255, 200, 50, 0.85)");
            wallGrad.addColorStop(1, "rgba(255, 160, 0, 0.7)");
            ctx.fillStyle = wallGrad;
            ctx.fillRect(w.x, w.y, w.w, w.h);

            // Draw hexagonal pattern overlay
            ctx.shadowBlur = 0;
            var hexR = 6;
            for (var h = 0; h < w.hexagons.length; h++) {
                var hex = w.hexagons[h];
                var hx = w.x + hex.ox + hexR;
                var hy = w.y + hex.oy + hexR;
                var shimAlpha = (0.3 + Math.sin(this.elapsed * 4 + hex.shimmer) * 0.2).toFixed(2);

                ctx.strokeStyle = "rgba(255, 240, 150, " + shimAlpha + ")";
                ctx.lineWidth = 1;
                this.drawHexagon(ctx, hx, hy, hexR);
                ctx.stroke();
            }

            // Bright edge line
            ctx.strokeStyle = "rgba(255, 255, 200, 0.9)";
            ctx.lineWidth = 2;
            if (w.dir === 0) {
                ctx.beginPath(); ctx.moveTo(w.x + w.w, w.y); ctx.lineTo(w.x + w.w, w.y + w.h); ctx.stroke();
            } else if (w.dir === 1) {
                ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(w.x, w.y + w.h); ctx.stroke();
            } else if (w.dir === 2) {
                ctx.beginPath(); ctx.moveTo(w.x, w.y + w.h); ctx.lineTo(w.x + w.w, w.y + w.h); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(w.x + w.w, w.y); ctx.stroke();
            }

            ctx.restore();
        }
    }

    // Draw fragments (hexagonal shards)
    for (var i = 0; i < this.fragments.length; i++) {
        var f = this.fragments[i];
        var fAlpha = Math.min(1, f.life / f.maxLife * 1.5).toFixed(2);

        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.globalAlpha = parseFloat(fAlpha);

        // Fragment glow
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(255, 180, 0, 0.6)";

        // Hexagonal shard
        ctx.fillStyle = "rgba(255, 200, 50, " + fAlpha + ")";
        this.drawHexagon(ctx, 0, 0, f.size);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 255, 200, " + (parseFloat(fAlpha) * 0.8).toFixed(2) + ")";
        ctx.lineWidth = 1;
        this.drawHexagon(ctx, 0, 0, f.size);
        ctx.stroke();

        ctx.restore();
    }

    ctx.restore();
};

ATFieldPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var soulCX = sx + sw / 2;
    var soulCY = sy + sh / 2;

    // Check wall collision
    for (var i = 0; i < this.walls.length; i++) {
        var w = this.walls[i];
        if (!w.moving || w.exploded) continue;
        if (soulCX + sw / 2 > w.x && soulCX - sw / 2 < w.x + w.w &&
            soulCY + sh / 2 > w.y && soulCY - sh / 2 < w.y + w.h) {
            return this.damVal;
        }
    }

    // Check fragment collision
    for (var i = 0; i < this.fragments.length; i++) {
        var f = this.fragments[i];
        if (!f.damaging) continue;
        var dx = soulCX - f.x;
        var dy = soulCY - f.y;
        if (Math.sqrt(dx * dx + dy * dy) < f.size + sw / 2) {
            f.damaging = false; // Only hit once
            return this.damVal;
        }
    }

    return 0;
};

ATFieldPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.walls.length === 0 && this.fragments.length === 0;
};
