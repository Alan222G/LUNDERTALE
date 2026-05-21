// cbubble.js — Speech bubble module for LUNDERTALE
var Cbubble = (function() {
    var duration, durationCounter;
    var bubbleText = "";
    var bubblePos = null;
    var bubbleOff = 30;

    function setup(text) {
        duration = 3.0;
        durationCounter = 0;
        if (text && typeof text === "string") {
            bubbleText = text;
        } else {
            bubbleText = "";
        }
    }

    function update(dt) {
        durationCounter += dt;
        return durationCounter > duration;
    }

    function draw(ctx) {
        var bx = Cgroup.getBubblePos(Combat.getSelectStateEnemy()).x;
        var by = Cgroup.getBubblePos(Combat.getSelectStateEnemy()).y;
        var bOff = Cgroup.getBubbleOff(Combat.getSelectStateEnemy());
        
        var bw = 190;
        var bh = 100;
        
        ctx.save();
        ctx.lineWidth = 2;
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";
        
        // Draw rounded rect bubble
        ctx.beginPath();
        ctx.moveTo(bx + 10, by);
        ctx.lineTo(bx + bw - 10, by);
        ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + 10);
        ctx.lineTo(bx + bw, by + bh - 10);
        ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - 10, by + bh);
        ctx.lineTo(bx + 10, by + bh);
        ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - 10);
        ctx.lineTo(bx, by + 10);
        ctx.quadraticCurveTo(bx, by, bx + 10, by);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw tail (triangle pointing down)
        ctx.fillStyle = "#FFF";
        ctx.beginPath();
        ctx.moveTo(bx + bOff, by + bh);
        ctx.lineTo(bx + bOff + 10, by + bh + 18);
        ctx.lineTo(bx + bOff + 20, by + bh);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(bx + bOff, by + bh);
        ctx.lineTo(bx + bOff + 10, by + bh + 18);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx + bOff + 10, by + bh + 18);
        ctx.lineTo(bx + bOff + 20, by + bh);
        ctx.stroke();
        // Cover the border on top of tail
        ctx.fillStyle = "#FFF";
        ctx.fillRect(bx + bOff + 1, by + bh - 2, 19, 4);
        
        // Draw text inside bubble
        if (bubbleText && bubbleText.length > 0) {
            ctx.fillStyle = "#000";
            ctx.font = "12pt Determination Mono";
            ctx.textAlign = "left";
            
            var lines = bubbleText.split("\n");
            var lineY = by + 24;
            var maxWidth = bw - 20;
            
            for (var l = 0; l < lines.length && lineY < by + bh - 5; l++) {
                // Word wrap each line
                var words = lines[l].split(" ");
                var currentLine = "";
                for (var w = 0; w < words.length; w++) {
                    var testLine = currentLine + words[w] + " ";
                    if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
                        ctx.fillText(currentLine.trim(), bx + 12, lineY);
                        currentLine = words[w] + " ";
                        lineY += 20;
                        if (lineY >= by + bh - 5) break;
                    } else {
                        currentLine = testLine;
                    }
                }
                if (lineY < by + bh - 5) {
                    ctx.fillText(currentLine.trim(), bx + 12, lineY);
                    lineY += 20;
                }
            }
        }
        
        ctx.restore();
    }

    return { setup: setup, update: update, draw: draw };
}());
