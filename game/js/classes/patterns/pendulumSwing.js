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
    
    this.speed = 1.5; // Slowed down from 2.5
    this.maxAngle = Math.PI / 2.2;
    
    this.sandParticles = [];
    this.angle = 0;
    this.battleBox = null;
    this.particleTimer = 0;
    this.gapStart = 150;
    this.gapSize = 80;
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
    
    // Set a random gap height
    this.gapStart = 80 + Math.random() * (battleBox[3] - battleBox[1] - 80);
};

PendulumSwingPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.particleTimer += dt;
    
    var bb = Cbbox.getBound();
    this.pivotX = (bb[0] + bb[2]) / 2;
    this.pivotY = bb[1];
    
    // Sine wave swing
    this.angle = Math.sin(this.elapsed * this.speed) * this.maxAngle;
    
    // Move gap up and down slowly
    this.gapStart += Math.cos(this.elapsed * 2) * 50 * dt;
    if (this.gapStart < 50) this.gapStart = 50;
    if (this.gapStart > bb[3] - bb[1]) this.gapStart = bb[3] - bb[1];
    
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
    
    // Draw pendulum with motion blur
    // Calculate angular velocity for blur strength
    var angularVelocity = Math.cos(this.elapsed * this.speed) * this.maxAngle * this.speed;
    var blurStrength = Math.abs(angularVelocity);
    
    var numBlurs = Math.floor(blurStrength * 4) + 1;
    for (var b = 0; b < numBlurs; b++) {
        ctx.save();
        ctx.translate(this.pivotX, this.pivotY);
        // Interpolate angle for blur
        var bAngle = this.angle - (angularVelocity * 0.05 * (b/numBlurs));
        ctx.rotate(bAngle);
        
        ctx.globalAlpha = b === 0 ? 1.0 : (0.4 / numBlurs);
        
        if (b === 0) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#00FFFF";
        } else {
            ctx.shadowBlur = 0;
        }
        
        // Metallic blade gradient
        var grad = ctx.createLinearGradient(-this.thickness, 0, this.thickness, 0);
        grad.addColorStop(0, "#888888"); // Edge
        grad.addColorStop(0.3, "#E0E0E0"); // Highlight
        grad.addColorStop(0.5, "#FFFFFF"); // Center
        grad.addColorStop(0.7, "#A0A0A0"); // Core shadow
        grad.addColorStop(1, "#666666"); // Edge
        
        ctx.fillStyle = grad;
        
        // Helper to draw a blade segment
        var drawBladeSegment = function(ctx, yStart, yEnd, t) {
            ctx.beginPath();
            ctx.moveTo(-t/2, yStart);
            ctx.lineTo(t/2, yStart);
            // Curve down to a point if it's the bottom
            if (yEnd >= this.length - 10) {
                ctx.lineTo(t/4, yEnd - 20);
                ctx.lineTo(0, yEnd + 20); // Sharp point
                ctx.lineTo(-t/4, yEnd - 20);
            } else {
                ctx.lineTo(t/2, yEnd);
                ctx.lineTo(-t/2, yEnd);
            }
            ctx.closePath();
            ctx.fill();
            
            // Neon cyan inner core
            ctx.fillStyle = "#00FFFF";
            ctx.fillRect(-t/8, yStart, t/4, yEnd - yStart);
            ctx.fillStyle = grad; // Reset to metal
        }.bind(this);
        
        // Top part of beam
        drawBladeSegment(ctx, 20, this.gapStart, this.thickness);
        
        // Bottom part of beam
        drawBladeSegment(ctx, this.gapStart + this.gapSize, this.length, this.thickness);
        
        // Safe Zone Indicator (holographic cyan lines framing the gap)
        if (b === 0) {
            ctx.strokeStyle = "rgba(0, 255, 255, 0.8)";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(-this.thickness, this.gapStart);
            ctx.lineTo(this.thickness, this.gapStart);
            ctx.moveTo(-this.thickness, this.gapStart + this.gapSize);
            ctx.lineTo(this.thickness, this.gapStart + this.gapSize);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Pivot joint (Golden gear hub)
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fillStyle = "#B8860B"; // Bronze
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fillStyle = "#FFD700"; // Gold
        ctx.fill();
        ctx.strokeStyle = "#FFF";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
    
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
    
    // Check if within thickness
    if (dist < (this.thickness / 2) + sw / 2) {
        // Distance along the beam
        var distAlong = t * this.length;
        // Check if in gap
        if (distAlong >= this.gapStart && distAlong <= this.gapStart + this.gapSize) {
            return 0; // Safe in the gap
        }
        return this.damVal;
    }
    
    return 0;
};

PendulumSwingPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};
