// clockworkGears.js - Paradoja: Golden gears moving across the screen
var ClockworkGearsPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 7;
    
    this.gears = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.2;
    this.battleBox = null;
};

ClockworkGearsPattern.prototype = Object.create(BulletPattern.prototype);

ClockworkGearsPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.elapsed = 0;
    this.gears = [];
    this.spawnTimer = 1.0; // Spawn first gear soon
};

ClockworkGearsPattern.prototype.spawnGear = function() {
    var bounds = Cbbox.getBound();
    var side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    
    var x, y, vx, vy;
    var radius = 40 + Math.random() * 40; // 40 to 80 radius
    var speed = 90 + Math.random() * 60; // pixels per second

    // Spawn outside the bounding box
    if (side === 0) { // Top
        x = bounds[0] + Math.random() * (bounds[2] - bounds[0]);
        y = bounds[1] - radius - 20;
        vx = (Math.random() - 0.5) * speed * 0.5;
        vy = speed;
    } else if (side === 1) { // Right
        x = bounds[2] + radius + 20;
        y = bounds[1] + Math.random() * (bounds[3] - bounds[1]);
        vx = -speed;
        vy = (Math.random() - 0.5) * speed * 0.5;
    } else if (side === 2) { // Bottom
        x = bounds[0] + Math.random() * (bounds[2] - bounds[0]);
        y = bounds[3] + radius + 20;
        vx = (Math.random() - 0.5) * speed * 0.5;
        vy = -speed;
    } else { // Left
        x = bounds[0] - radius - 20;
        y = bounds[1] + Math.random() * (bounds[3] - bounds[1]);
        vx = speed;
        vy = (Math.random() - 0.5) * speed * 0.5;
    }

    var rotationSpeed = (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random() * 1.5);
    var teethCount = Math.floor(8 + (radius / 8));

    this.gears.push({
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        radius: radius,
        rotation: 0,
        rotationSpeed: rotationSpeed,
        teethCount: teethCount
    });
};

ClockworkGearsPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 2) {
        this.spawnGear();
        this.spawnTimer = 0;
    }

    var bounds = Cbbox.getBound();
    var margin = 200;

    for (var i = this.gears.length - 1; i >= 0; i--) {
        var gear = this.gears[i];
        gear.x += gear.vx * dt;
        gear.y += gear.vy * dt;
        gear.rotation += gear.rotationSpeed * dt;

        if (gear.x < bounds[0] - margin || gear.x > bounds[2] + margin ||
            gear.y < bounds[1] - margin || gear.y > bounds[3] + margin) {
            this.gears.splice(i, 1);
        }
    }
};

ClockworkGearsPattern.prototype.draw = function(ctx) {
    for (var i = 0; i < this.gears.length; i++) {
        var gear = this.gears[i];
        ctx.save();
        ctx.translate(gear.x, gear.y);
        ctx.rotate(gear.rotation);

        ctx.shadowColor = 'rgba(255, 200, 0, 0.4)';
        ctx.shadowBlur = 20;

        // Metallic gradient
        var metalGrad = ctx.createLinearGradient(-gear.radius, -gear.radius, gear.radius, gear.radius);
        metalGrad.addColorStop(0, "#F5D76E"); // Light Gold
        metalGrad.addColorStop(0.3, "#A67C00"); // Dark Gold
        metalGrad.addColorStop(0.7, "#BF953F"); // Mid Gold
        metalGrad.addColorStop(1, "#FCF6BA"); // Highlight
        
        ctx.fillStyle = metalGrad;
        ctx.strokeStyle = "#FFE87C"; // Brighter gold for edges
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";

        var innerRadius = gear.radius * 0.75;
        var outerRadius = gear.radius;
        var numTeeth = gear.teethCount;
        var anglePerTooth = (Math.PI * 2) / numTeeth;

        // Draw gear outer shape and teeth
        ctx.beginPath();
        for (var t = 0; t < numTeeth; t++) {
            var angle = t * anglePerTooth;
            var toothStart = angle;
            var toothEnd = angle + anglePerTooth * 0.4;
            var gapEnd = angle + anglePerTooth;

            ctx.lineTo(Math.cos(toothStart) * outerRadius, Math.sin(toothStart) * outerRadius);
            ctx.arc(0, 0, outerRadius, toothStart, toothEnd);
            ctx.lineTo(Math.cos(toothEnd) * innerRadius, Math.sin(toothEnd) * innerRadius);
            ctx.arc(0, 0, innerRadius, toothEnd, gapEnd);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner circle cut out
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(0, 0, gear.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Draw inner rim and spokes with 3D inset shadow effect
        ctx.globalCompositeOperation = 'source-over';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#8A6600";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, gear.radius * 0.35, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        for (var s = 0; s < 4; s++) {
            var sAngle = s * (Math.PI / 2);
            ctx.moveTo(Math.cos(sAngle) * gear.radius * 0.35, Math.sin(sAngle) * gear.radius * 0.35);
            ctx.lineTo(Math.cos(sAngle) * innerRadius, Math.sin(sAngle) * innerRadius);
        }
        ctx.stroke();

        // Central peg
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, gear.radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Specular highlight on peg
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(-gear.radius * 0.05, -gear.radius * 0.05, gear.radius * 0.04, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
};

ClockworkGearsPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2;
    var cy = sy + sh / 2;
    var playerRadius = sw / 2;

    for (var i = 0; i < this.gears.length; i++) {
        var gear = this.gears[i];
        var dx = cx - gear.x;
        var dy = cy - gear.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var innerRadius = gear.radius * 0.75;
        
        if (dist < innerRadius + playerRadius) {
            return this.damVal;
        } else if (dist < gear.radius + playerRadius) {
            var angle = Math.atan2(dy, dx) - gear.rotation;
            while (angle < 0) angle += Math.PI * 2;
            angle = angle % (Math.PI * 2);
            
            var anglePerTooth = (Math.PI * 2) / gear.teethCount;
            var phase = (angle % anglePerTooth) / anglePerTooth;
            
            if (phase < 0.45 || phase > 0.95) {
                return this.damVal;
            }
        }
    }
    return 0;
};

ClockworkGearsPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.gears.length === 0;
};
