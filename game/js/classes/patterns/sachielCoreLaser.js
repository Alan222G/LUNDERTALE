// sachielCoreLaser.js - Sachiel's signature devastating core/eye laser beam
var SachielCoreLaserPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 14;
    
    this.state = "TRACKING"; // TRACKING -> LOCK -> FIRE -> COOLDOWN
    this.stateTimer = 0;
    this.laserX = 0;
    this.laserWidth = 60;
    
    this.trackSpeed = 150;
};

SachielCoreLaserPattern.prototype = Object.create(BulletPattern.prototype);

SachielCoreLaserPattern.prototype.generateBullets = function(battleBox) {
    var bb = Cbbox.getBound();
    this.laserX = (bb[0] + bb[2]) / 2;
    this.elapsed = 0;
    this.stateTimer = 0;
    this.state = "TRACKING";
};

SachielCoreLaserPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.stateTimer += dt;
    
    var bb = Cbbox.getBound();
    var soulPos = Cplayer.pos;
    
    if (this.state === "TRACKING") {
        // Move target X towards player X
        if (this.laserX < soulPos.x - 5) {
            this.laserX += this.trackSpeed * dt;
        } else if (this.laserX > soulPos.x + 5) {
            this.laserX -= this.trackSpeed * dt;
        }
        
        // Clamp to box
        if (this.laserX < bb[0] + this.laserWidth/2) this.laserX = bb[0] + this.laserWidth/2;
        if (this.laserX > bb[2] - this.laserWidth/2) this.laserX = bb[2] - this.laserWidth/2;
        
        // As time goes on, track speed increases
        this.trackSpeed += 50 * dt;
        
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
                this.trackSpeed = 150;
            }
        }
    }
};

SachielCoreLaserPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var bh = bb[3] - bb[1];
    
    if (this.state === "TRACKING") {
        // Draw thin tracking line
        ctx.strokeStyle = "rgba(255, 0, 100, 0.5)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(this.laserX, bb[1] - 50);
        ctx.lineTo(this.laserX, bb[3]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw crosshair at bottom
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.arc(this.laserX, bb[3], 10, 0, Math.PI*2);
        ctx.moveTo(this.laserX - 15, bb[3]); ctx.lineTo(this.laserX + 15, bb[3]);
        ctx.moveTo(this.laserX, bb[3] - 15); ctx.lineTo(this.laserX, bb[3] + 15);
        ctx.stroke();
        
    } else if (this.state === "LOCK") {
        // Line solidifies and flashes
        var pulse = (Math.floor(this.stateTimer * 15) % 2 === 0);
        ctx.fillStyle = pulse ? "rgba(255, 0, 100, 0.8)" : "rgba(255, 255, 255, 0.8)";
        ctx.fillRect(this.laserX - 2, bb[1] - 50, 4, bh + 50);
        
    } else if (this.state === "FIRE") {
        // Massive purple/pink beam
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#FF00FF";
        
        var grad = ctx.createLinearGradient(this.laserX - this.laserWidth/2, 0, this.laserX + this.laserWidth/2, 0);
        grad.addColorStop(0, "rgba(255, 0, 100, 0)");
        grad.addColorStop(0.2, "rgba(200, 0, 255, 0.9)");
        grad.addColorStop(0.5, "#FFFFFF");
        grad.addColorStop(0.8, "rgba(200, 0, 255, 0.9)");
        grad.addColorStop(1, "rgba(255, 0, 100, 0)");
        
        // Expand/contract animation
        var curWidth = this.laserWidth;
        if (this.stateTimer < 0.2) curWidth = this.laserWidth * (this.stateTimer / 0.2);
        if (this.stateTimer > 1.3) curWidth = this.laserWidth * ((1.5 - this.stateTimer) / 0.2);
        
        ctx.fillStyle = grad;
        ctx.fillRect(this.laserX - curWidth/2, bb[1] - 50, curWidth, bh + 50);
        
        // Draw chaotic particles within the beam
        ctx.fillStyle = "#FFFFFF";
        for(var i=0; i<10; i++) {
            var px = this.laserX + (Math.random() - 0.5) * curWidth * 0.8;
            var py = bb[1] + Math.random() * bh;
            ctx.fillRect(px, py, 2, 10 + Math.random() * 20);
        }
        
        ctx.shadowBlur = 0;
    }
};

SachielCoreLaserPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    if (this.state === "FIRE") {
        // Laser is at full width between 0.2 and 1.3 seconds
        if (this.stateTimer > 0.2 && this.stateTimer < 1.3) {
            // Check intersection with laser rect
            var lx1 = this.laserX - this.laserWidth/2 + 10; // Forgiving hitbox
            var lx2 = this.laserX + this.laserWidth/2 - 10;
            
            if (sx + sw > lx1 && sx < lx2) {
                return this.damVal;
            }
        }
    }
    return 0;
};

SachielCoreLaserPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.state === "COOLDOWN";
};
