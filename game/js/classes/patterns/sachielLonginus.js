// sachielLonginus.js - The iconic Spear of Longinus: massive double-helix lance
var SachielLonginusPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 15;
    this.lances = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.5;
};

SachielLonginusPattern.prototype = Object.create(BulletPattern.prototype);

SachielLonginusPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        
        // Pick a random side to spawn from (0=Left, 1=Right, 2=Top, 3=Bottom)
        var side = Math.floor(Math.random() * 4);
        var x, y, vx, vy, rot;
        var speed = 1000; // VERY FAST
        
        if (side === 0) { // Left to Right
            x = bb[0] - 300;
            y = bb[1] + 20 + Math.random() * (bb[3] - bb[1] - 40);
            vx = speed; vy = 0; rot = 0;
        } else if (side === 1) { // Right to Left
            x = bb[2] + 300;
            y = bb[1] + 20 + Math.random() * (bb[3] - bb[1] - 40);
            vx = -speed; vy = 0; rot = Math.PI;
        } else if (side === 2) { // Top to Bottom
            x = bb[0] + 20 + Math.random() * (bb[2] - bb[0] - 40);
            y = bb[1] - 300;
            vx = 0; vy = speed; rot = Math.PI/2;
        } else { // Bottom to Top
            x = bb[0] + 20 + Math.random() * (bb[2] - bb[0] - 40);
            y = bb[3] + 300;
            vx = 0; vy = -speed; rot = -Math.PI/2;
        }
        
        this.lances.push({
            x: x, y: y,
            targetX: x, targetY: y, // To track warning line
            vx: vx, vy: vy,
            rot: rot,
            state: "WARN",
            timer: 0,
            warnTime: 0.9,
            width: 200, // Length of lance
            height: 20 // Thickness
        });
        
        if (this.spawnInterval > 0.8) this.spawnInterval -= 0.1;
    }
    
    for (var i = this.lances.length - 1; i >= 0; i--) {
        var l = this.lances[i];
        
        if (l.state === "WARN") {
            l.timer += dt;
            if (l.timer >= l.warnTime) {
                l.state = "FIRE";
            }
        } else if (l.state === "FIRE") {
            l.x += l.vx * dt;
            l.y += l.vy * dt;
            
            // Remove if far off screen
            if (l.x < bb[0] - 800 || l.x > bb[2] + 800 ||
                l.y < bb[1] - 800 || l.y > bb[3] + 800) {
                this.lances.splice(i, 1);
            }
        }
    }
};

SachielLonginusPattern.prototype.drawLance = function(ctx) {
    // Draws a horizontal lance pointing right
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#FF0000";
    
    // Main shaft (Double helix implied by overlapping wavy lines)
    ctx.strokeStyle = "#AA0000";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    
    ctx.beginPath();
    ctx.moveTo(-100, 0);
    // Forked tip
    ctx.lineTo(80, 0);
    ctx.stroke();
    
    // Top fork
    ctx.beginPath();
    ctx.moveTo(80, 0);
    ctx.quadraticCurveTo(100, -15, 120, -5);
    ctx.lineTo(140, 0); // Joining back
    ctx.stroke();
    
    // Bottom fork
    ctx.beginPath();
    ctx.moveTo(80, 0);
    ctx.quadraticCurveTo(100, 15, 120, 5);
    ctx.lineTo(140, 0); // Joining back
    ctx.stroke();
    
    // The massive sharp point
    ctx.fillStyle = "#FF0000";
    ctx.beginPath();
    ctx.moveTo(140, -4);
    ctx.lineTo(180, 0);
    ctx.lineTo(140, 4);
    ctx.fill();
    
    // Helix pattern on shaft
    ctx.strokeStyle = "#FF3333";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (var x = -100; x < 80; x += 10) {
        var waveY = Math.sin(x * 0.2) * 6;
        if (x === -100) ctx.moveTo(x, waveY);
        else ctx.lineTo(x, waveY);
    }
    ctx.stroke();
};

SachielLonginusPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    
    for (var i = 0; i < this.lances.length; i++) {
        var l = this.lances[i];
        
        if (l.state === "WARN") {
            // Draw warning line across the entire screen
            var alpha = (l.timer / l.warnTime);
            ctx.fillStyle = "rgba(255, 0, 0, " + (alpha * 0.4) + ")";
            
            ctx.save();
            ctx.translate(l.targetX, l.targetY);
            ctx.rotate(l.rot);
            // Since it's rotated to face its movement direction, we draw a rect extending far to the right
            ctx.fillRect(0, -l.height/2, 2000, l.height);
            ctx.restore();
            
        } else if (l.state === "FIRE") {
            // Draw the actual lance
            ctx.save();
            ctx.translate(l.x, l.y);
            ctx.rotate(l.rot);
            this.drawLance(ctx);
            ctx.restore();
        }
    }
};

SachielLonginusPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var soulCX = sx + sw / 2;
    var soulCY = sy + sh / 2;
    
    for (var i = 0; i < this.lances.length; i++) {
        var l = this.lances[i];
        if (l.state === "FIRE") {
            // Un-rotate soul coords relative to lance
            var dx = soulCX - l.x;
            var dy = soulCY - l.y;
            
            var rx = dx * Math.cos(-l.rot) - dy * Math.sin(-l.rot);
            var ry = dx * Math.sin(-l.rot) + dy * Math.cos(-l.rot);
            
            // Lance hitbox (approx -100 to +180 in X, -15 to +15 in Y)
            if (rx > -100 && rx < 180 && ry > -15 && ry < 15) {
                return this.damVal;
            }
        }
    }
    return 0;
};

SachielLonginusPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.lances.length === 0;
};
