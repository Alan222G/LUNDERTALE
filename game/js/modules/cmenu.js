// cmenu.js — Combat menu buttons for LUNDERTALE
var Cmenu = (function() {
    var buttonFight, buttonAct, buttonItem, buttonMercy;
    var buttonFightOver, buttonActOver, buttonItemOver, buttonMercyOver;

    function init() {
        buttonFight = document.getElementById("button_fight");
        buttonAct = document.getElementById("button_act");
        buttonItem = document.getElementById("button_item");
        buttonMercy = document.getElementById("button_mercy");
        buttonFightOver = document.getElementById("button_fight_over");
        buttonActOver = document.getElementById("button_act_over");
        buttonItemOver = document.getElementById("button_item_over");
        buttonMercyOver = document.getElementById("button_mercy_over");
    }

    function draw(ctx, menuState, selectState) {
        ctx.save();
        ctx.drawImage(menuState == selectState.FIGHT ? buttonFightOver : buttonFight, 82, 532);
        ctx.drawImage(menuState == selectState.ACT ? buttonActOver : buttonAct, 235, 532);
        ctx.drawImage(menuState == selectState.ITEM ? buttonItemOver : buttonItem, 395, 532);
        ctx.drawImage(menuState == selectState.MERCY ? buttonMercyOver : buttonMercy, 550, 532);
        ctx.restore();
    }

    return { init: init, draw: draw };
}());
