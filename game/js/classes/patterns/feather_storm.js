// feather_storm.js — Feathers rain from all directions
var FeatherStormPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.spawnInterval = config.spawnInterval || 0.18;
    this.damVal = config.damVal || 5;
    this.featherSpeed = config.featherSpeed || 130;
};

FeatherStormPattern.prototype = Object.create(BulletPattern.prototype);

FeatherStormPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
};

FeatherStormPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        this.spawnFeather();
        // Occasional double feather
        if (Math.random() < 0.3) this.spawnFeather();
    }

    BulletPattern.prototype.update.call(this, dt);

    var bb = this.battleBox;
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        if (this.bullets[i].isOutOfBounds([bb[0] - 40, bb[1] - 40, bb[2] + 40, bb[3] + 40])) {
            this.bullets.splice(i, 1);
        }
    }
};

FeatherStormPattern.prototype.spawnFeather = function() {
    var bb = this.battleBox;
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];
    var side = Math.floor(Math.random() * 4); // 0=top, 1=bottom, 2=left, 3=right
    var sx, sy, vx, vy;
    
    switch (side) {
        case 0: // Top
            sx = bb[0] + Math.random() * bbW;
            sy = bb[1] - 5;
            vx = (Math.random() - 0.5) * 40;
            vy = this.featherSpeed * (0.7 + Math.random() * 0.3);
            break;
        case 1: // Bottom
            sx = bb[0] + Math.random() * bbW;
            sy = bb[3] + 5;
            vx = (Math.random() - 0.5) * 40;
            vy = -this.featherSpeed * (0.7 + Math.random() * 0.3);
            break;
        case 2: // Left
            sx = bb[0] - 5;
            sy = bb[1] + Math.random() * bbH;
            vx = this.featherSpeed * (0.7 + Math.random() * 0.3);
            vy = (Math.random() - 0.5) * 40;
            break;
        case 3: // Right
            sx = bb[2] + 5;
            sy = bb[1] + Math.random() * bbH;
            vx = -this.featherSpeed * (0.7 + Math.random() * 0.3);
            vy = (Math.random() - 0.5) * 40;
            break;
    }

    this.bullets.push(new Bullet({
        x: sx, y: sy,
        width: 10, height: 10,
        speed: 0,
        damVal: this.damVal,
        rotation: 0, fadeSpeed: 1.0, color: "#FFFAEB",
        vx: vx, vy: vy, useVelocity: true
    }));
};

FeatherStormPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        
        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        var cx = b.x + b.width / 2;
        var cy = b.y + b.height / 2;
        var angle = Math.atan2(b.vy, b.vx);
        
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        
        // Feather shape
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#FFD700";
        
        // Feather body (elongated ellipse)
        ctx.fillStyle = "#FFFAEB";
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Feather spine
        ctx.strokeStyle = "rgba(218, 165, 32, 0.6)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(7, 0);
        ctx.stroke();
        
        ctx.restore();
    }
    ctx.restore();
};

FeatherStormPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
