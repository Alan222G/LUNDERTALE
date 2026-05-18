// walls_o_bullet.js — Wall of bullets with a gap
// Ported from UBE's WallsOBullet.java

var WallsOBulletPattern = function(config) {
    BulletPattern.call(this, config);
    this.waveCount = 0;
    this.maxWaves = config.maxWaves || 4;
    this.waveTimer = 0;
    this.waveInterval = config.waveInterval || 1.5;
    this.started = false;
};

WallsOBulletPattern.prototype = Object.create(BulletPattern.prototype);

WallsOBulletPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.waveCount = 0;
    this.waveTimer = this.waveInterval; // Spawn first wave immediately
    this.started = true;
};

WallsOBulletPattern.prototype.update = function(dt) {
    this.waveTimer += dt;

    if (this.waveTimer >= this.waveInterval && this.waveCount < this.maxWaves) {
        this.waveTimer -= this.waveInterval;
        this.spawnWave();
        this.waveCount++;
    }

    BulletPattern.prototype.update.call(this, dt);

    // Remove out-of-bounds bullets
    var bb = this.battleBox;
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        if (this.bullets[i].isOutOfBounds([bb[0] - 200, bb[1] - 200, bb[2] + 200, bb[3] + 200])) {
            this.bullets.splice(i, 1);
        }
    }
};

WallsOBulletPattern.prototype.spawnWave = function() {
    var bb = this.battleBox;
    var dir = this.rotation;
    var bw = this.bulletWidth;
    var bh = this.bulletHeight;
    var tempBullets = [];

    switch (dir) {
        case 270: // From right to left
            for (var i = 0; i < (bb[3] - bb[1]) / bw; i++) {
                tempBullets.push(new Bullet({
                    x: bb[2] + bh, y: i * bw + bb[1],
                    width: bw, height: bh,
                    speed: this.speed, damVal: this.damVal,
                    rotation: 270, fadeSpeed: this.fadeSpeed, color: this.color
                }));
            }
            break;
        case 180: // From top to bottom
            for (var i = 0; i < (bb[2] - bb[0]) / bw; i++) {
                tempBullets.push(new Bullet({
                    x: i * bw + bb[0], y: bb[1] - bh * 2,
                    width: bw, height: bh,
                    speed: this.speed, damVal: this.damVal,
                    rotation: 180, fadeSpeed: this.fadeSpeed, color: this.color
                }));
            }
            break;
        case 90: // From left to right
            for (var i = 0; i < (bb[3] - bb[1]) / bw; i++) {
                tempBullets.push(new Bullet({
                    x: bb[0] - bh * 2, y: i * bw + bb[1],
                    width: bw, height: bh,
                    speed: this.speed, damVal: this.damVal,
                    rotation: 90, fadeSpeed: this.fadeSpeed, color: this.color
                }));
            }
            break;
        default: // From bottom to top
            for (var i = 0; i < (bb[2] - bb[0]) / bw; i++) {
                tempBullets.push(new Bullet({
                    x: i * bw + bb[0], y: bb[3] + bh,
                    width: bw, height: bh,
                    speed: this.speed, damVal: this.damVal,
                    rotation: 0, fadeSpeed: this.fadeSpeed, color: this.color
                }));
            }
            break;
    }

    // Remove multiple adjacent bullets to create a generous gap (e.g., 5 bullets = 80px gap)
    if (tempBullets.length > 5) {
        var holeIndex = Math.floor(Math.random() * (tempBullets.length - 5));
        tempBullets.splice(holeIndex, 5);
    } else if (tempBullets.length > 0) {
        var holeIndex = Math.floor(Math.random() * tempBullets.length);
        tempBullets.splice(holeIndex, 1);
    }

    this.bullets = this.bullets.concat(tempBullets);
};

WallsOBulletPattern.prototype.isOver = function() {
    return this.waveCount >= this.maxWaves && this.bullets.length === 0;
};
