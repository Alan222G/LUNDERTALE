// cbubble.js — Speech bubble module for LUNDERTALE
var Cbubble = (function() {
    var duration, durationCounter;

    function setup() { duration = 0; durationCounter = 0; }

    function update(dt) {
        durationCounter += dt;
        return durationCounter > duration;
    }

    function draw(ctx) {
        ctx.save();
        ctx.lineWidth = 1;
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";
        ctx.roundRect(
            Cgroup.getBubblePos(Combat.getSelectStateEnemy()).x,
            Cgroup.getBubblePos(Combat.getSelectStateEnemy()).y,
            180, 120, 15,
            Cgroup.getBubbleOff(Combat.getSelectStateEnemy()));
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    return { setup: setup, update: update, draw: draw };
}());
