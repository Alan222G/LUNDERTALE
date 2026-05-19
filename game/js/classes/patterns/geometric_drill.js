// geometric_drill.js — Ramiel's Geometric Drill: two independent drills passing through in opposite directions
var GeometricDrillPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
    this.drillSpeed = 55;
    this.drillWidth = 30;
    this.seismicWaves = [];
    this.debris = [];
    this.battleBox = null;

    // Each drill is fully independent with its own state
    // drill.exploded, drill.explosionParticles, drill.explosionTime
    this.drills = [];
};

GeometricDrillPattern.prototype = Object.create(BulletPattern.prototype);

GeometricDrillPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    var cx = (battleBox[0] + battleBox[2]) / 2;

    // Drill 1: spawns above the box, descends downward
    // Drill 2: spawns below the box, ascends upward
    this.drills = [
        {
            x: cx,
            y: battleBox[1] - 10,      // start above
            rot: 0,
            dir: 1,                      // moves downward (+y)
            originEdge: battleBox[1],    // top edge (column extends back here)
            exitY: battleBox[3] + 20,    // exits past bottom
            exploded: false,
            explosionParticles: [],
            explosionTime: 0,
            waveTimer: 0,
            active: true
        },
        {
            x: cx,
            y: battleBox[3] + 10,       // start below
            rot: 0,
            dir: -1,                     // moves upward (-y)
            originEdge: battleBox[3],    // bottom edge (column extends back here)
            exitY: battleBox[1] - 20,    // exits past top
            exploded: false,
            explosionParticles: [],
            explosionTime: 0,
            waveTimer: 0,
            active: true
        }
    ];

    this.seismicWaves = [];
    this.debris = [];
};

GeometricDrillPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    var bb = Cbbox.getBound();
    var waveInterval = 0.6;

    for (var d = 0; d < this.drills.length; d++) {
        var drill = this.drills[d];
        if (!drill.active) continue;

        if (!drill.exploded) {
            // Move drill
            drill.y += this.drillSpeed * drill.dir * dt;
            drill.rot += 6.0 * dt; // always spin forward

            // Generate seismic waves independently per drill
            // Only when the drill tip is inside the battle box
            var tipInside = (drill.dir === 1)
                ? (drill.y > bb[1] + 20 && drill.y < bb[3])
                : (drill.y < bb[3] - 20 && drill.y > bb[1]);

            drill.waveTimer += dt;
            if (drill.waveTimer >= waveInterval && tipInside) {
                drill.waveTimer = 0;

                // Spawn horizontal crystal shards going left and right
                var numPerSide = 3;
                for (var side = -1; side <= 1; side += 2) {
                    for (var j = 0; j < numPerSide; j++) {
                        var spreadAngle = side * (0.1 + j * 0.25);
                        var speed = 90 + j * 20;
                        this.seismicWaves.push({
                            x: drill.x,
                            y: drill.y + 10 * drill.dir,
                            vx: Math.cos(spreadAngle) * speed * side,
                            vy: Math.sin(spreadAngle) * speed * 0.3 * drill.dir,
                            size: 6 + j * 2,
                            life: 2.5,
                            maxLife: 2.5,
                            rot: Math.random() * Math.PI
                        });
                    }
                }

                // Spawn debris particles
                for (var deb = 0; deb < 6; deb++) {
                    this.debris.push({
                        x: drill.x + (Math.random() - 0.5) * 30,
                        y: drill.y + 15 * drill.dir,
                        vx: (Math.random() - 0.5) * 80,
                        vy: (-20 - Math.random() * 60) * drill.dir,
                        size: 1 + Math.random() * 3,
                        life: 0.8 + Math.random() * 0.5,
                        gravity: 120 * drill.dir
                    });
                }
            }

            // Check if this drill has exited the opposite edge
            var exited = (drill.dir === 1)
                ? (drill.y >= drill.exitY)
                : (drill.y <= drill.exitY);

            if (exited) {
                drill.exploded = true;
                drill.explosionTime = 0;
                // Create explosion at the exit point
                var explosionX = drill.x;
                var explosionY = (drill.dir === 1) ? bb[3] : bb[1];
                var numExplosion = 36;
                for (var i = 0; i < numExplosion; i++) {
                    var angle = (i / numExplosion) * Math.PI * 2;
                    var spd = 120 + Math.random() * 100;
                    drill.explosionParticles.push({
                        x: explosionX,
                        y: explosionY,
                        vx: Math.cos(angle) * spd,
                        vy: Math.sin(angle) * spd,
                        size: 4 + Math.random() * 6,
                        life: 1.5 + Math.random() * 0.5,
                        maxLife: 2.0,
                        rot: Math.random() * Math.PI,
                        rotSpeed: (Math.random() - 0.5) * 10
                    });
                }
            }
        } else {
            // Drill has exploded — update its explosion particles
            drill.explosionTime += dt;
            for (var i = drill.explosionParticles.length - 1; i >= 0; i--) {
                var p = drill.explosionParticles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.rot += p.rotSpeed * dt;
                p.life -= dt;
                if (p.life <= 0) drill.explosionParticles.splice(i, 1);
            }

            // Mark inactive when all explosion particles are gone
            if (drill.explosionParticles.length === 0 && drill.explosionTime > 0.5) {
                drill.active = false;
            }
        }
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

    // Update debris
    for (var i = this.debris.length - 1; i >= 0; i--) {
        var db = this.debris[i];
        db.x += db.vx * dt;
        db.vy += db.gravity * dt;
        db.y += db.vy * dt;
        db.life -= dt;
        if (db.life <= 0) this.debris.splice(i, 1);
    }
};

GeometricDrillPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();

    // Draw each drill independently
    for (var d = 0; d < this.drills.length; d++) {
        var drill = this.drills[d];
        if (!drill.active) continue;

        if (!drill.exploded) {
            ctx.save();
            ctx.translate(drill.x, drill.y);

            // Flip the bottom drill (dir === -1) so it visually points upward
            if (drill.dir === -1) {
                ctx.rotate(Math.PI);
            }

            // Column extending from drill body back toward its origin edge
            var columnHeight = Math.abs(drill.y - drill.originEdge) + 20;
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
                var rOffset = (drill.rot * 2 + r * 0.8) % (Math.PI * 2);
                var rAlpha = (0.3 + Math.sin(rOffset) * 0.2).toFixed(2);
                ctx.strokeStyle = "rgba(150, 200, 255, " + rAlpha + ")";
                ctx.beginPath();
                ctx.ellipse(0, ry, this.drillWidth / 3, 5, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Rotating drill tip (cone shape)
            ctx.save();
            ctx.rotate(drill.rot); // spin always forward

            // Drill cone gradient
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
        }

        // Draw this drill's explosion particles
        for (var i = 0; i < drill.explosionParticles.length; i++) {
            var p = drill.explosionParticles[i];
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

        // Explosion flash per drill
        if (drill.exploded && drill.explosionTime < 0.3) {
            var flashA = (1 - drill.explosionTime / 0.3) * 0.5;
            ctx.fillStyle = "rgba(200, 230, 255, " + flashA.toFixed(2) + ")";
            ctx.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
        }
    }

    // Draw debris particles
    for (var i = 0; i < this.debris.length; i++) {
        var deb = this.debris[i];
        var dAlpha = (deb.life / 1.3).toFixed(2);
        ctx.fillStyle = "rgba(150, 180, 220, " + dAlpha + ")";
        ctx.beginPath();
        ctx.arc(deb.x, deb.y, deb.size, 0, Math.PI * 2);
        ctx.fill();
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

    ctx.restore();
};

GeometricDrillPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var soulCX = sx + sw / 2;
    var soulCY = sy + sh / 2;

    // Check each drill body independently
    for (var d = 0; d < this.drills.length; d++) {
        var drill = this.drills[d];
        if (!drill.active || drill.exploded) continue;

        // Drill column + tip hitbox: from origin edge to drill tip
        var drillLeft = drill.x - this.drillWidth / 2;
        var drillRight = drill.x + this.drillWidth / 2;
        var drillTop, drillBottom;
        if (drill.dir === 1) {
            // Descending: column from originEdge (top) down to tip
            drillTop = drill.originEdge;
            drillBottom = drill.y + 35;
        } else {
            // Ascending: column from tip up to originEdge (bottom)
            drillTop = drill.y - 35;
            drillBottom = drill.originEdge;
        }

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

    // Explosion particle collision (check both drills)
    for (var d = 0; d < this.drills.length; d++) {
        var drill = this.drills[d];
        for (var i = 0; i < drill.explosionParticles.length; i++) {
            var p = drill.explosionParticles[i];
            var dx = soulCX - p.x;
            var dy = soulCY - p.y;
            if (Math.sqrt(dx * dx + dy * dy) < p.size + sw / 2) {
                return this.damVal;
            }
        }
    }

    return 0;
};

GeometricDrillPattern.prototype.isOver = function() {
    // Both drills must be inactive (exploded + particles gone) and all shared effects cleared
    var allDrillsDone = true;
    for (var d = 0; d < this.drills.length; d++) {
        if (this.drills[d].active) {
            allDrillsDone = false;
            break;
        }
    }
    return this.elapsed >= this.duration && allDrillsDone &&
        this.seismicWaves.length === 0 && this.debris.length === 0;
};
