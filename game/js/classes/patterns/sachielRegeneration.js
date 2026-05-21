// sachielRegeneration.js - Fleshy purple masses grow on walls and explode into projectiles
var SachielRegenerationPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.masses = [];
    this.projectiles = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.0;
};

SachielRegenerationPattern.prototype = Object.create(BulletPattern.prototype);

SachielRegenerationPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    
    // Spawn fleshy masses
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration - 2) {
        this.spawnTimer = 0;
        
        // Pick a wall (0=Left, 1=Right, 2=Top, 3=Bottom)
        var wall = Math.floor(Math.random() * 4);
        var mx, my;
        if (wall === 0) { mx = bb[0]; my = bb[1] + 20 + Math.random() * (bb[3]-bb[1]-40); }
        if (wall === 1) { mx = bb[2]; my = bb[1] + 20 + Math.random() * (bb[3]-bb[1]-40); }
        if (wall === 2) { mx = bb[0] + 20 + Math.random() * (bb[2]-bb[0]-40); my = bb[1]; }
        if (wall === 3) { mx = bb[0] + 20 + Math.random() * (bb[2]-bb[0]-40); my = bb[3]; }
        
        this.masses.push({
            x: mx, y: my,
            wall: wall,
            timer: 0,
            growTime: 1.5,
            maxRadius: 25 + Math.random() * 15,
            exploded: false
        });
        
        if (this.spawnInterval > 0.5) this.spawnInterval -= 0.1;
    }
    
    // Update masses
    for (var i = this.masses.length - 1; i >= 0; i--) {
        var m = this.masses[i];
        if (!m.exploded) {
            m.timer += dt;
            if (m.timer >= m.growTime) {
                m.exploded = true;
                
                // Explode into projectiles
                var numProj = 6;
                for (var p = 0; p < numProj; p++) {
                    var angle;
                    if (m.wall === 0) angle = -Math.PI/2 + (Math.PI / (numProj-1)) * p; // Point right
                    else if (m.wall === 1) angle = Math.PI/2 + (Math.PI / (numProj-1)) * p; // Point left
                    else if (m.wall === 2) angle = 0 + (Math.PI / (numProj-1)) * p; // Point down
                    else angle = -Math.PI + (Math.PI / (numProj-1)) * p; // Point up
                    
                    var speed = 150 + Math.random() * 50;
                    this.projectiles.push({
                        x: m.x, y: m.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        radius: 4 + Math.random() * 3
                    });
                }
                
                // Remove mass after explosion
                this.masses.splice(i, 1);
            }
        }
    }
    
    // Update projectiles
    for (var i = this.projectiles.length - 1; i >= 0; i--) {
        var p = this.projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        
        if (p.x < bb[0] - 20 || p.x > bb[2] + 20 || p.y < bb[1] - 20 || p.y > bb[3] + 20) {
            this.projectiles.splice(i, 1);
        }
    }
};

SachielRegenerationPattern.prototype.draw = function(ctx) {
    // Draw fleshy masses
    for (var i = 0; i < this.masses.length; i++) {
        var m = this.masses[i];
        if (!m.exploded) {
            var progress = m.timer / m.growTime;
            var currentRadius = m.maxRadius * progress;
            var pulse = Math.sin(this.elapsed * 10) * 2;
            
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#800080";
            
            // Fleshy purple
            var grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, currentRadius + pulse);
            grad.addColorStop(0, "#FF66FF");
            grad.addColorStop(0.6, "#800080");
            grad.addColorStop(1, "#330033");
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(m.x, m.y, currentRadius + pulse, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "rgba(255, 100, 255, 0.5)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(m.x, m.y, currentRadius * 0.8, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // Draw projectiles
    ctx.fillStyle = "#800080";
    ctx.strokeStyle = "#FF66FF";
    ctx.lineWidth = 1.5;
    for (var i = 0; i < this.projectiles.length; i++) {
        var p = this.projectiles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
};

SachielRegenerationPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var soulCX = sx + sw / 2;
    var soulCY = sy + sh / 2;
    
    // Check masses
    for (var i = 0; i < this.masses.length; i++) {
        var m = this.masses[i];
        if (!m.exploded) {
            var currentRadius = m.maxRadius * (m.timer / m.growTime);
            var dx = soulCX - m.x;
            var dy = soulCY - m.y;
            if (Math.sqrt(dx*dx + dy*dy) < currentRadius + sw/2) {
                return this.damVal;
            }
        }
    }
    
    // Check projectiles
    for (var i = 0; i < this.projectiles.length; i++) {
        var p = this.projectiles[i];
        var dx = soulCX - p.x;
        var dy = soulCY - p.y;
        if (Math.sqrt(dx*dx + dy*dy) < p.radius + sw/2) {
            this.projectiles.splice(i, 1);
            return this.damVal;
        }
    }
    
    return 0;
};

SachielRegenerationPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.masses.length === 0 && this.projectiles.length === 0;
};
