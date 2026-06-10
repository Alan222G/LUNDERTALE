// galactusPatterns.js — 21 attack patterns for GALACTUS (El Devorador de Mundos)
// Each phase has exactly 7 attacks.
// Phase 1: El Heraldo — measured, imperial cosmic attacks
// Phase 2: El Hambriento — aggressive, hungrier attacks
// Phase 3: El Devorador — maximum power, reality-bending

// Shared particle system for Galactus
var galactusParticles = [];
function spawnGalactusParticle(x, y, vx, vy, size, life, color, dmg) {
    galactusParticles.push({ x: x, y: y, vx: vx, vy: vy, size: size, life: life, maxLife: life, color: color, dmg: dmg || 0 });
}
function updateGalactusParticles(dt) {
    for (var i = galactusParticles.length - 1; i >= 0; i--) {
        var p = galactusParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) galactusParticles.splice(i, 1);
    }
}
function drawGalactusParticles(ctx) {
    for (var i = 0; i < galactusParticles.length; i++) {
        var p = galactusParticles[i];
        var alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = p.size * 2;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
}

// ============================================================
// PHASE 1: EL HERALDO — 7 ATTACKS
// ============================================================

// 1. galactusCosmicBeam — Sweeping purple energy beam across the box
var GalactusCosmicBeamPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
    this.beamAngle = 0;
    this.beamActive = false;
    this.beamWarning = 0;
    this.beamTimer = 0;
    this.beamCount = 0;
    this.maxBeams = 3;
    this.trailSegments = [];
};
GalactusCosmicBeamPattern.prototype = Object.create(BulletPattern.prototype);
GalactusCosmicBeamPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.beamAngle = -Math.PI * 0.3;
    this.beamActive = false;
    this.beamWarning = 1.2;
    this.beamTimer = 0;
    this.beamCount = 0;
    this.trailSegments = [];
    galactusParticles = [];
};
GalactusCosmicBeamPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var topY = bb[1];

    if (this.beamCount < this.maxBeams && this.elapsed < this.duration - 1.5) {
        if (this.beamWarning > 0) {
            this.beamWarning -= dt;
            if (this.beamWarning <= 0) {
                this.beamActive = true;
                this.beamTimer = 1.8;
                this.beamAngle = -Math.PI * 0.35 + (this.beamCount % 2 === 0 ? 0 : Math.PI * 0.7);
                Sound.playSound("laser", true);
                if (typeof triggerShake !== "undefined") triggerShake(5, 150);
            }
        } else if (this.beamActive) {
            // Sweep the beam across
            var sweepDir = (this.beamCount % 2 === 0) ? 1 : -1;
            this.beamAngle += sweepDir * 0.6 * dt;
            this.beamTimer -= dt;

            // Spawn residual trail segments
            var endX = cx + Math.cos(this.beamAngle) * 300;
            var endY = topY + Math.sin(this.beamAngle) * 300;
            this.trailSegments.push({ x1: cx, y1: topY, x2: endX, y2: endY, life: 1.5 });

            // Spawn particles along beam
            if (Math.random() < 0.5) {
                var t = Math.random();
                var px = cx + (endX - cx) * t;
                var py = topY + (endY - topY) * t;
                spawnGalactusParticle(px, py, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, 3, 0.5, "#BB44FF", 0);
            }

            if (this.beamTimer <= 0) {
                this.beamActive = false;
                this.beamCount++;
                if (this.beamCount < this.maxBeams) {
                    this.beamWarning = 1.0;
                }
            }
        }
    }

    // Update trail segments
    for (var i = this.trailSegments.length - 1; i >= 0; i--) {
        this.trailSegments[i].life -= dt;
        if (this.trailSegments[i].life <= 0) this.trailSegments.splice(i, 1);
    }
};
GalactusCosmicBeamPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var topY = bb[1];

    // Check active beam
    if (this.beamActive) {
        var endX = cx + Math.cos(this.beamAngle) * 300;
        var endY = topY + Math.sin(this.beamAngle) * 300;
        var dist = this._pointToLineDist(scx, scy, cx, topY, endX, endY);
        if (dist < 16) return this.damVal;
    }

    // Check trail segments (lower damage)
    for (var i = 0; i < this.trailSegments.length; i++) {
        var s = this.trailSegments[i];
        if (s.life < 0.5) continue;
        var dist = this._pointToLineDist(scx, scy, s.x1, s.y1, s.x2, s.y2);
        if (dist < 8) return Math.floor(this.damVal * 0.4);
    }
    return 0;
};
GalactusCosmicBeamPattern.prototype._pointToLineDist = function(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    var t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    var projX = x1 + t * dx;
    var projY = y1 + t * dy;
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
};
GalactusCosmicBeamPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var topY = bb[1];
    ctx.save();

    // Draw trail segments
    for (var i = 0; i < this.trailSegments.length; i++) {
        var s = this.trailSegments[i];
        var alpha = s.life / 1.5;
        ctx.globalAlpha = alpha * 0.4;
        ctx.strokeStyle = "#9933CC";
        ctx.lineWidth = 6;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#9933CC";
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // Draw warning indicator
    if (this.beamWarning > 0 && this.beamWarning < 1.2) {
        var wAlpha = 0.3 + Math.sin(this.elapsed * 20) * 0.3;
        ctx.globalAlpha = wAlpha;
        ctx.strokeStyle = "#FF00FF";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        var wAngle = -Math.PI * 0.35 + (this.beamCount % 2 === 0 ? 0 : Math.PI * 0.7);
        ctx.beginPath();
        ctx.moveTo(cx, topY);
        ctx.lineTo(cx + Math.cos(wAngle) * 300, topY + Math.sin(wAngle) * 300);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;
    }

    // Draw active beam
    if (this.beamActive) {
        var endX = cx + Math.cos(this.beamAngle) * 300;
        var endY = topY + Math.sin(this.beamAngle) * 300;

        // Outer glow
        ctx.strokeStyle = "rgba(128, 0, 255, 0.5)";
        ctx.lineWidth = 30;
        ctx.shadowBlur = 25;
        ctx.shadowColor = "#8800FF";
        ctx.beginPath();
        ctx.moveTo(cx, topY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Core beam
        ctx.strokeStyle = "#CC66FF";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(cx, topY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // White center
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, topY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusCosmicBeamPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.trailSegments.length === 0;
};

// 2. galactusHeraldSurfer — Silver Surfer curves across the box leaving a silver trail
var GalactusHeraldSurferPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 7;
    this.surfer = null;
    this.trail = [];
    this.passCount = 0;
    this.maxPasses = 4;
    this.passTimer = 0;
};
GalactusHeraldSurferPattern.prototype = Object.create(BulletPattern.prototype);
GalactusHeraldSurferPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.surfer = null;
    this.trail = [];
    this.passCount = 0;
    this.passTimer = 0.5;
    galactusParticles = [];
};
GalactusHeraldSurferPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);
    var bb = Cbbox.getBound();

    if (this.elapsed < this.duration - 1.5) {
        this.passTimer -= dt;
        if (this.passTimer <= 0 && this.passCount < this.maxPasses && !this.surfer) {
            // Launch surfer from a random edge
            var side = this.passCount % 4;
            var s = { x: 0, y: 0, vx: 0, vy: 0, curve: 0, speed: 160 + this.passCount * 30 };
            if (side === 0) { s.x = bb[0]; s.y = bb[1] + Math.random() * (bb[3] - bb[1]); s.vx = s.speed; s.curve = (Math.random() - 0.5) * 100; }
            else if (side === 1) { s.x = bb[2]; s.y = bb[1] + Math.random() * (bb[3] - bb[1]); s.vx = -s.speed; s.curve = (Math.random() - 0.5) * 100; }
            else if (side === 2) { s.x = bb[0] + Math.random() * (bb[2] - bb[0]); s.y = bb[1]; s.vy = s.speed; s.curve = (Math.random() - 0.5) * 100; }
            else { s.x = bb[0] + Math.random() * (bb[2] - bb[0]); s.y = bb[3]; s.vy = -s.speed; s.curve = (Math.random() - 0.5) * 100; }
            this.surfer = s;
            this.passCount++;
            Sound.playSound("ting", true);
        }
    }

    if (this.surfer) {
        var s = this.surfer;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        // Add curve perpendicular to movement
        if (s.vx !== 0) s.y += s.curve * dt;
        if (s.vy !== 0) s.x += s.curve * dt;

        // Leave trail
        this.trail.push({ x: s.x, y: s.y, life: 2.0 });

        // Silver spark particles
        if (Math.random() < 0.4) {
            spawnGalactusParticle(s.x, s.y, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, 2, 0.4, "#C0C0C0", 0);
        }

        // Remove if out of bounds
        if (s.x < bb[0] - 30 || s.x > bb[2] + 30 || s.y < bb[1] - 30 || s.y > bb[3] + 30) {
            this.surfer = null;
            this.passTimer = 0.8;
        }
    }

    // Update trail
    for (var i = this.trail.length - 1; i >= 0; i--) {
        this.trail[i].life -= dt;
        if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }
};
GalactusHeraldSurferPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;

    // Check surfer body
    if (this.surfer) {
        var dist = Math.sqrt(Math.pow(scx - this.surfer.x, 2) + Math.pow(scy - this.surfer.y, 2));
        if (dist < 14) return this.damVal;
    }

    // Check trail
    for (var i = 0; i < this.trail.length; i++) {
        var t = this.trail[i];
        if (t.life < 0.5) continue;
        var dist = Math.sqrt(Math.pow(scx - t.x, 2) + Math.pow(scy - t.y, 2));
        if (dist < 6) return Math.floor(this.damVal * 0.5);
    }
    return 0;
};
GalactusHeraldSurferPattern.prototype.draw = function(ctx) {
    ctx.save();

    // Draw trail
    for (var i = 0; i < this.trail.length; i++) {
        var t = this.trail[i];
        var alpha = t.life / 2.0;
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle = "#C0C0C0";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(t.x, t.y, 4 * alpha, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Draw surfer
    if (this.surfer) {
        var s = this.surfer;
        ctx.save();
        ctx.translate(s.x, s.y);

        // Silver board
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#FFFFFF";
        ctx.fillStyle = "#E0E0E0";
        ctx.beginPath();
        ctx.ellipse(0, 4, 12, 3, Math.atan2(s.vy, s.vx), 0, Math.PI * 2);
        ctx.fill();

        // Figure on board
        ctx.fillStyle = "#C0C0C0";
        ctx.beginPath();
        ctx.arc(0, -4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-2, -2, 4, 8);

        ctx.restore();
    }

    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusHeraldSurferPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.trail.length === 0 && !this.surfer;
};

// 3. galactusPowerCosmic — Pulsing concentric energy rings expanding from center
var GalactusPowerCosmicPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.rings = [];
    this.spawnTimer = 0;
};
GalactusPowerCosmicPattern.prototype = Object.create(BulletPattern.prototype);
GalactusPowerCosmicPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.rings = [];
    this.spawnTimer = 0;
    galactusParticles = [];
};
GalactusPowerCosmicPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;

    if (this.elapsed < this.duration - 2.0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 0.9;
            this.rings.push({ cx: cx, cy: cy, radius: 5, speed: 90, maxRadius: 200, thickness: 10 });
            Sound.playSound("ting", true);
            for (var p = 0; p < 8; p++) {
                var a = Math.random() * Math.PI * 2;
                spawnGalactusParticle(cx, cy, Math.cos(a) * 50, Math.sin(a) * 50, 3, 0.6, "#BB44FF", 0);
            }
        }
    }

    for (var i = this.rings.length - 1; i >= 0; i--) {
        var r = this.rings[i];
        r.radius += r.speed * dt;
        if (r.radius > r.maxRadius) {
            this.rings.splice(i, 1);
        }
    }
};
GalactusPowerCosmicPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;
    for (var i = 0; i < this.rings.length; i++) {
        var r = this.rings[i];
        var dist = Math.sqrt(Math.pow(scx - r.cx, 2) + Math.pow(scy - r.cy, 2));
        if (Math.abs(dist - r.radius) < r.thickness && r.radius > 15) {
            return this.damVal;
        }
    }
    return 0;
};
GalactusPowerCosmicPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.rings.length; i++) {
        var r = this.rings[i];
        var alpha = 1.0 - (r.radius / r.maxRadius);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "#9933FF";
        ctx.lineWidth = r.thickness;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#BB44FF";
        ctx.beginPath();
        ctx.arc(r.cx, r.cy, r.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner bright ring
        ctx.strokeStyle = "#DD88FF";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(r.cx, r.cy, r.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusPowerCosmicPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.rings.length === 0;
};

// 4. galactusGravityCrush — Box shrinks under gravitational pressure + orbiting debris
var GalactusGravityCrushPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.crushPhase = 0; // 0=shrinking, 1=hold, 2=explode
    this.crushTimer = 0;
    this.debris = [];
    this.shockwave = null;
    this.origBounds = null;
};
GalactusGravityCrushPattern.prototype = Object.create(BulletPattern.prototype);
GalactusGravityCrushPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.crushPhase = 0;
    this.crushTimer = 0;
    this.debris = [];
    this.shockwave = null;
    this.origBounds = Cbbox.getBound().slice();
    galactusParticles = [];

    // Spawn orbiting debris
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    for (var d = 0; d < 6; d++) {
        this.debris.push({
            angle: d * Math.PI / 3,
            dist: 60 + Math.random() * 30,
            speed: 1.5 + Math.random() * 0.5,
            size: 5 + Math.random() * 4
        });
    }
};
GalactusGravityCrushPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;

    // Rotate debris
    for (var d = 0; d < this.debris.length; d++) {
        this.debris[d].angle += this.debris[d].speed * dt;
    }

    if (this.crushPhase === 0) {
        // Shrink phase — reduce box
        this.crushTimer += dt;
        var shrinkAmount = Math.min(this.crushTimer * 25, 60);
        if (typeof Cbbox.setBound === "function") {
            Cbbox.setBound([
                this.origBounds[0] + shrinkAmount,
                this.origBounds[1] + shrinkAmount * 0.6,
                this.origBounds[2] - shrinkAmount,
                this.origBounds[3] - shrinkAmount * 0.6
            ]);
        }
        if (this.crushTimer >= 3.0) {
            this.crushPhase = 1;
            this.crushTimer = 0;
        }
    } else if (this.crushPhase === 1) {
        // Hold — stay crushed
        this.crushTimer += dt;
        if (this.crushTimer >= 1.5) {
            this.crushPhase = 2;
            this.crushTimer = 0;
            this.shockwave = { radius: 10, speed: 200, maxRadius: 200 };
            Sound.playSound("laser", true);
            if (typeof triggerShake !== "undefined") triggerShake(6, 200);
            // Restore box
            if (typeof Cbbox.setBound === "function") {
                Cbbox.setBound(this.origBounds.slice());
            }
        }
    } else if (this.crushPhase === 2) {
        // Explode shockwave
        if (this.shockwave) {
            this.shockwave.radius += this.shockwave.speed * dt;
            if (this.shockwave.radius >= this.shockwave.maxRadius) {
                this.shockwave = null;
            }
        }
    }
};
GalactusGravityCrushPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;

    // Check debris
    for (var d = 0; d < this.debris.length; d++) {
        var db = this.debris[d];
        var dx = cx + Math.cos(db.angle) * db.dist;
        var dy = cy + Math.sin(db.angle) * db.dist;
        var dist = Math.sqrt(Math.pow(scx - dx, 2) + Math.pow(scy - dy, 2));
        if (dist < db.size + 4) return this.damVal;
    }

    // Check shockwave
    if (this.shockwave) {
        var dist = Math.sqrt(Math.pow(scx - cx, 2) + Math.pow(scy - cy, 2));
        if (Math.abs(dist - this.shockwave.radius) < 12) return this.damVal;
    }
    return 0;
};
GalactusGravityCrushPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    ctx.save();

    // Purple crush walls glow
    if (this.crushPhase === 0 || this.crushPhase === 1) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#8800FF";
        ctx.strokeStyle = "rgba(136, 0, 255, 0.4)";
        ctx.lineWidth = 4;
        ctx.strokeRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
    }

    // Draw debris
    for (var d = 0; d < this.debris.length; d++) {
        var db = this.debris[d];
        var dx = cx + Math.cos(db.angle) * db.dist;
        var dy = cy + Math.sin(db.angle) * db.dist;
        ctx.fillStyle = "#666688";
        ctx.shadowBlur = 5;
        ctx.shadowColor = "#9933FF";
        ctx.beginPath();
        ctx.moveTo(dx, dy - db.size);
        ctx.lineTo(dx + db.size * 0.7, dy + db.size * 0.5);
        ctx.lineTo(dx - db.size * 0.7, dy + db.size * 0.5);
        ctx.closePath();
        ctx.fill();
    }

    // Draw shockwave
    if (this.shockwave) {
        var alpha = 1.0 - (this.shockwave.radius / this.shockwave.maxRadius);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "#DD88FF";
        ctx.lineWidth = 14;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#BB44FF";
        ctx.beginPath();
        ctx.arc(cx, cy, this.shockwave.radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusGravityCrushPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    // Restore box if still modified
    if (this.elapsed >= this.duration && this.origBounds && typeof Cbbox.setBound === "function") {
        Cbbox.setBound(this.origBounds.slice());
    }
    return this.elapsed >= this.duration && !this.shockwave;
};

// 5. galactusStarDrain — Mini-stars appear and get sucked toward Galactus, exploding
var GalactusStarDrainPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 7;
    this.stars = [];
    this.explosions = [];
    this.spawnTimer = 0;
};
GalactusStarDrainPattern.prototype = Object.create(BulletPattern.prototype);
GalactusStarDrainPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.stars = [];
    this.explosions = [];
    this.spawnTimer = 0;
    galactusParticles = [];
};
GalactusStarDrainPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var topY = bb[1];

    // Spawn stars
    if (this.elapsed < this.duration - 2.0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 1.2;
            this.stars.push({
                x: bb[0] + 20 + Math.random() * (bb[2] - bb[0] - 40),
                y: bb[1] + 20 + Math.random() * (bb[3] - bb[1] - 40),
                size: 8,
                drainTimer: 2.0,
                draining: false,
                drainSpeed: 0
            });
            Sound.playSound("ting", true);
        }
    }

    // Update stars
    for (var i = this.stars.length - 1; i >= 0; i--) {
        var s = this.stars[i];
        s.drainTimer -= dt;
        if (s.drainTimer <= 0 && !s.draining) {
            s.draining = true;
            s.drainSpeed = 40;
        }
        if (s.draining) {
            s.drainSpeed += 100 * dt;
            var dx = cx - s.x;
            var dy = topY - s.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) {
                s.x += (dx / dist) * s.drainSpeed * dt;
                s.y += (dy / dist) * s.drainSpeed * dt;
            }
            if (dist < 20) {
                // Explode
                this.explosions.push({ x: s.x, y: s.y, radius: 5, maxRadius: 50, speed: 120 });
                Sound.playSound("laser", true);
                for (var p = 0; p < 6; p++) {
                    var a = Math.random() * Math.PI * 2;
                    spawnGalactusParticle(s.x, s.y, Math.cos(a) * 80, Math.sin(a) * 80, 3, 0.5, "#FFDD44", 0);
                }
                this.stars.splice(i, 1);
            }
        }
    }

    // Update explosions
    for (var i = this.explosions.length - 1; i >= 0; i--) {
        var e = this.explosions[i];
        e.radius += e.speed * dt;
        if (e.radius >= e.maxRadius) this.explosions.splice(i, 1);
    }
};
GalactusStarDrainPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;

    // Check stars while draining
    for (var i = 0; i < this.stars.length; i++) {
        var s = this.stars[i];
        if (s.draining) {
            var dist = Math.sqrt(Math.pow(scx - s.x, 2) + Math.pow(scy - s.y, 2));
            if (dist < s.size + 3) return this.damVal;
        }
    }

    // Check explosions
    for (var i = 0; i < this.explosions.length; i++) {
        var e = this.explosions[i];
        var dist = Math.sqrt(Math.pow(scx - e.x, 2) + Math.pow(scy - e.y, 2));
        if (Math.abs(dist - e.radius) < 10) return this.damVal;
    }
    return 0;
};
GalactusStarDrainPattern.prototype.draw = function(ctx) {
    ctx.save();

    // Draw stars
    for (var i = 0; i < this.stars.length; i++) {
        var s = this.stars[i];
        ctx.save();
        ctx.translate(s.x, s.y);

        // Star glow
        ctx.shadowBlur = s.draining ? 20 : 10;
        ctx.shadowColor = s.draining ? "#FF4444" : "#FFDD44";
        ctx.fillStyle = s.draining ? "#FF6644" : "#FFDD44";
        // 4-pointed star shape
        ctx.beginPath();
        for (var p = 0; p < 8; p++) {
            var a = p * Math.PI / 4 + this.elapsed * 2;
            var r = (p % 2 === 0) ? s.size : s.size * 0.4;
            var px = Math.cos(a) * r;
            var py = Math.sin(a) * r;
            if (p === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    // Draw explosions
    for (var i = 0; i < this.explosions.length; i++) {
        var e = this.explosions[i];
        var alpha = 1.0 - (e.radius / e.maxRadius);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "#FFAA22";
        ctx.lineWidth = 8;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#FF6600";
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusStarDrainPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.stars.length === 0 && this.explosions.length === 0;
};

// 6. galactusCosmicRift — Purple cracks open in the box, shooting energy bursts
var GalactusCosmicRiftPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.cracks = [];
    this.bursts = [];
    this.spawnTimer = 0;
};
GalactusCosmicRiftPattern.prototype = Object.create(BulletPattern.prototype);
GalactusCosmicRiftPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.cracks = [];
    this.bursts = [];
    this.spawnTimer = 0.5;
    galactusParticles = [];
};
GalactusCosmicRiftPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);
    var bb = Cbbox.getBound();

    if (this.elapsed < this.duration - 2.0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 1.8;
            var cx = bb[0] + 30 + Math.random() * (bb[2] - bb[0] - 60);
            var cy = bb[1] + 30 + Math.random() * (bb[3] - bb[1] - 60);
            this.cracks.push({
                x: cx, y: cy,
                angle: Math.random() * Math.PI,
                length: 30 + Math.random() * 40,
                warningTimer: 0.8,
                burstTimer: 0,
                burstInterval: 0.6,
                burstsLeft: 3,
                life: 4.0
            });
            Sound.playSound("ting", true);
        }
    }

    // Update cracks
    for (var i = this.cracks.length - 1; i >= 0; i--) {
        var c = this.cracks[i];
        c.life -= dt;
        if (c.life <= 0) { this.cracks.splice(i, 1); continue; }

        if (c.warningTimer > 0) {
            c.warningTimer -= dt;
        } else if (c.burstsLeft > 0) {
            c.burstTimer -= dt;
            if (c.burstTimer <= 0) {
                c.burstTimer = c.burstInterval;
                c.burstsLeft--;
                // Fire burst perpendicular to crack
                var perpAngle = c.angle + Math.PI / 2;
                var dir = (c.burstsLeft % 2 === 0) ? 1 : -1;
                this.bursts.push({
                    x: c.x, y: c.y,
                    vx: Math.cos(perpAngle) * dir * 120,
                    vy: Math.sin(perpAngle) * dir * 120,
                    size: 6,
                    life: 1.5
                });
                Sound.playSound("laser", true);
            }
        }
    }

    // Update bursts
    for (var i = this.bursts.length - 1; i >= 0; i--) {
        var b = this.bursts[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
        if (b.life <= 0) this.bursts.splice(i, 1);
    }
};
GalactusCosmicRiftPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;

    // Check bursts
    for (var i = 0; i < this.bursts.length; i++) {
        var b = this.bursts[i];
        var dist = Math.sqrt(Math.pow(scx - b.x, 2) + Math.pow(scy - b.y, 2));
        if (dist < b.size + 3) return this.damVal;
    }

    // Check cracks (thin line damage)
    for (var i = 0; i < this.cracks.length; i++) {
        var c = this.cracks[i];
        if (c.warningTimer > 0) continue;
        var x1 = c.x - Math.cos(c.angle) * c.length / 2;
        var y1 = c.y - Math.sin(c.angle) * c.length / 2;
        var x2 = c.x + Math.cos(c.angle) * c.length / 2;
        var y2 = c.y + Math.sin(c.angle) * c.length / 2;
        var dist = GalactusCosmicBeamPattern.prototype._pointToLineDist(scx, scy, x1, y1, x2, y2);
        if (dist < 6) return Math.floor(this.damVal * 0.5);
    }
    return 0;
};
GalactusCosmicRiftPattern.prototype.draw = function(ctx) {
    ctx.save();

    // Draw cracks
    for (var i = 0; i < this.cracks.length; i++) {
        var c = this.cracks[i];
        var x1 = c.x - Math.cos(c.angle) * c.length / 2;
        var y1 = c.y - Math.sin(c.angle) * c.length / 2;
        var x2 = c.x + Math.cos(c.angle) * c.length / 2;
        var y2 = c.y + Math.sin(c.angle) * c.length / 2;

        if (c.warningTimer > 0) {
            // Warning flash
            var wAlpha = 0.3 + Math.sin(this.elapsed * 20) * 0.3;
            ctx.globalAlpha = wAlpha;
            ctx.strokeStyle = "#FF00FF";
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.setLineDash([]);
        } else {
            // Active crack
            var alpha = Math.min(1, c.life / 1.0);
            ctx.globalAlpha = alpha;
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#BB44FF";
            ctx.strokeStyle = "#DD88FF";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // Bright core
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }
    ctx.globalAlpha = 1.0;

    // Draw bursts
    for (var i = 0; i < this.bursts.length; i++) {
        var b = this.bursts[i];
        var alpha = b.life / 1.5;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#CC44FF";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#9933FF";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusCosmicRiftPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.cracks.length === 0 && this.bursts.length === 0;
};

// 7. galactusWorldEngine — Central machine with 4 rotating energy pillar arms
var GalactusWorldEnginePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.engineAngle = 0;
    this.engineSpeed = 0.8;
    this.pulseTimer = 0;
    this.pulses = [];
    this.numArms = 4;
    this.armLength = 0;
};
GalactusWorldEnginePattern.prototype = Object.create(BulletPattern.prototype);
GalactusWorldEnginePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.engineAngle = 0;
    this.pulseTimer = 0;
    this.pulses = [];
    this.armLength = 0;
    galactusParticles = [];
};
GalactusWorldEnginePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    var boxW = bb[2] - bb[0];

    // Extend arms gradually
    if (this.armLength < boxW * 0.45) {
        this.armLength += 60 * dt;
    }

    // Rotate
    this.engineAngle += this.engineSpeed * dt;
    // Speed up over time
    this.engineSpeed = 0.8 + this.elapsed * 0.12;

    // Pulse from center
    if (this.elapsed < this.duration - 1.5) {
        this.pulseTimer -= dt;
        if (this.pulseTimer <= 0) {
            this.pulseTimer = 1.5;
            this.pulses.push({ radius: 10, speed: 80, maxRadius: 70 });
            Sound.playSound("ting", true);
        }
    }

    for (var i = this.pulses.length - 1; i >= 0; i--) {
        this.pulses[i].radius += this.pulses[i].speed * dt;
        if (this.pulses[i].radius >= this.pulses[i].maxRadius) {
            this.pulses.splice(i, 1);
        }
    }

    // Ambient particles
    if (Math.random() < 0.3) {
        var a = Math.random() * Math.PI * 2;
        var d = 20 + Math.random() * 40;
        spawnGalactusParticle(cx + Math.cos(a) * d, cy + Math.sin(a) * d, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, 2, 0.5, "#9933FF", 0);
    }
};
GalactusWorldEnginePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;

    // Check arms
    for (var a = 0; a < this.numArms; a++) {
        var armAngle = this.engineAngle + (a * Math.PI * 2 / this.numArms);
        var endX = cx + Math.cos(armAngle) * this.armLength;
        var endY = cy + Math.sin(armAngle) * this.armLength;
        var dist = GalactusCosmicBeamPattern.prototype._pointToLineDist(scx, scy, cx, cy, endX, endY);
        if (dist < 8) return this.damVal;
    }

    // Check center pulses
    for (var i = 0; i < this.pulses.length; i++) {
        var p = this.pulses[i];
        var dist = Math.sqrt(Math.pow(scx - cx, 2) + Math.pow(scy - cy, 2));
        if (Math.abs(dist - p.radius) < 8) return Math.floor(this.damVal * 0.6);
    }
    return 0;
};
GalactusWorldEnginePattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    ctx.save();

    // Draw arms
    for (var a = 0; a < this.numArms; a++) {
        var armAngle = this.engineAngle + (a * Math.PI * 2 / this.numArms);
        var endX = cx + Math.cos(armAngle) * this.armLength;
        var endY = cy + Math.sin(armAngle) * this.armLength;

        // Outer glow
        ctx.strokeStyle = "rgba(153, 51, 255, 0.5)";
        ctx.lineWidth = 12;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#9933FF";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Core
        ctx.strokeStyle = "#DD88FF";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Tip glow
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(endX, endY, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw center machine
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#BB44FF";
    ctx.fillStyle = "#442266";
    ctx.strokeStyle = "#DD88FF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner core
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cx, cy, 4 + Math.sin(this.elapsed * 6) * 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw pulses
    for (var i = 0; i < this.pulses.length; i++) {
        var p = this.pulses[i];
        var alpha = 1.0 - (p.radius / p.maxRadius);
        ctx.globalAlpha = alpha * 0.6;
        ctx.strokeStyle = "#BB44FF";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(cx, cy, p.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusWorldEnginePattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration;
};

// ============================================================
// PHASE 2: EL HAMBRIENTO — 7 ATTACKS
// ============================================================

// 8. galactusDevourPull — Strong suction toward center while debris rains
var GalactusDevourPullPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.debris = [];
    this.spawnTimer = 0;
    this.pullStrength = 0;
    this.dangerRadius = 25;
};
GalactusDevourPullPattern.prototype = Object.create(BulletPattern.prototype);
GalactusDevourPullPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.debris = [];
    this.spawnTimer = 0;
    this.pullStrength = 0;
    galactusParticles = [];
};
GalactusDevourPullPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;

    // Increase pull over time
    this.pullStrength = Math.min(60, this.elapsed * 10);

    // Apply pull to soul
    if (this.elapsed < this.duration - 1.0 && typeof Soul !== "undefined") {
        var sPos = Soul.getPos();
        var sdx = cx - sPos.x;
        var sdy = cy - sPos.y;
        var sDist = Math.sqrt(sdx * sdx + sdy * sdy);
        if (sDist > 5) {
            Soul.addForce(sdx / sDist * this.pullStrength, sdy / sDist * this.pullStrength);
        }
    }

    // Spawn debris from top
    if (this.elapsed < this.duration - 2.0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 0.35;
            this.debris.push({
                x: bb[0] + Math.random() * (bb[2] - bb[0]),
                y: bb[1] - 5,
                vy: 60 + Math.random() * 80,
                size: 4 + Math.random() * 4
            });
        }
    }

    // Update debris
    for (var i = this.debris.length - 1; i >= 0; i--) {
        var d = this.debris[i];
        d.y += d.vy * dt;
        // Pull toward center
        var dx = cx - d.x;
        var dy = cy - d.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
            d.x += (dx / dist) * 20 * dt;
            d.y += (dy / dist) * 20 * dt;
        }
        if (d.y > bb[3] + 20 || dist < 15) {
            this.debris.splice(i, 1);
        }
    }
};
GalactusDevourPullPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;

    // Check center danger zone
    var dist = Math.sqrt(Math.pow(scx - cx, 2) + Math.pow(scy - cy, 2));
    if (dist < this.dangerRadius) return this.damVal;

    // Check debris
    for (var i = 0; i < this.debris.length; i++) {
        var d = this.debris[i];
        var ddist = Math.sqrt(Math.pow(scx - d.x, 2) + Math.pow(scy - d.y, 2));
        if (ddist < d.size + 3) return Math.floor(this.damVal * 0.6);
    }
    return 0;
};
GalactusDevourPullPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    ctx.save();

    // Central vortex
    ctx.save();
    ctx.translate(cx, cy);
    var numRings = 3;
    for (var r = 0; r < numRings; r++) {
        ctx.save();
        ctx.rotate(this.elapsed * (1.5 + r * 0.5));
        ctx.strokeStyle = "rgba(153, 51, 255, " + (0.3 - r * 0.08) + ")";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.dangerRadius + r * 12, (this.dangerRadius + r * 12) * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    // Dark center
    ctx.fillStyle = "#1A0033";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#9933FF";
    ctx.beginPath();
    ctx.arc(0, 0, this.dangerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw debris
    for (var i = 0; i < this.debris.length; i++) {
        var d = this.debris[i];
        ctx.fillStyle = "#888899";
        ctx.shadowBlur = 3;
        ctx.shadowColor = "#9933FF";
        ctx.fillRect(d.x - d.size / 2, d.y - d.size / 2, d.size, d.size);
    }

    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusDevourPullPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.debris.length === 0;
};

// 9. galactusNebulaBurst — Nebula clouds expand and contract leaving gaps to dodge
var GalactusNebulaBurstPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.damVal = config.damVal || 7;
    this.clouds = [];
    this.spawnTimer = 0;
};
GalactusNebulaBurstPattern.prototype = Object.create(BulletPattern.prototype);
GalactusNebulaBurstPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.clouds = [];
    this.spawnTimer = 0;
    galactusParticles = [];
};
GalactusNebulaBurstPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);
    var bb = Cbbox.getBound();

    if (this.elapsed < this.duration - 2.0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 1.0;
            this.clouds.push({
                x: bb[0] + 30 + Math.random() * (bb[2] - bb[0] - 60),
                y: bb[1] + 30 + Math.random() * (bb[3] - bb[1] - 60),
                radius: 5,
                maxRadius: 35 + Math.random() * 20,
                expanding: true,
                speed: 40,
                life: 3.5
            });
            Sound.playSound("ting", true);
        }
    }

    for (var i = this.clouds.length - 1; i >= 0; i--) {
        var c = this.clouds[i];
        c.life -= dt;
        if (c.life <= 0) { this.clouds.splice(i, 1); continue; }

        if (c.expanding) {
            c.radius += c.speed * dt;
            if (c.radius >= c.maxRadius) c.expanding = false;
        } else {
            c.radius -= c.speed * 0.5 * dt;
            if (c.radius <= 5) c.expanding = true;
        }
    }
};
GalactusNebulaBurstPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;
    for (var i = 0; i < this.clouds.length; i++) {
        var c = this.clouds[i];
        var dist = Math.sqrt(Math.pow(scx - c.x, 2) + Math.pow(scy - c.y, 2));
        if (dist < c.radius) return this.damVal;
    }
    return 0;
};
GalactusNebulaBurstPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.clouds.length; i++) {
        var c = this.clouds[i];
        var alpha = Math.min(1, c.life / 1.0) * 0.6;
        ctx.globalAlpha = alpha;
        var grad = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, c.radius);
        grad.addColorStop(0, "rgba(180, 50, 255, 0.8)");
        grad.addColorStop(0.5, "rgba(100, 0, 200, 0.5)");
        grad.addColorStop(1, "rgba(50, 0, 100, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fill();

        // Edge glow
        ctx.strokeStyle = "rgba(200, 100, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusNebulaBurstPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.clouds.length === 0;
};

// 10. galactusOrbitalBombard — Planets orbit and crash creating shockwaves
var GalactusOrbitalBombardPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
    this.planets = [];
    this.impacts = [];
    this.spawnTimer = 0;
};
GalactusOrbitalBombardPattern.prototype = Object.create(BulletPattern.prototype);
GalactusOrbitalBombardPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.planets = [];
    this.impacts = [];
    this.spawnTimer = 0.5;
    galactusParticles = [];
};
GalactusOrbitalBombardPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;

    if (this.elapsed < this.duration - 2.0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 1.5;
            this.planets.push({
                angle: Math.random() * Math.PI * 2,
                dist: 80 + Math.random() * 30,
                speed: 1.5 + Math.random(),
                size: 6 + Math.random() * 4,
                orbitTime: 2.5 + Math.random() * 1.5,
                color: ["#4488FF", "#FF8844", "#44CC88", "#CC4488"][Math.floor(Math.random() * 4)]
            });
        }
    }

    for (var i = this.planets.length - 1; i >= 0; i--) {
        var p = this.planets[i];
        p.angle += p.speed * dt;
        p.orbitTime -= dt;
        if (p.orbitTime <= 0) {
            // Crash into box
            var impactX = cx + Math.cos(p.angle) * p.dist * 0.3;
            var impactY = cy + Math.sin(p.angle) * p.dist * 0.3;
            this.impacts.push({ x: impactX, y: impactY, radius: 5, maxRadius: 60, speed: 120 });
            Sound.playSound("laser", true);
            if (typeof triggerShake !== "undefined") triggerShake(4, 120);
            for (var j = 0; j < 8; j++) {
                var a = Math.random() * Math.PI * 2;
                spawnGalactusParticle(impactX, impactY, Math.cos(a) * 60, Math.sin(a) * 60, 3, 0.6, p.color, 0);
            }
            this.planets.splice(i, 1);
        }
    }

    for (var i = this.impacts.length - 1; i >= 0; i--) {
        this.impacts[i].radius += this.impacts[i].speed * dt;
        if (this.impacts[i].radius >= this.impacts[i].maxRadius) this.impacts.splice(i, 1);
    }
};
GalactusOrbitalBombardPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;

    for (var i = 0; i < this.planets.length; i++) {
        var p = this.planets[i];
        var px = cx + Math.cos(p.angle) * p.dist;
        var py = cy + Math.sin(p.angle) * p.dist;
        var dist = Math.sqrt(Math.pow(scx - px, 2) + Math.pow(scy - py, 2));
        if (dist < p.size + 3) return this.damVal;
    }

    for (var i = 0; i < this.impacts.length; i++) {
        var imp = this.impacts[i];
        var dist = Math.sqrt(Math.pow(scx - imp.x, 2) + Math.pow(scy - imp.y, 2));
        if (Math.abs(dist - imp.radius) < 10) return this.damVal;
    }
    return 0;
};
GalactusOrbitalBombardPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    ctx.save();

    // Draw orbit path
    ctx.strokeStyle = "rgba(100, 50, 200, 0.15)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (var i = 0; i < this.planets.length; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, this.planets[i].dist, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw planets
    for (var i = 0; i < this.planets.length; i++) {
        var p = this.planets[i];
        var px = cx + Math.cos(p.angle) * p.dist;
        var py = cy + Math.sin(p.angle) * p.dist;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw impacts
    for (var i = 0; i < this.impacts.length; i++) {
        var imp = this.impacts[i];
        var alpha = 1.0 - (imp.radius / imp.maxRadius);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "#FF6622";
        ctx.lineWidth = 8;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#FF4400";
        ctx.beginPath();
        ctx.arc(imp.x, imp.y, imp.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusOrbitalBombardPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.planets.length === 0 && this.impacts.length === 0;
};

// 11. galactusCosmicStorm — Multi-directional energy beams sweeping at different speeds
var GalactusCosmicStormPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.beams = [];
};
GalactusCosmicStormPattern.prototype = Object.create(BulletPattern.prototype);
GalactusCosmicStormPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.beams = [];
    galactusParticles = [];
    // Create 3 beams from different edges
    var bb = Cbbox.getBound();
    this.beams.push({ edge: "top", pos: bb[0], speed: 80, dir: 1 });
    this.beams.push({ edge: "left", pos: bb[1], speed: 60, dir: 1 });
    this.beams.push({ edge: "bottom", pos: bb[2], speed: 70, dir: -1 });
};
GalactusCosmicStormPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);
    var bb = Cbbox.getBound();

    for (var i = 0; i < this.beams.length; i++) {
        var b = this.beams[i];
        b.pos += b.speed * b.dir * dt;
        // Bounce
        if (b.edge === "top" || b.edge === "bottom") {
            if (b.pos < bb[0]) { b.pos = bb[0]; b.dir = 1; }
            if (b.pos > bb[2]) { b.pos = bb[2]; b.dir = -1; }
        } else {
            if (b.pos < bb[1]) { b.pos = bb[1]; b.dir = 1; }
            if (b.pos > bb[3]) { b.pos = bb[3]; b.dir = -1; }
        }
    }
};
GalactusCosmicStormPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;
    var bb = Cbbox.getBound();

    if (this.elapsed >= this.duration - 1.0) return 0;

    for (var i = 0; i < this.beams.length; i++) {
        var b = this.beams[i];
        if (b.edge === "top") {
            if (Math.abs(scx - b.pos) < 8) return this.damVal;
        } else if (b.edge === "left") {
            if (Math.abs(scy - b.pos) < 8) return this.damVal;
        } else if (b.edge === "bottom") {
            if (Math.abs(scx - b.pos) < 8) return this.damVal;
        }
    }
    return 0;
};
GalactusCosmicStormPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();

    if (this.elapsed < this.duration - 1.0) {
        for (var i = 0; i < this.beams.length; i++) {
            var b = this.beams[i];
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#9933FF";

            if (b.edge === "top" || b.edge === "bottom") {
                // Vertical beam
                ctx.strokeStyle = "rgba(153, 51, 255, 0.6)";
                ctx.lineWidth = 16;
                ctx.beginPath();
                ctx.moveTo(b.pos, bb[1]);
                ctx.lineTo(b.pos, bb[3]);
                ctx.stroke();

                ctx.strokeStyle = "#DD88FF";
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(b.pos, bb[1]);
                ctx.lineTo(b.pos, bb[3]);
                ctx.stroke();
            } else {
                // Horizontal beam
                ctx.strokeStyle = "rgba(153, 51, 255, 0.6)";
                ctx.lineWidth = 16;
                ctx.beginPath();
                ctx.moveTo(bb[0], b.pos);
                ctx.lineTo(bb[2], b.pos);
                ctx.stroke();

                ctx.strokeStyle = "#DD88FF";
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(bb[0], b.pos);
                ctx.lineTo(bb[2], b.pos);
                ctx.stroke();
            }
        }
    }

    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusCosmicStormPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration;
};

// 12. galactusHungerWave — Waves of purple/dark energy pulsing from top
var GalactusHungerWavePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.waves = [];
    this.spawnTimer = 0;
};
GalactusHungerWavePattern.prototype = Object.create(BulletPattern.prototype);
GalactusHungerWavePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.waves = [];
    this.spawnTimer = 0.3;
    galactusParticles = [];
};
GalactusHungerWavePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);
    var bb = Cbbox.getBound();

    if (this.elapsed < this.duration - 2.0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 0.9;
            // Wave from a random side
            var side = Math.floor(Math.random() * 4);
            var w = { side: side, pos: 0, speed: 110, width: 18 };
            if (side === 0) w.pos = bb[1]; // top
            else if (side === 1) w.pos = bb[3]; // bottom
            else if (side === 2) w.pos = bb[0]; // left
            else w.pos = bb[2]; // right
            this.waves.push(w);
            Sound.playSound("ting", true);
        }
    }

    for (var i = this.waves.length - 1; i >= 0; i--) {
        var w = this.waves[i];
        if (w.side === 0) w.pos += w.speed * dt;
        else if (w.side === 1) w.pos -= w.speed * dt;
        else if (w.side === 2) w.pos += w.speed * dt;
        else w.pos -= w.speed * dt;

        // Remove when past bounds
        if (w.side === 0 && w.pos > bb[3] + 20) this.waves.splice(i, 1);
        else if (w.side === 1 && w.pos < bb[1] - 20) this.waves.splice(i, 1);
        else if (w.side === 2 && w.pos > bb[2] + 20) this.waves.splice(i, 1);
        else if (w.side === 3 && w.pos < bb[0] - 20) this.waves.splice(i, 1);
    }
};
GalactusHungerWavePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;

    for (var i = 0; i < this.waves.length; i++) {
        var w = this.waves[i];
        if (w.side === 0 || w.side === 1) {
            if (Math.abs(scy - w.pos) < w.width / 2) return this.damVal;
        } else {
            if (Math.abs(scx - w.pos) < w.width / 2) return this.damVal;
        }
    }
    return 0;
};
GalactusHungerWavePattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();

    for (var i = 0; i < this.waves.length; i++) {
        var w = this.waves[i];
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#8800CC";

        var grad;
        if (w.side === 0 || w.side === 1) {
            grad = ctx.createLinearGradient(0, w.pos - w.width / 2, 0, w.pos + w.width / 2);
            grad.addColorStop(0, "rgba(100, 0, 180, 0)");
            grad.addColorStop(0.5, "rgba(150, 50, 255, 0.7)");
            grad.addColorStop(1, "rgba(100, 0, 180, 0)");
            ctx.fillStyle = grad;
            ctx.fillRect(bb[0], w.pos - w.width / 2, bb[2] - bb[0], w.width);
        } else {
            grad = ctx.createLinearGradient(w.pos - w.width / 2, 0, w.pos + w.width / 2, 0);
            grad.addColorStop(0, "rgba(100, 0, 180, 0)");
            grad.addColorStop(0.5, "rgba(150, 50, 255, 0.7)");
            grad.addColorStop(1, "rgba(100, 0, 180, 0)");
            ctx.fillStyle = grad;
            ctx.fillRect(w.pos - w.width / 2, bb[1], w.width, bb[3] - bb[1]);
        }
    }

    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusHungerWavePattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.waves.length === 0;
};

// 13. galactusPlanetCrush — A planet descends, crushing the box temporarily
var GalactusPlanetCrushPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
    this.planet = null;
    this.phase = 0; // 0=warning, 1=descend, 2=crush, 3=retreat
    this.timer = 0;
    this.debris = [];
};
GalactusPlanetCrushPattern.prototype = Object.create(BulletPattern.prototype);
GalactusPlanetCrushPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    this.planet = { x: cx, y: bb[1] - 60, targetY: bb[1] + 30, radius: 35, color: "#664422" };
    this.phase = 0;
    this.timer = 1.5;
    this.debris = [];
    galactusParticles = [];
};
GalactusPlanetCrushPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);
    var bb = Cbbox.getBound();

    this.timer -= dt;
    if (this.phase === 0 && this.timer <= 0) {
        this.phase = 1;
        this.timer = 1.5;
        Sound.playSound("laser", true);
    } else if (this.phase === 1) {
        // Descend
        this.planet.y += 80 * dt;
        if (this.planet.y >= this.planet.targetY || this.timer <= 0) {
            this.phase = 2;
            this.timer = 3.0;
            if (typeof triggerShake !== "undefined") triggerShake(8, 300);
            // Spawn debris
            for (var d = 0; d < 10; d++) {
                this.debris.push({
                    x: this.planet.x + (Math.random() - 0.5) * 60,
                    y: this.planet.y + this.planet.radius,
                    vx: (Math.random() - 0.5) * 100,
                    vy: 40 + Math.random() * 60,
                    size: 3 + Math.random() * 4,
                    life: 2.0
                });
            }
        }
    } else if (this.phase === 2 && this.timer <= 0) {
        this.phase = 3;
        this.timer = 1.5;
    } else if (this.phase === 3) {
        this.planet.y -= 100 * dt;
    }

    // Update debris
    for (var i = this.debris.length - 1; i >= 0; i--) {
        var d = this.debris[i];
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.life -= dt;
        if (d.life <= 0 || d.y > bb[3] + 20) this.debris.splice(i, 1);
    }
};
GalactusPlanetCrushPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;

    // Check planet body
    if (this.phase >= 1 && this.phase <= 2) {
        var dist = Math.sqrt(Math.pow(scx - this.planet.x, 2) + Math.pow(scy - this.planet.y, 2));
        if (dist < this.planet.radius + 3) return this.damVal;
    }

    // Check debris
    for (var i = 0; i < this.debris.length; i++) {
        var d = this.debris[i];
        var ddist = Math.sqrt(Math.pow(scx - d.x, 2) + Math.pow(scy - d.y, 2));
        if (ddist < d.size + 3) return Math.floor(this.damVal * 0.5);
    }
    return 0;
};
GalactusPlanetCrushPattern.prototype.draw = function(ctx) {
    ctx.save();

    // Warning shadow on ground
    if (this.phase === 0) {
        var bb = Cbbox.getBound();
        var cx = (bb[0] + bb[2]) / 2;
        var alpha = 0.3 + Math.sin(this.elapsed * 12) * 0.2;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#440066";
        ctx.beginPath();
        ctx.ellipse(cx, bb[1] + 40, 40, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    // Draw planet
    if (this.planet) {
        ctx.save();
        ctx.translate(this.planet.x, this.planet.y);
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#664422";

        // Planet body
        var grad = ctx.createRadialGradient(-5, -5, 3, 0, 0, this.planet.radius);
        grad.addColorStop(0, "#AA7744");
        grad.addColorStop(0.6, "#664422");
        grad.addColorStop(1, "#332211");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.planet.radius, 0, Math.PI * 2);
        ctx.fill();

        // Surface detail lines
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.planet.radius * 0.8, this.planet.radius * 0.3, 0.2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    // Draw debris
    for (var i = 0; i < this.debris.length; i++) {
        var d = this.debris[i];
        ctx.fillStyle = "#886644";
        ctx.fillRect(d.x - d.size / 2, d.y - d.size / 2, d.size, d.size);
    }

    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusPlanetCrushPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.debris.length === 0;
};

// 14. galactusVoidTendrils — Dark energy tendrils reach in from the borders
var GalactusVoidTendrilsPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.tendrils = [];
    this.spawnTimer = 0;
};
GalactusVoidTendrilsPattern.prototype = Object.create(BulletPattern.prototype);
GalactusVoidTendrilsPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.tendrils = [];
    this.spawnTimer = 0.3;
    galactusParticles = [];
};
GalactusVoidTendrilsPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);
    var bb = Cbbox.getBound();

    if (this.elapsed < this.duration - 2.0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 1.2;
            var side = Math.floor(Math.random() * 4);
            var t = { side: side, progress: 0, maxProgress: 0.7 + Math.random() * 0.3, speed: 0.4 + Math.random() * 0.2, life: 3.0 };
            if (side === 0) { t.startX = bb[0] + Math.random() * (bb[2] - bb[0]); t.startY = bb[1]; }
            else if (side === 1) { t.startX = bb[0] + Math.random() * (bb[2] - bb[0]); t.startY = bb[3]; }
            else if (side === 2) { t.startX = bb[0]; t.startY = bb[1] + Math.random() * (bb[3] - bb[1]); }
            else { t.startX = bb[2]; t.startY = bb[1] + Math.random() * (bb[3] - bb[1]); }
            this.tendrils.push(t);
            Sound.playSound("ting", true);
        }
    }

    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    for (var i = this.tendrils.length - 1; i >= 0; i--) {
        var t = this.tendrils[i];
        t.life -= dt;
        if (t.life <= 0) { this.tendrils.splice(i, 1); continue; }
        if (t.progress < t.maxProgress) {
            t.progress += t.speed * dt;
        }
    }
};
GalactusVoidTendrilsPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;

    for (var i = 0; i < this.tendrils.length; i++) {
        var t = this.tendrils[i];
        var endX = t.startX + (cx - t.startX) * t.progress;
        var endY = t.startY + (cy - t.startY) * t.progress;
        // Check distance to tendril line
        var numSegs = 8;
        for (var s = 0; s < numSegs; s++) {
            var p1 = s / numSegs;
            var p2 = (s + 1) / numSegs;
            var sx1 = t.startX + (endX - t.startX) * p1;
            var sy1 = t.startY + (endY - t.startY) * p1;
            var sx2 = t.startX + (endX - t.startX) * p2;
            var sy2 = t.startY + (endY - t.startY) * p2;
            // Add wave offset
            var wave = Math.sin(p1 * Math.PI * 4 + this.elapsed * 5) * 10;
            if (t.side <= 1) { sx1 += wave; sx2 += wave; }
            else { sy1 += wave; sy2 += wave; }
            var dist = GalactusCosmicBeamPattern.prototype._pointToLineDist(scx, scy, sx1, sy1, sx2, sy2);
            if (dist < 8) return this.damVal;
        }
    }
    return 0;
};
GalactusVoidTendrilsPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    ctx.save();

    for (var i = 0; i < this.tendrils.length; i++) {
        var t = this.tendrils[i];
        var endX = t.startX + (cx - t.startX) * t.progress;
        var endY = t.startY + (cy - t.startY) * t.progress;
        var alpha = Math.min(1, t.life / 1.0);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "#6600AA";
        ctx.lineWidth = 6;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#9933FF";
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(t.startX, t.startY);
        var numSegs = 8;
        for (var s = 1; s <= numSegs; s++) {
            var p = s / numSegs;
            var sx = t.startX + (endX - t.startX) * p;
            var sy = t.startY + (endY - t.startY) * p;
            var wave = Math.sin(p * Math.PI * 4 + this.elapsed * 5) * 10;
            if (t.side <= 1) sx += wave;
            else sy += wave;
            ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        // Tip glow
        ctx.fillStyle = "#DD88FF";
        ctx.beginPath();
        ctx.arc(endX, endY, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusVoidTendrilsPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.tendrils.length === 0;
};

// ============================================================
// PHASE 3: EL DEVORADOR — 7 ATTACKS
// ============================================================

// 15. galactusUltimateNullifier — Screen darkens, concentric rings of energy
var GalactusUltimateNullifierPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 12;
    this.rings = [];
    this.spawnTimer = 0;
    this.darkenAlpha = 0;
};
GalactusUltimateNullifierPattern.prototype = Object.create(BulletPattern.prototype);
GalactusUltimateNullifierPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.rings = [];
    this.spawnTimer = 0;
    this.darkenAlpha = 0;
    galactusParticles = [];
};
GalactusUltimateNullifierPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;

    // Darken effect
    this.darkenAlpha = Math.min(0.5, this.elapsed * 0.15);
    if (this.elapsed > this.duration - 1.5) {
        this.darkenAlpha = Math.max(0, this.darkenAlpha - dt * 2);
    }

    if (this.elapsed < this.duration - 1.5) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 0.55;
            // Rings with gaps
            var gapAngle = Math.random() * Math.PI * 2;
            var gapSize = 0.6 + Math.random() * 0.4;
            this.rings.push({ cx: cx, cy: cy, radius: 5, speed: 110, maxRadius: 200, gapAngle: gapAngle, gapSize: gapSize, thickness: 8 });
            Sound.playSound("laser", true);
        }
    }

    for (var i = this.rings.length - 1; i >= 0; i--) {
        this.rings[i].radius += this.rings[i].speed * dt;
        if (this.rings[i].radius >= this.rings[i].maxRadius) this.rings.splice(i, 1);
    }
};
GalactusUltimateNullifierPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;
    for (var i = 0; i < this.rings.length; i++) {
        var r = this.rings[i];
        var dist = Math.sqrt(Math.pow(scx - r.cx, 2) + Math.pow(scy - r.cy, 2));
        if (Math.abs(dist - r.radius) < r.thickness) {
            // Check if in gap
            var angle = Math.atan2(scy - r.cy, scx - r.cx);
            var diff = angle - r.gapAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            if (Math.abs(diff) < r.gapSize / 2) continue; // In gap, safe
            return this.damVal;
        }
    }
    return 0;
};
GalactusUltimateNullifierPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();

    // Darken overlay
    if (this.darkenAlpha > 0) {
        ctx.fillStyle = "rgba(0, 0, 0, " + this.darkenAlpha + ")";
        ctx.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
    }

    // Draw rings with gaps
    for (var i = 0; i < this.rings.length; i++) {
        var r = this.rings[i];
        var alpha = 1.0 - (r.radius / r.maxRadius);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "#FFAA00";
        ctx.lineWidth = r.thickness;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#FF6600";
        ctx.beginPath();
        ctx.arc(r.cx, r.cy, r.radius, r.gapAngle + r.gapSize / 2, r.gapAngle + Math.PI * 2 - r.gapSize / 2);
        ctx.stroke();

        // White core ring
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.cx, r.cy, r.radius, r.gapAngle + r.gapSize / 2, r.gapAngle + Math.PI * 2 - r.gapSize / 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusUltimateNullifierPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.rings.length === 0;
};

// 16. galactusRealityTear — Reality tears open with cosmic-purple zigzag cracks
var GalactusRealityTearPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 10;
    this.tears = [];
    this.spawnTimer = 0;
};
GalactusRealityTearPattern.prototype = Object.create(BulletPattern.prototype);
GalactusRealityTearPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.tears = [];
    this.spawnTimer = 0.5;
    galactusParticles = [];
};
GalactusRealityTearPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);
    var bb = Cbbox.getBound();

    if (this.elapsed < this.duration - 2.0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 1.4;
            var isVert = Math.random() > 0.5;
            var points = [];
            var numPts = 6 + Math.floor(Math.random() * 4);
            var startX, startY;
            if (isVert) {
                startX = bb[0] + 20 + Math.random() * (bb[2] - bb[0] - 40);
                startY = bb[1];
                for (var p = 0; p < numPts; p++) {
                    points.push({ x: startX + (Math.random() - 0.5) * 30, y: bb[1] + (p / (numPts - 1)) * (bb[3] - bb[1]) });
                }
            } else {
                startX = bb[0];
                startY = bb[1] + 20 + Math.random() * (bb[3] - bb[1] - 40);
                for (var p = 0; p < numPts; p++) {
                    points.push({ x: bb[0] + (p / (numPts - 1)) * (bb[2] - bb[0]), y: startY + (Math.random() - 0.5) * 30 });
                }
            }
            this.tears.push({ points: points, life: 3.0, warningTimer: 0.6, active: false });
            Sound.playSound("ting", true);
        }
    }

    for (var i = this.tears.length - 1; i >= 0; i--) {
        var t = this.tears[i];
        t.life -= dt;
        if (t.warningTimer > 0) {
            t.warningTimer -= dt;
            if (t.warningTimer <= 0) {
                t.active = true;
                Sound.playSound("laser", true);
                if (typeof triggerShake !== "undefined") triggerShake(3, 100);
            }
        }
        if (t.life <= 0) this.tears.splice(i, 1);
    }
};
GalactusRealityTearPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;
    for (var i = 0; i < this.tears.length; i++) {
        var t = this.tears[i];
        if (!t.active) continue;
        for (var p = 0; p < t.points.length - 1; p++) {
            var dist = GalactusCosmicBeamPattern.prototype._pointToLineDist(scx, scy, t.points[p].x, t.points[p].y, t.points[p + 1].x, t.points[p + 1].y);
            if (dist < 10) return this.damVal;
        }
    }
    return 0;
};
GalactusRealityTearPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.tears.length; i++) {
        var t = this.tears[i];
        var alpha = Math.min(1, t.life / 1.0);
        ctx.globalAlpha = alpha;

        if (!t.active) {
            // Warning
            ctx.strokeStyle = "rgba(255, 0, 255, " + (0.3 + Math.sin(this.elapsed * 20) * 0.3) + ")";
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
        } else {
            ctx.strokeStyle = "#DD44FF";
            ctx.lineWidth = 6;
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#AA00FF";
            ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.moveTo(t.points[0].x, t.points[0].y);
        for (var p = 1; p < t.points.length; p++) {
            ctx.lineTo(t.points[p].x, t.points[p].y);
        }
        ctx.stroke();

        if (t.active) {
            // White core
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 2;
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(t.points[0].x, t.points[0].y);
            for (var p = 1; p < t.points.length; p++) {
                ctx.lineTo(t.points[p].x, t.points[p].y);
            }
            ctx.stroke();
        }
    }
    ctx.globalAlpha = 1.0;
    ctx.setLineDash([]);
    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusRealityTearPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.tears.length === 0;
};

// 17. galactusBlackHoleMaw — Black hole vortex in center, player resists suction + hazards orbit
var GalactusBlackHoleMawPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 10;
    this.mawRadius = 20;
    this.hazards = [];
    this.pullStr = 0;
};
GalactusBlackHoleMawPattern.prototype = Object.create(BulletPattern.prototype);
GalactusBlackHoleMawPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.hazards = [];
    this.pullStr = 0;
    galactusParticles = [];
    for (var h = 0; h < 5; h++) {
        this.hazards.push({ angle: h * Math.PI * 2 / 5, dist: 55 + Math.random() * 20, speed: 1.2 + Math.random() * 0.5, size: 5 });
    }
};
GalactusBlackHoleMawPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;

    this.pullStr = Math.min(70, this.elapsed * 12);
    if (this.elapsed > this.duration - 1.5) this.pullStr = Math.max(0, this.pullStr - 100 * dt);

    // Apply pull
    if (this.pullStr > 0 && typeof Soul !== "undefined") {
        var sPos = Soul.getPos();
        var sdx = cx - sPos.x;
        var sdy = cy - sPos.y;
        var sDist = Math.sqrt(sdx * sdx + sdy * sdy);
        if (sDist > 5) {
            Soul.addForce(sdx / sDist * this.pullStr, sdy / sDist * this.pullStr);
        }
    }

    for (var h = 0; h < this.hazards.length; h++) {
        this.hazards[h].angle += this.hazards[h].speed * dt;
    }

    // Ambient particles spiraling in
    if (Math.random() < 0.4) {
        var a = Math.random() * Math.PI * 2;
        var d = 70 + Math.random() * 30;
        spawnGalactusParticle(cx + Math.cos(a) * d, cy + Math.sin(a) * d, -Math.cos(a) * 40, -Math.sin(a) * 40, 2, 0.8, "#9933FF", 0);
    }
};
GalactusBlackHoleMawPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;

    // Maw center
    var dist = Math.sqrt(Math.pow(scx - cx, 2) + Math.pow(scy - cy, 2));
    if (dist < this.mawRadius) return this.damVal;

    // Hazards
    for (var h = 0; h < this.hazards.length; h++) {
        var hz = this.hazards[h];
        var hx = cx + Math.cos(hz.angle) * hz.dist;
        var hy = cy + Math.sin(hz.angle) * hz.dist;
        var hdist = Math.sqrt(Math.pow(scx - hx, 2) + Math.pow(scy - hy, 2));
        if (hdist < hz.size + 3) return this.damVal;
    }
    return 0;
};
GalactusBlackHoleMawPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    ctx.save();

    // Accretion disk
    ctx.save();
    ctx.translate(cx, cy);
    for (var ring = 3; ring >= 0; ring--) {
        ctx.save();
        ctx.rotate(this.elapsed * (0.8 + ring * 0.3));
        ctx.strokeStyle = "rgba(153, 51, 255, " + (0.2 + ring * 0.05) + ")";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.mawRadius + 15 + ring * 12, (this.mawRadius + 15 + ring * 12) * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // Black hole center
    ctx.fillStyle = "#000000";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#6600AA";
    ctx.beginPath();
    ctx.arc(0, 0, this.mawRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw hazards
    for (var h = 0; h < this.hazards.length; h++) {
        var hz = this.hazards[h];
        var hx = cx + Math.cos(hz.angle) * hz.dist;
        var hy = cy + Math.sin(hz.angle) * hz.dist;
        ctx.fillStyle = "#FF4444";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF0000";
        ctx.beginPath();
        ctx.arc(hx, hy, hz.size, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusBlackHoleMawPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration;
};

// 18. galactusCosmicJudgment — Multiple beams converge on player position with warnings
var GalactusCosmicJudgmentPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 10;
    this.strikes = [];
    this.spawnTimer = 0;
};
GalactusCosmicJudgmentPattern.prototype = Object.create(BulletPattern.prototype);
GalactusCosmicJudgmentPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.strikes = [];
    this.spawnTimer = 0.3;
    galactusParticles = [];
};
GalactusCosmicJudgmentPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);

    if (this.elapsed < this.duration - 2.0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 1.0;
            // Target near player position
            var targetX, targetY;
            if (typeof Soul !== "undefined") {
                var sPos = Soul.getPos();
                targetX = sPos.x + (Math.random() - 0.5) * 40;
                targetY = sPos.y + (Math.random() - 0.5) * 40;
            } else {
                var bb = Cbbox.getBound();
                targetX = (bb[0] + bb[2]) / 2;
                targetY = (bb[1] + bb[3]) / 2;
            }
            this.strikes.push({ x: targetX, y: targetY, warningTimer: 0.8, beamTimer: 0, beamDuration: 0.5, beamActive: false, done: false });
            Sound.playSound("ting", true);
        }
    }

    for (var i = this.strikes.length - 1; i >= 0; i--) {
        var s = this.strikes[i];
        if (s.done) { this.strikes.splice(i, 1); continue; }
        if (s.warningTimer > 0) {
            s.warningTimer -= dt;
            if (s.warningTimer <= 0) {
                s.beamActive = true;
                s.beamTimer = s.beamDuration;
                Sound.playSound("laser", true);
                if (typeof triggerShake !== "undefined") triggerShake(4, 100);
            }
        } else if (s.beamActive) {
            s.beamTimer -= dt;
            if (s.beamTimer <= 0) {
                s.done = true;
            }
        }
    }
};
GalactusCosmicJudgmentPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;

    for (var i = 0; i < this.strikes.length; i++) {
        var s = this.strikes[i];
        if (!s.beamActive) continue;
        var dist = Math.sqrt(Math.pow(scx - s.x, 2) + Math.pow(scy - s.y, 2));
        if (dist < 20) return this.damVal;
    }
    return 0;
};
GalactusCosmicJudgmentPattern.prototype.draw = function(ctx) {
    ctx.save();

    for (var i = 0; i < this.strikes.length; i++) {
        var s = this.strikes[i];

        if (s.warningTimer > 0) {
            // Warning crosshair
            var alpha = 0.3 + Math.sin(this.elapsed * 20) * 0.3;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = "#FF4444";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 18, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(s.x - 25, s.y);
            ctx.lineTo(s.x + 25, s.y);
            ctx.moveTo(s.x, s.y - 25);
            ctx.lineTo(s.x, s.y + 25);
            ctx.stroke();
        } else if (s.beamActive) {
            var alpha = s.beamTimer / s.beamDuration;
            ctx.globalAlpha = alpha;

            // Vertical beam from top
            ctx.strokeStyle = "rgba(200, 100, 255, 0.7)";
            ctx.lineWidth = 30;
            ctx.shadowBlur = 25;
            ctx.shadowColor = "#BB44FF";
            ctx.beginPath();
            ctx.moveTo(s.x, 0);
            ctx.lineTo(s.x, 800);
            ctx.stroke();

            // Impact circle
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.arc(s.x, s.y, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1.0;

    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusCosmicJudgmentPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.strikes.length === 0;
};

// 19. galactusDimensionalCollapse — Box warps and shifts while energy waves pass through
var GalactusDimensionalCollapsePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
    this.waves = [];
    this.spawnTimer = 0;
};
GalactusDimensionalCollapsePattern.prototype = Object.create(BulletPattern.prototype);
GalactusDimensionalCollapsePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.waves = [];
    this.spawnTimer = 0.5;
    galactusParticles = [];
};
GalactusDimensionalCollapsePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);
    var bb = Cbbox.getBound();

    if (this.elapsed < this.duration - 2.0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 0.7;
            var dir = Math.random() > 0.5;
            this.waves.push({
                horizontal: dir,
                pos: dir ? bb[1] - 10 : bb[0] - 10,
                speed: 100 + Math.random() * 50,
                width: 15 + Math.random() * 10
            });
            Sound.playSound("ting", true);
        }
    }

    for (var i = this.waves.length - 1; i >= 0; i--) {
        var w = this.waves[i];
        w.pos += w.speed * dt;
        if (w.horizontal && w.pos > bb[3] + 30) this.waves.splice(i, 1);
        else if (!w.horizontal && w.pos > bb[2] + 30) this.waves.splice(i, 1);
    }
};
GalactusDimensionalCollapsePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;
    for (var i = 0; i < this.waves.length; i++) {
        var w = this.waves[i];
        if (w.horizontal) {
            if (Math.abs(scy - w.pos) < w.width / 2) return this.damVal;
        } else {
            if (Math.abs(scx - w.pos) < w.width / 2) return this.damVal;
        }
    }
    return 0;
};
GalactusDimensionalCollapsePattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();
    for (var i = 0; i < this.waves.length; i++) {
        var w = this.waves[i];
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#AA00FF";
        var grad;
        if (w.horizontal) {
            grad = ctx.createLinearGradient(0, w.pos - w.width, 0, w.pos + w.width);
            grad.addColorStop(0, "rgba(170, 0, 255, 0)");
            grad.addColorStop(0.3, "rgba(200, 100, 255, 0.6)");
            grad.addColorStop(0.5, "rgba(255, 255, 255, 0.8)");
            grad.addColorStop(0.7, "rgba(200, 100, 255, 0.6)");
            grad.addColorStop(1, "rgba(170, 0, 255, 0)");
            ctx.fillStyle = grad;
            ctx.fillRect(bb[0], w.pos - w.width, bb[2] - bb[0], w.width * 2);
        } else {
            grad = ctx.createLinearGradient(w.pos - w.width, 0, w.pos + w.width, 0);
            grad.addColorStop(0, "rgba(170, 0, 255, 0)");
            grad.addColorStop(0.3, "rgba(200, 100, 255, 0.6)");
            grad.addColorStop(0.5, "rgba(255, 255, 255, 0.8)");
            grad.addColorStop(0.7, "rgba(200, 100, 255, 0.6)");
            grad.addColorStop(1, "rgba(170, 0, 255, 0)");
            ctx.fillStyle = grad;
            ctx.fillRect(w.pos - w.width, bb[1], w.width * 2, bb[3] - bb[1]);
        }
    }
    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusDimensionalCollapsePattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.waves.length === 0;
};

// 20. galactusDevourStar — A massive star enters, gets consumed, creates nova explosion
var GalactusDevourStarPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 11;
    this.star = null;
    this.phase = 0;
    this.timer = 0;
    this.nova = null;
    this.novaRings = [];
};
GalactusDevourStarPattern.prototype = Object.create(BulletPattern.prototype);
GalactusDevourStarPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    this.star = { x: cx, y: cy, radius: 25, pulseSpeed: 4 };
    this.phase = 0;
    this.timer = 2.0;
    this.nova = null;
    this.novaRings = [];
    galactusParticles = [];
};
GalactusDevourStarPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var topY = bb[1];

    this.timer -= dt;

    if (this.phase === 0) {
        // Star pulsing — growing unstable
        this.star.pulseSpeed += dt * 2;
        if (this.timer <= 0) {
            this.phase = 1;
            this.timer = 2.0;
        }
    } else if (this.phase === 1) {
        // Star being consumed — shrinks and moves toward top
        this.star.radius = Math.max(5, this.star.radius - 10 * dt);
        this.star.y -= 30 * dt;
        if (this.timer <= 0) {
            this.phase = 2;
            this.timer = 3.0;
            // Nova explosion
            Sound.playSound("laser", true);
            if (typeof triggerShake !== "undefined") triggerShake(8, 300);
            for (var r = 0; r < 5; r++) {
                var gapAngle = Math.random() * Math.PI * 2;
                this.novaRings.push({ cx: this.star.x, cy: this.star.y, radius: 5, speed: 80 + r * 15, maxRadius: 180, gapAngle: gapAngle, gapSize: 0.7 });
            }
        }
    } else if (this.phase === 2) {
        // Nova rings expanding
        for (var i = this.novaRings.length - 1; i >= 0; i--) {
            this.novaRings[i].radius += this.novaRings[i].speed * dt;
            if (this.novaRings[i].radius >= this.novaRings[i].maxRadius) this.novaRings.splice(i, 1);
        }
    }
};
GalactusDevourStarPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;

    // Star body (phases 0,1)
    if (this.phase <= 1 && this.star) {
        var dist = Math.sqrt(Math.pow(scx - this.star.x, 2) + Math.pow(scy - this.star.y, 2));
        var pRadius = this.star.radius + Math.sin(this.elapsed * this.star.pulseSpeed) * 5;
        if (dist < pRadius) return this.damVal;
    }

    // Nova rings
    for (var i = 0; i < this.novaRings.length; i++) {
        var r = this.novaRings[i];
        var dist = Math.sqrt(Math.pow(scx - r.cx, 2) + Math.pow(scy - r.cy, 2));
        if (Math.abs(dist - r.radius) < 10) {
            var angle = Math.atan2(scy - r.cy, scx - r.cx);
            var diff = angle - r.gapAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            if (Math.abs(diff) < r.gapSize / 2) continue;
            return this.damVal;
        }
    }
    return 0;
};
GalactusDevourStarPattern.prototype.draw = function(ctx) {
    ctx.save();

    // Draw star
    if (this.phase <= 1 && this.star) {
        var pRadius = this.star.radius + Math.sin(this.elapsed * this.star.pulseSpeed) * 5;
        ctx.save();
        ctx.translate(this.star.x, this.star.y);

        // Outer glow
        var grad = ctx.createRadialGradient(0, 0, pRadius * 0.3, 0, 0, pRadius * 1.5);
        grad.addColorStop(0, "rgba(255, 255, 200, 0.8)");
        grad.addColorStop(0.5, "rgba(255, 200, 50, 0.4)");
        grad.addColorStop(1, "rgba(255, 100, 0, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, pRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Star body
        ctx.fillStyle = "#FFDD44";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#FFAA00";
        ctx.beginPath();
        ctx.arc(0, 0, pRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Draw nova rings
    for (var i = 0; i < this.novaRings.length; i++) {
        var r = this.novaRings[i];
        var alpha = 1.0 - (r.radius / r.maxRadius);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "#FFAA22";
        ctx.lineWidth = 8;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#FF6600";
        ctx.beginPath();
        ctx.arc(r.cx, r.cy, r.radius, r.gapAngle + r.gapSize / 2, r.gapAngle + Math.PI * 2 - r.gapSize / 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusDevourStarPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.novaRings.length === 0;
};

// 21. galactusEndOfAllThings — Final attack: simultaneous beams + rings + gravity pull
var GalactusEndOfAllThingsPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 9.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 12;
    this.beamAngle = 0;
    this.rings = [];
    this.spawnTimer = 0;
    this.pullStr = 0;
};
GalactusEndOfAllThingsPattern.prototype = Object.create(BulletPattern.prototype);
GalactusEndOfAllThingsPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.beamAngle = 0;
    this.rings = [];
    this.spawnTimer = 0;
    this.pullStr = 0;
    galactusParticles = [];
};
GalactusEndOfAllThingsPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateGalactusParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;

    // Rotating dual beams
    this.beamAngle += 1.2 * dt;

    // Pull
    this.pullStr = Math.min(40, this.elapsed * 8);
    if (this.elapsed > this.duration - 1.5) this.pullStr = 0;

    if (this.pullStr > 0 && typeof Soul !== "undefined") {
        var sPos = Soul.getPos();
        var sdx = cx - sPos.x;
        var sdy = cy - sPos.y;
        var sDist = Math.sqrt(sdx * sdx + sdy * sdy);
        if (sDist > 5) {
            Soul.addForce(sdx / sDist * this.pullStr, sdy / sDist * this.pullStr);
        }
    }

    // Spawn rings with gaps
    if (this.elapsed < this.duration - 2.0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 1.0;
            var gapAngle = Math.random() * Math.PI * 2;
            this.rings.push({ cx: cx, cy: cy, radius: 5, speed: 90, maxRadius: 180, gapAngle: gapAngle, gapSize: 0.6 });
            Sound.playSound("laser", true);
        }
    }

    for (var i = this.rings.length - 1; i >= 0; i--) {
        this.rings[i].radius += this.rings[i].speed * dt;
        if (this.rings[i].radius >= this.rings[i].maxRadius) this.rings.splice(i, 1);
    }
};
GalactusEndOfAllThingsPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;

    if (this.elapsed >= this.duration - 1.0) return 0;

    // Check beams
    for (var b = 0; b < 2; b++) {
        var bAngle = this.beamAngle + b * Math.PI;
        var endX = cx + Math.cos(bAngle) * 300;
        var endY = cy + Math.sin(bAngle) * 300;
        var dist = GalactusCosmicBeamPattern.prototype._pointToLineDist(scx, scy, cx, cy, endX, endY);
        if (dist < 10) return this.damVal;
    }

    // Check rings
    for (var i = 0; i < this.rings.length; i++) {
        var r = this.rings[i];
        var dist = Math.sqrt(Math.pow(scx - r.cx, 2) + Math.pow(scy - r.cy, 2));
        if (Math.abs(dist - r.radius) < 8) {
            var angle = Math.atan2(scy - r.cy, scx - r.cx);
            var diff = angle - r.gapAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            if (Math.abs(diff) < r.gapSize / 2) continue;
            return this.damVal;
        }
    }
    return 0;
};
GalactusEndOfAllThingsPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    ctx.save();

    if (this.elapsed < this.duration - 1.0) {
        // Dual beams
        for (var b = 0; b < 2; b++) {
            var bAngle = this.beamAngle + b * Math.PI;
            var endX = cx + Math.cos(bAngle) * 300;
            var endY = cy + Math.sin(bAngle) * 300;

            ctx.strokeStyle = "rgba(200, 100, 255, 0.5)";
            ctx.lineWidth = 20;
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#BB44FF";
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }

    // Rings with gaps
    for (var i = 0; i < this.rings.length; i++) {
        var r = this.rings[i];
        var alpha = 1.0 - (r.radius / r.maxRadius);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "#CC44FF";
        ctx.lineWidth = 8;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#9933FF";
        ctx.beginPath();
        ctx.arc(r.cx, r.cy, r.radius, r.gapAngle + r.gapSize / 2, r.gapAngle + Math.PI * 2 - r.gapSize / 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // Center energy core
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowBlur = 25;
    ctx.shadowColor = "#BB44FF";
    ctx.beginPath();
    ctx.arc(cx, cy, 6 + Math.sin(this.elapsed * 8) * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    drawGalactusParticles(ctx);
};
GalactusEndOfAllThingsPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.rings.length === 0;
};
