// fracture_explosion.js — Ramiel Phase 3 Exclusive: chain-detonating mini octahedrons
var FractureExplosionPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.octahedrons = [];
    this.shards = [];
    this.spawnTimer = 0;
    this.spawnInterval = 0.7;
    this.battleBox = null;
};
FractureExplosionPattern.prototype = Object.create(BulletPattern.prototype);

FractureExplosionPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.octahedrons = [];
    this.shards = [];
    this.spawnTimer = 0.3;
};

FractureExplosionPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    var bb = Cbbox.getBound();
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 2) {
        this.spawnTimer = 0;
        // Spawn 2 mini octahedrons (top+bottom or left+right)
        var cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2;
        var pair = Math.random() > 0.5;
        if (pair) {
            // Top and bottom
            this.octahedrons.push(this.makeOcta(bb[0] + 30 + Math.random() * (bb[2] - bb[0] - 60), bb[1] + 30));
            this.octahedrons.push(this.makeOcta(bb[0] + 30 + Math.random() * (bb[2] - bb[0] - 60), bb[3] - 30));
        } else {
            // Left and right
            this.octahedrons.push(this.makeOcta(bb[0] + 30, bb[1] + 30 + Math.random() * (bb[3] - bb[1] - 60)));
            this.octahedrons.push(this.makeOcta(bb[2] - 30, bb[1] + 30 + Math.random() * (bb[3] - bb[1] - 60)));
        }
    }
    // Update octahedrons
    for (var i = this.octahedrons.length - 1; i >= 0; i--) {
        var o = this.octahedrons[i];
        o.timer += dt;
        o.size = Math.min(o.maxSize, o.maxSize * (o.timer / (o.detonateTime * 0.7)));
        o.rot += o.rotSpeed * dt;
        if (o.timer >= o.detonateTime) {
            // Explode into shards
            var numShards = 10;
            for (var s = 0; s < numShards; s++) {
                var angle = (s / numShards) * Math.PI * 2 + Math.random() * 0.3;
                var speed = 70 + Math.random() * 80;
                this.shards.push({
                    x: o.x, y: o.y,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    size: 3 + Math.random() * 3, rot: Math.random() * Math.PI,
                    rotSpeed: (Math.random() - 0.5) * 10, life: 2.0,
                    chain: o.chain > 0, chainTimer: 0.5 + Math.random() * 0.3,
                    chainRemaining: o.chain
                });
            }
            this.octahedrons.splice(i, 1);
        }
    }
    // Update shards — some chain-explode into smaller bursts
    for (var i = this.shards.length - 1; i >= 0; i--) {
        var s = this.shards[i];
        s.x += s.vx * dt; s.y += s.vy * dt;
        s.rot += s.rotSpeed * dt; s.life -= dt;
        if (s.chain && s.chainRemaining > 0) {
            s.chainTimer -= dt;
            if (s.chainTimer <= 0) {
                s.chain = false;
                // Mini chain explosion
                for (var j = 0; j < 5; j++) {
                    var angle = Math.random() * Math.PI * 2;
                    this.shards.push({
                        x: s.x, y: s.y,
                        vx: Math.cos(angle) * (50 + Math.random() * 40),
                        vy: Math.sin(angle) * (50 + Math.random() * 40),
                        size: 2 + Math.random() * 2, rot: 0, rotSpeed: (Math.random() - 0.5) * 8,
                        life: 1.2, chain: false, chainTimer: 0, chainRemaining: 0
                    });
                }
            }
        }
        if (s.life <= 0 || s.x < bb[0] - 60 || s.x > bb[2] + 60 || s.y < bb[1] - 60 || s.y > bb[3] + 60)
            this.shards.splice(i, 1);
    }
};

FractureExplosionPattern.prototype.makeOcta = function(x, y) {
    return {
        x: x, y: y, size: 0, maxSize: 16 + Math.random() * 8,
        rot: Math.random() * Math.PI, rotSpeed: 2 + Math.random() * 2,
        timer: 0, detonateTime: 1.0 + Math.random() * 0.4,
        chain: 1 // chain explosion depth
    };
};

FractureExplosionPattern.prototype.draw = function(ctx) {
    ctx.save();
    // Draw charging octahedrons
    for (var i = 0; i < this.octahedrons.length; i++) {
        var o = this.octahedrons[i];
        var progress = o.timer / o.detonateTime;
        ctx.save();
        ctx.translate(o.x, o.y); ctx.rotate(o.rot);
        // Glow
        ctx.shadowBlur = 12 + progress * 12;
        ctx.shadowColor = "rgba(255, 50, 80, 0.6)";
        // Body
        var bGrad = ctx.createLinearGradient(-o.size * 0.9, -o.size, o.size * 0.9, o.size);
        bGrad.addColorStop(0, "rgba(150, 20, 80, " + (0.5 + progress * 0.4).toFixed(2) + ")");
        bGrad.addColorStop(0.5, "rgba(200, 50, 120, " + (0.7 + progress * 0.3).toFixed(2) + ")");
        bGrad.addColorStop(1, "rgba(150, 20, 80, " + (0.5 + progress * 0.4).toFixed(2) + ")");
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.moveTo(0, -o.size); ctx.lineTo(o.size * 0.9, 0);
        ctx.lineTo(0, o.size); ctx.lineTo(-o.size * 0.9, 0);
        ctx.closePath(); ctx.fill();
        // Edge
        ctx.strokeStyle = "rgba(255, 150, 180, " + (0.5 + progress * 0.4).toFixed(2) + ")";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -o.size); ctx.lineTo(o.size * 0.9, 0);
        ctx.lineTo(0, o.size); ctx.lineTo(-o.size * 0.9, 0);
        ctx.closePath(); ctx.stroke();
        // Warning ring
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255, 80, 50, " + (progress * 0.7).toFixed(2) + ")";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, o.maxSize + 10, 0, progress * Math.PI * 2); ctx.stroke();
        ctx.restore();
    }
    // Draw shards
    for (var i = 0; i < this.shards.length; i++) {
        var s = this.shards[i];
        var sAlpha = Math.min(1, s.life * 0.7).toFixed(2);
        ctx.save();
        ctx.translate(s.x, s.y); ctx.rotate(s.rot);
        ctx.shadowBlur = 5;
        ctx.shadowColor = "rgba(255, 80, 120, 0.4)";
        ctx.fillStyle = "rgba(200, 50, 100, " + sAlpha + ")";
        ctx.beginPath();
        ctx.moveTo(0, -s.size); ctx.lineTo(s.size * 0.5, 0);
        ctx.lineTo(0, s.size); ctx.lineTo(-s.size * 0.5, 0);
        ctx.closePath(); ctx.fill();
        ctx.restore();
    }
    ctx.restore();
};

FractureExplosionPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2, cy = sy + sh / 2;
    for (var i = 0; i < this.shards.length; i++) {
        var s = this.shards[i];
        var dx = cx - s.x, dy = cy - s.y;
        if (Math.sqrt(dx * dx + dy * dy) < s.size + sw / 2) return this.damVal;
    }
    for (var i = 0; i < this.octahedrons.length; i++) {
        var o = this.octahedrons[i];
        if (o.size < 5) continue;
        var dx = cx - o.x, dy = cy - o.y;
        if (Math.sqrt(dx * dx + dy * dy) < o.size + sw / 2) return this.damVal;
    }
    return 0;
};

FractureExplosionPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.octahedrons.length === 0 && this.shards.length === 0;
};
