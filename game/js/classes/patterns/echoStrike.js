// echoStrike.js - Paradoja: Strikes the player's past positions
var EchoStrikePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    
    this.marks = [];
    this.markTimer = 0;
};

EchoStrikePattern.prototype = Object.create(BulletPattern.prototype);

EchoStrikePattern.prototype.generateBullets = function(battleBox) {
    this.elapsed = 0;
    this.marks = [];
    this.markTimer = 0;
};

EchoStrikePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.markTimer += dt;
    
    // Drop a mark at player's position every 0.6 seconds
    if (this.markTimer >= 0.6 && this.elapsed < this.duration - 2) {
        this.markTimer = 0;
        
        var pos = Soul.getPos();
        var px = pos.x;
        var py = pos.y;
        
        this.marks.push({
            x: px,
            y: py,
            time: 0,
            delay: 1.2, // 1.2 seconds until strike
            radius: 25,
            active: true
        });
    }
    
    for (var i = this.marks.length - 1; i >= 0; i--) {
        var m = this.marks[i];
        if (m.active) {
            m.time += dt;
            if (m.time >= m.delay + 0.3) {
                // Remove mark 0.3s after strike
                m.active = false;
            }
        } else {
            this.marks.splice(i, 1);
        }
    }
};

EchoStrikePattern.prototype.draw = function(ctx) {
    ctx.save();
    
    for (var i = 0; i < this.marks.length; i++) {
        var m = this.marks[i];
        
        if (m.time < m.delay) {
            // Telegraph phase
            var progress = m.time / m.delay; // 0 to 1
            ctx.strokeStyle = "rgba(0, 255, 255, " + (0.3 + progress * 0.7) + ")";
            ctx.lineWidth = 2;
            
            // Shrinking circle
            var r = m.radius + (1 - progress) * 30;
            ctx.beginPath();
            ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
            ctx.stroke();
            
            // Inner target cross
            ctx.beginPath();
            ctx.moveTo(m.x - 5, m.y); ctx.lineTo(m.x + 5, m.y);
            ctx.moveTo(m.x, m.y - 5); ctx.lineTo(m.x, m.y + 5);
            ctx.stroke();
        } else {
            // Strike phase
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#0FF";
            
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Strike beam from above
            var bb = Cbbox.getBound();
            ctx.fillStyle = "rgba(0, 255, 255, 0.6)";
            ctx.fillRect(m.x - m.radius, bb[1] - 50, m.radius * 2, m.y - (bb[1] - 50));
        }
    }
    
    ctx.restore();
};

EchoStrikePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var px = sx + sw / 2;
    var py = sy + sh / 2;
    var pr = sw / 2;
    
    for (var i = 0; i < this.marks.length; i++) {
        var m = this.marks[i];
        // Only hits during the 0.3s strike phase
        if (m.time >= m.delay && m.time < m.delay + 0.3) {
            var dx = px - m.x;
            var dy = py - m.y;
            var dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < m.radius + pr) {
                return this.damVal;
            }
        }
    }
    return 0;
};

EchoStrikePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.marks.length === 0;
};
