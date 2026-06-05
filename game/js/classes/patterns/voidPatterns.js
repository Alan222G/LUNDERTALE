// voidPatterns.js — 21 Unique Void-themed attacks for El Hambre Cósmica

var voidParticles = [];
function updateVoidParticles(dt) {
    for (var i = voidParticles.length - 1; i >= 0; i--) {
        var p = voidParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) voidParticles.splice(i, 1);
    }
}
function drawVoidParticles(ctx) {
    ctx.save();
    for (var i = 0; i < voidParticles.length; i++) {
        var p = voidParticles[i];
        ctx.fillStyle = p.color || "#FF00FF";
        ctx.shadowBlur = p.glow || 8;
        ctx.shadowColor = p.color || "#FF00FF";
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    }
    ctx.restore();
}
function spawnVoidParticle(x, y, vx, vy, size, life, color, glow) {
    voidParticles.push({
        x: x, y: y,
        vx: vx, vy: vy,
        size: size,
        life: life,
        color: color,
        glow: glow
    });
}

// ==========================================
// PHASE 1 PATTERNS (Standard Void / Maw)
// ==========================================

// 1. voidTentacleLash: Warning lines vertical/horizontal, followed by thick purple tentacles lashing
var VoidTentacleLashPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.lashTimer = 0;
    this.damVal = config.damVal || 8;
    this.lasers = []; // { x, y, isVert, warning, active }
};
VoidTentacleLashPattern.prototype = Object.create(BulletPattern.prototype);
VoidTentacleLashPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.lashTimer = 0.5;
    this.lasers = [];
    voidParticles = [];
};
VoidTentacleLashPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.lashTimer += dt;
    updateVoidParticles(dt);
    var bb = Cbbox.getBound();
    if (this.lashTimer >= 1.2 && this.elapsed < this.duration - 1.5) {
        this.lashTimer = 0;
        var isVert = Math.random() < 0.5;
        if (isVert) {
            var lx = bb[0] + 30 + Math.random() * (bb[2] - bb[0] - 60);
            this.lasers.push({ x: lx, y: 0, isVert: true, warning: 0.8, active: 0.5 });
        } else {
            var ly = bb[1] + 30 + Math.random() * (bb[3] - bb[1] - 60);
            this.lasers.push({ x: 0, y: ly, isVert: false, warning: 0.8, active: 0.5 });
        }
        Sound.playSound("laser", true);
    }
    for (var i = this.lasers.length - 1; i >= 0; i--) {
        var l = this.lasers[i];
        if (l.warning > 0) {
            l.warning -= dt;
            if (l.warning <= 0) {
                Sound.playSound("impact", true);
                if (typeof triggerShake !== "undefined") triggerShake(7, 180);
                for (var p = 0; p < 12; p++) {
                    var px = l.isVert ? l.x : bb[0] + Math.random() * (bb[2] - bb[0]);
                    var py = l.isVert ? bb[1] + Math.random() * (bb[3] - bb[1]) : l.y;
                    spawnVoidParticle(px, py, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, 3 + Math.random() * 4, 0.5, "#FF00FF", 10);
                }
            }
        } else if (l.active > 0) {
            l.active -= dt;
            if (Math.random() < 0.4) {
                var px = l.isVert ? l.x + (Math.random() - 0.5) * 15 : bb[0] + Math.random() * (bb[2] - bb[0]);
                var py = l.isVert ? bb[1] + Math.random() * (bb[3] - bb[1]) : l.y + (Math.random() - 0.5) * 15;
                spawnVoidParticle(px, py, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, 2 + Math.random() * 3, 0.35, "#DDA0DD", 6);
            }
            if (l.active <= 0) this.lasers.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
VoidTentacleLashPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.warning <= 0 && l.active > 0) {
            if (l.isVert) {
                if (Math.abs(scx - l.x) < 20) return this.damVal;
            } else {
                if (Math.abs(scy - l.y) < 20) return this.damVal;
            }
        }
    }
    return 0;
};
VoidTentacleLashPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var time = Date.now() / 1000;
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.warning > 0) {
            ctx.save();
            ctx.strokeStyle = "rgba(255, 0, 0, " + (0.3 + Math.sin(time * 15) * 0.2) + ")";
            ctx.lineWidth = 15;
            ctx.beginPath();
            if (l.isVert) {
                ctx.moveTo(l.x, bb[1]);
                ctx.lineTo(l.x, bb[3]);
            } else {
                ctx.moveTo(bb[0], l.y);
                ctx.lineTo(bb[2], l.y);
            }
            ctx.stroke();
            ctx.restore();
        } else if (l.active > 0) {
            ctx.save();
            ctx.strokeStyle = "#9400D3";
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#FF00FF";
            ctx.lineWidth = 24 * (l.active / 0.5);
            ctx.lineCap = "round";
            ctx.beginPath();
            if (l.isVert) {
                ctx.moveTo(l.x, bb[1]);
                for (var y = bb[1]; y <= bb[3]; y += 10) {
                    var tx = l.x + Math.sin(y / 15 + time * 12) * 8;
                    ctx.lineTo(tx, y);
                }
            } else {
                ctx.moveTo(bb[0], l.y);
                for (var x = bb[0]; x <= bb[2]; x += 10) {
                    var ty = l.y + Math.sin(x / 15 + time * 12) * 8;
                    ctx.lineTo(x, ty);
                }
            }
            ctx.stroke();
            ctx.strokeStyle = "#FF00FF";
            ctx.lineWidth = 8 * (l.active / 0.5);
            ctx.stroke();
            ctx.restore();
        }
    }
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidTentacleLashPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.lasers.length === 0;
};

// 2. voidEyeBeam: Yellow eyes open on boundaries and fire intersecting lasers
var VoidEyeBeamPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.beamTimer = 0;
    this.damVal = config.damVal || 8;
    this.beams = []; // { x, y, dx, dy, warning, active }
};
VoidEyeBeamPattern.prototype = Object.create(BulletPattern.prototype);
VoidEyeBeamPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.beamTimer = 0.5;
    this.beams = [];
    voidParticles = [];
};
VoidEyeBeamPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.beamTimer += dt;
    updateVoidParticles(dt);
    var bb = Cbbox.getBound();
    if (this.beamTimer >= 1.3 && this.elapsed < this.duration - 1.5) {
        this.beamTimer = 0;
        var side = Math.random() < 0.5;
        if (side) {
            var ly1 = bb[1] + 40 + Math.random() * (bb[3] - bb[1] - 80);
            var ly2 = bb[1] + 40 + Math.random() * (bb[3] - bb[1] - 80);
            this.beams.push({ x: bb[0], y: ly1, dx: bb[2], dy: ly1, warning: 1.0, active: 0.6 });
            this.beams.push({ x: bb[2], y: ly2, dx: bb[0], dy: ly2, warning: 1.0, active: 0.6 });
        } else {
            var lx1 = bb[0] + 40 + Math.random() * (bb[2] - bb[0] - 80);
            var lx2 = bb[0] + 40 + Math.random() * (bb[2] - bb[0] - 80);
            this.beams.push({ x: lx1, y: bb[1], dx: lx1, dy: bb[3], warning: 1.0, active: 0.6 });
            this.beams.push({ x: lx2, y: bb[3], dx: lx2, dy: bb[1], warning: 1.0, active: 0.6 });
        }
        Sound.playSound("laser", true);
    }
    for (var i = this.beams.length - 1; i >= 0; i--) {
        var b = this.beams[i];
        if (b.warning > 0) {
            b.warning -= dt;
            if (b.warning <= 0) {
                Sound.playSound("impact", true);
                if (typeof triggerShake !== "undefined") triggerShake(5, 120);
                for (var p = 0; p < 8; p++) {
                    spawnVoidParticle(b.x, b.y, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120, 3 + Math.random() * 3, 0.4, "#FFD700", 8);
                }
            }
        } else if (b.active > 0) {
            b.active -= dt;
            if (Math.random() < 0.3) {
                var pct = Math.random();
                var px = b.x + (b.dx - b.x) * pct;
                var py = b.y + (b.dy - b.y) * pct;
                spawnVoidParticle(px, py, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, 2 + Math.random() * 2, 0.3, "#FF00FF", 6);
            }
            if (b.active <= 0) this.beams.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
VoidEyeBeamPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    for (var i = 0; i < this.beams.length; i++) {
        var b = this.beams[i];
        if (b.warning <= 0 && b.active > 0) {
            if (b.x === b.dx) {
                if (Math.abs(scx - b.x) < 14) return this.damVal;
            } else {
                if (Math.abs(scy - b.y) < 14) return this.damVal;
            }
        }
    }
    return 0;
};
VoidEyeBeamPattern.prototype.draw = function(ctx) {
    ctx.save();
    var time = Date.now() / 1000;
    for (var i = 0; i < this.beams.length; i++) {
        var b = this.beams[i];
        ctx.save();
        ctx.translate(b.x, b.y);
        var angle = Math.atan2(b.dy - b.y, b.dx - b.x);
        ctx.rotate(angle);
        ctx.fillStyle = "#4B0082";
        ctx.strokeStyle = "#FF00FF";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        var pulseSize = 4 + Math.sin(time * 12) * 1.5;
        ctx.fillStyle = "#FFD700";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FFD700";
        ctx.beginPath();
        ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (b.warning > 0) {
            ctx.save();
            ctx.strokeStyle = "rgba(255, 0, 0, 0.4)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.dx, b.dy);
            ctx.stroke();
            ctx.restore();
        } else if (b.active > 0) {
            ctx.save();
            ctx.strokeStyle = "#FF00FF";
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#FF00FF";
            ctx.lineWidth = 20 * (b.active / 0.6);
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.dx, b.dy);
            ctx.stroke();
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 6 * (b.active / 0.6);
            ctx.stroke();
            ctx.restore();
        }
    }
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidEyeBeamPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.beams.length === 0;
};

// 3. voidSpitBackBarrage: Spits out stolen items (bouncy rings) or toxic void bile
var VoidSpitBackBarragePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spitTimer = 0;
    this.damVal = config.damVal || 8;
};
VoidSpitBackBarragePattern.prototype = Object.create(BulletPattern.prototype);
VoidSpitBackBarragePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spitTimer = 0;
    voidParticles = [];
};
VoidSpitBackBarragePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spitTimer += dt;
    updateVoidParticles(dt);
    var bb = Cbbox.getBound();
    if (this.spitTimer >= 0.70 && this.elapsed < this.duration - 1.5) {
        this.spitTimer = 0;
        var enemy = Cgroup.getEnemy(0);
        var hasStolen = (enemy && enemy.stolenItems && enemy.stolenItems.length > 0);
        var vx = -120 + Math.random() * 240;
        var vy = 120 + Math.random() * 80;
        this.bullets.push({
            x: 370, y: 90,
            vx: vx, vy: vy,
            width: 16, height: 16,
            color: hasStolen ? "#EE82EE" : "#32CD32",
            bounces: 4,
            isStolenItem: hasStolen,
            active: true
        });
        Sound.playSound("hit_1", true);
    }
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        
        if (b.active && Math.random() < 0.35) {
            spawnVoidParticle(b.x, b.y, -b.vx * 0.2 + (Math.random() - 0.5) * 20, -b.vy * 0.2 + (Math.random() - 0.5) * 20, 2 + Math.random() * 2, 0.25, b.color, 6);
        }
        
        if (b.x < bb[0] + 8) { 
            b.x = bb[0] + 8; b.vx = -b.vx; b.bounces--; Sound.playSound("ting", true); 
            if (typeof triggerShake !== "undefined") triggerShake(2, 60);
            for (var p = 0; p < 4; p++) spawnVoidParticle(b.x, b.y, Math.random() * 40, (Math.random() - 0.5) * 40, 2, 0.2, b.color, 5);
        }
        if (b.x > bb[2] - 8) { 
            b.x = bb[2] - 8; b.vx = -b.vx; b.bounces--; Sound.playSound("ting", true); 
            if (typeof triggerShake !== "undefined") triggerShake(2, 60);
            for (var p = 0; p < 4; p++) spawnVoidParticle(b.x, b.y, -Math.random() * 40, (Math.random() - 0.5) * 40, 2, 0.2, b.color, 5);
        }
        if (b.y < bb[1] + 8) { 
            b.y = bb[1] + 8; b.vy = -b.vy; b.bounces--; Sound.playSound("ting", true); 
            if (typeof triggerShake !== "undefined") triggerShake(2, 60);
            for (var p = 0; p < 4; p++) spawnVoidParticle(b.x, b.y, (Math.random() - 0.5) * 40, Math.random() * 40, 2, 0.2, b.color, 5);
        }
        if (b.y > bb[3] - 8) { 
            b.y = bb[3] - 8; b.vy = -b.vy; b.bounces--; Sound.playSound("ting", true); 
            if (typeof triggerShake !== "undefined") triggerShake(2, 60);
            for (var p = 0; p < 4; p++) spawnVoidParticle(b.x, b.y, (Math.random() - 0.5) * 40, -Math.random() * 40, 2, 0.2, b.color, 5);
        }
        
        if (b.bounces < 0) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
VoidSpitBackBarragePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && rectsOverlap(b.x - b.width/2, b.y - b.height/2, b.width, b.height, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    return 0;
};
VoidSpitBackBarragePattern.prototype.draw = function(ctx) {
    ctx.save();
    var time = Date.now() / 1000;
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(time * 5);
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.color;
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        if (b.isStolenItem) {
            ctx.fillStyle = "#FF69B4";
            ctx.fillRect(-8, -8, 16, 16);
            ctx.strokeRect(-8, -8, 16, 16);
        } else {
            ctx.fillStyle = "#00FF00";
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidSpitBackBarragePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 4. voidMawDrip: Slime drops drip down from mouth at the top
var VoidMawDripPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
};
VoidMawDripPattern.prototype = Object.create(BulletPattern.prototype);
VoidMawDripPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    voidParticles = [];
};
VoidMawDripPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateVoidParticles(dt);
    var bb = Cbbox.getBound();
    if (this.spawnTimer >= 0.25 && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        var rx = bb[0] + 15 + Math.random() * (bb[2] - bb[0] - 30);
        this.bullets.push({
            x: rx, y: bb[1] + 5,
            vy: 80, grav: 140,
            radius: 5, active: true, splashed: false, timer: 0
        });
        Sound.playSound("hit_1", true);
    }
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        if (!b.splashed) {
            b.vy += b.grav * dt;
            b.y += b.vy * dt;
            
            if (Math.random() < 0.3) {
                spawnVoidParticle(b.x, b.y, (Math.random() - 0.5) * 15, -20, 2, 0.3, "#9300D3", 5);
            }
            
            if (b.y >= bb[3] - 10) {
                b.y = bb[3] - 8;
                b.splashed = true;
                b.timer = 0.3; // 0.3s splash duration
                Sound.playSound("ting", true);
                // spawn splash particles
                for (var p = 0; p < 6; p++) {
                    spawnVoidParticle(b.x, b.y, -40 + Math.random() * 80, -30 - Math.random() * 40, 2 + Math.random() * 2, 0.25, "#FF00FF", 8);
                }
            }
        } else {
            b.timer -= dt;
            if (b.timer <= 0) {
                b.active = false;
                this.bullets.splice(i, 1);
            }
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
VoidMawDripPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active) {
            var rad = b.splashed ? 18 : b.radius;
            if (rectsOverlap(b.x - rad, b.y - rad, rad*2, rad*2, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }
    return 0;
};
VoidMawDripPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.save();
        ctx.fillStyle = "#9300D3";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF00FF";
        if (!b.splashed) {
            ctx.beginPath();
            ctx.moveTo(b.x, b.y - 7);
            ctx.quadraticCurveTo(b.x - 5, b.y, b.x, b.y + 5);
            ctx.quadraticCurveTo(b.x + 5, b.y, b.x, b.y - 7);
            ctx.fill();
        } else {
            var radius = 18 * (1 - b.timer/0.3);
            ctx.strokeStyle = "#FF00FF";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidMawDripPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 5. voidCosmicDust: Waves of stardust sweep horizontally
var VoidCosmicDustPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
};
VoidCosmicDustPattern.prototype = Object.create(BulletPattern.prototype);
VoidCosmicDustPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    voidParticles = [];
};
VoidCosmicDustPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateVoidParticles(dt);
    var bb = Cbbox.getBound();
    if (this.spawnTimer >= 0.16 && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        var side = Math.random() < 0.5;
        var ry = bb[1] + 15 + Math.random() * (bb[3] - bb[1] - 30);
        this.bullets.push({
            x: side ? bb[0] - 10 : bb[2] + 10,
            y: ry,
            vx: side ? 150 : -150,
            vy: 0,
            amp: 15 + Math.random() * 20,
            freq: 4 + Math.random() * 3,
            startY: ry,
            width: 8, height: 8,
            color: Math.random() > 0.5 ? "#FFD700" : "#BA55D3",
            active: true
        });
    }
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.x += b.vx * dt;
        b.y = b.startY + Math.sin((this.elapsed + b.x / 100) * b.freq) * b.amp;
        
        if (Math.random() < 0.25) {
            spawnVoidParticle(b.x, b.y, -b.vx * 0.1 + (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 2, 0.3, b.color, 4);
        }
        
        if (b.x < bb[0] - 30 || b.x > bb[2] + 30) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
VoidCosmicDustPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    return BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
};
VoidCosmicDustPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.fillStyle = b.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = b.color;
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(2, -2);
        ctx.lineTo(6, 0);
        ctx.lineTo(2, 2);
        ctx.moveTo(0, 6);
        ctx.lineTo(-2, 2);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-2, -2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidCosmicDustPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 6. voidGravityPlunge: Gravity waves pull player down, vertical floor spikes warning
var VoidGravityPlungePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spikeTimer = 0;
    this.damVal = config.damVal || 8;
    this.spikes = []; // { x, warning, active }
};
VoidGravityPlungePattern.prototype = Object.create(BulletPattern.prototype);
VoidGravityPlungePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spikeTimer = 0.5;
    this.spikes = [];
    voidParticles = [];
};
VoidGravityPlungePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spikeTimer += dt;
    updateVoidParticles(dt);
    var bb = Cbbox.getBound();
    
    // Apply heavy downward gravity
    if (typeof Soul !== "undefined") {
        var sPos = Soul.getPos();
        Soul.setPos(sPos.x, sPos.y + 60 * dt);
    }
    
    if (Math.random() < 0.25) {
        var rx = bb[0] + Math.random() * (bb[2] - bb[0]);
        spawnVoidParticle(rx, bb[1], 0, 150 + Math.random() * 50, 1.5 + Math.random() * 2, 1.0, "rgba(148, 0, 211, 0.4)", 4);
    }
    
    if (this.spikeTimer >= 1.0 && this.elapsed < this.duration - 1.5) {
        this.spikeTimer = 0;
        var sx = bb[0] + 15 + Math.random() * (bb[2] - bb[0] - 50);
        this.spikes.push({ x: sx, warning: 0.9, active: 0.5 });
        Sound.playSound("laser", true);
    }
    for (var i = this.spikes.length - 1; i >= 0; i--) {
        var s = this.spikes[i];
        if (s.warning > 0) {
            s.warning -= dt;
            if (s.warning <= 0) {
                Sound.playSound("impact", true);
                if (typeof triggerShake !== "undefined") triggerShake(5, 120);
                for (var p = 0; p < 8; p++) {
                    spawnVoidParticle(s.x, bb[3], (Math.random() - 0.5) * 60, -80 - Math.random() * 60, 2.5 + Math.random() * 2, 0.35, "#FF00FF", 8);
                }
            }
        } else if (s.active > 0) {
            s.active -= dt;
            if (s.active <= 0) this.spikes.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
VoidGravityPlungePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    var bb = Cbbox.getBound();
    for (var i = 0; i < this.spikes.length; i++) {
        var s = this.spikes[i];
        if (s.warning <= 0 && s.active > 0) {
            if (Math.abs(scx - s.x) < 22 && scy > bb[3] - 45) {
                return this.damVal;
            }
        }
    }
    return 0;
};
VoidGravityPlungePattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var time = Date.now() / 1000;
    
    ctx.strokeStyle = "rgba(128, 0, 128, 0.15)";
    ctx.lineWidth = 1;
    for (var gx = bb[0] + 20; gx < bb[2]; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, bb[1] + 10);
        ctx.lineTo(gx, bb[3] - 10);
        ctx.stroke();
        var arrowY = bb[1] + 20 + ((time * 60) % (bb[3] - bb[1] - 40));
        ctx.fillStyle = "rgba(128, 0, 128, 0.25)";
        ctx.beginPath();
        ctx.moveTo(gx - 4, arrowY - 4);
        ctx.lineTo(gx, arrowY);
        ctx.lineTo(gx + 4, arrowY - 4);
        ctx.fill();
    }
    
    for (var i = 0; i < this.spikes.length; i++) {
        var s = this.spikes[i];
        if (s.warning > 0) {
            ctx.fillStyle = "rgba(255, 69, 0, 0.3)";
            ctx.fillRect(s.x - 20, bb[3] - 40, 40, 40);
        } else if (s.active > 0) {
            ctx.save();
            ctx.fillStyle = "#4B0082";
            ctx.strokeStyle = "#FF00FF";
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#FF00FF";
            
            var height = 40 * (s.active / 0.5);
            ctx.beginPath();
            ctx.moveTo(s.x - 20, bb[3]);
            ctx.lineTo(s.x, bb[3] - height);
            ctx.lineTo(s.x + 20, bb[3]);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    }
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidGravityPlungePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.spikes.length === 0;
};

// 7. voidEldritchScream: Ring waves expand outward from center
var VoidEldritchScreamPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.waveTimer = 0;
    this.damVal = config.damVal || 8;
    this.waves = []; // { r, active }
};
VoidEldritchScreamPattern.prototype = Object.create(BulletPattern.prototype);
VoidEldritchScreamPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.waveTimer = 0.5;
    this.waves = [];
    voidParticles = [];
};
VoidEldritchScreamPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.waveTimer += dt;
    updateVoidParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    if (this.waveTimer >= 1.6 && this.elapsed < this.duration - 1.0) {
        this.waveTimer = 0;
        this.waves.push({ r: 5, active: true });
        Sound.playSound("impact", true);
        if (typeof triggerShake !== "undefined") triggerShake(7, 180);
        
        for (var p = 0; p < 16; p++) {
            var angle = p * Math.PI * 2 / 16;
            spawnVoidParticle(cx, cy, Math.cos(angle) * 70, Math.sin(angle) * 70, 3, 0.45, "#FF00FF", 8);
        }
    }
    for (var i = this.waves.length - 1; i >= 0; i--) {
        var w = this.waves[i];
        w.r += 130 * dt;
        if (w.r > 280) {
            w.active = false;
            this.waves.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
VoidEldritchScreamPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    var dist = Math.sqrt(Math.pow(scx - cx, 2) + Math.pow(scy - cy, 2));
    
    for (var i = 0; i < this.waves.length; i++) {
        var w = this.waves[i];
        if (Math.abs(dist - w.r) < 12) {
            return this.damVal;
        }
    }
    return 0;
};
VoidEldritchScreamPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    for (var i = 0; i < this.waves.length; i++) {
        var w = this.waves[i];
        ctx.save();
        ctx.strokeStyle = "rgba(148, 0, 211, " + (1 - w.r/280) + ")";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FF00FF";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(cx, cy, w.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidEldritchScreamPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.waves.length === 0;
};


// ==========================================
// PHASE 2 PATTERNS (Enraged Void / Maw)
// ==========================================

// 8. voidBiteSlam: Targeted rectangle slams shut
var VoidBiteSlamPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.biteTimer = 0;
    this.damVal = config.damVal || 9;
    this.bites = []; // { x, y, w, h, warning, active, maxWarning }
};
VoidBiteSlamPattern.prototype = Object.create(BulletPattern.prototype);
VoidBiteSlamPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.biteTimer = 0.4;
    this.bites = [];
    voidParticles = [];
};
VoidBiteSlamPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.biteTimer += dt;
    updateVoidParticles(dt);
    if (this.biteTimer >= 1.5 && this.elapsed < this.duration - 1.5) {
        this.biteTimer = 0;
        if (typeof Soul !== "undefined") {
            var sPos = Soul.getPos();
            var targetX = sPos.x + Soul.getWidth()/2;
            var targetY = sPos.y + Soul.getHeight()/2;
            this.bites.push({
                x: targetX - 50, y: targetY - 50,
                w: 100, h: 100,
                warning: 0.9, active: 0.4, maxWarning: 0.9
            });
            Sound.playSound("laser", true);
        }
    }
    for (var i = this.bites.length - 1; i >= 0; i--) {
        var b = this.bites[i];
        if (b.warning > 0) {
            b.warning -= dt;
            if (b.warning <= 0) {
                Sound.playSound("hit_2_crit", true);
                if (typeof triggerShake !== "undefined") triggerShake(9, 220);
                for (var p = 0; p < 14; p++) {
                    spawnVoidParticle(b.x + b.w/2, b.y + b.h/2, (Math.random() - 0.5) * 140, (Math.random() - 0.5) * 140, 3 + Math.random() * 3, 0.45, "#E0FFFF", 10);
                }
            }
        } else if (b.active > 0) {
            b.active -= dt;
            if (b.active <= 0) this.bites.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
VoidBiteSlamPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.bites.length; i++) {
        var b = this.bites[i];
        if (b.warning <= 0 && b.active > 0) {
            if (rectsOverlap(b.x, b.y, b.w, b.h, sx, sy, sw, sh)) return this.damVal;
        }
    }
    return 0;
};
VoidBiteSlamPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bites.length; i++) {
        var b = this.bites[i];
        if (b.warning > 0) {
            var pct = b.warning / b.maxWarning;
            ctx.strokeStyle = "rgba(255, 69, 0, " + (0.4 + (1 - pct)*0.4) + ")";
            ctx.lineWidth = 2 + (1 - pct) * 3;
            ctx.strokeRect(b.x, b.y, b.w, b.h);
            ctx.fillStyle = "rgba(255, 0, 0, 0.15)";
            ctx.fillRect(b.x, b.y, b.w, b.h * (1 - pct) * 0.5);
            ctx.fillRect(b.x, b.y + b.h - b.h * (1 - pct) * 0.5, b.w, b.h * (1 - pct) * 0.5);
        } else if (b.active > 0) {
            var actPct = b.active / 0.4;
            ctx.save();
            ctx.fillStyle = "#4B0082";
            ctx.strokeStyle = "#FF00FF";
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#FF00FF";
            ctx.fillRect(b.x, b.y, b.w, b.h);
            ctx.strokeRect(b.x, b.y, b.w, b.h);
            ctx.fillStyle = "#E0FFFF";
            ctx.beginPath();
            for (var tx = b.x; tx < b.x + b.w; tx += 10) {
                ctx.moveTo(tx, b.y); ctx.lineTo(tx + 5, b.y + 20 * actPct); ctx.lineTo(tx + 10, b.y);
            }
            for (var tx = b.x; tx < b.x + b.w; tx += 10) {
                ctx.moveTo(tx, b.y + b.h); ctx.lineTo(tx + 5, b.y + b.h - 20 * actPct); ctx.lineTo(tx + 10, b.y + b.h);
            }
            ctx.fill();
            ctx.restore();
        }
    }
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidBiteSlamPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bites.length === 0;
};

// 9. voidGravitySingularity: Central well pulls player while debris spirals in
var VoidGravitySingularityPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
    this.pullStrength = config.pullStrength || 38.0;
};
VoidGravitySingularityPattern.prototype = Object.create(BulletPattern.prototype);
VoidGravitySingularityPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    voidParticles = [];
};
VoidGravitySingularityPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateVoidParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    if (typeof Soul !== "undefined") {
        var sPos = Soul.getPos();
        var scx = sPos.x + Soul.getWidth()/2;
        var scy = sPos.y + Soul.getHeight()/2;
        var dx = cx - scx;
        var dy = cy - scy;
        var dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 5) {
            Soul.setPos(
                sPos.x + (dx / dist) * this.pullStrength * dt,
                sPos.y + (dy / dist) * this.pullStrength * dt
            );
        }
    }
    
    if (Math.random() < 0.3) {
        var angle = Math.random() * Math.PI * 2;
        var r = 160;
        spawnVoidParticle(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, -Math.cos(angle) * 100, -Math.sin(angle) * 100, 2, 0.8, "#FF00FF", 5);
    }
    
    if (this.spawnTimer >= 0.22 && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        var angle = Math.random() * Math.PI * 2;
        var r = 180;
        this.bullets.push({
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r,
            radius: r, angle: angle,
            rotSpeed: 3.5, radialSpeed: 80,
            width: 8, height: 8, active: true
        });
        Sound.playSound("laser", true);
    }
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.radius -= b.radialSpeed * dt;
        b.angle += b.rotSpeed * dt;
        b.x = cx + Math.cos(b.angle) * b.radius;
        b.y = cy + Math.sin(b.angle) * b.radius;
        if (b.radius < 12) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
VoidGravitySingularityPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var dmg = BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
    if (dmg > 0) return dmg;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    var dist = Math.sqrt(Math.pow((sx+sw/2) - cx, 2) + Math.pow((sy+sh/2) - cy, 2));
    if (dist < 15) return this.damVal;
    return 0;
};
VoidGravitySingularityPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    var time = Date.now() / 1000;
    var pulse = 16 + Math.sin(time * 10) * 3;
    var grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, pulse + 15);
    grad.addColorStop(0, "#000000");
    grad.addColorStop(0.3, "#4B0082");
    grad.addColorStop(0.8, "#FF00FF");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, pulse + 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000000";
    ctx.beginPath(); ctx.arc(cx, cy, pulse * 0.7, 0, Math.PI * 2); ctx.fill();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.fillStyle = "#FF00FF";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF00FF";
        ctx.fillRect(b.x - 4, b.y - 4, 8, 8);
    }
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidGravitySingularityPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 10. voidInventoryDevourAttempt: Tongue lunges to steal item
var VoidInventoryDevourAttemptPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 4.5;
    this.elapsed = 0;
    this.damVal = config.damVal || 6;
    this.tongueX = 370;
    this.tongueY = 80;
    this.targetX = 370;
    this.targetY = 250;
    this.phase = 0; // 0=Warning, 1=Lunge, 2=Hold, 3=Retract
    this.timer = 0;
    this.stealTriggered = false;
};
VoidInventoryDevourAttemptPattern.prototype = Object.create(BulletPattern.prototype);
VoidInventoryDevourAttemptPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.phase = 0;
    this.timer = 0.8;
    this.stealTriggered = false;
    this.tongueX = 370;
    this.tongueY = 80;
    voidParticles = [];
    if (typeof Soul !== "undefined") {
        var sPos = Soul.getPos();
        this.targetX = sPos.x + Soul.getWidth()/2;
        this.targetY = sPos.y + Soul.getHeight()/2;
    }
};
VoidInventoryDevourAttemptPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateVoidParticles(dt);
    if (this.phase === 0) {
        this.timer -= dt;
        if (this.timer <= 0) {
            this.phase = 1;
            this.timer = 0.25;
            Sound.playSound("laser", true);
        }
    } else if (this.phase === 1) {
        this.timer -= dt;
        var pct = Math.min(1.0, 1 - (this.timer / 0.25));
        this.tongueX = 370 + (this.targetX - 370) * pct;
        this.tongueY = 80 + (this.targetY - 80) * pct;
        
        if (Math.random() < 0.4) {
            spawnVoidParticle(this.tongueX, this.tongueY, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, 2 + Math.random() * 2, 0.3, "#FF69B4", 6);
        }
        
        if (this.timer <= 0) {
            this.phase = 2;
            this.timer = 0.3;
        }
    } else if (this.phase === 2) {
        this.timer -= dt;
        if (this.timer <= 0) {
            this.phase = 3;
            this.timer = 0.35;
        }
    } else if (this.phase === 3) {
        this.timer -= dt;
        var pct = Math.max(0.0, this.timer / 0.35);
        this.tongueX = 370 + (this.targetX - 370) * pct;
        this.tongueY = 80 + (this.targetY - 80) * pct;
    }
    BulletPattern.prototype.update.call(this, dt);
};
VoidInventoryDevourAttemptPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    if (this.phase !== 1 && this.phase !== 2) return 0;
    var rad = 14;
    var dist = Math.sqrt(Math.pow((sx+sw/2) - this.tongueX, 2) + Math.pow((sy+sh/2) - this.tongueY, 2));
    if (dist < rad + sw/2) {
        return this.damVal;
    }
    return 0;
};
VoidInventoryDevourAttemptPattern.prototype.draw = function(ctx) {
    ctx.save();
    var time = Date.now() / 1000;
    if (this.phase === 0) {
        ctx.strokeStyle = "rgba(255, 20, 147, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(370, 80); ctx.lineTo(this.targetX, this.targetY); ctx.stroke();
        ctx.strokeStyle = "#FF1493";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(this.targetX, this.targetY, 20 + Math.sin(time*20)*4, 0, Math.PI * 2); ctx.stroke();
    }
    if (this.phase > 0) {
        ctx.save();
        ctx.strokeStyle = "#FF69B4";
        ctx.lineCap = "round";
        ctx.lineWidth = 16;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FF1493";
        ctx.beginPath();
        ctx.moveTo(370, 80);
        var dx = this.tongueX - 370;
        var dy = this.tongueY - 80;
        var len = Math.sqrt(dx*dx + dy*dy) || 1;
        var nx = dx / len;
        var ny = dy / len;
        for (var step = 0; step <= 10; step++) {
            var progress = step / 10;
            var curX = 370 + dx * progress;
            var curY = 80 + dy * progress;
            var wave = Math.sin(progress * Math.PI * 2 - time * 15) * 8 * (1 - progress) * progress;
            curX += -ny * wave;
            curY += nx * wave;
            ctx.lineTo(curX, curY);
        }
        ctx.stroke();
        ctx.fillStyle = "#BA55D3";
        ctx.beginPath(); ctx.arc(this.tongueX, this.tongueY, 11, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidInventoryDevourAttemptPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration || (this.phase === 3 && this.tongueY <= 85);
};

// 11. voidNebulaSwarm: Homing spark bullets target player position and fade
var VoidNebulaSwarmPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
};
VoidNebulaSwarmPattern.prototype = Object.create(BulletPattern.prototype);
VoidNebulaSwarmPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    voidParticles = [];
};
VoidNebulaSwarmPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateVoidParticles(dt);
    var bb = Cbbox.getBound();
    if (this.spawnTimer >= 0.40 && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        var rx = Math.random() < 0.5 ? bb[0] + 10 : bb[2] - 10;
        var ry = Math.random() < 0.5 ? bb[1] + 10 : bb[3] - 10;
        this.bullets.push({
            x: rx, y: ry,
            width: 10, height: 10,
            active: true,
            timer: 3.0,
            color: "#EE82EE"
        });
        Sound.playSound("laser", true);
    }
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.timer -= dt;
        
        if (b.active && Math.random() < 0.4) {
            spawnVoidParticle(b.x, b.y, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, 2, 0.25, "#EE82EE", 5);
        }
        
        if (typeof Soul !== "undefined" && b.timer > 0.8) {
            var sPos = Soul.getPos();
            var targetX = sPos.x + Soul.getWidth()/2;
            var targetY = sPos.y + Soul.getHeight()/2;
            var dx = targetX - b.x;
            var dy = targetY - b.y;
            var dist = Math.sqrt(dx*dx + dy*dy) || 1;
            b.x += (dx / dist) * 110 * dt;
            b.y += (dy / dist) * 110 * dt;
        } else {
            b.x += 20 * dt;
            b.y += 20 * dt;
        }
        if (b.timer <= 0) {
            b.active = false;
            this.bullets.splice(i, 1);
            // explosion particles
            for (var p = 0; p < 5; p++) {
                spawnVoidParticle(b.x, b.y, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, 2 + Math.random() * 2, 0.3, "#FFFFFF", 6);
            }
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
VoidNebulaSwarmPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    return BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
};
VoidNebulaSwarmPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.save();
        ctx.translate(b.x, b.y);
        var alpha = Math.min(1.0, b.timer / 0.5);
        ctx.fillStyle = "rgba(238, 130, 238, " + alpha + ")";
        ctx.shadowBlur = 8;
        ctx.shadowColor = b.color;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 255, 255, " + alpha + ")";
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidNebulaSwarmPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 12. voidAbyssalRift: Jagged lines tear open horizontally and explode
var VoidAbyssalRiftPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.riftTimer = 0;
    this.damVal = config.damVal || 8;
    this.rifts = []; // { y, warning, active }
};
VoidAbyssalRiftPattern.prototype = Object.create(BulletPattern.prototype);
VoidAbyssalRiftPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.riftTimer = 0.5;
    this.rifts = [];
    voidParticles = [];
};
VoidAbyssalRiftPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.riftTimer += dt;
    updateVoidParticles(dt);
    var bb = Cbbox.getBound();
    if (this.riftTimer >= 1.4 && this.elapsed < this.duration - 1.5) {
        this.riftTimer = 0;
        var ry = bb[1] + 30 + Math.random() * (bb[3] - bb[1] - 60);
        this.rifts.push({ y: ry, warning: 0.9, active: 0.4 });
        Sound.playSound("laser", true);
    }
    for (var i = this.rifts.length - 1; i >= 0; i--) {
        var r = this.rifts[i];
        if (r.warning > 0) {
            r.warning -= dt;
            if (r.warning <= 0) {
                Sound.playSound("impact", true);
                if (typeof triggerShake !== "undefined") triggerShake(6, 200);
                for (var p = 0; p < 18; p++) {
                    var px = bb[0] + Math.random() * (bb[2] - bb[0]);
                    spawnVoidParticle(px, r.y, (Math.random() - 0.5) * 40, -100 - Math.random() * 80, 2 + Math.random() * 3, 0.4, "#FF00FF", 8);
                }
            }
        } else if (r.active > 0) {
            r.active -= dt;
            if (r.active <= 0) this.rifts.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
VoidAbyssalRiftPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scy = sy + sh/2;
    for (var i = 0; i < this.rifts.length; i++) {
        var r = this.rifts[i];
        if (r.warning <= 0 && r.active > 0) {
            if (Math.abs(scy - r.y) < 25) return this.damVal;
        }
    }
    return 0;
};
VoidAbyssalRiftPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var time = Date.now() / 1000;
    for (var i = 0; i < this.rifts.length; i++) {
        var r = this.rifts[i];
        if (r.warning > 0) {
            ctx.save();
            ctx.strokeStyle = "rgba(186, 85, 211, 0.4)";
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath(); ctx.moveTo(bb[0], r.y); ctx.lineTo(bb[2], r.y); ctx.stroke();
            ctx.restore();
        } else if (r.active > 0) {
            ctx.save();
            ctx.fillStyle = "rgba(75, 0, 130, 0.6)";
            ctx.strokeStyle = "#FF00FF";
            ctx.lineWidth = 2.0;
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#FF00FF";
            ctx.beginPath();
            ctx.moveTo(bb[0], r.y);
            for (var x = bb[0]; x <= bb[2]; x += 15) {
                var offset = (x === bb[0] || x >= bb[2]) ? 0 : (Math.random() - 0.5) * 16;
                ctx.lineTo(x, r.y + offset);
            }
            ctx.lineTo(bb[2], r.y + 12);
            ctx.lineTo(bb[0], r.y + 12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    }
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidAbyssalRiftPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.rifts.length === 0;
};

// 13. voidTentacleFlurry: Sequential rapid lash warnings
var VoidTentacleFlurryPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
    this.lasers = [];
};
VoidTentacleFlurryPattern.prototype = Object.create(BulletPattern.prototype);
VoidTentacleFlurryPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.3;
    this.lasers = [];
    voidParticles = [];
};
VoidTentacleFlurryPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateVoidParticles(dt);
    var bb = Cbbox.getBound();
    if (this.spawnTimer >= 0.50 && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        var isVert = Math.random() < 0.5;
        if (isVert) {
            var lx = bb[0] + 20 + Math.random() * (bb[2] - bb[0] - 40);
            this.lasers.push({ x: lx, y: 0, isVert: true, warning: 0.5, active: 0.3 });
        } else {
            var ly = bb[1] + 20 + Math.random() * (bb[3] - bb[1] - 40);
            this.lasers.push({ x: 0, y: ly, isVert: false, warning: 0.5, active: 0.3 });
        }
        Sound.playSound("laser", true);
    }
    for (var i = this.lasers.length - 1; i >= 0; i--) {
        var l = this.lasers[i];
        if (l.warning > 0) {
            l.warning -= dt;
            if (l.warning <= 0) {
                if (typeof triggerShake !== "undefined") triggerShake(3, 100);
                for (var p = 0; p < 5; p++) {
                    var px = l.isVert ? l.x : bb[0] + Math.random() * (bb[2] - bb[0]);
                    var py = l.isVert ? bb[1] + Math.random() * (bb[3] - bb[1]) : l.y;
                    spawnVoidParticle(px, py, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, 2 + Math.random() * 3, 0.35, "#8B008B", 8);
                }
            }
        } else if (l.active > 0) {
            l.active -= dt;
            if (l.active <= 0) this.lasers.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
VoidTentacleFlurryPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.warning <= 0 && l.active > 0) {
            if (l.isVert) {
                if (Math.abs(scx - l.x) < 18) return this.damVal;
            } else {
                if (Math.abs(scy - l.y) < 18) return this.damVal;
            }
        }
    }
    return 0;
};
VoidTentacleFlurryPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var time = Date.now() / 1000;
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.warning > 0) {
            ctx.save();
            ctx.strokeStyle = "rgba(255, 0, 100, 0.4)";
            ctx.lineWidth = 10;
            ctx.beginPath();
            if (l.isVert) { ctx.moveTo(l.x, bb[1]); ctx.lineTo(l.x, bb[3]); }
            else { ctx.moveTo(bb[0], l.y); ctx.lineTo(bb[2], l.y); }
            ctx.stroke();
            ctx.restore();
        } else if (l.active > 0) {
            ctx.save();
            ctx.strokeStyle = "#8B008B";
            ctx.lineWidth = 20 * (l.active / 0.3);
            ctx.beginPath();
            if (l.isVert) {
                ctx.moveTo(l.x, bb[1]);
                for (var y = bb[1]; y <= bb[3]; y += 15) {
                    var tx = l.x + Math.sin(y / 10 + time * 20) * 10;
                    ctx.lineTo(tx, y);
                }
            } else {
                ctx.moveTo(bb[0], l.y);
                for (var x = bb[0]; x <= bb[2]; x += 15) {
                    var ty = l.y + Math.sin(x / 10 + time * 20) * 10;
                    ctx.lineTo(x, ty);
                }
            }
            ctx.stroke();
            ctx.strokeStyle = "#EE82EE";
            ctx.lineWidth = 6 * (l.active / 0.3);
            ctx.stroke();
            ctx.restore();
        }
    }
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidTentacleFlurryPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.lasers.length === 0;
};

// 14. voidCorrosiveSpit: Spits green blobs that break into bouncing splits
var VoidCorrosiveSpitPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spitTimer = 0;
    this.damVal = config.damVal || 8;
};
VoidCorrosiveSpitPattern.prototype = Object.create(BulletPattern.prototype);
VoidCorrosiveSpitPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spitTimer = 0;
    voidParticles = [];
};
VoidCorrosiveSpitPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spitTimer += dt;
    updateVoidParticles(dt);
    var bb = Cbbox.getBound();
    if (this.spitTimer >= 0.85 && this.elapsed < this.duration - 1.8) {
        this.spitTimer = 0;
        if (typeof Soul !== "undefined") {
            var sPos = Soul.getPos();
            var targetX = sPos.x + Soul.getWidth()/2;
            var targetY = sPos.y + Soul.getHeight()/2;
            var angle = Math.atan2(targetY - 90, targetX - 370);
            this.bullets.push({
                x: 370, y: 90,
                vx: Math.cos(angle) * 160,
                vy: Math.sin(angle) * 160,
                width: 12, height: 12,
                split: true, active: true, color: "#32CD32"
            });
            Sound.playSound("laser", true);
        }
    }
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        
        if (b.active && Math.random() < 0.4) {
            spawnVoidParticle(b.x, b.y, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, 2, 0.25, b.color, 5);
        }
        
        if (b.split && (b.x < bb[0] + 5 || b.x > bb[2] - 5 || b.y < bb[1] + 5 || b.y > bb[3] - 5)) {
            b.active = false;
            this.bullets.splice(i, 1);
            
            for (var k = 0; k < 3; k++) {
                var sAngle = (k * Math.PI / 3) + Math.random() * 0.2;
                this.bullets.push({
                    x: b.x, y: b.y,
                    vx: Math.cos(sAngle) * 90,
                    vy: -Math.abs(Math.sin(sAngle) * 90),
                    width: 7, height: 7,
                    split: false, active: true, color: "#7FFF00"
                });
                spawnVoidParticle(b.x, b.y, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, 2, 0.3, "#7FFF00", 6);
            }
            Sound.playSound("ting", true);
        } else if (!b.split) {
            b.vy += 80 * dt;
            if (b.y > bb[3] + 15) {
                b.active = false;
                this.bullets.splice(i, 1);
            }
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
VoidCorrosiveSpitPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    return BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
};
VoidCorrosiveSpitPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.width/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidCorrosiveSpitPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};


// ==========================================
// PHASE 3 PATTERNS (Shattered Void Core)
// ==========================================

// 15. voidShatteredCorePulse: Exposed core pulses, radiating warning beams + energy spheres
var VoidShatteredCorePulsePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.pulseTimer = 0;
    this.damVal = config.damVal || 9;
};
VoidShatteredCorePulsePattern.prototype = Object.create(BulletPattern.prototype);
VoidShatteredCorePulsePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.pulseTimer = 0.5;
    voidParticles = [];
};
VoidShatteredCorePulsePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.pulseTimer += dt;
    updateVoidParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    if (this.pulseTimer >= 1.5 && this.elapsed < this.duration - 1.5) {
        this.pulseTimer = 0;
        var baseAngle = Math.random() * Math.PI;
        var numBeams = 6;
        if (typeof triggerShake !== "undefined") triggerShake(4, 150);
        for (var p = 0; p < 12; p++) {
            var pAngle = p * Math.PI * 2 / 12;
            spawnVoidParticle(cx, cy, Math.cos(pAngle) * 80, Math.sin(pAngle) * 80, 2.5, 0.4, "#FF00FF", 8);
        }
        for (var k = 0; k < numBeams; k++) {
            var angle = baseAngle + (k * Math.PI * 2 / numBeams);
            this.bullets.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * 130,
                vy: Math.sin(angle) * 130,
                width: 12, height: 12,
                color: "#FFFFFF", active: true
            });
        }
        Sound.playSound("impact", true);
    }
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < bb[0] - 20 || b.x > bb[2] + 20 || b.y < bb[1] - 20 || b.y > bb[3] + 20) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
VoidShatteredCorePulsePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    return BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
};
VoidShatteredCorePulsePattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    var time = Date.now() / 1000;
    
    var pRadius = 15 + Math.sin(time * 15) * 4;
    ctx.save();
    ctx.fillStyle = "#FF00FF";
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#FFFFFF";
    ctx.beginPath(); ctx.arc(cx, cy, pRadius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath(); ctx.arc(cx, cy, pRadius*0.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.save();
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#FF00FF";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF00FF";
        ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidShatteredCorePulsePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 16. voidSingularityOrbits: Multi singularity vortex orbits dragging player
var VoidSingularityOrbitsPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.orbTimer = 0;
    this.damVal = config.damVal || 8;
    this.singularities = []; // { radius, speed, angle, x, y }
};
VoidSingularityOrbitsPattern.prototype = Object.create(BulletPattern.prototype);
VoidSingularityOrbitsPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    this.singularities = [
        { rad: 55, speed: 1.8, angle: 0, x: cx, y: cy },
        { rad: 95, speed: -1.2, angle: Math.PI, x: cx, y: cy }
    ];
    voidParticles = [];
};
VoidSingularityOrbitsPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateVoidParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    for (var i = 0; i < this.singularities.length; i++) {
        var s = this.singularities[i];
        s.angle += s.speed * dt;
        s.x = cx + Math.cos(s.angle) * s.rad;
        s.y = cy + Math.sin(s.angle) * s.rad;
        
        if (Math.random() < 0.45) {
            spawnVoidParticle(s.x, s.y, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 2 + Math.random() * 2, 0.35, "#BA55D3", 6);
        }
    }
    
    if (typeof Soul !== "undefined") {
        var sPos = Soul.getPos();
        var scx = sPos.x + Soul.getWidth()/2;
        var scy = sPos.y + Soul.getHeight()/2;
        var nearest = null;
        var minDist = 9999;
        for (var i = 0; i < this.singularities.length; i++) {
            var s = this.singularities[i];
            var dist = Math.sqrt(Math.pow(scx - s.x, 2) + Math.pow(scy - s.y, 2));
            if (dist < minDist) {
                minDist = dist;
                nearest = s;
            }
        }
        if (nearest && minDist > 10) {
            Soul.setPos(
                sPos.x + ((nearest.x - scx) / minDist) * 33 * dt,
                sPos.y + ((nearest.y - scy) / minDist) * 33 * dt
            );
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
VoidSingularityOrbitsPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    for (var i = 0; i < this.singularities.length; i++) {
        var s = this.singularities[i];
        var dist = Math.sqrt(Math.pow(scx - s.x, 2) + Math.pow(scy - s.y, 2));
        if (dist < 15) return this.damVal;
    }
    return 0;
};
VoidSingularityOrbitsPattern.prototype.draw = function(ctx) {
    ctx.save();
    var time = Date.now() / 1000;
    for (var i = 0; i < this.singularities.length; i++) {
        var s = this.singularities[i];
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(time * 3);
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#BA55D3";
        ctx.fillStyle = "rgba(75, 0, 130, 0.4)";
        ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidSingularityOrbitsPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};

// 17. voidCosmicCollapse: Battle box dynamically shrinks + falling debris
var VoidCosmicCollapsePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
};
VoidCosmicCollapsePattern.prototype = Object.create(BulletPattern.prototype);
VoidCosmicCollapsePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    voidParticles = [];
};
VoidCosmicCollapsePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateVoidParticles(dt);
    var bb = Cbbox.getBound();
    
    var scaleFactor = 1.0 - Math.abs(Math.sin(this.elapsed * 1.5)) * 0.35;
    var targetW = Math.floor(320 * scaleFactor);
    var targetH = Math.floor(320 * scaleFactor);
    Cbbox.setSize(targetW, targetH, false);
    
    if (Math.random() < 0.25) {
        var side = Math.floor(Math.random() * 4);
        var px, py;
        if (side === 0) { px = bb[0]; py = bb[1] + Math.random() * (bb[3] - bb[1]); }
        else if (side === 1) { px = bb[2]; py = bb[1] + Math.random() * (bb[3] - bb[1]); }
        else if (side === 2) { px = bb[0] + Math.random() * (bb[2] - bb[0]); py = bb[1]; }
        else { px = bb[0] + Math.random() * (bb[2] - bb[0]); py = bb[3]; }
        spawnVoidParticle(px, py, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, 2, 0.3, "#FF00FF", 6);
    }
    
    if (this.spawnTimer >= 0.25 && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        var rx = bb[0] + 15 + Math.random() * (bb[2] - bb[0] - 30);
        this.bullets.push({
            x: rx, y: bb[1] - 10,
            vx: -30 + Math.random() * 60,
            vy: 110,
            width: 8, height: 8, active: true
        });
        Sound.playSound("hit_1", true);
    }
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y > bb[3] + 20) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
VoidCosmicCollapsePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    return BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
};
VoidCosmicCollapsePattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.fillStyle = "#FF00FF";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF00FF";
        ctx.fillRect(b.x - 4, b.y - 4, 8, 8);
    }
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidCosmicCollapsePattern.prototype.isOver = function() {
    var over = this.elapsed >= this.duration && this.bullets.length === 0;
    if (over) Cbbox.setSize(320, 320, false);
    return over;
};

// 18. voidEldritchCross: Two intersecting beams scan the box
var VoidEldritchCrossPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
};
VoidEldritchCrossPattern.prototype = Object.create(BulletPattern.prototype);
VoidEldritchCrossPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    voidParticles = [];
};
VoidEldritchCrossPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateVoidParticles(dt);
    var bb = Cbbox.getBound();
    var cx = bb[0] + (bb[2] - bb[0])/2 + Math.sin(this.elapsed * 1.8) * (bb[2] - bb[0] - 60)/2;
    var cy = bb[1] + (bb[3] - bb[1])/2 + Math.cos(this.elapsed * 1.8) * (bb[3] - bb[1] - 60)/2;
    
    if (Math.random() < 0.5) {
        spawnVoidParticle(cx, cy, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, 2 + Math.random() * 3, 0.35, "#FFFFFF", 8);
    }
    BulletPattern.prototype.update.call(this, dt);
};
VoidEldritchCrossPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    
    var cx = bb[0] + (bb[2] - bb[0])/2 + Math.sin(this.elapsed * 1.8) * (bb[2] - bb[0] - 60)/2;
    var cy = bb[1] + (bb[3] - bb[1])/2 + Math.cos(this.elapsed * 1.8) * (bb[3] - bb[1] - 60)/2;
    
    if (Math.abs(scx - cx) < 12 || Math.abs(scy - cy) < 12) {
        return this.damVal;
    }
    return 0;
};
VoidEldritchCrossPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var cx = bb[0] + (bb[2] - bb[0])/2 + Math.sin(this.elapsed * 1.8) * (bb[2] - bb[0] - 60)/2;
    var cy = bb[1] + (bb[3] - bb[1])/2 + Math.cos(this.elapsed * 1.8) * (bb[3] - bb[1] - 60)/2;
    
    ctx.strokeStyle = "#EE82EE";
    ctx.lineWidth = 14;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#FF00FF";
    ctx.beginPath();
    ctx.moveTo(cx, bb[1]); ctx.lineTo(cx, bb[3]);
    ctx.moveTo(bb[0], cy); ctx.lineTo(bb[2], cy);
    ctx.stroke();
    
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, bb[1]); ctx.lineTo(cx, bb[3]);
    ctx.moveTo(bb[0], cy); ctx.lineTo(bb[2], cy);
    ctx.stroke();
    
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidEldritchCrossPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};

// 19. voidInventoryPurge: Tongue grabs item, explodes it in a ring of 8 stars
var VoidInventoryPurgePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
    
    this.tongueX = 370;
    this.tongueY = 80;
    this.targetX = 370;
    this.targetY = 250;
    this.phase = 0;
    this.timer = 0;
    this.purgeTriggered = false;
};
VoidInventoryPurgePattern.prototype = Object.create(BulletPattern.prototype);
VoidInventoryPurgePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.phase = 0;
    this.timer = 0.7;
    this.purgeTriggered = false;
    this.tongueX = 370;
    this.tongueY = 80;
    voidParticles = [];
    if (typeof Soul !== "undefined") {
        var sPos = Soul.getPos();
        this.targetX = sPos.x + Soul.getWidth()/2;
        this.targetY = sPos.y + Soul.getHeight()/2;
    }
};
VoidInventoryPurgePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateVoidParticles(dt);
    var bb = Cbbox.getBound();
    if (this.phase === 0) {
        this.timer -= dt;
        if (this.timer <= 0) {
            this.phase = 1;
            this.timer = 0.22;
            Sound.playSound("laser", true);
        }
    } else if (this.phase === 1) {
        this.timer -= dt;
        var pct = Math.min(1.0, 1 - (this.timer / 0.22));
        this.tongueX = 370 + (this.targetX - 370) * pct;
        this.tongueY = 80 + (this.targetY - 80) * pct;
        if (this.timer <= 0) {
            this.phase = 2;
            this.timer = 0.35;
        }
    } else if (this.phase === 2) {
        this.timer -= dt;
        if (!this.purgeTriggered) {
            this.purgeTriggered = true;
            Sound.playSound("impact", true);
            if (typeof triggerShake !== "undefined") triggerShake(10, 250);
            
            for (var p = 0; p < 25; p++) {
                var angle = Math.random() * Math.PI * 2;
                var sp = 80 + Math.random() * 90;
                spawnVoidParticle(this.tongueX, this.tongueY, Math.cos(angle) * sp, Math.sin(angle) * sp, 3 + Math.random() * 3, 0.5, "#FF00FF", 10);
            }
            
            var numBullets = 8;
            for (var k = 0; k < numBullets; k++) {
                var angle = k * Math.PI * 2 / numBullets;
                this.bullets.push({
                    x: this.tongueX, y: this.tongueY,
                    vx: Math.cos(angle) * 140,
                    vy: Math.sin(angle) * 140,
                    width: 10, height: 10, active: true
                });
            }
        }
        if (this.timer <= 0) {
            this.phase = 3;
            this.timer = 0.3;
        }
    } else if (this.phase === 3) {
        this.timer -= dt;
        var pct = Math.max(0.0, this.timer / 0.3);
        this.tongueX = 370 + (this.targetX - 370) * pct;
        this.tongueY = 80 + (this.targetY - 80) * pct;
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < bb[0] - 20 || b.x > bb[2] + 20 || b.y < bb[1] - 20 || b.y > bb[3] + 20) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
VoidInventoryPurgePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var dmg = BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
    if (dmg > 0) return dmg;
    
    if (this.phase === 1 || this.phase === 2) {
        var dist = Math.sqrt(Math.pow((sx+sw/2) - this.tongueX, 2) + Math.pow((sy+sh/2) - this.tongueY, 2));
        if (dist < 14 + sw/2) return this.damVal;
    }
    return 0;
};
VoidInventoryPurgePattern.prototype.draw = function(ctx) {
    ctx.save();
    var time = Date.now() / 1000;
    if (this.phase === 0) {
        ctx.strokeStyle = "rgba(255, 0, 0, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(370, 80); ctx.lineTo(this.targetX, this.targetY); ctx.stroke();
    }
    if (this.phase > 0) {
        ctx.save();
        ctx.strokeStyle = "#8B008B";
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(370, 80);
        ctx.lineTo(this.tongueX, this.tongueY);
        ctx.stroke();
        ctx.fillStyle = "#BA55D3";
        ctx.beginPath(); ctx.arc(this.tongueX, this.tongueY, 11, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.save();
        ctx.fillStyle = "#FF00FF";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF00FF";
        ctx.fillRect(b.x - 5, b.y - 5, 10, 10);
        ctx.restore();
    }
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidInventoryPurgePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 20. voidWormholeJump: Bullet portals open; energy spheres teleport between wormholes
var VoidWormholeJumpPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
    this.wormholes = []; // { x, y, type: "blue"|"orange" }
};
VoidWormholeJumpPattern.prototype = Object.create(BulletPattern.prototype);
VoidWormholeJumpPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    var bb = Cbbox.getBound();
    this.wormholes = [
        { x: bb[0] + 50, y: bb[1] + 50, type: "blue" },
        { x: bb[2] - 50, y: bb[3] - 50, type: "orange" }
    ];
    voidParticles = [];
};
VoidWormholeJumpPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateVoidParticles(dt);
    var bb = Cbbox.getBound();
    
    for (var wIdx = 0; wIdx < this.wormholes.length; wIdx++) {
        var w = this.wormholes[wIdx];
        if (Math.random() < 0.35) {
            var angle = Math.random() * Math.PI * 2;
            var r = 14;
            var px = w.x + Math.cos(angle) * r;
            var py = w.y + Math.sin(angle) * r;
            spawnVoidParticle(px, py, -Math.cos(angle) * 30, -Math.sin(angle) * 30, 2, 0.4, w.type === "blue" ? "#00BFFF" : "#FF8C00", 6);
        }
    }
    
    if (this.spawnTimer >= 0.40 && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        var angle = Math.random() * Math.PI * 2;
        var r = 100;
        this.bullets.push({
            x: this.wormholes[0].x + Math.cos(angle) * r,
            y: this.wormholes[0].y + Math.sin(angle) * r,
            vx: -Math.cos(angle) * 110,
            vy: -Math.sin(angle) * 110,
            width: 10, height: 10, active: true, teleported: false
        });
        Sound.playSound("laser", true);
    }
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        
        var bulletColor = b.teleported ? "#FF8C00" : "#00BFFF";
        if (Math.random() < 0.3) {
            spawnVoidParticle(b.x, b.y, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, 2, 0.2, bulletColor, 5);
        }
        
        if (!b.teleported) {
            var distToBlue = Math.sqrt(Math.pow(b.x - this.wormholes[0].x, 2) + Math.pow(b.y - this.wormholes[0].y, 2));
            if (distToBlue < 12) {
                b.x = this.wormholes[1].x;
                b.y = this.wormholes[1].y;
                b.teleported = true;
                Sound.playSound("ting", true);
                for (var p = 0; p < 6; p++) {
                    spawnVoidParticle(b.x, b.y, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, 2, 0.25, "#FF8C00", 6);
                }
            }
        }
        
        if (b.x < bb[0] - 20 || b.x > bb[2] + 20 || b.y < bb[1] - 20 || b.y > bb[3] + 20) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
VoidWormholeJumpPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    return BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
};
VoidWormholeJumpPattern.prototype.draw = function(ctx) {
    ctx.save();
    var time = Date.now() / 1000;
    
    for (var i = 0; i < this.wormholes.length; i++) {
        var w = this.wormholes[i];
        ctx.save();
        ctx.translate(w.x, w.y);
        ctx.rotate(time * 4);
        ctx.fillStyle = w.type === "blue" ? "#00BFFF" : "#FF8C00";
        ctx.shadowBlur = 12;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.fillStyle = b.teleported ? "#FF8C00" : "#00BFFF";
        ctx.fillRect(b.x - 5, b.y - 5, 10, 10);
    }
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidWormholeJumpPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 21. voidBlackHoleNova: Massive central suction followed by expanding shockwave
var VoidBlackHoleNovaPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.damVal = config.damVal || 12;
    this.exploded = false;
    this.explosionRadius = 0;
    this.flashAlpha = 0;
};
VoidBlackHoleNovaPattern.prototype = Object.create(BulletPattern.prototype);
VoidBlackHoleNovaPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.exploded = false;
    this.explosionRadius = 0;
    this.flashAlpha = 0;
    voidParticles = [];
};
VoidBlackHoleNovaPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateVoidParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    if (this.elapsed < 4.0) {
        if (Math.random() < 0.5) {
            var angle = Math.random() * Math.PI * 2;
            var r = 120 + Math.random() * 50;
            spawnVoidParticle(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, -Math.cos(angle) * 160, -Math.sin(angle) * 160, 2 + Math.random() * 2, 0.6, "#FF00FF", 6);
        }
        
        if (typeof Soul !== "undefined") {
            var sPos = Soul.getPos();
            var scx = sPos.x + Soul.getWidth()/2;
            var scy = sPos.y + Soul.getHeight()/2;
            var dx = cx - scx;
            var dy = cy - scy;
            var dist = Math.sqrt(dx*dx + dy*dy) || 1;
            Soul.setPos(
                sPos.x + (dx / dist) * 45 * dt,
                sPos.y + (dy / dist) * 45 * dt
            );
        }
    } else {
        if (!this.exploded) {
            this.exploded = true;
            this.flashAlpha = 1.0;
            Sound.playSound("impact", true);
            if (typeof triggerShake !== "undefined") triggerShake(18, 350);
            
            for (var p = 0; p < 40; p++) {
                var angle = Math.random() * Math.PI * 2;
                var sp = 120 + Math.random() * 150;
                spawnVoidParticle(cx, cy, Math.cos(angle) * sp, Math.sin(angle) * sp, 3.5 + Math.random() * 4, 0.6, "#FFFFFF", 12);
            }
        }
        this.explosionRadius += 350 * dt;
        this.flashAlpha = Math.max(0.0, this.flashAlpha - 1.2 * dt);
    }
    BulletPattern.prototype.update.call(this, dt);
};
VoidBlackHoleNovaPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    if (!this.exploded) return 0;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    var dist = Math.sqrt(Math.pow(scx - cx, 2) + Math.pow(scy - cy, 2));
    if (Math.abs(dist - this.explosionRadius) < 22) {
        return this.damVal;
    }
    return 0;
};
VoidBlackHoleNovaPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    var time = Date.now() / 1000;
    
    if (!this.exploded) {
        var pulse = 20 + Math.sin(time * 18) * 5;
        var grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, pulse + 20);
        grad.addColorStop(0, "#000000");
        grad.addColorStop(0.4, "#4B0082");
        grad.addColorStop(0.8, "#FF00FF");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, pulse + 20, 0, Math.PI * 2); ctx.fill();
    } else {
        ctx.strokeStyle = "rgba(255, 255, 255, " + (this.flashAlpha + 0.2) + ")";
        ctx.lineWidth = 14;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#FF00FF";
        ctx.beginPath();
        ctx.arc(cx, cy, this.explosionRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        if (this.flashAlpha > 0) {
            ctx.fillStyle = "rgba(255, 255, 255, " + (this.flashAlpha * 0.45) + ")";
            ctx.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
        }
    }
    ctx.restore();
    drawVoidParticles(ctx);
};
VoidBlackHoleNovaPattern.prototype.isOver = function() {
    var bb = Cbbox.getBound();
    var width = bb[2] - bb[0];
    return this.exploded && this.explosionRadius > width * 0.8;
};
