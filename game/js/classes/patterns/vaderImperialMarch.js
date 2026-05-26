// vaderImperialMarch.js — Blocks representing notes of the Imperial March fall rhythmically
var VaderImperialMarchPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.rhythmTimer = 0;
    this.damVal = config.damVal || 8;
    this.noteIndex = 0;
    
    // Beat timings in seconds to match the Imperial March melody: (3/4 time signature feel)
    // "Da Da Da Da-da Da Da-da Da"
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

    // Check if it's time to spawn a rhythm note block
    if (this.noteIndex < this.noteTimings.length && this.elapsed >= this.noteTimings[this.noteIndex]) {
        this.noteIndex++;
        
        // Spawn a rhythm block falling from a random vertical column
        var columns = 4;
        var colWidth = (bbW - 30) / columns;
        var chosenCol = Math.floor(Math.random() * columns);
        var rx = bb[0] + 15 + chosenCol * colWidth + (colWidth - 28) / 2;
        var ry = bb[1] - 30;

        this.bullets.push(new Bullet({
            x: rx, y: ry,
            width: 28, height: 18,
            speed: 0,
            damVal: this.damVal,
            rotation: 0,
            fadeSpeed: 1.0,
            color: "#FF1414", // neon dark outline
            vx: 0, vy: 260, useVelocity: true
        }));
        
        Sound.playSound("impact", true); // beep drum beat
    }

    // Update bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);

        if (b.isOutOfBounds([bb[0] - 20, bb[1] - 50, bb[2] + 20, bb[3] + 50])) {
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
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF0000";

        // Outer borders
        ctx.fillStyle = "#1e1e1e";
        ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);

        ctx.strokeStyle = "#FF3333";
        ctx.lineWidth = 2.0;
        ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);

        // Small imperial logo/design inside block
        ctx.strokeStyle = "rgba(255, 0, 0, 0.45)";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
    ctx.restore();
};

VaderImperialMarchPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
