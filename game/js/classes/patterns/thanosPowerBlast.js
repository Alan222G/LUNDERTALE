// thanosPowerBlast.js — Power Stone. Raw cosmic power blast.
// Thanos fires a massive, swirling purple cosmic beam that sweeps across the battle box,
// while small power fragments fly from the sides.

var ThanosPowerBlastPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.laserTimer = 0;
    this.damVal = config.damVal || 12;
    
    this.lasers = [];
};

ThanosPowerBlastPattern.prototype = Object.create(BulletPattern.prototype);

ThanosPowerBlastPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.laserTimer = 1.0; // Start first laser quickly
    this.lasers = [];
};

ThanosPowerBlastPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    this.laserTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];

    // 1. Manage Laser Sweeps
    if (this.laserTimer >= 2.6 && this.elapsed < this.duration - 1.5) {
        this.laserTimer = 0;
        
        // Spawn a horizontal sweeping purple laser at a random height
        var ry = bb[1] + 25 + Math.random() * (bbH - 50);
        this.lasers.push({
            y: ry,
            thickness: 34,
            warningTimer: 0.0,
            maxWarning: 1.1,
            activeTimer: 0.0,
            maxActive: 0.8,
            phase: 'warning',
            soundPlayed: false
        });
    }

    // Update active lasers
    for (var i = this.lasers.length - 1; i >= 0; i--) {
        var l = this.lasers[i];
        if (l.phase === 'warning') {
            l.warningTimer += dt;
            if (l.warningTimer >= l.maxWarning) {
                l.phase = 'active';
            }
        } else if (l.phase === 'active') {
            l.activeTimer += dt;
            if (!l.soundPlayed) {
                Sound.playSound("soul_shatter", true); // Cosmic screech
                l.soundPlayed = true;
            }
            if (l.activeTimer >= l.maxActive) {
                this.lasers.splice(i, 1);
            }
        }
    }

    // 2. Spawn bouncing Purple Power Fragments
    if (this.spawnTimer >= 0.38 && this.elapsed < this.duration - 0.8) {
        this.spawnTimer = 0;

        var sx = bb[0] + Math.random() * (bbW - 16);
        var sy = bb[1] - 10;
        var vx = (Math.random() - 0.5) * 160;
        var vy = 120 + Math.random() * 80;

        var fragment = new Bullet({
            x: sx,
            y: sy,
            width: 12,
            height: 12,
            speed: 0,
            damVal: this.damVal - 2,
            color: "#D500F9", // Bright purple
            vx: vx,
            vy: vy,
            useVelocity: true
        });
        fragment.bounces = 0;
        this.bullets.push(fragment);
    }

    // 3. Update power fragments
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);

        // Bouncing logic
        if (b.x < bb[0]) { b.x = bb[0]; b.vx *= -1; b.bounces++; }
        if (b.x + b.width > bb[2]) { b.x = bb[2] - b.width; b.vx *= -1; b.bounces++; }
        if (b.y < bb[1]) { b.y = bb[1]; b.vy *= -1; b.bounces++; }
        if (b.y + b.height > bb[3]) { b.y = bb[3] - b.height; b.vy *= -1; b.bounces++; }

        if (b.bounces >= 2 || b.isOutOfBounds(bb)) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

ThanosPowerBlastPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cy = sy + sh / 2;
    var radius = (sw + sh) / 4;

    // 1. Check laser sweeps
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.phase === 'active') {
            var laserTop = l.y - l.thickness / 2;
            var laserBottom = l.y + l.thickness / 2;
            if (cy + radius > laserTop && cy - radius < laserBottom) {
                return this.damVal;
            }
        }
    }

    // 2. Check power fragments
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && b.fadeTick >= 1) {
            if (rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
                return this.damVal - 2;
            }
        }
    }

    return 0;
};

ThanosPowerBlastPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];

    // 1. Draw horizontal laser sweeps
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.phase === 'warning') {
            ctx.save();
            var alpha = 0.15 + Math.sin(l.warningTimer * 20) * 0.08;
            ctx.fillStyle = "rgba(213, 0, 249, " + alpha + ")";
            ctx.fillRect(bb[0], l.y - l.thickness / 2, bbW, l.thickness);

            // Dotted warning lines
            ctx.strokeStyle = "#D500F9";
            ctx.lineWidth = 1.2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(bb[0], l.y - l.thickness / 2); ctx.lineTo(bb[2], l.y - l.thickness / 2);
            ctx.moveTo(bb[0], l.y + l.thickness / 2); ctx.lineTo(bb[2], l.y + l.thickness / 2);
            ctx.stroke();
            ctx.restore();
        } else if (l.phase === 'active') {
            ctx.save();
            var progress = l.activeTimer / l.maxActive;
            ctx.globalAlpha = Math.max(0.1, 1.0 - progress * 0.35);

            ctx.shadowBlur = 24;
            ctx.shadowColor = "#D500F9";

            // Thick outer glowing purple beam
            ctx.fillStyle = "rgba(213, 0, 249, 0.85)";
            ctx.fillRect(bb[0], l.y - l.thickness / 2, bbW, l.thickness);

            // Swirling energy lines
            ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(bb[0], l.y - l.thickness / 4 + Math.sin(l.activeTimer * 40) * 4);
            ctx.lineTo(bb[2], l.y - l.thickness / 4 + Math.cos(l.activeTimer * 40) * 4);
            ctx.moveTo(bb[0], l.y + l.thickness / 4 + Math.cos(l.activeTimer * 40) * 4);
            ctx.lineTo(bb[2], l.y + l.thickness / 4 + Math.sin(l.activeTimer * 40) * 4);
            ctx.stroke();

            // Pure white inner core
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(bb[0], l.y - l.thickness / 5, bbW, l.thickness * 0.4);

            ctx.restore();
        }
    }

    // 2. Draw power fragments
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#D500F9";
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#D500F9";
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    ctx.restore();
};

ThanosPowerBlastPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.lasers.length === 0 && this.bullets.length === 0;
};
