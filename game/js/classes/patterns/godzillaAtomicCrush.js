// godzillaAtomicCrush.js — Godzilla's jaws/claws slam shut, leaving radioactive gas clouds
var GodzillaAtomicCrushPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 10; // high impact damage
    
    this.crushes = [];
    this.bullets = [];
    
    this.crushTimer = 0;
    this.crushInterval = 2.2; // A crush clamp every 2.2 seconds
};

GodzillaAtomicCrushPattern.prototype = Object.create(BulletPattern.prototype);

GodzillaAtomicCrushPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.crushTimer = 1.2; // Start quickly
    this.crushes = [];
    this.bullets = [];
};

GodzillaAtomicCrushPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.crushTimer += dt;
    
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];
    var cx = bb[0] + boxW / 2;
    var cy = bb[1] + boxH / 2;
    
    // 1. Spawn a new crush clamp
    if (this.crushTimer >= this.crushInterval && this.elapsed < this.duration - 1.8) {
        this.crushTimer = 0;
        
        // Random crush direction: 0 = Horizontal clamp (top & bottom jaw), 1 = Vertical clamp (left & right claws)
        var dir = Math.random() < 0.5 ? 0 : 1;
        var warn = 0.8;
        
        this.crushes.push({
            dirType: dir,
            warningTimer: warn,
            activeTimer: 0.3,
            elapsed: 0,
            triggered: false
        });
        
        Sound.playSound("flash", true);
    }
    
    // 2. Update crushes
    for (var i = this.crushes.length - 1; i >= 0; i--) {
        var c = this.crushes[i];
        c.elapsed += dt;
        
        if (c.elapsed >= c.warningTimer && !c.triggered) {
            c.triggered = true;
            Sound.playSound("impact", true);
            if (typeof triggerShake === "function") triggerShake(6, 150);
            
            // Spawn radioactive gas cloud bullets on impact!
            var isMeltdown = (this.battleBox && Cgroup.getBossId() === "godzilla" && Cgroup.getEnemy(0) && Cgroup.getEnemy(0).renderType === "godzilla_meltdown");
            var gasColor = isMeltdown ? "rgba(255, 0, 150, 0.45)" : "rgba(0, 220, 100, 0.45)"; // Pink for meltdown, green normally
            
            // Spawn 5 toxic gas clouds in random directions from center
            for (var g = 0; g < 5; g++) {
                var angle = (g / 5) * Math.PI * 2 + Math.random() * 0.5;
                var speed = 40 + Math.random() * 40;
                
                this.bullets.push(new Bullet({
                    x: cx - 15,
                    y: cy - 15,
                    width: 30,
                    height: 30,
                    speed: 0,
                    damVal: 4, // Gas clouds do minor contact damage
                    rotation: Math.random() * Math.PI,
                    fadeSpeed: 0.35, // slowly fades out over ~2.8 seconds
                    color: gasColor,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    useVelocity: true,
                    isGas: true,
                    timeAlive: 0
                }));
            }
        }
        
        if (c.elapsed >= c.warningTimer + c.activeTimer) {
            this.crushes.splice(i, 1);
        }
    }
    
    // 3. Update gas cloud bullets and apply custom drift
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        if (b.isGas) {
            b.timeAlive = (b.timeAlive || 0) + dt;
            b.fadeTick = Math.max(0, 1.0 - b.timeAlive * 0.4);
            // Slowly increase size as cloud expands
            b.width = 30 + b.timeAlive * 18;
            b.height = 30 + b.timeAlive * 18;
            b.x -= dt * 9; // slight drift
            
            if (b.fadeTick <= 0.05) {
                b.active = false;
                this.bullets.splice(i, 1);
            }
        }
    }
    
    // Filter out-of-bounds
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        if (b.isOutOfBounds([bb[0] - 50, bb[1] - 50, bb[2] + 50, bb[3] + 50])) {
            this.bullets.splice(i, 1);
        }
    }
};

GodzillaAtomicCrushPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];
    var cx = bb[0] + boxW / 2;
    var cy = bb[1] + boxH / 2;
    
    ctx.save();
    
    var isMeltdown = (this.battleBox && Cgroup.getBossId() === "godzilla" && Cgroup.getEnemy(0) && Cgroup.getEnemy(0).renderType === "godzilla_meltdown");
    var energyColor = isMeltdown ? "rgba(255, 0, 160, 0.8)" : "rgba(0, 160, 255, 0.8)";
    
    // 1. Draw Crushes
    for (var i = 0; i < this.crushes.length; i++) {
        var c = this.crushes[i];
        
        if (!c.triggered) {
            // Draw warning lines expanding inwards
            var progress = c.elapsed / c.warningTimer;
            var gap = (1 - progress) * 60; // moves inwards
            
            ctx.save();
            ctx.strokeStyle = "rgba(255, 0, 0, 0.55)";
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 4]);
            
            if (c.dirType === 0) {
                // Horizontal (top & bottom jaw clamps)
                ctx.beginPath();
                ctx.moveTo(bb[0], cy - gap); ctx.lineTo(bb[2], cy - gap);
                ctx.moveTo(bb[0], cy + gap); ctx.lineTo(bb[2], cy + gap);
                ctx.stroke();
                
                // Draw indicators pointing inwards
                ctx.fillStyle = "rgba(255, 0, 0, 0.12)";
                ctx.fillRect(bb[0], bb[1], boxW, cy - gap - bb[1]);
                ctx.fillRect(bb[0], cy + gap, boxW, bb[3] - (cy + gap));
            } else {
                // Vertical (left & right claw clamps)
                ctx.beginPath();
                ctx.moveTo(cx - gap, bb[1]); ctx.lineTo(cx - gap, bb[3]);
                ctx.moveTo(cx + gap, bb[1]); ctx.lineTo(cx + gap, bb[3]);
                ctx.stroke();
                
                // Draw indicators pointing inwards
                ctx.fillStyle = "rgba(255, 0, 0, 0.12)";
                ctx.fillRect(bb[0], bb[1], cx - gap - bb[0], boxH);
                ctx.fillRect(cx + gap, bb[1], bb[2] - (cx + gap), boxH);
            }
            ctx.restore();
        } else {
            // Draw active crush effect (visual teeth or jaw gates slamming)
            var activeProgress = (c.elapsed - c.warningTimer) / c.activeTimer;
            var opacity = 1.0 - activeProgress;
            ctx.save();
            ctx.fillStyle = energyColor;
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 2;
            ctx.globalAlpha = opacity;
            
            if (c.dirType === 0) {
                // Horizontal jaws slamming together at center Y
                ctx.fillRect(bb[0], cy - 18, boxW, 36);
                
                // Jagged teeth lines
                ctx.fillStyle = "#FFFFFF";
                for (var x = bb[0]; x < bb[2]; x += 16) {
                    ctx.beginPath();
                    ctx.moveTo(x, cy - 18);
                    ctx.lineTo(x + 8, cy);
                    ctx.lineTo(x + 16, cy - 18);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.moveTo(x, cy + 18);
                    ctx.lineTo(x + 8, cy);
                    ctx.lineTo(x + 16, cy + 18);
                    ctx.closePath();
                    ctx.fill();
                }
            } else {
                // Vertical claws slamming together at center X
                ctx.fillRect(cx - 18, bb[1], 36, boxH);
                
                // Jagged teeth lines
                ctx.fillStyle = "#FFFFFF";
                for (var y = bb[1]; y < bb[3]; y += 16) {
                    ctx.beginPath();
                    ctx.moveTo(cx - 18, y);
                    ctx.lineTo(cx, y + 8);
                    ctx.lineTo(cx - 18, y + 16);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.moveTo(cx + 18, y);
                    ctx.lineTo(cx, y + 8);
                    ctx.lineTo(cx + 18, y + 16);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            ctx.restore();
        }
    }
    
    // 2. Draw toxic gas cloud bullets
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        
        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        
        var bx = b.x + b.width / 2;
        var by = b.y + b.height / 2;
        var br = b.width / 2;
        
        // Multi-layered smoky glow
        var cloudGrad = ctx.createRadialGradient(bx, by, br * 0.1, bx, by, br);
        cloudGrad.addColorStop(0, "rgba(255, 255, 255, 0.75)");
        cloudGrad.addColorStop(0.3, b.color);
        cloudGrad.addColorStop(1, "rgba(0,0,0,0)");
        
        ctx.fillStyle = cloudGrad;
        ctx.beginPath();
        // Draw bumpy cloud shape
        for (var angle = 0; angle < Math.PI * 2; angle += 0.5) {
            var bump = 1.0 + Math.sin(angle * 5 + b.timeAlive * 3) * 0.15;
            var px = bx + Math.cos(angle) * br * bump;
            var py = by + Math.sin(angle) * br * bump;
            if (angle === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    ctx.restore();
};

GodzillaAtomicCrushPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];
    var cx = bb[0] + boxW / 2;
    var cy = bb[1] + boxH / 2;
    
    var playerCenterX = sx + sw / 2;
    var playerCenterY = sy + sh / 2;
    
    // 1. Check Collision with slamming crush jaws
    for (var i = 0; i < this.crushes.length; i++) {
        var c = this.crushes[i];
        if (!c.triggered) continue;
        
        // Only active during its clamp window
        if (c.dirType === 0) {
            // Horizontal jaws cover the center Y band (30px total height)
            if (playerCenterY >= cy - 18 && playerCenterY <= cy + 18) {
                return this.damVal;
            }
        } else {
            // Vertical claws cover the center X band (30px total width)
            if (playerCenterX >= cx - 18 && playerCenterX <= cx + 18) {
                return this.damVal;
            }
        }
    }
    
    // 2. Check collision with drifting gas clouds
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active || !b.isGas) continue;
        
        // Approximate radial overlap
        var bx = b.x + b.width / 2;
        var by = b.y + b.height / 2;
        var br = b.width / 2;
        var dist = Math.sqrt((playerCenterX - bx) * (playerCenterX - bx) + (playerCenterY - by) * (playerCenterY - by));
        
        if (dist < br * 0.75 + 4) {
            return b.damVal; // Minor contact tick damage
        }
    }
    
    return 0;
};

GodzillaAtomicCrushPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.crushes.length === 0 && this.bullets.length === 0;
};
