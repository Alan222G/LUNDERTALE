// godzillaTailWhip.js — Godzilla's tail whip pattern with rapid asterisk sweeps (Horizontal, Vertical, Diagonals) and shockwaves
var GodzillaTailWhipPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    
    // Sweep sequence system
    this.sweeps = [];
    this.currentSweepIdx = 0;
    this.sweepTimer = 0;
    
    this.bullets = [];
};

GodzillaTailWhipPattern.prototype = Object.create(BulletPattern.prototype);

GodzillaTailWhipPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.bullets = [];
    this.currentSweepIdx = 0;
    this.sweepTimer = 0;
    
    // Initialize 4 sweeps with random directions (Horizontal, Vertical, Diagonals)
    // 0: Horiz L->R, 1: Horiz R->L, 2: Vert T->B, 3: Vert B->T, 4: Diag TL->BR, 5: Diag TR->BL
    var possibleDirections = [0, 1, 2, 3, 4, 5];
    this.sweeps = [];
    for (var i = 0; i < 4; i++) {
        // Pick a random direction
        var dir = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
        this.sweeps.push({
            dirType: dir,
            warningDuration: 0.50, // 0.5s warning
            activeDuration: 0.40,  // 0.4s active sweep
            shockwaveSpawned: false
        });
    }
};

GodzillaTailWhipPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.sweepTimer += dt;
    
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];
    
    if (this.currentSweepIdx < this.sweeps.length) {
        var s = this.sweeps[this.currentSweepIdx];
        var totalTime = s.warningDuration + s.activeDuration;
        
        if (this.sweepTimer >= totalTime) {
            // Move to next sweep immediately!
            this.currentSweepIdx++;
            this.sweepTimer = 0;
        } else if (this.sweepTimer >= s.warningDuration) {
            // Active sweep phase
            var activeProgress = (this.sweepTimer - s.warningDuration) / s.activeDuration;
            
            // Screen shake at high progress
            if (activeProgress > 0.3 && activeProgress < 0.6 && typeof triggerShake === "function" && Math.random() < 0.3) {
                triggerShake(4, 100);
            }
            
            // Spawn shockwaves once on impact (mid-point of sweep)
            if (activeProgress >= 0.5 && !s.shockwaveSpawned) {
                s.shockwaveSpawned = true;
                this.spawnShockwavesForDir(s.dirType);
            }
        }
    }
    
    // Update shockwave bullets
    BulletPattern.prototype.update.call(this, dt);
    
    // Clean out-of-bounds bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        if (this.bullets[i].isOutOfBounds([bb[0] - 40, bb[1] - 40, bb[2] + 40, bb[3] + 40])) {
            this.bullets.splice(i, 1);
        }
    }
};

GodzillaTailWhipPattern.prototype.spawnShockwavesForDir = function(dirType) {
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];
    
    Sound.playSound("impact", true);
    
    // Spawn shockwave bullets depending on direction
    var bulletCount = 5;
    
    if (dirType === 0 || dirType === 1) {
        // Horizontal sweep: spawn vertical shooting bullets
        var spawnY = dirType === 0 ? bb[3] - 15 : bb[1] + 15;
        for (var i = 0; i < bulletCount; i++) {
            this.bullets.push(new Bullet({
                x: bb[0] + 20 + (i / (bulletCount - 1)) * (boxW - 40),
                y: spawnY,
                width: 14, height: 14, speed: 0, damVal: this.damVal,
                rotation: 0, fadeSpeed: 1.0, color: "#00E5FF",
                vx: 0, vy: dirType === 0 ? -160 : 160, useVelocity: true
            }));
        }
    } else if (dirType === 2 || dirType === 3) {
        // Vertical sweep: spawn horizontal shooting bullets
        var spawnX = dirType === 2 ? bb[2] - 15 : bb[0] + 15;
        for (var i = 0; i < bulletCount; i++) {
            this.bullets.push(new Bullet({
                x: spawnX,
                y: bb[1] + 20 + (i / (bulletCount - 1)) * (boxH - 40),
                width: 14, height: 14, speed: 0, damVal: this.damVal,
                rotation: 0, fadeSpeed: 1.0, color: "#00E5FF",
                vx: dirType === 2 ? -160 : 160, vy: 0, useVelocity: true
            }));
        }
    } else {
        // Diagonal sweep: spawn bullets in a cross pattern
        for (var i = 0; i < bulletCount; i++) {
            var angle = (i / bulletCount) * Math.PI * 2;
            this.bullets.push(new Bullet({
                x: bb[0] + boxW / 2 - 7,
                y: bb[1] + boxH / 2 - 7,
                width: 12, height: 12, speed: 0, damVal: this.damVal,
                rotation: 0, fadeSpeed: 1.0, color: "#FF00E5",
                vx: Math.cos(angle) * 140, vy: Math.sin(angle) * 140, useVelocity: true
            }));
        }
    }
};

GodzillaTailWhipPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];
    
    ctx.save();
    
    var isMeltdown = (this.battleBox && Cgroup.getBossId() === "godzilla" && Cgroup.getEnemy(0) && Cgroup.getEnemy(0).renderType === "godzilla_meltdown");
    var glowColor = isMeltdown ? "rgba(255, 0, 160, 0.8)" : "rgba(0, 160, 255, 0.8)";
    var indicatorColor = isMeltdown ? "rgba(255, 0, 100, 0.15)" : "rgba(0, 180, 255, 0.12)";
    var spineColor = isMeltdown ? "#FF00A0" : "#00B2FF";
    
    if (this.currentSweepIdx < this.sweeps.length) {
        var s = this.sweeps[this.currentSweepIdx];
        
        // 1. Draw Sweep Warning Line
        if (this.sweepTimer < s.warningDuration) {
            ctx.save();
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 6]);
            
            // Draw path based on direction type
            ctx.beginPath();
            if (s.dirType === 0 || s.dirType === 1) {
                // Horizontal sweep path
                ctx.moveTo(bb[0], bb[1] + boxH * 0.5);
                ctx.lineTo(bb[2], bb[1] + boxH * 0.5);
            } else if (s.dirType === 2 || s.dirType === 3) {
                // Vertical sweep path
                ctx.moveTo(bb[0] + boxW * 0.5, bb[1]);
                ctx.lineTo(bb[0] + boxW * 0.5, bb[3]);
            } else if (s.dirType === 4) {
                // Diagonal TL -> BR
                ctx.moveTo(bb[0], bb[1]);
                ctx.lineTo(bb[2], bb[3]);
            } else if (s.dirType === 5) {
                // Diagonal TR -> BL
                ctx.moveTo(bb[2], bb[1]);
                ctx.lineTo(bb[0], bb[3]);
            }
            ctx.stroke();
            
            // Soft overlay indicator
            ctx.fillStyle = indicatorColor;
            if (s.dirType === 0 || s.dirType === 1) {
                ctx.fillRect(bb[0], bb[1] + boxH * 0.5 - 25, boxW, 50);
            } else if (s.dirType === 2 || s.dirType === 3) {
                ctx.fillRect(bb[0] + boxW * 0.5 - 25, bb[1], 50, boxH);
            } else {
                // Diagonal overlay
                ctx.globalAlpha = 0.08;
                ctx.fillRect(bb[0], bb[1], boxW, boxH);
            }
            ctx.restore();
        }
        
        // 2. Draw active sweeping tail
        if (this.sweepTimer >= s.warningDuration && this.sweepTimer < s.warningDuration + s.activeDuration) {
            var progress = (this.sweepTimer - s.warningDuration) / s.activeDuration;
            
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = glowColor;
            ctx.fillStyle = "#1E2727";
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 3;
            
            // Calculate tail tip coordinates based on direction type
            var tx, ty, rot;
            if (s.dirType === 0) { // Horiz L->R
                tx = bb[0] + progress * (boxW + 80) - 40;
                ty = bb[1] + boxH * 0.5;
                rot = 0;
            } else if (s.dirType === 1) { // Horiz R->L
                tx = bb[2] - progress * (boxW + 80) + 40;
                ty = bb[1] + boxH * 0.5;
                rot = Math.PI;
            } else if (s.dirType === 2) { // Vert T->B
                tx = bb[0] + boxW * 0.5;
                ty = bb[1] + progress * (boxH + 80) - 40;
                rot = Math.PI * 0.5;
            } else if (s.dirType === 3) { // Vert B->T
                tx = bb[0] + boxW * 0.5;
                ty = bb[3] - progress * (boxH + 80) + 40;
                rot = Math.PI * 1.5;
            } else if (s.dirType === 4) { // Diag TL -> BR
                tx = bb[0] + progress * (boxW + 80) - 40;
                ty = bb[1] + progress * (boxH + 80) - 40;
                rot = Math.atan2(boxH, boxW);
            } else { // Diag TR -> BL
                tx = bb[2] - progress * (boxW + 80) + 40;
                ty = bb[1] + progress * (boxH + 80) - 40;
                rot = Math.atan2(boxH, -boxW);
            }
            
            // Render tail tip
            ctx.translate(tx, ty);
            ctx.rotate(rot);
            
            ctx.beginPath();
            ctx.moveTo(-50, -10);
            ctx.quadraticCurveTo(-20, -25, 20, -12);
            ctx.lineTo(40, 0); // Tip
            ctx.lineTo(20, 12);
            ctx.quadraticCurveTo(-20, 25, -50, 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Glowing spines on tail
            ctx.fillStyle = spineColor;
            for (var sp = 0; sp < 3; sp++) {
                var spx = -35 + sp * 18;
                ctx.beginPath();
                ctx.moveTo(spx - 4, -12);
                ctx.lineTo(spx, -24);
                ctx.lineTo(spx + 4, -12);
                ctx.closePath();
                ctx.fill();
            }
            
            ctx.restore();
        }
    }
    
    // 3. Draw shockwave bullets
    BulletPattern.prototype.draw.call(this, ctx);
    
    ctx.restore();
};

GodzillaTailWhipPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    // 1. Check collision with active sweeping tail tip
    if (this.currentSweepIdx < this.sweeps.length) {
        var s = this.sweeps[this.currentSweepIdx];
        if (this.sweepTimer >= s.warningDuration && this.sweepTimer < s.warningDuration + s.activeDuration) {
            var progress = (this.sweepTimer - s.warningDuration) / s.activeDuration;
            
            var bb = Cbbox.getBound();
            var boxW = bb[2] - bb[0];
            var boxH = bb[3] - bb[1];
            
            var tx, ty;
            if (s.dirType === 0) { // Horiz L->R
                tx = bb[0] + progress * (boxW + 80) - 40;
                ty = bb[1] + boxH * 0.5;
            } else if (s.dirType === 1) { // Horiz R->L
                tx = bb[2] - progress * (boxW + 80) + 40;
                ty = bb[1] + boxH * 0.5;
            } else if (s.dirType === 2) { // Vert T->B
                tx = bb[0] + boxW * 0.5;
                ty = bb[1] + progress * (boxH + 80) - 40;
            } else if (s.dirType === 3) { // Vert B->T
                tx = bb[0] + boxW * 0.5;
                ty = bb[3] - progress * (boxH + 80) + 40;
            } else if (s.dirType === 4) { // Diag TL -> BR
                tx = bb[0] + progress * (boxW + 80) - 40;
                ty = bb[1] + progress * (boxH + 80) - 40;
            } else { // Diag TR -> BL
                tx = bb[2] - progress * (boxW + 80) + 40;
                ty = bb[1] + progress * (boxH + 80) - 40;
            }
            
            // Check if player is close to the tail tip center (radius around 45px)
            var playerCenterX = sx + sw / 2;
            var playerCenterY = sy + sh / 2;
            var dist = Math.sqrt((playerCenterX - tx) * (playerCenterX - tx) + (playerCenterY - ty) * (playerCenterY - ty));
            if (dist < 42) {
                return this.damVal;
            }
        }
    }
    
    // 2. Check collision with shockwave bullets using base class method
    return BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
};

GodzillaTailWhipPattern.prototype.isOver = function() {
    return (this.currentSweepIdx >= this.sweeps.length || this.elapsed >= this.duration) && this.bullets.length === 0;
};
