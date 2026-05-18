// keys.js — Keyboard input handler for LUNDERTALE
"use strict";

var myKeys = {};

// Control scheme: "arrows" (default) or "wasd"
myKeys.controlScheme = "arrows";

myKeys.KEYBOARD = Object.freeze({
    "KEY_LEFT": 37,
    "KEY_UP": 38,
    "KEY_RIGHT": 39,
    "KEY_DOWN": 40,
    "KEY_Z": 90,
    "KEY_X": 88,
    "KEY_C": 67,
    "KEY_D": 68,
    "KEY_ENTER": 13,
    // WASD keys
    "KEY_W": 87,
    "KEY_A": 65,
    "KEY_S": 83,
    "KEY_D_KEY": 68, // same as D toggle, handled separately
});

// Key daemon — sparse array tracking which keys are currently pressed
myKeys.keydown = [];

// Helper functions that respect control scheme
myKeys.isUp = function() {
    if (myKeys.controlScheme === "wasd") return myKeys.keydown[87]; // W
    return myKeys.keydown[38]; // Arrow Up
};
myKeys.isDown = function() {
    if (myKeys.controlScheme === "wasd") return myKeys.keydown[83]; // S
    return myKeys.keydown[40]; // Arrow Down
};
myKeys.isLeft = function() {
    if (myKeys.controlScheme === "wasd") return myKeys.keydown[65]; // A
    return myKeys.keydown[37]; // Arrow Left
};
myKeys.isRight = function() {
    if (myKeys.controlScheme === "wasd") return myKeys.keydown[68]; // D
    return myKeys.keydown[39]; // Arrow Right
};
myKeys.isConfirm = function() {
    if (myKeys.controlScheme === "wasd") return myKeys.keydown[13]; // Enter
    return myKeys.keydown[90]; // Z
};
myKeys.isCancel = function() {
    return myKeys.keydown[88]; // X always
};

// Event listeners
window.addEventListener("keydown", function(e) {
    myKeys.keydown[e.keyCode] = true;
    // Prevent arrow keys, WASD, Z/X and Enter from scrolling the page
    if ([37, 38, 39, 40, 90, 88, 87, 65, 83, 13].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
});

window.addEventListener("keyup", function(e) {
    myKeys.keydown[e.keyCode] = false;
});
