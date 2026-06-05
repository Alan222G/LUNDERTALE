// godzillaAtomicSpit.js — Atomic Spit attack for Godzilla Phase 2.
// Godzilla spits heavy atomic fireballs that bounce off the box boundaries, splitting into two smaller projectiles on the first bounce.
var GodzillaAtomicSpitPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    
    this.spitTimer = 0;
    this.spitInterval = 1.3; // Spit a fireball every 1.3s
    this.bullets = [];
};

GodzillaAtomicSpitPattern.prototype = Object.create(BulletPattern.prototype);

GodzillaAtomicSpitPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spitTimer = 0.5; // Spit first ball quickly
    this.bullets = [];
};

GodzillaAtomicSpitPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spitTimer += dt;
    
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];
    
    // 1. Spitting bouncing atomic plasma spheres
    if (this.spitTimer >= this.spitInterval && this.elapsed < this.duration - 1.5) {
        this.spitTimer = 0;
        
        Sound.playSound("flash", true);
        
        // Spawn fireball at the top-center (Godzilla's mouth coordinate)
        var startX = bb[0] + boxW / 2;
        var startY = bb[1] + 10;
        
        // Aim generally towards the player soul
        var soulX = 370, soulY = 400;
        if (typeof Soul !== "undefined") {
            var soulPos = Soul.getPos();
            if (soulPos) {
                soulX = soulPos.x + Soul.getWidth() / 2;
                soulY = soulPos.y + Soul.getHeight() / 2;
            }
        }
        
        var dx = soulX - startX;
        var dy = soulY - startY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var baseSpeed = 190;
        
        var vx = (dx / dist) * baseSpeed;
        var vy = (dy / dist) * baseSpeed;
        
        // Add slight random deviation
        vx += (Math.random() - 0.5) * 40;
        vy += (Math.random() - 0.5) * 20;
        
        var b = new Bullet({
            x: startX - 10,
            y: startY,
            width: 20, height: 20,
            speed: 0,
            damVal: this.damVal,
            rotation: 0, fadeSpeed: 1.0, color: "#0FF",
            vx: vx, vy: vy, useVelocity: true
        });
        
        // Custom properties for bounce/split logic
        b.bounceCount = 0;
        b.isSpitBall = true;
        
        this.bullets.push(b);
    }
    
    // 2. Update bullets and apply bounce/split logic
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        
        // Progress standard movement
        b.progressMovement(dt);
        
        // Custom bounce checks
        if (b.isSpitBall) {
            var nextX = b.x + b.vx * dt;
            var nextY = b.y + b.vy * dt;
            var hitWall = false;
            
            // Horizontal bounds bounce
            if (nextX <= bb[0]) {
                b.x = bb[0];
                b.vx = -b.vx;
                hitWall = true;
            } else if (nextX + b.width >= bb[2]) {
                b.x = bb[2] - b.width;
                b.vx = -b.vx;
                hitWall = true;
            }
            // Vertical bounds bounce
            if (nextY <= bb[1]) {
                b.y = bb[1];
                b.vy = -b.vy;
                hitWall = true;
            } else if (nextY + b.height >= bb[3]) {
                b.y = bb[3] - b.height;
                b.vy = -b.vy;
                hitWall = true;
            }
            
            if (hitWall) {
                b.bounceCount++;
                Sound.playSound("impact", true);
                
                if (b.bounceCount === 1) {
                    // Split into two smaller projectles flying sideways
                    var angleOffset = 0.5; // ~30 degrees split
                    var speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                    var currentAngle = Math.atan2(b.vy, b.vx);
                    
                    for (var sign = -1; sign <= 1; sign += 2) {
                        var splitAngle = currentAngle + sign * angleOffset;
                        var svx = Math.cos(splitAngle) * speed * 0.85;
                        var svy = Math.sin(splitAngle) * speed * 0.85;
                        
                        this.bullets.push(new Bullet({
                            x: b.x + b.width / 2 - 6,
                            y: b.y + b.height / 2 - 6,
                            width: 11, height: 11,
                            speed: 0,
                            damVal: this.damVal - 1,
                            rotation: 0, fadeSpeed: 1.0, color: "#80FFFF",
                            vx: svx, vy: svy, useVelocity: true
                        }));
                    }
                    
                    // Remove parent split-ball
                    this.bullets.splice(i, 1);
                    continue;
                }
            }
        }
        
        // Check out of bounds
        if (b.isOutOfBounds([bb[0]-60, bb[1]-60, bb[2]+60, bb[3]+60])) {
            this.bullets.splice(i, 1);
        }
    }
};

GodzillaAtomicSpitPattern.prototype.draw = function(ctx) {
    ctx.save();
    
    var isMeltdown = (this.battleBox && Cgroup.getBossId() === "godzilla" && Cgroup.getEnemy(0) && Cgroup.getEnemy(0).renderType === "godzilla_meltdown");
    var glowColor = isMeltdown ? "rgba(255, 0, 160, 0.75)" : "rgba(0, 160, 255, 0.75)";
    var coreColor = isMeltdown ? "#FF80DF" : "#00FFFF";
    
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        
        var bx = b.x + b.width / 2;
        var by = b.y + b.height / 2;
        var rad = b.width / 2;
        
        ctx.save();
        ctx.shadowBlur = b.isSpitBall ? 15 : 6;
        ctx.shadowColor = glowColor;
        ctx.fillStyle = coreColor;
        
        ctx.beginPath();
        ctx.arc(bx, by, rad, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight shine center
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(bx - rad * 0.35, by - rad * 0.35, rad * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    ctx.restore();
};

GodzillaAtomicSpitPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    return BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
};

GodzillaAtomicSpitPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
