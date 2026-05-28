// thanosSoulDevour.js — Soul Stone. HP Devour and Homing Souls.
// Thanos spawns orange homing spirits that slowly stalk the player's heart.
// Every hit steals HP, healing Thanos for 150 HP and playing a thud damage sound.

var ThanosSoulDevourPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.bulletTimer = 0;
    this.damVal = config.damVal || 10;
};

ThanosSoulDevourPattern.prototype = Object.create(BulletPattern.prototype);

ThanosSoulDevourPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.5; // Spawn homing ghost early
    this.bulletTimer = 0;
};

ThanosSoulDevourPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    this.bulletTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];

    // 1. Spawn slow orange homing spirits (Soul Wraiths)
    if (this.spawnTimer >= 1.6 && this.elapsed < this.duration - 1.8) {
        this.spawnTimer = 0;
        
        // Spawn from random corners of the battle box
        var corners = [
            { x: bb[0] + 15, y: bb[1] + 15 },
            { x: bb[2] - 15, y: bb[1] + 15 },
            { x: bb[0] + 15, y: bb[3] - 15 },
            { x: bb[2] - 15, y: bb[3] - 15 }
        ];
        var corner = corners[Math.floor(Math.random() * 4)];
        
        var wraith = new Bullet({
            x: corner.x - 10,
            y: corner.y - 10,
            width: 18,
            height: 18,
            speed: 0,
            damVal: this.damVal,
            color: "#FF6D00", // Soul Orange
            vx: 0,
            vy: 0,
            useVelocity: true
        });
        wraith.isHoming = true;
        wraith.timeAlive = 0;
        this.bullets.push(wraith);
        Sound.playSound("impact", true); // Wraith wail chime
    }

    // 2. Spawn simple falling sparks to populate the box
    if (this.bulletTimer >= 0.32 && this.elapsed < this.duration - 0.8) {
        this.bulletTimer = 0;
        
        var bx = bb[0] + Math.random() * (bbW - 12);
        var spark = new Bullet({
            x: bx,
            y: bb[1] - 10,
            width: 10,
            height: 10,
            speed: 0,
            damVal: this.damVal - 1,
            color: "#FF9100",
            vx: 0,
            vy: 110 + Math.random() * 40,
            useVelocity: true
        });
        spark.isHoming = false;
        this.bullets.push(spark);
    }

    // 3. Update bullets
    if (typeof Soul !== "undefined") {
        var soulPos = Soul.getPos();
        var scx = soulPos.x + Soul.getWidth() / 2;
        var scy = soulPos.y + Soul.getHeight() / 2;

        for (var i = this.bullets.length - 1; i >= 0; i--) {
            var b = this.bullets[i];
            
            if (b.isHoming) {
                b.timeAlive += dt;
                
                // Slow homing calculations
                var bcx = b.x + b.width / 2;
                var bcy = b.y + b.height / 2;
                var dx = scx - bcx;
                var dy = scy - bcy;
                var dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 1) {
                    var speed = 72; // Slow, creeping homing wraith
                    b.vx = (dx / dist) * speed;
                    b.vy = (dy / dist) * speed;
                }
                
                // Spiral oscillation trail wave
                b.x += b.vx * dt + Math.sin(b.timeAlive * 8) * 0.8;
                b.y += b.vy * dt + Math.cos(b.timeAlive * 8) * 0.8;
                
                // Remove homing after 4.5 seconds to prevent build-up
                if (b.timeAlive > 4.5) b.active = false;
            } else {
                b.progressMovement(dt);
            }

            if (!b.active || b.isOutOfBounds(bb)) {
                b.active = false;
                this.bullets.splice(i, 1);
            }
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

ThanosSoulDevourPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && b.fadeTick >= 1) {
            if (rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
                // If it's a homing wraith, heal Thanos!
                if (b.isHoming) {
                    if (typeof Cgroup !== "undefined" && Cgroup.getEnemy) {
                        var thanos = Cgroup.getEnemy(0);
                        if (thanos && thanos.curHP !== undefined) {
                            thanos.curHP = Math.min(thanos.maxHP, thanos.curHP + 150); // Heal Thanos!
                            Sound.playSound("heal", true); // Play healing chime
                        }
                    }
                }
                b.active = false; // Destroy bullet on hit
                this.bullets.splice(i, 1);
                return b.isHoming ? this.damVal : this.damVal - 1;
            }
        }
    }
    return 0;
};

ThanosSoulDevourPattern.prototype.draw = function(ctx) {
    ctx.save();
    
    // Draw orange homing soul wraiths
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.shadowBlur = 12;
        ctx.shadowColor = b.isHoming ? "#FF5D00" : "#FF9E00";
        
        var cx = b.x + b.width / 2;
        var cy = b.y + b.height / 2;
        
        if (b.isHoming) {
            // Draw glowing orange wisp head
            ctx.fillStyle = "#FF6D00";
            ctx.beginPath();
            ctx.arc(cx, cy, b.width / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw a small tail behind the wisp based on velocity
            var speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            if (speed > 1) {
                var tx = cx - (b.vx / speed) * 12;
                var ty = cy - (b.vy / speed) * 12;
                ctx.fillStyle = "rgba(255, 109, 0, 0.4)";
                ctx.beginPath();
                ctx.arc(tx, ty, b.width / 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // White core shine
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.arc(cx, cy, b.width / 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Draw standard orange sparks
            ctx.fillStyle = "#FFF";
            ctx.strokeStyle = "#FF9E00";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(cx, cy, b.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    ctx.restore();
};

ThanosSoulDevourPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
