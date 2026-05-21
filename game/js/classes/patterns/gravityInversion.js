// gravityInversion.js — Paradoja Phase 2: Shards fall UPWARDS with motion blur, screen shake, and warnings
var GravityInversionPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
    
    this.shards = [];
    this.spawnTimer = 0;
    this.inversionProgress = 0; // 0 to 1 for battle box flip effect
    
    this.warnings = [];
};

GravityInversionPattern.prototype = Object.create(BulletPattern.prototype);

GravityInversionPattern.prototype.generateBullets = function(battleBox) {
    this.elapsed = 0;
    this.shards = [];
    this.warnings = [];
    this.inversionProgress = 0;
    this.spawnTimer = 1.0; // Wait 1 sec before spawning shards
};

GravityInversionPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    var bb = Cbbox.getBound();
    
    if (this.elapsed < 1.0) {
        this.inversionProgress = this.elapsed / 1.0;
    } else {
        this.inversionProgress = 1;
        
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            // Spawn a warning
            var wX = bb[0] + 10 + Math.random() * (bb[2] - bb[0] - 20);
            this.warnings.push({
                x: wX,
                life: 0.8,
                maxLife: 0.8
            });
            this.spawnTimer = 0.15 + Math.random() * 0.15; // Spawn rate
        }
    }
    
    // Update warnings & spawn shards when warnings expire
    for (var i = this.warnings.length - 1; i >= 0; i--) {
        var w = this.warnings[i];
        w.life -= dt;
        if (w.life <= 0) {
            // Spawn shard
            this.shards.push({
                x: w.x + (Math.random() - 0.5) * 15,
                y: bb[3] + 40, // Spawn below
                vy: -300 - Math.random() * 300, // Move UP
                size: 8 + Math.random() * 8,
                rotation: Math.random() * Math.PI,
                rotSpeed: (Math.random() - 0.5) * 10
            });
            this.warnings.splice(i, 1);
        }
    }
    
    // Update shards
    for (var j = this.shards.length - 1; j >= 0; j--) {
        var s = this.shards[j];
        s.y += s.vy * dt;
        s.rotation += s.rotSpeed * dt;
        if (s.y < bb[1] - 100) {
            this.shards.splice(j, 1);
        }
    }
};

GravityInversionPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    ctx.save();
    
    // Inversion Effect: Flip the battlebox visual by rotating around center
    if (this.inversionProgress > 0) {
        var rot = this.inversionProgress * Math.PI;
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.translate(-cx, -cy);
        
        // Draw inversion grid
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = "rgba(100, 50, 255, " + (0.3 * Math.sin(this.inversionProgress * Math.PI)) + ")";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for(var ix = bb[0]; ix <= bb[2]; ix += 40) { ctx.moveTo(ix, bb[1]); ctx.lineTo(ix, bb[3]); }
        for(var iy = bb[1]; iy <= bb[3]; iy += 40) { ctx.moveTo(bb[0], iy); ctx.lineTo(bb[2], iy); }
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
    }
    
    // Draw warnings (Targeting reticles at the TOP, since attacks come from bottom)
    for (var i = 0; i < this.warnings.length; i++) {
        var w = this.warnings[i];
        var alpha = 1.0 - (w.life / w.maxLife);
        
        ctx.strokeStyle = "rgba(255, 0, 0, " + alpha + ")";
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Draw a vertical warning line
        ctx.moveTo(w.x, bb[1]);
        ctx.lineTo(w.x, bb[3]);
        ctx.stroke();
        
        ctx.fillStyle = "rgba(255, 50, 50, " + alpha + ")";
        ctx.beginPath();
        ctx.arc(w.x, bb[1] + 10, 5 + alpha * 10, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw Shards falling UPWARDS
    ctx.globalCompositeOperation = "lighter";
    for (var j = 0; j < this.shards.length; j++) {
        var s = this.shards[j];
        
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        
        // Motion blur trail
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#B000FF";
        
        var trailLen = Math.abs(s.vy) * 0.15;
        ctx.fillStyle = "rgba(180, 50, 255, 0.4)";
        ctx.beginPath();
        ctx.moveTo(-s.size, 0);
        ctx.lineTo(0, trailLen);
        ctx.lineTo(s.size, 0);
        ctx.closePath();
        ctx.fill();
        
        // Core crystal
        ctx.shadowBlur = 5;
        ctx.shadowColor = "#FFF";
        ctx.fillStyle = "#E0B0FF";
        ctx.beginPath();
        ctx.moveTo(0, -s.size * 1.5);
        ctx.lineTo(s.size, 0);
        ctx.lineTo(0, s.size * 1.5);
        ctx.lineTo(-s.size, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    ctx.restore();
    
    // Screen shake when shards are active
    if (this.shards.length > 0 && Math.random() < 0.5) {
        var shake = Math.min(this.shards.length, 5);
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }
};

GravityInversionPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    if (this.elapsed < 1.0) return 0;
    
    var cx = sx + sw/2;
    var cy = sy + sh/2;
    
    // Since we flipped the drawing visually, the actual physical shards are moving UP from bottom.
    // The player's Soul isn't visually flipped by our ctx.translate, but it doesn't need to be 
    // for collision if we just check absolute coordinates.
    
    for (var i = 0; i < this.shards.length; i++) {
        var s = this.shards[i];
        var dx = s.x - cx;
        var dy = s.y - cy;
        // Simple circle collision
        if (dx*dx + dy*dy < (s.size + sw/2) * (s.size + sw/2)) {
            return this.damVal;
        }
        
        // Check trail collision too (line segment)
        if (Math.abs(s.x - cx) < s.size + sw/2 && cy > s.y && cy < s.y + Math.abs(s.vy)*0.15) {
            return this.damVal;
        }
    }
    
    return 0;
};

GravityInversionPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};
