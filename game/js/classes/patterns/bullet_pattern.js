// bullet_pattern.js — Abstract base class for bullet patterns
// Ported from UBE's BulletPattern.java

var BulletPattern = function(config) {
    this.bullets = [];
    this.speed = config.speed || 3;
    this.damVal = config.damVal || 4;
    this.rotation = config.rotation || 0;
    this.fadeSpeed = config.fadeSpeed || 0.1;
    this.color = config.color || "#FFF";
    this.bulletWidth = config.bulletWidth || 16;
    this.bulletHeight = config.bulletHeight || 16;
    this.battleBox = null; // Set by generateBullets
    this.finished = false;
};

// Generate bullets within the battle box bounds (override in subclasses)
BulletPattern.prototype.generateBullets = function(battleBox) {
    this.battleBox = battleBox;
    this.finished = false;
};

// Update all bullets
BulletPattern.prototype.update = function(dt) {
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        this.bullets[i].progressMovement(dt);
    }
    this.finished = this.isOver();
};

// Draw all bullets
BulletPattern.prototype.draw = function(ctx) {
    for (var i = 0; i < this.bullets.length; i++) {
        this.bullets[i].draw(ctx);
    }
};

// Check if pattern is complete (override in subclasses)
BulletPattern.prototype.isOver = function() {
    return false;
};

// Clear all bullets
BulletPattern.prototype.clear = function() {
    this.bullets = [];
    this.finished = false;
};

// Check collision with soul at position (sx, sy) with size (sw, sh)
BulletPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.bullets.length; i++) {
        if (this.bullets[i].collidesWith(sx, sy, sw, sh)) {
            return this.bullets[i].damVal;
        }
    }
    return 0;
};
