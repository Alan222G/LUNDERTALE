// alienPatterns.js — Unified Pattern Library for Alien (Xenomorph)
// Contains 15 custom, unique biomechanical patterns for the Alien Boss phases.
// No circle/wave attacks, entirely fresh mechanics, highly detailed visuals.

// ============================================================================
// HELPERS
// ============================================================================
function drawAcidGlow(ctx, x, y, size, color) {
    ctx.save();
    ctx.shadowBlur = size * 1.5;
    ctx.shadowColor = color || "#39FF14"; // Neon green
    ctx.fillStyle = color || "#39FF14";
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// ============================================================================
// 1. alienAcidSpit (Acid Spit)
// ============================================================================
var AlienAcidSpitPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
    this.acidBlobs = []; // {x, y, vx, vy, size}
};
AlienAcidSpitPattern.prototype = Object.create(BulletPattern.prototype);
AlienAcidSpitPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.1;
    this.acidBlobs = [];
};
AlienAcidSpitPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();

    if (this.spawnTimer >= 0.55 && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        Sound.playSound("hit_1", true);
        // Spit from top-center towards player soul position or random
        var targetX = 370;
        if (typeof Soul !== "undefined") {
            var sPos = Soul.getPos ? Soul.getPos() : {x: 370};
            targetX = sPos.x;
        }
        var startX = bb[0] + (bb[2] - bb[0])/2;
        var startY = bb[1] - 15;
        var dx = targetX - startX;
        var dy = (bb[3] - 20) - startY;
        var dist = Math.sqrt(dx*dx + dy*dy);
        var speed = 180;
        this.acidBlobs.push({
            x: startX,
            y: startY,
            vx: (dx / dist) * speed + (Math.random() - 0.5) * 30,
            vy: (dy / dist) * speed,
            size: 6 + Math.random() * 5
        });
    }

    // Update acid blobs
    for (var i = this.acidBlobs.length - 1; i >= 0; i--) {
        var ab = this.acidBlobs[i];
        ab.x += ab.vx * dt;
        ab.y += ab.vy * dt;
        ab.vy += 120 * dt; // Gravity

        // Splat on ground
        if (ab.y >= bb[3] - ab.size) {
            Sound.playSound("damage", true);
            // Splat particles
            for (var p = 0; p < 3; p++) {
                var shard = new Bullet({
                    x: ab.x,
                    y: bb[3] - 6,
                    width: 4,
                    height: 4,
                    speed: 0,
                    damVal: this.damVal - 2,
                    color: "#39FF14",
                    vx: (Math.random() - 0.5) * 80,
                    vy: -40 - Math.random() * 60,
                    useVelocity: true
                });
                this.bullets.push(shard);
            }
            this.acidBlobs.splice(i, 1);
        }
    }

    // Update normal bullets (shards)
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.vy += 100 * dt; // gravity for splash
        b.progressMovement(dt);
        if (b.isOutOfBounds(bb)) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
AlienAcidSpitPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.acidBlobs.length; i++) {
        var ab = this.acidBlobs[i];
        if (rectsOverlap(ab.x - ab.size, ab.y - ab.size, ab.size*2, ab.size*2, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
            return this.damVal - 2;
        }
    }
    return 0;
};
AlienAcidSpitPattern.prototype.draw = function(ctx) {
    ctx.save();
    // Draw blobs
    for (var i = 0; i < this.acidBlobs.length; i++) {
        var ab = this.acidBlobs[i];
        drawAcidGlow(ctx, ab.x, ab.y, ab.size, "#39FF14");
    }
    // Draw particles
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        ctx.fillStyle = "#ADFF2F"; // Greenish yellow
        ctx.fillRect(b.x, b.y, b.width, b.height);
    }
    ctx.restore();
};
AlienAcidSpitPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0 && this.acidBlobs.length === 0;
};

// ============================================================================
// 2. alienTailWhip (Tail Whip)
// ============================================================================
var AlienTailWhipPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.whipTimer = 0;
    this.damVal = config.damVal || 9;
    this.whips = []; // { side: 'L'|'R', y, warningTime, activeTime, struck: boolean }
};
AlienTailWhipPattern.prototype = Object.create(BulletPattern.prototype);
AlienTailWhipPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.whipTimer = 0.3;
    this.whips = [];
};
AlienTailWhipPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.whipTimer += dt;
    var bb = Cbbox.getBound();

    if (this.whipTimer >= 0.9 && this.elapsed < this.duration - 1.0) {
        this.whipTimer = 0;
        var side = Math.random() < 0.5 ? 'L' : 'R';
        var randY = bb[1] + 20 + Math.random() * (bb[3] - bb[1] - 40);
        this.whips.push({
            side: side,
            y: randY,
            warningTime: 0.5,
            activeTime: 0.25,
            struck: false
        });
    }

    for (var i = this.whips.length - 1; i >= 0; i--) {
        var w = this.whips[i];
        if (w.warningTime > 0) {
            w.warningTime -= dt;
            if (w.warningTime <= 0) {
                w.struck = true;
                Sound.playSound("impact", true);
            }
        } else if (w.activeTime > 0) {
            w.activeTime -= dt;
            if (w.activeTime <= 0) {
                this.whips.splice(i, 1);
            }
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
AlienTailWhipPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    for (var i = 0; i < this.whips.length; i++) {
        var w = this.whips[i];
        if (w.struck && w.activeTime > 0) {
            // Horizontal tail strike spanning the box!
            var tx = w.side === 'L' ? bb[0] : bb[0];
            var tw = bb[2] - bb[0];
            if (rectsOverlap(tx, w.y - 6, tw, 12, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }
    return 0;
};
AlienTailWhipPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    for (var i = 0; i < this.whips.length; i++) {
        var w = this.whips[i];
        if (w.warningTime > 0) {
            // Danger line indicator
            ctx.strokeStyle = "rgba(255, 0, 0, 0.4)";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(bb[0], w.y);
            ctx.lineTo(bb[2], w.y);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (w.activeTime > 0) {
            // Draw a high-quality ribbed tail strike!
            ctx.strokeStyle = "#4D4D4D";
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(bb[0], w.y);
            ctx.lineTo(bb[2], w.y);
            ctx.stroke();

            // Bone white segmented spines along tail
            ctx.strokeStyle = "#EAEAEA";
            ctx.lineWidth = 2;
            for (var x = bb[0] + 10; x < bb[2]; x += 15) {
                ctx.beginPath();
                ctx.moveTo(x, w.y - 5);
                ctx.lineTo(x, w.y + 5);
                ctx.stroke();
            }

            // Spear tip
            ctx.fillStyle = "#EAEAEA";
            var tipX = w.side === 'L' ? bb[2] - 12 : bb[0];
            ctx.beginPath();
            ctx.moveTo(tipX, w.y - 6);
            ctx.lineTo(w.side === 'L' ? bb[2] : bb[0] - 12, w.y);
            ctx.lineTo(tipX, w.y + 6);
            ctx.closePath();
            ctx.fill();
        }
    }
    ctx.restore();
};
AlienTailWhipPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.whips.length === 0;
};

// ============================================================================
// 3. alienInnerJaw (Inner Jaw Strike)
// ============================================================================
var AlienInnerJawPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.strikeTimer = 0;
    this.damVal = config.damVal || 12;
    this.jaws = []; // { x, warningTime, activeTime, extendY, state: 0 (warn)|1 (shoot)|2 (retract) }
};
AlienInnerJawPattern.prototype = Object.create(BulletPattern.prototype);
AlienInnerJawPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.strikeTimer = 0.2;
    this.jaws = [];
};
AlienInnerJawPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.strikeTimer += dt;
    var bb = Cbbox.getBound();

    if (this.strikeTimer >= 1.2 && this.elapsed < this.duration - 1.2) {
        this.strikeTimer = 0;
        // Lock on to player position
        var lockX = bb[0] + (bb[2] - bb[0])/2;
        if (typeof Soul !== "undefined") {
            var sPos = Soul.getPos ? Soul.getPos() : {x: lockX};
            lockX = sPos.x;
        }
        this.jaws.push({
            x: lockX,
            warningTime: 0.65,
            activeTime: 0.35,
            extendY: 0,
            state: 0
        });
    }

    for (var i = this.jaws.length - 1; i >= 0; i--) {
        var j = this.jaws[i];
        if (j.state === 0) {
            j.warningTime -= dt;
            if (j.warningTime <= 0) {
                j.state = 1;
                Sound.playSound("impact", true);
            }
        } else if (j.state === 1) {
            j.activeTime -= dt;
            j.extendY = Math.min(bb[3] - bb[1], j.extendY + (bb[3] - bb[1]) * dt * 5.0);
            if (j.activeTime <= 0) {
                j.state = 2;
            }
        } else if (j.state === 2) {
            j.extendY -= (bb[3] - bb[1]) * dt * 3.5;
            if (j.extendY <= 0) {
                this.jaws.splice(i, 1);
            }
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
AlienInnerJawPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    for (var i = 0; i < this.jaws.length; i++) {
        var j = this.jaws[i];
        if (j.state === 1) {
            if (rectsOverlap(j.x - 14, bb[1], 28, j.extendY, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }
    return 0;
};
AlienInnerJawPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    for (var i = 0; i < this.jaws.length; i++) {
        var j = this.jaws[i];
        if (j.state === 0) {
            // Neon Green targeting lasers
            ctx.strokeStyle = "rgba(57, 255, 20, 0.5)";
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 4]);
            ctx.beginPath();
            ctx.moveTo(j.x, bb[1]);
            ctx.lineTo(j.x, bb[3]);
            ctx.stroke();
            ctx.setLineDash([]);
        } else {
            // Draw a massive metallic inner jaw sliding down
            var jy = bb[1] + j.extendY;
            ctx.fillStyle = "#2a2a2a"; // Main tube
            ctx.fillRect(j.x - 8, bb[1], 16, j.extendY);

            ctx.strokeStyle = "#555";
            ctx.lineWidth = 1.5;
            for (var ry = bb[1] + 10; ry < jy; ry += 12) {
                ctx.beginPath();
                ctx.moveTo(j.x - 8, ry);
                ctx.lineTo(j.x + 8, ry);
                ctx.stroke();
            }

            // Chrome Teeth on head
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.moveTo(j.x - 12, jy);
            ctx.lineTo(j.x - 4, jy + 16);
            ctx.lineTo(j.x, jy);
            ctx.lineTo(j.x + 4, jy + 16);
            ctx.lineTo(j.x + 12, jy);
            ctx.lineTo(j.x - 12, jy);
            ctx.closePath();
            ctx.fill();
        }
    }
    ctx.restore();
};
AlienInnerJawPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.jaws.length === 0;
};

// ============================================================================
// 4. alienClawSlash (Claw Slash)
// ============================================================================
var AlienClawSlashPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.slashTimer = 0;
    this.damVal = config.damVal || 9;
    this.slashes = []; // { orientation: 'H'|'V'|'D', coord, warning, active, ticks }
};
AlienClawSlashPattern.prototype = Object.create(BulletPattern.prototype);
AlienClawSlashPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.slashTimer = 0.3;
    this.slashes = [];
};
AlienClawSlashPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.slashTimer += dt;
    var bb = Cbbox.getBound();

    if (this.slashTimer >= 0.75 && this.elapsed < this.duration - 1.0) {
        this.slashTimer = 0;
        var orient = Math.random() < 0.5 ? 'H' : 'V';
        var coord = 0;
        if (orient === 'H') {
            coord = bb[1] + 20 + Math.random() * (bb[3] - bb[1] - 40);
        } else {
            coord = bb[0] + 20 + Math.random() * (bb[2] - bb[0] - 40);
        }
        this.slashes.push({
            orientation: orient,
            coord: coord,
            warning: 0.45,
            active: 0.2,
            animFrame: 0
        });
    }

    for (var i = this.slashes.length - 1; i >= 0; i--) {
        var s = this.slashes[i];
        if (s.warning > 0) {
            s.warning -= dt;
            if (s.warning <= 0) {
                Sound.playSound("hit_2_crit", true);
            }
        } else {
            s.active -= dt;
            s.animFrame += dt * 15;
            if (s.active <= 0) {
                this.slashes.splice(i, 1);
            }
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
AlienClawSlashPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    for (var i = 0; i < this.slashes.length; i++) {
        var s = this.slashes[i];
        if (s.warning <= 0 && s.active > 0) {
            if (s.orientation === 'H') {
                if (rectsOverlap(bb[0], s.coord - 12, bb[2] - bb[0], 24, sx, sy, sw, sh)) {
                    return this.damVal;
                }
            } else {
                if (rectsOverlap(s.coord - 12, bb[1], 24, bb[3] - bb[1], sx, sy, sw, sh)) {
                    return this.damVal;
                }
            }
        }
    }
    return 0;
};
AlienClawSlashPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    for (var i = 0; i < this.slashes.length; i++) {
        var s = this.slashes[i];
        if (s.warning > 0) {
            ctx.strokeStyle = "rgba(0, 230, 118, 0.45)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            if (s.orientation === 'H') {
                ctx.moveTo(bb[0], s.coord);
                ctx.lineTo(bb[2], s.coord);
            } else {
                ctx.moveTo(s.coord, bb[1]);
                ctx.lineTo(s.coord, bb[3]);
            }
            ctx.stroke();
        } else {
            // Draw multiple parallel neon claws ripping the screen!
            ctx.strokeStyle = "#39FF14"; // Acid claw neon
            ctx.lineWidth = 3;
            var offset = Math.sin(s.animFrame) * 4;
            
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#39FF14";
            
            for (var c = -10; c <= 10; c += 10) {
                ctx.beginPath();
                if (s.orientation === 'H') {
                    ctx.moveTo(bb[0], s.coord + c + offset);
                    ctx.lineTo(bb[2], s.coord + c - offset);
                } else {
                    ctx.moveTo(s.coord + c + offset, bb[1]);
                    ctx.lineTo(s.coord + c - offset, bb[3]);
                }
                ctx.stroke();
            }
            ctx.restore();
        }
    }
    ctx.restore();
};
AlienClawSlashPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.slashes.length === 0;
};

// ============================================================================
// 5. alienWallCrawl (Wall Crawl)
// ============================================================================
var AlienWallCrawlPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
    this.crawlers = []; // { side, y, progress, leaping, vx, vy, size }
};
AlienWallCrawlPattern.prototype = Object.create(BulletPattern.prototype);
AlienWallCrawlPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2;
    this.crawlers = [];
};
AlienWallCrawlPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();

    if (this.spawnTimer >= 0.85 && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        var side = Math.random() < 0.5 ? 'L' : 'R';
        var startY = bb[1] + 10 + Math.random() * (bb[3] - bb[1] - 40);
        this.crawlers.push({
            side: side,
            x: side === 'L' ? bb[0] + 6 : bb[2] - 18,
            y: startY,
            progress: 0,
            leaping: false,
            vx: 0,
            vy: 0,
            size: 12
        });
    }

    for (var i = this.crawlers.length - 1; i >= 0; i--) {
        var c = this.crawlers[i];
        if (!c.leaping) {
            c.progress += dt;
            c.y += Math.sin(c.progress * 4) * 20 * dt; // Crawling wave
            if (c.progress >= 0.8) {
                c.leaping = true;
                Sound.playSound("flash", true);
                var speed = 190;
                c.vx = c.side === 'L' ? speed : -speed;
                c.vy = (Math.random() - 0.5) * 60;
            }
        } else {
            c.x += c.vx * dt;
            c.y += c.vy * dt;
            if (c.x < bb[0] || c.x > bb[2]) {
                this.crawlers.splice(i, 1);
            }
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
AlienWallCrawlPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.crawlers.length; i++) {
        var c = this.crawlers[i];
        if (rectsOverlap(c.x, c.y, c.size, c.size, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    return 0;
};
AlienWallCrawlPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.crawlers.length; i++) {
        var c = this.crawlers[i];
        // Draw a green glowing xenomorph spider-like silhouette!
        ctx.fillStyle = c.leaping ? "#00E676" : "#4D4D4D";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#39FF14";
        ctx.fillRect(c.x, c.y, c.size, c.size);

        // Biomechanical tail trailing
        ctx.strokeStyle = "#ADFF2F";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        var tx = c.leaping ? (c.vx > 0 ? c.x - 8 : c.x + 20) : (c.side === 'L' ? c.x - 6 : c.x + 18);
        ctx.moveTo(c.x + 6, c.y + 6);
        ctx.quadraticCurveTo(tx, c.y - 4, tx, c.y + 6);
        ctx.stroke();
    }
    ctx.restore();
};
AlienWallCrawlPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.crawlers.length === 0;
};

// ============================================================================
// 6. alienFacehugger (Facehugger Leap)
// ============================================================================
var AlienFacehuggerPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 7;
    this.eggs = []; // { x, y, hatchTimer, hatched, leaps: {x, y, vx, vy, size}[] }
};
AlienFacehuggerPattern.prototype = Object.create(BulletPattern.prototype);
AlienFacehuggerPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.3;
    this.eggs = [];
};
AlienFacehuggerPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();

    if (this.spawnTimer >= 1.1 && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        var randX = bb[0] + 25 + Math.random() * (bb[2] - bb[0] - 50);
        this.eggs.push({
            x: randX,
            y: bb[3] - 22,
            hatchTimer: 0.8,
            hatched: false,
            leapers: []
        });
    }

    for (var i = this.eggs.length - 1; i >= 0; i--) {
        var egg = this.eggs[i];
        if (!egg.hatched) {
            egg.hatchTimer -= dt;
            if (egg.hatchTimer <= 0) {
                egg.hatched = true;
                Sound.playSound("damage", true); // Egg popping
                // Hatch a jumping Facehugger!
                egg.leagers = [{
                    x: egg.x,
                    y: egg.y - 5,
                    vx: (Math.random() - 0.5) * 80,
                    vy: -150 - Math.random() * 50,
                    size: 8
                }];
            }
        } else {
            // Update leapers
            for (var l = egg.leagers.length - 1; l >= 0; l--) {
                var lh = egg.leagers[l];
                lh.x += lh.vx * dt;
                lh.y += lh.vy * dt;
                lh.vy += 180 * dt; // Gravity

                if (lh.y >= bb[3] - 10) {
                    // Died on impact/ground
                    egg.leagers.splice(l, 1);
                }
            }
            if (egg.leagers.length === 0) {
                this.eggs.splice(i, 1);
            }
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
AlienFacehuggerPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.eggs.length; i++) {
        var egg = this.eggs[i];
        if (egg.hatched) {
            for (var l = 0; l < egg.leagers.length; l++) {
                var lh = egg.leagers[l];
                if (rectsOverlap(lh.x - 4, lh.y - 4, 8, 8, sx, sy, sw, sh)) {
                    return this.damVal;
                }
            }
        }
    }
    return 0;
};
AlienFacehuggerPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.eggs.length; i++) {
        var egg = this.eggs[i];
        if (!egg.hatched) {
            // Draw a green-brown ribbed Egg capsule
            ctx.fillStyle = "#5c6b4e";
            ctx.beginPath();
            ctx.ellipse(egg.x, egg.y + 10, 10, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            // Hatching lines
            ctx.strokeStyle = "#808f73";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(egg.x, egg.y - 2);
            ctx.lineTo(egg.x, egg.y + 8);
            ctx.stroke();
        } else {
            // Draw the hatched Facehugger leaping (bone colored with finger-like legs)
            for (var l = 0; l < egg.leagers.length; l++) {
                var lh = egg.leagers[l];
                ctx.fillStyle = "#E4CD96"; // Bone brown
                ctx.beginPath();
                ctx.arc(lh.x, lh.y, 4, 0, Math.PI * 2);
                ctx.fill();
                // Sprawled legs
                ctx.strokeStyle = "#E4CD96";
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(lh.x - 6, lh.y - 4); ctx.lineTo(lh.x + 6, lh.y + 4);
                ctx.moveTo(lh.x + 6, lh.y - 4); ctx.lineTo(lh.x - 6, lh.y + 4);
                ctx.stroke();
                // Tail
                ctx.beginPath();
                ctx.moveTo(lh.x, lh.y + 4);
                ctx.quadraticCurveTo(lh.x - 4, lh.y + 12, lh.x - 2, lh.y + 16);
                ctx.stroke();
            }
        }
    }
    ctx.restore();
};
AlienFacehuggerPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.eggs.length === 0;
};

// ============================================================================
// 7. alienTailSpear (Tail Spear)
// ============================================================================
var AlienTailSpearPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.spearTimer = 0;
    this.damVal = config.damVal || 10;
    this.spears = []; // { tx, ty, warning, progress, bx, by, struck }
};
AlienTailSpearPattern.prototype = Object.create(BulletPattern.prototype);
AlienTailSpearPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spearTimer = 0.2;
    this.spears = [];
};
AlienTailSpearPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spearTimer += dt;
    var bb = Cbbox.getBound();

    if (this.spearTimer >= 1.0 && this.elapsed < this.duration - 1.0) {
        this.spearTimer = 0;
        // Lock on to player position or a random point
        var tx = bb[0] + (bb[2] - bb[0])/2;
        var ty = bb[1] + (bb[3] - bb[1])/2;
        if (typeof Soul !== "undefined") {
            var sPos = Soul.getPos ? Soul.getPos() : {x: tx, y: ty};
            tx = sPos.x;
            ty = sPos.y;
        }
        this.spears.push({
            tx: tx,
            ty: ty,
            bx: bb[0] + (bb[2] - bb[0])/2, // Erupt from top-center
            by: bb[1] - 10,
            warning: 0.6,
            progress: 0,
            struck: false
        });
    }

    for (var i = this.spears.length - 1; i >= 0; i--) {
        var s = this.spears[i];
        if (s.warning > 0) {
            s.warning -= dt;
            if (s.warning <= 0) {
                s.struck = true;
                Sound.playSound("hit_2", true);
            }
        } else {
            s.progress += dt * 4.0; // Quick spear strike
            if (s.progress >= 1.4) {
                this.spears.splice(i, 1);
            }
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
AlienTailSpearPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.spears.length; i++) {
        var s = this.spears[i];
        if (s.struck) {
            var dx = s.tx - s.bx;
            var dy = s.ty - s.by;
            var curX = s.bx + dx * Math.min(1.0, s.progress);
            var curY = s.by + dy * Math.min(1.0, s.progress);
            if (s.progress < 1.0) {
                // Line overlap check
                if (rectsOverlap(curX - 6, curY - 6, 12, 12, sx, sy, sw, sh)) {
                    return this.damVal;
                }
            }
        }
    }
    return 0;
};
AlienTailSpearPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.spears.length; i++) {
        var s = this.spears[i];
        if (s.warning > 0) {
            // Precise laser dot targeting the soul
            ctx.fillStyle = "rgba(255,0,0,0.55)";
            ctx.beginPath();
            ctx.arc(s.tx, s.ty, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "rgba(255,0,0,0.2)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(s.bx, s.by);
            ctx.lineTo(s.tx, s.ty);
            ctx.stroke();
        } else {
            // Draw extended tail spear!
            var dx = s.tx - s.bx;
            var dy = s.ty - s.by;
            var curX = s.bx + dx * Math.min(1.0, s.progress);
            var curY = s.by + dy * Math.min(1.0, s.progress);

            ctx.strokeStyle = "#3a3a3a";
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(s.bx, s.by);
            ctx.lineTo(curX, curY);
            ctx.stroke();

            // Segmented markings
            ctx.strokeStyle = "#EAEAEA";
            ctx.lineWidth = 1.5;
            var segments = 10;
            for (var k = 0; k <= segments; k++) {
                var pVal = (k / segments) * Math.min(1.0, s.progress);
                var sx = s.bx + dx * pVal;
                var sy = s.by + dy * pVal;
                ctx.beginPath();
                ctx.arc(sx, sy, 3, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Spearhead
            ctx.fillStyle = "#EAEAEA";
            var angle = Math.atan2(dy, dx);
            ctx.save();
            ctx.translate(curX, curY);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(-10, -5);
            ctx.lineTo(6, 0);
            ctx.lineTo(-10, 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
    ctx.restore();
};
AlienTailSpearPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.spears.length === 0;
};

// ============================================================================
// 8. alienAcidPuddle (Acid Puddles)
// ============================================================================
var AlienAcidPuddlePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 9;
    this.puddles = []; // { x, w, maxW, timer }
};
AlienAcidPuddlePattern.prototype = Object.create(BulletPattern.prototype);
AlienAcidPuddlePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.1;
    this.puddles = [];
};
AlienAcidPuddlePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();

    // 1. Spawning puddles that grow
    if (this.puddles.length < 2 && this.elapsed < this.duration - 1.5 && this.spawnTimer >= 1.0) {
        this.spawnTimer = 0;
        var pw = 40 + Math.random() * 40;
        var px = bb[0] + 10 + Math.random() * (bb[2] - bb[0] - pw - 20);
        this.puddles.push({
            x: px,
            w: 4,
            maxW: pw,
            timer: 4.5
        });
    }

    for (var i = this.puddles.length - 1; i >= 0; i--) {
        var p = this.puddles[i];
        p.w = Math.min(p.maxW, p.w + dt * 110);
        p.timer -= dt;
        if (p.timer <= 0) {
            this.puddles.splice(i, 1);
        }
    }

    // 2. Falling ceiling acid drops
    if (Math.random() < 0.25) {
        var rx = bb[0] + 10 + Math.random() * (bb[2] - bb[0] - 20);
        var rain = new Bullet({
            x: rx,
            y: bb[1],
            width: 4,
            height: 10,
            speed: 130 + Math.random() * 50,
            damVal: this.damVal - 2,
            color: "#39FF14"
        });
        this.bullets.push(rain);
    }

    // Update normal rain drops
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        if (b.y >= bb[3] - 10) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
AlienAcidPuddlePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    // Check floor puddles
    for (var i = 0; i < this.puddles.length; i++) {
        var p = this.puddles[i];
        if (rectsOverlap(p.x, bb[3] - 10, p.w, 10, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    // Check rain drops
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
            return this.damVal - 2;
        }
    }
    return 0;
};
AlienAcidPuddlePattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    // Draw neon acid puddles
    for (var i = 0; i < this.puddles.length; i++) {
        var p = this.puddles[i];
        ctx.fillStyle = "rgba(57, 255, 20, 0.75)";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#39FF14";
        ctx.beginPath();
        ctx.ellipse(p.x + p.w/2, bb[3] - 4, p.w/2, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Little bubbles rising
        ctx.fillStyle = "#ADFF2F";
        for (var b = 0; b < 3; b++) {
            var bx = p.x + 5 + (b * p.w / 3.5);
            var by = bb[3] - 8 - ((Date.now() / 250 + b) % 2) * 5;
            ctx.beginPath();
            ctx.arc(bx, by, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw rain drops
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        ctx.fillStyle = "#39FF14";
        ctx.fillRect(b.x, b.y, b.width, b.height);
    }
    ctx.restore();
};
AlienAcidPuddlePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.puddles.length === 0 && this.bullets.length === 0;
};

// ============================================================================
// 9. alienCeilingDrop (Ceiling Spikes)
// ============================================================================
var AlienCeilingDropPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
};
AlienCeilingDropPattern.prototype = Object.create(BulletPattern.prototype);
AlienCeilingDropPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2;
};
AlienCeilingDropPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();

    if (this.spawnTimer >= 0.35 && this.elapsed < this.duration - 0.8) {
        this.spawnTimer = 0;
        var rx = bb[0] + 15 + Math.random() * (bb[2] - bb[0] - 30);
        // Falling spikes
        var spike = new Bullet({
            x: rx - 3,
            y: bb[1] - 15,
            width: 6,
            height: 18,
            speed: 160 + Math.random() * 60,
            damVal: this.damVal,
            color: "#666" // Dark metal spines
        });
        this.bullets.push(spike);
        Sound.playSound("text", true);
    }

    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        if (b.y >= bb[3] - 18) {
            b.active = false;
            this.bullets.splice(i, 1);
            Sound.playSound("impact", true);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
AlienCeilingDropPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        // Draw sharp biomechanical metallic spike
        ctx.fillStyle = "#A9A9A9";
        ctx.strokeStyle = "#3a3a3a";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + b.width/2, b.y + b.height);
        ctx.lineTo(b.x + b.width, b.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();
};
AlienCeilingDropPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// ============================================================================
// 10. alienTailSweep (Tail Sweep)
// ============================================================================
var AlienTailSweepPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.sweepTimer = 0;
    this.damVal = config.damVal || 9;
    this.sweeps = []; // { warning, active, direction: 1|-1 }
};
AlienTailSweepPattern.prototype = Object.create(BulletPattern.prototype);
AlienTailSweepPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.sweepTimer = 0.4;
    this.sweeps = [];
};
AlienTailSweepPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.sweepTimer += dt;
    var bb = Cbbox.getBound();

    if (this.sweepTimer >= 1.4 && this.elapsed < this.duration - 1.0) {
        this.sweepTimer = 0;
        this.sweeps.push({
            warning: 0.6,
            active: 0.5,
            direction: Math.random() < 0.5 ? 1 : -1
        });
    }

    for (var i = this.sweeps.length - 1; i >= 0; i--) {
        var sw = this.sweeps[i];
        if (sw.warning > 0) {
            sw.warning -= dt;
            if (sw.warning <= 0) {
                Sound.playSound("hit_2", true);
            }
        } else {
            sw.active -= dt;
            if (sw.active <= 0) {
                this.sweeps.splice(i, 1);
            }
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
AlienTailSweepPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    for (var i = 0; i < this.sweeps.length; i++) {
        var sw = this.sweeps[i];
        if (sw.warning <= 0 && sw.active > 0) {
            // Sweeps across bottom 24 pixels of the battlebox
            if (rectsOverlap(bb[0], bb[3] - 22, bb[2] - bb[0], 22, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }
    return 0;
};
AlienTailSweepPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    for (var i = 0; i < this.sweeps.length; i++) {
        var sw = this.sweeps[i];
        if (sw.warning > 0) {
            // Red warning banner at bottom
            ctx.fillStyle = "rgba(255, 0, 0, 0.18)";
            ctx.fillRect(bb[0], bb[3] - 22, bb[2] - bb[0], 22);
            ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(bb[0], bb[3] - 22);
            ctx.lineTo(bb[2], bb[3] - 22);
            ctx.stroke();
        } else {
            // Draw sweeping biomechanical scythe tail!
            ctx.fillStyle = "#333333";
            ctx.strokeStyle = "#EAEAEA";
            ctx.lineWidth = 2;

            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#ADFF2F";

            var progress = 1.0 - (sw.active / 0.5); // 0 to 1
            var sweepX = sw.direction === 1 ? bb[0] + progress * (bb[2] - bb[0]) : bb[2] - progress * (bb[2] - bb[0]);
            
            ctx.beginPath();
            ctx.ellipse(sweepX, bb[3] - 11, 24, 11, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Spike details
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.moveTo(sweepX + (sw.direction * 12), bb[3] - 18);
            ctx.lineTo(sweepX + (sw.direction * 35), bb[3] - 11);
            ctx.lineTo(sweepX + (sw.direction * 12), bb[3] - 4);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }
    ctx.restore();
};
AlienTailSweepPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.sweeps.length === 0;
};

// ============================================================================
// 11. alienHiveSpike (Hive Spikes)
// ============================================================================
var AlienHiveSpikePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.spikeTimer = 0;
    this.damVal = config.damVal || 10;
    this.spikes = []; // { x, warning, active, height, maxH }
};
AlienHiveSpikePattern.prototype = Object.create(BulletPattern.prototype);
AlienHiveSpikePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spikeTimer = 0.3;
    this.spikes = [];
};
AlienHiveSpikePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spikeTimer += dt;
    var bb = Cbbox.getBound();

    if (this.spikeTimer >= 1.1 && this.elapsed < this.duration - 1.2) {
        this.spikeTimer = 0;
        // Spawn alternating grid of 3 spikes
        var cols = 3;
        var colW = (bb[2] - bb[0]) / cols;
        var startOffset = Math.random() < 0.5 ? 0 : 1;
        for (var c = startOffset; c < cols; c += 2) {
            var sx = bb[0] + c * colW + colW/2;
            this.spikes.push({
                x: sx,
                w: colW - 10,
                warning: 0.6,
                active: 0.45,
                height: 0,
                maxH: 90 + Math.random() * 30
            });
        }
    }

    for (var i = this.spikes.length - 1; i >= 0; i--) {
        var s = this.spikes[i];
        if (s.warning > 0) {
            s.warning -= dt;
            if (s.warning <= 0) {
                Sound.playSound("impact", true);
            }
        } else {
            s.active -= dt;
            s.height = Math.min(s.maxH, s.height + dt * 400);
            if (s.active <= 0) {
                s.height -= dt * 300;
                if (s.height <= 0) {
                    this.spikes.splice(i, 1);
                }
            }
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
AlienHiveSpikePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    for (var i = 0; i < this.spikes.length; i++) {
        var s = this.spikes[i];
        if (s.warning <= 0) {
            if (rectsOverlap(s.x - s.w/2, bb[3] - s.height, s.w, s.height, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }
    return 0;
};
AlienHiveSpikePattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    for (var i = 0; i < this.spikes.length; i++) {
        var s = this.spikes[i];
        if (s.warning > 0) {
            ctx.fillStyle = "rgba(0, 230, 118, 0.15)";
            ctx.fillRect(s.x - s.w/2, bb[3] - s.maxH, s.w, s.maxH);
            ctx.strokeStyle = "rgba(0, 230, 118, 0.4)";
            ctx.lineWidth = 1;
            ctx.strokeRect(s.x - s.w/2, bb[3] - s.maxH, s.w, s.maxH);
        } else {
            // Draw biomechanical resin structures emerging!
            ctx.fillStyle = "#2D3E2B"; // Biomechanical dark green resin
            ctx.strokeStyle = "#5C7E58";
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.moveTo(s.x - s.w/2, bb[3]);
            ctx.quadraticCurveTo(s.x - s.w/4, bb[3] - s.height * 0.7, s.x, bb[3] - s.height);
            ctx.quadraticCurveTo(s.x + s.w/4, bb[3] - s.height * 0.7, s.x + s.w/2, bb[3]);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Ribbed lines inside spikes
            ctx.strokeStyle = "#7CA977";
            ctx.lineWidth = 1;
            for (var h = 10; h < s.height; h += 15) {
                var wAtH = s.w/2 * (1.0 - h/s.maxH);
                ctx.beginPath();
                ctx.moveTo(s.x - wAtH, bb[3] - h);
                ctx.lineTo(s.x + wAtH, bb[3] - h);
                ctx.stroke();
            }
        }
    }
    ctx.restore();
};
AlienHiveSpikePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.spikes.length === 0;
};

// ============================================================================
// 12. alienChestburster (Chestburster Leap)
// ============================================================================
var AlienChestbursterPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
    this.bursters = []; // { side, x, y, warning, active, speed }
};
AlienChestbursterPattern.prototype = Object.create(BulletPattern.prototype);
AlienChestbursterPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.3;
    this.bursters = [];
};
AlienChestbursterPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();

    if (this.spawnTimer >= 0.8 && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        var side = Math.random() < 0.5 ? 'L' : 'R';
        var startY = bb[1] + 15 + Math.random() * (bb[3] - bb[1] - 40);
        this.bursters.push({
            side: side,
            x: side === 'L' ? bb[0] + 5 : bb[2] - 25,
            y: startY,
            warning: 0.5,
            active: 0.8,
            speed: 210
        });
    }

    for (var i = this.bursters.length - 1; i >= 0; i--) {
        var b = this.bursters[i];
        if (b.warning > 0) {
            b.warning -= dt;
            if (b.warning <= 0) {
                Sound.playSound("hit_1_crit", true);
            }
        } else {
            b.active -= dt;
            b.x += b.side === 'L' ? b.speed * dt : -b.speed * dt;
            if (b.x < bb[0] - 30 || b.x > bb[2] + 30 || b.active <= 0) {
                this.bursters.splice(i, 1);
            }
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
AlienChestbursterPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.bursters.length; i++) {
        var b = this.bursters[i];
        if (b.warning <= 0) {
            if (rectsOverlap(b.x, b.y - 6, 20, 12, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }
    return 0;
};
AlienChestbursterPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    for (var i = 0; i < this.bursters.length; i++) {
        var b = this.bursters[i];
        if (b.warning > 0) {
            // Horizontal warning lasers
            ctx.strokeStyle = "rgba(255, 0, 0, 0.4)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(bb[0], b.y);
            ctx.lineTo(bb[2], b.y);
            ctx.stroke();
        } else {
            // Draw little pale pinkish Chestburster snake lunging rapidly!
            ctx.fillStyle = "#F5C3B5"; // Pale fleshy pink
            ctx.fillRect(b.x, b.y - 4, 20, 8);
            
            // Little mouth chrome teeth
            ctx.fillStyle = "#FFF";
            ctx.fillRect(b.side === 'L' ? b.x + 18 : b.x - 2, b.y - 4, 4, 8);

            // Blood splatter tail
            ctx.fillStyle = "#FF0000";
            ctx.fillRect(b.side === 'L' ? b.x - 4 : b.x + 20, b.y - 2, 4, 4);
        }
    }
    ctx.restore();
};
AlienChestbursterPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bursters.length === 0;
};

// ============================================================================
// 13. alienQueenCall (Queen Stampede Call)
// ============================================================================
var AlienQueenCallPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.stampedeTimer = 0;
    this.damVal = config.damVal || 12;
    this.runners = []; // { y, warning, active, x }
};
AlienQueenCallPattern.prototype = Object.create(BulletPattern.prototype);
AlienQueenCallPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.stampedeTimer = 0.2;
    this.runners = [];
};
AlienQueenCallPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.stampedeTimer += dt;
    var bb = Cbbox.getBound();

    if (this.stampedeTimer >= 1.1 && this.elapsed < this.duration - 1.2) {
        this.stampedeTimer = 0;
        // Spawn horizontal stampede rows
        var rows = 3;
        var rowH = (bb[3] - bb[1]) / rows;
        var rIdx = Math.floor(Math.random() * rows);
        this.runners.push({
            y: bb[1] + rIdx * rowH + rowH/2,
            h: rowH - 12,
            warning: 0.65,
            active: 0.8,
            x: bb[0] - 40,
            speed: 250
        });
    }

    for (var i = this.runners.length - 1; i >= 0; i--) {
        var r = this.runners[i];
        if (r.warning > 0) {
            r.warning -= dt;
            if (r.warning <= 0) {
                Sound.playSound("impact", true);
            }
        } else {
            r.active -= dt;
            r.x += r.speed * dt;
            if (r.x > bb[2] + 40 || r.active <= 0) {
                this.runners.splice(i, 1);
            }
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
AlienQueenCallPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.runners.length; i++) {
        var r = this.runners[i];
        if (r.warning <= 0) {
            if (rectsOverlap(r.x, r.y - r.h/2, 35, r.h, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }
    return 0;
};
AlienQueenCallPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    for (var i = 0; i < this.runners.length; i++) {
        var r = this.runners[i];
        if (r.warning > 0) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.15)";
            ctx.fillRect(bb[0], r.y - r.h/2, bb[2] - bb[0], r.h);
            ctx.strokeStyle = "rgba(255, 0, 0, 0.4)";
            ctx.lineWidth = 1;
            ctx.strokeRect(bb[0], r.y - r.h/2, bb[2] - bb[0], r.h);
        } else {
            // Draw stampeding dark biomechanical Alien Drone silhouettes racing forward!
            ctx.fillStyle = "#111";
            ctx.strokeStyle = "#39FF14"; // Acid outlining
            ctx.lineWidth = 2;
            ctx.save();
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#39FF14";
            
            ctx.beginPath();
            ctx.ellipse(r.x + 17, r.y, 17, r.h/2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Long dome head
            ctx.fillStyle = "#222";
            ctx.beginPath();
            ctx.ellipse(r.x + 25, r.y - 2, 12, 5, 0.1, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }
    ctx.restore();
};
AlienQueenCallPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.runners.length === 0;
};

// ============================================================================
// 14. alienHiveWebbing (Sticky Webbing)
// ============================================================================
var AlienHiveWebbingPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 7;
    this.webs = []; // { x, y, r, timer }
};
AlienHiveWebbingPattern.prototype = Object.create(BulletPattern.prototype);
AlienHiveWebbingPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2;
    this.webs = [];
};
AlienHiveWebbingPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();

    if (this.webs.length < 3 && this.elapsed < this.duration - 1.5 && this.spawnTimer >= 0.85) {
        this.spawnTimer = 0;
        var rx = bb[0] + 30 + Math.random() * (bb[2] - bb[0] - 60);
        var ry = bb[1] + 30 + Math.random() * (bb[3] - bb[1] - 60);
        this.webs.push({
            x: rx,
            y: ry,
            r: 30 + Math.random() * 15,
            timer: 4.5
        });
    }

    for (var i = this.webs.length - 1; i >= 0; i--) {
        var w = this.webs[i];
        w.timer -= dt;
        if (w.timer <= 0) {
            this.webs.splice(i, 1);
        }
    }

    // Floating minor acid droplets
    if (Math.random() < 0.15) {
        var rx = bb[0] + 15 + Math.random() * (bb[2] - bb[0] - 30);
        var drop = new Bullet({
            x: rx,
            y: bb[1],
            width: 4,
            height: 4,
            speed: 80 + Math.random() * 40,
            damVal: this.damVal,
            color: "#39FF14"
        });
        this.bullets.push(drop);
    }

    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        if (b.y >= bb[3] - 8) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }

    // Web slow effect on Soul!
    if (typeof Soul !== "undefined" && Soul.getPos) {
        var sPos = Soul.getPos();
        var inWeb = false;
        for (var i = 0; i < this.webs.length; i++) {
            var w = this.webs[i];
            var dx = sPos.x - w.x;
            var dy = sPos.y - w.y;
            if (dx*dx + dy*dy <= w.r * w.r) {
                inWeb = true;
                break;
            }
        }
        // Safely alter player speed
        if (inWeb) {
            if (typeof Player !== "undefined" && Player.addSpeedBuff) {
                Player.addSpeedBuff(0.5, 0.1); // Slow down by 50%
            }
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};
AlienHiveWebbingPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    // Webbing itself doesn't do damage, only slows the player. The floating droplets do damage!
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    return 0;
};
AlienHiveWebbingPattern.prototype.draw = function(ctx) {
    ctx.save();
    // Draw sticky grey biomechanical resin webs
    ctx.strokeStyle = "rgba(180, 180, 180, 0.4)";
    ctx.lineWidth = 1.2;
    for (var i = 0; i < this.webs.length; i++) {
        var w = this.webs[i];
        
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
        ctx.stroke();

        // Biomechanical web spokes
        for (var sp = 0; sp < 8; sp++) {
            var angle = sp * (Math.PI / 4);
            ctx.beginPath();
            ctx.moveTo(w.x, w.y);
            ctx.lineTo(w.x + Math.cos(angle) * w.r, w.y + Math.sin(angle) * w.r);
            ctx.stroke();
        }

        // Little green sticky resin dots
        ctx.fillStyle = "rgba(57, 255, 20, 0.45)";
        ctx.beginPath();
        ctx.arc(w.x, w.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw falling droplets
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        ctx.fillStyle = "#39FF14";
        ctx.fillRect(b.x, b.y, b.width, b.height);
    }
    ctx.restore();
};
AlienHiveWebbingPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.webs.length === 0 && this.bullets.length === 0;
};

// ============================================================================
// 15. alienSpitfire (Spitfire Fan)
// ============================================================================
var AlienSpitfirePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.sprayTimer = 0;
    this.damVal = config.damVal || 9;
};
AlienSpitfirePattern.prototype = Object.create(BulletPattern.prototype);
AlienSpitfirePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.sprayTimer = 0.1;
};
AlienSpitfirePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.sprayTimer += dt;
    var bb = Cbbox.getBound();

    if (this.sprayTimer >= 0.18 && this.elapsed < this.duration - 1.0) {
        this.sprayTimer = 0;
        Sound.playSound("text", true);
        
        // Spray in sweeping fan-like angles from top-center
        var startX = bb[0] + (bb[2] - bb[0])/2;
        var startY = bb[1] - 5;
        
        var fanAngle = Math.sin(this.elapsed * 5.0) * (Math.PI / 4) + (Math.PI / 2); // Sweep angle back and forth
        var speed = 160 + Math.random() * 40;
        
        var drop = new Bullet({
            x: startX - 2,
            y: startY,
            width: 5,
            height: 8,
            speed: 0,
            damVal: this.damVal,
            color: "#39FF14",
            vx: Math.cos(fanAngle) * speed,
            vy: Math.sin(fanAngle) * speed,
            useVelocity: true
        });
        this.bullets.push(drop);
    }

    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        if (b.isOutOfBounds(bb)) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
AlienSpitfirePattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        drawAcidGlow(ctx, b.x + 2.5, b.y + 4, 3.5, "#ADFF2F");
    }
    ctx.restore();
};
AlienSpitfirePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
