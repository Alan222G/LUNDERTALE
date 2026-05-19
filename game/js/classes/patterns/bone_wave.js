// bone_wave.js — Waves of bones with varying heights and gaps
// NEW pattern for LUNDERTALE — classic Undertale bone attack

var BoneWavePattern = function(config) {
    BulletPattern.call(this, config);
    this.maxWaves = config.maxWaves || 6;
    this.waveCount = 0;
    this.waveTimer = 0;
    this.waveInterval = config.waveInterval || 0.6;
    this.minBoneHeight = config.minBoneHeight || 20;
    this.maxBoneHeight = config.maxBoneHeight || 80;
    this.gapSize = config.gapSize || 40;        // Size of the safe gap
    this.boneWidth = config.boneWidth || 12;
    this.duration = config.duration || 5;
    this.elapsed = 0;
};

BoneWavePattern.prototype = Object.create(BulletPattern.prototype);

BoneWavePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.waveCount = 0;
    this.waveTimer = 0;
    this.elapsed = 0;
};

BoneWavePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.waveTimer += dt;

    if (this.waveTimer >= this.waveInterval && this.waveCount < this.maxWaves) {
        this.waveTimer -= this.waveInterval;
        this.spawnBoneColumn();
        this.waveCount++;
    }

    BulletPattern.prototype.update.call(this, dt);

    // Remove out-of-bounds
    var bb = Cbbox.getBound();
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        if (this.bullets[i].isOutOfBounds([bb[0] - 200, bb[1] - 200, bb[2] + 200, bb[3] + 200])) {
            this.bullets.splice(i, 1);
        }
    }
};

BoneWavePattern.prototype.spawnBoneColumn = function() {
    var bb = Cbbox.getBound();
    var boxHeight = bb[3] - bb[1];

    // Random gap position within the box
    var gapY = randomRange(bb[1] + this.gapSize, bb[3] - this.gapSize);

    // Top bone (from top of box to gap)
    var topHeight = gapY - this.gapSize / 2 - bb[1];
    if (topHeight > 5) {
        this.bullets.push(new Bullet({
            x: bb[2] + 10,
            y: bb[1],
            width: this.boneWidth,
            height: topHeight,
            speed: this.speed,
            damVal: this.damVal,
            rotation: 270,
            fadeSpeed: 0.8,
            color: this.color
        }));
    }

    // Bottom bone (from gap to bottom of box)
    var bottomY = gapY + this.gapSize / 2;
    var bottomHeight = bb[3] - bottomY;
    if (bottomHeight > 5) {
        this.bullets.push(new Bullet({
            x: bb[2] + 10,
            y: bottomY,
            width: this.boneWidth,
            height: bottomHeight,
            speed: this.speed,
            damVal: this.damVal,
            rotation: 270,
            fadeSpeed: 0.8,
            color: this.color
        }));
    }
};

BoneWavePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};
