// cbbox.js — Battle Box module for LUNDERTALE
// Ported from Under-Ground-Engine
var Cbbox = (function() {
    var pos, width, height, speed, newWidth, newHeight;

    function init() {
        pos = new Vect(370, 360, 0);
        speed = 600;
    }

    function setup(_width, _height) {
        width = _width; height = _height;
        newWidth = _width; newHeight = _height;
    }

    function update(dt) {
        if (width < newWidth) width += speed * dt;
        if (height < newHeight) height += speed * dt;
        if (width > newWidth) width -= speed * dt;
        if (height > newHeight) height -= speed * dt;
        if (Math.abs(width - newWidth) < speed * dt) width = newWidth;
        if (Math.abs(height - newHeight) < speed * dt) height = newHeight;
        return width == newWidth && height == newHeight;
    }

    function draw(ctx) {
        ctx.save();
        ctx.fillStyle = "#FFF";
        ctx.fillRect(pos.x - width / 2, pos.y - height / 2, width, height);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#000";
        ctx.fillRect(pos.x + 5 - width / 2, pos.y + 5 - height / 2, width - 10, height - 10);
        ctx.restore();
    }

    function getBound() {
        return [
            pos.x - width / 2 + 5,
            pos.y - height / 2 + 5,
            pos.x + width / 2 - 5,
            pos.y + height / 2 - 5
        ];
    }

    function setSize(_newWidth, _newHeight, force) {
        if (force) { width = _newWidth; height = _newHeight; }
        else { newWidth = _newWidth; newHeight = _newHeight; }
    }

    return { init: init, setup: setup, update: update, draw: draw, getBound: getBound, setSize: setSize };
}());
