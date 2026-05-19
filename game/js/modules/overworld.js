// overworld.js — Overworld engine for LUNDERTALE
var Overworld = (function() {
    var player;
    var active = false;
    var npcList = [];
    var triggerList = [];
    var mapData = null;

    var catalogActive = false;
    var catalogIndex = 0;
    var catalogOptions = [
        { name: "Corazón Rojo", desc: "Equilibrado. HP:120, VEL:Normal, ATK:Normal" },
        { name: "Corazón Verde", desc: "Tanque. HP:180, VEL:-20%, ATK:-20%, DEF:+30%" },
        { name: "Corazón Amarillo", desc: "Agresivo. HP:80, VEL:+30%, ATK:+40%, DEF:-30%" },
        { name: "Corazón Morado", desc: "Ágil. HP:100, VEL:+50%, ATK:Normal, DEF:Normal" },
        { name: "Corazón Azul", desc: "Saltador. HP:120, VEL:+20%, Gravedad activa" },
        { name: "Corazón Naranja", desc: "Imparable. HP:110, VEL:+60%, ATK:+10%" },
        { name: "Corazón Celeste", desc: "Paciente. HP:140, VEL:-10%, DEF:+20%" },
        { name: "Corazón Rosa", desc: "Magnético. HP:100, VEL:+40%, ATK:+20%" },
        { name: "Corazón Púrpura Oscuro", desc: "Invertido. HP:130, DEF:+10%, Gravedad invertida" },
        { name: "Corazón Blanco", desc: "Evasivo. HP:90, VEL:+20%, DEF:-20%" }
    ];

    var bgImage = new Image();
    bgImage.src = "Resources/Fondo del overworld Best.png";
    
    var animTimer = 0;
    var singFrames = [];
    var seraFrames = [];
    
    function loadImg(src) { var i = new Image(); i.src = src; return i; }

    function init() {
        player = new OverworldPlayer();

        // Create Catalog Interactable (floating star/heart area)
        npcList.push({
            x: 80, y: 150, w: 40, h: 40, color: "rgba(255, 255, 0, 0.8)",
            isCatalog: true
        });

        // Singularity battle trigger (top-right area)
        triggerList.push({
            x: 485, y: 85, w: 90, h: 90,
            triggered: false,
            bossId: "singularity",
            label: "Anti-gravity",
            color: "rgba(100, 0, 200, 0.4)",
            action: function() {
                var self = this;
                Transition.start(function() {
                    main.gameState = main.GAME_STATE.COMBAT;
                    Combat.init(self.bossId);
                    Combat.setup(main.ctx);
                });
            }
        });

        // Seraphina Vex battle trigger (bottom-left area)
        triggerList.push({
            x: 85, y: 335, w: 90, h: 90,
            triggered: false,
            bossId: "seraphina",
            label: "Seraphina Vex",
            color: "rgba(255, 200, 0, 0.4)",
            action: function() {
                var self = this;
                Transition.start(function() {
                    main.gameState = main.GAME_STATE.COMBAT;
                    Combat.init(self.bossId);
                    Combat.setup(main.ctx);
                });
            }
        });

        // Ramiel battle trigger (bottom-right area)
        triggerList.push({
            x: 485, y: 335, w: 90, h: 90,
            triggered: false,
            bossId: "ramiel",
            label: "RAMIEL",
            color: "rgba(30, 100, 255, 0.5)",
            action: function() {
                var self = this;
                Transition.start(function() {
                    main.gameState = main.GAME_STATE.COMBAT;
                    Combat.init(self.bossId);
                    Combat.setup(main.ctx);
                });
            }
        });
        
        // Load boss animations
        singFrames = [
            loadImg("Resources/Agujero negro Boss Map 1.PNG"),
            loadImg("Resources/Agujero negro Boss Map 2.PNG"),
            loadImg("Resources/Agujero negro Boss Map 3.PNG")
        ];
        
        seraFrames = [
            loadImg("Resources/Angel Blink Boss Map 1.PNG"),
            loadImg("Resources/Angel Blink Boss Map 2.PNG"),
            loadImg("Resources/Angel Blink Boss Map 3.PNG"),
            loadImg("Resources/Angel Blink Boss Map 4.PNG")
        ];
    }

    function setup(ctx) {
        active = true;
        Sound.pauseSoundHard("bgm");
        Sound.pauseSoundHard("bgm_seraphina");
        Sound.pauseSoundHard("bgm_singularity");
        Sound.playSound("bgm_overworld", true);
    }

    function update(dt) {
        if (!active || Transition.isActive()) return;
        animTimer += dt;
        
        if (catalogActive) {
            // Handle Catalog Input
            if (myKeys.isUp()) {
                myKeys.keydown[myKeys.KEYBOARD.KEY_UP] = false;
                myKeys.keydown[myKeys.KEYBOARD.KEY_W] = false;
                catalogIndex--;
                if (catalogIndex < 0) catalogIndex = catalogOptions.length - 1;
                Sound.playSound("select", true);
            } else if (myKeys.isDown()) {
                myKeys.keydown[myKeys.KEYBOARD.KEY_DOWN] = false;
                myKeys.keydown[myKeys.KEYBOARD.KEY_S] = false;
                catalogIndex++;
                if (catalogIndex >= catalogOptions.length) catalogIndex = 0;
                Sound.playSound("select", true);
            } else if (myKeys.isConfirm()) {
                myKeys.keydown[myKeys.KEYBOARD.KEY_Z] = false;
                myKeys.keydown[myKeys.KEYBOARD.KEY_ENTER] = false;
                Player.setSoulClass(catalogIndex);
                catalogActive = false;
                Sound.playSound("heal", true);
            } else if (myKeys.isCancel()) {
                myKeys.keydown[myKeys.KEYBOARD.KEY_X] = false;
                catalogActive = false;
            }
            return; // Skip player movement while in catalog
        }

        player.update(dt, null);

        // Check Triggers
        var pbox = player.getHitbox();
        for (var i = 0; i < triggerList.length; i++) {
            var t = triggerList[i];
            if (!t.triggered && rectsOverlap(pbox.x, pbox.y, pbox.w, pbox.h, t.x, t.y, t.w, t.h)) {
                t.triggered = true;
                t.action();
            }
        }

        // Check Interactions (Z/Enter key)
        if (myKeys.isConfirm()) {
            myKeys.keydown[myKeys.KEYBOARD.KEY_Z] = false;
            myKeys.keydown[myKeys.KEYBOARD.KEY_ENTER] = false;
            var interactBox = { x: pbox.x, y: pbox.y, w: pbox.w, h: pbox.h };
            if (player.dir === 0) { interactBox.y += 20; interactBox.h = 20; }
            if (player.dir === 1) { interactBox.y -= 20; interactBox.h = 20; }
            if (player.dir === 2) { interactBox.x -= 20; interactBox.w = 20; }
            if (player.dir === 3) { interactBox.x += 20; interactBox.w = 20; }

            for (var i = 0; i < npcList.length; i++) {
                var npc = npcList[i];
                if (rectsOverlap(interactBox.x, interactBox.y, interactBox.w, interactBox.h, npc.x, npc.y, npc.w, npc.h)) {
                    if (npc.isCatalog) {
                        catalogActive = true;
                        catalogIndex = Player.getSoulClass();
                    }
                }
            }
        }
    }

    function draw(ctx) {
        if (!active) return;

        ctx.save();
        // Draw background
        if (bgImage.complete) {
            ctx.drawImage(bgImage, 0, 0, main.WIDTH, main.HEIGHT);
        } else {
            ctx.fillStyle = "#111";
            ctx.fillRect(0, 0, main.WIDTH, main.HEIGHT);
        }

        // Draw triggers with visual markers
        for (var i = 0; i < triggerList.length; i++) {
            var t = triggerList[i];
            var time = Date.now() / 1000;
            
            if (!t.triggered) {
                ctx.save();
                var gcx = t.x + t.w / 2;
                var gcy = t.y + t.h / 2;
                
                // Draw animated boss sprite
                var img = null;
                if (t.bossId === "seraphina") {
                    var frameIdx = Math.floor(animTimer * 4) % seraFrames.length;
                    img = seraFrames[frameIdx];
                } else if (t.bossId === "ramiel") {
                    // Procedural mini crystal for Ramiel
                    img = null; // Force fallback to procedural
                } else {
                    var frameIdx = Math.floor(animTimer * 4) % singFrames.length;
                    img = singFrames[frameIdx];
                }
                
                if (t.bossId === "ramiel") {
                    // Draw procedural mini octahedron
                    var rTime = animTimer;
                    var rRot = Math.sin(rTime * 0.8) * 0.15;
                    var rSize = 18 + Math.sin(rTime * 2) * 2;
                    
                    // Blue glow
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = "rgba(50, 120, 255, 0.8)";
                    
                    // Diamond shape
                    ctx.save();
                    ctx.translate(gcx, gcy);
                    ctx.rotate(rRot);
                    var dGrad = ctx.createLinearGradient(-rSize * 0.5, -rSize, rSize * 0.5, rSize);
                    dGrad.addColorStop(0, "rgba(20, 40, 150, 0.9)");
                    dGrad.addColorStop(0.5, "rgba(60, 140, 255, 0.95)");
                    dGrad.addColorStop(1, "rgba(20, 40, 150, 0.9)");
                    ctx.fillStyle = dGrad;
                    ctx.beginPath();
                    ctx.moveTo(0, -rSize);
                    ctx.lineTo(rSize * 0.6, 0);
                    ctx.lineTo(0, rSize);
                    ctx.lineTo(-rSize * 0.6, 0);
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = "rgba(150, 200, 255, 0.7)";
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    
                    // Red core
                    ctx.shadowBlur = 0;
                    var cPulse = Math.sin(rTime * 3) * 0.2 + 0.8;
                    ctx.fillStyle = "rgba(255, 50, 30, " + (0.8 * cPulse).toFixed(2) + ")";
                    ctx.beginPath();
                    ctx.arc(0, 0, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                    
                    ctx.shadowBlur = 0;
                } else if (img && img.complete) {
                    ctx.drawImage(img, t.x, t.y, t.w, t.h);
                } else {
                    // Fallback to glowing circle if images aren't loaded yet
                    var pulse = Math.sin(time * 3 + i * 2) * 0.15 + 0.85;
                    ctx.globalAlpha = pulse;
                    var glowGrad = ctx.createRadialGradient(gcx, gcy, 5, gcx, gcy, 35);
                    glowGrad.addColorStop(0, t.color);
                    glowGrad.addColorStop(1, "rgba(0,0,0,0)");
                    ctx.fillStyle = glowGrad;
                    ctx.beginPath();
                    ctx.arc(gcx, gcy, 35, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = t.bossId === "seraphina" ? "#FFD700" : "#8800FF";
                    ctx.beginPath();
                    ctx.arc(gcx, gcy, 8, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Label
                ctx.font = "8pt Determination Mono";
                ctx.textAlign = "center";
                ctx.fillStyle = "#FFF";
                ctx.fillText(t.label, gcx, t.y - 5);
                
                ctx.restore();
            }
            
            // Debug rectangles
            if (main.debug) {
                ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
                ctx.fillRect(t.x, t.y, t.w, t.h);
            }
        }

        // Draw NPCs
        for (var i = 0; i < npcList.length; i++) {
            var npc = npcList[i];
            if (npc.isCatalog) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = "#FFD700";
                ctx.fillStyle = npc.color;
                ctx.fillRect(npc.x, npc.y, npc.w, npc.h);
                ctx.shadowBlur = 0;
                ctx.fillStyle = "#FFF";
                ctx.font = "10pt Determination Mono";
                ctx.textAlign = "center";
                ctx.fillText("SOUL CATALOG", npc.x + npc.w/2, npc.y - 5);
            } else {
                ctx.fillStyle = npc.color;
                ctx.fillRect(npc.x, npc.y, npc.w, npc.h);
            }
        }

        // Draw Player
        player.draw(ctx);
        
        // Draw Catalog UI Overlay
        if (catalogActive) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.fillRect(0, 0, main.WIDTH, main.HEIGHT);
            
            ctx.strokeStyle = "#FFF";
            ctx.lineWidth = 4;
            ctx.fillStyle = "#000";
            ctx.fillRect(50, 50, main.WIDTH - 100, main.HEIGHT - 100);
            ctx.strokeRect(50, 50, main.WIDTH - 100, main.HEIGHT - 100);
            
            ctx.font = "24pt Determination Mono";
            ctx.fillStyle = "#FFF";
            ctx.textAlign = "center";
            ctx.fillText("CHARACTER CUSTOMIZATION", main.WIDTH/2, 90);
            
            ctx.font = "16pt Determination Mono";
            ctx.textAlign = "left";
            for (var i = 0; i < catalogOptions.length; i++) {
                var yPos = 160 + i * 80;
                if (i === catalogIndex) {
                    ctx.fillStyle = "#FF0";
                    ctx.fillText("> " + catalogOptions[i].name, 80, yPos);
                } else {
                    ctx.fillStyle = "#FFF";
                    ctx.fillText("  " + catalogOptions[i].name, 80, yPos);
                }
                ctx.fillStyle = "#CCC";
                ctx.font = "12pt Determination Mono";
                ctx.fillText(catalogOptions[i].desc, 110, yPos + 25);
                ctx.font = "16pt Determination Mono"; // reset for next item
            }
            
            ctx.textAlign = "center";
            ctx.fillStyle = "#888";
            ctx.font = "12pt Determination Mono";
            ctx.fillText("Use UP/DOWN to select. Press ENTER to equip. Press X to close.", main.WIDTH/2, main.HEIGHT - 70);
            
            // Draw current equipped
            ctx.fillStyle = "#0F0";
            var currentName = catalogOptions[Player.getSoulClass()].name;
            ctx.fillText("Current: " + currentName, main.WIDTH/2, main.HEIGHT - 100);
        }

        ctx.restore();
    }

    return { init: init, setup: setup, update: update, draw: draw };
}());
