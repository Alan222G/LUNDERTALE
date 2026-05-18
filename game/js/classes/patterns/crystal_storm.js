// crystal_storm.js — Ramiel's Crystal Storm: diamond shards rain down with tracking freeze mechanic
var CrystalStormPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 6;
    this.crystals = [];
    this.spawnTimer = 0;
    this.spawnInterval = 0.12;
    this.trails = [];
    this.battleBox = null;
};

CrystalStormPattern.prototype = Object.create(BulletPattern.prototype);

CrystalStormPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.crystals = [];
    this.trails = [];
    this.spawnTimer = 0;
};

CrystalStormPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    var bb = this.battleBox;

    // Spawn crystals
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        var bw = bb[2] - bb[0];

        // Regular falling crystal
        this.crystals.push({
            x: bb[0] + 25 + Math.random() * (bw - 50),
            y: bb[1] - 5,
            vx: (Math.random() - 0.5) * 25,
            vy: 120 + Math.random() * 80,
            size: 5 + Math.random() * 4,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 6,
            type: "fall", // "fall" or "freeze"
            freezeTimer: 0,
            frozen: false,
            alive: true,
            hue: Math.floor(Math.random() * 3) // 0=blue, 1=cyan, 2=indigo
        });

        // Every 3rd crystal: freezing/tracking crystal
        if (Math.random() < 0.3) {
            this.crystals.push({
                x: bb[0] + 30 + Math.random() * (bw - 60),
                y: bb[1] + 20 + Math.random() * (bb[3] - bb[1] - 60),
                vx: 0,
                vy: 0,
                size: 7 + Math.random() * 3,
                rot: Math.random() * Math.PI * 2,
                rotSpeed: 2,
                type: "freeze",
                freezeTimer: 0,
                freezeDuration: 0.6 + Math.random() * 0.3,
                frozen: true,
                alive: true,
                trackSpeed: 250 + Math.random() * 100,
                hue: 2 // indigo for tracking crystals
            });
        }
    }

    // Update crystals
    for (var i = this.crystals.length - 1; i >= 0; i--) {
        var c = this.crystals[i];

        if (c.type === "freeze" && c.frozen) {
            // Frozen: hover in place, pulsing, then shoot toward player
            c.freezeTimer += dt;
            c.rot += c.rotSpeed * dt * 2; // Spin faster while charging
            if (c.freezeTimer >= c.freezeDuration) {
                c.frozen = false;
                // Aim at current soul position
                var soulPos = Soul.getPos();
                var dx = soulPos.x - c.x;
                var dy = soulPos.y - c.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 1) {
                    c.vx = (dx / dist) * c.trackSpeed;
                    c.vy = (dy / dist) * c.trackSpeed;
                }
            }
        } else {
            c.x += c.vx * dt;
            c.y += c.vy * dt;
            c.rot += c.rotSpeed * dt;

            // Trail effect for moving crystals
            if (Math.random() < 0.3) {
                this.trails.push({
                    x: c.x,
                    y: c.y,
                    size: c.size * 0.5,
                    life: 0.25,
                    maxLife: 0.25,
                    hue: c.hue
                });
            }
        }

        // Remove if out of bounds
        if (c.x < bb[0] - 50 || c.x > bb[2] + 50 || c.y > bb[3] + 80 || c.y < bb[1] - 50) {
            this.crystals.splice(i, 1);
        }
    }

    // Update trails
    for (var i = this.trails.length - 1; i >= 0; i--) {
        this.trails[i].life -= dt;
        if (this.trails[i].life <= 0) this.trails.splice(i, 1);
    }
};

CrystalStormPattern.prototype.drawCrystal = function(ctx, x, y, size, rot, hue, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;

    // Crystal shadow/glow
    ctx.shadowBlur = 10;
    var glowColors = ["rgba(40, 100, 255, 0.5)", "rgba(50, 200, 255, 0.5)", "rgba(100, 50, 255, 0.5)"];
    ctx.shadowColor = glowColors[hue] || glowColors[0];

    // Crystal body (diamond shape) with gradient
    var colors = [
        ["rgba(30, 60, 200, 0.85)", "rgba(60, 130, 255, 0.95)", "rgba(30, 60, 200, 0.85)"],
        ["rgba(20, 150, 180, 0.85)", "rgba(50, 220, 255, 0.95)", "rgba(20, 150, 180, 0.85)"],
        ["rgba(80, 30, 200, 0.85)", "rgba(140, 80, 255, 0.95)", "rgba(80, 30, 200, 0.85)"]
    ];
    var c = colors[hue] || colors[0];

    var grad = ctx.createLinearGradient(-size / 2, -size, size / 2, size);
    grad.addColorStop(0, c[0]);
    grad.addColorStop(0.5, c[1]);
    grad.addColorStop(1, c[2]);
    ctx.fillStyle = grad;

    // Draw octahedron cross-section (diamond)
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.55, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.55, 0);
    ctx.closePath();
    ctx.fill();

    // Inner highlight (refraction line)
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(200, 230, 255, 0.4)";
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.lineTo(size * 0.15, 0);
    ctx.lineTo(0, size * 0.5);
    ctx.lineTo(-size * 0.1, -size * 0.1);
    ctx.closePath();
    ctx.fill();

    // Edge highlight
    ctx.strokeStyle = "rgba(180, 220, 255, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.55, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.55, 0);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
};

CrystalStormPattern.prototype.draw = function(ctx) {
    ctx.save();

    // Draw trails first (behind crystals)
    for (var i = 0; i < this.trails.length; i++) {
        var t = this.trails[i];
        var tAlpha = (t.life / t.maxLife * 0.4).toFixed(2);
        var tColors = ["rgba(50, 120, 255, ", "rgba(60, 200, 255, ", "rgba(120, 60, 255, "];
        ctx.fillStyle = (tColors[t.hue] || tColors[0]) + tAlpha + ")";
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size * (t.life / t.maxLife), 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw crystals
    for (var i = 0; i < this.crystals.length; i++) {
        var c = this.crystals[i];
        var alpha = 1.0;

        if (c.type === "freeze" && c.frozen) {
            // Pulsing glow while frozen
            var freezePulse = Math.sin(this.elapsed * 12 + i) * 0.2 + 0.8;
            alpha = freezePulse;

            // Warning circle
            var warnAlpha = (c.freezeTimer / c.freezeDuration * 0.5).toFixed(2);
            ctx.strokeStyle = "rgba(255, 100, 50, " + warnAlpha + ")";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.size + 8, 0, Math.PI * 2);
            ctx.stroke();

            // Charging ring
            ctx.strokeStyle = "rgba(255, 200, 50, " + (parseFloat(warnAlpha) * 0.7).toFixed(2) + ")";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.size + 4, 0, (c.freezeTimer / c.freezeDuration) * Math.PI * 2);
            ctx.stroke();
        }

        this.drawCrystal(ctx, c.x, c.y, c.size, c.rot, c.hue, alpha);
    }

    ctx.restore();
};

CrystalStormPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var soulCX = sx + sw / 2;
    var soulCY = sy + sh / 2;

    for (var i = 0; i < this.crystals.length; i++) {
        var c = this.crystals[i];
        if (c.type === "freeze" && c.frozen) continue; // Frozen crystals don't damage yet
        var dx = soulCX - c.x;
        var dy = soulCY - c.y;
        if (Math.sqrt(dx * dx + dy * dy) < c.size + sw / 2) {
            return this.damVal;
        }
    }
    return 0;
};

CrystalStormPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.crystals.length === 0;
};
