// billPatterns.js — 21 Unique Bill Cipher themed patterns for LUNDERTALE

// Helper function to draw warning lines or simple shapes if needed
var billParticles = [];
function updateBillParticles(dt) {
    for (var i = billParticles.length - 1; i >= 0; i--) {
        var p = billParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) billParticles.splice(i, 1);
    }
}
function drawBillParticles(ctx) {
    ctx.save();
    for (var i = 0; i < billParticles.length; i++) {
        var p = billParticles[i];
        ctx.fillStyle = p.color || "#00FFFF";
        ctx.shadowBlur = p.glow || 8;
        ctx.shadowColor = p.color || "#00FFFF";
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    }
    ctx.restore();
}
function spawnBillParticle(x, y, vx, vy, size, life, color, glow) {
    billParticles.push({
        x: x, y: y,
        vx: vx, vy: vy,
        size: size,
        life: life,
        color: color,
        glow: glow
    });
}

// ==========================================
// PHASE 1 PATTERNS (Yellow / Classic)
// ==========================================

// 1. billEyeLasers: Blinking lasers that sweep across the box
var BillEyeLasersPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.laserTimer = 0;
    this.damVal = config.damVal || 8;
    this.lasers = []; // { x, angle, targetAngle, speed, warning, active }
};
BillEyeLasersPattern.prototype = Object.create(BulletPattern.prototype);
BillEyeLasersPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.laserTimer = 0.5;
    this.lasers = [];
    billParticles = [];
};
BillEyeLasersPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.laserTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    if (this.laserTimer >= 1.4 && this.elapsed < this.duration - 1.5) {
        this.laserTimer = 0;
        var cx = (bb[0] + bb[2]) / 2;
        var startAngle = Math.PI / 4 + Math.random() * Math.PI / 2; // facing down-ish
        var targetAngle = startAngle + (Math.random() > 0.5 ? 0.8 : -0.8);
        this.lasers.push({
            x: cx,
            y: bb[1] - 15,
            angle: startAngle,
            targetAngle: targetAngle,
            warning: 0.9,
            active: 0.7,
            speed: (targetAngle - startAngle) / 0.7
        });
        Sound.playSound("laser", true);
    }
    
    for (var i = this.lasers.length - 1; i >= 0; i--) {
        var l = this.lasers[i];
        if (l.warning > 0) {
            l.warning -= dt;
        } else if (l.active > 0) {
            l.active -= dt;
            l.angle += l.speed * dt;
            if (Math.random() < 0.3) {
                var len = 100 + Math.random() * 200;
                var lx = l.x + Math.cos(l.angle) * len;
                var ly = l.y + Math.sin(l.angle) * len;
                spawnBillParticle(lx, ly, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, 3, 0.4, "#FFFF00", 8);
            }
            if (l.active <= 0) {
                this.lasers.splice(i, 1);
            }
        }
    }
};
BillEyeLasersPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.warning <= 0 && l.active > 0) {
            // Distance from player center to line: d = |(y2-y1)*x0 - (x2-x1)*y0 + x2*y1 - y2*x1| / L
            var x2 = l.x + Math.cos(l.angle) * 500;
            var y2 = l.y + Math.sin(l.angle) * 500;
            var num = Math.abs((y2 - l.y)*scx - (x2 - l.x)*scy + x2*l.y - y2*l.x);
            var den = Math.sqrt(Math.pow(y2 - l.y, 2) + Math.pow(x2 - l.x, 2));
            var dist = num / (den || 1);
            if (dist < 12) return this.damVal;
        }
    }
    return 0;
};
BillEyeLasersPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        var x2 = l.x + Math.cos(l.angle) * 600;
        var y2 = l.y + Math.sin(l.angle) * 600;
        
        if (l.warning > 0) {
            ctx.save();
            ctx.strokeStyle = "rgba(255, 0, 0, 0.4)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(l.x, l.y);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.restore();
        } else if (l.active > 0) {
            ctx.save();
            ctx.strokeStyle = "#FFFF00";
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#FFD700";
            ctx.lineWidth = 14 * (l.active / 0.7);
            ctx.beginPath();
            ctx.moveTo(l.x, l.y);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 4 * (l.active / 0.7);
            ctx.stroke();
            ctx.restore();
        }
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillEyeLasersPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.lasers.length === 0;
};

// 2. billCipherWheel: Rotating symbols that shoot inwards
var BillCipherWheelPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.shootTimer = 0;
    this.damVal = config.damVal || 8;
};
BillCipherWheelPattern.prototype = Object.create(BulletPattern.prototype);
BillCipherWheelPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.shootTimer = 0;
    billParticles = [];
};
BillCipherWheelPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.shootTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    if (this.shootTimer >= 0.40 && this.elapsed < this.duration - 1.2) {
        this.shootTimer = 0;
        var r = 160;
        var angle = (this.elapsed * 1.5) + (Math.random() * 0.5);
        // Shoot inward
        var sx = cx + Math.cos(angle) * r;
        var sy = cy + Math.sin(angle) * r;
        
        var targetX = cx + (Math.random() - 0.5) * 40;
        var targetY = cy + (Math.random() - 0.5) * 40;
        var shootAngle = Math.atan2(targetY - sy, targetX - sx);
        
        this.bullets.push({
            x: sx,
            y: sy,
            vx: Math.cos(shootAngle) * 130,
            vy: Math.sin(shootAngle) * 130,
            width: 12, height: 12,
            active: true
        });
        Sound.playSound("hit_1", true);
        
        for (var p = 0; p < 3; p++) {
            spawnBillParticle(sx, sy, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, 2, 0.3, "#00FFFF", 5);
        }
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        
        if (b.x < bb[0] - 15 || b.x > bb[2] + 15 || b.y < bb[1] - 15 || b.y > bb[3] + 15) {
            this.bullets.splice(i, 1);
        }
    }
};
BillCipherWheelPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    ctx.save();
    // Draw rotating outline of the cipher wheel
    ctx.strokeStyle = "rgba(0, 255, 255, 0.15)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 160, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw central eye glow
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fill();
    
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.save();
        ctx.fillStyle = "#00FFFF";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#00FFFF";
        ctx.fillRect(b.x - 6, b.y - 6, 12, 12);
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillCipherWheelPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 3. billDealBlueFire: Spawn warning zones, followed by blue fire walls closing in
var BillDealBlueFirePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
    this.fires = []; // { x, y, warning, active, vx, vy }
};
BillDealBlueFirePattern.prototype = Object.create(BulletPattern.prototype);
BillDealBlueFirePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.fires = [];
    billParticles = [];
};
BillDealBlueFirePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 0.85 && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        // Spawn from edges targeting player
        if (typeof Soul !== "undefined") {
            var sPos = Soul.getPos();
            var px = sPos.x + Soul.getWidth()/2;
            var py = sPos.y + Soul.getHeight()/2;
            
            var side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
            var sx, sy;
            if (side === 0) { sx = bb[0] + Math.random() * (bb[2] - bb[0]); sy = bb[1] - 10; }
            else if (side === 1) { sx = bb[2] + 10; sy = bb[1] + Math.random() * (bb[3] - bb[1]); }
            else if (side === 2) { sx = bb[0] + Math.random() * (bb[2] - bb[0]); sy = bb[3] + 10; }
            else { sx = bb[0] - 10; sy = bb[1] + Math.random() * (bb[3] - bb[1]); }
            
            var angle = Math.atan2(py - sy, px - sx);
            
            this.fires.push({
                x: sx,
                y: sy,
                vx: Math.cos(angle) * 110,
                vy: Math.sin(angle) * 110,
                warning: 0.6,
                active: 1.8
            });
            Sound.playSound("laser", true);
        }
    }
    
    for (var i = this.fires.length - 1; i >= 0; i--) {
        var f = this.fires[i];
        if (f.warning > 0) {
            f.warning -= dt;
        } else {
            f.active -= dt;
            f.x += f.vx * dt;
            f.y += f.vy * dt;
            if (Math.random() < 0.25) {
                spawnBillParticle(f.x, f.y, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, 2 + Math.random() * 2, 0.4, "#00BFFF", 6);
            }
            if (f.active <= 0 || f.x < bb[0] - 30 || f.x > bb[2] + 30 || f.y < bb[1] - 30 || f.y > bb[3] + 30) {
                this.fires.splice(i, 1);
            }
        }
    }
};
BillDealBlueFirePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    for (var i = 0; i < this.fires.length; i++) {
        var f = this.fires[i];
        if (f.warning <= 0) {
            var dist = Math.sqrt(Math.pow(scx - f.x, 2) + Math.pow(scy - f.y, 2));
            if (dist < 12 + sw/2) return this.damVal;
        }
    }
    return 0;
};
BillDealBlueFirePattern.prototype.draw = function(ctx) {
    ctx.save();
    var time = Date.now() / 1000;
    for (var i = 0; i < this.fires.length; i++) {
        var f = this.fires[i];
        ctx.save();
        if (f.warning > 0) {
            ctx.fillStyle = "rgba(0, 191, 255, 0.2)";
            ctx.beginPath();
            ctx.arc(f.x, f.y, 14, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#00BFFF";
            ctx.fillStyle = "#1E90FF";
            
            // Draw a flame shape
            ctx.beginPath();
            var size = 10 + Math.sin(time * 20) * 2;
            ctx.arc(f.x, f.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.arc(f.x, f.y, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillDealBlueFirePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.fires.length === 0;
};

// 4. billHatDrop: Yellow-bordered black hats dropping from ceiling
var BillHatDropPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
};
BillHatDropPattern.prototype = Object.create(BulletPattern.prototype);
BillHatDropPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    billParticles = [];
};
BillHatDropPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 0.50 && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        var rx = bb[0] + 15 + Math.random() * (bb[2] - bb[0] - 30);
        this.bullets.push({
            x: rx,
            y: bb[1] - 15,
            vy: 110,
            width: 24,
            height: 18,
            bounced: false,
            active: true
        });
        Sound.playSound("hit_1", true);
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.y += b.vy * dt;
        
        // Bounce once on floor
        if (!b.bounced && b.y >= bb[3] - 12) {
            b.y = bb[3] - 12;
            b.vy = -70; // Bounce up
            b.bounced = true;
            Sound.playSound("ting", true);
            for (var p = 0; p < 5; p++) {
                spawnBillParticle(b.x, b.y, (Math.random() - 0.5) * 50, -Math.random() * 40, 2, 0.3, "#FFFF00", 6);
            }
        } else if (b.bounced && b.vy < 0 && b.y <= bb[3] - 45) {
            b.vy = 100; // Drop down again
        } else if (b.bounced && b.y > bb[3] + 15) {
            this.bullets.splice(i, 1);
        }
    }
};
BillHatDropPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.fillStyle = "#000000";
        ctx.strokeStyle = "#FFFF00";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#FFFF00";
        
        // Draw top hat
        ctx.fillRect(-10, -6, 20, 10);
        ctx.strokeRect(-10, -6, 20, 10);
        
        // Brim
        ctx.fillRect(-14, 4, 28, 3);
        ctx.strokeRect(-14, 4, 28, 3);
        
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillHatDropPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 5. billCaneSwack: A cane sweeps/swacks the player horizontally
var BillCaneSwackPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.swackTimer = 0;
    this.damVal = config.damVal || 8;
    this.canes = []; // { x, y, width, height, vx, dir, active, angle }
};
BillCaneSwackPattern.prototype = Object.create(BulletPattern.prototype);
BillCaneSwackPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.swackTimer = 0.5;
    this.canes = [];
    billParticles = [];
};
BillCaneSwackPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.swackTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    if (this.swackTimer >= 1.6 && this.elapsed < this.duration - 1.5) {
        this.swackTimer = 0;
        var side = Math.random() > 0.5; // Left to right or right to left
        var ry = bb[1] + 20 + Math.random() * (bb[3] - bb[1] - 40);
        this.canes.push({
            x: side ? bb[0] - 20 : bb[2] + 20,
            y: ry,
            w: 80,
            h: 8,
            vx: side ? 160 : -160,
            angle: side ? 0.3 : -0.3,
            rotSpeed: side ? 3 : -3,
            active: true
        });
        Sound.playSound("laser", true);
    }
    
    for (var i = this.canes.length - 1; i >= 0; i--) {
        var c = this.canes[i];
        c.x += c.vx * dt;
        c.angle += c.rotSpeed * dt;
        if (Math.random() < 0.2) {
            spawnBillParticle(c.x, c.y, -c.vx * 0.1, (Math.random() - 0.5) * 20, 2, 0.25, "#FFFF00", 5);
        }
        if (c.x < bb[0] - 100 || c.x > bb[2] + 100) {
            this.canes.splice(i, 1);
        }
    }
};
BillCaneSwackPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    for (var i = 0; i < this.canes.length; i++) {
        var c = this.canes[i];
        var dist = Math.sqrt(Math.pow(scx - c.x, 2) + Math.pow(scy - c.y, 2));
        // Simple bounding circle check for rotating cane
        if (dist < 35 + sw/2) return this.damVal;
    }
    return 0;
};
BillCaneSwackPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.canes.length; i++) {
        var c = this.canes[i];
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.angle);
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FFFF00";
        ctx.fillStyle = "#000000";
        ctx.strokeStyle = "#FFFF00";
        ctx.lineWidth = 2;
        
        // Draw cane hook
        ctx.fillRect(-25, -2, 50, 4);
        ctx.strokeRect(-25, -2, 50, 4);
        
        ctx.beginPath();
        ctx.arc(23, -6, 6, 0, Math.PI, true);
        ctx.stroke();
        
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillCaneSwackPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.canes.length === 0;
};

// 6. billTriangleBeams: Triangles expanding from center
var BillTriangleBeamsPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
    this.triangles = []; // { cx, cy, size, maxScale, scaleSpeed, rot, rotSpeed, active }
};
BillTriangleBeamsPattern.prototype = Object.create(BulletPattern.prototype);
BillTriangleBeamsPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.triangles = [];
    billParticles = [];
};
BillTriangleBeamsPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    if (this.spawnTimer >= 1.3 && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        this.triangles.push({
            x: cx,
            y: cy,
            size: 5,
            maxScale: 110,
            scaleSpeed: 80,
            rot: Math.random() * Math.PI,
            rotSpeed: 0.7,
            active: true
        });
        Sound.playSound("laser", true);
    }
    
    for (var i = this.triangles.length - 1; i >= 0; i--) {
        var t = this.triangles[i];
        t.size += t.scaleSpeed * dt;
        t.rot += t.rotSpeed * dt;
        if (t.size >= t.maxScale) {
            this.triangles.splice(i, 1);
        }
    }
};
BillTriangleBeamsPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    for (var i = 0; i < this.triangles.length; i++) {
        var t = this.triangles[i];
        // Collision if player touches the expanding border of the triangle
        var dist = Math.sqrt(Math.pow(scx - t.x, 2) + Math.pow(scy - t.y, 2));
        var thickness = 10;
        if (Math.abs(dist - t.size * 0.7) < thickness && t.size > 20) {
            return this.damVal;
        }
    }
    return 0;
};
BillTriangleBeamsPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.triangles.length; i++) {
        var t = this.triangles[i];
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.rot);
        ctx.strokeStyle = "#FFFF00";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FFFF00";
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        // Equilateral triangle coordinates
        ctx.moveTo(0, -t.size);
        ctx.lineTo(t.size * 0.86, t.size * 0.5);
        ctx.lineTo(-t.size * 0.86, t.size * 0.5);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillTriangleBeamsPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.triangles.length === 0;
};

// 7. billPyramidTrap: Four yellow bars closing in on the player
var BillPyramidTrapPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.trapScale = 1.0;
};
BillPyramidTrapPattern.prototype = Object.create(BulletPattern.prototype);
BillPyramidTrapPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.trapScale = 1.6;
    billParticles = [];
};
BillPyramidTrapPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateBillParticles(dt);
    
    // Scale trap down slowly over time
    if (this.elapsed < 4.5) {
        this.trapScale = 1.6 - (this.elapsed / 4.5) * 1.05; // scales down to 0.55
    } else if (this.elapsed >= 6.0) {
        this.trapScale = 0.55 + ((this.elapsed - 6.0) / 1.5) * 1.5; // expands back
    }
    
    if (Math.random() < 0.2 && this.elapsed < this.duration - 1) {
        var bb = Cbbox.getBound();
        var cx = (bb[0] + bb[2]) / 2;
        var cy = (bb[1] + bb[3]) / 2;
        spawnBillParticle(cx + (Math.random() - 0.5) * 50, cy + (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, 2, 0.4, "#FFFF00", 5);
    }
};
BillPyramidTrapPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    if (this.elapsed >= this.duration - 0.5) return 0;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    
    // Boundaries of the trap box
    var sizeX = 75 * this.trapScale;
    var sizeY = 75 * this.trapScale;
    
    var left = cx - sizeX;
    var right = cx + sizeX;
    var top = cy - sizeY;
    var bottom = cy + sizeY;
    
    // Collides if player touches or is outside the closing square trap
    if (Math.abs(scx - left) < 6 || Math.abs(scx - right) < 6 || Math.abs(scy - top) < 6 || Math.abs(scy - bottom) < 6) {
        return this.damVal;
    }
    // Also hurt if completely outside!
    if (scx < left || scx > right || scy < top || scy > bottom) {
        return this.damVal;
    }
    return 0;
};
BillPyramidTrapPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    var sizeX = 75 * this.trapScale;
    var sizeY = 75 * this.trapScale;
    
    ctx.save();
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#FFFF00";
    
    ctx.strokeRect(cx - sizeX, cy - sizeY, sizeX * 2, sizeY * 2);
    
    // Draw warnings lines connecting from outer box to trap corners
    ctx.strokeStyle = "rgba(255, 0, 0, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bb[0], bb[1]); ctx.lineTo(cx - sizeX, cy - sizeY);
    ctx.moveTo(bb[2], bb[1]); ctx.lineTo(cx + sizeX, cy - sizeY);
    ctx.moveTo(bb[0], bb[3]); ctx.lineTo(cx - sizeX, cy + sizeY);
    ctx.moveTo(bb[2], bb[3]); ctx.lineTo(cx + sizeX, cy + sizeY);
    ctx.stroke();
    
    ctx.restore();
    drawBillParticles(ctx);
};
BillPyramidTrapPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};

// ==========================================
// PHASE 2 PATTERNS (Weirdmageddon / Red Madness)
// ==========================================

// 8. billMadnessBubbles: Shifting colorful bubbles bouncing on borders
var BillMadnessBubblesPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 9;
};
BillMadnessBubblesPattern.prototype = Object.create(BulletPattern.prototype);
BillMadnessBubblesPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    billParticles = [];
};
BillMadnessBubblesPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 0.50 && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        var cx = (bb[0] + bb[2]) / 2;
        var colors = ["#FF1493", "#FF8C00", "#7CFC00", "#00FFFF", "#DDA0DD", "#FF0000"];
        this.bullets.push({
            x: cx,
            y: bb[1] + 15,
            vx: -90 + Math.random() * 180,
            vy: 70 + Math.random() * 60,
            width: 16, height: 16,
            color: colors[Math.floor(Math.random() * colors.length)],
            active: true
        });
        Sound.playSound("hit_1", true);
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        
        // Bounce on sides
        if (b.x < bb[0] + 10) { b.x = bb[0] + 10; b.vx = -b.vx; }
        if (b.x > bb[2] - 10) { b.x = bb[2] - 10; b.vx = -b.vx; }
        if (b.y < bb[1] + 10) { b.y = bb[1] + 10; b.vy = -b.vy; }
        if (b.y > bb[3] - 10) { b.y = bb[3] - 10; b.vy = -b.vy; }
        
        if (Math.random() < 0.15) {
            spawnBillParticle(b.x, b.y, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, 2, 0.25, b.color, 4);
        }
    }
};
BillMadnessBubblesPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = b.color;
        ctx.globalAlpha = 0.85;
        
        ctx.beginPath();
        ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Bubble highlight
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(b.x - 3, b.y - 3, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillMadnessBubblesPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 9. billTimeGlitch: Drops falling down + player lag coordinate shifting
var BillTimeGlitchPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.glitchTimer = 0;
    this.damVal = config.damVal || 8;
};
BillTimeGlitchPattern.prototype = Object.create(BulletPattern.prototype);
BillTimeGlitchPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.glitchTimer = 0;
    billParticles = [];
};
BillTimeGlitchPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    this.glitchTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    // Spawn falling pixels
    if (this.spawnTimer >= 0.18 && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        var rx = bb[0] + 15 + Math.random() * (bb[2] - bb[0] - 30);
        this.bullets.push({
            x: rx,
            y: bb[1] - 10,
            vx: 0,
            vy: 130 + Math.random() * 40,
            width: 10, height: 10,
            active: true
        });
    }
    
    // Trigger motion glitches (shifts soul position slightly)
    if (this.glitchTimer >= 1.1 && this.elapsed < this.duration - 1.0) {
        this.glitchTimer = 0;
        if (typeof Soul !== "undefined") {
            var sPos = Soul.getPos();
            var shiftX = (Math.random() - 0.5) * 32;
            var shiftY = (Math.random() - 0.5) * 32;
            // Shift pos, bound to box
            var newX = Math.max(bb[0] + 10, Math.min(bb[2] - 26, sPos.x + shiftX));
            var newY = Math.max(bb[1] + 10, Math.min(bb[3] - 26, sPos.y + shiftY));
            Soul.setPos(newX, newY);
            Sound.playSound("damage", true); // Glitch sound
            
            // Particles
            for (var p = 0; p < 8; p++) {
                spawnBillParticle(newX + 8, newY + 8, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, 3, 0.3, "#FF0055", 10);
            }
        }
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.y += b.vy * dt;
        if (b.y > bb[3] + 15) {
            this.bullets.splice(i, 1);
        }
    }
};
BillTimeGlitchPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.fillStyle = "#FF0055";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#FF0000";
        ctx.fillRect(b.x - 5, b.y - 5, 10, 10);
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillTimeGlitchPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 10. billDimensionalRift: Cracked rift across box firing shards horizontally
var BillDimensionalRiftPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
};
BillDimensionalRiftPattern.prototype = Object.create(BulletPattern.prototype);
BillDimensionalRiftPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    billParticles = [];
};
BillDimensionalRiftPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    var cy = (bb[1] + bb[3]) / 2;
    
    if (this.spawnTimer >= 0.28 && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        var dir = Math.random() > 0.5; // Left or right
        this.bullets.push({
            x: dir ? bb[0] - 10 : bb[2] + 10,
            y: cy + (Math.random() - 0.5) * 50,
            vx: dir ? 160 : -160,
            vy: (Math.random() - 0.5) * 30,
            width: 14, height: 8,
            active: true
        });
        Sound.playSound("hit_1", true);
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < bb[0] - 20 || b.x > bb[2] + 20) {
            this.bullets.splice(i, 1);
        }
    }
};
BillDimensionalRiftPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cy = (bb[1] + bb[3]) / 2;
    ctx.save();
    
    // Draw the central rift crack
    ctx.strokeStyle = "rgba(255, 0, 255, 0.4)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bb[0], cy + Math.sin(Date.now()/100) * 10);
    ctx.lineTo(bb[2], cy - Math.sin(Date.now()/100) * 10);
    ctx.stroke();
    
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.save();
        ctx.fillStyle = "#FF00FF";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF00FF";
        // Draw triangular shard pointing in direction
        ctx.translate(b.x, b.y);
        ctx.beginPath();
        ctx.moveTo(b.vx > 0 ? 8 : -8, 0);
        ctx.lineTo(b.vx > 0 ? -8 : 8, -4);
        ctx.lineTo(b.vx > 0 ? -8 : 8, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillDimensionalRiftPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 11. billWeirdmageddonRain: Rain of keys, eyeballs and teeth dropping from top
var BillWeirdmageddonRainPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
};
BillWeirdmageddonRainPattern.prototype = Object.create(BulletPattern.prototype);
BillWeirdmageddonRainPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    billParticles = [];
};
BillWeirdmageddonRainPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 0.24 && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        var rx = bb[0] + 15 + Math.random() * (bb[2] - bb[0] - 30);
        var rainTypes = ["eye", "teeth", "key"];
        this.bullets.push({
            x: rx,
            y: bb[1] - 15,
            vy: 110 + Math.random() * 40,
            width: 12, height: 12,
            type: rainTypes[Math.floor(Math.random() * rainTypes.length)],
            angle: Math.random() * Math.PI * 2,
            rotSpeed: -2 + Math.random() * 4,
            active: true
        });
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.y += b.vy * dt;
        b.angle += b.rotSpeed * dt;
        if (b.y > bb[3] + 15) {
            this.bullets.splice(i, 1);
        }
    }
};
BillWeirdmageddonRainPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#FF4500";
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#FF4500";
        ctx.fillStyle = "#FFFFFF";
        
        if (b.type === "eye") {
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#FF0000";
            ctx.beginPath();
            ctx.arc(-1, -1, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (b.type === "teeth") {
            ctx.fillStyle = "#FFFFE0";
            ctx.beginPath();
            ctx.moveTo(-5, -5);
            ctx.lineTo(5, -5);
            ctx.lineTo(3, 5);
            ctx.lineTo(-3, 5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else { // key
            ctx.fillStyle = "#FFD700";
            ctx.strokeStyle = "#FFD700";
            ctx.fillRect(-2, -6, 4, 12);
            ctx.beginPath();
            ctx.arc(0, -6, 4, 0, Math.PI*2);
            ctx.stroke();
            ctx.fillRect(-2, 4, 6, 2);
        }
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillWeirdmageddonRainPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 12. billFloatingPyramids: Giant floating red pyramids that explode
var BillFloatingPyramidsPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 9;
};
BillFloatingPyramidsPattern.prototype = Object.create(BulletPattern.prototype);
BillFloatingPyramidsPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    billParticles = [];
};
BillFloatingPyramidsPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 1.5 && this.elapsed < this.duration - 2.0) {
        this.spawnTimer = 0;
        var rx = bb[0] + 40 + Math.random() * (bb[2] - bb[0] - 80);
        this.bullets.push({
            x: rx,
            y: bb[1] - 30,
            vy: 90,
            width: 32, height: 32,
            isGiant: true,
            active: true
        });
        Sound.playSound("hit_2_crit", true);
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.y += b.vy * dt;
        
        // Explode halfway down the box or near bottom
        var cy = (bb[1] + bb[3])/2;
        if (b.isGiant && b.y >= cy + (Math.random() - 0.5) * 30) {
            b.active = false;
            this.bullets.splice(i, 1);
            
            // Spawn 6 small spikes
            for (var k = 0; k < 6; k++) {
                var angle = k * Math.PI / 3;
                this.bullets.push({
                    x: b.x,
                    y: b.y,
                    vx: Math.cos(angle) * 110,
                    vy: Math.sin(angle) * 110,
                    width: 10, height: 10,
                    isGiant: false,
                    active: true
                });
            }
            Sound.playSound("impact", true);
            if (typeof triggerShake !== "undefined") triggerShake(5, 150);
            for (var p = 0; p < 8; p++) {
                spawnBillParticle(b.x, b.y, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, 3, 0.4, "#FF0000", 8);
            }
        } else if (!b.isGiant && (b.x < bb[0] - 15 || b.x > bb[2] + 15 || b.y < bb[1] - 15 || b.y > bb[3] + 15)) {
            this.bullets.splice(i, 1);
        }
    }
};
BillFloatingPyramidsPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF0000";
        ctx.fillStyle = "#8B0000";
        ctx.strokeStyle = "#FF3333";
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        if (b.isGiant) {
            ctx.moveTo(0, -18);
            ctx.lineTo(16, 12);
            ctx.lineTo(-16, 12);
        } else {
            ctx.moveTo(0, -6);
            ctx.lineTo(5, 4);
            ctx.lineTo(-5, 4);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillFloatingPyramidsPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 13. billShadowClones: Intersecting yellow clone blasts from margins
var BillShadowClonesPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.blastTimer = 0;
    this.damVal = config.damVal || 8;
    this.clones = []; // { x, y, side, timer, active }
};
BillShadowClonesPattern.prototype = Object.create(BulletPattern.prototype);
BillShadowClonesPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.blastTimer = 0.5;
    this.clones = [];
    billParticles = [];
};
BillShadowClonesPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.blastTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    if (this.blastTimer >= 1.5 && this.elapsed < this.duration - 1.5) {
        this.blastTimer = 0;
        var side = Math.random() > 0.5; // Left or right edge
        var ry = bb[1] + 30 + Math.random() * (bb[3] - bb[1] - 60);
        this.clones.push({
            x: side ? bb[0] + 15 : bb[2] - 15,
            y: ry,
            side: side,
            warning: 0.8,
            active: 0.5
        });
        Sound.playSound("button", true); // Clone spawns
    }
    
    for (var i = this.clones.length - 1; i >= 0; i--) {
        var c = this.clones[i];
        if (c.warning > 0) {
            c.warning -= dt;
            if (c.warning <= 0) {
                // Shoot a blast of sparks horizontally
                Sound.playSound("laser", true);
                var speedX = c.side ? 180 : -180;
                for (var k = 0; k < 5; k++) {
                    this.bullets.push({
                        x: c.x,
                        y: c.y,
                        vx: speedX,
                        vy: -40 + k * 20,
                        width: 8, height: 8,
                        active: true
                    });
                }
            }
        } else {
            c.active -= dt;
            if (c.active <= 0) {
                this.clones.splice(i, 1);
            }
        }
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < bb[0] - 15 || b.x > bb[2] + 15) {
            this.bullets.splice(i, 1);
        }
    }
};
BillShadowClonesPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.clones.length; i++) {
        var c = this.clones[i];
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.strokeStyle = "#FF00FF";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF00FF";
        if (c.warning > 0) {
            // Draw a silhouette triangle
            ctx.fillStyle = "rgba(255, 0, 255, 0.35)";
            ctx.beginPath();
            ctx.moveTo(0, -12);
            ctx.lineTo(10, 8);
            ctx.lineTo(-10, 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Aim line
            ctx.strokeStyle = "rgba(255, 0, 0, 0.2)";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(c.side ? 300 : -300, 0);
            ctx.stroke();
        } else {
            // Fading out clone
            ctx.fillStyle = "rgba(139, 0, 139, " + (c.active / 0.5) + ")";
            ctx.beginPath();
            ctx.moveTo(0, -12);
            ctx.lineTo(10, 8);
            ctx.lineTo(-10, 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }
    
    // Draw sparks
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.fillStyle = "#FF00FF";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#FF00FF";
        ctx.fillRect(b.x - 4, b.y - 4, 8, 8);
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillShadowClonesPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.clones.length === 0 && this.bullets.length === 0;
};

// 14. billTeleportSlam: Bill teleports and slams down, causing shockwaves
var BillTeleportSlamPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.slamTimer = 0;
    this.damVal = config.damVal || 9;
    this.slams = []; // { x, y, warning, active, waveRadius }
};
BillTeleportSlamPattern.prototype = Object.create(BulletPattern.prototype);
BillTeleportSlamPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.slamTimer = 0.4;
    this.slams = [];
    billParticles = [];
};
BillTeleportSlamPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.slamTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    if (this.slamTimer >= 1.6 && this.elapsed < this.duration - 1.5) {
        this.slamTimer = 0;
        var rx = bb[0] + 30 + Math.random() * (bb[2] - bb[0] - 60);
        var ry = bb[1] + 30 + Math.random() * (bb[3] - bb[1] - 60);
        this.slams.push({
            x: rx,
            y: ry,
            warning: 0.75,
            active: 0.6,
            waveRadius: 0
        });
        Sound.playSound("laser", true);
    }
    
    for (var i = this.slams.length - 1; i >= 0; i--) {
        var s = this.slams[i];
        if (s.warning > 0) {
            s.warning -= dt;
            if (s.warning <= 0) {
                Sound.playSound("impact", true);
                if (typeof triggerShake !== "undefined") triggerShake(7, 180);
                for (var p = 0; p < 12; p++) {
                    spawnBillParticle(s.x, s.y, (Math.random() - 0.5) * 90, (Math.random() - 0.5) * 90, 3, 0.4, "#FFD700", 8);
                }
            }
        } else {
            s.active -= dt;
            s.waveRadius += 160 * dt; // expanding shockwave
            if (s.active <= 0) {
                this.slams.splice(i, 1);
            }
        }
    }
};
BillTeleportSlamPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    for (var i = 0; i < this.slams.length; i++) {
        var s = this.slams[i];
        if (s.warning <= 0) {
            var dist = Math.sqrt(Math.pow(scx - s.x, 2) + Math.pow(scy - s.y, 2));
            // Collision with expanding thin shockwave circle
            if (Math.abs(dist - s.waveRadius) < 10) {
                return this.damVal;
            }
            // Direct collision with center slam point
            if (dist < 15 + sw/2) {
                return this.damVal;
            }
        }
    }
    return 0;
};
BillTeleportSlamPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.slams.length; i++) {
        var s = this.slams[i];
        ctx.save();
        if (s.warning > 0) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.25)";
            ctx.strokeStyle = "#FF0000";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Reticle line
            ctx.beginPath();
            ctx.arc(s.x, s.y, 25 * (s.warning / 0.75), 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Draw slam star/triangle
            ctx.fillStyle = "#FFFF00";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#FFD700";
            ctx.beginPath();
            ctx.arc(s.x, s.y, 16, 0, Math.PI*2);
            ctx.fill();
            
            // Draw shockwave
            ctx.strokeStyle = "rgba(255, 215, 0, " + (s.active / 0.6) + ")";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.waveRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillTeleportSlamPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.slams.length === 0;
};

// ==========================================
// PHASE 3 PATTERNS (Apocalypse / Red Enraged Giant)
// ==========================================

// 15. billAngryRedNova: Giant expanding pulses from center
var BillAngryRedNovaPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.pulseTimer = 0;
    this.damVal = config.damVal || 9;
    this.pulses = []; // { cx, cy, radius, active }
};
BillAngryRedNovaPattern.prototype = Object.create(BulletPattern.prototype);
BillAngryRedNovaPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.pulseTimer = 0.5;
    this.pulses = [];
    billParticles = [];
};
BillAngryRedNovaPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.pulseTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    if (this.pulseTimer >= 1.5 && this.elapsed < this.duration - 1.5) {
        this.pulseTimer = 0;
        this.pulses.push({
            x: cx,
            y: cy,
            radius: 5,
            active: 1.0
        });
        Sound.playSound("impact", true);
        if (typeof triggerShake !== "undefined") triggerShake(6, 200);
    }
    
    for (var i = this.pulses.length - 1; i >= 0; i--) {
        var p = this.pulses[i];
        p.radius += 170 * dt; // expand
        p.active -= dt;
        if (p.active <= 0) {
            this.pulses.splice(i, 1);
        }
    }
};
BillAngryRedNovaPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    for (var i = 0; i < this.pulses.length; i++) {
        var p = this.pulses[i];
        var dist = Math.sqrt(Math.pow(scx - p.x, 2) + Math.pow(scy - p.y, 2));
        if (Math.abs(dist - p.radius) < 14) {
            return this.damVal;
        }
    }
    return 0;
};
BillAngryRedNovaPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.pulses.length; i++) {
        var p = this.pulses[i];
        ctx.save();
        ctx.strokeStyle = "rgba(255, 0, 0, " + (p.active / 1.0) + ")";
        ctx.lineWidth = 12;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#FF0000";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillAngryRedNovaPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.pulses.length === 0;
};

// 16. billFistSlam: Red giant fists slamming down from margins
var BillFistSlamPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.slamTimer = 0;
    this.damVal = config.damVal || 10;
    this.fists = []; // { x, y, warning, active, side }
};
BillFistSlamPattern.prototype = Object.create(BulletPattern.prototype);
BillFistSlamPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.slamTimer = 0.5;
    this.fists = [];
    billParticles = [];
};
BillFistSlamPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.slamTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    if (this.slamTimer >= 1.4 && this.elapsed < this.duration - 1.5) {
        this.slamTimer = 0;
        var side = Math.floor(Math.random() * 3); // 0: left side, 1: center, 2: right side
        var cx = bb[0] + (bb[2] - bb[0])/6 + side * (bb[2] - bb[0])/3;
        this.fists.push({
            x: cx,
            y: bb[1] - 40,
            targetY: bb[3] - 40,
            warning: 0.8,
            active: 0.5,
            side: side
        });
        Sound.playSound("laser", true);
    }
    
    for (var i = this.fists.length - 1; i >= 0; i--) {
        var f = this.fists[i];
        if (f.warning > 0) {
            f.warning -= dt;
            if (f.warning <= 0) {
                f.y = f.targetY; // slam down instantly!
                Sound.playSound("impact", true);
                if (typeof triggerShake !== "undefined") triggerShake(10, 250);
                for (var p = 0; p < 15; p++) {
                    spawnBillParticle(f.x, f.y + 40, (Math.random() - 0.5) * 120, -Math.random() * 60, 4, 0.4, "#FF3333", 10);
                }
            }
        } else {
            f.active -= dt;
            if (f.active <= 0) {
                this.fists.splice(i, 1);
            }
        }
    }
};
BillFistSlamPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    for (var i = 0; i < this.fists.length; i++) {
        var f = this.fists[i];
        if (f.warning <= 0) {
            // Fist hitbox is very wide
            if (Math.abs(scx - f.x) < 40 && scy > f.y - 40) {
                return this.damVal;
            }
        }
    }
    return 0;
};
BillFistSlamPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();
    for (var i = 0; i < this.fists.length; i++) {
        var f = this.fists[i];
        ctx.save();
        if (f.warning > 0) {
            // Warning zone for slam
            ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
            ctx.fillRect(f.x - 30, bb[1], 60, bb[3] - bb[1]);
            
            // Faint red fist floating at the top
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
            ctx.fillRect(f.x - 20, f.y, 40, 50);
        } else {
            // Giant red fist slammed down
            ctx.fillStyle = "#FF0000";
            ctx.strokeStyle = "#8B0000";
            ctx.lineWidth = 3;
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#FF0000";
            
            // Draw fist rectangle at y
            ctx.fillRect(f.x - 30, bb[1], 60, f.y - bb[1]);
            ctx.strokeRect(f.x - 30, bb[1], 60, f.y - bb[1]);
            
            ctx.fillRect(f.x - 35, f.y, 70, 40);
            ctx.strokeRect(f.x - 35, f.y, 70, 40);
        }
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillFistSlamPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.fists.length === 0;
};

// 17. billTeethChirp: Homing teeth bullets flying at player
var BillTeethChirpPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 9;
};
BillTeethChirpPattern.prototype = Object.create(BulletPattern.prototype);
BillTeethChirpPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    billParticles = [];
};
BillTeethChirpPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    
    if (this.spawnTimer >= 0.70 && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        this.bullets.push({
            x: cx,
            y: bb[1] - 15,
            vx: 0, vy: 50, // slowly starts falling down
            width: 14, height: 14,
            homeTimer: 1.8, // homes in for 1.8 seconds
            active: true
        });
        Sound.playSound("hit_1", true);
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        
        if (b.homeTimer > 0 && typeof Soul !== "undefined") {
            b.homeTimer -= dt;
            var sPos = Soul.getPos();
            var targetX = sPos.x + Soul.getWidth()/2;
            var targetY = sPos.y + Soul.getHeight()/2;
            var angle = Math.atan2(targetY - b.y, targetX - b.x);
            // Slowly adjust velocities to home in
            b.vx = b.vx * 0.90 + Math.cos(angle) * 115 * 0.10;
            b.vy = b.vy * 0.90 + Math.sin(angle) * 115 * 0.10;
        }
        
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        
        if (Math.random() < 0.2) {
            spawnBillParticle(b.x, b.y, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 2, 0.25, "#FFFFF0", 5);
        }
        
        if (b.x < bb[0] - 20 || b.x > bb[2] + 20 || b.y < bb[1] - 20 || b.y > bb[3] + 20) {
            this.bullets.splice(i, 1);
        }
    }
};
BillTeethChirpPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#FF3300";
        ctx.fillStyle = "#FFFFE0"; // Teeth white-ish
        ctx.strokeStyle = "#FF3300";
        ctx.lineWidth = 1.5;
        
        // Draw triangular tooth
        ctx.beginPath();
        ctx.moveTo(0, 7);
        ctx.lineTo(-6, -7);
        ctx.lineTo(6, -7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillTeethChirpPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 18. billCataclysmRays: Cross-shaped red blast beams erupting
var BillCataclysmRaysPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.rayTimer = 0;
    this.damVal = config.damVal || 9;
    this.rays = []; // { cx, cy, warning, active, angle }
};
BillCataclysmRaysPattern.prototype = Object.create(BulletPattern.prototype);
BillCataclysmRaysPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.rayTimer = 0.5;
    this.rays = [];
    billParticles = [];
};
BillCataclysmRaysPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.rayTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    if (this.rayTimer >= 1.5 && this.elapsed < this.duration - 1.5) {
        this.rayTimer = 0;
        var rx = bb[0] + 40 + Math.random() * (bb[2] - bb[0] - 80);
        var ry = bb[1] + 40 + Math.random() * (bb[3] - bb[1] - 80);
        this.rays.push({
            x: rx,
            y: ry,
            warning: 0.8,
            active: 0.6,
            angle: Math.random() * Math.PI / 4
        });
        Sound.playSound("laser", true);
    }
    
    for (var i = this.rays.length - 1; i >= 0; i--) {
        var r = this.rays[i];
        if (r.warning > 0) {
            r.warning -= dt;
            if (r.warning <= 0) {
                Sound.playSound("impact", true);
                if (typeof triggerShake !== "undefined") triggerShake(6, 180);
                for (var p = 0; p < 16; p++) {
                    spawnBillParticle(r.x, r.y, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120, 3, 0.4, "#FF0000", 8);
                }
            }
        } else {
            r.active -= dt;
            if (r.active <= 0) {
                this.rays.splice(i, 1);
            }
        }
    }
};
BillCataclysmRaysPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    for (var i = 0; i < this.rays.length; i++) {
        var r = this.rays[i];
        if (r.warning <= 0) {
            // Check collision with the cross beams
            var thickness = 10;
            // Beam 1: angled line
            var dx1 = Math.cos(r.angle);
            var dy1 = Math.sin(r.angle);
            var dist1 = Math.abs((scx - r.x) * dy1 - (scy - r.y) * dx1);
            
            // Beam 2: orthogonal angled line
            var dx2 = Math.cos(r.angle + Math.PI/2);
            var dy2 = Math.sin(r.angle + Math.PI/2);
            var dist2 = Math.abs((scx - r.x) * dy2 - (scy - r.y) * dx2);
            
            if (dist1 < thickness || dist2 < thickness) {
                return this.damVal;
            }
        }
    }
    return 0;
};
BillCataclysmRaysPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();
    for (var i = 0; i < this.rays.length; i++) {
        var r = this.rays[i];
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.rotate(r.angle);
        
        if (r.warning > 0) {
            ctx.strokeStyle = "rgba(255, 0, 0, 0.25)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-350, 0); ctx.lineTo(350, 0);
            ctx.moveTo(0, -350); ctx.lineTo(0, 350);
            ctx.stroke();
            
            ctx.strokeRect(-12, -12, 24, 24);
        } else {
            ctx.strokeStyle = "#FF3333";
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#FF0000";
            ctx.lineWidth = 18 * (r.active / 0.6);
            ctx.beginPath();
            ctx.moveTo(-350, 0); ctx.lineTo(350, 0);
            ctx.moveTo(0, -350); ctx.lineTo(0, 350);
            ctx.stroke();
            
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 5 * (r.active / 0.6);
            ctx.stroke();
        }
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillCataclysmRaysPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.rays.length === 0;
};

// 19. billGravityChaos: Gravity shifts direction every 1.5s while debris falls
var BillGravityChaosPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.shiftTimer = 0;
    this.damVal = config.damVal || 9;
    this.gravityDir = 0; // 0: Down, 1: Left, 2: Up, 3: Right
};
BillGravityChaosPattern.prototype = Object.create(BulletPattern.prototype);
BillGravityChaosPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.shiftTimer = 0.5;
    this.gravityDir = 0;
    billParticles = [];
    if (typeof Soul !== "undefined") {
        Soul.setSoulMode(Soul.SOUL_MODE.BLUE); // Starts in blue mode
    }
};
BillGravityChaosPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    this.shiftTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    // Shift gravity direction
    if (this.shiftTimer >= 1.5 && this.elapsed < this.duration - 1.0) {
        this.shiftTimer = 0;
        this.gravityDir = (this.gravityDir + 1) % 4;
        Sound.playSound("impact", true);
        if (typeof triggerShake !== "undefined") triggerShake(5, 120);
        
        // Push player in new gravity direction slightly to alert them
        if (typeof Soul !== "undefined") {
            var sPos = Soul.getPos();
            var force = 25;
            if (this.gravityDir === 0) sPos.y += force;
            else if (this.gravityDir === 1) sPos.x -= force;
            else if (this.gravityDir === 2) sPos.y -= force;
            else sPos.x += force;
            Soul.setPos(sPos.x, sPos.y);
        }
    }
    
    // Custom blue soul physics override based on gravity direction
    if (typeof Soul !== "undefined" && typeof Soul.getSoulMode === "function" && Soul.getSoulMode() === Soul.SOUL_MODE.BLUE) {
        // We override gravity vector
        // Blue soul uses this.vy += gravity * dt;
        // Let's let combat.js handle normal blue movement, but we apply a drift offset in current direction!
        var sPos = Soul.getPos();
        var speed = 140;
        if (this.gravityDir === 0) {
            // Down (standard blue soul)
        } else if (this.gravityDir === 1) {
            // Left: pull player left
            sPos.x -= speed * dt;
        } else if (this.gravityDir === 2) {
            // Up: pull player up
            sPos.y -= speed * dt;
        } else {
            // Right: pull player right
            sPos.x += speed * dt;
        }
        Soul.setPos(sPos.x, sPos.y);
    }
    
    // Spawn debris falling opposite to gravity or from top
    if (this.spawnTimer >= 0.28 && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        var rx = bb[0] + 15 + Math.random() * (bb[2] - bb[0] - 30);
        this.bullets.push({
            x: rx,
            y: bb[1] - 10,
            vx: 0,
            vy: 140,
            width: 10, height: 10,
            active: true
        });
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.y += b.vy * dt;
        if (b.y > bb[3] + 15) {
            this.bullets.splice(i, 1);
        }
    }
};
BillGravityChaosPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();
    
    // Draw gravity arrows indicating direction
    ctx.fillStyle = "rgba(255, 0, 0, 0.15)";
    ctx.font = "18px Courier New";
    var text = "GRAVEDAD ↓";
    if (this.gravityDir === 1) text = "GRAVEDAD ←";
    else if (this.gravityDir === 2) text = "GRAVEDAD ↑";
    else if (this.gravityDir === 3) text = "GRAVEDAD →";
    ctx.fillText(text, bb[0] + 15, bb[1] + 25);
    
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.fillStyle = "#FF3300";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#FF3300";
        ctx.fillRect(b.x - 5, b.y - 5, 10, 10);
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillGravityChaosPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 20. billNightmareVortex: Central suction while fire lasers rotate
var BillNightmareVortexPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
    this.rotAngle = 0;
};
BillNightmareVortexPattern.prototype = Object.create(BulletPattern.prototype);
BillNightmareVortexPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.rotAngle = 0;
    billParticles = [];
};
BillNightmareVortexPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.rotAngle += 1.2 * dt; // rotation speed of lasers
    updateBillParticles(dt);
    
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    // Suction pull player towards center
    if (typeof Soul !== "undefined" && this.elapsed < this.duration - 0.5) {
        var sPos = Soul.getPos();
        var scx = sPos.x + Soul.getWidth()/2;
        var scy = sPos.y + Soul.getHeight()/2;
        
        var dx = cx - scx;
        var dy = cy - scy;
        var dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 8) {
            var pull = 45 * dt; // pull speed
            sPos.x += (dx / dist) * pull;
            sPos.y += (dy / dist) * pull;
            Soul.setPos(sPos.x, sPos.y);
        }
    }
    
    if (Math.random() < 0.3 && this.elapsed < this.duration - 1) {
        spawnBillParticle(cx + (Math.random() - 0.5) * 80, cy + (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, 2, 0.35, "#FF3300", 6);
    }
};
BillNightmareVortexPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    // 1. Direct collision with center vortex
    var dist = Math.sqrt(Math.pow(scx - cx, 2) + Math.pow(scy - cy, 2));
    if (dist < 20) return this.damVal;
    
    // 2. Collision with 3 rotating laser beams
    for (var k = 0; k < 3; k++) {
        var angle = this.rotAngle + (k * Math.PI * 2 / 3);
        var x2 = cx + Math.cos(angle) * 200;
        var y2 = cy + Math.sin(angle) * 200;
        
        // distance from point to line segment
        var num = Math.abs((y2 - cy)*scx - (x2 - cx)*scy + x2*cy - y2*cx);
        var den = Math.sqrt(Math.pow(y2 - cy, 2) + Math.pow(x2 - cx, 2));
        var d = num / (den || 1);
        if (d < 10) return this.damVal;
    }
    return 0;
};
BillNightmareVortexPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    ctx.save();
    
    // Draw central spinning vortex
    ctx.fillStyle = "#8B0000";
    ctx.strokeStyle = "#FF3300";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#FF0000";
    
    ctx.beginPath();
    ctx.arc(cx, cy, 20 + Math.sin(Date.now() / 80) * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Draw 3 rotating lasers
    ctx.strokeStyle = "#FF3300";
    ctx.lineWidth = 10;
    for (var k = 0; k < 3; k++) {
        var angle = this.rotAngle + (k * Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * 250, cy + Math.sin(angle) * 250);
        ctx.stroke();
    }
    
    // Inner white cores for lasers
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    for (var k = 0; k < 3; k++) {
        var angle = this.rotAngle + (k * Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * 250, cy + Math.sin(angle) * 250);
        ctx.stroke();
    }
    
    ctx.restore();
    drawBillParticles(ctx);
};
BillNightmareVortexPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};

// 21. billArmageddon: Final apocalyptic bullet storm
var BillArmageddonPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.laserTimer = 0;
    this.damVal = config.damVal || 12;
    this.lasers = []; // { x, warning, active, dir }
};
BillArmageddonPattern.prototype = Object.create(BulletPattern.prototype);
BillArmageddonPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.laserTimer = 0.5;
    this.lasers = [];
    billParticles = [];
};
BillArmageddonPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    this.laserTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    // Spawn red fireballs falling rapidly
    if (this.spawnTimer >= 0.16 && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        var rx = bb[0] + 15 + Math.random() * (bb[2] - bb[0] - 30);
        this.bullets.push({
            x: rx,
            y: bb[1] - 10,
            vx: -30 + Math.random() * 60,
            vy: 160 + Math.random() * 40,
            width: 12, height: 12,
            active: true
        });
        if (Math.random() < 0.4) {
            Sound.playSound("hit_1", true);
        }
    }
    
    // Spawn sweeping vertical lasers
    if (this.laserTimer >= 1.8 && this.elapsed < this.duration - 1.5) {
        this.laserTimer = 0;
        var rx = bb[0] + 50 + Math.random() * (bb[2] - bb[0] - 100);
        this.lasers.push({
            x: rx,
            warning: 0.7,
            active: 0.6,
            vx: Math.random() > 0.5 ? 40 : -40 // sweeping speed
        });
        Sound.playSound("laser", true);
    }
    
    for (var i = this.lasers.length - 1; i >= 0; i--) {
        var l = this.lasers[i];
        if (l.warning > 0) {
            l.warning -= dt;
        } else {
            l.active -= dt;
            l.x += l.vx * dt; // sweep laser
            if (l.active <= 0) {
                this.lasers.splice(i, 1);
            }
        }
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y > bb[3] + 15) {
            this.bullets.splice(i, 1);
        }
    }
};
BillArmageddonPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    var bb = Cbbox.getBound();
    
    // 1. Check falling fireballs
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active) {
            var dist = Math.sqrt(Math.pow(scx - b.x, 2) + Math.pow(scy - b.y, 2));
            if (dist < 8 + sw/2) return this.damVal;
        }
    }
    
    // 2. Check vertical sweeping lasers
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.warning <= 0) {
            if (Math.abs(scx - l.x) < 14) return this.damVal;
        }
    }
    return 0;
};
BillArmageddonPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();
    
    // Red Armageddon screen glow tint
    ctx.fillStyle = "rgba(255, 0, 0, 0.04)";
    ctx.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
    
    // Draw sweeping lasers
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.warning > 0) {
            ctx.strokeStyle = "rgba(255, 0, 0, 0.35)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(l.x, bb[1]);
            ctx.lineTo(l.x, bb[3]);
            ctx.stroke();
        } else {
            ctx.strokeStyle = "#FF3333";
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#FF0000";
            ctx.lineWidth = 20 * (l.active / 0.6);
            ctx.beginPath();
            ctx.moveTo(l.x, bb[1]);
            ctx.lineTo(l.x, bb[3]);
            ctx.stroke();
            
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 4 * (l.active / 0.6);
            ctx.stroke();
        }
    }
    
    // Draw fireballs
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.fillStyle = "#FF4500";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF3300";
        ctx.beginPath();
        ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
    drawBillParticles(ctx);
};
BillArmageddonPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0 && this.lasers.length === 0;
};
