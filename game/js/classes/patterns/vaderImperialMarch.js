// vaderImperialMarch.js — Multidirectional rhythmic note blocks fall from top, left, and right to the melody.
var VaderImperialMarchPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.noteIndex = 0;
    
    // Melodic timings: (3/4 Imperial March theme)
    this.noteTimings = [0.2, 0.7, 1.2, 1.7, 2.0, 2.3, 2.8, 3.1, 3.6, 4.4, 4.9, 5.4, 5.9, 6.2, 6.5, 7.0];
};

VaderImperialMarchPattern.prototype = Object.create(BulletPattern.prototype);

VaderImperialMarchPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.noteIndex = 0;
};

VaderImperialMarchPattern.prototype.update = function(dt) {
    this.elapsed += dt;

    var bb = Cbbox.getBound();
    var bbW = bb[2] - bb[0];
    var bbH = bb[3] - bb[1];

    if (this.noteIndex < this.noteTimings.length && this.elapsed >= this.noteTimings[this.noteIndex]) {
        var side = this.noteIndex % 3; // 0=Top, 1=Left, 2=Right
        this.noteIndex++;

        var sx, sy, vx, vy;
        var noteWidth = 28;
        var noteHeight = 18;

        if (side === 0) {
            // Fall from top
            sx = bb[0] + 15 + Math.random() * (bbW - 30 - noteWidth);
            sy = bb[1] - 30;
            vx = 0;
            vy = 250;
        } else if (side === 1) {
            // Slide from left
            sx = bb[0] - 30;
            sy = bb[1] + 15 + Math.random() * (bbH - 30 - noteHeight);
            vx = 250;
            vy = 0;
        } else {
            // Slide from right
            sx = bb[2] + 10;
            sy = bb[1] + 15 + Math.random() * (bbH - 30 - noteHeight);
            vx = -250;
            vy = 0;
        }

        this.bullets.push(new Bullet({
            x: sx, y: sy,
            width: noteWidth, height: noteHeight,
            speed: 0,
            damVal: this.damVal,
            rotation: 0,
            fadeSpeed: 1.0,
            color: "#FF1414",
            vx: vx, vy: vy, useVelocity: true
        }));
        
        Sound.playSound("impact", true); // drum beat
    }

    // Update bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);

        if (b.isOutOfBounds([bb[0] - 40, bb[1] - 40, bb[2] + 40, bb[3] + 40])) {
            this.bullets.splice(i, 1);
        }
    }

    BulletPattern.prototype.update.call(this, dt);
};

VaderImperialMarchPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;

        ctx.save();
        ctx.globalAlpha = b.fadeTick;
        ctx.translate(b.x + b.width / 2, b.y + b.height / 2);

        // Glowing red mechanical keyboard key/drum block
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FF0000";

        // Outer dark keys
        ctx.fillStyle = "#161616";
        ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);

        ctx.strokeStyle = "#FF1e1e";
        ctx.lineWidth = 2.0;
        ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);

        // Inner design: Imperial Crest / Gear outline
        ctx.strokeStyle = "rgba(255, 30, 30, 0.55)";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        // little cog teeth
        for (var t = 0; t < 6; t++) {
            var tang = t * (Math.PI / 3);
            ctx.moveTo(Math.cos(tang) * 4, Math.sin(tang) * 4);
            ctx.lineTo(Math.cos(tang) * 6, Math.sin(tang) * 6);
        }
        ctx.stroke();

        ctx.restore();
    }
    ctx.restore();
};

VaderImperialMarchPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
