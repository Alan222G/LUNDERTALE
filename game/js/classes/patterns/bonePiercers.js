// bonePiercers.js - Sachiel: White bone-like spears that pierce diagonally through the battle box
var BonePiercersPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    
    this.piercers = [];
    this.spawnTimer = 0;
};

BonePiercersPattern.prototype = Object.create(BulletPattern.prototype);

BonePiercersPattern.prototype.generateBullets = function(battleBox) {
    this.elapsed = 0;
    this.piercers = [];
    this.spawnTimer = 0.8; // Start fairly quickly
};

BonePiercersPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];
    
    if (this.spawnTimer >= 1.0 && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        
        // Spawn from a random edge
        var edge = Math.floor(Math.random() * 4);
        var startX, startY, targetX, targetY;
        
        if (edge === 0) { // Top
            startX = bb[0] + Math.random() * boxW;
            startY = bb[1] - 30;
            targetX = bb[0] + Math.random() * boxW;
            targetY = bb[3] + 30;
        } else if (edge === 1) { // Bottom
            startX = bb[0] + Math.random() * boxW;
            startY = bb[3] + 30;
            targetX = bb[0] + Math.random() * boxW;
            targetY = bb[1] - 30;
        } else if (edge === 2) { // Left
            startX = bb[0] - 30;
            startY = bb[1] + Math.random() * boxH;
            targetX = bb[2] + 30;
            targetY = bb[1] + Math.random() * boxH;
        } else { // Right
            startX = bb[2] + 30;
            startY = bb[1] + Math.random() * boxH;
            targetX = bb[0] - 30;
            targetY = bb[1] + Math.random() * boxH;
        }
        
        this.piercers.push({
            startX: startX,
            startY: startY,
            targetX: targetX,
            targetY: targetY,
            timer: 0,
            telegraphTime: 0.6,
            travelTime: 0.4,
            lingerTime: 0.2,
            width: 10,
            fired: false,
            currentX: startX,
            currentY: startY
        });
        
        // Occasionally spawn a pair
        if (Math.random() > 0.6 && this.elapsed > 2) {
            var offset = 40;
            this.piercers.push({
                startX: startX + (edge >= 2 ? 0 : offset),
                startY: startY + (edge < 2 ? 0 : offset),
                targetX: targetX + (edge >= 2 ? 0 : offset),
                targetY: targetY + (edge < 2 ? 0 : offset),
                timer: 0,
                telegraphTime: 0.6,
                travelTime: 0.4,
                lingerTime: 0.2,
                width: 10,
                fired: false,
                currentX: startX + (edge >= 2 ? 0 : offset),
                currentY: startY + (edge < 2 ? 0 : offset)
            });
        }
    }
    
    for (var i = this.piercers.length - 1; i >= 0; i--) {
        var p = this.piercers[i];
        p.timer += dt;
        
        var totalLife = p.telegraphTime + p.travelTime + p.lingerTime;
        
        if (p.timer > totalLife) {
            this.piercers.splice(i, 1);
            continue;
        }
        
        // Update current position during travel phase
        if (p.timer >= p.telegraphTime && p.timer < p.telegraphTime + p.travelTime) {
            var t = (p.timer - p.telegraphTime) / p.travelTime;
            // Ease out cubic
            t = 1 - Math.pow(1 - t, 3);
            p.currentX = p.startX + (p.targetX - p.startX) * t;
            p.currentY = p.startY + (p.targetY - p.startY) * t;
            p.fired = true;
        } else if (p.timer >= p.telegraphTime + p.travelTime) {
            p.currentX = p.targetX;
            p.currentY = p.targetY;
        }
    }
};

BonePiercersPattern.prototype.draw = function(ctx) {
    ctx.save();
    
    for (var i = 0; i < this.piercers.length; i++) {
        var p = this.piercers[i];
        
        if (p.timer < p.telegraphTime) {
            // Telegraph — dotted line showing the path
            var flash = (Math.floor(p.timer * 12) % 2 === 0);
            ctx.strokeStyle = flash ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 100, 100, 0.3)";
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.moveTo(p.startX, p.startY);
            ctx.lineTo(p.targetX, p.targetY);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Glowing dot at start point
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.beginPath();
            ctx.arc(p.startX, p.startY, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Active piercer — Textured bone spear
            if (!p.soundPlayed && p.timer >= p.telegraphTime) {
                Sound.playSound("select", true); // Whoosh sound
                p.soundPlayed = true;
            }
            
            var dx = p.currentX - p.startX;
            var dy = p.currentY - p.startY;
            var len = Math.sqrt(dx*dx + dy*dy);
            var angle = Math.atan2(dy, dx);
            
            if (len > 1) {
                ctx.save();
                ctx.translate(p.startX, p.startY);
                ctx.rotate(angle);
                
                // Red Dark Energy Trail
                ctx.globalCompositeOperation = "lighter";
                var trailGrad = ctx.createLinearGradient(0, 0, len, 0);
                trailGrad.addColorStop(0, "rgba(255, 0, 0, 0)");
                trailGrad.addColorStop(0.5, "rgba(255, 50, 50, 0.4)");
                trailGrad.addColorStop(1, "rgba(255, 0, 0, 0)");
                ctx.fillStyle = trailGrad;
                ctx.fillRect(0, -p.width*1.5, len, p.width*3);
                ctx.globalCompositeOperation = "source-over";
                
                // Draw Bone Shape (tapered)
                ctx.shadowBlur = 10;
                ctx.shadowColor = "#FF0000";
                
                var boneGrad = ctx.createLinearGradient(0, -p.width, 0, p.width);
                boneGrad.addColorStop(0, "#D3CDBF"); // Edge
                boneGrad.addColorStop(0.5, "#FFFFFF"); // Center highlight
                boneGrad.addColorStop(1, "#A8A295"); // Shadow edge
                
                ctx.fillStyle = boneGrad;
                ctx.beginPath();
                ctx.moveTo(0, -p.width/2);
                ctx.lineTo(len - 20, -p.width/3); // Tapering
                ctx.lineTo(len, 0);               // Sharp tip
                ctx.lineTo(len - 20, p.width/3);  // Tapering
                ctx.lineTo(0, p.width/2);
                ctx.closePath();
                ctx.fill();
                
                // Bone Textures (cracks)
                ctx.shadowBlur = 0;
                ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
                ctx.lineWidth = 1;
                for(var c=0; c<3; c++) {
                    var cxStart = len * 0.2 + c * (len * 0.2);
                    ctx.beginPath();
                    ctx.moveTo(cxStart, -p.width/4);
                    ctx.lineTo(cxStart + 10, 0);
                    ctx.lineTo(cxStart - 5, p.width/4);
                    ctx.stroke();
                }
                
                // Red glowing tip
                ctx.globalCompositeOperation = "lighter";
                ctx.fillStyle = "rgba(255, 50, 50, 0.9)";
                ctx.shadowBlur = 15;
                ctx.shadowColor = "#FF0000";
                ctx.beginPath();
                ctx.arc(len, 0, 6 + Math.random()*4, 0, Math.PI*2);
                ctx.fill();
                
                ctx.restore();
            }
        }
    }
    
    ctx.restore();
};

BonePiercersPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var px = sx + sw / 2;
    var py = sy + sh / 2;
    var pr = sw / 2;
    
    for (var i = 0; i < this.piercers.length; i++) {
        var p = this.piercers[i];
        
        // Only damages during travel and linger
        if (p.timer < p.telegraphTime) continue;
        
        // Point-to-line-segment distance
        var ax = p.startX, ay = p.startY;
        var bx = p.currentX, by = p.currentY;
        var l2 = (bx-ax)*(bx-ax) + (by-ay)*(by-ay);
        if (l2 < 1) continue;
        
        var t = Math.max(0, Math.min(1, ((px-ax)*(bx-ax) + (py-ay)*(by-ay)) / l2));
        var projX = ax + t * (bx-ax);
        var projY = ay + t * (by-ay);
        
        var dist = Math.sqrt((px-projX)*(px-projX) + (py-projY)*(py-projY));
        
        if (dist < (p.width / 2) + pr) {
            return this.damVal;
        }
    }
    return 0;
};

BonePiercersPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.piercers.length === 0;
};
