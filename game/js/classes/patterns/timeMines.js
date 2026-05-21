// timeMines.js - Paradoja: Mines that count down 3, 2, 1 and explode in a cross pattern
var TimeMinesPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 6;
    
    this.mines = [];
    this.lasers = [];
    this.particles = [];
    this.spawnTimer = 0;
    this.spawnInterval = 2.0;
};

TimeMinesPattern.prototype = Object.create(BulletPattern.prototype);

TimeMinesPattern.prototype.generateBullets = function(battleBox) {
    this.elapsed = 0;
    this.mines = [];
    this.lasers = [];
    this.particles = [];
    this.spawnTimer = 1.5; // Spawn first mine quickly
};

TimeMinesPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    
    // Spawn mines
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 2) {
        this.spawnTimer = 0;
        
        for (var k = 0; k < 2; k++) {
            var mx = bb[0] + 30 + Math.random() * (bb[2] - bb[0] - 60);
            var my = bb[1] + 30 + Math.random() * (bb[3] - bb[1] - 60);
            
            this.mines.push({
                x: mx,
                y: my,
                timer: 3.0, // 3 seconds to detonate
                exploded: false
            });
        }
    }
    
    // Update mines
    for (var i = this.mines.length - 1; i >= 0; i--) {
        var m = this.mines[i];
        m.timer -= dt;
        
        if (m.timer <= 0 && !m.exploded) {
            m.exploded = true;
            Sound.playSound("select", true); // Explosion sound
            
            // Spawn lasers
            this.lasers.push({
                x: m.x,
                y: m.y,
                life: 0.5,
                width: 25 // Slightly thicker lasers
            });
            
            // Explosion particles
            for(var p=0; p<15; p++) {
                this.particles.push({
                    x: m.x,
                    y: m.y,
                    vx: (Math.random()-0.5)*200,
                    vy: (Math.random()-0.5)*200,
                    life: 0.5 + Math.random()*0.5,
                    size: Math.random()*4 + 2,
                    color: Math.random() > 0.5 ? "#FFAA00" : "#FF5500"
                });
            }
            this.mines.splice(i, 1);
        }
    }
    
    // Update lasers
    for (var j = this.lasers.length - 1; j >= 0; j--) {
        this.lasers[j].life -= dt;
        if (this.lasers[j].life <= 0) {
            this.lasers.splice(j, 1);
        }
    }
    
    // Update particles
    for (var p = this.particles.length - 1; p >= 0; p--) {
        var part = this.particles[p];
        part.x += part.vx * dt;
        part.y += part.vy * dt;
        part.life -= dt;
        if (part.life <= 0) this.particles.splice(p, 1);
    }
};

TimeMinesPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    
    // Screen shake effect when lasers are active
    if (this.lasers.length > 0) {
        ctx.translate((Math.random()-0.5)*4, (Math.random()-0.5)*4);
    }
    
    // Draw lasers
    for (var j = 0; j < this.lasers.length; j++) {
        var l = this.lasers[j];
        var alpha = l.life / 0.5;
        
        ctx.fillStyle = "rgba(255, 100, 0, " + alpha + ")";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#FF5500";
        
        // Horizontal laser
        ctx.fillRect(bb[0], l.y - l.width/2, bb[2] - bb[0], l.width);
        // Vertical laser
        ctx.fillRect(l.x - l.width/2, bb[1], l.width, bb[3] - bb[1]);
        
        // Bright core
        ctx.fillStyle = "rgba(255, 255, 255, " + alpha + ")";
        ctx.shadowBlur = 0;
        ctx.fillRect(bb[0], l.y - l.width/4, bb[2] - bb[0], l.width/2);
        ctx.fillRect(l.x - l.width/4, bb[1], l.width/2, bb[3] - bb[1]);
    }
    
    // Draw particles
    for (var p = 0; p < this.particles.length; p++) {
        var part = this.particles[p];
        ctx.fillStyle = part.color;
        ctx.globalAlpha = part.life;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    
    // Draw mines with telegraphs
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "16px 'Determination Mono', monospace";
    
    for (var i = 0; i < this.mines.length; i++) {
        var m = this.mines[i];
        var num = Math.ceil(m.timer);
        var beep = (m.timer % 0.2 < 0.1) && m.timer < 1.0;
        
        // Draw telegraph lines if close to detonation
        if (m.timer < 1.0) {
            ctx.strokeStyle = "rgba(255, 0, 0, 0.3)";
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(bb[0], m.y); ctx.lineTo(bb[2], m.y);
            ctx.moveTo(m.x, bb[1]); ctx.lineTo(m.x, bb[3]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        ctx.shadowBlur = beep ? 15 : 0;
        ctx.shadowColor = "#F00";
        ctx.beginPath();
        ctx.arc(m.x, m.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = beep ? "#F00" : "#600";
        ctx.fill();
        ctx.strokeStyle = "#FFF";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#FFF";
        ctx.fillText(num.toString(), m.x, m.y);
    }
    
    ctx.restore();
};

TimeMinesPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2;
    var cy = sy + sh / 2;
    var r = sw / 2;
    
    for (var j = 0; j < this.lasers.length; j++) {
        var l = this.lasers[j];
        // Check horizontal laser
        if (Math.abs(cy - l.y) < (l.width/2 + r)) return this.damVal;
        // Check vertical laser
        if (Math.abs(cx - l.x) < (l.width/2 + r)) return this.damVal;
    }
    return 0;
};

TimeMinesPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.mines.length === 0 && this.lasers.length === 0;
};
