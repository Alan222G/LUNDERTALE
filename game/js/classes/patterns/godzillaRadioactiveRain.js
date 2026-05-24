// godzillaRadioactiveRain.js — Radioactive plasma drops rain from the sky, splashing on the ground and creating horizontal waves
var GodzillaRadioactiveRainPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.spawnInterval = config.spawnInterval || 0.40;
    this.damVal = config.damVal || 6;
};

GodzillaRadioactiveRainPattern.prototype = Object.create(BulletPattern.prototype);

GodzillaRadioactiveRainPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.bullets = [];
};

GodzillaRadioactiveRainPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    
    // Spawn falling fireballs
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        
        // Spawn 1 or 2 fireballs
        var count = Math.random() < 0.4 ? 2 : 1;
        for (var c = 0; c < count; c++) {
            this.bullets.push(new Bullet({
                x: bb[0] + 15 + Math.random() * (boxW - 35),
                y: bb[1] - 15,
                width: 14,
                height: 14,
                speed: 0,
                damVal: this.damVal,
                rotation: 0,
                fadeSpeed: 1.0,
                color: "#E200FF", // Magenta/Purple plasma
                vx: (Math.random() - 0.5) * 40,
                vy: 160 + Math.random() * 60,
                useVelocity: true,
                isRaindrop: true // custom flag to detect floor impact
            }));
        }
    }
    
    // Update and check for floor impacts to create splashes
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        
        // Check floor impact
        if (b.isRaindrop && b.y >= bb[3] - b.height - 2) {
            b.active = false;
            this.bullets.splice(i, 1);
            
            // Play impact sound occasionally
            if (Math.random() < 0.3) {
                Sound.playSound("heal", true); // standard UGE impact/pop sound
            }
            
            // Create two horizontal splash bullets
            this.bullets.push(new Bullet({
                x: b.x,
                y: bb[3] - 14,
                width: 10,
                height: 10,
                speed: 0,
                damVal: this.damVal,
                rotation: 0,
                fadeSpeed: 1.0,
                color: "#00E5FF", // Cyan splash
                vx: -130,
                vy: 0,
                useVelocity: true
            }));
            
            this.bullets.push(new Bullet({
                x: b.x,
                y: bb[3] - 14,
                width: 10,
                height: 10,
                speed: 0,
                damVal: this.damVal,
                rotation: 0,
                fadeSpeed: 1.0,
                color: "#00E5FF", // Cyan splash
                vx: 130,
                vy: 0,
                useVelocity: true
            }));
        }
    }
    
    // Clean out-of-bounds bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        if (b.isOutOfBounds([bb[0] - 30, bb[1] - 30, bb[2] + 30, bb[3] + 30])) {
            this.bullets.splice(i, 1);
        }
    }
    
    this.finished = this.isOver();
};

GodzillaRadioactiveRainPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    
    ctx.save();
    
    var isMeltdown = (this.battleBox && Cgroup.getBossId() === "godzilla" && Cgroup.getEnemy(0) && Cgroup.getEnemy(0).renderType === "godzilla_meltdown");
    var bulletGlow = isMeltdown ? "rgba(255, 0, 160, 0.7)" : "rgba(0, 180, 255, 0.7)";
    
    // Draw all active bullets
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        
        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.shadowBlur = 8;
        ctx.shadowColor = b.isRaindrop ? bulletGlow : "rgba(0, 229, 255, 0.6)";
        ctx.fillStyle = b.color;
        
        var cx = b.x + b.width / 2;
        var cy = b.y + b.height / 2;
        var r = b.width / 2;
        
        ctx.beginPath();
        if (b.isRaindrop) {
            // Elongated falling teardrop shape
            ctx.ellipse(cx, cy, r * 0.8, r * 1.4, 0, 0, Math.PI * 2);
        } else {
            // Small round splash bullet
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
        }
        ctx.fill();
        
        // Inner white shine
        ctx.fillStyle = "#FFF";
        ctx.beginPath();
        ctx.arc(cx, cy - (b.isRaindrop ? 2 : 0), r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    ctx.restore();
};

GodzillaRadioactiveRainPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
