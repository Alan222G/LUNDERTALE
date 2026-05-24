// godzillaTailWhip.js — Godzilla's tail sweep attack with screen shake and shockwaves
var GodzillaTailWhipPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    
    this.sweepActive = false;
    this.warningActive = false;
    this.sweepProgress = 0; // 0 to 1
    this.sweepDir = 1; // 1 = Left to Right, -1 = Right to Left
    this.sweepY = 0;
    this.sweepHeight = 65;
    
    this.bullets = [];
    this.spawnedWaves = {};
};

GodzillaTailWhipPattern.prototype = Object.create(BulletPattern.prototype);

GodzillaTailWhipPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.bullets = [];
    this.sweepActive = false;
    this.warningActive = false;
    this.sweepProgress = 0;
    this.sweepDir = 1;
    this.spawnedWaves = {};
};

GodzillaTailWhipPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];
    
    // Set middle Y for the tail whip
    this.sweepY = bb[1] + boxH * 0.5;
    
    // Sweep schedule:
    // Wave 1: elapsed 1.0s to 3.0s (1s warning, 1s sweep)
    // Wave 2: elapsed 4.0s to 6.0s (1s warning, 1s sweep, opposite direction)
    
    this.sweepActive = false;
    this.warningActive = false;
    
    if (this.elapsed >= 0.8 && this.elapsed < 1.8) {
        // Wave 1 Warning
        this.warningActive = true;
        this.sweepDir = 1;
    } else if (this.elapsed >= 1.8 && this.elapsed < 2.8) {
        // Wave 1 Active Sweep
        this.sweepActive = true;
        this.sweepDir = 1;
        this.sweepProgress = (this.elapsed - 1.8) / 1.0;
        
        // Trigger screen shake
        if (typeof triggerShake === "function" && Math.random() < 0.2) {
            triggerShake(4, 150);
        }
        
        // Spawn shockwave bullets at impact (around midpoint and ends of sweep)
        if (this.sweepProgress > 0.4 && !this.spawnedWaves["w1_mid"]) {
            this.spawnedWaves["w1_mid"] = true;
            this.spawnShockwave(this.sweepDir);
        }
    }
    
    if (this.elapsed >= 3.6 && this.elapsed < 4.6) {
        // Wave 2 Warning
        this.warningActive = true;
        this.sweepDir = -1;
    } else if (this.elapsed >= 4.6 && this.elapsed < 5.6) {
        // Wave 2 Active Sweep
        this.sweepActive = true;
        this.sweepDir = -1;
        this.sweepProgress = (this.elapsed - 4.6) / 1.0;
        
        // Trigger screen shake
        if (typeof triggerShake === "function" && Math.random() < 0.2) {
            triggerShake(4, 150);
        }
        
        // Spawn shockwave bullets at impact
        if (this.sweepProgress > 0.4 && !this.spawnedWaves["w2_mid"]) {
            this.spawnedWaves["w2_mid"] = true;
            this.spawnShockwave(this.sweepDir);
        }
    }
    
    // Update existing shockwave bullets
    BulletPattern.prototype.update.call(this, dt);
    
    // Remove out-of-bounds bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        if (this.bullets[i].isOutOfBounds([bb[0] - 50, bb[1] - 50, bb[2] + 50, bb[3] + 50])) {
            this.bullets.splice(i, 1);
        }
    }
};

GodzillaTailWhipPattern.prototype.spawnShockwave = function(direction) {
    var bb = Cbbox.getBound();
    var boxH = bb[3] - bb[1];
    
    Sound.playSound("impact", true);
    
    // Spawn 5 blue shockwave bullets shooting vertically/horizontally
    var spawnX = direction === 1 ? bb[2] - 15 : bb[0] + 15;
    
    for (var i = 0; i < 6; i++) {
        var ratio = i / 5;
        var bulletY = bb[1] + 10 + ratio * (boxH - 30);
        
        this.bullets.push(new Bullet({
            x: spawnX,
            y: bulletY,
            width: 14,
            height: 14,
            speed: 0,
            damVal: this.damVal,
            rotation: 0,
            fadeSpeed: 1.0,
            color: "#00E5FF", // Neon blue shockwave
            vx: direction === 1 ? -170 : 170, // Shoot inwards
            vy: (Math.random() - 0.5) * 30,
            useVelocity: true
        }));
    }
};

GodzillaTailWhipPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    
    ctx.save();
    
    // 1. Draw warning indicators
    if (this.warningActive) {
        ctx.fillStyle = "rgba(0, 180, 255, 0.12)";
        ctx.fillRect(bb[0], this.sweepY - this.sweepHeight * 0.5, boxW, this.sweepHeight);
        
        ctx.strokeStyle = "rgba(0, 220, 255, 0.5)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 8]);
        
        ctx.beginPath();
        ctx.moveTo(bb[0], this.sweepY - this.sweepHeight * 0.5);
        ctx.lineTo(bb[2], this.sweepY - this.sweepHeight * 0.5);
        ctx.moveTo(bb[0], this.sweepY + this.sweepHeight * 0.5);
        ctx.lineTo(bb[2], this.sweepY + this.sweepHeight * 0.5);
        ctx.stroke();
        
        // Direction arrows warning
        ctx.fillStyle = "rgba(0, 230, 255, 0.35)";
        ctx.font = "14pt Determination Mono";
        ctx.textAlign = "center";
        var warnText = this.sweepDir === 1 ? "TAIL SWEEP >>>" : "<<< TAIL SWEEP";
        ctx.fillText(warnText, bb[0] + boxW * 0.5, this.sweepY + 5);
    }
    
    // 2. Draw sweeping procedural tail
    if (this.sweepActive) {
        var tailX;
        if (this.sweepDir === 1) {
            tailX = bb[0] + this.sweepProgress * (boxW + 120) - 60;
        } else {
            tailX = bb[2] - this.sweepProgress * (boxW + 120) + 60;
        }
        
        // Draw the tail segment block
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(0, 140, 255, 0.6)";
        
        // Scaly tail geometry
        ctx.fillStyle = "#1E2727";
        ctx.strokeStyle = "#00D2FF";
        ctx.lineWidth = 2.5;
        
        ctx.beginPath();
        if (this.sweepDir === 1) {
            // Pointing to the right
            ctx.moveTo(tailX - 80, this.sweepY - 5);
            ctx.quadraticCurveTo(tailX - 40, this.sweepY - this.sweepHeight * 0.5, tailX + 25, this.sweepY - this.sweepHeight * 0.3);
            ctx.lineTo(tailX + 55, this.sweepY); // Tip
            ctx.lineTo(tailX + 25, this.sweepY + this.sweepHeight * 0.3);
            ctx.quadraticCurveTo(tailX - 40, this.sweepY + this.sweepHeight * 0.5, tailX - 80, this.sweepY + 5);
        } else {
            // Pointing to the left
            ctx.moveTo(tailX + 80, this.sweepY - 5);
            ctx.quadraticCurveTo(tailX + 40, this.sweepY - this.sweepHeight * 0.5, tailX - 25, this.sweepY - this.sweepHeight * 0.3);
            ctx.lineTo(tailX - 55, this.sweepY); // Tip
            ctx.lineTo(tailX - 25, this.sweepY + this.sweepHeight * 0.3);
            ctx.quadraticCurveTo(tailX + 40, this.sweepY + this.sweepHeight * 0.5, tailX + 80, this.sweepY + 5);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw glowing neon blue spines on the sweeping tail
        ctx.fillStyle = "#00B2FF";
        for (var s = 0; s < 4; s++) {
            var sx = tailX - 50 * this.sweepDir + s * 22 * this.sweepDir;
            var sy = this.sweepY - this.sweepHeight * 0.2 - s * 2;
            ctx.beginPath();
            ctx.moveTo(sx - 5, sy);
            ctx.lineTo(sx, sy - 15);
            ctx.lineTo(sx + 5, sy);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // 3. Draw shockwave bullets
    BulletPattern.prototype.draw.call(this, ctx);
    
    ctx.restore();
};

GodzillaTailWhipPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    // 1. Check collision with procedural sweeping tail
    if (this.sweepActive) {
        var bb = Cbbox.getBound();
        var boxW = bb[2] - bb[0];
        
        var tailX;
        if (this.sweepDir === 1) {
            tailX = bb[0] + this.sweepProgress * (boxW + 120) - 60;
        } else {
            tailX = bb[2] - this.sweepProgress * (boxW + 120) + 60;
        }
        
        // Approximate tail bounds
        var tailLeft = this.sweepDir === 1 ? tailX - 80 : tailX - 55;
        var tailRight = this.sweepDir === 1 ? tailX + 55 : tailX + 80;
        var tailTop = this.sweepY - this.sweepHeight * 0.5;
        var tailBottom = this.sweepY + this.sweepHeight * 0.5;
        
        // Check overlap with the sweeping tail bounding box
        var hitTail = rectsOverlap(sx, sy, sw, sh, tailLeft, tailTop, tailRight - tailLeft, tailBottom - tailTop);
        if (hitTail) {
            return this.damVal;
        }
    }
    
    // 2. Check collision with shockwave bullets using base class method
    return BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
};

GodzillaTailWhipPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
