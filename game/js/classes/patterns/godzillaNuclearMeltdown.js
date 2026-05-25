// godzillaNuclearMeltdown.js — Meltdown critical phase: gravitational pull, rotating spiral plasma arms, expanding ring shockwaves
var GodzillaNuclearMeltdownPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 9;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
    
    this.bullets = [];
    this.rings = [];
    
    this.spawnTimer = 0;
    this.spawnInterval = 0.16; // Rapid spiral bullets
    
    this.ringTimer = 0.5;
    this.ringInterval = 2.4; // Periodic shockwave rings
    
    this.spiralAngle = 0;
    this.pullStrength = 40; // Pixels per second vortex pull strength
};

GodzillaNuclearMeltdownPattern.prototype = Object.create(BulletPattern.prototype);

GodzillaNuclearMeltdownPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.ringTimer = 0.5;
    this.spiralAngle = 0;
    this.rings = [];
    this.bullets = [];
};

GodzillaNuclearMeltdownPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    this.ringTimer += dt;
    
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];
    var cx = bb[0] + boxW / 2;
    var cy = bb[1] + boxH / 2;
    
    // 1. Vortex Gravitational Pull (Pull the player's soul towards the center)
    if (typeof soul !== "undefined" && soul && this.elapsed < this.duration - 0.5) {
        var dx = cx - (soul.x + soul.width / 2);
        var dy = cy - (soul.y + soul.height / 2);
        var dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 15) {
            // Apply force to soul coordinates directly
            var pullX = (dx / dist) * this.pullStrength * dt;
            var pullY = (dy / dist) * this.pullStrength * dt;
            soul.x += pullX;
            soul.y += pullY;
            
            // Constrain to battle box bounds
            soul.x = Math.max(bb[0] + 4, Math.min(bb[2] - soul.width - 4, soul.x));
            soul.y = Math.max(bb[1] + 4, Math.min(bb[3] - soul.height - 4, soul.y));
        }
    }
    
    // 2. Spawn spiral arms of plasma bullets from the center
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        
        // 2-way symmetrical spiral
        this.spiralAngle += 0.35; // rotate spiral
        
        var bulletSpeed = 100;
        for (var arm = 0; arm < 2; arm++) {
            var ang = this.spiralAngle + arm * Math.PI;
            this.bullets.push(new Bullet({
                x: cx - 6,
                y: cy - 6,
                width: 12, height: 12, speed: 0,
                damVal: 5, // medium damage
                rotation: ang, fadeSpeed: 1.0,
                color: "#FF00B2", // Meltdown Rose plasma
                vx: Math.cos(ang) * bulletSpeed,
                vy: Math.sin(ang) * bulletSpeed,
                useVelocity: true,
                isMeltdownParticle: true
            }));
        }
        
        if (Math.random() < 0.15) {
            Sound.playSound("heal", true); // popping sound
        }
    }
    
    // 3. Spawn expanding shockwave rings
    if (this.ringTimer >= this.ringInterval && this.elapsed < this.duration - 2.0) {
        this.ringTimer = 0;
        
        Sound.playSound("flash", true);
        
        var gapAngle = Math.random() * Math.PI * 2;
        var maxR = Math.sqrt(boxW * boxW + boxH * boxH) * 0.7;
        
        this.rings.push({
            cx: cx, cy: cy,
            radius: 8, maxRadius: maxR,
            speed: 130, gapAngle: gapAngle, gapWidth: 1.25, // Large gap to compensate for pull
            color: "rgba(255, 0, 140, 0.75)",
            thickness: 10, opacity: 1.0
        });
    }
    
    // 4. Update expanding rings
    for (var i = this.rings.length - 1; i >= 0; i--) {
        var r = this.rings[i];
        r.radius += r.speed * dt;
        
        if (r.radius > r.maxRadius * 0.75) {
            r.opacity = 1.0 - (r.radius - r.maxRadius * 0.75) / (r.maxRadius * 0.25);
            if (r.opacity < 0) r.opacity = 0;
        }
        
        if (r.radius >= r.maxRadius) {
            this.rings.splice(i, 1);
        }
    }
    
    // Update active bullets
    BulletPattern.prototype.update.call(this, dt);
    
    // Remove out-of-bounds bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        if (b.isOutOfBounds([bb[0] - 25, bb[1] - 25, bb[2] + 25, bb[3] + 25])) {
            this.bullets.splice(i, 1);
        }
    }
};

GodzillaNuclearMeltdownPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];
    var cx = bb[0] + boxW / 2;
    var cy = bb[1] + boxH / 2;
    
    ctx.save();
    
    // Draw vortex ambient background distortion
    var pulse = 0.5 + Math.sin(this.elapsed * 4) * 0.2;
    ctx.save();
    ctx.strokeStyle = "rgba(255, 0, 100, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 30 + pulse * 20, 0, Math.PI * 2);
    ctx.arc(cx, cy, 60 - pulse * 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    
    // 1. Draw expanding shockwave rings
    for (var i = 0; i < this.rings.length; i++) {
        var r = this.rings[i];
        
        ctx.save();
        ctx.globalAlpha = r.opacity;
        ctx.shadowBlur = 10;
        ctx.shadowColor = r.color;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = r.thickness;
        
        var startAngle = r.gapAngle + r.gapWidth / 2;
        var endAngle = r.gapAngle - r.gapWidth / 2;
        
        ctx.beginPath();
        ctx.arc(r.cx, r.cy, r.radius, startAngle, endAngle + Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(r.cx, r.cy, r.radius - 1.5, startAngle + 0.1, endAngle - 0.1 + Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    // 2. Draw rotating spiral plasma fireballs
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        
        var bx = b.x + b.width / 2;
        var by = b.y + b.height / 2;
        var br = b.width / 2;
        
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(bx - 1.5, by - 1.5, br * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    // Center glowing core showing critical overload
    var corePulse = 18 + Math.sin(this.elapsed * 12) * 5;
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#FF0055";
    ctx.fillStyle = "rgba(255, 0, 100, 0.4)";
    ctx.beginPath();
    ctx.arc(cx, cy, corePulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cx, cy, corePulse * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.restore();
};

GodzillaNuclearMeltdownPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var playerCenterX = sx + sw / 2;
    var playerCenterY = sy + sh / 2;
    
    // 1. Check ring collisions
    for (var i = 0; i < this.rings.length; i++) {
        var r = this.rings[i];
        if (r.opacity < 0.25) continue;
        
        var dx = playerCenterX - r.cx;
        var dy = playerCenterY - r.cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        
        var halfThickness = r.thickness / 2;
        if (Math.abs(dist - r.radius) <= halfThickness + 4) {
            var playerAngle = Math.atan2(dy, dx);
            if (playerAngle < 0) playerAngle += Math.PI * 2;
            
            var normGapAngle = r.gapAngle;
            if (normGapAngle < 0) normGapAngle += Math.PI * 2;
            normGapAngle = normGapAngle % (Math.PI * 2);
            
            var angleDiff = Math.abs(playerAngle - normGapAngle);
            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
            
            if (angleDiff > r.gapWidth / 2) {
                return this.damVal; // hit ring!
            }
        }
    }
    
    // 2. Check bullet collisions
    return BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
};

GodzillaNuclearMeltdownPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.rings.length === 0 && this.bullets.length === 0;
};
