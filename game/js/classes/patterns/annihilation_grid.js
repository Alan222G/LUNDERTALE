// annihilation_grid.js — Ramiel Phase 3 Exclusive: contracting laser grid
var AnnihilationGridPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
    this.gridLines = [];
    this.gridSize = 0;
    this.maxGridSize = 12;
    this.buildTimer = 0;
    this.buildInterval = 0.2;
    this.contracting = false;
    this.contractTimer = 0;
    this.battleBox = null;
    this.flashTimer = 0;
};
AnnihilationGridPattern.prototype = Object.create(BulletPattern.prototype);

AnnihilationGridPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.gridLines = [];
    this.gridSize = 0;
    this.buildTimer = 0;
    this.contracting = false;
    this.contractTimer = 0;
    this.flashTimer = 0;
};

AnnihilationGridPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    var bb = Cbbox.getBound();
    var bw = bb[2] - bb[0], bh = bb[3] - bb[1];
    if (!this.contracting) {
        this.buildTimer += dt;
        if (this.buildTimer >= this.buildInterval && this.gridSize < this.maxGridSize) {
            this.buildTimer = 0;
            this.gridSize++;
            // Add horizontal + vertical lines
            var spacing = bh / (this.maxGridSize + 1);
            this.gridLines.push({
                type: "h", pos: bb[1] + this.gridSize * spacing,
                left: bb[0], right: bb[2], thickness: 6, active: false, warning: true, warnTimer: 0
            });
            var vSpacing = bw / (this.maxGridSize + 1);
            this.gridLines.push({
                type: "v", pos: bb[0] + this.gridSize * vSpacing,
                top: bb[1], bottom: bb[3], thickness: 6, active: false, warning: true, warnTimer: 0
            });
        }
        // Activate lines after warning
        for (var i = 0; i < this.gridLines.length; i++) {
            var l = this.gridLines[i];
            if (l.warning) {
                l.warnTimer += dt;
                if (l.warnTimer >= 0.6) { l.warning = false; l.active = true; }
            }
        }
        if (this.gridSize >= this.maxGridSize && this.elapsed > 3.5) this.contracting = true;
    } else {
        // Contract grid toward center
        this.contractTimer += dt;
        var cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2;
        var contractSpeed = 50 + this.contractTimer * 20;
        for (var i = 0; i < this.gridLines.length; i++) {
            var l = this.gridLines[i];
            if (l.type === "h") {
                if (l.pos < cy) l.pos += contractSpeed * dt;
                else l.pos -= contractSpeed * dt;
            } else {
                if (l.pos < cx) l.pos += contractSpeed * dt;
                else l.pos -= contractSpeed * dt;
            }
        }
    }
};

AnnihilationGridPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    for (var i = 0; i < this.gridLines.length; i++) {
        var l = this.gridLines[i];
        if (l.warning) {
            // Warning pulse
            var wAlpha = (l.warnTimer / 0.6 * 0.5 + Math.sin(this.elapsed * 20) * 0.1).toFixed(2);
            ctx.strokeStyle = "rgba(255, 40, 40, " + wAlpha + ")";
            ctx.lineWidth = 1;
            if (l.type === "h") {
                ctx.beginPath(); ctx.moveTo(bb[0], l.pos); ctx.lineTo(bb[2], l.pos); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.moveTo(l.pos, bb[1]); ctx.lineTo(l.pos, bb[3]); ctx.stroke();
            }
        } else if (l.active) {
            // Active laser line
            ctx.shadowBlur = 12;
            ctx.shadowColor = "rgba(255, 30, 30, 0.6)";
            // Outer glow
            ctx.strokeStyle = "rgba(255, 50, 20, 0.4)";
            ctx.lineWidth = l.thickness * 2;
            if (l.type === "h") {
                ctx.beginPath(); ctx.moveTo(bb[0] - 20, l.pos); ctx.lineTo(bb[2] + 20, l.pos); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.moveTo(l.pos, bb[1] - 20); ctx.lineTo(l.pos, bb[3] + 20); ctx.stroke();
            }
            // Core beam
            ctx.shadowBlur = 6;
            ctx.strokeStyle = "rgba(255, 100, 50, 0.8)";
            ctx.lineWidth = l.thickness;
            if (l.type === "h") {
                ctx.beginPath(); ctx.moveTo(bb[0] - 20, l.pos); ctx.lineTo(bb[2] + 20, l.pos); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.moveTo(l.pos, bb[1] - 20); ctx.lineTo(l.pos, bb[3] + 20); ctx.stroke();
            }
            // Bright center
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "rgba(255, 200, 150, 0.7)";
            ctx.lineWidth = 2;
            if (l.type === "h") {
                ctx.beginPath(); ctx.moveTo(bb[0] - 20, l.pos); ctx.lineTo(bb[2] + 20, l.pos); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.moveTo(l.pos, bb[1] - 20); ctx.lineTo(l.pos, bb[3] + 20); ctx.stroke();
            }
        }
    }
    ctx.restore();
};

AnnihilationGridPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2, cy = sy + sh / 2;
    for (var i = 0; i < this.gridLines.length; i++) {
        var l = this.gridLines[i];
        if (!l.active) continue;
        var halfThick = l.thickness / 2 + sw / 2;
        if (l.type === "h" && Math.abs(cy - l.pos) < halfThick) return this.damVal;
        if (l.type === "v" && Math.abs(cx - l.pos) < halfThick) return this.damVal;
    }
    return 0;
};

AnnihilationGridPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};
