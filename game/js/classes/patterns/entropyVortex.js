// entropyVortex.js — Paradoja Phase 3: Massive collapsing black hole firing plasma jets
var EntropyVortexPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 9;
    this.elapsed = 0;
    this.damVal = config.damVal || 10;
    
    this.centerX = 0;
    this.centerY = 0;
    
    this.vortexRadius = 0;
    this.maxVortexRadius = 60;
    this.particles = [];
    this.jets = [];
    
    this.screenShake = 0;
};

EntropyVortexPattern.prototype = Object.create(BulletPattern.prototype);

EntropyVortexPattern.prototype.generateBullets = function(battleBox) {
    this.elapsed = 0;
    this.centerX = (battleBox[0] + battleBox[2]) / 2;
    this.centerY = (battleBox[1] + battleBox[3]) / 2;
    
    this.vortexRadius = 0;
    this.particles = [];
    this.jets = [];
    
    // Spawn ambient light particles to be sucked in
    for (var i = 0; i < 150; i++) {
        var angle = Math.random() * Math.PI * 2;
        var dist = 50 + Math.random() * 300;
        this.particles.push({
            x: this.centerX + Math.cos(angle) * dist,
            y: this.centerY + Math.sin(angle) * dist,
            angle: angle,
            dist: dist,
            speed: 20 + Math.random() * 50,
            size: 1 + Math.random() * 2
        });
    }
};

EntropyVortexPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    
    // Grow vortex
    if (this.elapsed < 2.0) {
        this.vortexRadius = (this.elapsed / 2.0) * this.maxVortexRadius;
        this.screenShake = this.elapsed * 2;
    } else {
        this.vortexRadius = this.maxVortexRadius + Math.sin(this.elapsed * 10) * 5;
        this.screenShake = 4;
        
        // Fire Plasma Jets
        if (Math.random() < 0.15) {
            this.jets.push({
                angle: Math.random() * Math.PI * 2,
                life: 0.8,
                maxLife: 0.8,
                width: 15 + Math.random() * 20
            });
        }
    }
    
    // Update jets
    for (var j = this.jets.length - 1; j >= 0; j--) {
        this.jets[j].life -= dt;
        if (this.jets[j].life <= 0) {
            this.jets.splice(j, 1);
        }
    }
    
    // Update particles (sucked into vortex)
    for (var i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        p.dist -= p.speed * dt;
        p.angle += (50 / Math.max(10, p.dist)) * dt; // Spin faster as they get closer
        
        p.x = this.centerX + Math.cos(p.angle) * p.dist;
        p.y = this.centerY + Math.sin(p.angle) * p.dist;
        
        if (p.dist < this.vortexRadius * 0.8) {
            // Respawn outside
            p.angle = Math.random() * Math.PI * 2;
            p.dist = 300 + Math.random() * 100;
            p.x = this.centerX + Math.cos(p.angle) * p.dist;
            p.y = this.centerY + Math.sin(p.angle) * p.dist;
        }
    }
};

EntropyVortexPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();
    
    if (this.screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
    }
    
    // Draw grid warp effect
    ctx.strokeStyle = "rgba(0, 100, 200, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    var warpStr = this.vortexRadius * 2;
    for (var y = bb[1]; y <= bb[3]; y += 20) {
        ctx.moveTo(bb[0], y);
        for (var x = bb[0]; x <= bb[2]; x += 10) {
            var dx = x - this.centerX;
            var dy = y - this.centerY;
            var dist = Math.max(1, Math.sqrt(dx*dx + dy*dy));
            var pull = warpStr / dist;
            ctx.lineTo(x - (dx/dist)*pull*10, y - (dy/dist)*pull*10);
        }
    }
    for (var x = bb[0]; x <= bb[2]; x += 20) {
        ctx.moveTo(x, bb[1]);
        for (var y = bb[1]; y <= bb[3]; y += 10) {
            var dx = x - this.centerX;
            var dy = y - this.centerY;
            var dist = Math.max(1, Math.sqrt(dx*dx + dy*dy));
            var pull = warpStr / dist;
            ctx.lineTo(x - (dx/dist)*pull*10, y - (dy/dist)*pull*10);
        }
    }
    ctx.stroke();
    
    ctx.globalCompositeOperation = "lighter";
    
    // Draw jets
    for (var j = 0; j < this.jets.length; j++) {
        var jet = this.jets[j];
        var alpha = jet.life / jet.maxLife;
        
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(jet.angle);
        
        // Jet core
        ctx.fillStyle = "rgba(255, 255, 255, " + alpha + ")";
        ctx.fillRect(this.vortexRadius, -jet.width/4, 800, jet.width/2);
        
        // Jet outer
        var grad = ctx.createLinearGradient(0, -jet.width/2, 0, jet.width/2);
        grad.addColorStop(0, "rgba(0, 200, 255, 0)");
        grad.addColorStop(0.5, "rgba(0, 150, 255, " + (alpha * 0.8) + ")");
        grad.addColorStop(1, "rgba(0, 200, 255, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(this.vortexRadius, -jet.width/2, 800, jet.width);
        
        ctx.restore();
    }
    
    // Draw particles
    for (var i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        ctx.fillStyle = "rgba(150, 200, 255, " + (Math.min(1, p.dist/100)) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Trail
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = p.size * 0.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(this.centerX + Math.cos(p.angle - 0.2) * (p.dist + 10), this.centerY + Math.sin(p.angle - 0.2) * (p.dist + 10));
        ctx.stroke();
    }
    
    ctx.globalCompositeOperation = "source-over";
    
    // Draw Event Horizon (Black Hole)
    if (this.vortexRadius > 0) {
        // Outer glow
        var glowGrad = ctx.createRadialGradient(this.centerX, this.centerY, this.vortexRadius, this.centerX, this.centerY, this.vortexRadius + 30);
        glowGrad.addColorStop(0, "rgba(255, 255, 255, 0.8)");
        glowGrad.addColorStop(0.3, "rgba(0, 100, 255, 0.5)");
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.vortexRadius + 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Accretion disk
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.elapsed * 5);
        ctx.scale(1, 0.3);
        ctx.strokeStyle = "rgba(0, 255, 255, 0.8)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, this.vortexRadius * 1.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        
        // Black core
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.vortexRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
};

EntropyVortexPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    if (this.elapsed < 2.0) return 0;
    
    var cx = sx + sw/2;
    var cy = sy + sh/2;
    
    // Check collision with the black hole core
    var dx = cx - this.centerX;
    var dy = cy - this.centerY;
    var dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist < this.vortexRadius + sw/2) {
        return this.damVal; // Instant death or heavy damage if touching core
    }
    
    // Check collision with Jets
    var soulAngle = Math.atan2(dy, dx);
    for (var i = 0; i < this.jets.length; i++) {
        var jet = this.jets[i];
        
        var diff = Math.abs(soulAngle - jet.angle);
        while (diff > Math.PI) diff -= Math.PI * 2;
        diff = Math.abs(diff);
        
        // If soul is within the jet's angular width
        var arcLen = dist * diff;
        if (arcLen < jet.width / 2 + sw/2) {
            return this.damVal;
        }
    }
    
    // Soul pull effect (doesn't return damage, just moves soul)
    // Wait, patterns can't easily move the soul in checkCollision.
    // Let's implement soul pull in Combat.js later or assume it's just visual.
    // I can modify soul coords directly since sx,sy are just copies. Actually I need Soul.setPos().
    if (typeof Soul !== 'undefined') {
        var pullForce = (this.vortexRadius * 50) / Math.max(10, dist);
        var sPos = Soul.getPos();
        sPos.x -= (dx/dist) * pullForce * 0.016; // approx dt
        sPos.y -= (dy/dist) * pullForce * 0.016;
        Soul.setPos(sPos.x, sPos.y);
    }
    
    return 0;
};

EntropyVortexPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};
