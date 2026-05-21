// sachielRibCage.js - Massive bone ribs close in from the sides, restricting space while spikes shoot horizontally
var SachielRibCagePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 10;
    this.ribs = [];
    this.spikes = [];
    
    this.state = "WARN"; // WARN -> CLOSE -> ATTACK -> OPEN
    this.stateTimer = 0;
    
    // Rib positions
    this.leftRibX = 0;
    this.rightRibX = 0;
    
    this.spikeTimer = 0;
};

SachielRibCagePattern.prototype = Object.create(BulletPattern.prototype);

SachielRibCagePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.stateTimer += dt;
    
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var ribWidth = 60; // How far they extend into the box
    
    if (this.state === "WARN") {
        this.leftRibX = bb[0] - ribWidth;
        this.rightRibX = bb[2] + ribWidth;
        if (this.stateTimer >= 1.0) {
            this.state = "CLOSE";
            this.stateTimer = 0;
        }
    } else if (this.state === "CLOSE") {
        // Move ribs inward
        var progress = this.stateTimer / 0.5;
        if (progress > 1) progress = 1;
        
        // Easing out
        progress = 1 - Math.pow(1 - progress, 3);
        
        this.leftRibX = (bb[0] - ribWidth) + (ribWidth * progress);
        this.rightRibX = (bb[2] + ribWidth) - (ribWidth * progress);
        
        if (this.stateTimer >= 0.5) {
            this.state = "ATTACK";
            this.stateTimer = 0;
        }
    } else if (this.state === "ATTACK") {
        // Ribs are closed, shoot spikes
        this.spikeTimer += dt;
        if (this.spikeTimer >= 0.4) {
            this.spikeTimer = 0;
            
            // Randomly choose left or right rib to shoot from
            var fromLeft = Math.random() > 0.5;
            var startX = fromLeft ? this.leftRibX : this.rightRibX;
            var targetX = fromLeft ? this.rightRibX : this.leftRibX;
            
            // Random height
            var startY = bb[1] + 20 + Math.random() * (bb[3] - bb[1] - 40);
            
            this.spikes.push({
                x: startX,
                y: startY,
                targetX: targetX,
                vx: fromLeft ? 400 : -400,
                width: 30,
                height: 8,
                warningTime: 0.3,
                warningTimer: 0,
                active: false
            });
        }
        
        // Update spikes
        for (var i = this.spikes.length - 1; i >= 0; i--) {
            var s = this.spikes[i];
            if (!s.active) {
                s.warningTimer += dt;
                if (s.warningTimer >= s.warningTime) {
                    s.active = true;
                }
            } else {
                s.x += s.vx * dt;
                // Remove if it passes the other rib
                if ((s.vx > 0 && s.x > s.targetX) || (s.vx < 0 && s.x < s.targetX)) {
                    this.spikes.splice(i, 1);
                }
            }
        }
        
        if (this.elapsed >= this.duration - 1.0) {
            this.state = "OPEN";
            this.stateTimer = 0;
        }
    } else if (this.state === "OPEN") {
        // Move ribs outward
        var progress = this.stateTimer / 0.5;
        if (progress > 1) progress = 1;
        
        this.leftRibX = bb[0] - (ribWidth * progress);
        this.rightRibX = bb[2] + (ribWidth * progress);
        
        // Let spikes finish
        for (var i = this.spikes.length - 1; i >= 0; i--) {
            var s = this.spikes[i];
            if (s.active) {
                s.x += s.vx * dt;
            }
        }
    }
};

SachielRibCagePattern.prototype.drawRibLine = function(ctx, startX, startY, isRight) {
    var sign = isRight ? -1 : 1;
    ctx.save();
    ctx.translate(startX, startY);
    ctx.scale(sign, 1); // Flip if right side
    
    // Bone color and style
    ctx.fillStyle = "#e0dad0";
    ctx.strokeStyle = "rgba(50, 40, 30, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    
    // Draw a jagged rib structure
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(-60, -10);
    ctx.lineTo(-40, 0);
    ctx.lineTo(-50, 20);
    ctx.lineTo(0, 30);
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
};

SachielRibCagePattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    
    // 1. Draw Warnings for Spikes
    for (var i = 0; i < this.spikes.length; i++) {
        var s = this.spikes[i];
        if (!s.active) {
            var alpha = (s.warningTimer / s.warningTime);
            ctx.fillStyle = "rgba(255, 0, 0, " + (alpha * 0.5) + ")";
            // Draw warning line across
            if (s.vx > 0) {
                ctx.fillRect(s.x, s.y - s.height/2, bb[2] - bb[0], s.height);
            } else {
                ctx.fillRect(bb[0], s.y - s.height/2, bb[2] - bb[0], s.height);
            }
        }
    }
    
    // 2. Draw Active Spikes
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ff0000";
    for (var i = 0; i < this.spikes.length; i++) {
        var s = this.spikes[i];
        if (s.active) {
            ctx.beginPath();
            if (s.vx > 0) {
                // Pointing right
                ctx.moveTo(s.x - s.width, s.y - s.height/2);
                ctx.lineTo(s.x, s.y);
                ctx.lineTo(s.x - s.width, s.y + s.height/2);
            } else {
                // Pointing left
                ctx.moveTo(s.x + s.width, s.y - s.height/2);
                ctx.lineTo(s.x, s.y);
                ctx.lineTo(s.x + s.width, s.y + s.height/2);
            }
            ctx.fill();
        }
    }
    ctx.shadowBlur = 0;
    
    // 3. Draw The Giant Ribs
    var numRibs = 4;
    var spaceY = (bb[3] - bb[1]) / (numRibs + 1);
    
    // Left Ribs
    for (var r = 1; r <= numRibs; r++) {
        this.drawRibLine(ctx, this.leftRibX, bb[1] + r * spaceY, false);
    }
    
    // Right Ribs
    for (var r = 1; r <= numRibs; r++) {
        this.drawRibLine(ctx, this.rightRibX, bb[1] + r * spaceY, true);
    }
    
    // 4. Draw Warning if in WARN state
    if (this.state === "WARN") {
        var alpha = (this.stateTimer / 1.0);
        ctx.fillStyle = "rgba(255, 0, 0, " + (alpha * 0.3) + ")";
        ctx.fillRect(bb[0], bb[1], 60, bb[3] - bb[1]); // Left warn
        ctx.fillRect(bb[2] - 60, bb[1], 60, bb[3] - bb[1]); // Right warn
    }
};

SachielRibCagePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    // 1. Rib collision (they act as solid walls that hurt)
    if (sx < this.leftRibX) return this.damVal;
    if (sx + sw > this.rightRibX) return this.damVal;
    
    // 2. Spike collision
    for (var i = 0; i < this.spikes.length; i++) {
        var s = this.spikes[i];
        if (s.active) {
            // Treat spike as a rectangle for collision
            var spX = s.vx > 0 ? s.x - s.width : s.x;
            var spY = s.y - s.height/2;
            
            if (sx + sw > spX && sx < spX + s.width &&
                sy + sh > spY && sy < spY + s.height) {
                return this.damVal;
            }
        }
    }
    
    return 0;
};

SachielRibCagePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.state === "OPEN";
};
