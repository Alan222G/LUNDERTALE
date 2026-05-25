// godzillaAtomicBreath.js — Godzilla's signature atomic breath beam with physical falling rocks and full-box laser shadows
var GodzillaAtomicBreathPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 9;
    this.elapsed = 0;
    this.damVal = config.damVal || 12; // High damage
    this.rocks = [];
    this.laserActive = false;
    this.warningActive = false;
    this.laserThickness = 0;
    
    // Spark bullet spawning
    this.spawnTimer = 0;
    this.spawnInterval = 0.12;
    this.landedShake = false;
};

GodzillaAtomicBreathPattern.prototype = Object.create(BulletPattern.prototype);

GodzillaAtomicBreathPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.laserActive = false;
    this.warningActive = true;
    this.laserThickness = 0;
    this.spawnTimer = 0;
    this.landedShake = false;
    this.bullets = [];
    
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    
    // Define 3 rock positions
    var rx1 = bb[0] + boxW * 0.15;
    var rx2 = bb[0] + boxW * 0.45;
    var rx3 = bb[0] + boxW * 0.75;
    
    var rockW = 42;
    var rockH = 50;
    
    this.rocks = [
        { x: rx1, y: bb[1] - 80, w: rockW, h: rockH, targetY: bb[3] - rockH, color: "#8B8D91", landed: false },
        { x: rx2, y: bb[1] - 80, w: rockW, h: rockH, targetY: bb[3] - rockH, color: "#929599", landed: false },
        { x: rx3, y: bb[1] - 80, w: rockW, h: rockH, targetY: bb[3] - rockH, color: "#85878A", landed: false }
    ];
};

GodzillaAtomicBreathPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];
    
    // 1. Update Falling Rocks (from t=0.0 to t=1.0)
    var fallTime = 1.0;
    for (var i = 0; i < this.rocks.length; i++) {
        var r = this.rocks[i];
        if (this.elapsed < fallTime) {
            var ratio = this.elapsed / fallTime;
            // Easing function for landing gravity
            r.y = bb[1] - 80 + ratio * ratio * (r.targetY - (bb[1] - 80));
        } else {
            r.y = r.targetY;
            if (!r.landed) {
                r.landed = true;
                if (!this.landedShake) {
                    this.landedShake = true;
                    if (typeof triggerShake === "function") triggerShake(5, 200);
                    Sound.playSound("impact", true);
                }
            }
        }
    }
    
    // 2. Manage Laser Activation
    if (this.elapsed >= 1.5 && this.elapsed < 2.5) {
        // Charging warning
        this.warningActive = true;
        this.laserActive = false;
    } else if (this.elapsed >= 2.5 && this.elapsed < this.duration - 0.8) {
        this.warningActive = false;
        this.laserActive = true;
        
        // Screenshake during blast
        if (typeof triggerShake === "function" && Math.random() < 0.25) {
            triggerShake(4, 100);
        }
        
        // 3. Spawn falling radioactive sparks that player must dodge inside safe zones
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            // Spawn sparks at the top of the box
            this.bullets.push(new Bullet({
                x: bb[0] + Math.random() * (boxW - 14),
                y: bb[1] - 10,
                width: 12,
                height: 12,
                speed: 0,
                damVal: 2, // Halved spark damage
                rotation: 0,
                fadeSpeed: 1.0,
                color: "#FF00E5", // Pink/Blue depending on meltdown, let's use neon purple/magenta
                vx: (Math.random() - 0.5) * 80,
                vy: 140 + Math.random() * 60,
                useVelocity: true
            }));
        }
    } else {
        this.laserActive = false;
        this.warningActive = false;
    }
    
    // Update active spark bullets
    BulletPattern.prototype.update.call(this, dt);
    
    // Filter out-of-bounds bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        if (this.bullets[i].isOutOfBounds([bb[0] - 20, bb[1] - 20, bb[2] + 20, bb[3] + 20])) {
            this.bullets.splice(i, 1);
        }
    }
};

GodzillaAtomicBreathPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];
    
    ctx.save();
    
    // Determine color based on meltdown (rosa/pink vs blue)
    var isMeltdown = (this.battleBox && Cgroup.getBossId() === "godzilla" && Cgroup.getEnemy(0) && Cgroup.getEnemy(0).renderType === "godzilla_meltdown");
    var glowColor = isMeltdown ? "rgba(255, 0, 160, 0.8)" : "rgba(0, 160, 255, 0.8)";
    var beamColor = isMeltdown ? "rgba(255, 0, 120, 0.15)" : "rgba(0, 80, 200, 0.12)";
    var laserCore = isMeltdown ? "rgba(255, 200, 240, 0.85)" : "rgba(200, 240, 255, 0.85)";
    var sparkColor = isMeltdown ? "#FF00A0" : "#00FFFF";
    
    // 1. Draw Massive Laser Beam (Fills entire box vertically EXCEPT shadow zones behind rocks)
    if (this.laserActive) {
        // Soft background ambient glow across the box
        ctx.fillStyle = beamColor;
        ctx.fillRect(bb[0], bb[1], boxW, boxH);
        
        // Draw the full laser block
        ctx.save();
        ctx.shadowBlur = 25;
        ctx.shadowColor = glowColor;
        
        // Draw primary neon color band covering upper 75% of the box
        var pulse = 0.95 + Math.sin(this.elapsed * 40) * 0.05;
        var laserY = bb[1];
        var laserH = boxH - 18; // safe zone only at the very bottom floor (18px)
        
        var beamGrad = ctx.createLinearGradient(0, bb[1], 0, bb[3]);
        beamGrad.addColorStop(0, glowColor);
        beamGrad.addColorStop(0.7, glowColor);
        beamGrad.addColorStop(1, "rgba(0,0,0,0)"); // fades at bottom floor
        ctx.fillStyle = beamGrad;
        ctx.fillRect(bb[0], laserY, boxW, laserH * pulse);
        
        // Draw super bright core
        var coreGrad = ctx.createLinearGradient(0, bb[1], 0, bb[3]);
        coreGrad.addColorStop(0, "#FFFFFF");
        coreGrad.addColorStop(0.6, laserCore);
        coreGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = coreGrad;
        ctx.fillRect(bb[0] + 10, laserY, boxW - 20, laserH * 0.9 * pulse);
        ctx.restore();
        
        // 2. Draw black shadows behind the rocks (blocks the vertical laser blast)
        ctx.fillStyle = "#000000";
        for (var i = 0; i < this.rocks.length; i++) {
            var r = this.rocks[i];
            // Safe zone extends from rock top Y to battlebox bottom Y
            ctx.fillRect(r.x - 3, r.y, r.w + 6, bb[3] - r.y);
        }
    }
    
    // 3. Draw warning lines
    if (this.warningActive) {
        var flash = Math.floor(this.elapsed * 12) % 2;
        ctx.fillStyle = flash ? "rgba(255, 0, 0, 0.15)" : "rgba(255, 0, 0, 0.05)";
        ctx.fillRect(bb[0], bb[1], boxW, boxH);
        
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        // Draw dotted floor warning line where laser will hit
        ctx.moveTo(bb[0], bb[3] - 18);
        ctx.lineTo(bb[2], bb[3] - 18);
        ctx.stroke();
        
        // Warning exclamation marks above unsafe zones
        ctx.fillStyle = "#FF0000";
        ctx.font = "14pt Determination Mono";
        ctx.textAlign = "center";
        ctx.fillText("! GET BEHIND A ROCK !", bb[0] + boxW / 2, bb[1] + 35);
    }
    
    // 4. Draw falling rocks (escombros)
    for (var i = 0; i < this.rocks.length; i++) {
        var r = this.rocks[i];
        
        ctx.save();
        ctx.fillStyle = r.color;
        ctx.strokeStyle = "#404245";
        ctx.lineWidth = 2;
        
        // Rock polygon
        ctx.beginPath();
        ctx.moveTo(r.x, r.y + r.h);
        ctx.lineTo(r.x - 4, r.y + r.h * 0.4);
        ctx.lineTo(r.x + r.w * 0.2, r.y + 4);
        ctx.lineTo(r.x + r.w * 0.5, r.y);
        ctx.lineTo(r.x + r.w * 0.8, r.y + 8);
        ctx.lineTo(r.x + r.w + 4, r.y + r.h * 0.5);
        ctx.lineTo(r.x + r.w, r.y + r.h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Highlight
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.beginPath();
        ctx.moveTo(r.x - 3, r.y + r.h * 0.4);
        ctx.lineTo(r.x + r.w * 0.2, r.y + 5);
        ctx.lineTo(r.x + r.w * 0.5, r.y + 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    // 5. Draw active spark bullets (dodging hazard inside shadows)
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.shadowBlur = 8;
        ctx.shadowColor = sparkColor;
        ctx.fillStyle = sparkColor;
        ctx.beginPath();
        ctx.arc(b.x + 6, b.y + 6, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#FFF";
        ctx.beginPath();
        ctx.arc(b.x + 6, b.y + 6, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    ctx.restore();
};

GodzillaAtomicBreathPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    
    // 1. Check collision with falling rocks (hits player if they touch during fall)
    if (this.elapsed < 1.0) {
        for (var i = 0; i < this.rocks.length; i++) {
            var r = this.rocks[i];
            if (rectsOverlap(sx, sy, sw, sh, r.x, r.y, r.w, r.h)) {
                return 4; // Minor rock impact damage
            }
        }
    }
    
    // 2. Check collision with falling radioactive sparks
    var sparkDmg = BulletPattern.prototype.checkCollision.call(this, sx, sy, sw, sh);
    if (sparkDmg > 0) return sparkDmg;
    
    // 3. Check collision with massive atomic breath beam
    if (this.laserActive) {
        // Player is safe ONLY if they are at the floor AND aligned horizontally inside one of the rocks
        var soulBottom = sy + sh;
        var soulCenterX = sx + sw / 2;
        var isAtBottom = soulBottom >= bb[3] - 22; // Must be at the floor
        
        if (isAtBottom) {
            for (var i = 0; i < this.rocks.length; i++) {
                var r = this.rocks[i];
                // Check if aligned with rock X coordinates (with minor buffer)
                if (soulCenterX >= r.x - 2 && soulCenterX <= r.x + r.w + 2) {
                    return 0; // Safe! Rock shadow blocks the beam.
                }
            }
        }
        
        // Otherwise, player is exposed to the atomic flame!
        return this.damVal;
    }
    
    return 0;
};

GodzillaAtomicBreathPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};
