// coreEruption.js — Sachiel Phase 2: Devastating omnidirectional blast from the core
var CoreEruptionPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 12;
    
    this.centerX = 0;
    this.centerY = 0;
    this.chargeTime = 2.0;
    
    this.beams = [];
    this.particles = [];
    this.screenShake = 0;
};

CoreEruptionPattern.prototype = Object.create(BulletPattern.prototype);

CoreEruptionPattern.prototype.generateBullets = function(battleBox) {
    this.elapsed = 0;
    this.centerX = (battleBox[0] + battleBox[2]) / 2;
    this.centerY = (battleBox[1] + battleBox[3]) / 2 - 50; // High up, coming from the core
    
    this.beams = [];
    var numBeams = 6 + Math.floor(Math.random() * 4);
    var angleOffset = Math.random() * Math.PI;
    
    for (var i = 0; i < numBeams; i++) {
        this.beams.push({
            angle: angleOffset + (i / numBeams) * Math.PI * 2,
            width: 0,
            maxWidth: 30 + Math.random() * 20
        });
    }
    
    this.particles = [];
};

CoreEruptionPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    var bb = Cbbox.getBound();
    
    if (this.elapsed < this.chargeTime) {
        var progress = this.elapsed / this.chargeTime;
        this.screenShake = progress * 2;
        
        // Spawn charge particles
        if (Math.random() < 0.5) {
            var angle = Math.random() * Math.PI * 2;
            var dist = 100 + Math.random() * 100;
            this.particles.push({
                x: this.centerX + Math.cos(angle) * dist,
                y: this.centerY + Math.sin(angle) * dist,
                vx: -Math.cos(angle) * 100,
                vy: -Math.sin(angle) * 100,
                life: 1.0
            });
        }
    } else {
        // Firing
        var fireTime = this.elapsed - this.chargeTime;
        this.screenShake = Math.max(0, 5 - fireTime * 2);
        
        // Spin the beams
        for (var i = 0; i < this.beams.length; i++) {
            var b = this.beams[i];
            b.angle += 0.5 * dt; // Spin
            
            if (fireTime < 0.2) {
                b.width = (fireTime / 0.2) * b.maxWidth;
            } else if (this.duration - this.elapsed < 0.5) {
                var fade = (this.duration - this.elapsed) / 0.5;
                b.width = b.maxWidth * fade;
            } else {
                b.width = b.maxWidth;
            }
        }
    }
    
    // Update particles
    for (var j = this.particles.length - 1; j >= 0; j--) {
        var p = this.particles[j];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) {
            this.particles.splice(j, 1);
        }
    }
};

CoreEruptionPattern.prototype.draw = function(ctx) {
    ctx.save();
    
    if (this.screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
    }
    
    var bb = Cbbox.getBound();
    ctx.globalCompositeOperation = "lighter";
    
    if (this.elapsed < this.chargeTime) {
        var progress = this.elapsed / this.chargeTime;
        
        // Core charge glow
        var grad = ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, 50 * progress);
        grad.addColorStop(0, "rgba(255, 0, 0, 1)");
        grad.addColorStop(0.5, "rgba(255, 100, 0, 0.5)");
        grad.addColorStop(1, "rgba(255, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 50 * progress, 0, Math.PI * 2);
        ctx.fill();
        
        // Particles
        ctx.fillStyle = "rgba(255, 50, 0, 0.8)";
        for (var j = 0; j < this.particles.length; j++) {
            var p = this.particles[j];
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Telegraph lines
        if (progress > 0.5) {
            ctx.strokeStyle = "rgba(255, 0, 0, " + (progress - 0.5) * 2 + ")";
            ctx.lineWidth = 1;
            for (var i = 0; i < this.beams.length; i++) {
                var angle = this.beams[i].angle;
                ctx.beginPath();
                ctx.moveTo(this.centerX, this.centerY);
                ctx.lineTo(this.centerX + Math.cos(angle) * 800, this.centerY + Math.sin(angle) * 800);
                ctx.stroke();
            }
        }
        
    } else {
        // Massive Beams
        for (var i = 0; i < this.beams.length; i++) {
            var b = this.beams[i];
            if (b.width <= 0) continue;
            
            ctx.save();
            ctx.translate(this.centerX, this.centerY);
            ctx.rotate(b.angle);
            
            // Outer glow
            var bGrad = ctx.createLinearGradient(0, -b.width/2, 0, b.width/2);
            bGrad.addColorStop(0, "rgba(255, 0, 0, 0)");
            bGrad.addColorStop(0.3, "rgba(255, 50, 0, 0.8)");
            bGrad.addColorStop(0.5, "rgba(255, 255, 255, 1)");
            bGrad.addColorStop(0.7, "rgba(255, 50, 0, 0.8)");
            bGrad.addColorStop(1, "rgba(255, 0, 0, 0)");
            
            ctx.fillStyle = bGrad;
            ctx.fillRect(0, -b.width/2, 800, b.width);
            
            ctx.restore();
        }
        
        // Flash overlay at start of blast
        var fireTime = this.elapsed - this.chargeTime;
        if (fireTime < 0.2) {
            ctx.fillStyle = "rgba(255, 100, 100, " + (1 - fireTime/0.2) + ")";
            ctx.fillRect(bb[0], bb[1], bb[2]-bb[0], bb[3]-bb[1]);
        }
    }
    
    ctx.restore();
};

CoreEruptionPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    if (this.elapsed < this.chargeTime) return 0;
    
    var cx = sx + sw/2;
    var cy = sy + sh/2;
    
    var dx = cx - this.centerX;
    var dy = cy - this.centerY;
    var dist = Math.sqrt(dx*dx + dy*dy);
    var pAngle = Math.atan2(dy, dx);
    
    for (var i = 0; i < this.beams.length; i++) {
        var b = this.beams[i];
        
        var diff = Math.abs(pAngle - b.angle);
        while (diff > Math.PI) diff -= Math.PI * 2;
        diff = Math.abs(diff);
        
        var arcLength = dist * diff;
        if (arcLength < b.width / 2 + sw/2) {
            return this.damVal;
        }
    }
    
    return 0;
};

CoreEruptionPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};
