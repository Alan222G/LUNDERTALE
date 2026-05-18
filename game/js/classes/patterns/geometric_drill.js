// geometric_drill.js — Ramiel's Geometric Drill: descending drill with seismic waves
var GeometricDrillPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
    this.drillY = 0;
    this.drillX = 0;
    this.drillSpeed = 55;
    this.drillWidth = 30;
    this.drillRotation = 0;
    this.seismicWaves = [];
    this.waveTimer = 0;
    this.waveInterval = 0.6;
    this.exploded = false;
    this.explosionParticles = [];
    this.explosionTime = 0;
    this.battleBox = null;
    this.debris = [];
};

GeometricDrillPattern.prototype = Object.create(BulletPattern.prototype);

GeometricDrillPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.drillX = (battleBox[0] + battleBox[2]) / 2;
    this.drillY = battleBox[1] - 10;
    this.drillRotation = 0;
    this.seismicWaves = [];
    this.waveTimer = 0;
    this.exploded = false;
    this.explosionParticles = [];
    this.explosionTime = 0;
    this.debris = [];
};

GeometricDrillPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    var bb = this.battleBox;

    if (!this.exploded) {
        // Drill descends
        this.drillY += this.drillSpeed * dt;
        this.drillRotation += 6.0 * dt; // Spin

        // Generate seismic wave bullets periodically
        this.waveTimer += dt;
        if (this.waveTimer >= this.waveInterval && this.drillY > bb[1] + 20) {
            this.waveTimer = 0;
            // Spawn horizontal bullets from drill position going left and right
            var numPerSide = 3;
            for (var side = -1; side <= 1; side += 2) {
                for (var j = 0; j < numPerSide; j++) {
                    var spreadAngle = side * (0.1 + j * 0.25);
                    var speed = 90 + j * 20;
                    this.seismicWaves.push({
                        x: this.drillX,
                        y: this.drillY + 10,
                        vx: Math.cos(spreadAngle) * speed * side,
                        vy: Math.sin(spreadAngle) * speed * 0.3,
                        size: 6 + j * 2,
                        life: 2.5,
                        maxLife: 2.5,
                        rot: Math.random() * Math.PI
                    });
                }
            }

            // Spawn debris particles
            for (var d = 0; d < 6; d++) {
                this.debris.push({
                    x: this.drillX + (Math.random() - 0.5) * 30,
                    y: this.drillY + 15,
                    vx: (Math.random() - 0.5) * 80,
                    vy: -20 - Math.random() * 60,
                    size: 1 + Math.random() * 3,
                    life: 0.8 + Math.random() * 0.5,
                    gravity: 120
                });
            }
        }

        // Check if drill reached bottom
        if (this.drillY >= bb[3] - 20) {
            this.exploded = true;
            this.explosionTime = 0;
            // Create massive explosion
            var numExplosion = 24;
            for (var i = 0; i < numExplosion; i++) {
                var angle = (i / numExplosion) * Math.PI * 2;
                var speed = 100 + Math.random() * 80;
                this.explosionParticles.push({
                    x: this.drillX,
                    y: bb[3] - 15,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 4 + Math.random() * 5,
                    life: 1.5 + Math.random() * 0.5,
                    maxLife: 2.0,
                    rot: Math.random() * Math.PI,
                    rotSpeed: (Math.random() - 0.5) * 10
                });
            }
        }
    } else {
        this.explosionTime += dt;
    }

    // Update seismic waves
    for (var i = this.seismicWaves.length - 1; i >= 0; i--) {
        var w = this.seismicWaves[i];
        w.x += w.vx * dt;
        w.y += w.vy * dt;
        w.rot += 3 * dt;
        w.life -= dt;
        if (w.life <= 0 || w.x < bb[0] - 50 || w.x > bb[2] + 50) {
            this.seismicWaves.splice(i, 1);
        }
    }

    // Update explosion particles
    for (var i = this.explosionParticles.length - 1; i >= 0; i--) {
        var p = this.explosionParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.rotSpeed * dt;
        p.life -= dt;
        if (p.life <= 0) this.explosionParticles.splice(i, 1);
    }

    // Update debris
    for (var i = this.debris.length - 1; i >= 0; i--) {
        var d = this.debris[i];
        d.x += d.vx * dt;
        d.vy += d.gravity * dt;
        d.y += d.vy * dt;
        d.life -= dt;
        if (d.life <= 0) this.debris.splice(i, 1);
    }
};

GeometricDrillPattern.prototype.draw = function(ctx) {
    var bb = this.battleBox;
    ctx.save();

    if (!this.exploded) {
        // Draw drill body
        ctx.save();
        ctx.translate(this.drillX, this.drillY);

        // Drill column (extending upward from drill tip)
        var columnHeight = this.drillY - bb[1] + 20;
        var colGrad = ctx.createLinearGradient(-this.drillWidth / 2, -columnHeight, this.drillWidth / 2, 0);
        colGrad.addColorStop(0, "rgba(30, 60, 180, 0.3)");
        colGrad.addColorStop(0.5, "rgba(50, 100, 220, 0.6)");
        colGrad.addColorStop(1, "rgba(80, 150, 255, 0.8)");
        ctx.fillStyle = colGrad;
        ctx.fillRect(-this.drillWidth / 3, -columnHeight, this.drillWidth * 2 / 3, columnHeight);

        // Spiral rings on column
        ctx.strokeStyle = "rgba(150, 200, 255, 0.4)";
        ctx.lineWidth = 1.5;
        var ringSpacing = 18;
        var numRings = Math.floor(columnHeight / ringSpacing);
        for (var r = 0; r < numRings; r++) {
            var ry = -r * ringSpacing;
            var rOffset = (this.drillRotation * 2 + r * 0.8) % (Math.PI * 2);
            var rAlpha = (0.3 + Math.sin(rOffset) * 0.2).toFixed(2);
            ctx.strokeStyle = "rgba(150, 200, 255, " + rAlpha + ")";
            ctx.beginPath();
            ctx.ellipse(0, ry, this.drillWidth / 3, 5, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Rotating drill tip (cone shape)
        ctx.save();
        ctx.rotate(this.drillRotation);

        // Drill cone
        var tipGrad = ctx.createLinearGradient(0, 0, 0, 35);
        tipGrad.addColorStop(0, "rgba(80, 150, 255, 0.9)");
        tipGrad.addColorStop(0.7, "rgba(200, 230, 255, 0.95)");
        tipGrad.addColorStop(1, "rgba(255, 255, 255, 1)");
        ctx.fillStyle = tipGrad;
        ctx.beginPath();
        ctx.moveTo(-this.drillWidth / 2, 0);
        ctx.lineTo(this.drillWidth / 2, 0);
        ctx.lineTo(0, 35);
        ctx.closePath();
        ctx.fill();

        // Drill tip glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#88CCFF";
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(0, 30, 4, 0, Math.PI * 2);
        ctx.fill();

        // Side blades (rotating geometric extensions)
        for (var blade = 0; blade < 4; blade++) {
            ctx.save();
            ctx.rotate(blade * Math.PI / 2);
            ctx.fillStyle = "rgba(60, 130, 255, 0.6)";
            ctx.beginPath();
            ctx.moveTo(this.drillWidth / 2, -3);
            ctx.lineTo(this.drillWidth / 2 + 12, 0);
            ctx.lineTo(this.drillWidth / 2, 3);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        ctx.restore(); // undo rotation
        ctx.restore(); // undo translate

        // Draw debris particles
        for (var i = 0; i < this.debris.length; i++) {
            var d = this.debris[i];
            var dAlpha = (d.life / 1.3).toFixed(2);
            ctx.fillStyle = "rgba(150, 180, 220, " + dAlpha + ")";
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw seismic wave bullets (crystal shards)
    for (var i = 0; i < this.seismicWaves.length; i++) {
        var w = this.seismicWaves[i];
        var wAlpha = Math.min(1, w.life / w.maxLife * 2).toFixed(2);

        ctx.save();
        ctx.translate(w.x, w.y);
        ctx.rotate(w.rot);
        ctx.globalAlpha = parseFloat(wAlpha);

        // Crystal shard shape (diamond)
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(80, 150, 255, 0.5)";

        var shardGrad = ctx.createLinearGradient(-w.size / 2, -w.size, w.size / 2, w.size);
        shardGrad.addColorStop(0, "rgba(40, 80, 200, 0.8)");
        shardGrad.addColorStop(0.5, "rgba(80, 160, 255, 0.9)");
        shardGrad.addColorStop(1, "rgba(40, 80, 200, 0.8)");
        ctx.fillStyle = shardGrad;
        ctx.beginPath();
        ctx.moveTo(0, -w.size);
        ctx.lineTo(w.size / 2, 0);
        ctx.lineTo(0, w.size);
        ctx.lineTo(-w.size / 2, 0);
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = "rgba(200, 230, 255, 0.5)";
        ctx.beginPath();
        ctx.moveTo(0, -w.size * 0.6);
        ctx.lineTo(w.size * 0.2, 0);
        ctx.lineTo(0, w.size * 0.3);
        ctx.lineTo(-w.size * 0.2, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    // Draw explosion particles
    for (var i = 0; i < this.explosionParticles.length; i++) {
        var p = this.explosionParticles[i];
        var pAlpha = Math.min(1, p.life / p.maxLife * 1.8).toFixed(2);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = parseFloat(pAlpha);

        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(100, 180, 255, 0.5)";
        ctx.fillStyle = "rgba(80, 160, 255, " + pAlpha + ")";
        // Diamond shard
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.5, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.5, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    // Explosion flash
    if (this.exploded && this.explosionTime < 0.3) {
        var flashA = (1 - this.explosionTime / 0.3) * 0.5;
        ctx.fillStyle = "rgba(200, 230, 255, " + flashA.toFixed(2) + ")";
        ctx.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
    }

    ctx.restore();
};

GeometricDrillPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var soulCX = sx + sw / 2;
    var soulCY = sy + sh / 2;

    // Drill body collision
    if (!this.exploded) {
        var drillLeft = this.drillX - this.drillWidth / 2;
        var drillRight = this.drillX + this.drillWidth / 2;
        var drillTop = this.battleBox[1];
        var drillBottom = this.drillY + 35;
        if (soulCX + sw / 2 > drillLeft && soulCX - sw / 2 < drillRight &&
            soulCY + sh / 2 > drillTop && soulCY - sh / 2 < drillBottom) {
            return this.damVal;
        }
    }

    // Seismic wave collision
    for (var i = 0; i < this.seismicWaves.length; i++) {
        var w = this.seismicWaves[i];
        var dx = soulCX - w.x;
        var dy = soulCY - w.y;
        if (Math.sqrt(dx * dx + dy * dy) < w.size + sw / 2) {
            return this.damVal;
        }
    }

    // Explosion collision
    for (var i = 0; i < this.explosionParticles.length; i++) {
        var p = this.explosionParticles[i];
        var dx = soulCX - p.x;
        var dy = soulCY - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < p.size + sw / 2) {
            return this.damVal;
        }
    }

    return 0;
};

GeometricDrillPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.seismicWaves.length === 0 && this.explosionParticles.length === 0;
};
