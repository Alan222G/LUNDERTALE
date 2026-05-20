// causalLightBeam.js - Sachiel: Vertical red light beams from Sachiel's core
var CausalLightBeamPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 10;
    
    this.beams = [];
    this.spawnTimer = 0;
};

CausalLightBeamPattern.prototype = Object.create(BulletPattern.prototype);

CausalLightBeamPattern.prototype.generateBullets = function(battleBox) {
    this.elapsed = 0;
    this.beams = [];
    this.spawnTimer = 0.5; // Start faster
};

CausalLightBeamPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    
    // Spawn beams more frequently — every ~1.2s
    if (this.spawnTimer >= 1.2 && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        
        // Target player's current X position
        var targetX = Soul.getPos().x;
        
        // Add slight random offset so it's not trivial to dodge
        targetX += (Math.random() - 0.5) * 30;
        
        // Clamp inside battle box
        targetX = Math.max(bb[0] + 20, Math.min(bb[2] - 20, targetX));
        
        this.beams.push({
            x: targetX,
            timer: 0,
            telegraph: 0.8, // Warning time
            active: 0.4,    // Damage time
            width: 60
        });
        
        // Sometimes spawn a second beam offset from the first
        if (Math.random() > 0.5 && this.elapsed > 2) {
            var offsetX = targetX + (Math.random() > 0.5 ? 80 : -80);
            offsetX = Math.max(bb[0] + 20, Math.min(bb[2] - 20, offsetX));
            this.beams.push({
                x: offsetX,
                timer: -0.3, // Slightly delayed
                telegraph: 0.8,
                active: 0.4,
                width: 50
            });
        }
    }
    
    for (var i = this.beams.length - 1; i >= 0; i--) {
        var b = this.beams[i];
        b.timer += dt;
        if (b.timer > b.telegraph + b.active) {
            this.beams.splice(i, 1);
        }
    }
};

CausalLightBeamPattern.prototype.draw = function(ctx) {
    ctx.save();
    
    var bb = Cbbox.getBound();
    
    for (var i = 0; i < this.beams.length; i++) {
        var b = this.beams[i];
        if (b.timer < 0) continue; // Not started yet (delayed spawn)
        
        if (b.timer < b.telegraph) {
            // Telegraph phase — pulsing red warning
            var pulse = 0.15 + Math.sin(b.timer * 20) * 0.1;
            ctx.fillStyle = "rgba(255, 50, 50, " + pulse.toFixed(2) + ")";
            ctx.fillRect(b.x - b.width/2, bb[1], b.width, bb[3] - bb[1]);
            
            // Center warning line
            ctx.strokeStyle = "rgba(255, 0, 0, " + (0.3 + b.timer / b.telegraph * 0.5).toFixed(2) + ")";
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(b.x, bb[1]);
            ctx.lineTo(b.x, bb[3]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Edge lines
            ctx.strokeStyle = "rgba(255, 100, 100, 0.4)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(b.x - b.width/2, bb[1]);
            ctx.lineTo(b.x - b.width/2, bb[3]);
            ctx.moveTo(b.x + b.width/2, bb[1]);
            ctx.lineTo(b.x + b.width/2, bb[3]);
            ctx.stroke();
        } else {
            // Active beam — full blast
            ctx.shadowBlur = 25;
            ctx.shadowColor = "#FF0000";
            
            // Outer red beam
            ctx.fillStyle = "rgba(255, 0, 0, 0.85)";
            ctx.fillRect(b.x - b.width/2, bb[1], b.width, bb[3] - bb[1]);
            
            // Inner bright core
            ctx.shadowBlur = 0;
            ctx.fillStyle = "rgba(255, 200, 200, 0.9)";
            ctx.fillRect(b.x - b.width/4, bb[1], b.width/2, bb[3] - bb[1]);
            
            // White-hot center line
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.fillRect(b.x - 2, bb[1], 4, bb[3] - bb[1]);
        }
    }
    
    ctx.restore();
};

CausalLightBeamPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var px = sx + sw / 2;
    var pr = sw / 2;
    
    for (var i = 0; i < this.beams.length; i++) {
        var b = this.beams[i];
        if (b.timer >= b.telegraph && b.timer <= b.telegraph + b.active) {
            if (Math.abs(px - b.x) < b.width/2 + pr) {
                return this.damVal;
            }
        }
    }
    return 0;
};

CausalLightBeamPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.beams.length === 0;
};
