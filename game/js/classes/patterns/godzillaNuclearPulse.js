// godzillaNuclearPulse.js — Expanding radioactive shockwave rings with open gaps that the player must align with to dodge
var GodzillaNuclearPulsePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    
    this.rings = [];
    this.pulseInterval = 2.0; // Pulse every 2 seconds
    this.pulseTimer = 0.8; // First pulse after 0.8s
};

GodzillaNuclearPulsePattern.prototype = Object.create(BulletPattern.prototype);

GodzillaNuclearPulsePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.pulseTimer = 0.8;
    this.rings = [];
};

GodzillaNuclearPulsePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.pulseTimer += dt;
    
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];
    var cx = bb[0] + boxW / 2;
    var cy = bb[1] + boxH / 2;
    
    // 1. Spawn expanding rings periodically
    if (this.pulseTimer >= this.pulseInterval && this.elapsed < this.duration - 2.0) {
        this.pulseTimer = 0;
        
        Sound.playSound("flash", true); // energy charge sound
        
        // Ring properties
        var gapAngle = Math.random() * Math.PI * 2; // Random gap direction
        var maxR = Math.sqrt(boxW * boxW + boxH * boxH) * 0.75;
        
        this.rings.push({
            cx: cx,
            cy: cy,
            radius: 5,
            maxRadius: maxR,
            speed: 180, // Expands at 180 pixels/second
            gapAngle: gapAngle,
            gapWidth: 1.1, // Gap size in radians (~63 degrees)
            color: "#E200FF", // Pulse color (will adjust for meltdown/pink)
            thickness: 12,
            opacity: 1.0,
            hitCooldown: false // prevent hitting player multiple times in one pulse
        });
    }
    
    // 2. Update active expanding rings
    for (var i = this.rings.length - 1; i >= 0; i--) {
        var r = this.rings[i];
        r.radius += r.speed * dt;
        
        // Fade out near the edges
        if (r.radius > r.maxRadius * 0.7) {
            r.opacity = 1.0 - (r.radius - r.maxRadius * 0.7) / (r.maxRadius * 0.3);
            if (r.opacity < 0) r.opacity = 0;
        }
        
        // Remove ring when fully expanded
        if (r.radius >= r.maxRadius) {
            this.rings.splice(i, 1);
        }
    }
    
    // Standard update
    BulletPattern.prototype.update.call(this, dt);
};

GodzillaNuclearPulsePattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    
    ctx.save();
    
    // Determine pink vs blue
    var isMeltdown = (this.battleBox && Cgroup.getBossId() === "godzilla" && Cgroup.getEnemy(0) && Cgroup.getEnemy(0).renderType === "godzilla_meltdown");
    var pulseGlow = isMeltdown ? "rgba(255, 0, 160, 0.75)" : "rgba(0, 160, 255, 0.75)";
    var pulseStroke = isMeltdown ? "#FF00A0" : "#00FFFF";
    
    // Draw all active rings
    for (var i = 0; i < this.rings.length; i++) {
        var r = this.rings[i];
        
        ctx.save();
        ctx.globalAlpha = r.opacity;
        ctx.shadowBlur = 12;
        ctx.shadowColor = pulseGlow;
        ctx.strokeStyle = pulseStroke;
        ctx.lineWidth = r.thickness;
        
        // Draw the ring with a gap
        // We draw the arc from gapAngle + gapHalf to gapAngle - gapHalf (which goes around the circle leaving the gap empty)
        var startAngle = r.gapAngle + r.gapWidth / 2;
        var endAngle = r.gapAngle - r.gapWidth / 2;
        
        ctx.beginPath();
        ctx.arc(r.cx, r.cy, r.radius, startAngle, endAngle + Math.PI * 2); // Make sure it wraps correctly
        ctx.stroke();
        
        // Draw decorative electric particles along the ring edge
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(r.cx, r.cy, r.radius - 2, startAngle + 0.1, endAngle - 0.1 + Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    ctx.restore();
};

GodzillaNuclearPulsePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var playerCenterX = sx + sw / 2;
    var playerCenterY = sy + sh / 2;
    
    // Check collision against all expanding rings
    for (var i = 0; i < this.rings.length; i++) {
        var r = this.rings[i];
        if (r.opacity < 0.2) continue; // Skip faded out rings
        
        // Distance from player to ring center
        var dx = playerCenterX - r.cx;
        var dy = playerCenterY - r.cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        
        // Check if player is intersecting the ring boundary (ring radius +/- half thickness + safety)
        var halfThickness = r.thickness / 2;
        if (Math.abs(dist - r.radius) <= halfThickness + 5) {
            // Player is vertically/horizontally on the ring boundary. Let's check if they are in the gap!
            var playerAngle = Math.atan2(dy, dx);
            if (playerAngle < 0) playerAngle += Math.PI * 2; // Normalize angle to 0..2PI
            
            var normGapAngle = r.gapAngle;
            if (normGapAngle < 0) normGapAngle += Math.PI * 2;
            normGapAngle = normGapAngle % (Math.PI * 2);
            
            // Calculate angular difference
            var angleDiff = Math.abs(playerAngle - normGapAngle);
            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff; // Shortest angular distance
            
            var gapHalfWidth = r.gapWidth / 2;
            
            if (angleDiff > gapHalfWidth) {
                // Not in the gap! Player touches the ring.
                return this.damVal;
            }
        }
    }
    
    return 0;
};

GodzillaNuclearPulsePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.rings.length === 0;
};
