// chp.js — HP display module for LUNDERTALE
var Chp = (function() {
    var hpText;

    function init() { hpText = document.getElementById("hp"); }

    function draw(ctx, cur, max, yOffset) {
        ctx.save();
        if (yOffset) ctx.translate(0, yOffset);
        ctx.drawImage(hpText, 294, 490);
        document.getElementById('cvs').style.letterSpacing = '0px';
        ctx.fillStyle = "#F00";
        ctx.fillRect(325, 485, Math.floor(max * 1.25) / Math.ceil(max / 150), 21);
        
        if (Player.getBleedTimer && Player.getBleedTimer() > 0) {
            ctx.fillStyle = "#808"; // Purple for poison
        } else {
            ctx.fillStyle = "#FF0";
        }
        ctx.fillRect(325, 485, Math.floor(cur * 1.25) / Math.ceil(max / 150), 21);
        // Karma purple overlay
        if (Player.getKarma() > 0) {
            var karmaWidth = Math.min(Player.getKarma() * 2, Math.floor(cur * 1.25) / Math.ceil(max / 150));
            ctx.fillStyle = "#808";
            ctx.globalAlpha = 0.7;
            ctx.fillRect(325 + Math.floor(cur * 1.25) / Math.ceil(max / 150) - karmaWidth, 485, karmaWidth, 21);
            ctx.globalAlpha = 1;
        }
        ctx.font = "24px Mars Needs Cunnilingus";
        ctx.fillStyle = "#FFF";
        ctx.fillText(plyrName + "   lv " + lv, 81, 503);
        ctx.fillText(Math.ceil(cur) + " / " + max, 339 + Math.floor(max * 1.25) / Math.ceil(max / 150), 503);
        ctx.restore();
    }

    return { init: init, draw: draw };
}());
