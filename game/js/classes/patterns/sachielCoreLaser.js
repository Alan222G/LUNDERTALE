// sachielCoreLaser.js - Sachiel's signature devastating core/eye laser beams
var SachielCoreLaserPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 14;
    
    this.state = "TRACKING"; // TRACKING -> LOCK -> FIRE -> COOLDOWN
    this.stateTimer = 0;
    this.laserWidth = 60;
    
    this.lasers = [
        { type: "vertical", pos: 0, trackSpeed: 150 },
        { type: "horizontal", pos: 0, trackSpeed: 150 }
    ];
};

SachielCoreLaserPattern.prototype = Object.create(BulletPattern.prototype);

SachielCoreLaserPattern.prototype.generateBullets = function(battleBox) {
    var bb = Cbbox.getBound();
    this.lasers[0].pos = (bb[0] + bb[2]) / 2; // Vertical laser starts in middle X
    this.lasers[1].pos = (bb[1] + bb[3]) / 2; // Horizontal laser starts in middle Y
    this.elapsed = 0;
    this.stateTimer = 0;
    this.state = "TRACKING";
};

SachielCoreLaserPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.stateTimer += dt;
    
    var bb = Cbbox.getBound();
    var soulPos = Soul.getPos();
    
    if (this.state === "TRACKING") {
        for (var i = 0; i < this.lasers.length; i++) {
            var l = this.lasers[i];
            
            if (l.type === "vertical") {
                // Move target X towards player X
                if (l.pos < soulPos.x - 5) l.pos += l.trackSpeed * dt;
                else if (l.pos > soulPos.x + 5) l.pos -= l.trackSpeed * dt;
                
                // Clamp to box
                if (l.pos < bb[0] + this.laserWidth/2) l.pos = bb[0] + this.laserWidth/2;
                if (l.pos > bb[2] - this.laserWidth/2) l.pos = bb[2] - this.laserWidth/2;
            } else {
                // Move target Y towards player Y
                if (l.pos < soulPos.y - 5) l.pos += l.trackSpeed * dt;
                else if (l.pos > soulPos.y + 5) l.pos -= l.trackSpeed * dt;
                
                // Clamp to box
                if (l.pos < bb[1] + this.laserWidth/2) l.pos = bb[1] + this.laserWidth/2;
                if (l.pos > bb[3] - this.laserWidth/2) l.pos = bb[3] - this.laserWidth/2;
            }
            
            // As time goes on, track speed increases
            l.trackSpeed += 50 * dt;
        }
        
        if (this.stateTimer >= 2.0) {
            this.state = "LOCK";
            this.stateTimer = 0;
        }
    } else if (this.state === "LOCK") {
        // Laser stops moving, flashes red
        if (this.stateTimer >= 0.8) {
            this.state = "FIRE";
            this.stateTimer = 0;
            
            // Screen shake handled externally usually, but we can do it via Main if needed
            if (window.main) main.shake = 10;
        }
    } else if (this.state === "FIRE") {
        // Full width laser fires
        if (this.stateTimer >= 1.5) {
            this.state = "COOLDOWN";
            this.stateTimer = 0;
        }
    } else if (this.state === "COOLDOWN") {
        if (this.stateTimer >= 0.5) {
            // Loop if we have enough time
            if (this.elapsed < this.duration - 3.0) {
                this.state = "TRACKING";
                this.stateTimer = 0;
                this.lasers[0].trackSpeed = 150;
                this.lasers[1].trackSpeed = 150;
            }
        }
    }
};

SachielCoreLaserPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var bw = bb[2] - bb[0];
    var bh = bb[3] - bb[1];
    
    ctx.save();
    
    // Massive local screen shake when firing
    if (this.state === "FIRE") {
        var shake = 10;
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        
        // Initial blinding flash
        if (this.stateTimer < 0.15) {
            ctx.fillStyle = "rgba(255, 255, 255, " + (1 - this.stateTimer/0.15) + ")";
            ctx.fillRect(bb[0] - 50, bb[1] - 50, bw + 100, bh + 100);
        }
    }
    
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        
        if (this.state === "TRACKING") {
            // Draw thin tracking line
            ctx.strokeStyle = "rgba(255, 0, 100, 0.5)";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            
            if (l.type === "vertical") {
                ctx.moveTo(l.pos, bb[1] - 50);
                ctx.lineTo(l.pos, bb[3]);
            } else {
                ctx.moveTo(bb[0], l.pos);
                ctx.lineTo(bb[2] + 50, l.pos);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw crosshair at edge
            ctx.strokeStyle = "red";
            ctx.beginPath();
            if (l.type === "vertical") {
                ctx.arc(l.pos, bb[3], 10, 0, Math.PI*2);
                ctx.moveTo(l.pos - 15, bb[3]); ctx.lineTo(l.pos + 15, bb[3]);
                ctx.moveTo(l.pos, bb[3] - 15); ctx.lineTo(l.pos, bb[3] + 15);
            } else {
                ctx.arc(bb[2], l.pos, 10, 0, Math.PI*2);
                ctx.moveTo(bb[2] - 15, l.pos); ctx.lineTo(bb[2] + 15, l.pos);
                ctx.moveTo(bb[2], l.pos - 15); ctx.lineTo(bb[2], l.pos + 15);
            }
            ctx.stroke();
            
        } else if (this.state === "LOCK") {
            // Line solidifies and flashes
            var pulse = (Math.floor(this.stateTimer * 15) % 2 === 0);
            ctx.fillStyle = pulse ? "rgba(255, 0, 100, 0.8)" : "rgba(255, 255, 255, 0.8)";
            if (l.type === "vertical") {
                ctx.fillRect(l.pos - 2, bb[1] - 50, 4, bh + 50);
            } else {
                ctx.fillRect(bb[0] - 50, l.pos - 2, bw + 100, 4);
            }
            
        } else if (this.state === "FIRE") {
            // Massive purple/pink beam
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#FF00FF";
            
            // Expand/contract animation
            var curWidth = this.laserWidth;
            if (this.stateTimer < 0.2) curWidth = this.laserWidth * (this.stateTimer / 0.2);
            if (this.stateTimer > 1.3) curWidth = this.laserWidth * ((1.5 - this.stateTimer) / 0.2);
            
            var grad;
            if (l.type === "vertical") {
                grad = ctx.createLinearGradient(l.pos - this.laserWidth/2, 0, l.pos + this.laserWidth/2, 0);
            } else {
                grad = ctx.createLinearGradient(0, l.pos - this.laserWidth/2, 0, l.pos + this.laserWidth/2);
            }
            
            grad.addColorStop(0, "rgba(255, 0, 100, 0)");
            grad.addColorStop(0.2, "rgba(200, 0, 255, 0.9)");
            grad.addColorStop(0.5, "#FFFFFF");
            grad.addColorStop(0.8, "rgba(200, 0, 255, 0.9)");
            grad.addColorStop(1, "rgba(255, 0, 100, 0)");
            
            ctx.fillStyle = grad;
            if (l.type === "vertical") {
                ctx.fillRect(l.pos - curWidth/2, bb[1] - 50, curWidth, bh + 50);
            } else {
                ctx.fillRect(bb[0] - 50, l.pos - curWidth/2, bw + 100, curWidth);
            }
            
            // Draw chaotic particles within the beam
            ctx.fillStyle = "#FFFFFF";
            for(var p=0; p<5; p++) {
                if (l.type === "vertical") {
                    var px = l.pos + (Math.random() - 0.5) * curWidth * 0.8;
                    var py = bb[1] + Math.random() * bh;
                    ctx.fillRect(px, py, 2, 10 + Math.random() * 20);
                } else {
                    var px = bb[0] + Math.random() * bw;
                    var py = l.pos + (Math.random() - 0.5) * curWidth * 0.8;
                    ctx.fillRect(px, py, 10 + Math.random() * 20, 2);
                }
            }
            ctx.shadowBlur = 0;
        }
    }
    
    ctx.restore();
};

SachielCoreLaserPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    if (this.state === "FIRE") {
        // Laser is at full width between 0.2 and 1.3 seconds
        if (this.stateTimer > 0.2 && this.stateTimer < 1.3) {
            for (var i = 0; i < this.lasers.length; i++) {
                var l = this.lasers[i];
                
                var l1 = l.pos - this.laserWidth/2 + 10; // Forgiving hitbox
                var l2 = l.pos + this.laserWidth/2 - 10;
                
                if (l.type === "vertical") {
                    if (sx + sw > l1 && sx < l2) return this.damVal;
                } else {
                    if (sy + sh > l1 && sy < l2) return this.damVal;
                }
            }
        }
    }
    return 0;
};

SachielCoreLaserPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.state === "COOLDOWN";
};
