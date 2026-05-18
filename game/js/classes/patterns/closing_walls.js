// closing_walls.js — Walls closing from both sides
// Ported from UBE's ClosingWalls.java

var ClosingWallsPattern = function(config) {
    BulletPattern.call(this, config);
    this.waveCount = 0;
    this.maxWaves = config.maxWaves || 3;
    this.waveTimer = 0;
    this.waveInterval = config.waveInterval || 2.0;
};

ClosingWallsPattern.prototype = Object.create(BulletPattern.prototype);

ClosingWallsPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.waveCount = 0;
    this.waveTimer = this.waveInterval;
};

ClosingWallsPattern.prototype.update = function(dt) {
    this.waveTimer += dt;
    if (this.waveTimer >= this.waveInterval && this.waveCount < this.maxWaves) {
        this.waveTimer -= this.waveInterval;
        this.spawnWave();
        this.waveCount++;
    }
    BulletPattern.prototype.update.call(this, dt);
    var bb = this.battleBox;
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        if (this.bullets[i].isOutOfBounds([bb[0] - 200, bb[1] - 200, bb[2] + 200, bb[3] + 200])) {
            this.bullets.splice(i, 1);
        }
    }
};

ClosingWallsPattern.prototype.spawnWave = function() {
    var bb = this.battleBox;
    var bw = this.bulletWidth;
    var bh = this.bulletHeight;
    var dir = this.rotation;

    if (dir === 90 || dir === 270) {
        // Horizontal closing
        for (var i = 0; i < (bb[3] - bb[1]) / bw; i++) {
            // From right
            this.bullets.push(new Bullet({
                x: bb[2] + bh, y: i * bw + bb[1],
                width: bw, height: bh,
                speed: this.speed, damVal: this.damVal,
                rotation: 270, fadeSpeed: this.fadeSpeed, color: this.color
            }));
            // From left
            this.bullets.push(new Bullet({
                x: bb[0] - bh * 2, y: i * bw + bb[1],
                width: bw, height: bh,
                speed: this.speed, damVal: this.damVal,
                rotation: 90, fadeSpeed: this.fadeSpeed, color: this.color
            }));
        }
    } else {
        // Vertical closing
        for (var i = 0; i < (bb[2] - bb[0]) / bw; i++) {
            // From bottom
            this.bullets.push(new Bullet({
                x: i * bw + bb[0], y: bb[3] + bh,
                width: bw, height: bh,
                speed: this.speed, damVal: this.damVal,
                rotation: 0, fadeSpeed: this.fadeSpeed, color: this.color
            }));
            // From top
            this.bullets.push(new Bullet({
                x: i * bw + bb[0], y: bb[1] - bh * 2,
                width: bw, height: bh,
                speed: this.speed, damVal: this.damVal,
                rotation: 180, fadeSpeed: this.fadeSpeed, color: this.color
            }));
        }
    }
};

ClosingWallsPattern.prototype.isOver = function() {
    return this.waveCount >= this.maxWaves && this.bullets.length === 0;
};
