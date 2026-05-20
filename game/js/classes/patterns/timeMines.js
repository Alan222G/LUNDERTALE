// timeMines.js - Paradoja: Mines that count down 3, 2, 1 and explode in a cross pattern
var TimeMinesPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 6;
    
    this.mines = [];
    this.lasers = [];
    this.spawnTimer = 0;
    this.spawnInterval = 2.0;
};

TimeMinesPattern.prototype = Object.create(BulletPattern.prototype);

TimeMinesPattern.prototype.generateBullets = function(battleBox) {
    this.elapsed = 0;
    this.mines = [];
    this.lasers = [];
    this.spawnTimer = 1.5; // Spawn first mine quickly
};

TimeMinesPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    
    // Spawn mines
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 2) {
        this.spawnTimer = 0;
        
        var mx = bb[0] + 30 + Math.random() * (bb[2] - bb[0] - 60);
        var my = bb[1] + 30 + Math.random() * (bb[3] - bb[1] - 60);
        
        this.mines.push({
            x: mx,
            y: my,
            timer: 3.0, // 3 seconds to detonate
            exploded: false
        });
    }
    
    // Update mines
    for (var i = this.mines.length - 1; i >= 0; i--) {
        var m = this.mines[i];
        m.timer -= dt;
        
        if (m.timer <= 0 && !m.exploded) {
            m.exploded = true;
            // Spawn lasers
            this.lasers.push({
                x: m.x,
                y: m.y,
                life: 0.5,
                width: 20
            });
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
};

TimeMinesPattern.prototype.draw = function(ctx) {
    ctx.save();
    
    // Draw lasers
    var bb = Cbbox.getBound();
    for (var j = 0; j < this.lasers.length; j++) {
        var l = this.lasers[j];
        var alpha = l.life / 0.5;
        
        ctx.fillStyle = "rgba(255, 200, 0, " + alpha + ")";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FF0";
        
        // Horizontal laser
        ctx.fillRect(bb[0], l.y - l.width/2, bb[2] - bb[0], l.width);
        // Vertical laser
        ctx.fillRect(l.x - l.width/2, bb[1], l.width, bb[3] - bb[1]);
        
        ctx.fillStyle = "rgba(255, 255, 255, " + alpha + ")";
        ctx.fillRect(bb[0], l.y - l.width/4, bb[2] - bb[0], l.width/2);
        ctx.fillRect(l.x - l.width/4, bb[1], l.width/2, bb[3] - bb[1]);
    }
    
    // Draw mines
    ctx.shadowBlur = 0;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "16px 'Determination Mono', monospace";
    
    for (var i = 0; i < this.mines.length; i++) {
        var m = this.mines[i];
        var num = Math.ceil(m.timer);
        
        // Beeping effect
        var beep = (m.timer % 0.2 < 0.1) && m.timer < 1.0;
        
        ctx.beginPath();
        ctx.arc(m.x, m.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = beep ? "#F00" : "#A00";
        ctx.fill();
        ctx.strokeStyle = "#FFF";
        ctx.lineWidth = 2;
        ctx.stroke();
        
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
