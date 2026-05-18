// overworld_player.js — Player character in the overworld
var OverworldPlayer = function() {
    this.x = 320;
    this.y = 240;
    this.width = 20;
    this.height = 30;
    this.speed = 100;
    this.dir = 0; // 0=down, 1=up, 2=left, 3=right
    this.moving = false;
    this.animTimer = 0;
    this.animFrame = 0;
    
    // Load sprites
    this.sprites = { down: [], up: [], left: [], right: [] };
    var basePath = "Resources/Player/";
    var self = this;
    function loadImg(src) {
        var img = new Image();
        img.src = basePath + src;
        return img;
    }
    
    this.sprites.down = [
        loadImg("Player-Idle(front).PNG"),
        loadImg("Player-Walk 1(Down).PNG"),
        loadImg("Player-Idle(front).PNG"),
        loadImg("Player-Walk 2(Down).PNG")
    ];
    this.sprites.up = [
        loadImg("Player-Idle(Up).PNG"),
        loadImg("Player-walk 1(go up).PNG"),
        loadImg("Player-Idle(Up).PNG"),
        loadImg("Player-walk 2(go up).PNG")
    ];
    this.sprites.left = [
        loadImg("Player-Idle(left).PNG"),
        loadImg("Player-walk 1(Go Left).PNG"),
        loadImg("Player-walk 2(Go Left).PNG"),
        loadImg("Player-walk 3(Go Left).PNG")
    ];
    this.sprites.right = [
        loadImg("Player-Idle(Right).PNG"),
        loadImg("Player-walk 1(Go Right).PNG"),
        loadImg("Player-walk 2(Go Right).PNG"),
        loadImg("Player-walk 3(Go Right).PNG")
    ];
};

OverworldPlayer.prototype.update = function(dt, map) {
    var dx = 0, dy = 0;
    this.moving = false;

    if (myKeys.keydown[myKeys.KEYBOARD.KEY_UP]) { dy = -this.speed * dt; this.dir = 1; this.moving = true; }
    else if (myKeys.keydown[myKeys.KEYBOARD.KEY_DOWN]) { dy = this.speed * dt; this.dir = 0; this.moving = true; }
    else if (myKeys.keydown[myKeys.KEYBOARD.KEY_LEFT]) { dx = -this.speed * dt; this.dir = 2; this.moving = true; }
    else if (myKeys.keydown[myKeys.KEYBOARD.KEY_RIGHT]) { dx = this.speed * dt; this.dir = 3; this.moving = true; }

    // Collision detection (simple AABB vs map bounds for now)
    var nx = this.x + dx;
    var ny = this.y + dy;

    // Boundary check
    if (nx < 0) nx = 0;
    if (ny < 0) ny = 0;
    if (nx > 640 - this.width) nx = 640 - this.width;
    if (ny > 480 - this.height) ny = 480 - this.height;

    this.x = nx;
    this.y = ny;

    // Animation
    if (this.moving) {
        this.animTimer += dt;
        if (this.animTimer > 0.2) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4; // 4 frame walk cycle
        }
    } else {
        this.animFrame = 0; // Idle frame
    }
};

OverworldPlayer.prototype.draw = function(ctx) {
    ctx.save();
    
    var currentArray;
    switch (this.dir) {
        case 0: currentArray = this.sprites.down; break;
        case 1: currentArray = this.sprites.up; break;
        case 2: currentArray = this.sprites.left; break;
        case 3: currentArray = this.sprites.right; break;
    }
    
    var img = currentArray[this.animFrame];
    if (img && img.complete) {
        // Draw the sprite, scaling it slightly to fit the 20x30 hitbox but keeping its aspect ratio or centering it
        // The original sprites might be larger, so let's draw them scaled
        ctx.drawImage(img, this.x - 5, this.y - 5, 30, 40);
    } else {
        // Fallback
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    ctx.restore();
};

OverworldPlayer.prototype.getHitbox = function() {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
};
