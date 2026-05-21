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
    var isFiring = false;
    
    for (var i = 0; i < this.beams.length; i++) {
        var b = this.beams[i];
        if (b.timer < 0) continue; // Not started yet (delayed spawn)
        
        if (b.timer < b.telegraph) {
            // Telegraph phase — glowing laser sight
            var progress = b.timer / b.telegraph;
            var widthProg = progress * b.width;
            
            // Outer glow
            ctx.fillStyle = "rgba(255, 0, 0, " + (0.1 + progress * 0.2) + ")";
            ctx.shadowBlur = 10 * progress;
            ctx.shadowColor = "#FF0000";
            ctx.fillRect(b.x - widthProg/2, bb[1], widthProg, bb[3] - bb[1]);
            
            // Center laser sight
            ctx.strokeStyle = "rgba(255, 50, 50, " + (0.5 + progress * 0.5) + ")";
            ctx.lineWidth = 1 + progress * 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(b.x, bb[1]);
            ctx.lineTo(b.x, bb[3]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Charging particles
            if (Math.random() > 0.3) {
                var pY = bb[1] + Math.random()*(bb[3]-bb[1]);
                var pX = b.x + (Math.random()-0.5)*b.width*2;
                ctx.fillStyle = "#FF5555";
                ctx.beginPath(); ctx.arc(pX, pY, 1.5, 0, Math.PI*2); ctx.fill();
            }
        } else {
            // Active beam — full blast
            isFiring = true;
            if (!b.soundPlayed) {
                Sound.playSound("select", true); // Pseudo-laser blast sound
                b.soundPlayed = true;
            }
            
            ctx.globalCompositeOperation = "lighter";
            ctx.shadowBlur = 40;
            ctx.shadowColor = "#FF0000";
            
            // Outer red beam
            ctx.fillStyle = "rgba(255, 0, 0, 0.9)";
            ctx.fillRect(b.x - b.width/2, bb[1], b.width, bb[3] - bb[1]);
            
            // Inner bright core
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#FFFFFF";
            ctx.fillStyle = "rgba(255, 200, 200, 1)";
            ctx.fillRect(b.x - b.width/4, bb[1], b.width/2, bb[3] - bb[1]);
            
            // White-hot center line
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(b.x - 3, bb[1], 6, bb[3] - bb[1]);
            
            // Fire sparks flying off the beam
            for(var p=0; p<5; p++) {
                var py = bb[1] + Math.random()*(bb[3]-bb[1]);
                var px = b.x + (Math.random() > 0.5 ? 1 : -1) * (b.width/2 + Math.random()*20);
                ctx.fillStyle = Math.random() > 0.5 ? "#FF0000" : "#FFFF00";
                ctx.beginPath(); ctx.arc(px, py, Math.random()*3, 0, Math.PI*2); ctx.fill();
            }
            ctx.globalCompositeOperation = "source-over";
        }
    }
    
    // Massive Screen shake if firing
    if (isFiring) {
        ctx.translate((Math.random()-0.5)*10, (Math.random()-0.5)*10);
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
