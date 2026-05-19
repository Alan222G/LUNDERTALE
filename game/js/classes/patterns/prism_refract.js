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
    this.prismsPlaced = false;
    this.MARGIN = 50;
};
PrismRefractPattern.prototype = Object.create(BulletPattern.prototype);

PrismRefractPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.beams = [];
    this.prisms = [];
    this.beamTimer = 0.8;
    this.prismsPlaced = false;
    // Do NOT place prisms here — the box may still be animating.
};

// Clamp a value between min and max
PrismRefractPattern.prototype._clamp = function(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
};

// Place the 4 prisms inside the LIVE bounding box with MARGIN inset
PrismRefractPattern.prototype._placePrisms = function() {
    var bb = Cbbox.getBound(); // [left, top, right, bottom]
    var m = this.MARGIN;
    var innerL = bb[0] + m;
    var innerT = bb[1] + m;
    var innerR = bb[2] - m;
    var innerB = bb[3] - m;

    // Safety: if the box is too small for margins, fall back to center
    if (innerR <= innerL || innerB <= innerT) {
        var cx = (bb[0] + bb[2]) / 2;
        var cy = (bb[1] + bb[3]) / 2;
        for (var i = 0; i < 4; i++) {
            this.prisms.push({
                x: cx + (Math.random() - 0.5) * 10,
                y: cy + (Math.random() - 0.5) * 10,
                rot: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 2
            });
        }
    } else {
        for (var i = 0; i < 4; i++) {
            this.prisms.push({
                x: innerL + Math.random() * (innerR - innerL),
                y: innerT + Math.random() * (innerB - innerT),
                rot: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 2
            });
        }
    }
    this.prismsPlaced = true;
};

// Clamp every prism position inside the live box each frame
PrismRefractPattern.prototype._clampPrisms = function() {
    var bb = Cbbox.getBound();
    var m = this.MARGIN;
    var innerL = bb[0] + m;
    var innerT = bb[1] + m;
    var innerR = bb[2] - m;
    var innerB = bb[3] - m;

    // If box shrunk below margin, use tight bounds
    if (innerR <= innerL) { innerL = bb[0] + 2; innerR = bb[2] - 2; }
    if (innerB <= innerT) { innerT = bb[1] + 2; innerB = bb[3] - 2; }

    for (var i = 0; i < this.prisms.length; i++) {
        this.prisms[i].x = this._clamp(this.prisms[i].x, innerL, innerR);
        this.prisms[i].y = this._clamp(this.prisms[i].y, innerT, innerB);
    }
};

// Given a ray from (ox,oy) in direction (dx,dy), find the intersection point
// on the bounding box edges. Returns {x, y}.
PrismRefractPattern.prototype._rayToBoxEdge = function(ox, oy, dx, dy, bb) {
    // bb = [left, top, right, bottom]
    var tMin = Infinity;
    var hitX = ox, hitY = oy;

    // Check all 4 edges
    // Left edge: x = bb[0]
    if (dx !== 0) {
        var t = (bb[0] - ox) / dx;
        if (t > 0) {
            var yHit = oy + t * dy;
            if (yHit >= bb[1] && yHit <= bb[3] && t < tMin) {
                tMin = t; hitX = bb[0]; hitY = yHit;
            }
        }
    }
    // Right edge: x = bb[2]
    if (dx !== 0) {
        var t = (bb[2] - ox) / dx;
        if (t > 0) {
            var yHit = oy + t * dy;
            if (yHit >= bb[1] && yHit <= bb[3] && t < tMin) {
                tMin = t; hitX = bb[2]; hitY = yHit;
            }
        }
    }
    // Top edge: y = bb[1]
    if (dy !== 0) {
        var t = (bb[1] - oy) / dy;
        if (t > 0) {
            var xHit = ox + t * dx;
            if (xHit >= bb[0] && xHit <= bb[2] && t < tMin) {
                tMin = t; hitX = xHit; hitY = bb[1];
            }
        }
    }
    // Bottom edge: y = bb[3]
    if (dy !== 0) {
        var t = (bb[3] - oy) / dy;
        if (t > 0) {
            var xHit = ox + t * dx;
            if (xHit >= bb[0] && xHit <= bb[2] && t < tMin) {
                tMin = t; hitX = xHit; hitY = bb[3];
            }
        }
    }
    return { x: hitX, y: hitY };
};

// Clamp a point to be inside the bounding box
PrismRefractPattern.prototype._clampPoint = function(x, y, bb) {
    return {
        x: this._clamp(x, bb[0], bb[2]),
        y: this._clamp(y, bb[1], bb[3])
    };
};

PrismRefractPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.beamTimer += dt;

    // On first frame, place prisms using LIVE bounds
    if (!this.prismsPlaced) {
        this._placePrisms();
    }

    // Every frame: clamp prisms inside box
    this._clampPrisms();

    // Rotate prisms
    for (var i = 0; i < this.prisms.length; i++) {
        this.prisms[i].rot += this.prisms[i].rotSpeed * dt;
    }

    // Spawn beams that bounce between prisms
    if (this.beamTimer >= this.beamInterval && this.elapsed < this.duration - 1.5 && this.prisms.length > 0) {
        this.beamTimer = 0;
        var bb = Cbbox.getBound();

        // Pick random entry edge and compute entry point ON the box edge
        var side = Math.floor(Math.random() * 4);
        var sx, sy;
        if (side === 0) {
            // Left edge
            sx = bb[0];
            sy = bb[1] + Math.random() * (bb[3] - bb[1]);
        } else if (side === 1) {
            // Right edge
            sx = bb[2];
            sy = bb[1] + Math.random() * (bb[3] - bb[1]);
        } else if (side === 2) {
            // Top edge
            sx = bb[0] + Math.random() * (bb[2] - bb[0]);
            sy = bb[1];
        } else {
            // Bottom edge
            sx = bb[0] + Math.random() * (bb[2] - bb[0]);
            sy = bb[3];
        }

        // Build segments through all 4 prisms in shuffled order
        var segments = [];
        var cx = sx, cy = sy;
        var speed = 200;

        // Shuffle prism visit order
        var order = [];
        for (var i = 0; i < this.prisms.length; i++) order.push(i);
        for (var i = order.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
        }

        // Entry point -> first prism, then prism -> prism
        for (var b = 0; b < order.length; b++) {
            var p = this.prisms[order[b]];
            // Clamp target prism position inside box (redundant safety)
            var target = this._clampPoint(p.x, p.y, bb);
            segments.push({
                x1: cx, y1: cy,
                x2: target.x, y2: target.y,
                progress: 0, delay: b * 0.2, speed: speed
            });
            cx = target.x;
            cy = target.y;
        }

        // Final segment: exits to a box edge
        // Pick random outgoing angle and find where it hits the box edge
        var exitAngle = Math.random() * Math.PI * 2;
        var edx = Math.cos(exitAngle);
        var edy = Math.sin(exitAngle);
        var exitPt = this._rayToBoxEdge(cx, cy, edx, edy, bb);
        segments.push({
            x1: cx, y1: cy,
            x2: exitPt.x, y2: exitPt.y,
            progress: 0, delay: order.length * 0.2, speed: speed
        });

        this.beams.push({ segments: segments, life: 2.0, maxLife: 2.0, elapsed: 0 });
    }

    // Update beam segment animations
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

    // Clip drawing to the battle box so NOTHING renders outside
    var bb = Cbbox.getBound();
    ctx.beginPath();
    ctx.rect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
    ctx.clip();

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
            // Clamp drawn endpoints inside box
            var p1 = this._clampPoint(seg.x1, seg.y1, bb);
            var p2 = this._clampPoint(ex, ey, bb);
            // Beam glow
            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(80, 180, 255, 0.5)";
            ctx.strokeStyle = "rgba(100, 200, 255, " + bAlpha + ")";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            // Bright core
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "rgba(220, 240, 255, " + (bAlpha * 0.8).toFixed(2) + ")";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
    }
    ctx.restore();
};

PrismRefractPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2, cy = sy + sh / 2;
    var bb = Cbbox.getBound();
    for (var i = 0; i < this.beams.length; i++) {
        var b = this.beams[i];
        for (var s = 0; s < b.segments.length; s++) {
            var seg = b.segments[s];
            if (seg.progress < 0.1) continue;
            var ex = seg.x1 + (seg.x2 - seg.x1) * seg.progress;
            var ey = seg.y1 + (seg.y2 - seg.y1) * seg.progress;
            // Clamp collision endpoints to box
            var p1 = this._clampPoint(seg.x1, seg.y1, bb);
            var p2 = this._clampPoint(ex, ey, bb);
            var dx = p2.x - p1.x, dy = p2.y - p1.y;
            var len = Math.sqrt(dx * dx + dy * dy);
            if (len < 1) continue;
            var t = Math.max(0, Math.min(1, ((cx - p1.x) * dx + (cy - p1.y) * dy) / (len * len)));
            var px = p1.x + t * dx, py = p1.y + t * dy;
            var dist = Math.sqrt((cx - px) * (cx - px) + (cy - py) * (cy - py));
            if (dist < sw / 2 + 4) return this.damVal;
        }
    }
    return 0;
};

PrismRefractPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.beams.length === 0;
};
