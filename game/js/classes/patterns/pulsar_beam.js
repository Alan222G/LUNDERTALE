// pulsar_beam.js — A massive rotating double-sided laser beam
var PulsarBeamPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.angle = 0;
    this.spinSpeed = config.spinSpeed || 1.2; // Radians per second (slow enough to dodge)
    this.thickness = config.thickness || 40;
    this.centerX = 0;
    this.centerY = 0;
    this.damVal = config.damVal || 7;
    this.warningTime = 1.0; // 1 second warning before damage starts
    this.fadeTick = 0;
};

PulsarBeamPattern.prototype = Object.create(BulletPattern.prototype);

PulsarBeamPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.centerX = (battleBox[0] + battleBox[2]) / 2;
    this.centerY = (battleBox[1] + battleBox[3]) / 2;
    this.elapsed = 0;
    this.angle = 0;
};

PulsarBeamPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    if (this.elapsed < this.warningTime) {
        this.fadeTick = this.elapsed / this.warningTime;
    } else {
        this.fadeTick = 1.0;
        this.angle += this.spinSpeed * dt;
    }
};

PulsarBeamPattern.prototype.draw = function(ctx) {
    if (this.elapsed > this.duration) return;

    var length = 800; // Super long to cover everything
    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(this.angle);

    if (this.elapsed < this.warningTime) {
        // Draw warning beam cross
        ctx.globalAlpha = this.fadeTick * 0.5 + 0.2;
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(-length/2, -this.thickness/2, length, this.thickness); // Horizontal
        ctx.fillRect(-this.thickness/2, -length/2, this.thickness, length); // Vertical
    } else {
        // Draw actual destructive laser cross
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#FF5500";
        
        // Horizontal Inner core
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(-length/2, -this.thickness/4, length, this.thickness/2);
        // Vertical Inner core
        ctx.fillRect(-this.thickness/4, -length/2, this.thickness/2, length);
        
        // Horizontal Outer aura
        ctx.fillStyle = "rgba(255, 100, 0, 0.6)";
        ctx.fillRect(-length/2, -this.thickness/2, length, this.thickness);
        // Vertical Outer aura
        ctx.fillRect(-this.thickness/2, -length/2, this.thickness, length);
    }

    ctx.restore();
};

PulsarBeamPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    if (this.elapsed < this.warningTime || this.elapsed > this.duration) return 0;
    
    // Check collision against a rotated rectangle
    // Easiest way: rotate soul center by -this.angle, check against axis-aligned rect
    var sCenterX = sx + sw/2;
    var sCenterY = sy + sh/2;
    
    // Translate relative to beam center
    var dx = sCenterX - this.centerX;
    var dy = sCenterY - this.centerY;
    
    // Rotate backwards
    var cos = Math.cos(-this.angle);
    var sin = Math.sin(-this.angle);
    var localX = dx * cos - dy * sin;
    var localY = dx * sin + dy * cos;
    
    // Check against horizontal beam
    if (Math.abs(localY) < (this.thickness/2 + Math.min(sw, sh)/2)) {
        return this.damVal;
    }
    // Check against vertical beam
    if (Math.abs(localX) < (this.thickness/2 + Math.min(sw, sh)/2)) {
        return this.damVal;
    }
    return 0;
};

PulsarBeamPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};
