// vaderImperialBarrage.js — Sith Force Dome. An expanding force field pushing player to edges while rotating saber blades sweep the perimeter.
var VaderImperialBarragePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
    
    this.domeRadius = 0.0;
    this.maxDomeRadius = 82;
    this.blades = []; // { angle, speed, distance }
};

VaderImperialBarragePattern.prototype = Object.create(BulletPattern.prototype);

VaderImperialBarragePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.domeRadius = 0;
    this.blades = [];

    // Spawn 3 rotating energy blades
    for (var i = 0; i < 3; i++) {
        this.blades.push({
            angle: i * (Math.PI * 2 / 3),
            speed: 2.2, // rotation speed
            dist: 115
        });
    }
};

VaderImperialBarragePattern.prototype.update = function(dt) {
    this.elapsed += dt;

    var bb = Cbbox.getBound();
    var centerX = (bb[0] + bb[2]) / 2;
    var centerY = (bb[1] + bb[3]) / 2;

    // Expanding dome radius based on time (grows then shrinks slightly)
    var progress = this.elapsed / this.duration;
    if (progress < 0.65) {
        this.domeRadius = this.maxDomeRadius * Math.sin((progress / 0.65) * (Math.PI / 2));
    } else {
        this.domeRadius = this.maxDomeRadius * Math.sin(((1.0 - progress) / 0.35) * (Math.PI / 2));
    }

    // Force push player outwards if they touch the expanding dome
    if (typeof Soul !== "undefined" && Soul.getPos && this.domeRadius > 5) {
        var spos = Soul.getPos();
        var spw = Soul.getWidth();
        var sph = Soul.getHeight();
        var px = spos.x + spw / 2;
        var py = spos.y + sph / 2;

        var dx = px - centerX;
        var dy = py - centerY;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.domeRadius) {
            // Push player out to the boundary of the dome
            var pushFactor = (this.domeRadius - dist) + 4;
            var angle = Math.atan2(dy, dx);
            if (dist === 0) angle = Math.random() * Math.PI * 2;
            spos.x += Math.cos(angle) * pushFactor;
            spos.y += Math.sin(angle) * pushFactor;
        }
    }

    // Update rotating blades
    for (var i = 0; i < this.blades.length; i++) {
        var b = this.blades[i];
        b.angle += b.speed * dt;
        
        // Helix pulsing distance
        b.dist = 90 + Math.sin(this.elapsed * 4 + i) * 20;
    }

    BulletPattern.prototype.update.call(this, dt);
};

VaderImperialBarragePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var cx = sx + sw / 2;
    var cy = sy + sh / 2;
    var radius = (sw + sh) / 4;
    var bb = Cbbox.getBound();
    var centerX = (bb[0] + bb[2]) / 2;
    var centerY = (bb[1] + bb[3]) / 2;

    // 1. Check dome outline contact damage
    var dx = cx - centerX;
    var dy = cy - centerY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    // Damage if touching the edge of the dome
    if (dist < this.domeRadius + 2 && dist > this.domeRadius - 8) {
        return this.damVal;
    }

    // 2. Check collision with rotating outer laser blades
    for (var i = 0; i < this.blades.length; i++) {
        var b = this.blades[i];
        var bx = centerX + Math.cos(b.angle) * b.dist;
        var by = centerY + Math.sin(b.angle) * b.dist;

        var bdx = cx - bx;
        var bdy = cy - by;
        var bdist = Math.sqrt(bdx * bdx + bdy * bdy);
        if (bdist < radius + 9) {
            return this.damVal;
        }
    }

    return 0;
};

VaderImperialBarragePattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var centerX = (bb[0] + bb[2]) / 2;
    var centerY = (bb[1] + bb[3]) / 2;

    // 1. Draw expanding Sith force dome
    if (this.domeRadius > 1) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";

        // Red Force energy fill
        var rStart = Math.min(2, this.domeRadius * 0.4);
        var rEnd = Math.max(rStart + 1, this.domeRadius);
        var domeGrad = ctx.createRadialGradient(centerX, centerY, rStart, centerX, centerY, rEnd);
        domeGrad.addColorStop(0, "rgba(255, 0, 0, 0.05)");
        domeGrad.addColorStop(0.8, "rgba(139, 0, 0, 0.18)");
        domeGrad.addColorStop(0.96, "rgba(255, 30, 30, 0.45)");
        domeGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        ctx.fillStyle = domeGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.domeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Glowing border ring
        ctx.strokeStyle = "#FF1e1e";
        ctx.shadowColor = "#FF0000";
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.domeRadius - 1.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    // 2. Draw rotating blades
    for (var i = 0; i < this.blades.length; i++) {
        var b = this.blades[i];
        var bx = centerX + Math.cos(b.angle) * b.dist;
        var by = centerY + Math.sin(b.angle) * b.dist;

        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.translate(bx, by);
        ctx.rotate(b.angle * 4); // spin blade individually

        ctx.shadowBlur = 14;
        ctx.shadowColor = "#FF0055";

        // Outer red slash arc
        ctx.strokeStyle = "#FF3366";
        ctx.lineWidth = 5.0;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, 0, 10, -1.0, 1.0);
        ctx.stroke();

        // White core
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, 10, -0.6, 0.6);
        ctx.stroke();

        ctx.restore();
    }

    ctx.restore();
};

VaderImperialBarragePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};
