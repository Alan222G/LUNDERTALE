// gaster_blaster.js — Telegraphed beam attack (Sans-style)
// Multiple simultaneous beams, full edge-to-edge coverage

var GasterBlasterPattern = function(config) {
    BulletPattern.call(this, config);
    this.beams = [];
    this.maxBeams = config.maxBeams || 6;
    this.beamCount = 0;
    this.beamInterval = config.beamInterval || 0.6; // Much faster spawning
    this.beamTimer = 0;
    this.warningDuration = config.warningDuration || 0.5;
    this.beamDuration = config.beamDuration || 0.8;
    this.beamWidth = config.beamWidth || 30;
    this.duration = config.duration || 6;
    this.elapsed = 0;
};

GasterBlasterPattern.prototype = Object.create(BulletPattern.prototype);

GasterBlasterPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.beams = [];
    this.beamCount = 0;
    this.beamTimer = this.beamInterval * 0.3; // Start fast
    this.elapsed = 0;
};

GasterBlasterPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.beamTimer += dt;

    // Spawn new beams — can spawn 2 at once for overlap
    if (this.beamTimer >= this.beamInterval && this.beamCount < this.maxBeams) {
        this.beamTimer -= this.beamInterval;
        this.spawnBeam();
        this.beamCount++;
        // 60% chance to spawn a second beam simultaneously
        if (Math.random() < 0.6 && this.beamCount < this.maxBeams) {
            this.spawnBeam();
            this.beamCount++;
        }
    }

    // Update beam states
    for (var i = this.beams.length - 1; i >= 0; i--) {
        this.beams[i].timer += dt;
        if (this.beams[i].timer > this.warningDuration + this.beamDuration) {
            this.beams.splice(i, 1);
        }
    }
};

GasterBlasterPattern.prototype.spawnBeam = function() {
    var bb = Cbbox.getBound();
    var horizontal = Math.random() > 0.5;
    var bbWidth = bb[2] - bb[0];
    var bbHeight = bb[3] - bb[1];

    if (horizontal) {
        // Horizontal beam — FULL WIDTH edge to edge
        var y = randomRange(bb[1] + 10, bb[3] - this.beamWidth - 10);
        this.beams.push({
            x: bb[0], y: y,
            w: bbWidth, h: this.beamWidth,
            horizontal: true,
            timer: 0
        });
    } else {
        // Vertical beam — FULL HEIGHT edge to edge
        var x = randomRange(bb[0] + 10, bb[2] - this.beamWidth - 10);
        this.beams.push({
            x: x, y: bb[1],
            w: this.beamWidth, h: bbHeight,
            horizontal: false,
            timer: 0
        });
    }
};

// Override collision to use beam rectangles instead of bullet array
GasterBlasterPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.beams.length; i++) {
        var beam = this.beams[i];
        // Only damage during active phase (after warning)
        if (beam.timer > this.warningDuration && beam.timer < this.warningDuration + this.beamDuration) {
            if (rectsOverlap(beam.x, beam.y, beam.w, beam.h, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }
    return 0;
};

// Custom draw for beams
GasterBlasterPattern.prototype.draw = function(ctx) {
    for (var i = 0; i < this.beams.length; i++) {
        var beam = this.beams[i];
        ctx.save();

        if (beam.timer <= this.warningDuration) {
            // WARNING PHASE — flashing with inner glow line
            var flashRate = Math.floor(beam.timer * 14) % 2;
            ctx.globalAlpha = flashRate ? 0.35 : 0.12;
            ctx.fillStyle = "#FF2200";
            ctx.fillRect(beam.x, beam.y, beam.w, beam.h);
            // Inner warning line
            ctx.globalAlpha = flashRate ? 0.5 : 0.2;
            ctx.fillStyle = "#FF8800";
            if (beam.horizontal) {
                ctx.fillRect(beam.x, beam.y + beam.h / 2 - 1, beam.w, 2);
            } else {
                ctx.fillRect(beam.x + beam.w / 2 - 1, beam.y, 2, beam.h);
            }
        } else {
            // ACTIVE PHASE — plasma beam with layers
            var beamLife = beam.timer - this.warningDuration;
            var fadeOut = 1 - (beamLife / this.beamDuration);
            var pulse = Math.sin(beamLife * 20) * 0.08 + 0.92;
            ctx.globalAlpha = fadeOut;

            // Outer aura (wider than beam)
            ctx.fillStyle = "rgba(255, 200, 0, 0.2)";
            ctx.fillRect(beam.x - 5, beam.y - 5, beam.w + 10, beam.h + 10);

            // Main beam — golden glow
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#FFAA00";
            ctx.fillStyle = "rgba(255, 220, 50, " + (0.7 * pulse).toFixed(2) + ")";
            ctx.fillRect(beam.x, beam.y, beam.w, beam.h);

            // Inner bright core
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#FFFFFF";
            var coreOffset = 5;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(
                beam.x + (beam.horizontal ? 0 : coreOffset),
                beam.y + (beam.horizontal ? coreOffset : 0),
                beam.w - (beam.horizontal ? 0 : coreOffset * 2),
                beam.h - (beam.horizontal ? coreOffset * 2 : 0));

            // Ultra-bright center line
            ctx.shadowBlur = 0;
            ctx.fillStyle = "rgba(255, 255, 220, 0.9)";
            if (beam.horizontal) {
                ctx.fillRect(beam.x, beam.y + beam.h / 2 - 1, beam.w, 2);
            } else {
                ctx.fillRect(beam.x + beam.w / 2 - 1, beam.y, 2, beam.h);
            }
            
            // Edge sparks
            ctx.shadowBlur = 0;
            for (var s = 0; s < 6; s++) {
                var sx, sy;
                if (beam.horizontal) {
                    sx = beam.x + Math.random() * beam.w;
                    sy = beam.y + (Math.random() > 0.5 ? -1 : beam.h + 1) + (Math.random() - 0.5) * 4;
                } else {
                    sx = beam.x + (Math.random() > 0.5 ? -1 : beam.w + 1) + (Math.random() - 0.5) * 4;
                    sy = beam.y + Math.random() * beam.h;
                }
                ctx.fillStyle = "rgba(255, 200, 50, " + (0.3 + Math.random() * 0.4).toFixed(2) + ")";
                ctx.beginPath();
                ctx.arc(sx, sy, 1 + Math.random(), 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }
};

GasterBlasterPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.beams.length === 0;
};
