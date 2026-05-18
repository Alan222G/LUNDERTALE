// keys.js — Keyboard input handler for LUNDERTALE
"use strict";

var myKeys = {};

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
});

// Key daemon — sparse array tracking which keys are currently pressed
myKeys.keydown = [];

// Event listeners
window.addEventListener("keydown", function(e) {
    myKeys.keydown[e.keyCode] = true;
    // Prevent arrow keys and Z/X from scrolling the page
    if ([37, 38, 39, 40, 90, 88].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
});

window.addEventListener("keyup", function(e) {
    myKeys.keydown[e.keyCode] = false;
});
