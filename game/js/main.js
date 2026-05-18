// main.js — Game loop and global state for LUNDERTALE
"use strict";

var plyrName = 'Aethelgard', lv = 1;
var col = 0;
var debugging;
var deaths = 0;
var seriousMode = false;

var main = {
    WIDTH: 740,
    HEIGHT: 580,
    canvas: undefined,
    ctx: undefined,
    lastTime: 0,
    debug: true,
    animationID: 0,

    // Game state
    gameState: undefined,
    GAME_STATE: Object.freeze({
        TITLE: 0,
        OVERWORLD: 1,
        FLASH: 2,
        COMBAT: 3,
    }),

    titleTimer: 0,
    titleReady: false,

    init: function() {
        console.log("LUNDERTALE — Initializing...");
        this.canvas = document.querySelector("canvas");
        this.canvas.width = this.WIDTH;
        this.canvas.height = this.HEIGHT;
        this.ctx = this.canvas.getContext("2d");
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        this.ctx.imageSmoothingEnabled = false;

        this.gameState = this.GAME_STATE.TITLE;
        this.titleTimer = 0;
        this.titleReady = false;

        Combat.setup(this.ctx);
        this.frame();
    },

    frame: function() {
        this.animationID = requestAnimationFrame(this.frame.bind(this));
        var dt = this.calculateDeltaTime();

        // Clear
        this.ctx.save();
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        this.ctx.restore();

        // Update & Draw
        this.update(dt);
        this.draw(this.ctx);

        // Debug info
        if (this.debug) {
            debugging = 1;
            var dspx = spx || 0, dspy = spy || 0;
            document.getElementById('cvs').style.letterSpacing = '-1.5px';
            this.fillText("dt: " + (100 / (60 * dt)).toFixed(1), 0, 25, "19pt Determination Mono", "lightgreen", false);
            this.fillText("SoulX: " + dspx.toFixed(1), 0, 50, "19pt Determination Mono", "lightgreen", false);
            this.fillText("SoulY: " + dspy.toFixed(1), 0, 75, "19pt Determination Mono", "lightgreen", false);
            this.fillText("Deaths: " + deaths, 0, 100, "19pt Determination Mono", "#F88", false);
        }
    },

    update: function(dt) {
        switch (this.gameState) {
            case this.GAME_STATE.TITLE:
                this.titleTimer += dt;
                if (this.titleTimer > 0.5) this.titleReady = true;
                // Start game with Z or Enter (handled by isConfirm)
                if (this.titleReady && myKeys.isConfirm()) {
                    this.gameState = this.GAME_STATE.OVERWORLD;
                    Overworld.setup(this.ctx);
                    myKeys.keydown = [];
                }
                // Toggle debug
                if (myKeys.keydown[myKeys.KEYBOARD.KEY_C]) {
                    this.debug = !this.debug;
                    myKeys.keydown[myKeys.KEYBOARD.KEY_C] = false;
                }
                break;
            case this.GAME_STATE.OVERWORLD:
                Overworld.update(dt);
                Transition.update(dt);
                // Toggle debug
                if (myKeys.keydown[myKeys.KEYBOARD.KEY_D]) {
                    this.debug = !this.debug;
                    myKeys.keydown[myKeys.KEYBOARD.KEY_D] = false;
                }
                break;
            case this.GAME_STATE.FLASH:
                if (Flash.update(dt)) this.gameState = this.GAME_STATE.COMBAT;
                break;
            case this.GAME_STATE.COMBAT:
                Combat.update(dt);
                Transition.update(dt);
                // Toggle debug during combat
                if (myKeys.keydown[myKeys.KEYBOARD.KEY_D]) {
                    this.debug = !this.debug;
                    myKeys.keydown[myKeys.KEYBOARD.KEY_D] = false;
                }
                break;
        }
    },

    draw: function(ctx) {
        switch (this.gameState) {
            case this.GAME_STATE.TITLE:
                this.drawTitle(ctx);
                break;
            case this.GAME_STATE.OVERWORLD:
                Overworld.draw(ctx);
                Transition.draw(ctx);
                break;
            case this.GAME_STATE.FLASH:
                Flash.draw(ctx);
                break;
            case this.GAME_STATE.COMBAT:
                Combat.draw(ctx);
                break;
        }
    },

    drawTitle: function(ctx) {
        ctx.save();

        // Starfield background
        var time = this.titleTimer;
        for (var i = 0; i < 60; i++) {
            var sx = ((i * 97 + time * (20 + i % 5)) % this.WIDTH);
            var sy = ((i * 61 + time * (5 + i % 3)) % this.HEIGHT);
            var brightness = 100 + Math.floor(Math.sin(time * 2 + i) * 80);
            ctx.fillStyle = "rgb(" + brightness + "," + brightness + "," + (brightness + 50) + ")";
            ctx.fillRect(sx, sy, 2, 2);
        }

        // Title
        ctx.font = "36pt Determination Mono";
        ctx.textAlign = "center";

        // Glow effect
        var glow = Math.sin(time * 2) * 0.3 + 0.7;
        ctx.fillStyle = "rgba(100,0,255," + (glow * 0.3) + ")";
        ctx.fillText("LUNDERTALE", 372, 202);
        ctx.fillStyle = "#FFF";
        ctx.fillText("LUNDERTALE", 370, 200);

        // Subtitle
        ctx.font = "14pt Determination Mono";
        ctx.fillStyle = "#888";
        ctx.fillText("A  T A L E  F R O M  T H E  V O I D", 370, 250);

        // Player name
        ctx.font = "16pt Determination Mono";
        ctx.fillStyle = "#FF0";
        ctx.fillText('"' + plyrName + '"', 370, 310);

        // Prompt
        if (this.titleReady) {
            var alpha = Math.sin(time * 4) * 0.4 + 0.6;
            ctx.globalAlpha = alpha;
            ctx.font = "16pt Determination Mono";
            ctx.fillStyle = "#FFF";
            ctx.fillText("Press Z or Enter to begin", 370, 390);
        }

        // Controls manual
        ctx.globalAlpha = 0.75;
        ctx.font = "10pt Determination Mono";
        ctx.textAlign = "center";
        ctx.fillStyle = "#0FF";
        ctx.fillText("— CONTROLS —", 370, 435);
        ctx.fillStyle = "#CCC";
        ctx.fillText("WASD / Arrows = Move / Navigate", 370, 452);
        ctx.fillText("Z / Enter = Confirm / Advance", 370, 467);
        ctx.fillText("X = Cancel / Go Back", 370, 482);
        ctx.fillText("C = Toggle Debug Info", 370, 497);

        // Version
        ctx.globalAlpha = 0.4;
        ctx.font = "10pt Determination Mono";
        ctx.fillStyle = "#666";
        ctx.fillText("v0.1 — Built with Under-Ground-Engine & UBE", 370, 520);

        ctx.restore();
    },

    fillText: function(string, x, y, css, color, centered) {
        this.ctx.save();
        if (centered) {
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
        }
        this.ctx.font = css;
        this.ctx.fillStyle = color;
        this.ctx.fillText(string, x, y);
        this.ctx.restore();
    },

    calculateDeltaTime: function() {
        var now = +new Date();
        var fps = 1000 / (now - this.lastTime);
        fps = clamp(fps, 12, 60);
        this.lastTime = now;
        return 1 / fps;
    },
};
