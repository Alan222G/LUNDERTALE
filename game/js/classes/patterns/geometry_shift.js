// geometry_shift.js — Ramiel Phase 2 Exclusive: geometric shapes materialize and fire toward player
var GeometryShiftPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.shapes = [];
    this.shapeTimer = 0;
    this.shapeInterval = 0.9;
    this.projectiles = [];
    this.battleBox = null;
};
GeometryShiftPattern.prototype = Object.create(BulletPattern.prototype);

GeometryShiftPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.shapes = [];
    this.projectiles = [];
    this.shapeTimer = 0.5;
};

GeometryShiftPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.shapeTimer += dt;
    var bb = Cbbox.getBound();
    // Spawn shapes
    if (this.shapeTimer >= this.shapeInterval && this.elapsed < this.duration - 2) {
        this.shapeTimer = 0;
        var sides = [3, 4, 5, 6][Math.floor(Math.random() * 4)];
        this.shapes.push({
            x: bb[0] + 30 + Math.random() * (bb[2] - bb[0] - 60),
            y: bb[1] + 30 + Math.random() * (bb[3] - bb[1] - 60),
            sides: sides,
            size: 0,
            maxSize: 18 + Math.random() * 10,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 3,
            chargeTime: 0.8 + Math.random() * 0.3,
            chargeTimer: 0,
            fired: false,
            hue: Math.floor(Math.random() * 3)
        });
    }
    // Update shapes
    for (var i = this.shapes.length - 1; i >= 0; i--) {
        var s = this.shapes[i];
        s.rot += s.rotSpeed * dt;
        s.chargeTimer += dt;
        s.size = Math.min(s.maxSize, s.maxSize * (s.chargeTimer / (s.chargeTime * 0.6)));
        if (s.chargeTimer >= s.chargeTime && !s.fired) {
            s.fired = true;
            // Fire projectiles in all vertex directions
            var soulPos = Soul.getPos();
            var dx = soulPos.x - s.x, dy = soulPos.y - s.y;
            var baseAngle = Math.atan2(dy, dx);
            for (var v = 0; v < s.sides; v++) {
                var angle = baseAngle + (v / s.sides) * Math.PI * 2;
                var speed = 120 + Math.random() * 40;
                this.projectiles.push({
                    x: s.x, y: s.y,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    size: 5 + Math.random() * 2, rot: Math.random() * Math.PI,
                    rotSpeed: (Math.random() - 0.5) * 8,
                    life: 2.5, sides: s.sides, hue: s.hue
                });
            }
            this.shapes.splice(i, 1);
        }
    }
    // Update projectiles
    for (var i = this.projectiles.length - 1; i >= 0; i--) {
        var p = this.projectiles[i];
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.rot += p.rotSpeed * dt; p.life -= dt;
        if (p.life <= 0 || p.x < bb[0] - 50 || p.x > bb[2] + 50 || p.y < bb[1] - 50 || p.y > bb[3] + 50)
            this.projectiles.splice(i, 1);
    }
};

GeometryShiftPattern.prototype.drawPolygon = function(ctx, x, y, sides, size, rot) {
    ctx.beginPath();
    for (var i = 0; i < sides; i++) {
        var angle = (i / sides) * Math.PI * 2 + rot;
        var px = x + Math.cos(angle) * size, py = y + Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
};

GeometryShiftPattern.prototype.draw = function(ctx) {
    ctx.save();
    var hueColors = [
        ["rgba(40, 80, 255, ", "rgba(80, 160, 255, "],
        ["rgba(50, 200, 200, ", "rgba(80, 255, 255, "],
        ["rgba(120, 40, 255, ", "rgba(180, 100, 255, "]
    ];
    // Draw charging shapes
    for (var i = 0; i < this.shapes.length; i++) {
        var s = this.shapes[i];
        var progress = s.chargeTimer / s.chargeTime;
        var c = hueColors[s.hue] || hueColors[0];
        // Warning glow
        ctx.shadowBlur = 12 + progress * 10;
        ctx.shadowColor = c[1] + "0.5)";
        // Shape body
        ctx.fillStyle = c[0] + (0.4 + progress * 0.5).toFixed(2) + ")";
        this.drawPolygon(ctx, s.x, s.y, s.sides, s.size, s.rot);
        ctx.fill();
        ctx.strokeStyle = c[1] + (0.6 + progress * 0.3).toFixed(2) + ")";
        ctx.lineWidth = 2;
        this.drawPolygon(ctx, s.x, s.y, s.sides, s.size, s.rot);
        ctx.stroke();
        // Charge ring
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255, 150, 50, " + (progress * 0.6).toFixed(2) + ")";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.maxSize + 6, 0, progress * Math.PI * 2);
        ctx.stroke();
    }
    // Draw projectiles
    ctx.shadowBlur = 6;
    for (var i = 0; i < this.projectiles.length; i++) {
        var p = this.projectiles[i];
        var pAlpha = Math.min(1, p.life * 0.8).toFixed(2);
        var c = hueColors[p.hue] || hueColors[0];
        ctx.shadowColor = c[1] + "0.4)";
        ctx.fillStyle = c[0] + pAlpha + ")";
        this.drawPolygon(ctx, p.x, p.y, p.sides, p.size, p.rot);
        ctx.fill();
        ctx.strokeStyle = c[1] + (pAlpha * 0.7).toFixed(2) + ")";
        ctx.lineWidth = 1;
        this.drawPolygon(ctx, p.x, p.y, p.sides, p.size, p.rot);
        ctx.stroke();
    }
    ctx.restore();
};

GeometryShiftPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2, cy = sy + sh / 2;
    for (var i = 0; i < this.projectiles.length; i++) {
        var p = this.projectiles[i];
        var dx = cx - p.x, dy = cy - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < p.size + sw / 2) return this.damVal;
    }
    // Charging shapes also damage
    for (var i = 0; i < this.shapes.length; i++) {
        var s = this.shapes[i];
        if (s.size < 5) continue;
        var dx = cx - s.x, dy = cy - s.y;
        if (Math.sqrt(dx * dx + dy * dy) < s.size + sw / 2) return this.damVal;
    }
    return 0;
};

GeometryShiftPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.shapes.length === 0 && this.projectiles.length === 0;
};
