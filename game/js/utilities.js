// utilities.js — Global utility functions for LUNDERTALE
"use strict";

// Clamp value between min and max (inclusive)
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

// Modified mod for negative numbers
Number.prototype.mod = function(n) {
    return ((this % n) + n) % n;
};

// Maps x within range a-b to range c-d
function map(x, a, b, c, d) {
    return (x - a) / (b - a) * (d - c) + c;
}

// Linear interpolation between a and b by t
function lerp(a, b, t) {
    return a + (b - a) * t;
}

// Distance between two points
function distanceBetween(x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// Random number between min and max
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Random integer between min and max (inclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Degrees to radians
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

// Radians to degrees
function radToDeg(radians) {
    return radians * 180 / Math.PI;
}

// Canvas rounded rectangle with speech bubble tail
CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r, d) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.lineTo(x, y + 10 + d);
    this.lineTo(x - 12, y + 5 + d);
    this.lineTo(x, y + d);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
};

// Simple rectangle collision check
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
