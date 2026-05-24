// godzillaAtomicBreath.js — Godzilla's signature atomic breath beam with cover mechanics
var GodzillaAtomicBreathPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 12; // Extremely high damage to force cover
    this.rocks = [];
    this.laserActive = false;
    this.warningActive = false;
    this.laserThickness = 0;
    this.shakeTimer = 0;
};

GodzillaAtomicBreathPattern.prototype = Object.create(BulletPattern.prototype);

GodzillaAtomicBreathPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.laserActive = false;
    this.warningActive = true;
    this.laserThickness = 0;
    
    // Spawn 3 cover rocks at bottom of the box
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    
    var rx1 = bb[0] + boxW * 0.15;
    var rx2 = bb[0] + boxW * 0.45;
    var rx3 = bb[0] + boxW * 0.75;
    
    var rockW = 42;
    var rockH = 50;
    
    this.rocks = [
        { x: rx1, y: bb[3] - rockH, w: rockW, h: rockH, color: "#8B8D91" },
        { x: rx2, y: bb[3] - rockH, w: rockW, h: rockH, color: "#929599" },
        { x: rx3, y: bb[3] - rockH, w: rockW, h: rockH, color: "#85878A" }
    ];
};

GodzillaAtomicBreathPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.shakeTimer += dt;
    
    var bb = Cbbox.getBound();
    
    if (this.elapsed < 2.0) {
        // Charging warning phase
        this.warningActive = true;
        this.laserActive = false;
        this.laserThickness = 0.05 + Math.sin(this.elapsed * 12) * 0.03;
    } else if (this.elapsed < this.duration) {
        // Blast phase
        this.warningActive = false;
        this.laserActive = true;
        
        // Pulsating thickness
        var pulse = Math.sin(this.elapsed * 35) * 0.15 + 0.85;
        this.laserThickness = 55 * pulse;
        
        // Trigger subtle screen shake on each frame
        if (typeof triggerShake === "function" && Math.random() < 0.3) {
            triggerShake(3, 100);
        }
    } else {
        // Cool down phase
        this.laserActive = false;
        this.warningActive = false;
        this.laserThickness = 0;
    }
    
    BulletPattern.prototype.update.call(this, dt);
};

GodzillaAtomicBreathPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];
    var cx = bb[0] + boxW / 2;
    
    ctx.save();
    
    // 1. Draw the laser shadow zone (the safe space behind the rocks)
    if (this.laserActive) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        for (var i = 0; i < this.rocks.length; i++) {
            var r = this.rocks[i];
            // Fill from rock bottom to battlebox bottom
            ctx.fillRect(r.x - 2, r.y + 10, r.w + 4, bb[3] - r.y);
        }
    }
    
    // 2. Draw rocks (escombros)
    for (var i = 0; i < this.rocks.length; i++) {
        var r = this.rocks[i];
        
        // Main rock body
        ctx.fillStyle = r.color;
        ctx.strokeStyle = "#404245";
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(r.x, r.y + r.h);
        ctx.lineTo(r.x - 3, r.y + r.h * 0.4);
        ctx.lineTo(r.x + r.w * 0.2, r.y + 4);
        ctx.lineTo(r.x + r.w * 0.5, r.y);
        ctx.lineTo(r.x + r.w * 0.8, r.y + 8);
        ctx.lineTo(r.x + r.w + 3, r.y + r.h * 0.5);
        ctx.lineTo(r.x + r.w, r.y + r.h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Highlight side (left-top)
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.beginPath();
        ctx.moveTo(r.x - 2, r.y + r.h * 0.4);
        ctx.lineTo(r.x + r.w * 0.2, r.y + 5);
        ctx.lineTo(r.x + r.w * 0.5, r.y + 2);
        ctx.stroke();
        
        // Shading cracks and details on rock
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(r.x + r.w * 0.4, r.y + 10);
        ctx.lineTo(r.x + r.w * 0.35, r.y + r.h * 0.6);
        ctx.lineTo(r.x + r.w * 0.5, r.y + r.h * 0.8);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(r.x + r.w * 0.7, r.y + 15);
        ctx.lineTo(r.x + r.w * 0.8, r.y + r.h * 0.5);
        ctx.stroke();
    }
    
    // 3. Draw Laser Beam (fires downwards from the ceiling, covering upper 75% of box)
    var laserBottomY = bb[3] - 40; // Leaves safe zone at the bottom floor
    
    if (this.warningActive) {
        // Draw thin pulsating warning line (red and electric blue)
        ctx.save();
        ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bb[0], bb[1] + boxH * 0.3);
        ctx.lineTo(bb[2], bb[1] + boxH * 0.3);
        ctx.stroke();
        
        // Electric warning rays from ceiling
        ctx.strokeStyle = "rgba(0, 180, 255, 0.8)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(bb[0], bb[1] + 10);
        ctx.lineTo(bb[2], bb[1] + 10);
        ctx.moveTo(bb[0], laserBottomY);
        ctx.lineTo(bb[2], laserBottomY);
        ctx.stroke();
        ctx.restore();
    } else if (this.laserActive) {
        // Draw massive atomic breath beam
        ctx.save();
        
        var shakeOffset = Math.sin(this.shakeTimer * 50) * 1.5;
        var beamY = bb[1] + boxH * 0.38 + shakeOffset;
        var beamHeight = this.laserThickness;
        
        // Background blast glow (huge soft blue rect)
        ctx.fillStyle = "rgba(0, 100, 255, 0.12)";
        ctx.fillRect(bb[0], bb[1], boxW, laserBottomY - bb[1]);
        
        // Main laser glow outer layer (bright neon blue)
        var outerGrad = ctx.createLinearGradient(0, beamY - beamHeight * 1.2, 0, beamY + beamHeight * 1.2);
        outerGrad.addColorStop(0, "rgba(0, 80, 255, 0)");
        outerGrad.addColorStop(0.3, "rgba(0, 140, 255, 0.4)");
        outerGrad.addColorStop(0.5, "rgba(0, 210, 255, 0.85)");
        outerGrad.addColorStop(0.7, "rgba(0, 140, 255, 0.4)");
        outerGrad.addColorStop(1, "rgba(0, 80, 255, 0)");
        
        ctx.fillStyle = outerGrad;
        ctx.shadowBlur = 30;
        ctx.shadowColor = "#00B2FF";
        ctx.fillRect(bb[0], beamY - beamHeight * 0.8, boxW, beamHeight * 1.6);
        
        // Laser core layer (extremely bright cyan/white core)
        var coreGrad = ctx.createLinearGradient(0, beamY - beamHeight * 0.3, 0, beamY + beamHeight * 0.3);
        coreGrad.addColorStop(0, "rgba(0, 230, 255, 0)");
        coreGrad.addColorStop(0.3, "rgba(220, 250, 255, 0.8)");
        coreGrad.addColorStop(0.5, "rgba(255, 255, 255, 1.0)");
        coreGrad.addColorStop(0.7, "rgba(220, 250, 255, 0.8)");
        coreGrad.addColorStop(1, "rgba(0, 230, 255, 0)");
        
        ctx.fillStyle = coreGrad;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#FFFFFF";
        ctx.fillRect(bb[0], beamY - beamHeight * 0.3, boxW, beamHeight * 0.6);
        
        // Swirling plasma rings and electrical sparks along the beam
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1.5;
        var rSpacing = 80;
        var rOffset = (this.elapsed * 450) % rSpacing;
        for (var rx = bb[0] - rOffset; rx < bb[2] + rSpacing; rx += rSpacing) {
            ctx.beginPath();
            ctx.ellipse(rx, beamY, beamHeight * 0.25, beamHeight * 0.6, 0.3, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Spark particles flying off
        ctx.fillStyle = "rgba(0, 240, 255, 0.8)";
        for (var spIdx = 0; spIdx < 12; spIdx++) {
            var spx = bb[0] + (spIdx * 113 + this.elapsed * 320) % boxW;
            var spy = beamY + Math.sin(spIdx * 1.4 + this.elapsed * 10) * beamHeight * 0.5;
            var spSize = 1.2 + Math.abs(Math.sin(this.elapsed * 8 + spIdx)) * 1.5;
            ctx.beginPath();
            ctx.arc(spx, spy, spSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    ctx.restore();
};

GodzillaAtomicBreathPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    if (!this.laserActive) return 0;
    
    var bb = Cbbox.getBound();
    var boxH = bb[3] - bb[1];
    var shakeOffset = Math.sin(this.shakeTimer * 50) * 1.5;
    var beamY = bb[1] + boxH * 0.38 + shakeOffset;
    var beamHeight = this.laserThickness;
    
    // The actual area of the laser beam vertically
    var beamTop = beamY - beamHeight * 0.5;
    var beamBottom = beamY + beamHeight * 0.5;
    
    // Check if the soul intersects with the laser beam vertically
    var intersectsLaserVertically = rectsOverlap(sx, sy, sw, sh, bb[0], beamTop, bb[2] - bb[0], beamBottom - beamTop);
    if (!intersectsLaserVertically) return 0; // Soul is below or above the laser beam
    
    // If the soul is at the bottom floor, check if it's protected by a rock
    var soulCenterX = sx + sw / 2;
    for (var i = 0; i < this.rocks.length; i++) {
        var r = this.rocks[i];
        
        // If soul falls inside the rock's X span AND the soul is at the bottom (rock level)
        if (soulCenterX >= r.x && soulCenterX <= r.x + r.w) {
            // Protected! Return no damage
            return 0; 
        }
    }
    
    // Exposed to atomic breath! Return extremely high damage value
    return this.damVal;
};

GodzillaAtomicBreathPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};
