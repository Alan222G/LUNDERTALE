// vect.js — 2D Vector class for LUNDERTALE
// Ported from Under-Ground-Engine
// Choice 0 takes x,y — Choice 1 takes angle,magnitude
var Vect = function(a, b, choice) {
    switch (choice) {
        case 0:
            this.x = a;
            this.y = b;
            break;
        case 1:
            this.x = Math.sin(a) * b;
            this.y = Math.cos(a) * b;
            break;
    }
};

// Returns a copy of this vector
Vect.prototype.get = function() {
    return new Vect(this.x, this.y, 0);
};

// Vector addition (mutates)
Vect.prototype.add = function(vect) {
    this.x += vect.x;
    this.y += vect.y;
};

// Get addition result (immutable)
Vect.prototype.getAdd = function(vect) {
    return new Vect(this.x + vect.x, this.y + vect.y, 0);
};

// Vector subtraction (mutates)
Vect.prototype.sub = function(vect) {
    this.x -= vect.x;
    this.y -= vect.y;
};

// Get subtraction result (immutable)
Vect.prototype.getSub = function(vect) {
    return new Vect(this.x - vect.x, this.y - vect.y, 0);
};

// Vector multiplication (mutates)
Vect.prototype.mult = function(value) {
    this.x *= value;
    this.y *= value;
};

// Get multiplication result (immutable)
Vect.prototype.getMult = function(value) {
    return new Vect(this.x * value, this.y * value, 0);
};

// Vector division (mutates)
Vect.prototype.div = function(value) {
    this.x /= value;
    this.y /= value;
};

// Get division result (immutable)
Vect.prototype.getDiv = function(value) {
    return new Vect(this.x / value, this.y / value, 0);
};

// Return dot product with another vector
Vect.prototype.getDot = function(value) {
    return this.x * value.x + this.y * value.y;
};

// Return cross product with another vector
Vect.prototype.getCross = function(value) {
    return this.x * value.y - this.y * value.x;
};

// Vector normalization (mutates)
Vect.prototype.norm = function() {
    var length = Math.sqrt(this.x * this.x + this.y * this.y);
    if (length > 0) {
        this.x /= length;
        this.y /= length;
    }
};

// Get normalization result (immutable)
Vect.prototype.getNorm = function() {
    var length = Math.sqrt(this.x * this.x + this.y * this.y);
    if (length === 0) return new Vect(0, 0, 0);
    return new Vect(this.x / length, this.y / length, 0);
};

// Get magnitude of the vector
Vect.prototype.getMagnitude = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};
