// loader.js — Module initializer for LUNDERTALE
"use strict";

var app = app || {};

window.onload = function() {
    console.log("LUNDERTALE — Loading modules...");

    // Initialize effects
    initEffects();

    // Initialize modules
    Flash.init();
    Player.init();
    Inventory.init();
    Soul.init();
    Cbbox.init();
    Writer.init();
    Cattack.init();
    Chp.init();
    Cmenu.init();
    BossController.init();
    Combat.init();
    Overworld.init();
    Sound.init(0.4);

    // Main
    main.init();

    // Screen effects interval
    setInterval(Effects, 10);

    console.log("LUNDERTALE — All modules loaded!");
};
