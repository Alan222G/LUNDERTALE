// timeDilation.js — Paradoja Phase 1: Massive sweeping clock hands acting as deadly lasers
var TimeDilationPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    
    this.centerX = 0;
    this.centerY = 0;
    
    this.hand1Angle = -Math.PI / 2; // Starts pointing up
    this.hand2Angle = -Math.PI / 2;
    this.hand1Speed = 0;
    this.hand2Speed = 0;
    
    this.hand1Length = 400;
    this.hand2Length = 400;
    
    this.particles = [];
    this.screenShake = 0;
};

TimeDilationPattern.prototype = Object.create(BulletPattern.prototype);

TimeDilationPattern.prototype.generateBullets = function(battleBox) {
    this.elapsed = 0;
    this.centerX = (battleBox[0] + battleBox[2]) / 2;
    this.centerY = (battleBox[1] + battleBox[3]) / 2;
    
    this.hand1Angle = -Math.PI / 2;
    this.hand2Angle = Math.PI;
    
    this.particles = [];
    for (var i = 0; i < 60; i++) {
        this.particles.push({
            x: battleBox[0] + Math.random() * (battleBox[2] - battleBox[0]),
            y: battleBox[1] + Math.random() * (battleBox[3] - battleBox[1]),
            vx: (Math.random() - 0.5) * 40,
            vy: (Math.random() - 0.5) * 40,
            size: Math.random() * 3 + 1,
            frozen: false
        });
    }
};

TimeDilationPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    
    // Charge phase
    if (this.elapsed < 2.0) {
        var progress = this.elapsed / 2.0;
        this.screenShake = progress * 3;
    } else {
        this.screenShake = 0;
        // Sweep phase
        this.hand1Speed = 1.2 + Math.sin(this.elapsed * 2) * 0.5; // Variable speed
        this.hand2Speed = -0.8 - Math.cos(this.elapsed * 1.5) * 0.4;
        
        this.hand1Angle += this.hand1Speed * dt;
        this.hand2Angle += this.hand2Speed * dt;
    }
    
    var bb = Cbbox.getBound();
    for (var i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        
        // Check if near a hand to "freeze"
        var dx = p.x - this.centerX;
        var dy = p.y - this.centerY;
        var pAngle = Math.atan2(dy, dx);
        
        // Normalize angles
        var diff1 = Math.abs(this.normalizeAngle(pAngle - this.hand1Angle));
        var diff2 = Math.abs(this.normalizeAngle(pAngle - this.hand2Angle));
        
        if (this.elapsed > 2.0 && (diff1 < 0.2 || diff2 < 0.2)) {
            p.frozen = true;
        } else {
            p.frozen = false;
        }
        
        if (!p.frozen) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }
        
        if (p.x < bb[0]) p.x = bb[2];
        if (p.x > bb[2]) p.x = bb[0];
        if (p.y < bb[1]) p.y = bb[3];
        if (p.y > bb[3]) p.y = bb[1];
    }
};

TimeDilationPattern.prototype.normalizeAngle = function(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
};

TimeDilationPattern.prototype.draw = function(ctx) {
    ctx.save();
    
    if (this.screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
    }
    
    var bb = Cbbox.getBound();
    
    // Draw particles
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        ctx.fillStyle = p.frozen ? "rgba(0, 255, 255, 0.9)" : "rgba(100, 200, 255, 0.4)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw clock face background outline
    ctx.strokeStyle = "rgba(255, 215, 0, 0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, Math.min(bb[2]-bb[0], bb[3]-bb[1])/2 * 0.9, 0, Math.PI * 2);
    ctx.stroke();
    
    if (this.elapsed < 2.0) {
        // Telegraph
        var progress = this.elapsed / 2.0;
        ctx.strokeStyle = "rgba(255, 0, 0, " + (progress * 0.8) + ")";
        ctx.lineWidth = 2 + progress * 5;
        
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY);
        ctx.lineTo(this.centerX + Math.cos(this.hand1Angle) * this.hand1Length, this.centerY + Math.sin(this.hand1Angle) * this.hand1Length);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY);
        ctx.lineTo(this.centerX + Math.cos(this.hand2Angle) * this.hand2Length, this.centerY + Math.sin(this.hand2Angle) * this.hand2Length);
        ctx.stroke();
        
        // Intense core charging
        var coreR = 10 + progress * 30;
        var grad = ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, coreR);
        grad.addColorStop(0, "rgba(255, 255, 255, 1)");
        grad.addColorStop(0.5, "rgba(255, 215, 0, 0.8)");
        grad.addColorStop(1, "rgba(255, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, coreR, 0, Math.PI * 2);
        ctx.fill();
        
    } else {
        // Active Lasers
        var drawLaser = function(angle, length, intensity) {
            ctx.shadowBlur = 20 * intensity;
            ctx.shadowColor = "#00FFFF";
            
            var ex = this.centerX + Math.cos(angle) * length;
            var ey = this.centerY + Math.sin(angle) * length;
            
            // Outer glow
            ctx.strokeStyle = "rgba(0, 150, 255, 0.6)";
            ctx.lineWidth = 20 * intensity;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(this.centerX, this.centerY);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            
            // Inner core
            ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
            ctx.lineWidth = 6 * intensity;
            ctx.shadowBlur = 0;
            ctx.stroke();
        }.bind(this);
        
        drawLaser(this.hand1Angle, this.hand1Length, 1.0 + Math.random() * 0.2);
        drawLaser(this.hand2Angle, this.hand2Length, 1.0 + Math.random() * 0.2);
        
        // Center node
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#FFD700";
        ctx.fillStyle = "#FFF";
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 12, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
};

TimeDilationPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    if (this.elapsed < 2.0) return 0;
    
    var cx = sx + sw/2;
    var cy = sy + sh/2;
    var dx = cx - this.centerX;
    var dy = cy - this.centerY;
    var pAngle = Math.atan2(dy, dx);
    
    var diff1 = Math.abs(this.normalizeAngle(pAngle - this.hand1Angle));
    var diff2 = Math.abs(this.normalizeAngle(pAngle - this.hand2Angle));
    
    // Beam width threshold (~15 pixels thick collision)
    // distance * angle diff ~= arc length
    var dist = Math.sqrt(dx*dx + dy*dy);
    var arcLength1 = dist * diff1;
    var arcLength2 = dist * diff2;
    
    if (arcLength1 < 10 || arcLength2 < 10) {
        return this.damVal;
    }
    return 0;
};

TimeDilationPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};
