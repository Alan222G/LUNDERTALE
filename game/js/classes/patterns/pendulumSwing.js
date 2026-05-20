// pendulumSwing.js - Paradoja: Giant swinging pendulum clock hand
var PendulumSwingPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    
    this.pivotX = 0;
    this.pivotY = 0;
    
    this.length = 400;
    this.thickness = 18;
    
    this.speed = 2.5;
    this.maxAngle = Math.PI / 2.2;
    
    this.sandParticles = [];
    this.angle = 0;
    this.battleBox = null;
    this.particleTimer = 0;
};

PendulumSwingPattern.prototype = Object.create(BulletPattern.prototype);

PendulumSwingPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    
    this.pivotX = (battleBox[0] + battleBox[2]) / 2;
    this.pivotY = battleBox[1];
    
    this.length = battleBox[3] - battleBox[1] + 150;
    this.sandParticles = [];
    this.angle = 0;
    this.particleTimer = 0;
};

PendulumSwingPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.particleTimer += dt;
    
    var bb = Cbbox.getBound();
    this.pivotX = (bb[0] + bb[2]) / 2;
    this.pivotY = bb[1];
    
    // Sine wave swing
    this.angle = Math.sin(this.elapsed * this.speed) * this.maxAngle;
    
    // Spawn ambient sand
    if (this.particleTimer >= 0.05) {
        this.particleTimer = 0;
        this.sandParticles.push({
            x: this.pivotX + (Math.random() * 40 - 20),
            y: this.pivotY,
            vx: Math.random() * 2 - 1,
            vy: Math.random() * 60 + 60,
            size: Math.random() * 3 + 1,
            alpha: 1
        });
    }
    
    // Update sand
    for (var i = this.sandParticles.length - 1; i >= 0; i--) {
        var p = this.sandParticles[i];
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt;
        p.alpha -= dt * 0.5;
        if (p.alpha <= 0 || p.y > bb[3] + 50) {
            this.sandParticles.splice(i, 1);
        }
    }
};

PendulumSwingPattern.prototype.draw = function(ctx) {
    ctx.save();
    
    // Draw sand
    ctx.fillStyle = "#e8c37b";
    for (var i = 0; i < this.sandParticles.length; i++) {
        var p = this.sandParticles[i];
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    
    // Draw pendulum
    ctx.translate(this.pivotX, this.pivotY);
    ctx.rotate(this.angle);
    
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00FFFF";
    
    var grad = ctx.createLinearGradient(0, 0, 0, this.length);
    grad.addColorStop(0, "rgba(255, 215, 0, 1)"); 
    grad.addColorStop(0.5, "rgba(0, 255, 255, 1)"); 
    grad.addColorStop(1, "rgba(0, 255, 255, 0)"); 
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.fillRect(-this.thickness / 2, 0, this.thickness, this.length);
    
    // Inner core
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(-this.thickness / 4, 0, this.thickness / 2, this.length);
    
    // Pivot joint
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fillStyle = "#FFD700";
    ctx.fill();
    ctx.strokeStyle = "#00FFFF";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.restore();
};

PendulumSwingPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var endX = this.pivotX - Math.sin(this.angle) * this.length;
    var endY = this.pivotY + Math.cos(this.angle) * this.length;
    
    var cx = sx + sw / 2;
    var cy = sy + sh / 2;
    
    var l2 = Math.pow(endX - this.pivotX, 2) + Math.pow(endY - this.pivotY, 2);
    if (l2 === 0) return 0;
    
    var t = Math.max(0, Math.min(1, ((cx - this.pivotX) * (endX - this.pivotX) + (cy - this.pivotY) * (endY - this.pivotY)) / l2));
    
    var projX = this.pivotX + t * (endX - this.pivotX);
    var projY = this.pivotY + t * (endY - this.pivotY);
    
    var dist = Math.sqrt(Math.pow(cx - projX, 2) + Math.pow(cy - projY, 2));
    
    if (dist < (this.thickness / 2) + sw / 2) {
        return this.damVal;
    }
    
    return 0;
};

PendulumSwingPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};
