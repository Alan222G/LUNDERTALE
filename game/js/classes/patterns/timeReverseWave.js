// timeReverseWave.js - Paradoja: Rings expand then shrink back inwards
var TimeReverseWavePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 9;
    this.elapsed = 0;
    this.damVal = config.damVal || 7;
    
    this.waves = [];
    this.spawnTimer = 0;
};

TimeReverseWavePattern.prototype = Object.create(BulletPattern.prototype);

TimeReverseWavePattern.prototype.generateBullets = function(battleBox) {
    this.elapsed = 0;
    this.waves = [];
    this.spawnTimer = 1.0; // Spawn quickly
};

TimeReverseWavePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    if (this.spawnTimer >= 2.5 && this.elapsed < this.duration - 3) {
        this.spawnTimer = 0;
        
        this.waves.push({
            x: cx + (Math.random() - 0.5) * 50,
            y: cy + (Math.random() - 0.5) * 50,
            radius: 10,
            state: "expand", // expand, pause, shrink
            timer: 0,
            maxRadius: 200,
            thickness: 15,
            active: true
        });
    }
    
    for (var i = this.waves.length - 1; i >= 0; i--) {
        var w = this.waves[i];
        if (!w.active) {
            this.waves.splice(i, 1);
            continue;
        }
        
        w.timer += dt;
        
        if (w.state === "expand") {
            w.radius += dt * 150;
            if (w.radius >= w.maxRadius) {
                w.radius = w.maxRadius;
                w.state = "pause";
                w.timer = 0;
            }
        } else if (w.state === "pause") {
            // Flash or vibrate
            if (w.timer >= 0.5) {
                w.state = "shrink";
            }
        } else if (w.state === "shrink") {
            w.radius -= dt * 250; // Shrink faster than expand
            if (w.radius <= 0) {
                w.active = false;
            }
        }
    }
};

TimeReverseWavePattern.prototype.draw = function(ctx) {
    ctx.save();
    
    for (var i = 0; i < this.waves.length; i++) {
        var w = this.waves[i];
        
        ctx.beginPath();
        ctx.arc(w.x, w.y, Math.max(0.1, w.radius), 0, Math.PI * 2);
        
        if (w.state === "expand") {
            ctx.strokeStyle = "rgba(0, 200, 255, 0.8)";
        } else if (w.state === "pause") {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        } else {
            ctx.strokeStyle = "rgba(255, 50, 200, 0.9)";
        }
        
        ctx.lineWidth = w.thickness;
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.stroke();
    }
    
    ctx.restore();
};

TimeReverseWavePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var px = sx + sw / 2;
    var py = sy + sh / 2;
    var pr = sw / 2;
    
    for (var i = 0; i < this.waves.length; i++) {
        var w = this.waves[i];
        if (w.state === "pause") continue; // Safe when paused
        
        var dx = px - w.x;
        var dy = py - w.y;
        var dist = Math.sqrt(dx*dx + dy*dy);
        
        // Check if player circle intersects wave ring
        if (dist > w.radius - w.thickness/2 - pr && dist < w.radius + w.thickness/2 + pr) {
            return this.damVal;
        }
    }
    return 0;
};

TimeReverseWavePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.waves.length === 0;
};
