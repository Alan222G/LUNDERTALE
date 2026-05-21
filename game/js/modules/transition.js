// transition.js — Transition effects between Overworld and Combat
var Transition = (function() {
    var state = 0; // 0: inactive, 1: fade to white, 2: flash, 3: fade to black
    var timer = 0;
    var duration = 0;
    var callback = null;
    var flickerCount = 0;
    var maxFlickers = 4;
    var flashRate = 0.1;

    function start(type, onComplete) {
        if (typeof type === "function") {
            onComplete = type;
            type = "default";
        }
        state = 1;
        timer = 0;
        flickerCount = 0;
        callback = onComplete;
        Sound.playSound("flash", true);
        Sound.pauseSoundHard("bgm"); // Stop overworld music
    }

    function update(dt) {
        if (state === 0) return false;

        timer += dt;

        switch (state) {
            case 1: // Flicker effect
                if (timer > flashRate) {
                    timer = 0;
                    flickerCount++;
                    if (flickerCount >= maxFlickers) {
                        state = 2; // Move to solid flash
                        timer = 0;
                        duration = 1.0;
                    }
                }
                break;
            case 2: // Solid white flash holding
                if (timer > duration) {
                    state = 0;
                    if (callback) callback();
                    return true;
                }
                break;
        }
        return false;
    }

    function draw(ctx) {
        if (state === 0) return;

        ctx.save();
        switch (state) {
            case 1:
                ctx.globalAlpha = (flickerCount % 2 === 0) ? 1 : 0;
                ctx.fillStyle = "#FFF";
                ctx.fillRect(0, 0, main.WIDTH, main.HEIGHT);
                break;
            case 2:
                ctx.globalAlpha = 1;
                ctx.fillStyle = "#000"; // Fade to black for combat intro
                ctx.fillRect(0, 0, main.WIDTH, main.HEIGHT);
                break;
        }
        ctx.restore();
    }

    function isActive() { return state !== 0; }

    return { start: start, update: update, draw: draw, isActive: isActive };
}());
