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

        // Singularity battle trigger (Anomalies Group)
        triggerList.push({
            x: 100, y: 250, w: 40, h: 40,
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

        // Seraphina Vex battle trigger (Anomalies Group)
        triggerList.push({
            x: 100, y: 400, w: 40, h: 40,
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

        // Ramiel battle trigger (Guest Group)
        triggerList.push({
            x: 500, y: 150, w: 40, h: 40,
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
        
        // Paradox battle trigger (Anomalies Group)
        triggerList.push({
            x: 250, y: 250, w: 40, h: 40,
            triggered: false,
            bossId: "paradox",
            label: "PARADOJA",
            color: "rgba(255, 200, 50, 0.5)",
            action: function() {
                var self = this;
                Transition.start(function() {
                    main.gameState = main.GAME_STATE.COMBAT;
                    Combat.init(self.bossId);
                    Combat.setup(main.ctx);
                });
            }
        });
        
        // Sachiel battle trigger (Guest Group)
        triggerList.push({
            x: 500, y: 350, w: 40, h: 40,
            triggered: false,
            bossId: "sachiel",
            label: "SACHIEL",
            color: "rgba(200, 0, 0, 0.5)",
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
                } else if (t.bossId === "ramiel" || t.bossId === "paradox" || t.bossId === "sachiel") {
                    // Procedural mini crystal or colored box for new bosses
                    img = null; 
                } else {
                    var frameIdx = Math.floor(animTimer * 4) % singFrames.length;
                    img = singFrames[frameIdx];
                }
                
                if (t.bossId === "ramiel") {
                    // Epic 3D Ramiel representation
                    var rTime = animTimer;
                    var rRot = Math.sin(rTime * 0.8) * 0.15;
                    var rSize = 25; // Bigger
                    
                    ctx.save();
                    ctx.translate(gcx, gcy - 5 + Math.sin(rTime * 2) * 5); // Floating
                    ctx.rotate(rRot);
                    
                    // Massive Blue Glow
                    ctx.shadowBlur = 25;
                    ctx.shadowColor = "rgba(100, 150, 255, 0.9)";
                    
                    // Main Octahedron
                    ctx.beginPath();
                    ctx.moveTo(0, -rSize);
                    ctx.lineTo(rSize * 0.8, 0);
                    ctx.lineTo(0, rSize);
                    ctx.lineTo(-rSize * 0.8, 0);
                    ctx.closePath();
                    
                    // Complex metallic blue gradient
                    var dGrad = ctx.createLinearGradient(-rSize, -rSize, rSize, rSize);
                    dGrad.addColorStop(0, "#88CCFF");
                    dGrad.addColorStop(0.3, "#1155DD");
                    dGrad.addColorStop(0.5, "#4488FF");
                    dGrad.addColorStop(0.8, "#002288");
                    dGrad.addColorStop(1, "#88CCFF");
                    ctx.fillStyle = dGrad;
                    ctx.fill();
                    
                    // Bright Edges
                    ctx.shadowBlur = 5;
                    ctx.strokeStyle = "#FFFFFF";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    // Center facets line
                    ctx.beginPath();
                    ctx.moveTo(-rSize * 0.8, 0);
                    ctx.lineTo(rSize * 0.8, 0);
                    ctx.stroke();
                    
                    // Pulsing Red Core
                    var coreScale = 0.5 + Math.sin(rTime * 5) * 0.5;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = "#FF0000";
                    ctx.fillStyle = "rgba(255, 50, 50, 0.9)";
                    ctx.beginPath();
                    ctx.arc(0, 0, 4 + coreScale * 2, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Drill beam to the ground
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = "rgba(200, 220, 255, 0.8)";
                    ctx.fillStyle = "rgba(255, 255, 255, " + (0.3 + coreScale * 0.2) + ")";
                    ctx.beginPath();
                    ctx.moveTo(-2, rSize);
                    ctx.lineTo(2, rSize);
                    ctx.lineTo(0, rSize + 25);
                    ctx.fill();
                    
                    ctx.restore();
                    ctx.shadowBlur = 0;
                } else if (t.bossId === "paradox") {
                    // Epic Paradox Hourglass
                    var pTime = animTimer;
                    var pSize = 25; // Bigger
                    
                    ctx.save();
                    ctx.translate(gcx, gcy + Math.sin(pTime * 3) * 5);
                    ctx.rotate(Math.sin(pTime * 1.5) * 0.1);
                    
                    // Golden aura
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = "rgba(255, 200, 50, 0.9)";
                    
                    // Hourglass Glass
                    ctx.fillStyle = "rgba(200, 240, 255, 0.4)";
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(-pSize * 0.6, -pSize);
                    ctx.quadraticCurveTo(0, -pSize * 0.2, pSize * 0.6, -pSize);
                    ctx.lineTo(pSize * 0.2, 0);
                    ctx.lineTo(pSize * 0.6, pSize);
                    ctx.quadraticCurveTo(0, pSize * 0.2, -pSize * 0.6, pSize);
                    ctx.lineTo(-pSize * 0.2, 0);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    
                    // Golden Frame
                    ctx.fillStyle = "#FFB800";
                    ctx.fillRect(-pSize * 0.7, -pSize - 4, pSize * 1.4, 4);
                    ctx.fillRect(-pSize * 0.7, pSize, pSize * 1.4, 4);
                    ctx.fillRect(-pSize * 0.7, -pSize - 4, 4, pSize * 2 + 8);
                    ctx.fillRect(pSize * 0.7 - 4, -pSize - 4, 4, pSize * 2 + 8);
                    
                    // Glowing Red Eye in Top Half
                    var eyeBlink = Math.sin(pTime * 6) > 0.8 ? 0.2 : 1.0;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = "#FF0000";
                    ctx.fillStyle = "rgba(200, 0, 0, 0.9)";
                    ctx.beginPath();
                    ctx.ellipse(0, -pSize * 0.5, 8, 4 * eyeBlink, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = "#FFF";
                    ctx.beginPath();
                    ctx.arc(0, -pSize * 0.5, 2 * eyeBlink, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = "#000";
                    ctx.beginPath();
                    ctx.ellipse(0, -pSize * 0.5, 0.5 * eyeBlink, 1.5 * eyeBlink, 0, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Golden sand falling
                    ctx.fillStyle = "#FFD700";
                    for(var s=0; s<15; s++) {
                        var sx = (Math.random()-0.5)*pSize*0.8;
                        var sy = Math.random()*pSize;
                        if(Math.abs(sx) < sy*0.4) {
                            var yPos = (sy + pTime * 50) % pSize;
                            ctx.fillRect(sx, yPos, 2, 2);
                        }
                    }
                    
                    // Magical temporal rings
                    ctx.strokeStyle = "rgba(255, 200, 50, " + (0.3 + Math.sin(pTime*4)*0.2) + ")";
                    ctx.lineWidth = 1.5;
                    for (var r=1; r<=3; r++) {
                        ctx.beginPath();
                        ctx.ellipse(0, 0, pSize*1.5 + Math.sin(pTime*2)*5, pSize*0.5 + Math.sin(pTime*3+r)*5, pTime*(0.5*r), 0, Math.PI*2);
                        ctx.stroke();
                    }
                    
                    ctx.restore();
                } else if (t.bossId === "sachiel") {
                    // Epic Sachiel Representation
                    var sTime = animTimer;
                    var sSize = 25; // Bigger
                    
                    ctx.save();
                    ctx.translate(gcx, gcy + Math.sin(sTime * 4) * 3);
                    
                    // Dark Aura
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = "rgba(100, 0, 150, 0.8)";
                    
                    // Huge Dark Shoulders / Body
                    ctx.fillStyle = "#110522";
                    ctx.beginPath();
                    ctx.moveTo(-sSize * 0.9, sSize * 0.2);
                    ctx.quadraticCurveTo(-sSize * 0.8, -sSize * 0.8, 0, -sSize * 0.4);
                    ctx.quadraticCurveTo(sSize * 0.8, -sSize * 0.8, sSize * 0.9, sSize * 0.2);
                    ctx.quadraticCurveTo(sSize * 0.6, sSize * 0.8, 0, sSize * 0.9);
                    ctx.quadraticCurveTo(-sSize * 0.6, sSize * 0.8, -sSize * 0.9, sSize * 0.2);
                    ctx.fill();
                    
                    // Purple highlights on shoulders
                    ctx.strokeStyle = "rgba(150, 50, 200, 0.5)";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(-sSize * 0.8, sSize * 0.1);
                    ctx.quadraticCurveTo(-sSize * 0.6, -sSize * 0.6, -sSize * 0.1, -sSize * 0.3);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(sSize * 0.8, sSize * 0.1);
                    ctx.quadraticCurveTo(sSize * 0.6, -sSize * 0.6, sSize * 0.1, -sSize * 0.3);
                    ctx.stroke();
                    
                    // Throbbing Red Core
                    var cPulse = 0.5 + Math.sin(sTime * 8) * 0.5;
                    ctx.shadowBlur = 25;
                    ctx.shadowColor = "#FF0000";
                    ctx.fillStyle = "rgba(255, 0, 0, " + (0.7 + cPulse*0.3) + ")";
                    ctx.beginPath();
                    ctx.arc(0, sSize * 0.3, sSize * 0.25, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Core Inner White
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = "rgba(255, 255, 255, " + (0.5 + cPulse*0.5) + ")";
                    ctx.beginPath();
                    ctx.arc(0, sSize * 0.3, sSize * 0.1, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // White Bone Mask
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
                    ctx.fillStyle = "#EEEEEE";
                    ctx.beginPath();
                    ctx.moveTo(-sSize * 0.4, -sSize * 0.6);
                    ctx.quadraticCurveTo(0, -sSize * 0.9, sSize * 0.4, -sSize * 0.6);
                    ctx.quadraticCurveTo(sSize * 0.2, -sSize * 0.2, 0, 0);
                    ctx.quadraticCurveTo(-sSize * 0.2, -sSize * 0.2, -sSize * 0.4, -sSize * 0.6);
                    ctx.fill();
                    
                    // Mask details (beak lines)
                    ctx.strokeStyle = "#888";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(0, -sSize * 0.4);
                    ctx.lineTo(0, -sSize * 0.1);
                    ctx.stroke();
                    
                    // Creepy Black Eyes
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = "#000";
                    ctx.beginPath();
                    ctx.ellipse(-sSize * 0.15, -sSize * 0.5, sSize * 0.08, sSize * 0.05, 0.2, 0, Math.PI * 2);
                    ctx.ellipse(sSize * 0.15, -sSize * 0.5, sSize * 0.08, sSize * 0.05, -0.2, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.restore();
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
        
        // Draw Catalog UI Overlay (Undertale Shop Style)
        if (catalogActive) {
            // Full screen black background
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, main.WIDTH, main.HEIGHT);
            
            // Draw Undertale style borders (white 4px)
            ctx.strokeStyle = "#FFF";
            ctx.lineWidth = 4;
            
            // Top Left Pane (Preview)
            ctx.strokeRect(20, 20, 280, 260);
            
            // Top Right Pane (List)
            ctx.strokeRect(320, 20, 300, 260);
            
            // Bottom Pane (Description)
            ctx.strokeRect(20, 300, 600, 160);
            
            // 1. Draw Preview (Top Left)
            var opt = catalogOptions[catalogIndex];
            ctx.fillStyle = "#FFF";
            ctx.font = "18pt 'Determination Mono', monospace";
            ctx.textAlign = "center";
            ctx.fillText(opt.name, 160, 50);
            
            // Draw Heart
            ctx.save();
            ctx.translate(160, 120);
            ctx.scale(3, 3); // Make it big
            var colors = ["#F00", "#0F0", "#FF0", "#A0A", "#00F", "#F80", "#0FF", "#F0F", "#408", "#FFF"];
            ctx.fillStyle = colors[catalogIndex] || "#F00";
            ctx.beginPath();
            ctx.moveTo(0, 5);
            ctx.bezierCurveTo(-5, 0, -10, 0, -10, 5);
            ctx.bezierCurveTo(-10, 10, 0, 15, 0, 20);
            ctx.bezierCurveTo(0, 15, 10, 10, 10, 5);
            ctx.bezierCurveTo(10, 0, 5, 0, 0, 5);
            ctx.fill();
            ctx.restore();
            
            // Draw Stats / Controls
            ctx.font = "14pt 'Determination Mono', monospace";
            ctx.textAlign = "left";
            ctx.fillStyle = Player.getSoulClass() === catalogIndex ? "#FF0" : "#FFF";
            ctx.fillText("Equipped: " + (Player.getSoulClass() === catalogIndex ? "YES" : "NO"), 40, 210);
            ctx.fillStyle = "#888";
            ctx.fillText("[Z] Equip", 40, 240);
            ctx.fillText("[X] Exit", 40, 265);
            
            // 2. Draw List (Top Right)
            var maxVisible = 6;
            var itemHeight = 35;
            var startY = 60;
            
            if (typeof catalogScrollOffset === "undefined") catalogScrollOffset = 0;
            if (catalogIndex < catalogScrollOffset) catalogScrollOffset = catalogIndex;
            if (catalogIndex >= catalogScrollOffset + maxVisible) catalogScrollOffset = catalogIndex - maxVisible + 1;
            
            var endIdx = Math.min(catalogOptions.length, catalogScrollOffset + maxVisible);
            
            ctx.font = "16pt 'Determination Mono', monospace";
            for (var i = catalogScrollOffset; i < endIdx; i++) {
                var yPos = startY + (i - catalogScrollOffset) * itemHeight;
                ctx.fillStyle = (i === catalogIndex) ? "#FF0" : "#FFF";
                
                // Draw heart cursor if selected
                if (i === catalogIndex) {
                    ctx.save();
                    ctx.translate(345, yPos - 6);
                    ctx.scale(0.8, 0.8);
                    ctx.fillStyle = colors[i] || "#F00";
                    ctx.beginPath();
                    ctx.moveTo(0, 5);
                    ctx.bezierCurveTo(-5, 0, -10, 0, -10, 5);
                    ctx.bezierCurveTo(-10, 10, 0, 15, 0, 20);
                    ctx.bezierCurveTo(0, 15, 10, 10, 10, 5);
                    ctx.bezierCurveTo(10, 0, 5, 0, 0, 5);
                    ctx.fill();
                    ctx.restore();
                }
                
                ctx.fillStyle = (i === catalogIndex) ? "#FF0" : "#FFF";
                ctx.fillText(catalogOptions[i].name, 370, yPos);
            }
            
            // Scroll arrows
            ctx.fillStyle = "#888";
            ctx.textAlign = "center";
            if (catalogScrollOffset > 0) {
                ctx.fillText("▲", 470, 35);
            }
            if (endIdx < catalogOptions.length) {
                ctx.fillText("▼", 470, 270);
            }
            
            // 3. Draw Description (Bottom Pane)
            // Asterisk Undertale style
            ctx.textAlign = "left";
            ctx.fillStyle = "#FFF";
            ctx.font = "18pt 'Determination Mono', monospace";
            ctx.fillText("*", 40, 340);
            
            // Word wrap
            var words = opt.desc.split(" ");
            var line = "";
            var dy = 340;
            for(var w = 0; w < words.length; w++) {
                var testLine = line + words[w] + " ";
                var metrics = ctx.measureText(testLine);
                if (metrics.width > 520 && w > 0) {
                    ctx.fillText(line, 70, dy);
                    line = words[w] + " ";
                    dy += 35;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, 70, dy);
        }

        ctx.restore();
    }

    return { init: init, setup: setup, update: update, draw: draw };
}());
