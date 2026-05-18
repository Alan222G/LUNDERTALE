// bullet_rain.js — Random bullet rain from one direction
// Ported from UBE's BulletRain.java

var BulletRainPattern = function(config) {
    BulletPattern.call(this, config);
    this.spawnTimer = 0;
    this.spawnInterval = config.spawnInterval || 0.08; // Faster spawn
    this.duration = config.duration || 5;
    this.elapsed = 0;
};

BulletRainPattern.prototype = Object.create(BulletPattern.prototype);

BulletRainPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
};

BulletRainPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;

    // Spawn new bullets at interval
    if (this.spawnTimer >= this.spawnInterval && this.elapsed < this.duration) {
        this.spawnTimer -= this.spawnInterval;
        this.spawnBullet();
    }

    // Update existing bullets
    BulletPattern.prototype.update.call(this, dt);

    // Remove out-of-bounds bullets
    var bb = this.battleBox;
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        if (this.bullets[i].isOutOfBounds([bb[0] - 100, bb[1] - 100, bb[2] + 100, bb[3] + 100])) {
            this.bullets.splice(i, 1);
        }
    }
};

BulletRainPattern.prototype.spawnBullet = function() {
    var bb = this.battleBox;
    var x, y, rot;
    var dir = this.rotation;

    // Randomize direction for Meteor Shower
    var dirs = [0, 90, 180, 270];
    dir = dirs[Math.floor(Math.random() * dirs.length)];

    switch (dir) {
        case 270: // From right
            x = bb[2] + this.bulletWidth;
            y = randomRange(bb[1], bb[3] - this.bulletHeight);
            rot = 270;
            break;
        case 180: // From top
            x = randomRange(bb[0], bb[2] - this.bulletWidth);
            y = bb[1] - this.bulletHeight * 2;
            rot = 180;
            break;
        case 90: // From left
            x = bb[0] - this.bulletWidth * 2;
            y = randomRange(bb[1], bb[3] - this.bulletHeight);
            rot = 90;
            break;
        default: // From bottom (0 = up)
            x = randomRange(bb[0], bb[2] - this.bulletWidth);
            y = bb[3] + this.bulletHeight;
            rot = 0;
            break;
    }

    this.bullets.push(new Bullet({
        x: x, y: y,
        width: this.bulletWidth, height: this.bulletHeight,
        speed: this.speed + randomRange(0, 2),
        damVal: this.damVal,
        rotation: rot,
        fadeSpeed: this.fadeSpeed,
        color: this.color
    }));
};

BulletRainPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
