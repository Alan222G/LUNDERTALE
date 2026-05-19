// holy_lance.js — Golden spears raining diagonally from corners
var HolyLancePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.spawnInterval = config.spawnInterval || 0.25;
    this.damVal = config.damVal || 6;
    this.lanceSpeed = config.lanceSpeed || 200;
};

HolyLancePattern.prototype = Object.create(BulletPattern.prototype);

HolyLancePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
};

HolyLancePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1) {
        this.spawnTimer = 0;
        this.spawnLance();
    }

    // Semi-homing logic
    if (typeof Soul !== "undefined" && Soul.isOkay()) {
        var soulPos = Soul.getPos();
        var soulX = soulPos.x + Soul.getWidth() / 2;
        var soulY = soulPos.y + Soul.getHeight() / 2;

        for (var i = 0; i < this.bullets.length; i++) {
            var b = this.bullets[i];
            if (!b.age) b.age = 0;
            b.age += dt;
            
            // Homing for the first 0.8 seconds
            if (b.age < 0.8) {
                var cx = b.x + b.width / 2;
                var cy = b.y + b.height / 2;
                var angleToSoul = Math.atan2(soulY - cy, soulX - cx);
                var currentAngle = Math.atan2(b.vy, b.vx);
                
                var angleDiff = angleToSoul - currentAngle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                
                var newAngle = currentAngle + angleDiff * 3.0 * dt; // Turn speed factor
                
                var speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy) + 120 * dt; // Accelerate while homing
                b.vx = Math.cos(newAngle) * speed;
                b.vy = Math.sin(newAngle) * speed;
            }
        }
    }

    // Update bullets
    BulletPattern.prototype.update.call(this, dt);

    // Remove out-of-bounds
    var bb = Cbbox.getBound();
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        if (this.bullets[i].isOutOfBounds([bb[0] - 60, bb[1] - 60, bb[2] + 60, bb[3] + 60])) {
            this.bullets.splice(i, 1);
        }
    }
};

HolyLancePattern.prototype.spawnLance = function() {
    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];
    var fromLeft = Math.random() > 0.5;
    
    // Spawn from top-left or top-right, angled downward
    var startX = fromLeft ? bb[0] - 10 : bb[2] + 10;
    var startY = bb[1] + Math.random() * (bbH * 0.3);
    
    var angleToCenter = Math.atan2(
        (bb[1] + bbH * 0.7) - startY,
        ((bb[0] + bbW / 2) + (Math.random() - 0.5) * bbW * 0.6) - startX
    );
    
    var vx = Math.cos(angleToCenter) * this.lanceSpeed;
    var vy = Math.sin(angleToCenter) * this.lanceSpeed;

    this.bullets.push(new Bullet({
        x: startX, y: startY,
        width: 8, height: 20,
        speed: 0,
        damVal: this.damVal,
        rotation: 0, fadeSpeed: 1.0, color: "#FFD700",
        vx: vx, vy: vy, useVelocity: true
    }));
};

HolyLancePattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        
        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        
        var cx = b.x + b.width / 2;
        var cy = b.y + b.height / 2;
        var angle = Math.atan2(b.vy, b.vx) + Math.PI / 2;
        
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        
        // Trailing light particles
        ctx.shadowBlur = 0;
        for (var t = 0; t < 3; t++) {
            var ty = 14 + t * 8;
            var tAlpha = (0.3 - t * 0.08).toFixed(2);
            ctx.fillStyle = "rgba(255, 215, 0, " + tAlpha + ")";
            ctx.beginPath();
            ctx.arc((Math.random() - 0.5) * 3, ty, 1.5 - t * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Golden lance glow
        ctx.shadowBlur = 16;
        ctx.shadowColor = "#FFD700";
        
        // Lance body (longer, sleeker)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(-3.5, -14, 7, 28);
        
        // Golden edge overlay
        ctx.fillStyle = "rgba(255, 215, 0, 0.5)";
        ctx.fillRect(-4.5, -14, 9, 28);
        
        // White hot center line
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillRect(-1, -14, 2, 28);
        
        // Spear tip (larger, sharper)
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#FFAA00";
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-5, -12);
        ctx.lineTo(5, -12);
        ctx.fill();
        // Bright tip core
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(-2, -13);
        ctx.lineTo(2, -13);
        ctx.fill();
        
        ctx.restore();
    }
    ctx.restore();
};

HolyLancePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
