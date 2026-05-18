// angelic_chains.js — Seraphina Phase 1 Exclusive: chains of light restrict movement
var AngelicChainsPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 5;
    this.chains = [];
    this.chainTimer = 0;
    this.chainInterval = 1.3;
    this.battleBox = null;
};
AngelicChainsPattern.prototype = Object.create(BulletPattern.prototype);

AngelicChainsPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.chains = [];
    this.chainTimer = 0.8;
};

AngelicChainsPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    var bb = this.battleBox;
    this.chainTimer += dt;
    if (this.chainTimer >= this.chainInterval && this.elapsed < this.duration - 2) {
        this.chainTimer = 0;
        // Create chain that crosses the box
        var isHorizontal = Math.random() > 0.5;
        if (isHorizontal) {
            var y = bb[1] + 25 + Math.random() * (bb[3] - bb[1] - 50);
            this.chains.push({
                x1: bb[0], y1: y, x2: bb[2], y2: y,
                horizontal: true, warnTimer: 0, warnDuration: 0.7,
                active: false, life: 3.0, maxLife: 3.0,
                segments: Math.floor(4 + Math.random() * 3),
                waveOffset: Math.random() * Math.PI * 2
            });
        } else {
            var x = bb[0] + 25 + Math.random() * (bb[2] - bb[0] - 50);
            this.chains.push({
                x1: x, y1: bb[1], x2: x, y2: bb[3],
                horizontal: false, warnTimer: 0, warnDuration: 0.7,
                active: false, life: 3.0, maxLife: 3.0,
                segments: Math.floor(4 + Math.random() * 3),
                waveOffset: Math.random() * Math.PI * 2
            });
        }
    }
    for (var i = this.chains.length - 1; i >= 0; i--) {
        var c = this.chains[i];
        if (!c.active) {
            c.warnTimer += dt;
            if (c.warnTimer >= c.warnDuration) c.active = true;
        } else {
            c.life -= dt;
            if (c.life <= 0) this.chains.splice(i, 1);
        }
    }
};

AngelicChainsPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.chains.length; i++) {
        var c = this.chains[i];
        if (!c.active) {
            // Warning line
            var wAlpha = (c.warnTimer / c.warnDuration * 0.4 + Math.sin(this.elapsed * 15) * 0.1).toFixed(2);
            ctx.strokeStyle = "rgba(255, 220, 100, " + wAlpha + ")";
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath(); ctx.moveTo(c.x1, c.y1); ctx.lineTo(c.x2, c.y2); ctx.stroke();
            ctx.setLineDash([]);
        } else {
            var lifeAlpha = Math.min(1, c.life / c.maxLife * 2).toFixed(2);
            // Draw chain links
            var dx = c.x2 - c.x1, dy = c.y2 - c.y1;
            var len = Math.sqrt(dx * dx + dy * dy);
            var numLinks = c.segments * 3;
            var linkSize = len / numLinks;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(255, 200, 0, 0.4)";
            for (var l = 0; l < numLinks; l++) {
                var t = l / numLinks;
                var lx = c.x1 + dx * t;
                var ly = c.y1 + dy * t;
                // Wave motion
                var wave = Math.sin(this.elapsed * 4 + t * 8 + c.waveOffset) * 5;
                if (c.horizontal) ly += wave; else lx += wave;
                // Link
                var linkAlpha = parseFloat(lifeAlpha) * (0.6 + Math.sin(t * Math.PI * 4 + this.elapsed * 3) * 0.2);
                ctx.fillStyle = "rgba(255, 220, 100, " + linkAlpha.toFixed(2) + ")";
                ctx.beginPath(); ctx.arc(lx, ly, 3, 0, Math.PI * 2); ctx.fill();
                // Connector
                if (l > 0) {
                    var prevT = (l - 1) / numLinks;
                    var plx = c.x1 + dx * prevT;
                    var ply = c.y1 + dy * prevT;
                    var prevWave = Math.sin(this.elapsed * 4 + prevT * 8 + c.waveOffset) * 5;
                    if (c.horizontal) ply += prevWave; else plx += prevWave;
                    ctx.strokeStyle = "rgba(255, 200, 50, " + (linkAlpha * 0.5).toFixed(2) + ")";
                    ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(plx, ply); ctx.lineTo(lx, ly); ctx.stroke();
                }
            }
            ctx.shadowBlur = 0;
        }
    }
    ctx.restore();
};

AngelicChainsPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2, cy = sy + sh / 2;
    for (var i = 0; i < this.chains.length; i++) {
        var c = this.chains[i];
        if (!c.active) continue;
        var thickness = 8;
        if (c.horizontal) {
            var wave = Math.sin(this.elapsed * 4 + ((cx - c.x1) / (c.x2 - c.x1)) * 8 + c.waveOffset) * 5;
            if (Math.abs(cy - (c.y1 + wave)) < thickness + sh / 2) return this.damVal;
        } else {
            var wave = Math.sin(this.elapsed * 4 + ((cy - c.y1) / (c.y2 - c.y1)) * 8 + c.waveOffset) * 5;
            if (Math.abs(cx - (c.x1 + wave)) < thickness + sw / 2) return this.damVal;
        }
    }
    return 0;
};

AngelicChainsPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.chains.length === 0;
};
