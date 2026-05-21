// sachielRegeneration.js - Replaced by user request: Floor Spike Trap
// Glowing energy spikes thrust up from the floor
var SachielRegenerationPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 12;
    
    this.spikes = [];
    this.spawnTimer = 0;
    this.spawnInterval = 0.6;
    this.spikeWidth = 25;
};

SachielRegenerationPattern.prototype = Object.create(BulletPattern.prototype);

SachielRegenerationPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    
    // Spawn new spikes
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        
        // Pick a random X position within the box
        var numSpikes = 1 + Math.floor(Math.random() * 2);
        for (var i = 0; i < numSpikes; i++) {
            var sx = bb[0] + 15 + Math.random() * (bb[2] - bb[0] - 30);
            
            this.spikes.push({
                x: sx,
                state: "WARN", // WARN -> THRUST -> RETRACT
                timer: 0,
                warnTime: 0.6,
                thrustTime: 0.3,
                retractTime: 0.3,
                height: 0,
                targetHeight: (bb[3] - bb[1]) * 0.8 // Spikes reach 80% up the box
            });
        }
        
        if (this.spawnInterval > 0.3) this.spawnInterval -= 0.05;
    }
    
    // Update spikes
    for (var i = this.spikes.length - 1; i >= 0; i--) {
        var s = this.spikes[i];
        s.timer += dt;
        
        if (s.state === "WARN") {
            if (s.timer >= s.warnTime) {
                s.state = "THRUST";
                s.timer = 0;
            }
        } else if (s.state === "THRUST") {
            // Rapidly increase height
            var progress = s.timer / s.thrustTime;
            s.height = s.targetHeight * Math.min(1, progress);
            
            if (s.timer >= s.thrustTime) {
                s.state = "RETRACT";
                s.timer = 0;
            }
        } else if (s.state === "RETRACT") {
            // Quickly pull back down
            var progress = s.timer / s.retractTime;
            s.height = s.targetHeight * (1 - Math.min(1, progress));
            
            if (s.timer >= s.retractTime) {
                this.spikes.splice(i, 1);
            }
        }
    }
};

SachielRegenerationPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    
    ctx.save();
    for (var i = 0; i < this.spikes.length; i++) {
        var s = this.spikes[i];
        
        if (s.state === "WARN") {
            // Draw warning zone on the floor
            var alpha = (s.timer / s.warnTime);
            ctx.fillStyle = "rgba(255, 0, 0, " + (alpha * 0.5) + ")";
            ctx.fillRect(s.x - this.spikeWidth/2, bb[3] - 10, this.spikeWidth, 10);
            
            // Draw a thin rising warning line
            ctx.strokeStyle = "rgba(255, 0, 0, " + (alpha * 0.8) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(s.x, bb[3]);
            ctx.lineTo(s.x, bb[3] - s.targetHeight);
            ctx.stroke();
            
        } else if (s.state === "THRUST" || s.state === "RETRACT") {
            // Draw the energy spike
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#FF0000";
            
            // A sharp bone-like or energy-like spike
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.moveTo(s.x - this.spikeWidth/2, bb[3]);
            ctx.lineTo(s.x - this.spikeWidth/2, bb[3] - s.height + 20); // base of tip
            ctx.lineTo(s.x, bb[3] - s.height); // tip
            ctx.lineTo(s.x + this.spikeWidth/2, bb[3] - s.height + 20);
            ctx.lineTo(s.x + this.spikeWidth/2, bb[3]);
            ctx.fill();
            
            // Inner red core
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#FF0000";
            ctx.beginPath();
            ctx.moveTo(s.x - this.spikeWidth/4, bb[3]);
            ctx.lineTo(s.x - this.spikeWidth/4, bb[3] - s.height + 25);
            ctx.lineTo(s.x, bb[3] - s.height + 5);
            ctx.lineTo(s.x + this.spikeWidth/4, bb[3] - s.height + 25);
            ctx.lineTo(s.x + this.spikeWidth/4, bb[3]);
            ctx.fill();
        }
    }
    ctx.restore();
};

SachielRegenerationPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    
    for (var i = 0; i < this.spikes.length; i++) {
        var s = this.spikes[i];
        if (s.state === "THRUST" || s.state === "RETRACT") {
            var spikeTopY = bb[3] - s.height;
            var spikeLeft = s.x - this.spikeWidth/2;
            var spikeRight = s.x + this.spikeWidth/2;
            
            // Simple AABB collision with the spike rect
            if (sx + sw > spikeLeft && sx < spikeRight) {
                if (sy + sh > spikeTopY) { // If soul is lower than the spike top
                    return this.damVal;
                }
            }
        }
    }
    return 0;
};

SachielRegenerationPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.spikes.length === 0;
};
