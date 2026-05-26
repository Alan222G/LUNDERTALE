// godzillaMeltdownSpikes.js — Meltdown Spikes attack for Godzilla Phase 3 (Meltdown).
// Crystal spikes emerge violently from the borders of the combat box towards the center, preceded by warning lines.
var GodzillaMeltdownSpikesPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
    
    this.spikes = [];
    this.spikeTimer = 0;
    this.spikeInterval = 1.4; // Wave of spikes every 1.4s
    this.bullets = [];
};

GodzillaMeltdownSpikesPattern.prototype = Object.create(BulletPattern.prototype);

GodzillaMeltdownSpikesPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spikeTimer = 0.8; // Trigger first wave quickly
    this.spikes = [];
    this.bullets = [];
};

GodzillaMeltdownSpikesPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spikeTimer += dt;
    
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];
    
    // 1. Spawn waves of crystal spikes
    if (this.spikeTimer >= this.spikeInterval && this.elapsed < this.duration - 1.5) {
        this.spikeTimer = 0;
        
        Sound.playSound("flash", true);
        
        var warningTime = 0.75;
        var activeTime = 0.45;
        var waveType = Math.floor(Math.random() * 3); // 0: Sides (left/right), 1: Top/Bottom, 2: Alternating corners
        
        if (waveType === 0) {
            // Spikes coming from Left and Right sides
            var numSpikes = 4;
            var gap = boxH / (numSpikes + 1);
            for (var i = 1; i <= numSpikes; i++) {
                var sy = bb[1] + i * gap;
                var side = i % 2 === 0 ? "left" : "right";
                
                this.spikes.push({
                    x1: side === "left" ? bb[0] : bb[2],
                    y1: sy,
                    x2: side === "left" ? bb[0] + boxW * 0.45 : bb[2] - boxW * 0.45,
                    y2: sy,
                    thickness: 18,
                    warningTimer: warningTime,
                    activeTimer: activeTime,
                    elapsed: 0,
                    fired: false,
                    type: "side"
                });
            }
        } else if (waveType === 1) {
            // Spikes coming from Top and Bottom
            var numSpikes = 5;
            var gap = boxW / (numSpikes + 1);
            for (var i = 1; i <= numSpikes; i++) {
                var sx = bb[0] + i * gap;
                var side = i % 2 === 0 ? "top" : "bottom";
                
                this.spikes.push({
                    x1: sx,
                    y1: side === "top" ? bb[1] : bb[3],
                    x2: sx,
                    y2: side === "top" ? bb[1] + boxH * 0.45 : bb[3] - boxH * 0.45,
                    thickness: 18,
                    warningTimer: warningTime,
                    activeTimer: activeTime,
                    elapsed: 0,
                    fired: false,
                    type: "vertical"
                });
            }
        } else {
            // Alternating diagonal spike rows (comb-like)
            var count = 3;
            var step = boxW / 4;
            for (var i = 1; i <= count; i++) {
                var sx = bb[0] + i * step;
                this.spikes.push({
                    x1: sx,
                    y1: bb[3],
                    x2: sx + (i % 2 === 0 ? 30 : -30),
                    y2: bb[1] + boxH * 0.25,
                    thickness: 20,
                    warningTimer: warningTime,
                    activeTimer: activeTime,
                    elapsed: 0,
                    fired: false,
                    type: "comb"
                });
            }
        }
    }
    
    // 2. Update spikes
    for (var i = this.spikes.length - 1; i >= 0; i--) {
        var spike = this.spikes[i];
        spike.elapsed += dt;
        
        if (spike.elapsed >= spike.warningTimer && !spike.fired) {
            spike.fired = true;
            Sound.playSound("impact", true);
            if (typeof triggerShake === "function") triggerShake(2.5, 90);
        }
        
        // Remove spike when done
        if (spike.elapsed >= spike.warningTimer + spike.activeTimer) {
            this.spikes.splice(i, 1);
        }
    }
    
    // Standard update
    BulletPattern.prototype.update.call(this, dt);
};

GodzillaMeltdownSpikesPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();
    
    var glowColor = "rgba(255, 0, 160, 0.85)";
    var spikeColor = "#FF00A0";
    var warningColor = "rgba(255, 0, 0, 0.45)";
    
    for (var i = 0; i < this.spikes.length; i++) {
        var spike = this.spikes[i];
        
        if (!spike.fired) {
            // Draw warning line
            ctx.save();
            ctx.strokeStyle = warningColor;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(spike.x1, spike.y1);
            ctx.lineTo(spike.x2, spike.y2);
            ctx.stroke();
            ctx.restore();
        } else {
            // Draw crystal spike body
            ctx.save();
            ctx.shadowBlur = 12;
            ctx.shadowColor = glowColor;
            ctx.fillStyle = spikeColor;
            
            var lifeRemaining = (spike.warningTimer + spike.activeTimer) - spike.elapsed;
            var opacity = Math.min(1.0, lifeRemaining / 0.15);
            ctx.globalAlpha = opacity;
            
            // Draw spike as a sharp elongated diamond polygon
            var dx = spike.x2 - spike.x1;
            var dy = spike.y2 - spike.y1;
            var len = Math.sqrt(dx * dx + dy * dy);
            var ux = dx / len;
            var uy = dy / len;
            var nx = -uy;
            var ny = ux;
            
            var halfThick = spike.thickness / 2;
            
            ctx.beginPath();
            ctx.moveTo(spike.x1, spike.y1);
            ctx.lineTo(spike.x1 + ux * len * 0.3 + nx * halfThick, spike.y1 + uy * len * 0.3 + ny * halfThick);
            ctx.lineTo(spike.x2, spike.y2); // sharp tip
            ctx.lineTo(spike.x1 + ux * len * 0.3 - nx * halfThick, spike.y1 + uy * len * 0.3 - ny * halfThick);
            ctx.closePath();
            ctx.fill();
            
            // Draw white shining inner core
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.moveTo(spike.x1, spike.y1);
            ctx.lineTo(spike.x1 + ux * len * 0.35 + nx * halfThick * 0.35, spike.y1 + uy * len * 0.35 + ny * halfThick * 0.35);
            ctx.lineTo(spike.x1 + ux * len * 0.95, spike.y1 + uy * len * 0.95);
            ctx.lineTo(spike.x1 + ux * len * 0.35 - nx * halfThick * 0.35, spike.y1 + uy * len * 0.35 - ny * halfThick * 0.35);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    ctx.restore();
};

GodzillaMeltdownSpikesPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.spikes.length; i++) {
        var spike = this.spikes[i];
        if (!spike.fired) continue;
        
        // AABB check approximating diagonal lines
        var halfThick = spike.thickness / 2;
        var lx = Math.min(spike.x1, spike.x2) - 4;
        var ly = Math.min(spike.y1, spike.y2) - halfThick - 4;
        var lw = Math.abs(spike.x2 - spike.x1) + 8;
        var lh = Math.abs(spike.y2 - spike.y1) + spike.thickness + 8;
        
        if (rectsOverlap(lx, ly, lw, lh, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    
    return 0;
};

GodzillaMeltdownSpikesPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.spikes.length === 0;
};
