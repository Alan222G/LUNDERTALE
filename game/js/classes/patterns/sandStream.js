// sandStream.js - Paradoja: Sand particles falling in a pendulum pattern
var SandStreamPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 6;
    this.particles = [];
    this.spawnTimer = 0;
    this.spawnInterval = 0.05; // Fast spawn rate
    this.battleBox = null;
    this.inverted = false;
};

SandStreamPattern.prototype = Object.create(BulletPattern.prototype);

SandStreamPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.particles = [];
    this.spawnTimer = 0;
    
    // Check if boss is inverted
    var currentPhase = Cgroup.getEnemy(0).currentPhase;
    this.inverted = (currentPhase === 1); // Phase 2 is inverted
};

SandStreamPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1) {
        this.spawnTimer = 0;
        
        var cx = (bb[0] + bb[2]) / 2;
        // Pendulum offset
        var offset = Math.sin(this.elapsed * 2.5) * (bb[2] - bb[0]) * 0.4;
        var startX = cx + offset;
        
        var startY = this.inverted ? bb[3] + 10 : bb[1] - 10;
        var vy = this.inverted ? -180 : 180;
        
        this.particles.push({
            x: startX + (Math.random() - 0.5) * 15,
            y: startY,
            vx: (Math.random() - 0.5) * 20,
            vy: vy * (0.8 + Math.random() * 0.4),
            size: 3 + Math.random() * 3,
            color: Math.random() > 0.5 ? "rgba(255, 200, 50, 0.9)" : "rgba(255, 150, 0, 0.9)"
        });
    }

    // Update particles
    for (var i = this.particles.length - 1; i >= 0; i--) {
        var p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        
        if (p.y > bb[3] + 20 || p.y < bb[1] - 20) {
            this.particles.splice(i, 1);
        }
    }
};

SandStreamPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        ctx.fillStyle = p.color;
        
        // Motion blur effect
        var trace = p.vy * 0.05;
        ctx.beginPath();
        ctx.moveTo(p.x - p.size/2, p.y);
        ctx.lineTo(p.x, p.y - trace);
        ctx.lineTo(p.x + p.size/2, p.y);
        ctx.lineTo(p.x, p.y + trace);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 5;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    ctx.restore();
};

SandStreamPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw/2;
    var cy = sy + sh/2;
    
    for (var i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        if (Math.abs(cx - p.x) < p.size + sw/2 && Math.abs(cy - p.y) < p.size + sh/2) {
            return this.damVal;
        }
    }
    return 0;
};

SandStreamPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.particles.length === 0;
};
