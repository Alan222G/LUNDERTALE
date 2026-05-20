// sandWhirlwind.js - Paradoja: A vortex of sand that shrinks and expands
var SandWhirlwindPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 6;
    
    this.particles = [];
    this.baseRadius = 150;
    this.angleOffset = 0;
};

SandWhirlwindPattern.prototype = Object.create(BulletPattern.prototype);

SandWhirlwindPattern.prototype.generateBullets = function(battleBox) {
    this.elapsed = 0;
    this.particles = [];
    
    // Create initial ring of particles
    var numParticles = 80;
    for (var i = 0; i < numParticles; i++) {
        this.particles.push({
            angle: (i / numParticles) * Math.PI * 2,
            distanceOffset: (Math.random() - 0.5) * 40,
            size: Math.random() * 3 + 2,
            color: Math.random() > 0.5 ? "#FFCC00" : "#FFAA00"
        });
    }
    this.angleOffset = 0;
};

SandWhirlwindPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.angleOffset += dt * 2.0; // Spin speed
    
    // Radius pulsates
    this.baseRadius = 100 + Math.sin(this.elapsed * 3) * 60;
    
    // Expand wildly at the end
    if (this.elapsed > this.duration - 1) {
        this.baseRadius += (this.elapsed - (this.duration - 1)) * 300;
    }
};

SandWhirlwindPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    ctx.save();
    ctx.shadowBlur = 5;
    ctx.shadowColor = "#FF0";
    
    for (var i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        var angle = p.angle + this.angleOffset;
        var r = this.baseRadius + p.distanceOffset;
        
        var px = cx + Math.cos(angle) * r;
        var py = cy + Math.sin(angle) * r;
        
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
};

SandWhirlwindPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    var px = sx + sw / 2;
    var py = sy + sh / 2;
    var pr = sw / 2;
    
    for (var i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        var angle = p.angle + this.angleOffset;
        var r = this.baseRadius + p.distanceOffset;
        
        var particleX = cx + Math.cos(angle) * r;
        var particleY = cy + Math.sin(angle) * r;
        
        if (Math.abs(px - particleX) < p.size + pr && Math.abs(py - particleY) < p.size + pr) {
            return this.damVal;
        }
    }
    return 0;
};

SandWhirlwindPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};
