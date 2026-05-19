// keys.js — Keyboard input handler for LUNDERTALE
"use strict";

var myKeys = {};

// Control scheme: unified (both arrows and wasd work simultaneously)

myKeys.KEYBOARD = Object.freeze({
    "KEY_LEFT": 37,
    "KEY_UP": 38,
    "KEY_RIGHT": 39,
    "KEY_DOWN": 40,
    "KEY_Z": 90,
    "KEY_X": 88,
    "KEY_C": 67,
    "KEY_SPACE": 32,
    "KEY_ENTER": 13,
    // WASD keys
    "KEY_W": 87,
    "KEY_A": 65,
    "KEY_S": 83,
    "KEY_D": 68,
});

// Key daemon — sparse array tracking which keys are currently pressed
myKeys.keydown = [];

// Helper functions combining arrows and WASD
myKeys.isUp = function() {
    return myKeys.keydown[38] || myKeys.keydown[87]; // Arrow Up or W
};
myKeys.isDown = function() {
    return myKeys.keydown[40] || myKeys.keydown[83]; // Arrow Down or S
};
myKeys.isLeft = function() {
    return myKeys.keydown[37] || myKeys.keydown[65]; // Arrow Left or A
};
myKeys.isRight = function() {
    return myKeys.keydown[39] || myKeys.keydown[68]; // Arrow Right or D
};
myKeys.isConfirm = function() {
    return myKeys.keydown[90] || myKeys.keydown[13]; // Z or Enter
};
myKeys.isCancel = function() {
    return myKeys.keydown[88]; // X always
};

// Event listeners
window.addEventListener("keydown", function(e) {
    myKeys.keydown[e.keyCode] = true;
    // Prevent arrow keys, WASD, Z/X/Space and Enter from scrolling the page
    if ([37, 38, 39, 40, 90, 88, 87, 65, 83, 68, 13, 32].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
});

window.addEventListener("keyup", function(e) {
    myKeys.keydown[e.keyCode] = false;
});
