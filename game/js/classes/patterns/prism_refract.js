// prism_refract.js — Ramiel Phase 1 Exclusive: light beams refract off prism nodes
var PrismRefractPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 7;
    this.beams = [];
    this.prisms = [];
    this.battleBox = null;
    this.beamTimer = 0;
    this.beamInterval = 1.2;
};
PrismRefractPattern.prototype = Object.create(BulletPattern.prototype);

PrismRefractPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.beams = [];
    this.prisms = [];
    this.beamTimer = 0.8;
    var bb = Cbbox.getBound();
    // Place 4 prism nodes inside the box
    for (var i = 0; i < 4; i++) {
        this.prisms.push({
            x: bb[0] + 30 + Math.random() * (bb[2] - bb[0] - 60),
            y: bb[1] + 30 + Math.random() * (bb[3] - bb[1] - 60),
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 2
        });
    }
};

PrismRefractPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.beamTimer += dt;
    // Rotate prisms
    for (var i = 0; i < this.prisms.length; i++) {
        this.prisms[i].rot += this.prisms[i].rotSpeed * dt;
    }
    // Spawn beams that bounce between prisms
    if (this.beamTimer >= this.beamInterval && this.elapsed < this.duration - 1.5) {
        this.beamTimer = 0;
        var bb = Cbbox.getBound();
        // Pick entry edge
        var side = Math.floor(Math.random() * 4);
        var sx, sy, angle;
        if (side === 0) { sx = bb[0]; sy = bb[1] + Math.random() * (bb[3] - bb[1]); angle = 0; }
        else if (side === 1) { sx = bb[2]; sy = bb[1] + Math.random() * (bb[3] - bb[1]); angle = Math.PI; }
        else if (side === 2) { sx = bb[0] + Math.random() * (bb[2] - bb[0]); sy = bb[1]; angle = Math.PI / 2; }
        else { sx = bb[0] + Math.random() * (bb[2] - bb[0]); sy = bb[3]; angle = -Math.PI / 2; }
        
        // Create beam segments bouncing through prisms
        var segments = [];
        var cx = sx, cy = sy, cAngle = angle;
        segments.push({ x1: cx, y1: cy, x2: cx, y2: cy, progress: 0 });
        var speed = 200;
        var unvisited = this.prisms.slice();
        unvisited.sort(function() { return Math.random() - 0.5; }); // Shuffle
        
        for (var b = 0; b < unvisited.length; b++) {
            var bestP = unvisited[b];
            segments.push({
                x1: cx, y1: cy, x2: bestP.x, y2: bestP.y,
                progress: 0, delay: b * 0.2, speed: speed
            });
            cx = bestP.x; cy = bestP.y;
            cAngle += Math.PI / 3 + Math.random() * Math.PI / 3;
        }
        // Final segment exits
        var exitDist = 150;
        segments.push({
            x1: cx, y1: cy,
            x2: cx + Math.cos(cAngle) * exitDist,
            y2: cy + Math.sin(cAngle) * exitDist,
            progress: 0, delay: segments.length * 0.2, speed: speed
        });
        this.beams.push({ segments: segments, life: 2.0, maxLife: 2.0, elapsed: 0 });
    }
    // Update beams
    for (var i = this.beams.length - 1; i >= 0; i--) {
        var b = this.beams[i];
        b.elapsed += dt;
        b.life -= dt;
        for (var s = 0; s < b.segments.length; s++) {
            var seg = b.segments[s];
            if (b.elapsed > (seg.delay || 0)) {
                seg.progress = Math.min(1, seg.progress + dt * 3);
            }
        }
        if (b.life <= 0) this.beams.splice(i, 1);
    }
};

PrismRefractPattern.prototype.draw = function(ctx) {
    ctx.save();
    // Draw prisms
    for (var i = 0; i < this.prisms.length; i++) {
        var p = this.prisms[i];
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        // Triangular prism
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(100, 200, 255, 0.6)";
        var pGrad = ctx.createLinearGradient(-10, -10, 10, 10);
        pGrad.addColorStop(0, "rgba(40, 80, 200, 0.7)");
        pGrad.addColorStop(0.5, "rgba(80, 180, 255, 0.85)");
        pGrad.addColorStop(1, "rgba(40, 80, 200, 0.7)");
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(10, 8);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(180, 230, 255, 0.7)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
    }
    // Draw beam segments
    for (var i = 0; i < this.beams.length; i++) {
        var b = this.beams[i];
        var bAlpha = Math.min(1, b.life / b.maxLife * 2).toFixed(2);
        for (var s = 0; s < b.segments.length; s++) {
            var seg = b.segments[s];
            if (seg.progress <= 0) continue;
            var ex = seg.x1 + (seg.x2 - seg.x1) * seg.progress;
            var ey = seg.y1 + (seg.y2 - seg.y1) * seg.progress;
            // Beam glow
            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(80, 180, 255, 0.5)";
            ctx.strokeStyle = "rgba(100, 200, 255, " + bAlpha + ")";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            // Bright core
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "rgba(220, 240, 255, " + (bAlpha * 0.8).toFixed(2) + ")";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(ex, ey);
            ctx.stroke();
        }
    }
    ctx.restore();
};

PrismRefractPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2, cy = sy + sh / 2;
    for (var i = 0; i < this.beams.length; i++) {
        var b = this.beams[i];
        for (var s = 0; s < b.segments.length; s++) {
            var seg = b.segments[s];
            if (seg.progress < 0.1) continue;
            var ex = seg.x1 + (seg.x2 - seg.x1) * seg.progress;
            var ey = seg.y1 + (seg.y2 - seg.y1) * seg.progress;
            // Point-to-line-segment distance
            var dx = ex - seg.x1, dy = ey - seg.y1;
            var len = Math.sqrt(dx * dx + dy * dy);
            if (len < 1) continue;
            var t = Math.max(0, Math.min(1, ((cx - seg.x1) * dx + (cy - seg.y1) * dy) / (len * len)));
            var px = seg.x1 + t * dx, py = seg.y1 + t * dy;
            var dist = Math.sqrt((cx - px) * (cx - px) + (cy - py) * (cy - py));
            if (dist < sw / 2 + 4) return this.damVal;
        }
    }
    return 0;
};

PrismRefractPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.beams.length === 0;
};
