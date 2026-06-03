// voidPatterns.js — Void-themed attacks for El Hambre Cósmica

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
};
VoidTentacleLashPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.lashTimer += dt;
    var bb = Cbbox.getBound();
    
    // Spawn warnings
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
    
    // Update warnings/actives
    for (var i = this.lasers.length - 1; i >= 0; i--) {
        var l = this.lasers[i];
        if (l.warning > 0) {
            l.warning -= dt;
            if (l.warning <= 0) {
                Sound.playSound("impact", true);
                if (typeof triggerShake !== "undefined") triggerShake(4, 150);
            }
        } else if (l.active > 0) {
            l.active -= dt;
            if (l.active <= 0) {
                this.lasers.splice(i, 1);
            }
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
                if (Math.abs(scx - l.x) < 20) return this.damVal; // 40px width tentacle
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
            // Pulsing red warning line
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
            // Draw writhing tentacle lashing through
            ctx.save();
            ctx.strokeStyle = "#9400D3"; // Purple
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#FF00FF";
            ctx.lineWidth = 24 * (l.active / 0.5); // Fades width out
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
            
            // Add toxic glowing center core to the tentacle
            ctx.strokeStyle = "#FF00FF";
            ctx.lineWidth = 8 * (l.active / 0.5);
            ctx.stroke();
            ctx.restore();
        }
    }
    
    ctx.restore();
};
VoidTentacleLashPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.lasers.length === 0;
};


// 2. voidBiteSlam: Target a rectangle (player position), show warning, bite shut
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
};
VoidBiteSlamPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.biteTimer += dt;
    var bb = Cbbox.getBound();
    
    if (this.biteTimer >= 1.5 && this.elapsed < this.duration - 1.5) {
        this.biteTimer = 0;
        if (typeof Soul !== "undefined") {
            var sPos = Soul.getPos();
            var targetX = sPos.x + Soul.getWidth()/2;
            var targetY = sPos.y + Soul.getHeight()/2;
            
            // Spawn targeted rectangle (100x100)
            this.bites.push({
                x: targetX - 50,
                y: targetY - 50,
                w: 100,
                h: 100,
                warning: 0.9,
                active: 0.4,
                maxWarning: 0.9
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
                if (typeof triggerShake !== "undefined") triggerShake(8, 200);
            }
        } else if (b.active > 0) {
            b.active -= dt;
            if (b.active <= 0) {
                this.bites.splice(i, 1);
            }
        }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
VoidBiteSlamPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.bites.length; i++) {
        var b = this.bites[i];
        if (b.warning <= 0 && b.active > 0) {
            if (rectsOverlap(b.x, b.y, b.w, b.h, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }
    return 0;
};
VoidBiteSlamPattern.prototype.draw = function(ctx) {
    ctx.save();
    var time = Date.now() / 1000;
    
    for (var i = 0; i < this.bites.length; i++) {
        var b = this.bites[i];
        if (b.warning > 0) {
            // Draw warning frame and teeth outline closing
            var pct = b.warning / b.maxWarning;
            ctx.strokeStyle = "rgba(255, 69, 0, " + (0.4 + (1 - pct)*0.4) + ")";
            ctx.lineWidth = 2 + (1 - pct) * 3;
            ctx.strokeRect(b.x, b.y, b.w, b.h);
            
            // Draw indicators of teeth converging from top and bottom
            ctx.fillStyle = "rgba(255, 0, 0, 0.15)";
            ctx.fillRect(b.x, b.y, b.w, b.h * (1 - pct) * 0.5);
            ctx.fillRect(b.x, b.y + b.h - b.h * (1 - pct) * 0.5, b.w, b.h * (1 - pct) * 0.5);
        } else if (b.active > 0) {
            // Draw jaws clamping shut!
            var actPct = b.active / 0.4; // 1 to 0
            ctx.save();
            ctx.fillStyle = "#4B0082";
            ctx.strokeStyle = "#FF00FF";
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#FF00FF";
            
            ctx.fillRect(b.x, b.y, b.w, b.h);
            ctx.strokeRect(b.x, b.y, b.w, b.h);
            
            // White teeth biting in center
            ctx.fillStyle = "#E0FFFF";
            ctx.beginPath();
            // Upper teeth
            for (var tx = b.x; tx < b.x + b.w; tx += 10) {
                ctx.moveTo(tx, b.y);
                ctx.lineTo(tx + 5, b.y + 20 * actPct);
                ctx.lineTo(tx + 10, b.y);
            }
            // Lower teeth
            for (var tx = b.x; tx < b.x + b.w; tx += 10) {
                ctx.moveTo(tx, b.y + b.h);
                ctx.lineTo(tx + 5, b.y + b.h - 20 * actPct);
                ctx.lineTo(tx + 10, b.y + b.h);
            }
            ctx.fill();
            ctx.restore();
        }
    }
    
    ctx.restore();
};
VoidBiteSlamPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bites.length === 0;
};


// 3. voidEyeBeam: Eye open warnings on box bounds, firing laser beams
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
};
VoidEyeBeamPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.beamTimer += dt;
    var bb = Cbbox.getBound();
    
    if (this.beamTimer >= 1.3 && this.elapsed < this.duration - 1.5) {
        this.beamTimer = 0;
        
        // Spawn intersecting eyes on opposing edges
        var side = Math.random() < 0.5;
        if (side) {
            // Horizontal lasers spanning across box
            var ly1 = bb[1] + 40 + Math.random() * (bb[3] - bb[1] - 80);
            var ly2 = bb[1] + 40 + Math.random() * (bb[3] - bb[1] - 80);
            this.beams.push({ x: bb[0], y: ly1, dx: bb[2], dy: ly1, warning: 1.0, active: 0.6 });
            this.beams.push({ x: bb[2], y: ly2, dx: bb[0], dy: ly2, warning: 1.0, active: 0.6 });
        } else {
            // Vertical lasers
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
                Sound.playSound("hit_1_crit", true);
            }
        } else if (b.active > 0) {
            b.active -= dt;
            if (b.active <= 0) {
                this.beams.splice(i, 1);
            }
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
            // Simple line-to-point distance check (since lasers are axis-aligned)
            if (b.x === b.dx) { // Vertical
                if (Math.abs(scx - b.x) < 14) return this.damVal;
            } else { // Horizontal
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
        
        // 1. Draw Cosmic Eye on the edge
        ctx.save();
        ctx.translate(b.x, b.y);
        
        // Face the beam direction
        var angle = Math.atan2(b.dy - b.y, b.dx - b.x);
        ctx.rotate(angle);
        
        ctx.fillStyle = "#4B0082";
        ctx.strokeStyle = "#FF00FF";
        ctx.lineWidth = 1.5;
        
        // Eye socket
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Pulsing pupil
        var pulseSize = 4 + Math.sin(time * 12) * 1.5;
        ctx.fillStyle = "#FFD700"; // Yellow
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FFD700";
        ctx.beginPath();
        ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // 2. Draw Beam/Warning Line
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
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#FF00FF";
            ctx.lineWidth = 20 * (b.active / 0.6); // Beam decay
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.dx, b.dy);
            ctx.stroke();
            
            // Core white light
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 6 * (b.active / 0.6);
            ctx.stroke();
            ctx.restore();
        }
    }
    
    ctx.restore();
};
VoidEyeBeamPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.beams.length === 0;
};


// 4. voidGravitySingularity: Central black hole pulling player while firing spirals
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
};
VoidGravitySingularityPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    // 1. Pull player towards center
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
    
    // 2. Spawn spiral bullet matter orbiting inward
    if (this.spawnTimer >= 0.22 && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        var angle = Math.random() * Math.PI * 2;
        var r = 180;
        this.bullets.push({
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r,
            radius: r,
            angle: angle,
            rotSpeed: 3.5,
            radialSpeed: 80,
            width: 8,
            height: 8,
            active: true
        });
        Sound.playSound("laser", true);
    }
    
    // Update bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.radius -= b.radialSpeed * dt;
        b.angle += b.rotSpeed * dt;
        
        b.x = cx + Math.cos(b.angle) * b.radius;
        b.y = cy + Math.sin(b.angle) * b.radius;
        
        // Collide with central singularity
        if (b.radius < 12) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
VoidGravitySingularityPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    // Check main bullet collision
    var dmg = BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
    if (dmg > 0) return dmg;
    
    // Check central black hole contact damage (very center)
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    var dist = Math.sqrt(Math.pow(scx - cx, 2) + Math.pow(scy - cy, 2));
    if (dist < 15) {
        return this.damVal;
    }
    return 0;
};
VoidGravitySingularityPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    var time = Date.now() / 1000;
    
    // Draw pulsing central singularity
    var pulse = 16 + Math.sin(time * 10) * 3;
    var grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, pulse + 15);
    grad.addColorStop(0, "#000000");
    grad.addColorStop(0.3, "#4B0082");
    grad.addColorStop(0.8, "#FF00FF");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, pulse + 15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(cx, cy, pulse * 0.7, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw bullets as violet swirling particles
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.fillStyle = "#FF00FF";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF00FF";
        ctx.fillRect(b.x - 4, b.y - 4, 8, 8);
    }
    
    ctx.restore();
};
VoidGravitySingularityPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};


// 5. voidInventoryDevourAttempt: Tongue lunges at player to steal item
var VoidInventoryDevourAttemptPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 4.5; // Short, targeted attack
    this.elapsed = 0;
    this.damVal = config.damVal || 6;
    
    this.tongueX = 370;
    this.tongueY = 60; // Spawns from top mouth
    this.targetX = 370;
    this.targetY = 250;
    this.phase = 0; // 0 = Warning, 1 = Lunge, 2 = Hold/Devour, 3 = Retract
    this.timer = 0;
    this.stealTriggered = false;
};
VoidInventoryDevourAttemptPattern.prototype = Object.create(BulletPattern.prototype);
VoidInventoryDevourAttemptPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.phase = 0;
    this.timer = 0.8; // 0.8s warning
    this.stealTriggered = false;
    this.tongueX = 370;
    this.tongueY = 80;
    
    if (typeof Soul !== "undefined") {
        var sPos = Soul.getPos();
        this.targetX = sPos.x + Soul.getWidth()/2;
        this.targetY = sPos.y + Soul.getHeight()/2;
    }
};
VoidInventoryDevourAttemptPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    
    if (this.phase === 0) {
        this.timer -= dt;
        if (this.timer <= 0) {
            this.phase = 1; // Lunge!
            this.timer = 0.25; // Speed of lunge
            Sound.playSound("laser", true);
        }
    } else if (this.phase === 1) {
        this.timer -= dt;
        var pct = 1 - (this.timer / 0.25);
        if (pct > 1) pct = 1;
        this.tongueX = 370 + (this.targetX - 370) * pct;
        this.tongueY = 80 + (this.targetY - 80) * pct;
        
        if (this.timer <= 0) {
            this.phase = 2;
            this.timer = 0.3; // Devour duration
        }
    } else if (this.phase === 2) {
        this.timer -= dt;
        if (this.timer <= 0) {
            this.phase = 3;
            this.timer = 0.35; // Retract time
        }
    } else if (this.phase === 3) {
        this.timer -= dt;
        var pct = this.timer / 0.35;
        if (pct < 0) pct = 0;
        this.tongueX = 370 + (this.targetX - 370) * pct;
        this.tongueY = 80 + (this.targetY - 80) * pct;
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
VoidInventoryDevourAttemptPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    // Only collides in lunge or hold phases (1 or 2)
    if (this.phase !== 1 && this.phase !== 2) return 0;
    
    var tongueRadius = 14;
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    var dist = Math.sqrt(Math.pow(scx - this.tongueX, 2) + Math.pow(scy - this.tongueY, 2));
    
    if (dist < tongueRadius + Math.max(sw, sh)/2) {
        // HIT! If we haven't stolen an item yet in this pattern, trigger boss's item devour passive!
        if (!this.stealTriggered) {
            this.stealTriggered = true;
            var enemy = Cgroup.getEnemy(0); // El Hambre Cósmica is the first enemy
            if (enemy && typeof enemy.onHitPlayer === "function") {
                enemy.onHitPlayer(this.damVal);
            }
        }
        return this.damVal;
    }
    return 0;
};
VoidInventoryDevourAttemptPattern.prototype.draw = function(ctx) {
    ctx.save();
    var time = Date.now() / 1000;
    
    // 1. Draw target warning line
    if (this.phase === 0) {
        ctx.strokeStyle = "rgba(255, 20, 147, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(370, 80);
        ctx.lineTo(this.targetX, this.targetY);
        ctx.stroke();
        
        // Reticle
        ctx.strokeStyle = "#FF1493";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.targetX, this.targetY, 20 + Math.sin(time*20)*4, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // 2. Draw slimy writhing tongue
    if (this.phase > 0) {
        ctx.save();
        ctx.strokeStyle = "#FF69B4"; // Slimy Pink
        ctx.lineCap = "round";
        ctx.lineWidth = 16;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FF1493";
        
        ctx.beginPath();
        ctx.moveTo(370, 80);
        
        // Draw tongue body with a wave factor
        var dx = this.tongueX - 370;
        var dy = this.tongueY - 80;
        var len = Math.sqrt(dx*dx + dy*dy);
        var nx = dx / len;
        var ny = dy / len;
        
        for (var step = 0; step <= 10; step++) {
            var progress = step / 10;
            var curX = 370 + dx * progress;
            var curY = 80 + dy * progress;
            
            // Add slimy undulation perpendicular to trajectory
            var wave = Math.sin(progress * Math.PI * 2 - time * 15) * 8 * (1 - progress) * progress;
            curX += -ny * wave;
            curY += nx * wave;
            ctx.lineTo(curX, curY);
        }
        ctx.stroke();
        
        // Draw tongue tip (devourer maw end)
        ctx.fillStyle = "#BA55D3";
        ctx.beginPath();
        ctx.arc(this.tongueX, this.tongueY, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    ctx.restore();
};
VoidInventoryDevourAttemptPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration || (this.phase === 3 && this.tongueY <= 85);
};


// 6. voidSpitBackBarrage: Spits out stolen items (bouncy rings) or toxic void bile
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
};
VoidSpitBackBarragePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spitTimer += dt;
    var bb = Cbbox.getBound();
    
    if (this.spitTimer >= 0.70 && this.elapsed < this.duration - 1.5) {
        this.spitTimer = 0;
        
        // Spawn bouncing items or poison rings
        var enemy = Cgroup.getEnemy(0);
        var hasStolen = (enemy && enemy.stolenItems && enemy.stolenItems.length > 0);
        
        var vx = -120 + Math.random() * 240;
        var vy = 120 + Math.random() * 80;
        
        this.bullets.push({
            x: 370,
            y: 90,
            vx: vx,
            vy: vy,
            width: 16,
            height: 16,
            color: hasStolen ? "#EE82EE" : "#32CD32", // Stolen pink vs poison green
            bounces: 4,
            isStolenItem: hasStolen,
            active: true
        });
        Sound.playSound("hit_1", true);
    }
    
    // Update bouncing bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        
        // Bounce off walls
        if (b.x < bb[0] + 8) { b.x = bb[0] + 8; b.vx = -b.vx; b.bounces--; Sound.playSound("ting", true); }
        if (b.x > bb[2] - 8) { b.x = bb[2] - 8; b.vx = -b.vx; b.bounces--; Sound.playSound("ting", true); }
        if (b.y < bb[1] + 8) { b.y = bb[1] + 8; b.vy = -b.vy; b.bounces--; Sound.playSound("ting", true); }
        if (b.y > bb[3] - 8) { b.y = bb[3] - 8; b.vy = -b.vy; b.bounces--; Sound.playSound("ting", true); }
        
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
            // Draw a spinning item box / diamond
            ctx.fillStyle = "#FF69B4";
            ctx.fillRect(-8, -8, 16, 16);
            ctx.strokeRect(-8, -8, 16, 16);
        } else {
            // Draw a toxic poison ring
            ctx.fillStyle = "#00FF00";
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }
    
    ctx.restore();
};
VoidSpitBackBarragePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
