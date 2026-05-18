// crusher.js — Crushing attack from one side
// Ported from UBE's Crusher.java

var CrusherPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 4;
    this.elapsed = 0;
    this.spawned = false;
};

CrusherPattern.prototype = Object.create(BulletPattern.prototype);

CrusherPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawned = false;
};

CrusherPattern.prototype.update = function(dt) {
    this.elapsed += dt;

    if (!this.spawned) {
        this.spawnCrusher();
        this.spawned = true;
    }

    BulletPattern.prototype.update.call(this, dt);

    var bb = this.battleBox;
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        if (this.bullets[i].isOutOfBounds([bb[0] - 300, bb[1] - 300, bb[2] + 300, bb[3] + 300])) {
            this.bullets.splice(i, 1);
        }
    }
};

CrusherPattern.prototype.spawnCrusher = function() {
    var bb = this.battleBox;
    var bw = this.bulletWidth;
    var bh = this.bulletHeight;
    var dir = this.rotation;

    // Create a solid wall that moves across the entire box
    switch (dir) {
        case 270: // Crush from right
            for (var i = 0; i < (bb[3] - bb[1]) / bw + 1; i++) {
                this.bullets.push(new Bullet({
                    x: bb[2] + bh, y: i * bw + bb[1],
                    width: bw * 3, height: bh,
                    speed: this.speed * 0.7, damVal: this.damVal,
                    rotation: 270, fadeSpeed: this.fadeSpeed, color: this.color
                }));
            }
            break;
        case 90: // Crush from left
            for (var i = 0; i < (bb[3] - bb[1]) / bw + 1; i++) {
                this.bullets.push(new Bullet({
                    x: bb[0] - bh * 4, y: i * bw + bb[1],
                    width: bw * 3, height: bh,
                    speed: this.speed * 0.7, damVal: this.damVal,
                    rotation: 90, fadeSpeed: this.fadeSpeed, color: this.color
                }));
            }
            break;
        case 180: // Crush from top
            for (var i = 0; i < (bb[2] - bb[0]) / bw + 1; i++) {
                this.bullets.push(new Bullet({
                    x: i * bw + bb[0], y: bb[1] - bh * 4,
                    width: bw, height: bh * 3,
                    speed: this.speed * 0.7, damVal: this.damVal,
                    rotation: 180, fadeSpeed: this.fadeSpeed, color: this.color
                }));
            }
            break;
        default: // Crush from bottom
            for (var i = 0; i < (bb[2] - bb[0]) / bw + 1; i++) {
                this.bullets.push(new Bullet({
                    x: i * bw + bb[0], y: bb[3] + bh,
                    width: bw, height: bh * 3,
                    speed: this.speed * 0.7, damVal: this.damVal,
                    rotation: 0, fadeSpeed: this.fadeSpeed, color: this.color
                }));
            }
            break;
    }
};

CrusherPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};
