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
    var bb = this.battleBox;
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
            // WARNING PHASE — flashing semi-transparent rectangle
            var flashRate = Math.floor(beam.timer * 12) % 2;
            ctx.globalAlpha = flashRate ? 0.3 : 0.15;
            ctx.fillStyle = "#F44";
            ctx.fillRect(beam.x, beam.y, beam.w, beam.h);
        } else {
            // ACTIVE PHASE — bright beam with glow
            var beamLife = beam.timer - this.warningDuration;
            var fadeOut = 1 - (beamLife / this.beamDuration);
            ctx.globalAlpha = fadeOut;

            // Outer glow
            ctx.fillStyle = "#FFF";
            ctx.fillRect(beam.x - 3, beam.y - 3, beam.w + 6, beam.h + 6);

            // Inner beam
            ctx.fillStyle = "#FF0";
            ctx.fillRect(beam.x, beam.y, beam.w, beam.h);

            // Core
            var coreOffset = 4;
            ctx.fillStyle = "#FFF";
            ctx.fillRect(
                beam.x + (beam.horizontal ? 0 : coreOffset),
                beam.y + (beam.horizontal ? coreOffset : 0),
                beam.w - (beam.horizontal ? 0 : coreOffset * 2),
                beam.h - (beam.horizontal ? coreOffset * 2 : 0));
        }
        ctx.restore();
    }
};

GasterBlasterPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.beams.length === 0;
};
