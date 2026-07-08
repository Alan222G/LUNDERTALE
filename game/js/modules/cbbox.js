// cbbox.js — Battle Box module for LUNDERTALE
// Ported from Under-Ground-Engine
var Cbbox = (function() {
    var pos, width, height, speed, newWidth, newHeight;

    function init() {
        pos = new Vect(370, 475, 0); // pos.y is now the fixed BOTTOM edge
        speed = 600;
    }

    function setup(_width, _height) {
        width = _width; height = _height;
        newWidth = _width; newHeight = _height;
    }

    function update(dt) {
        if (Math.abs(width - newWidth) <= speed * dt) {
            width = newWidth;
        } else if (width < newWidth) {
            width += speed * dt;
        } else if (width > newWidth) {
            width -= speed * dt;
        }

        if (Math.abs(height - newHeight) <= speed * dt) {
            height = newHeight;
        } else if (height < newHeight) {
            height += speed * dt;
        } else if (height > newHeight) {
            height -= speed * dt;
        }

        return width === newWidth && height === newHeight;
    }

    function draw(ctx) {
        ctx.save();
        ctx.fillStyle = "#FFF";
        ctx.fillRect(pos.x - width / 2, pos.y - height, width, height);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#000";
        ctx.fillRect(pos.x + 5 - width / 2, pos.y + 5 - height, width - 10, height - 10);
        ctx.restore();
    }

    function getBound() {
        return [
            pos.x - width / 2 + 5,
            pos.y - height + 5,
            pos.x + width / 2 - 5,
            pos.y - 5
        ];
    }

    function setSize(_newWidth, _newHeight, force) {
        newWidth = _newWidth;
        newHeight = _newHeight;
        if (force) {
            width = _newWidth;
            height = _newHeight;
        }
    }

    return { init: init, setup: setup, update: update, draw: draw, getBound: getBound, setSize: setSize };
}());
