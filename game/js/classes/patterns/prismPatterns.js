// prismPatterns.js — Unified Pattern Library for EL COLOSO DE ESPEJOS (Mirror Colossus)
// Renders high-fidelity crystalline and reflection-based attacks, 7 per phase with at most 2 repeated.
// 18 unique patterns total, featuring reflection mechanics, custom visual shapes, and high performance.

// ============================================================================
// SHARED UTILITIES & DRAWING HELPERS FOR CRYSTALS
// ============================================================================

function drawCrystalShard(ctx, x, y, size, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color || "#00FFFF";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.0;
    
    // Glowing shadow
    ctx.shadowBlur = 8;
    ctx.shadowColor = color || "#00FFFF";
    
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.4, -size * 0.2);
    ctx.lineTo(size * 0.2, size * 0.8);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.2, size * 0.8);
    ctx.lineTo(-size * 0.4, -size * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawLaserBeam(ctx, x1, y1, x2, y2, width, color, isWarning) {
    ctx.save();
    if (isWarning) {
        ctx.strokeStyle = "rgba(255, 0, 100, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    } else {
        ctx.shadowBlur = 15;
        ctx.shadowColor = color || "#00FFFF";
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        ctx.strokeStyle = color || "#00FFFF";
        ctx.lineWidth = width * 0.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    ctx.restore();
}

function drawMirrorPlate(ctx, x, y, w, h, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = "rgba(100, 200, 255, 0.35)";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.0;
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00F0FF";
    
    ctx.fillRect(-w/2, -h/2, w, h);
    ctx.strokeRect(-w/2, -h/2, w, h);
    
    // Diagonal glass glints
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-w/2 + 5, -h/2 + 2);
    ctx.lineTo(-w/2 + 15, h/2 - 2);
    ctx.moveTo(w/2 - 15, -h/2 + 2);
    ctx.lineTo(w/2 - 5, h/2 - 2);
    ctx.stroke();
    
    ctx.restore();
}

// Helper to check collision with a segment/line of width
function lineSegmentCollidesWithRect(x1, y1, x2, y2, lineWidth, rx, ry, rw, rh) {
    // Check if either endpoint is inside rect
    if (rx <= x1 && x1 <= rx + rw && ry <= y1 && y1 <= ry + rh) return true;
    if (rx <= x2 && x2 <= rx + rw && ry <= y2 && y2 <= ry + rh) return true;
    
    // Simple line intersection with box sides
    var left = lineIntersection(x1, y1, x2, y2, rx, ry, rx, ry + rh);
    if (left) return true;
    var right = lineIntersection(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh);
    if (right) return true;
    var top = lineIntersection(x1, y1, x2, y2, rx, ry, rx + rw, ry);
    if (top) return true;
    var bottom = lineIntersection(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh);
    if (bottom) return true;
    
    return false;
}

function lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    var den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den === 0) return null;
    var t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    var u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
    }
    return null;
}

// ============================================================================
// PHASE 1 PATTERNS (Crystalline Formations & Light Bounces)
// ============================================================================

// 1. prismBeamGrid (Laser grid refracts off box boundaries)
var PrismBeamGridPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
    this.nodes = []; // {x, y, targetX, targetY, angle, phase, timer}
    this.beams = []; // {x1, y1, x2, y2, rx, ry, active, duration}
};
PrismBeamGridPattern.prototype = Object.create(BulletPattern.prototype);
PrismBeamGridPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2;
    this.nodes = [];
    this.beams = [];
};
PrismBeamGridPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    // Spawn nodes
    if (this.spawnTimer >= 0.9 && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        var side = Math.floor(Math.random() * 4);
        var nx, ny, tx, ty, angle;
        if (side === 0) { // Top
            nx = bb[0] + 30 + Math.random() * (bb[2] - bb[0] - 60);
            ny = bb[1] - 15;
            tx = nx;
            ty = bb[1] + 15;
            angle = Math.PI / 2;
        } else if (side === 1) { // Bottom
            nx = bb[0] + 30 + Math.random() * (bb[2] - bb[0] - 60);
            ny = bb[3] + 15;
            tx = nx;
            ty = bb[3] - 15;
            angle = -Math.PI / 2;
        } else if (side === 2) { // Left
            nx = bb[0] - 15;
            ny = bb[1] + 30 + Math.random() * (bb[3] - bb[1] - 60);
            tx = bb[0] + 15;
            ty = ny;
            angle = 0;
        } else { // Right
            nx = bb[2] + 15;
            ny = bb[1] + 30 + Math.random() * (bb[3] - bb[1] - 60);
            tx = bb[2] - 15;
            ty = ny;
            angle = Math.PI;
        }
        
        this.nodes.push({
            x: nx, y: ny, tx: tx, ty: ty, angle: angle,
            phase: 0, // 0 = entering, 1 = warning, 2 = firing, 3 = exiting
            timer: 0.8 // warning / charge time
        });
        Sound.playSound("hit_1", true);
    }
    
    // Update nodes & beams
    for (var i = this.nodes.length - 1; i >= 0; i--) {
        var n = this.nodes[i];
        if (n.phase === 0) {
            // Enter animation
            n.x += (n.tx - n.x) * 0.15;
            n.y += (n.ty - n.y) * 0.15;
            if (Math.abs(n.x - n.tx) < 2 && Math.abs(n.y - n.ty) < 2) {
                n.phase = 1;
            }
        } else if (n.phase === 1) {
            n.timer -= dt;
            if (n.timer <= 0) {
                n.phase = 2;
                n.timer = 0.6; // Fire duration
                Sound.playSound("pulse", true);
                
                // Calculate main beam and reflection
                var bx1 = n.x, by1 = n.y;
                var dx = Math.cos(n.angle);
                var dy = Math.sin(n.angle);
                var bx2, by2;
                var rx, ry; // Refracted reflection coordinates
                
                // Raycast to bounds
                if (n.angle === 0) { // to right
                    bx2 = bb[2]; by2 = n.y;
                    rx = bb[2] - 100; ry = n.y + (Math.random() < 0.5 ? 100 : -100);
                } else if (n.angle === Math.PI) { // to left
                    bx2 = bb[0]; by2 = n.y;
                    rx = bb[0] + 100; ry = n.y + (Math.random() < 0.5 ? 100 : -100);
                } else if (n.angle === Math.PI / 2) { // to bottom
                    bx2 = n.x; by2 = bb[3];
                    rx = n.x + (Math.random() < 0.5 ? 100 : -100); ry = bb[3] - 100;
                } else { // to top
                    bx2 = n.x; by2 = bb[1];
                    rx = n.x + (Math.random() < 0.5 ? 100 : -100); ry = bb[1] + 100;
                }
                
                this.beams.push({
                    x1: bx1, y1: by1, x2: bx2, y2: by2,
                    rx: rx, ry: ry, active: true, duration: 0.6,
                    parent: n
                });
            }
        } else if (n.phase === 2) {
            n.timer -= dt;
            if (n.timer <= 0) {
                n.phase = 3;
                // Move out of screen
                if (n.angle === 0) { n.tx = bb[0] - 30; }
                else if (n.angle === Math.PI) { n.tx = bb[2] + 30; }
                else if (n.angle === Math.PI / 2) { n.ty = bb[1] - 30; }
                else { n.ty = bb[3] + 30; }
            }
        } else if (n.phase === 3) {
            n.x += (n.tx - n.x) * 0.1;
            n.y += (n.ty - n.y) * 0.1;
            if (Math.abs(n.x - n.tx) < 5 && Math.abs(n.y - n.ty) < 5) {
                this.nodes.splice(i, 1);
            }
        }
    }
    
    // Update beams
    for (var i = this.beams.length - 1; i >= 0; i--) {
        var b = this.beams[i];
        b.duration -= dt;
        if (b.duration <= 0) {
            this.beams.splice(i, 1);
        }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
PrismBeamGridPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.beams.length; i++) {
        var b = this.beams[i];
        if (b.duration > 0 && b.duration < 0.5) { // Only active after warning phase fades out
            if (lineSegmentCollidesWithRect(b.x1, b.y1, b.x2, b.y2, 10, sx, sy, sw, sh)) return this.damVal;
            if (lineSegmentCollidesWithRect(b.x2, b.y2, b.rx, b.ry, 8, sx, sy, sw, sh)) return this.damVal;
        }
    }
    return 0;
};
PrismBeamGridPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    
    // Draw warnings and beams
    for (var i = 0; i < this.beams.length; i++) {
        var b = this.beams[i];
        var alpha = Math.min(1.0, b.duration / 0.15);
        ctx.save();
        ctx.globalAlpha = alpha;
        drawLaserBeam(ctx, b.x1, b.y1, b.x2, b.y2, 10, "#00FFFF", false);
        drawLaserBeam(ctx, b.x2, b.y2, b.rx, b.ry, 8, "#00F0FF", false);
        ctx.restore();
    }
    
    // Draw charging line warnings for nodes in warning phase
    for (var i = 0; i < this.nodes.length; i++) {
        var n = this.nodes[i];
        if (n.phase === 1) {
            // Draw dotted warning line
            ctx.save();
            ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            var dx = Math.cos(n.angle) * 500;
            var dy = Math.sin(n.angle) * 500;
            ctx.lineTo(n.x + dx, n.y + dy);
            ctx.stroke();
            ctx.restore();
            
            // Draw charge particle ring around the node
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.timer * 35, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw the physical crystal node
        drawCrystalShard(ctx, n.x, n.y, 12, n.angle + Math.PI/2, "#00FFFF");
    }
    ctx.restore();
};
PrismBeamGridPattern.prototype.isOver = function() {
    return (this.elapsed >= this.duration && this.nodes.length === 0 && this.beams.length === 0) || this.elapsed >= this.duration + 1.5;
};


// 2. shatteringSpikes (Crystal spikes fall and shatter on opposite wall)
var ShatteringSpikesPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
    this.spikes = []; // {x, y, vy, size, warning, state} // 0=warn, 1=fall
};
ShatteringSpikesPattern.prototype = Object.create(BulletPattern.prototype);
ShatteringSpikesPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2;
    this.spikes = [];
};
ShatteringSpikesPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    // Spawn falling spikes
    if (this.spawnTimer >= 0.75 && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        var num = 2 + Math.floor(Math.random() * 2);
        for (var k = 0; k < num; k++) {
            var rx = bb[0] + 15 + Math.random() * (bb[2] - bb[0] - 30);
            this.spikes.push({
                x: rx,
                y: bb[1] + 15,
                vy: 0,
                size: 20,
                warning: 0.65,
                state: 0
            });
        }
        Sound.playSound("hit_1", true);
    }
    
    // Update spikes
    for (var i = this.spikes.length - 1; i >= 0; i--) {
        var s = this.spikes[i];
        if (s.state === 0) {
            s.warning -= dt;
            if (s.warning <= 0) {
                s.state = 1;
                s.vy = 280 + Math.random() * 100;
                Sound.playSound("laser", true);
            }
        } else {
            s.y += s.vy * dt;
            
            // Reaches bottom of battle box
            if (s.y >= bb[3] - 12) {
                // Shatter into shards
                Sound.playSound("ting", true);
                triggerShake(3, 100);
                for (var j = 0; j < 4; j++) {
                    var angle = -Math.PI / 6 - (j * Math.PI / 4); // upwards fan
                    this.bullets.push(new Bullet({
                        x: s.x, y: bb[3] - 16,
                        width: 10, height: 10,
                        useVelocity: true,
                        vx: Math.cos(angle) * 160,
                        vy: Math.sin(angle) * 160,
                        damVal: this.damVal - 2,
                        color: "#E0FFFF"
                    }));
                }
                this.spikes.splice(i, 1);
            }
        }
    }
    
    // Update bullets (shards)
    BulletPattern.prototype.update.call(this, dt);
    
    // Clean up out of bounds bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        if (this.bullets[i].isOutOfBounds([bb[0] - 50, bb[1] - 50, bb[2] + 50, bb[3] + 50])) {
            this.bullets.splice(i, 1);
        }
    }
};
ShatteringSpikesPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var dmg = BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
    if (dmg > 0) return dmg;
    
    // Check spike collisions
    for (var i = 0; i < this.spikes.length; i++) {
        var s = this.spikes[i];
        if (s.state === 1) {
            // Spike bounding box approximation
            if (rectsOverlap(s.x - s.size/2, s.y - s.size, s.size, s.size, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }
    return 0;
};
ShatteringSpikesPattern.prototype.draw = function(ctx) {
    ctx.save();
    // Draw shards
    BulletPattern.prototype.draw.call(this, ctx);
    
    // Draw spikes
    for (var i = 0; i < this.spikes.length; i++) {
        var s = this.spikes[i];
        if (s.state === 0) {
            // Flash warning silhouette
            var pulse = Math.sin(Date.now() / 40) * 0.4 + 0.6;
            ctx.save();
            ctx.globalAlpha = pulse;
            drawCrystalShard(ctx, s.x, s.y, s.size, Math.PI, "#FF1493");
            ctx.restore();
        } else {
            drawCrystalShard(ctx, s.x, s.y, s.size, Math.PI, "#00FFFF");
        }
    }
    ctx.restore();
};
ShatteringSpikesPattern.prototype.isOver = function() {
    return (this.elapsed >= this.duration && this.spikes.length === 0 && this.bullets.length === 0) || this.elapsed >= this.duration + 1.5;
};


// 3. mirrorReflect (Bouncing beams reflect off floating mirrors)
var MirrorReflectPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
    this.mirror = { x: 300, y: 280, w: 100, h: 10, vx: 120, targetX: 300 };
    this.lasers = []; // {x, y, vx, vy, hasReflected, active, path: []}
};
MirrorReflectPattern.prototype = Object.create(BulletPattern.prototype);
MirrorReflectPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2;
    var bb = Cbbox.getBound();
    this.mirror.x = (bb[0] + bb[2]) / 2;
    this.mirror.y = (bb[1] + bb[3]) / 2 + 10;
    this.mirror.w = 90;
    this.mirror.h = 8;
    this.mirror.vx = 90;
    this.lasers = [];
};
MirrorReflectPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    // Update Mirror position (drift left/right)
    this.mirror.x += this.mirror.vx * dt;
    if (this.mirror.vx > 0 && this.mirror.x + this.mirror.w/2 >= bb[2] - 10) {
        this.mirror.vx = -this.mirror.vx;
    } else if (this.mirror.vx < 0 && this.mirror.x - this.mirror.w/2 <= bb[0] + 10) {
        this.mirror.vx = -this.mirror.vx;
    }
    
    // Spawn lasers shooting from top
    if (this.spawnTimer >= 0.8 && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        var lx = bb[0] + 20 + Math.random() * (bb[2] - bb[0] - 40);
        this.lasers.push({
            x: lx,
            y: bb[1],
            vx: (Math.random() - 0.5) * 40,
            vy: 180,
            hasReflected: false,
            active: true,
            path: [{x: lx, y: bb[1]}]
        });
        Sound.playSound("laser", true);
    }
    
    // Update Lasers
    for (var i = this.lasers.length - 1; i >= 0; i--) {
        var l = this.lasers[i];
        var prevX = l.x;
        var prevY = l.y;
        l.x += l.vx * dt;
        l.y += l.vy * dt;
        
        // Add current pos to path
        l.path.push({x: l.x, y: l.y});
        if (l.path.length > 25) l.path.shift();
        
        // Mirror reflection check
        if (!l.hasReflected) {
            // Check cross of mirror Y
            var mirrorMinX = this.mirror.x - this.mirror.w/2;
            var mirrorMaxX = this.mirror.x + this.mirror.w/2;
            if (prevY < this.mirror.y && l.y >= this.mirror.y && l.x >= mirrorMinX && l.x <= mirrorMaxX) {
                // Reflect! Reverse Y, slightly modify X velocity based on hit location
                l.y = this.mirror.y;
                l.vy = -l.vy;
                var hitOffset = (l.x - this.mirror.x) / (this.mirror.w/2); // -1 to 1
                l.vx = hitOffset * 130;
                l.hasReflected = true;
                Sound.playSound("ting", true);
                
                // Add reflection spark particle trigger
                for (var s=0; s<3; s++) {
                    this.bullets.push(new Bullet({
                        x: l.x, y: l.y - 2,
                        width: 8, height: 8,
                        useVelocity: true,
                        vx: (Math.random() - 0.5) * 80,
                        vy: -50 - Math.random() * 80,
                        damVal: this.damVal - 3,
                        color: "#B0E0E6"
                    }));
                }
            }
        }
        
        // Out of bounds check
        if (l.y > bb[3] + 20 || l.y < bb[1] - 20 || l.x < bb[0] - 20 || l.x > bb[2] + 20) {
            this.lasers.splice(i, 1);
        }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
MirrorReflectPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var dmg = BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
    if (dmg > 0) return dmg;
    
    // Check collision with laser paths
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.path.length > 1) {
            // Check collision with recent segment
            var p1 = l.path[l.path.length - 2];
            var p2 = l.path[l.path.length - 1];
            if (lineSegmentCollidesWithRect(p1.x, p1.y, p2.x, p2.y, 6, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }
    return 0;
};
MirrorReflectPattern.prototype.draw = function(ctx) {
    ctx.save();
    
    // Draw shard bullet sparks
    BulletPattern.prototype.draw.call(this, ctx);
    
    // Draw lasers
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.path.length > 1) {
            ctx.save();
            ctx.shadowBlur = 8;
            ctx.shadowColor = l.hasReflected ? "#FF8C00" : "#00FFFF";
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 5.0;
            ctx.beginPath();
            ctx.moveTo(l.path[0].x, l.path[0].y);
            for (var p = 1; p < l.path.length; p++) {
                ctx.lineTo(l.path[p].x, l.path[p].y);
            }
            ctx.stroke();
            
            ctx.strokeStyle = l.hasReflected ? "#FFA500" : "#00CED1";
            ctx.lineWidth = 2.0;
            ctx.stroke();
            ctx.restore();
        }
    }
    
    // Draw the moving mirror
    drawMirrorPlate(ctx, this.mirror.x, this.mirror.y, this.mirror.w, this.mirror.h, 0);
    ctx.restore();
};
MirrorReflectPattern.prototype.isOver = function() {
    return (this.elapsed >= this.duration && this.lasers.length === 0 && this.bullets.length === 0) || this.elapsed >= this.duration + 1.5;
};


// 4. crystallineShield (Hexagonal boundaries shrinking down with a single moving gap)
var CrystallineShieldPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.rings = []; // {radius, speed, gapAngle}
    this.spawnTimer = 0;
};
CrystallineShieldPattern.prototype = Object.create(BulletPattern.prototype);
CrystallineShieldPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.rings = [];
    this.spawnTimer = 0.5; // Spawn first shield quickly
};
CrystallineShieldPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    if (this.spawnTimer >= 1.6 && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        this.rings.push({
            radius: 180,
            speed: 55,
            gapAngle: Math.random() * Math.PI * 2,
            gapSpeed: (Math.random() < 0.5 ? 1.2 : -1.2)
        });
        Sound.playSound("spirit", true);
    }
    
    for (var i = this.rings.length - 1; i >= 0; i--) {
        var r = this.rings[i];
        r.radius -= r.speed * dt;
        r.gapAngle += r.gapSpeed * dt;
        if (r.radius <= 6) {
            this.rings.splice(i, 1);
            Sound.playSound("ting", true);
        }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
CrystallineShieldPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    var dist = Math.sqrt((scx - cx) * (scx - cx) + (scy - cy) * (scy - cy));
    var angle = Math.atan2(scy - cy, scx - cx);
    if (angle < 0) angle += Math.PI * 2;
    
    for (var i = 0; i < this.rings.length; i++) {
        var r = this.rings[i];
        // Check if player is crossing the ring boundary
        if (Math.abs(dist - r.radius) < 8) {
            // Check if player is NOT in the gap. Gap size is ~Math.PI / 4 radians.
            var gapMin = r.gapAngle - Math.PI/7;
            var gapMax = r.gapAngle + Math.PI/7;
            
            // Normalize angles
            var normAngle = angle;
            var gMin = (gapMin % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
            var gMax = (gapMax % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
            
            var inGap = false;
            if (gMin < gMax) {
                inGap = normAngle >= gMin && normAngle <= gMax;
            } else {
                inGap = normAngle >= gMin || normAngle <= gMax;
            }
            
            if (!inGap) return this.damVal;
        }
    }
    return 0;
};
CrystallineShieldPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    for (var i = 0; i < this.rings.length; i++) {
        var r = this.rings[i];
        
        ctx.save();
        ctx.strokeStyle = "rgba(0, 220, 255, 0.75)";
        ctx.lineWidth = 4.0;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00FFFF";
        
        // Draw 6 octagon sides except for the gap segment
        var numSegments = 12;
        var step = (Math.PI * 2) / numSegments;
        
        for (var s = 0; s < numSegments; s++) {
            var sAngle = s * step;
            // Check if this segment is in the gap
            var gapMin = r.gapAngle - Math.PI/6;
            var gapMax = r.gapAngle + Math.PI/6;
            var midAngle = sAngle + step / 2;
            
            var gMin = (gapMin % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
            var gMax = (gapMax % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
            var mAngle = (midAngle % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
            
            var inGap = false;
            if (gMin < gMax) {
                inGap = mAngle >= gMin && mAngle <= gMax;
            } else {
                inGap = mAngle >= gMin || mAngle <= gMax;
            }
            
            if (!inGap) {
                var x1 = cx + Math.cos(sAngle) * r.radius;
                var y1 = cy + Math.sin(sAngle) * r.radius;
                var x2 = cx + Math.cos(sAngle + step) * r.radius;
                var y2 = cy + Math.sin(sAngle + step) * r.radius;
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                
                // Draw a crystal shard at the vertex
                if (s % 2 === 0) {
                    drawCrystalShard(ctx, x1, y1, 5, sAngle, "#FFFFFF");
                }
            }
        }
        ctx.restore();
    }
    ctx.restore();
};
CrystallineShieldPattern.prototype.isOver = function() {
    return (this.elapsed >= this.duration && this.rings.length === 0) || this.elapsed >= this.duration + 1.5;
};


// 5. refractionCascade (White laser splits through prism into a cascade of colored streams)
var RefractionCascadePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.colors = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#8B00FF"];
    this.streamTimer = 0;
};
RefractionCascadePattern.prototype = Object.create(BulletPattern.prototype);
RefractionCascadePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.streamTimer = 0;
};
RefractionCascadePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.streamTimer += dt;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    
    // Spawn cascading colored bullets flowing in sine waves
    if (this.streamTimer >= 0.15 && this.elapsed < this.duration - 0.8) {
        this.streamTimer = 0;
        Sound.playSound("ting", true);
        
        for (var c = 0; c < this.colors.length; c++) {
            var col = this.colors[c];
            // Split out at different angles from the center prism (cx, bb[1]+40)
            var angle = Math.PI / 4 + (c * Math.PI / 10); // fan down
            var bulletSpeed = 160 + c * 10;
            this.bullets.push(new Bullet({
                x: cx,
                y: bb[1] + 45,
                width: 10, height: 10,
                useVelocity: true,
                vx: Math.cos(angle) * bulletSpeed,
                vy: Math.sin(angle) * bulletSpeed,
                color: col,
                damVal: this.damVal - 1,
                // store sine components
                origX: cx,
                sineOffset: c * 2,
                timeAlive: 0
            }));
        }
    }
    
    // Update bullets with sine wave lateral sway
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        if (b.origX !== undefined) {
            b.timeAlive += dt;
            b.x += Math.sin(b.timeAlive * 8 + b.sineOffset) * 2.5;
        }
        b.progressMovement(dt);
        if (b.isOutOfBounds([bb[0] - 50, bb[1] - 50, bb[2] + 50, bb[3] + 50])) {
            this.bullets.splice(i, 1);
        }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
RefractionCascadePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    // Core white beam deals damage at the center top
    if (this.elapsed < this.duration - 0.8) {
        if (rectsOverlap(cx - 6, bb[1], 12, 45, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    return BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
};
RefractionCascadePattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    
    // Draw the falling color bullets
    BulletPattern.prototype.draw.call(this, ctx);
    
    if (this.elapsed < this.duration - 0.8) {
        // Draw incoming white beam from top to the prism
        drawLaserBeam(ctx, cx, bb[1], cx, bb[1] + 45, 8, "#FFFFFF", false);
        
        // Draw refracting prism at the center top
        drawMirrorPlate(ctx, cx, bb[1] + 45, 24, 24, Date.now() / 800);
        
        // Draw mini light beams splitting from the prism to simulate refraction
        for (var c = 0; c < this.colors.length; c++) {
            ctx.save();
            ctx.strokeStyle = this.colors[c];
            ctx.lineWidth = 2.0;
            var angle = Math.PI / 4 + (c * Math.PI / 10);
            ctx.beginPath();
            ctx.moveTo(cx, bb[1] + 45);
            ctx.lineTo(cx + Math.cos(angle) * 30, bb[1] + 45 + Math.sin(angle) * 30);
            ctx.stroke();
            ctx.restore();
        }
    }
    ctx.restore();
};
RefractionCascadePattern.prototype.isOver = function() {
    return (this.elapsed >= this.duration && this.bullets.length === 0) || this.elapsed >= this.duration + 1.5;
};


// ============================================================================
// PHASE 2 PATTERNS (Fractures, Kaleidoscopes, Sweeping Light Waves)
// ============================================================================

// 6. glassFracture (Cracking lines explode into jagged glass shards)
var GlassFracturePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 9;
    this.fractures = []; // {x1, y1, x2, y2, warning, active, timer}
};
GlassFracturePattern.prototype = Object.create(BulletPattern.prototype);
GlassFracturePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2;
    this.fractures = [];
};
GlassFracturePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    // Spawn new fractures
    if (this.spawnTimer >= 1.0 && this.elapsed < this.duration - 1.6) {
        this.spawnTimer = 0;
        Sound.playSound("hit_1", true);
        var type = Math.random() < 0.5; // Horizontal vs Vertical vs Diagonal
        var x1, y1, x2, y2;
        if (type) {
            x1 = bb[0];
            y1 = bb[1] + Math.random() * (bb[3] - bb[1]);
            x2 = bb[2];
            y2 = y1 + (Math.random() - 0.5) * 60;
        } else {
            x1 = bb[0] + Math.random() * (bb[2] - bb[0]);
            y1 = bb[1];
            x2 = x1 + (Math.random() - 0.5) * 60;
            y2 = bb[3];
        }
        
        this.fractures.push({
            x1: x1, y1: y1, x2: x2, y2: y2,
            warning: 0.8,
            active: 0.4,
            timer: 0.8
        });
    }
    
    // Update fractures
    for (var i = this.fractures.length - 1; i >= 0; i--) {
        var f = this.fractures[i];
        if (f.warning > 0) {
            f.warning -= dt;
            if (f.warning <= 0) {
                // Explode! Spawn shards along the fracture line
                Sound.playSound("impact", true);
                triggerShake(4, 120);
                
                // Spawn 6 small glass shard bullets along the segment
                for (var j = 0; j < 6; j++) {
                    var t = j / 5;
                    var sx = f.x1 + t * (f.x2 - f.x1);
                    var sy = f.y1 + t * (f.y2 - f.y1);
                    var angle = Math.atan2(f.y2 - f.y1, f.x2 - f.x1) + Math.PI/2 + (Math.random() - 0.5) * 0.5;
                    
                    this.bullets.push(new Bullet({
                        x: sx, y: sy,
                        width: 8, height: 14,
                        useVelocity: true,
                        vx: Math.cos(angle) * (110 + Math.random() * 80),
                        vy: Math.sin(angle) * (110 + Math.random() * 80),
                        color: "#E6F2FF",
                        damVal: this.damVal - 2
                    }));
                    
                    // Inverse shard direction
                    this.bullets.push(new Bullet({
                        x: sx, y: sy,
                        width: 8, height: 14,
                        useVelocity: true,
                        vx: Math.cos(angle + Math.PI) * (110 + Math.random() * 80),
                        vy: Math.sin(angle + Math.PI) * (110 + Math.random() * 80),
                        color: "#B0D4FF",
                        damVal: this.damVal - 2
                    }));
                }
            }
        } else {
            f.active -= dt;
            if (f.active <= 0) {
                this.fractures.splice(i, 1);
            }
        }
    }
    
    // Update shards
    BulletPattern.prototype.update.call(this, dt);
    
    // Clean up out of bounds bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        if (this.bullets[i].isOutOfBounds([bb[0] - 50, bb[1] - 50, bb[2] + 50, bb[3] + 50])) {
            this.bullets.splice(i, 1);
        }
    }
};
GlassFracturePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var dmg = BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
    if (dmg > 0) return dmg;
    
    // Fracture line deals damage during active frames
    for (var i = 0; i < this.fractures.length; i++) {
        var f = this.fractures[i];
        if (f.warning <= 0 && f.active > 0) {
            if (lineSegmentCollidesWithRect(f.x1, f.y1, f.x2, f.y2, 5, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }
    return 0;
};
GlassFracturePattern.prototype.draw = function(ctx) {
    ctx.save();
    
    // Draw shards
    BulletPattern.prototype.draw.call(this, ctx);
    
    // Draw fractures
    for (var i = 0; i < this.fractures.length; i++) {
        var f = this.fractures[i];
        if (f.warning > 0) {
            // Draw cracking red line
            ctx.save();
            ctx.strokeStyle = "rgba(255, 0, 100, 0.4)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            ctx.moveTo(f.x1, f.y1);
            ctx.lineTo(f.x2, f.y2);
            ctx.stroke();
            ctx.restore();
        } else {
            // Draw bright glowing jagged fracture
            ctx.save();
            ctx.strokeStyle = "#FFFFFF";
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#00FFFF";
            ctx.lineWidth = 3.0;
            ctx.beginPath();
            // Draw jagged segments instead of straight line
            var steps = 10;
            ctx.moveTo(f.x1, f.y1);
            for (var s = 1; s < steps; s++) {
                var t = s / steps;
                var jx = f.x1 + t * (f.x2 - f.x1) + (Math.random() - 0.5) * 4;
                var jy = f.y1 + t * (f.y2 - f.y1) + (Math.random() - 0.5) * 4;
                ctx.lineTo(jx, jy);
            }
            ctx.lineTo(f.x2, f.y2);
            ctx.stroke();
            ctx.restore();
        }
    }
    ctx.restore();
};
GlassFracturePattern.prototype.isOver = function() {
    return (this.elapsed >= this.duration && this.fractures.length === 0 && this.bullets.length === 0) || this.elapsed >= this.duration + 1.5;
};


// 7. kaleidoscopeSpiral (Expanding and contracting concentric ring orbits)
var KaleidoscopeSpiralPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.angleOffset = 0;
};
KaleidoscopeSpiralPattern.prototype = Object.create(BulletPattern.prototype);
KaleidoscopeSpiralPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.angleOffset = 0;
    
    var bb = this.battleBox;
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    // Fill with slow revolving crystal orbits at different starting radiuses
    for (var r = 0; r < 3; r++) {
        var num = 12 + r * 6;
        var radius = 45 + r * 45;
        var speed = 1.0 - r * 0.25;
        var color = r === 0 ? "#FF00FF" : (r === 1 ? "#00FFFF" : "#FFFF00");
        for (var i = 0; i < num; i++) {
            var angle = (i * Math.PI * 2) / num;
            this.bullets.push(new Bullet({
                x: cx + Math.cos(angle) * radius,
                y: cy + Math.sin(angle) * radius,
                width: 10, height: 10,
                color: color,
                damVal: this.damVal,
                // Orbit custom variables
                cx: cx, cy: cy,
                orbitRad: radius,
                startAngle: angle,
                rotSpeed: (r % 2 === 0 ? speed : -speed),
                time: 0
            }));
        }
    }
    Sound.playSound("spirit", true);
};
KaleidoscopeSpiralPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.cx !== undefined) {
            b.time += dt;
            // Pulsing expand and contract using sine wave
            var curRad = b.orbitRad + Math.sin(b.time * 2.2) * 20;
            var curAngle = b.startAngle + b.rotSpeed * b.time;
            b.x = b.cx + Math.cos(curAngle) * curRad - b.width/2;
            b.y = b.cy + Math.sin(curAngle) * curRad - b.height/2;
        }
    }
    
    // No offbounds splice because they orbit the box center
    BulletPattern.prototype.update.call(this, dt);
};
KaleidoscopeSpiralPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    return BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
};
KaleidoscopeSpiralPattern.prototype.draw = function(ctx) {
    ctx.save();
    // Custom render: draw light webbing connectors between matching orbits
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 45 + Math.sin(this.elapsed * 2.2) * 20, 0, Math.PI * 2);
    ctx.arc(cx, cy, 90 + Math.sin(this.elapsed * 2.2) * 20, 0, Math.PI * 2);
    ctx.arc(cx, cy, 135 + Math.sin(this.elapsed * 2.2) * 20, 0, Math.PI * 2);
    ctx.stroke();
    
    BulletPattern.prototype.draw.call(this, ctx);
    ctx.restore();
};
KaleidoscopeSpiralPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};


// 8. prismLaserSweep (Lighthouse style rotating sweep beam)
var PrismLaserSweepPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.angle = 0;
    this.sweepSpeed = config.sweepSpeed || 0.65;
};
PrismLaserSweepPattern.prototype = Object.create(BulletPattern.prototype);
PrismLaserSweepPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.angle = Math.random() * Math.PI * 2;
    Sound.playSound("laser", true);
};
PrismLaserSweepPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.angle += this.sweepSpeed * dt;
    
    BulletPattern.prototype.update.call(this, dt);
};
PrismLaserSweepPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    if (this.elapsed < 0.8) return 0; // Warmup period
    
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    // Sweeps 2 opposing lines
    var ex1 = cx + Math.cos(this.angle) * 400;
    var ey1 = cy + Math.sin(this.angle) * 400;
    if (lineSegmentCollidesWithRect(cx, cy, ex1, ey1, 8, sx, sy, sw, sh)) return this.damVal;
    
    var ex2 = cx - Math.cos(this.angle) * 400;
    var ey2 = cy - Math.sin(this.angle) * 400;
    if (lineSegmentCollidesWithRect(cx, cy, ex2, ey2, 8, sx, sy, sw, sh)) return this.damVal;
    
    return 0;
};
PrismLaserSweepPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    var ex1 = cx + Math.cos(this.angle) * 400;
    var ey1 = cy + Math.sin(this.angle) * 400;
    var ex2 = cx - Math.cos(this.angle) * 400;
    var ey2 = cy - Math.sin(this.angle) * 400;
    
    if (this.elapsed < 0.8) {
        // Warning dashes
        drawLaserBeam(ctx, cx, cy, ex1, ey1, 2, "#FF00FF", true);
        drawLaserBeam(ctx, cx, cy, ex2, ey2, 2, "#FF00FF", true);
    } else {
        // High intensity sweeping rays
        drawLaserBeam(ctx, cx, cy, ex1, ey1, 8, "#00FFFF", false);
        drawLaserBeam(ctx, cx, cy, ex2, ey2, 8, "#00FFFF", false);
    }
    
    // Draw rotating central crystal prism
    drawMirrorPlate(ctx, cx, cy, 28, 28, this.angle * 1.5);
    ctx.restore();
};
PrismLaserSweepPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};


// 9. birefringenceSplit (Bullets split when passing a diagonal interface)
var BirefringenceSplitPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
};
BirefringenceSplitPattern.prototype = Object.create(BulletPattern.prototype);
BirefringenceSplitPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2;
};
BirefringenceSplitPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    // Diagonal interface: line y = x + offset in box space
    // Let's define the line passing from top-left (bb[0], bb[1]) to bottom-right (bb[2], bb[3])
    // Interface equation: (y - y1)/(y2 - y1) = (x - x1)/(x2 - x1)
    
    if (this.spawnTimer >= 0.55 && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        Sound.playSound("hit_1", true);
        
        // Spawn from top
        var rx = bb[0] + 20 + Math.random() * (bb[2] - bb[0] - 40);
        this.bullets.push(new Bullet({
            x: rx, y: bb[1] - 10,
            width: 12, height: 12,
            useVelocity: true,
            vx: 0,
            vy: 150,
            color: "#FFF",
            damVal: this.damVal,
            canBirefract: true
        }));
    }
    
    // Update bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        
        // Check interface crossing
        if (b.canBirefract) {
            // Check if bullet crossed the diagonal line (y - y_start) > (x - x_start) * slope
            var dx = bb[2] - bb[0];
            var dy = bb[3] - bb[1];
            var slope = dy / dx;
            var interfaceY = bb[1] + (b.x - bb[0]) * slope;
            
            if (b.y >= interfaceY) {
                // Cross! Split into 2 color-refracted bullets
                b.active = false;
                Sound.playSound("ting", true);
                
                // Cyan split bullet (deflect right)
                this.bullets.push(new Bullet({
                    x: b.x, y: b.y,
                    width: 10, height: 10,
                    useVelocity: true,
                    vx: 60,
                    vy: 130,
                    color: "#00FFFF",
                    damVal: this.damVal - 1,
                    canBirefract: false
                }));
                // Pink split bullet (deflect left)
                this.bullets.push(new Bullet({
                    x: b.x, y: b.y,
                    width: 10, height: 10,
                    useVelocity: true,
                    vx: -60,
                    vy: 130,
                    color: "#FF00FF",
                    damVal: this.damVal - 1,
                    canBirefract: false
                }));
                
                this.bullets.splice(i, 1);
            }
        } else {
            if (b.isOutOfBounds([bb[0] - 50, bb[1] - 50, bb[2] + 50, bb[3] + 50])) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
BirefringenceSplitPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    return BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
};
BirefringenceSplitPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    
    // Draw Birefringence diagonal interface line
    ctx.strokeStyle = "rgba(0, 240, 255, 0.3)";
    ctx.lineWidth = 2.0;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(bb[0], bb[1]);
    ctx.lineTo(bb[2], bb[3]);
    ctx.stroke();
    
    // Interface glints
    ctx.fillStyle = "rgba(0, 240, 255, 0.05)";
    ctx.beginPath();
    ctx.moveTo(bb[0], bb[1]);
    ctx.lineTo(bb[2], bb[3]);
    ctx.lineTo(bb[2], bb[1]);
    ctx.closePath();
    ctx.fill();
    
    BulletPattern.prototype.draw.call(this, ctx);
    ctx.restore();
};
BirefringenceSplitPattern.prototype.isOver = function() {
    return (this.elapsed >= this.duration && this.bullets.length === 0) || this.elapsed >= this.duration + 1.5;
};


// 10. mirrorMaze (Slow moving mirror dividers with bouncing rays)
var MirrorMazePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.mirrors = []; // {x, y, w, h, angle}
    this.sparks = []; // custom laser sparks
    this.spawnTimer = 0;
};
MirrorMazePattern.prototype = Object.create(BulletPattern.prototype);
MirrorMazePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2;
    var bb = Cbbox.getBound();
    this.mirrors = [
        { x: bb[0] + 80, y: bb[1] + 80, w: 60, h: 6, angle: Math.PI / 4 },
        { x: bb[2] - 80, y: bb[1] + 80, w: 60, h: 6, angle: -Math.PI / 4 },
        { x: bb[0] + 100, y: bb[3] - 80, w: 60, h: 6, angle: -Math.PI / 4 },
        { x: bb[2] - 100, y: bb[3] - 80, w: 60, h: 6, angle: Math.PI / 4 }
    ];
    this.sparks = [];
};
MirrorMazePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    // Periodic bouncing sparks
    if (this.spawnTimer >= 0.75 && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        Sound.playSound("laser", true);
        
        var side = Math.random() < 0.5;
        this.bullets.push(new Bullet({
            x: side ? bb[0] + 10 : bb[2] - 20,
            y: bb[1] + 20 + Math.random() * 50,
            width: 12, height: 12,
            useVelocity: true,
            vx: side ? 160 : -160,
            vy: 80,
            color: "#FFF",
            damVal: this.damVal,
            bouncesLeft: 5
        }));
    }
    
    // Update sparks and handle mirror bounces
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        
        // Bounce off mirrors
        for (var m = 0; m < this.mirrors.length; m++) {
            var mir = this.mirrors[m];
            var dx = b.x + b.width/2 - mir.x;
            var dy = b.y + b.height/2 - mir.y;
            var dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < mir.w / 2 + 6) {
                // Approximate reflection
                var normalAngle = mir.angle + Math.PI/2;
                // Reflect velocity vector around normal
                var dot = b.vx * Math.cos(normalAngle) + b.vy * Math.sin(normalAngle);
                b.vx = b.vx - 2 * dot * Math.cos(normalAngle);
                b.vy = b.vy - 2 * dot * Math.sin(normalAngle);
                
                // Displace slightly to prevent double hitting
                b.x += b.vx * dt * 2.0;
                b.y += b.vy * dt * 2.0;
                
                Sound.playSound("ting", true);
                break;
            }
        }
        
        // Bounce off bounding box walls
        if (b.x <= bb[0] + 4 && b.vx < 0) { b.vx = -b.vx; Sound.playSound("hit_2", true); }
        if (b.x >= bb[2] - b.width - 4 && b.vx > 0) { b.vx = -b.vx; Sound.playSound("hit_2", true); }
        if (b.y <= bb[1] + 4 && b.vy < 0) { b.vy = -b.vy; Sound.playSound("hit_2", true); }
        if (b.y >= bb[3] - b.height - 4 && b.vy > 0) { b.vy = -b.vy; Sound.playSound("hit_2", true); }
        
        if (b.isOutOfBounds([bb[0] - 100, bb[1] - 100, bb[2] + 100, bb[3] + 100])) {
            this.bullets.splice(i, 1);
        }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
MirrorMazePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    return BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
};
MirrorMazePattern.prototype.draw = function(ctx) {
    ctx.save();
    
    // Draw mirrors
    for (var m = 0; m < this.mirrors.length; m++) {
        var mir = this.mirrors[m];
        drawMirrorPlate(ctx, mir.x, mir.y, mir.w, mir.h, mir.angle);
    }
    
    // Draw bullets
    BulletPattern.prototype.draw.call(this, ctx);
    
    ctx.restore();
};
MirrorMazePattern.prototype.isOver = function() {
    return (this.elapsed >= this.duration && this.bullets.length === 0) || this.elapsed >= this.duration + 1.5;
};


// ============================================================================
// PHASE 3 PATTERNS (Crystalline Cataclysms & Spectral Realities)
// ============================================================================

// 11. shatteredCore (Large core shatters radial bullets and reforms)
var ShatteredCorePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.damVal = config.damVal || 10;
    this.coreTimer = 0;
    this.coreState = 0; // 0 = reform/charging, 1 = shattered
};
ShatteredCorePattern.prototype = Object.create(BulletPattern.prototype);
ShatteredCorePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.coreTimer = 0;
    this.coreState = 0;
};
ShatteredCorePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.coreTimer += dt;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    if (this.coreState === 0) {
        // Charging phase: pull player slightly
        if (typeof Soul !== "undefined") {
            var sPos = Soul.getPos();
            var dx = cx - (sPos.x + Soul.getWidth()/2);
            var dy = cy - (sPos.y + Soul.getHeight()/2);
            var dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 15) {
                Soul.setPos(sPos.x + (dx/dist) * 22 * dt, sPos.y + (dy/dist) * 22 * dt);
            }
        }
        
        if (this.coreTimer >= 1.5 && this.elapsed < this.duration - 1.0) {
            // Shatter!
            this.coreState = 1;
            this.coreTimer = 0;
            Sound.playSound("impact", true);
            triggerShake(6, 150);
            
            // Spawn 16 shards radial
            for (var j = 0; j < 16; j++) {
                var angle = (j * Math.PI * 2) / 16;
                this.bullets.push(new Bullet({
                    x: cx, y: cy,
                    width: 12, height: 12,
                    useVelocity: true,
                    vx: Math.cos(angle) * 170,
                    vy: Math.sin(angle) * 170,
                    color: "#00FFFF",
                    damVal: this.damVal - 2
                }));
            }
        }
    } else {
        // Shattered phase duration
        if (this.coreTimer >= 0.8) {
            this.coreState = 0;
            this.coreTimer = 0;
            Sound.playSound("ting", true);
        }
    }
    
    // Update bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        if (b.isOutOfBounds([bb[0] - 50, bb[1] - 50, bb[2] + 50, bb[3] + 50])) {
            this.bullets.splice(i, 1);
        }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
ShatteredCorePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    // Touching the core itself during charging phase hurts bad!
    if (this.coreState === 0) {
        if (rectsOverlap(cx - 24, cy - 24, 48, 48, sx, sy, sw, sh)) {
            return this.damVal + 2;
        }
    }
    return BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
};
ShatteredCorePattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    // Draw shards
    BulletPattern.prototype.draw.call(this, ctx);
    
    // Draw Core
    if (this.coreState === 0) {
        // Charging pulsating diamond
        var pulse = 24 + Math.sin(Date.now() / 150) * 6;
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#FF00FF";
        drawCrystalShard(ctx, cx, cy, pulse, Date.now() / 500, "#FF00FF");
        
        // Inner glowing core
        drawCrystalShard(ctx, cx, cy, pulse * 0.5, -Date.now() / 400, "#FFFFFF");
        ctx.restore();
    } else {
        // Shattered ghost ring expanding
        ctx.strokeStyle = "rgba(255, 0, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, this.coreTimer * 120, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
};
ShatteredCorePattern.prototype.isOver = function() {
    return (this.elapsed >= this.duration && this.bullets.length === 0) || this.elapsed >= this.duration + 1.5;
};


// 12. auroraBorealis (Wavy, damaging color ribbons sweep box)
var AuroraBorealisPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
};
AuroraBorealisPattern.prototype = Object.create(BulletPattern.prototype);
AuroraBorealisPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
};
AuroraBorealisPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    BulletPattern.prototype.update.call(this, dt);
};
AuroraBorealisPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    
    // There are 3 ribbons that drift horizontally.
    // Each ribbon has a wave path: x = startX + Math.sin(y/30 + elapsed*5) * 40
    for (var r = 0; r < 3; r++) {
        // Base coordinate shifts across screen
        var baseOffset = 70 + r * 100;
        var startX = bb[0] + ((baseOffset + this.elapsed * 60) % (bb[2] - bb[0] - 40));
        
        var ribbonX = startX + Math.sin(scy / 25 + this.elapsed * 3.5) * 35;
        if (Math.abs(scx - ribbonX) < 18) { // Ribbon thickness
            return this.damVal;
        }
    }
    return 0;
};
AuroraBorealisPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var colors = ["rgba(0, 255, 120, 0.45)", "rgba(138, 43, 226, 0.45)", "rgba(30, 144, 255, 0.45)"];
    
    // Draw ribbons as beautiful gradient paths
    for (var r = 0; r < 3; r++) {
        var baseOffset = 70 + r * 100;
        var startX = bb[0] + ((baseOffset + this.elapsed * 60) % (bb[2] - bb[0] - 40));
        
        ctx.save();
        ctx.strokeStyle = colors[r];
        ctx.lineWidth = 14;
        ctx.shadowBlur = 15;
        ctx.shadowColor = colors[r];
        ctx.beginPath();
        for (var y = bb[1]; y <= bb[3]; y += 5) {
            var rx = startX + Math.sin(y / 25 + this.elapsed * 3.5) * 35;
            if (y === bb[1]) { ctx.moveTo(rx, y); }
            else { ctx.lineTo(rx, y); }
        }
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
};
AuroraBorealisPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};


// 13. spectralRefract (Rotating rainbow bullets spiral out from hub)
var SpectralRefractPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
    this.angle = 0;
};
SpectralRefractPattern.prototype = Object.create(BulletPattern.prototype);
SpectralRefractPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2;
    this.angle = 0;
};
SpectralRefractPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    this.angle += 3.2 * dt;
    
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    // Emit spiral arms
    if (this.spawnTimer >= 0.12 && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        var colors = ["#FF0000", "#FF8C00", "#FFFF00", "#00FF00", "#00FFFF", "#FF00FF"];
        // 4 spiral arms
        for (var arm = 0; arm < 4; arm++) {
            var finalAngle = this.angle + (arm * Math.PI / 2);
            var col = colors[Math.floor(Date.now() / 300) % colors.length];
            this.bullets.push(new Bullet({
                x: cx, y: cy,
                width: 10, height: 10,
                useVelocity: true,
                vx: Math.cos(finalAngle) * 140,
                vy: Math.sin(finalAngle) * 140,
                color: col,
                damVal: this.damVal
            }));
        }
        Sound.playSound("ting", true);
    }
    
    // Update bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        if (b.isOutOfBounds([bb[0] - 50, bb[1] - 50, bb[2] + 50, bb[3] + 50])) {
            this.bullets.splice(i, 1);
        }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
SpectralRefractPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    return BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
};
SpectralRefractPattern.prototype.draw = function(ctx) {
    ctx.save();
    // Spiral connector design
    BulletPattern.prototype.draw.call(this, ctx);
    ctx.restore();
};
SpectralRefractPattern.prototype.isOver = function() {
    return (this.elapsed >= this.duration && this.bullets.length === 0) || this.elapsed >= this.duration + 1.5;
};


// 14. mirrorDimension (Gray mirror heart mimics player, bullets target both)
var MirrorDimensionPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
    this.mirrorPos = { x: 300, y: 300 };
};
MirrorDimensionPattern.prototype = Object.create(BulletPattern.prototype);
MirrorDimensionPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2;
    var bb = Cbbox.getBound();
    this.mirrorPos.x = (bb[0] + bb[2]) / 2;
    this.mirrorPos.y = (bb[1] + bb[3]) / 2;
};
MirrorDimensionPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    // Update Mirror Heart Position (mirrored horizontally and vertically across center)
    if (typeof Soul !== "undefined") {
        var sPos = Soul.getPos();
        var scx = sPos.x + Soul.getWidth()/2;
        var scy = sPos.y + Soul.getHeight()/2;
        
        // Horizontal & Vertical inverse mirroring
        this.mirrorPos.x = cx - (scx - cx) - Soul.getWidth()/2;
        this.mirrorPos.y = cy - (scy - cy) - Soul.getHeight()/2;
    }
    
    // Spawn target bullets directed at BOTH player and mirror heart
    if (this.spawnTimer >= 0.70 && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        
        var rx = Math.random() < 0.5 ? bb[0] + 15 : bb[2] - 25;
        var ry = bb[1] + Math.random() * (bb[3] - bb[1] - 30);
        
        if (typeof Soul !== "undefined") {
            var sPos = Soul.getPos();
            var targetPlayerAngle = Math.atan2(sPos.y - ry, sPos.x - rx);
            var targetMirrorAngle = Math.atan2(this.mirrorPos.y - ry, this.mirrorPos.x - rx);
            
            // Bullet targeting player
            this.bullets.push(new Bullet({
                x: rx, y: ry,
                width: 12, height: 12,
                useVelocity: true,
                vx: Math.cos(targetPlayerAngle) * 140,
                vy: Math.sin(targetPlayerAngle) * 140,
                color: "#FF69B4",
                damVal: this.damVal
            }));
            
            // Bullet targeting mirror heart
            this.bullets.push(new Bullet({
                x: rx, y: ry,
                width: 12, height: 12,
                useVelocity: true,
                vx: Math.cos(targetMirrorAngle) * 140,
                vy: Math.sin(targetMirrorAngle) * 140,
                color: "#778899",
                damVal: this.damVal
            }));
        }
        Sound.playSound("laser", true);
    }
    
    // Update bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        if (b.isOutOfBounds([bb[0] - 50, bb[1] - 50, bb[2] + 50, bb[3] + 50])) {
            this.bullets.splice(i, 1);
        }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
MirrorDimensionPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var dmg = BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
    if (dmg > 0) return dmg;
    
    // Check if player collides with mirror heart itself?
    // Let's make it safe so player can cross mirror, but hitting bullets is key.
    
    return 0;
};
MirrorDimensionPattern.prototype.draw = function(ctx) {
    ctx.save();
    
    // Draw the gray Mirror Heart representation
    if (typeof Soul !== "undefined") {
        ctx.save();
        ctx.fillStyle = "rgba(128, 128, 128, 0.7)";
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#D3D3D3";
        
        // Draw Heart polygon shape
        var mx = this.mirrorPos.x + Soul.getWidth()/2;
        var my = this.mirrorPos.y + Soul.getHeight()/2;
        ctx.beginPath();
        ctx.moveTo(mx, my - 6);
        ctx.bezierCurveTo(mx - 8, my - 14, mx - 16, my - 6, mx, my + 8);
        ctx.bezierCurveTo(mx + 16, my - 6, mx + 8, my - 14, mx, my - 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    
    BulletPattern.prototype.draw.call(this, ctx);
    ctx.restore();
};
MirrorDimensionPattern.prototype.isOver = function() {
    return (this.elapsed >= this.duration && this.bullets.length === 0) || this.elapsed >= this.duration + 1.5;
};


// 15. crystalCataclysm (Giant crystals crash and split on floor)
var CrystalCataclysmPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 10;
    this.spikes = []; // falling giant block {x, y, vy, size}
};
CrystalCataclysmPattern.prototype = Object.create(BulletPattern.prototype);
CrystalCataclysmPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2;
    this.spikes = [];
};
CrystalCataclysmPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 0.9 && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        var rx = bb[0] + 30 + Math.random() * (bb[2] - bb[0] - 60);
        this.spikes.push({
            x: rx,
            y: bb[1] - 40,
            vy: 290,
            size: 32
        });
        Sound.playSound("laser", true);
    }
    
    // Update giant falling blocks
    for (var i = this.spikes.length - 1; i >= 0; i--) {
        var s = this.spikes[i];
        s.y += s.vy * dt;
        
        if (s.y >= bb[3] - s.size) {
            // Explode!
            Sound.playSound("impact", true);
            triggerShake(6, 180);
            
            // Split into 6 diagonal upwards shards
            for (var j = 0; j < 6; j++) {
                var angle = -Math.PI/6 - (j * Math.PI/6);
                var speed = 120 + Math.random() * 80;
                this.bullets.push(new Bullet({
                    x: s.x + s.size/2,
                    y: bb[3] - 15,
                    width: 10, height: 16,
                    useVelocity: true,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: "#E0FFFF",
                    damVal: this.damVal - 3
                }));
            }
            this.spikes.splice(i, 1);
        }
    }
    
    // Update shards
    BulletPattern.prototype.update.call(this, dt);
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        if (this.bullets[i].isOutOfBounds([bb[0] - 50, bb[1] - 50, bb[2] + 50, bb[3] + 50])) {
            this.bullets.splice(i, 1);
        }
    }
};
CrystalCataclysmPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var dmg = BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
    if (dmg > 0) return dmg;
    
    // Hitting falling block is fatal
    for (var i = 0; i < this.spikes.length; i++) {
        var s = this.spikes[i];
        if (rectsOverlap(s.x, s.y, s.size, s.size, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    return 0;
};
CrystalCataclysmPattern.prototype.draw = function(ctx) {
    ctx.save();
    
    // Draw shards
    BulletPattern.prototype.draw.call(this, ctx);
    
    // Draw falling blocks
    for (var i = 0; i < this.spikes.length; i++) {
        var s = this.spikes[i];
        // Giant crystal rendering
        ctx.save();
        ctx.fillStyle = "rgba(0, 240, 255, 0.4)";
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2.0;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00FFFF";
        ctx.fillRect(s.x, s.y, s.size, s.size);
        ctx.strokeRect(s.x, s.y, s.size, s.size);
        
        // Inner diamond pattern
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.beginPath();
        ctx.moveTo(s.x + s.size/2, s.y + 4);
        ctx.lineTo(s.x + s.size - 4, s.y + s.size/2);
        ctx.lineTo(s.x + s.size/2, s.y + s.size - 4);
        ctx.lineTo(s.x + 4, s.y + s.size/2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
};
CrystalCataclysmPattern.prototype.isOver = function() {
    return (this.elapsed >= this.duration && this.spikes.length === 0 && this.bullets.length === 0) || this.elapsed >= this.duration + 1.5;
};


// ============================================================================
// SHARED PATTERNS
// ============================================================================

// 16. prismStrobe (Warning flash, then alternating vertical/horizontal strobe rays)
var PrismStrobePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.warnX = -1;
    this.warnY = -1;
    this.strobeActive = false;
    this.strobeTimer = 0;
    this.axis = 0; // 0 = horizontal, 1 = vertical
};
PrismStrobePattern.prototype = Object.create(BulletPattern.prototype);
PrismStrobePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.warnX = -1;
    this.warnY = -1;
    this.strobeActive = false;
    this.strobeTimer = 0.5; // Starts warn immediately
    this.axis = 0;
};
PrismStrobePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.strobeTimer -= dt;
    var bb = Cbbox.getBound();
    
    if (this.strobeTimer <= 0) {
        if (!this.strobeActive) {
            // Transition from warning to active blast
            this.strobeActive = true;
            this.strobeTimer = 0.35; // Blast duration
            Sound.playSound("impact", true);
            triggerShake(4, 100);
        } else {
            // Turn off blast, toggle axis and set up new warning
            this.strobeActive = false;
            this.strobeTimer = 0.70; // Warning duration
            this.axis = this.axis === 0 ? 1 : 0;
            
            if (this.elapsed < this.duration - 1.0) {
                if (this.axis === 0) {
                    this.warnY = bb[1] + 30 + Math.random() * (bb[3] - bb[1] - 60);
                } else {
                    this.warnX = bb[0] + 30 + Math.random() * (bb[2] - bb[0] - 60);
                }
                Sound.playSound("hit_1", true);
            } else {
                this.warnX = -1;
                this.warnY = -1;
            }
        }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
PrismStrobePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    if (this.strobeActive) {
        if (this.axis === 0 && this.warnY !== -1) {
            // Horizontal blast column
            if (rectsOverlap(bb[0], this.warnY - 15, bb[2] - bb[0], 30, sx, sy, sw, sh)) return this.damVal;
        } else if (this.axis === 1 && this.warnX !== -1) {
            // Vertical blast column
            if (rectsOverlap(this.warnX - 15, bb[1], 30, bb[3] - bb[1], sx, sy, sw, sh)) return this.damVal;
        }
    }
    return 0;
};
PrismStrobePattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    
    if (this.strobeActive) {
        // Draw strobe light beams
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#00FFFF";
        if (this.axis === 0 && this.warnY !== -1) {
            ctx.fillRect(bb[0], this.warnY - 15, bb[2] - bb[0], 30);
        } else if (this.axis === 1 && this.warnX !== -1) {
            ctx.fillRect(this.warnX - 15, bb[1], 30, bb[3] - bb[1]);
        }
    } else {
        // Draw warning dashed bands
        ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
        ctx.lineWidth = 2.0;
        ctx.setLineDash([5, 5]);
        if (this.axis === 0 && this.warnY !== -1) {
            ctx.strokeRect(bb[0], this.warnY - 15, bb[2] - bb[0], 30);
        } else if (this.axis === 1 && this.warnX !== -1) {
            ctx.strokeRect(this.warnX - 15, bb[1], 30, bb[3] - bb[1]);
        }
    }
    ctx.restore();
};
PrismStrobePattern.prototype.isOver = function() {
    return (this.elapsed >= this.duration && !this.strobeActive) || this.elapsed >= this.duration + 1.5;
};


// 17. glassRain (Accelerating vertical needles falling)
var GlassRainPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
};
GlassRainPattern.prototype = Object.create(BulletPattern.prototype);
GlassRainPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2;
};
GlassRainPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    // Spawns thin glass needles that accelerate downwards
    if (this.spawnTimer >= 0.22 && this.elapsed < this.duration - 0.8) {
        this.spawnTimer = 0;
        var rx = bb[0] + 10 + Math.random() * (bb[2] - bb[0] - 20);
        this.bullets.push(new Bullet({
            x: rx, y: bb[1] - 25,
            width: 4, height: 24,
            useVelocity: true,
            vx: 0,
            vy: 80,
            ay: 200, // Gravity acceleration!
            color: "rgba(224, 255, 255, 0.6)", // semi translucent
            damVal: this.damVal
        }));
    }
    
    // Update bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        if (b.isOutOfBounds([bb[0] - 50, bb[1] - 50, bb[2] + 50, bb[3] + 50])) {
            this.bullets.splice(i, 1);
        }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
GlassRainPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    return BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
};
GlassRainPattern.prototype.draw = function(ctx) {
    ctx.save();
    // Custom drawing logic: render needles with cyan glow tips
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x, b.y + b.height);
        ctx.stroke();
        
        ctx.fillStyle = "#00FFFF";
        ctx.fillRect(b.x - 1, b.y + b.height - 3, 3, 3);
        ctx.restore();
    }
    ctx.restore();
};
GlassRainPattern.prototype.isOver = function() {
    return (this.elapsed >= this.duration && this.bullets.length === 0) || this.elapsed >= this.duration + 1.5;
};


// 18. crystallineRay (Targeted rays bounce off walls and leave fading trails)
var CrystallineRayPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
    this.rays = []; // {x, y, vx, vy, trail: []}
};
CrystallineRayPattern.prototype = Object.create(BulletPattern.prototype);
CrystallineRayPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2;
    this.rays = [];
};
CrystallineRayPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 1.2 && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        Sound.playSound("laser", true);
        var rx = bb[0] + Math.random() * (bb[2] - bb[0]);
        var angle = Math.random() * Math.PI * 2;
        this.rays.push({
            x: rx,
            y: bb[1] + 10,
            vx: Math.cos(angle) * 190,
            vy: Math.abs(Math.sin(angle)) * 190, // always down initially
            trail: []
        });
    }
    
    // Update ray positions and trail fading
    for (var i = this.rays.length - 1; i >= 0; i--) {
        var r = this.rays[i];
        
        // Push old coordinate to trail
        r.trail.push({ x: r.x, y: r.y, alpha: 1.0 });
        
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        
        // Bounces
        if (r.x <= bb[0] && r.vx < 0) { r.vx = -r.vx; r.x = bb[0]; Sound.playSound("ting", true); }
        if (r.x >= bb[2] && r.vx > 0) { r.vx = -r.vx; r.x = bb[2]; Sound.playSound("ting", true); }
        if (r.y <= bb[1] && r.vy < 0) { r.vy = -r.vy; r.y = bb[1]; Sound.playSound("ting", true); }
        if (r.y >= bb[3] && r.vy > 0) { r.vy = -r.vy; r.y = bb[3]; Sound.playSound("ting", true); }
        
        // Cap trail length
        if (r.trail.length > 25) r.trail.shift();
    }
    
    // Fade out trails
    for (var i = 0; i < this.rays.length; i++) {
        var r = this.rays[i];
        for (var t = 0; t < r.trail.length; t++) {
            r.trail[t].alpha -= dt * 1.5;
        }
    }
    
    // Clean up finished rays when elapsed is over
    if (this.elapsed >= this.duration) {
        this.rays = [];
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
CrystallineRayPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    // Damage if player intersects with active trail segments
    for (var i = 0; i < this.rays.length; i++) {
        var r = this.rays[i];
        for (var t = 1; t < r.trail.length; t++) {
            var tr = r.trail[t];
            if (tr.alpha > 0.1) {
                var prev = r.trail[t - 1];
                if (lineSegmentCollidesWithRect(prev.x, prev.y, tr.x, tr.y, 4, sx, sy, sw, sh)) {
                    return this.damVal;
                }
            }
        }
    }
    return 0;
};
CrystallineRayPattern.prototype.draw = function(ctx) {
    ctx.save();
    
    for (var i = 0; i < this.rays.length; i++) {
        var r = this.rays[i];
        ctx.save();
        ctx.lineWidth = 3.0;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#E0FFFF";
        
        // Draw segment connectors
        for (var t = 1; t < r.trail.length; t++) {
            var tr = r.trail[t];
            if (tr.alpha > 0) {
                var prev = r.trail[t - 1];
                ctx.strokeStyle = "rgba(0, 240, 255, " + tr.alpha.toFixed(2) + ")";
                ctx.beginPath();
                ctx.moveTo(prev.x, prev.y);
                ctx.lineTo(tr.x, tr.y);
                ctx.stroke();
            }
        }
        
        // Draw glowing ray head
        drawCrystalShard(ctx, r.x, r.y, 8, Math.atan2(r.vy, r.vx) + Math.PI/2, "#FFFFFF");
        ctx.restore();
    }
    
    BulletPattern.prototype.draw.call(this, ctx);
    ctx.restore();
};
CrystallineRayPattern.prototype.isOver = function() {
    return (this.elapsed >= this.duration && this.rays.length === 0) || this.elapsed >= this.duration + 1.5;
};
