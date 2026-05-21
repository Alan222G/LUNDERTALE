// sachielAtField.js - Sachiel's corrupted red AT Field barriers
var SachielAtFieldPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 10;
    this.walls = [];
    this.fragments = [];
    this.waveCount = 0;
    this.maxWaves = 4;
    this.waveTimer = 0;
    this.waveInterval = 1.7;
};

SachielAtFieldPattern.prototype = Object.create(BulletPattern.prototype);

SachielAtFieldPattern.prototype.spawnWave = function() {
    if (this.waveCount >= this.maxWaves) return;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    var bw = bb[2] - bb[0];
    var bh = bb[3] - bb[1];

    var dirs = [];
    if (this.waveCount === 0) dirs = [0, 1]; // Left+Right
    else if (this.waveCount === 1) dirs = [2, 3]; // Top+Bottom
    else dirs = [0, 1, 2, 3]; // All four

    for (var d = 0; d < dirs.length; d++) {
        var dir = dirs[d];
        var wall = {
            dir: dir,
            warningTime: 0.8,
            warningTimer: 0,
            moving: false,
            exploded: false,
            speed: 120 + this.waveCount * 25,
            hexagons: [],
            x: 0, y: 0, w: 0, h: 0,
            targetX: 0, targetY: 0
        };

        if (dir === 0) { // Left
            wall.x = bb[0]; wall.y = bb[1]; wall.w = 16; wall.h = bh;
            wall.targetX = cx - 40; wall.targetY = bb[1];
        } else if (dir === 1) { // Right
            wall.x = bb[2] - 16; wall.y = bb[1]; wall.w = 16; wall.h = bh;
            wall.targetX = cx + 24; wall.targetY = bb[1];
        } else if (dir === 2) { // Top
            wall.x = bb[0]; wall.y = bb[1]; wall.w = bw; wall.h = 16;
            wall.targetX = bb[0]; wall.targetY = cy - 40;
        } else { // Bottom
            wall.x = bb[0]; wall.y = bb[3] - 16; wall.w = bw; wall.h = 16;
            wall.targetX = bb[0]; wall.targetY = cy + 24;
        }

        var hexSize = 12;
        if (dir <= 1) { 
            for (var hy = 0; hy < Math.ceil(bh / hexSize); hy++) {
                wall.hexagons.push({ ox: 0, oy: hy * hexSize, shimmer: Math.random() * Math.PI * 2 });
            }
        } else { 
            for (var hx = 0; hx < Math.ceil(bw / hexSize); hx++) {
                wall.hexagons.push({ ox: hx * hexSize, oy: 0, shimmer: Math.random() * Math.PI * 2 });
            }
        }

        this.walls.push(wall);
    }
    this.waveCount++;
};

SachielAtFieldPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.waveTimer += dt;

    if (this.waveTimer >= this.waveInterval && this.waveCount < this.maxWaves && this.elapsed < this.duration - 2) {
        this.waveTimer = 0;
        this.spawnWave();
    }

    for (var i = this.walls.length - 1; i >= 0; i--) {
        var w = this.walls[i];
        if (!w.moving) {
            w.warningTimer += dt;
            if (w.warningTimer >= w.warningTime) {
                w.moving = true;
            }
        } else if (!w.exploded) {
            var dx = w.targetX - w.x;
            var dy = w.targetY - w.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 3) {
                w.exploded = true;
                this.explodeWall(w);
            } else {
                w.x += (dx / dist) * w.speed * dt;
                w.y += (dy / dist) * w.speed * dt;
            }
        }
        if (w.exploded) this.walls.splice(i, 1);
    }

    var bb = Cbbox.getBound();
    for (var i = this.fragments.length - 1; i >= 0; i--) {
        var f = this.fragments[i];
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.life -= dt;
        f.rot += f.rotSpeed * dt;
        if (f.x - f.size < bb[0]) { f.x = bb[0] + f.size; f.vx = Math.abs(f.vx) * 0.6; }
        if (f.x + f.size > bb[2]) { f.x = bb[2] - f.size; f.vx = -Math.abs(f.vx) * 0.6; }
        if (f.y - f.size < bb[1]) { f.y = bb[1] + f.size; f.vy = Math.abs(f.vy) * 0.6; }
        if (f.y + f.size > bb[3]) { f.y = bb[3] - f.size; f.vy = -Math.abs(f.vy) * 0.6; }
        if (f.life <= 0) this.fragments.splice(i, 1);
    }
};

SachielAtFieldPattern.prototype.explodeWall = function(wall) {
    var cx = wall.x + wall.w / 2;
    var cy = wall.y + wall.h / 2;
    var bb = Cbbox.getBound();
    for (var i = 0; i < 10; i++) {
        var angle = (i / 10) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        var speed = 60 + Math.random() * 60;
        var fx = cx + (Math.random() - 0.5) * wall.w;
        var fy = cy + (Math.random() - 0.5) * wall.h;
        fx = Math.max(bb[0] + 5, Math.min(bb[2] - 5, fx));
        fy = Math.max(bb[1] + 5, Math.min(bb[3] - 5, fy));
        this.fragments.push({
            x: fx, y: fy,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            size: 5 + Math.random() * 5,
            life: 1.0 + Math.random() * 0.5,
            maxLife: 1.5,
            rot: Math.random() * Math.PI,
            rotSpeed: (Math.random() - 0.5) * 10,
            damaging: true
        });
    }
};

SachielAtFieldPattern.prototype.drawHexagon = function(ctx, cx, cy, radius) {
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

SachielAtFieldPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.walls.length; i++) {
        var w = this.walls[i];
        if (!w.moving) {
            var wAlpha = (w.warningTimer / w.warningTime);
            var pulse = Math.sin(this.elapsed * 18) * 0.15;
            ctx.globalAlpha = wAlpha * 0.6 + pulse;
            ctx.strokeStyle = "#FF0000"; // Deep red warning
            ctx.lineWidth = 2;
            ctx.strokeRect(w.x, w.y, w.w, w.h);
            ctx.globalAlpha = 1;
        } else {
            ctx.save();
            ctx.shadowBlur = 20;
            ctx.shadowColor = "rgba(255, 0, 50, 0.8)"; // Red shadow

            var wallGrad;
            if (w.dir <= 1) wallGrad = ctx.createLinearGradient(w.x, w.y, w.x + w.w, w.y);
            else wallGrad = ctx.createLinearGradient(w.x, w.y, w.x, w.y + w.h);
            
            wallGrad.addColorStop(0, "rgba(150, 0, 50, 0.7)");
            wallGrad.addColorStop(0.5, "rgba(255, 0, 100, 0.85)");
            wallGrad.addColorStop(1, "rgba(150, 0, 50, 0.7)");
            ctx.fillStyle = wallGrad;
            ctx.fillRect(w.x, w.y, w.w, w.h);

            ctx.shadowBlur = 0;
            var hexR = 6;
            for (var h = 0; h < w.hexagons.length; h++) {
                var hex = w.hexagons[h];
                var hx = w.x + hex.ox + hexR;
                var hy = w.y + hex.oy + hexR;
                var shimAlpha = (0.3 + Math.sin(this.elapsed * 5 + hex.shimmer) * 0.4).toFixed(2);

                ctx.strokeStyle = "rgba(255, 100, 200, " + shimAlpha + ")"; // Pinkish corrupted lines
                ctx.lineWidth = 1;
                this.drawHexagon(ctx, hx, hy, hexR);
                ctx.stroke();
            }

            ctx.strokeStyle = "rgba(255, 50, 50, 0.9)";
            ctx.lineWidth = 2;
            if (w.dir === 0) { ctx.beginPath(); ctx.moveTo(w.x + w.w, w.y); ctx.lineTo(w.x + w.w, w.y + w.h); ctx.stroke(); }
            else if (w.dir === 1) { ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(w.x, w.y + w.h); ctx.stroke(); }
            else if (w.dir === 2) { ctx.beginPath(); ctx.moveTo(w.x, w.y + w.h); ctx.lineTo(w.x + w.w, w.y + w.h); ctx.stroke(); }
            else { ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(w.x + w.w, w.y); ctx.stroke(); }
            ctx.restore();
        }
    }

    for (var i = 0; i < this.fragments.length; i++) {
        var f = this.fragments[i];
        var fAlpha = Math.min(1, f.life / f.maxLife * 1.5).toFixed(2);
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.globalAlpha = parseFloat(fAlpha);
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(255, 0, 50, 0.8)";
        
        ctx.fillStyle = "rgba(200, 0, 50, " + fAlpha + ")";
        this.drawHexagon(ctx, 0, 0, f.size);
        ctx.fill();
        
        ctx.strokeStyle = "rgba(255, 100, 150, " + (parseFloat(fAlpha) * 0.8).toFixed(2) + ")";
        ctx.lineWidth = 1.5;
        this.drawHexagon(ctx, 0, 0, f.size);
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
};

SachielAtFieldPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var soulCX = sx + sw / 2;
    var soulCY = sy + sh / 2;

    for (var i = 0; i < this.walls.length; i++) {
        var w = this.walls[i];
        if (!w.moving || w.exploded) continue;
        if (soulCX + sw / 2 > w.x && soulCX - sw / 2 < w.x + w.w &&
            soulCY + sh / 2 > w.y && soulCY - sh / 2 < w.y + w.h) {
            return this.damVal;
        }
    }
    for (var i = 0; i < this.fragments.length; i++) {
        var f = this.fragments[i];
        if (!f.damaging) continue;
        var dx = soulCX - f.x;
        var dy = soulCY - f.y;
        if (Math.sqrt(dx * dx + dy * dy) < f.size + sw / 2) {
            f.damaging = false; 
            return this.damVal;
        }
    }
    return 0;
};

SachielAtFieldPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.walls.length === 0 && this.fragments.length === 0;
};
