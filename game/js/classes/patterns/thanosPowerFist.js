// thanosPowerFist.js — Power Stone. Giant cosmic fist strike.
// A massive purple fist follows the player's X coordinate, locks in place with warning line,
// and slams downward to the ground, scattering purple power sparks.

var ThanosPowerFistPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 12;
    
    this.fist = { x: 300, y: 0, targetX: 300, state: 'track', timer: 0.0 }; // state: 'track'|'lock'|'strike'|'recover'
};

ThanosPowerFistPattern.prototype = Object.create(BulletPattern.prototype);

ThanosPowerFistPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    
    var bb = Cbbox.getBound();
    this.fist = {
        x: (bb[0] + bb[2]) / 2,
        y: bb[1] - 80,
        targetX: (bb[0] + bb[2]) / 2,
        state: 'track',
        timer: 0.0
    };
};

ThanosPowerFistPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];

    // Fist State Machine
    var f = this.fist;
    f.timer += dt;

    if (f.state === 'track') {
        // Track player's X position slowly
        if (typeof Soul !== "undefined") {
            var spos = Soul.getPos();
            f.targetX = spos.x + Soul.getWidth() / 2;
        }
        f.x += (f.targetX - f.x) * dt * 4.2;
        
        // Keep within bounds
        f.x = clamp(f.x, bb[0] + 30, bb[2] - 30);
        
        if (f.timer >= 1.4) {
            f.state = 'lock';
            f.timer = 0;
            Sound.playSound("impact", true); // Lock alert sound
        }
    } else if (f.state === 'lock') {
        // Hold position, flash warning lines
        if (f.timer >= 0.7) {
            f.state = 'strike';
            f.timer = 0;
            Sound.playSound("soul_shatter", true); // Strike sound!
        }
    } else if (f.state === 'strike') {
        // Slam down fast
        f.y += dt * 380;
        
        // Check ground hit
        if (f.y + 40 >= bb[3]) {
            f.y = bb[3] - 40;
            f.state = 'recover';
            f.timer = 0;
            triggerShake(5, 150); // Shake screen on impact
            
            // Spawn 5 purple fragments shooting outwards
            for (var i = 0; i < 5; i++) {
                var angle = Math.PI + (i / 4) * Math.PI; // Upwards semi-circle
                var speed = 120 + Math.random() * 40;
                var spark = new Bullet({
                    x: f.x - 6,
                    y: bb[3] - 18,
                    width: 12,
                    height: 12,
                    speed: 0,
                    damVal: this.damVal - 3,
                    color: "#D500F9",
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    useVelocity: true
                });
                this.bullets.push(spark);
            }
        }
    } else if (f.state === 'recover') {
        // Move back to top slowly
        f.y -= dt * 90;
        if (f.y <= bb[1] - 65) {
            f.y = bb[1] - 65;
            f.state = 'track';
            f.timer = 0;
        }
    }

    // Update bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        
        if (b.isOutOfBounds(bb)) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

ThanosPowerFistPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var f = this.fist;
    var bb = Cbbox.getBound();

    // 1. Collide with falling giant fist (hitbox: w: 46, h: 60)
    if (f.state === 'strike') {
        var fistBox = {
            x: f.x - 23,
            y: f.y - 20,
            w: 46,
            h: 60
        };
        if (rectsOverlap(fistBox.x, fistBox.y, fistBox.w, fistBox.h, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }

    // 2. Collide with sparks
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && b.fadeTick >= 1) {
            if (rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
                return this.damVal - 3;
            }
        }
    }

    return 0;
};

ThanosPowerFistPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var f = this.fist;

    // 1. Draw Warning Lock line
    if (f.state === 'lock') {
        ctx.save();
        ctx.strokeStyle = "rgba(213, 0, 249, " + (0.35 + Math.sin(f.timer * 30) * 0.25).toFixed(2) + ")";
        ctx.lineWidth = 2.0;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(f.x, bb[1]);
        ctx.lineTo(f.x, bb[3]);
        ctx.stroke();
        ctx.restore();
    }

    // 2. Draw standard sparks
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#D500F9";
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#D500F9";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    // 3. Draw Giant Purple Fist
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#D500F9";

    // Draw forearm (coming from top)
    var armGrad = ctx.createLinearGradient(-15, -40, 15, -40);
    armGrad.addColorStop(0, "#4A0E7B");
    armGrad.addColorStop(0.5, "#D500F9");
    armGrad.addColorStop(1, "#4A0E7B");
    ctx.fillStyle = armGrad;
    ctx.fillRect(-15, -70, 30, 70);

    // Fist body
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    // Fingers/knuckles (5 rounded blocks)
    ctx.fillStyle = "#FFF";
    ctx.strokeStyle = "#D500F9";
    ctx.lineWidth = 2.0;
    for (var k = -2; k <= 2; k++) {
        ctx.beginPath();
        ctx.arc(k * 8.5, 14, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
};

ThanosPowerFistPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
