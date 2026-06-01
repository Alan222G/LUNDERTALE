// bullet.js — Projectile class for LUNDERTALE
// Ported from UBE's Bullet.java to JavaScript

var Bullet = function(config) {
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width = config.width || 16;
    this.height = config.height || 16;
    this.speed = config.speed || 3;
    this.damVal = config.damVal || 4;
    this.rotation = config.rotation || 0;   // 0=up, 90=right, 180=down, 270=left
    this.fadeSpeed = config.fadeSpeed || 0.1;
    this.fadeTick = 0;
    this.color = config.color || "#FFF";
    this.active = true;

    // Velocity components (for advanced patterns)
    this.vx = config.vx || 0;
    this.vy = config.vy || 0;
    this.useVelocity = config.useVelocity || false; // Use vx/vy instead of rotation-based movement

    // Acceleration (for spirals, homing, etc.)
    this.ax = config.ax || 0;
    this.ay = config.ay || 0;
};

// Progress the bullet's movement each frame
Bullet.prototype.progressMovement = function(dt) {
    if (this.fadeTick < 1) {
        this.fadeTick += this.fadeSpeed;
        if (this.fadeTick > 1) this.fadeTick = 1;
        return;
    }

    var speedMult = (typeof Player !== "undefined" && Player.getBulletSpeedMultiplier) ? Player.getBulletSpeedMultiplier() : 1.0;
    dt *= speedMult;

    // Radioactive Magnet & Rimuru Graze Absorption Effects
    if (typeof Player !== "undefined" && typeof Soul !== "undefined") {
        var soulPos = Soul.getPos();
        var scx = soulPos.x + Soul.getWidth() / 2;
        var scy = soulPos.y + Soul.getHeight() / 2;
        var bcx = this.x + this.width / 2;
        var bcy = this.y + this.height / 2;
        
        var dx = scx - bcx;
        var dy = scy - bcy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        
        var soulRad = Soul.getWidth() / 2;
        var bulletRad = this.width / 2;
        
        // Gojo Infinity bullet slowdown (slows bullets within 40px to 10% speed)
        if (Player.getSoulClass && Player.getSoulClass() === 14) {
            if (dist < 40) {
                dt *= 0.10;
            }
        }
        
        // 1. Pull bullet if Magnet is active
        if (Player.isMagnetActive && Player.isMagnetActive() && dist > 1) {
            var pullX = (dx / dist) * 45 * dt;
            var pullY = (dy / dist) * 45 * dt;
            this.x += pullX;
            this.y += pullY;
        }
        
        // 2. Graze calculations
        var grazeDist = soulRad + bulletRad + 14;
        var touchDist = soulRad + bulletRad + 2;
        if (dist < grazeDist && dist > touchDist && !this.grazed) {
            this.grazed = true;
            if (Player.getSoulClass() === 24) { // Rimuru Slime
                if (Math.random() < 0.20) {
                    Player.heal(5);
                    this.active = false; // Absorb bullet
                }
            } else if (Player.isMagnetActive && Player.isMagnetActive()) {
                Player.heal(3); // Heal 3 HP on graze
            }
        }
    }

    if (this.useVelocity) {
        // Velocity-based movement (for trigonometric patterns)
        this.vx += this.ax * dt;
        this.vy += this.ay * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    } else {
        // Rotation-based movement (ported from UBE)
        var moveAmount = this.speed * dt * 60; // Normalize to ~60fps
        if (this.rotation === 270) {
            this.x -= moveAmount;
        } else if (this.rotation === 180) {
            this.y += moveAmount;
        } else if (this.rotation === 90) {
            this.x += moveAmount;
        } else {
            this.y -= moveAmount;
        }
    }
};

// Draw the bullet
Bullet.prototype.draw = function(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.globalAlpha = this.fadeTick;
    
    var centerX = this.x + this.width / 2;
    var centerY = this.y + this.height / 2;
    var radius = this.width / 2;

    // Glowing aura
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#B000FF";
    
    ctx.fillStyle = "#000000"; // Pure black center
    ctx.strokeStyle = "#00FFFF"; // Cyan edge
    ctx.lineWidth = 1.5;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
};

// Check if this bullet collides with a rectangle (soul hitbox)
Bullet.prototype.collidesWith = function(sx, sy, sw, sh) {
    if (!this.active || this.fadeTick < 1) return false;
    return rectsOverlap(this.x, this.y, this.width, this.height, sx, sy, sw, sh);
};

// Check if bullet is out of bounds
Bullet.prototype.isOutOfBounds = function(bounds) {
    return this.x + this.width < bounds[0] - 50 ||
           this.y + this.height < bounds[1] - 50 ||
           this.x > bounds[2] + 50 ||
           this.y > bounds[3] + 50;
};
