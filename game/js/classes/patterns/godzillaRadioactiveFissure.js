// godzillaRadioactiveFissure.js — Fissures on the floor erupt into nuclear fire columns, accompanied by falling radioactive embers
var GodzillaRadioactiveFissurePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 9; // High eruptive damage
    
    this.fissures = [];
    this.bullets = [];
    
    this.spawnTimer = 0;
    this.spawnInterval = 1.8; // Fissures erupt every 1.8 seconds
    
    this.emberTimer = 0;
    this.emberInterval = 0.25; // Continuous small falling embers
};

GodzillaRadioactiveFissurePattern.prototype = Object.create(BulletPattern.prototype);

GodzillaRadioactiveFissurePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 1.0; // Erupt first set of fissures quickly
    this.emberTimer = 0;
    this.fissures = [];
    this.bullets = [];
};

GodzillaRadioactiveFissurePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    this.emberTimer += dt;
    
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];
    
    // 1. Spawn floor fissures
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        
        // Spawn 2 fissures at random X positions
        var fx1 = bb[0] + boxW * (0.15 + Math.random() * 0.25);
        var fx2 = bb[0] + boxW * (0.60 + Math.random() * 0.25);
        
        var warnTime = 0.70;
        
        this.fissures.push({
            x: fx1, width: 22,
            warningTimer: warnTime, activeTimer: 0.6,
            elapsed: 0, erupted: false
        });
        
        this.fissures.push({
            x: fx2, width: 22,
            warningTimer: warnTime, activeTimer: 0.6,
            elapsed: 0, erupted: false
        });
        
        Sound.playSound("flash", true);
    }
    
    // 2. Continuous falling embers rain down
    if (this.emberTimer >= this.emberInterval && this.elapsed < this.duration - 1.0) {
        this.emberTimer = 0;
        
        var isMeltdown = (this.battleBox && Cgroup.getBossId() === "godzilla" && Cgroup.getEnemy(0) && Cgroup.getEnemy(0).renderType === "godzilla_meltdown");
        var emberColor = isMeltdown ? "#FF00E5" : "#00FFDD"; // Neon purple vs Cyan
        
        this.bullets.push(new Bullet({
            x: bb[0] + 10 + Math.random() * (boxW - 25),
            y: bb[1] - 10,
            width: 10, height: 10, speed: 0,
            damVal: 3, // Embers do low damage
            rotation: 0, fadeSpeed: 1.0,
            color: emberColor,
            vx: (Math.random() - 0.5) * 60,
            vy: 150 + Math.random() * 60,
            useVelocity: true,
            isEmber: true
        }));
    }
    
    // 3. Update fissures
    for (var i = this.fissures.length - 1; i >= 0; i--) {
        var f = this.fissures[i];
        f.elapsed += dt;
        
        if (f.elapsed >= f.warningTimer && !f.erupted) {
            f.erupted = true;
            Sound.playSound("impact", true);
            if (typeof triggerShake === "function") triggerShake(4, 120);
        }
        
        if (f.elapsed >= f.warningTimer + f.activeTimer) {
            this.fissures.splice(i, 1);
        }
    }
    
    // Update active embers
    BulletPattern.prototype.update.call(this, dt);
    
    // Remove out-of-bounds bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        if (this.bullets[i].isOutOfBounds([bb[0] - 20, bb[1] - 20, bb[2] + 20, bb[3] + 20])) {
            this.bullets.splice(i, 1);
        }
    }
};

GodzillaRadioactiveFissurePattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var boxH = bb[3] - bb[1];
    
    ctx.save();
    
    var isMeltdown = (this.battleBox && Cgroup.getBossId() === "godzilla" && Cgroup.getEnemy(0) && Cgroup.getEnemy(0).renderType === "godzilla_meltdown");
    var fireOuter = isMeltdown ? "rgba(255, 0, 160, 0.85)" : "rgba(0, 160, 255, 0.85)";
    var fireInner = isMeltdown ? "rgba(255, 220, 240, 0.95)" : "rgba(220, 240, 255, 0.95)";
    
    // 1. Draw Fissures / Columns
    for (var i = 0; i < this.fissures.length; i++) {
        var f = this.fissures[i];
        
        if (!f.erupted) {
            // Draw warning column outline on floor and rising line
            var progress = f.elapsed / f.warningTimer;
            var wAlpha = 0.15 + Math.sin(f.elapsed * 20) * 0.1;
            
            ctx.save();
            ctx.fillStyle = "rgba(255, 0, 0, " + wAlpha + ")";
            ctx.strokeStyle = "rgba(255, 0, 0, 0.6)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            
            // Draw warning box
            ctx.fillRect(f.x - f.width / 2, bb[1], f.width, boxH);
            ctx.strokeRect(f.x - f.width / 2, bb[1], f.width, boxH);
            
            // Fissure cracks on floor starting to glow
            ctx.strokeStyle = fireOuter;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(f.x - f.width / 2, bb[3]);
            ctx.lineTo(f.x - f.width * 0.2, bb[3] - 8);
            ctx.lineTo(f.x + f.width * 0.2, bb[3] - 2);
            ctx.lineTo(f.x + f.width / 2, bb[3]);
            ctx.stroke();
            
            ctx.restore();
        } else {
            // Draw erupting columns of atomic fire!
            var lifeRemaining = (f.warningTimer + f.activeTimer) - f.elapsed;
            var scale = Math.min(1.0, lifeRemaining / 0.15);
            var colWidth = f.width * scale;
            
            ctx.save();
            ctx.shadowBlur = 20;
            ctx.shadowColor = fireOuter;
            ctx.fillStyle = fireOuter;
            
            // Main atomic column
            ctx.fillRect(f.x - colWidth / 2, bb[1], colWidth, boxH);
            
            // White-hot center
            ctx.fillStyle = fireInner;
            ctx.fillRect(f.x - colWidth * 0.35, bb[1], colWidth * 0.7, boxH);
            
            // Flare sparks coming off the eruption
            ctx.fillStyle = fireInner;
            for (var sp = 0; sp < 4; sp++) {
                var spy = bb[3] - (sp * 60 + f.elapsed * 120) % boxH;
                var spx = f.x + (Math.sin(spy * 0.1) * colWidth * 0.8);
                ctx.beginPath();
                ctx.arc(spx, spy, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }
    
    // 2. Draw falling embers
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active || !b.isEmber) continue;
        
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        
        var cx = b.x + b.width / 2;
        var cy = b.y + b.height / 2;
        var r = b.width / 2;
        
        ctx.beginPath();
        // Embers are small squares rotated for a glowing spark effect
        ctx.translate(cx, cy);
        ctx.rotate(this.elapsed * 5 + i);
        ctx.fillRect(-r, -r, b.width, b.height);
        
        ctx.fillStyle = "#FFF";
        ctx.fillRect(-r * 0.4, -r * 0.4, b.width * 0.4, b.height * 0.4);
        ctx.restore();
    }
    
    ctx.restore();
};

GodzillaRadioactiveFissurePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var playerCenterX = sx + sw / 2;
    
    // 1. Check Collision with erupting Columns
    for (var i = 0; i < this.fissures.length; i++) {
        var f = this.fissures[i];
        if (!f.erupted) continue;
        
        // Eruption fills entire height of column
        var halfWidth = f.width / 2;
        if (playerCenterX >= f.x - halfWidth - 3 && playerCenterX <= f.x + halfWidth + 3) {
            return this.damVal;
        }
    }
    
    // 2. Check collision with falling embers
    return BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
};

GodzillaRadioactiveFissurePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.fissures.length === 0 && this.bullets.length === 0;
};
