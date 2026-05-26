// vaderForceLevitation.js — Darth Vader levitates metallic objects and launches them at the player
var VaderForceLevitationPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 1.35; // Fling events
    this.damVal = config.damVal || 9;
    this.debris = []; // levitating debris: { x, y, size, angle, targetX, targetY, delayTimer, phase: 'levitating'|'flung', vx, vy }
};

VaderForceLevitationPattern.prototype = Object.create(BulletPattern.prototype);

VaderForceLevitationPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.8;
    this.debris = [];
};

VaderForceLevitationPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];

    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        
        // Spawn 2 objects that levitate and lock onto player
        for (var i = 0; i < 2; i++) {
            var size = 18 + Math.floor(Math.random() * 10);
            // Spawn on random sides
            var sx = bb[0] + Math.random() * bbW;
            var sy = bb[1] - 40; // start above the box
            if (Math.random() < 0.5) {
                sx = Math.random() < 0.5 ? bb[0] - 40 : bb[2] + 40;
                sy = bb[1] + Math.random() * bbH;
            }

            var targetX = sx;
            var targetY = sy + 30; // float slightly downwards

            this.debris.push({
                x: sx, y: sy,
                targetX: targetX,
                targetY: targetY,
                size: size,
                rotation: Math.random() * Math.PI * 2,
                rotSpd: (Math.random() - 0.5) * 4,
                delayTimer: 0.0,
                maxDelay: 0.85,
                phase: 'levitating',
                vx: 0, vy: 0,
                soundPlayed: false
            });
        }
    }

    // Process debris behaviors
    var pX = 320;
    var pY = 320;
    if (typeof Soul !== "undefined" && Soul.getPos) {
        var sp = Soul.getPos();
        pX = sp.x + Soul.getWidth() / 2;
        pY = sp.y + Soul.getHeight() / 2;
    }

    for (var i = this.debris.length - 1; i >= 0; i--) {
        var d = this.debris[i];
        d.rotation += d.rotSpd * dt;

        if (d.phase === 'levitating') {
            d.delayTimer += dt;
            // Float slowly to target levitation spot
            d.x += (d.targetX - d.x) * 4 * dt;
            d.y += (d.targetY - d.y) * 4 * dt;

            if (d.delayTimer >= d.maxDelay) {
                d.phase = 'flung';
                // Lock target angle to player current position
                var angle = Math.atan2(pY - d.y, pX - d.x);
                var speed = 320 + Math.random() * 80;
                d.vx = Math.cos(angle) * speed;
                d.vy = Math.sin(angle) * speed;
                d.rotSpd = (d.vx > 0 ? 8 : -8); // spin faster when thrown
            }
        } else {
            // Flung movement
            d.x += d.vx * dt;
            d.y += d.vy * dt;

            if (!d.soundPlayed) {
                Sound.playSound("damage", true); // whoosh / smash sound
                d.soundPlayed = true;
            }

            // Remove offscreen
            if (d.x < bb[0] - 100 || d.x > bb[2] + 100 || d.y < bb[1] - 100 || d.y > bb[3] + 100) {
                this.debris.splice(i, 1);
            }
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

VaderForceLevitationPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2;
    var cy = sy + sh / 2;
    var radius = (sw + sh) / 4;

    for (var i = 0; i < this.debris.length; i++) {
        var d = this.debris[i];
        // Only active collision when thrown or close
        var dx = cx - d.x;
        var dy = cy - d.y;
        var distSq = dx * dx + dy * dy;
        var colDist = radius + (d.size / 2) - 2;
        if (distSq < colDist * colDist) {
            return this.damVal;
        }
    }
    return 0;
};

VaderForceLevitationPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();

    for (var i = 0; i < this.debris.length; i++) {
        var d = this.debris[i];
        ctx.save();
        
        // 1. Draw glowing purple Force levitation aura around the object
        ctx.shadowBlur = 15;
        if (d.phase === 'levitating') {
            ctx.shadowColor = "#BA55D3"; // Purple
            var scale = 1.0 + Math.sin(Date.now() / 80) * 0.08;
            ctx.translate(d.x, d.y);
            ctx.scale(scale, scale);
            ctx.rotate(d.rotation);
        } else {
            ctx.shadowColor = "#FF007F"; // Hot pink trace
            ctx.translate(d.x, d.y);
            ctx.rotate(d.rotation);
        }

        // Draw structural metallic metal junk (hexagons / triangles)
        ctx.fillStyle = "#2c2c2c";
        ctx.strokeStyle = "#5a5a5a";
        ctx.lineWidth = 1.8;

        ctx.beginPath();
        var numVertices = 5;
        var rad = d.size / 2;
        for (var v = 0; v < numVertices; v++) {
            var vAngle = v * (Math.PI * 2 / numVertices);
            var vx = Math.cos(vAngle) * rad;
            var vy = Math.sin(vAngle) * rad;
            if (v === 0) ctx.moveTo(vx, vy);
            else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // High gloss highlight
        ctx.fillStyle = "#808080";
        ctx.beginPath();
        ctx.arc(-2, -2, rad * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // 2. Draw quick laser warning path to show lock-on
        if (d.phase === 'levitating') {
            ctx.save();
            ctx.globalAlpha = 0.08 + (d.delayTimer / d.maxDelay) * 0.12;
            ctx.strokeStyle = "#BA55D3";
            ctx.lineWidth = 1.0;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            // Draw path to player position
            var pX = 320;
            var pY = 320;
            if (typeof Soul !== "undefined" && Soul.getPos) {
                var sp = Soul.getPos();
                pX = sp.x + Soul.getWidth() / 2;
                pY = sp.y + Soul.getHeight() / 2;
            }
            ctx.lineTo(pX, pY);
            ctx.stroke();
            ctx.restore();
        }
    }

    ctx.restore();
};

VaderForceLevitationPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.debris.length === 0;
};
