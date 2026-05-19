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
    var bb = Cbbox.getBound();
    this.centerX = (bb[0] + bb[2]) / 2;
    this.centerY = (bb[1] + bb[3]) / 2;
    if (this.elapsed < this.warningTime) {
        this.fadeTick = this.elapsed / this.warningTime;
    } else {
        this.fadeTick = 1.0;
        this.angle += this.spinSpeed * dt;
    }
};

PulsarBeamPattern.prototype.draw = function(ctx) {
    if (this.elapsed > this.duration) return;

    var length = 800;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(this.angle);

    if (this.elapsed < this.warningTime) {
        // Draw warning beam cross — pulsing red
        var wAlpha = this.fadeTick * 0.5 + 0.2;
        var wPulse = Math.sin(this.elapsed * 20) * 0.1;
        ctx.globalAlpha = wAlpha + wPulse;
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(-length/2, -this.thickness/2, length, this.thickness);
        ctx.fillRect(-this.thickness/2, -length/2, this.thickness, length);
        // Inner warning line
        ctx.globalAlpha = (wAlpha + wPulse) * 0.6;
        ctx.fillStyle = "#FF8800";
        ctx.fillRect(-length/2, -this.thickness/4, length, this.thickness/2);
        ctx.fillRect(-this.thickness/4, -length/2, this.thickness/2, length);
    } else {
        // Outer aura — pulsing
        var beamPulse = Math.sin(this.elapsed * 12) * 0.1 + 0.9;
        ctx.globalAlpha = 0.35 * beamPulse;
        ctx.fillStyle = "rgba(255, 50, 0, 0.4)";
        ctx.fillRect(-length/2, -this.thickness * 0.8, length, this.thickness * 1.6);
        ctx.fillRect(-this.thickness * 0.8, -length/2, this.thickness * 1.6, length);
        
        // Main beam — orange/red edges
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 25;
        ctx.shadowColor = "#FF5500";
        ctx.fillStyle = "rgba(255, 100, 0, 0.65)";
        ctx.fillRect(-length/2, -this.thickness/2, length, this.thickness);
        ctx.fillRect(-this.thickness/2, -length/2, this.thickness, length);
        
        // Inner core — bright white
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#FFFFFF";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(-length/2, -this.thickness/4, length, this.thickness/2);
        ctx.fillRect(-this.thickness/4, -length/2, this.thickness/2, length);
        
        // Ultra-bright center line
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255, 255, 200, 0.9)";
        ctx.fillRect(-length/2, -2, length, 4);
        ctx.fillRect(-2, -length/2, 4, length);
        
        // Spark particles along beam edges
        ctx.shadowBlur = 0;
        for (var s = 0; s < 10; s++) {
            var sparkX = (Math.random() - 0.5) * length * 0.8;
            var sparkY = (this.thickness / 2) * (Math.random() > 0.5 ? 1 : -1) + (Math.random() - 0.5) * 6;
            ctx.fillStyle = "rgba(255, 200, 50, " + (0.3 + Math.random() * 0.5).toFixed(2) + ")";
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 1 + Math.random(), 0, Math.PI * 2);
            ctx.fill();
        }
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
