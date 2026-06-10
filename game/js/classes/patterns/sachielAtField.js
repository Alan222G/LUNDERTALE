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
    // VFX particles
    this.energyMotes = [];
    this.sparks = [];
    this.ripples = [];
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
            var step = w.speed * dt;
            if (dist <= step) {
                w.exploded = true;
                w.x = w.targetX;
                w.y = w.targetY;
                this.explodeWall(w);
            } else {
                w.x += (dx / dist) * step;
                w.y += (dy / dist) * step;
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

    // --- VFX: Energy motes around active walls ---
    for (var i = 0; i < this.walls.length; i++) {
        var w = this.walls[i];
        if (w.moving && !w.exploded && Math.random() < 0.35) {
            this.energyMotes.push({
                x: w.x + Math.random() * w.w,
                y: w.y + Math.random() * w.h,
                vx: (Math.random() - 0.5) * 30,
                vy: (Math.random() - 0.5) * 30,
                life: 0.6 + Math.random() * 0.6,
                maxLife: 1.2,
                size: 1.5 + Math.random() * 2,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    for (var i = this.energyMotes.length - 1; i >= 0; i--) {
        var m = this.energyMotes[i];
        m.x += m.vx * dt + Math.sin(this.elapsed * 6 + m.phase) * 8 * dt;
        m.y += m.vy * dt + Math.cos(this.elapsed * 5 + m.phase) * 8 * dt;
        m.life -= dt;
        if (m.life <= 0) this.energyMotes.splice(i, 1);
    }

    // --- VFX: Intersection sparks where walls overlap ---
    for (var i = 0; i < this.walls.length; i++) {
        for (var j = i + 1; j < this.walls.length; j++) {
            var a = this.walls[i], b = this.walls[j];
            if (!a.moving || !b.moving || a.exploded || b.exploded) continue;
            // Simple AABB overlap check
            if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
                var ix = Math.max(a.x, b.x) + Math.min(a.x + a.w, b.x + b.w);
                var iy = Math.max(a.y, b.y) + Math.min(a.y + a.h, b.y + b.h);
                ix /= 2; iy /= 2;
                for (var s = 0; s < 2; s++) {
                    this.sparks.push({
                        x: ix + (Math.random() - 0.5) * 6,
                        y: iy + (Math.random() - 0.5) * 6,
                        vx: (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 100,
                        life: 0.25 + Math.random() * 0.2,
                        maxLife: 0.45,
                        size: 1 + Math.random() * 2
                    });
                }
            }
        }
    }
    for (var i = this.sparks.length - 1; i >= 0; i--) {
        var s = this.sparks[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt;
        if (s.life <= 0) this.sparks.splice(i, 1);
    }

    // --- VFX: Ripple rings ---
    for (var i = this.ripples.length - 1; i >= 0; i--) {
        var r = this.ripples[i];
        r.radius += r.speed * dt;
        r.life -= dt;
        if (r.life <= 0) this.ripples.splice(i, 1);
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
    // VFX: Spawn ripple ring on explosion
    this.ripples.push({
        x: cx, y: cy,
        radius: 5,
        speed: 160,
        life: 0.5,
        maxLife: 0.5
    });
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

    // --- VFX: Draw ripple rings from explosions ---
    for (var r = 0; r < this.ripples.length; r++) {
        var rp = this.ripples[r];
        var rAlpha = (rp.life / rp.maxLife);
        ctx.save();
        ctx.globalAlpha = rAlpha * 0.6;
        ctx.strokeStyle = "rgba(255, 80, 120, " + rAlpha.toFixed(2) + ")";
        ctx.lineWidth = 3 * rAlpha;
        ctx.shadowBlur = 15 * rAlpha;
        ctx.shadowColor = "rgba(255, 0, 80, " + (rAlpha * 0.7).toFixed(2) + ")";
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.radius, 0, Math.PI * 2);
        ctx.stroke();
        // Inner dimmer ring
        ctx.globalAlpha = rAlpha * 0.25;
        ctx.strokeStyle = "rgba(255, 200, 220, " + (rAlpha * 0.5).toFixed(2) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    for (var i = 0; i < this.walls.length; i++) {
        var w = this.walls[i];
        if (!w.moving) {
            var wAlpha = (w.warningTimer / w.warningTime);
            var pulse = Math.sin(this.elapsed * 18) * 0.15;
            ctx.globalAlpha = wAlpha * 0.6 + pulse;
            ctx.strokeStyle = "#FF0000";
            ctx.lineWidth = 2;
            ctx.strokeRect(w.x, w.y, w.w, w.h);
            // VFX: Faint inner fill flicker during warning
            ctx.fillStyle = "rgba(255, 0, 40, " + (wAlpha * 0.12 + pulse * 0.15).toFixed(3) + ")";
            ctx.fillRect(w.x, w.y, w.w, w.h);
            ctx.globalAlpha = 1;
        } else {
            ctx.save();
            ctx.shadowBlur = 25;
            ctx.shadowColor = "rgba(255, 0, 50, 0.9)";

            var wallGrad;
            if (w.dir <= 1) wallGrad = ctx.createLinearGradient(w.x, w.y, w.x + w.w, w.y);
            else wallGrad = ctx.createLinearGradient(w.x, w.y, w.x, w.y + w.h);

            var corePulse = 0.85 + Math.sin(this.elapsed * 8) * 0.1;
            wallGrad.addColorStop(0, "rgba(180, 0, 60, " + (0.7 * corePulse).toFixed(2) + ")");
            wallGrad.addColorStop(0.5, "rgba(255, 20, 120, " + (0.9 * corePulse).toFixed(2) + ")");
            wallGrad.addColorStop(1, "rgba(180, 0, 60, " + (0.7 * corePulse).toFixed(2) + ")");
            ctx.fillStyle = wallGrad;
            ctx.fillRect(w.x, w.y, w.w, w.h);

            ctx.shadowBlur = 0;

            // --- VFX: Hexagon shimmer with filled glow + pulsing outer ring ---
            var hexR = 6;
            for (var h = 0; h < w.hexagons.length; h++) {
                var hex = w.hexagons[h];
                var hx = w.x + hex.ox + hexR;
                var hy = w.y + hex.oy + hexR;
                var shimVal = 0.3 + Math.sin(this.elapsed * 5 + hex.shimmer) * 0.4;
                var shimAlpha = shimVal.toFixed(2);

                // Filled hex glow
                ctx.fillStyle = "rgba(255, 50, 150, " + (shimVal * 0.2).toFixed(3) + ")";
                this.drawHexagon(ctx, hx, hy, hexR);
                ctx.fill();

                // Main hex stroke
                ctx.strokeStyle = "rgba(255, 100, 200, " + shimAlpha + ")";
                ctx.lineWidth = 1;
                this.drawHexagon(ctx, hx, hy, hexR);
                ctx.stroke();

                // Pulsing outer ring on high shimmer
                if (shimVal > 0.5) {
                    ctx.strokeStyle = "rgba(255, 180, 255, " + ((shimVal - 0.5) * 0.5).toFixed(3) + ")";
                    ctx.lineWidth = 0.5;
                    this.drawHexagon(ctx, hx, hy, hexR + 2);
                    ctx.stroke();
                }
            }

            // --- VFX: Vibrant glowing leading edge (dual line) ---
            ctx.shadowBlur = 12;
            ctx.shadowColor = "rgba(255, 100, 150, 0.9)";
            ctx.strokeStyle = "rgba(255, 50, 50, 0.95)";
            ctx.lineWidth = 2.5;
            if (w.dir === 0) { ctx.beginPath(); ctx.moveTo(w.x + w.w, w.y); ctx.lineTo(w.x + w.w, w.y + w.h); ctx.stroke(); }
            else if (w.dir === 1) { ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(w.x, w.y + w.h); ctx.stroke(); }
            else if (w.dir === 2) { ctx.beginPath(); ctx.moveTo(w.x, w.y + w.h); ctx.lineTo(w.x + w.w, w.y + w.h); ctx.stroke(); }
            else { ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(w.x + w.w, w.y); ctx.stroke(); }
            // Brighter inner edge line
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "rgba(255, 200, 220, 0.6)";
            ctx.lineWidth = 1;
            if (w.dir === 0) { ctx.beginPath(); ctx.moveTo(w.x + w.w, w.y); ctx.lineTo(w.x + w.w, w.y + w.h); ctx.stroke(); }
            else if (w.dir === 1) { ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(w.x, w.y + w.h); ctx.stroke(); }
            else if (w.dir === 2) { ctx.beginPath(); ctx.moveTo(w.x, w.y + w.h); ctx.lineTo(w.x + w.w, w.y + w.h); ctx.stroke(); }
            else { ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(w.x + w.w, w.y); ctx.stroke(); }
            ctx.restore();
        }
    }

    // --- VFX: Draw energy motes ---
    for (var i = 0; i < this.energyMotes.length; i++) {
        var m = this.energyMotes[i];
        var mAlpha = Math.min(1, m.life / m.maxLife * 2);
        var flicker = 0.7 + Math.sin(this.elapsed * 14 + m.phase) * 0.3;
        ctx.save();
        ctx.globalAlpha = mAlpha * flicker;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(255, 120, 200, 0.8)";
        ctx.fillStyle = "rgba(255, 180, 230, " + (mAlpha * 0.9).toFixed(2) + ")";
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size * mAlpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // --- VFX: Draw intersection sparks ---
    for (var i = 0; i < this.sparks.length; i++) {
        var sp = this.sparks[i];
        var spAlpha = sp.life / sp.maxLife;
        ctx.save();
        ctx.globalAlpha = spAlpha;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(255, 255, 150, 0.9)";
        ctx.fillStyle = "rgba(255, 255, 200, " + spAlpha.toFixed(2) + ")";
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size * spAlpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // --- Draw fragments with motion trail ---
    for (var i = 0; i < this.fragments.length; i++) {
        var f = this.fragments[i];
        var fAlpha = Math.min(1, f.life / f.maxLife * 1.5).toFixed(2);
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.globalAlpha = parseFloat(fAlpha);

        // VFX: Motion trail (draw dimmer hex behind)
        ctx.save();
        ctx.globalAlpha = parseFloat(fAlpha) * 0.2;
        ctx.translate(-f.vx * 0.025, -f.vy * 0.025);
        ctx.fillStyle = "rgba(255, 50, 100, 0.4)";
        this.drawHexagon(ctx, 0, 0, f.size * 0.9);
        ctx.fill();
        ctx.restore();

        ctx.shadowBlur = 14;
        ctx.shadowColor = "rgba(255, 0, 50, 0.9)";

        ctx.fillStyle = "rgba(200, 0, 50, " + fAlpha + ")";
        this.drawHexagon(ctx, 0, 0, f.size);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 100, 150, " + (parseFloat(fAlpha) * 0.8).toFixed(2) + ")";
        ctx.lineWidth = 1.5;
        this.drawHexagon(ctx, 0, 0, f.size);
        ctx.stroke();

        // VFX: Bright inner core
        ctx.fillStyle = "rgba(255, 180, 200, " + (parseFloat(fAlpha) * 0.3).toFixed(2) + ")";
        this.drawHexagon(ctx, 0, 0, f.size * 0.4);
        ctx.fill();
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
