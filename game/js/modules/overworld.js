// overworld.js — Overworld engine for LUNDERTALE
var Overworld = (function() {
    var player;
    var active = false;
    var npcList = [];
    var triggerList = [];
    var mapData = null;

    var catalogActive = false;
    var catalogIndex = 0;
    var catalogTab = 0; // 0 = Corazones, 1 = Pociones
    var catalogScrollOffset = 0;
    var starParticles = [];
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
            if (myKeys.keydown[myKeys.KEYBOARD.KEY_LEFT] || myKeys.keydown[myKeys.KEYBOARD.KEY_A]) {
                myKeys.keydown[myKeys.KEYBOARD.KEY_LEFT] = false;
                myKeys.keydown[myKeys.KEYBOARD.KEY_A] = false;
                catalogTab = 0;
                catalogIndex = 0;
                catalogScrollOffset = 0;
                Sound.playSound("select", true);
            } else if (myKeys.keydown[myKeys.KEYBOARD.KEY_RIGHT] || myKeys.keydown[myKeys.KEYBOARD.KEY_D]) {
                myKeys.keydown[myKeys.KEYBOARD.KEY_RIGHT] = false;
                myKeys.keydown[myKeys.KEYBOARD.KEY_D] = false;
                catalogTab = 1;
                catalogIndex = 0;
                catalogScrollOffset = 0;
                Sound.playSound("select", true);
            } else if (myKeys.isUp()) {
                myKeys.keydown[myKeys.KEYBOARD.KEY_UP] = false;
                myKeys.keydown[myKeys.KEYBOARD.KEY_W] = false;
                var listLen = catalogTab === 0 ? catalogOptions.length : Inventory.getAllLength();
                catalogIndex--;
                if (catalogIndex < 0) catalogIndex = listLen - 1;
                Sound.playSound("select", true);
            } else if (myKeys.isDown()) {
                myKeys.keydown[myKeys.KEYBOARD.KEY_DOWN] = false;
                myKeys.keydown[myKeys.KEYBOARD.KEY_S] = false;
                var listLen = catalogTab === 0 ? catalogOptions.length : Inventory.getAllLength();
                catalogIndex++;
                if (catalogIndex >= listLen) catalogIndex = 0;
                Sound.playSound("select", true);
            } else if (myKeys.isConfirm()) {
                myKeys.keydown[myKeys.KEYBOARD.KEY_Z] = false;
                myKeys.keydown[myKeys.KEYBOARD.KEY_ENTER] = false;
                if (catalogTab === 0) {
                    Player.setSoulClass(catalogIndex);
                    catalogActive = false;
                    Sound.playSound("heal", true);
                } else if (catalogTab === 1) {
                    // Equip / Unequip potion
                    var success = Inventory.toggleEquip(catalogIndex);
                    if (success) Sound.playSound("heal", true);
                    else Sound.playSound("select", true);
                }
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
                var scx = npc.x + npc.w / 2;
                var scy = npc.y + npc.h / 2;
                var sTime = animTimer;
                
                // Update sparkle particles
                if (starParticles.length < 12) {
                    starParticles.push({
                        x: scx + (Math.random() - 0.5) * 50,
                        y: scy + (Math.random() - 0.5) * 50,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: -Math.random() * 0.8 - 0.2,
                        life: Math.random() * 2 + 1,
                        maxLife: Math.random() * 2 + 1,
                        size: Math.random() * 2 + 1
                    });
                }
                for (var sp = starParticles.length - 1; sp >= 0; sp--) {
                    var p = starParticles[sp];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life -= 0.016;
                    if (p.life <= 0) {
                        starParticles[sp] = {
                            x: scx + (Math.random() - 0.5) * 50,
                            y: scy + (Math.random() - 0.5) * 50,
                            vx: (Math.random() - 0.5) * 0.5,
                            vy: -Math.random() * 0.8 - 0.2,
                            life: Math.random() * 2 + 1,
                            maxLife: Math.random() * 2 + 1,
                            size: Math.random() * 2 + 1
                        };
                    }
                }
                
                // Draw sparkle particles
                for (var sp = 0; sp < starParticles.length; sp++) {
                    var p = starParticles[sp];
                    var alpha = p.life / p.maxLife;
                    ctx.save();
                    ctx.globalAlpha = alpha * 0.8;
                    ctx.shadowBlur = 6;
                    ctx.shadowColor = "#FFD700";
                    ctx.fillStyle = "#FFFACD";
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
                
                // Draw pulsing glow aura
                var pulse = 0.6 + Math.sin(sTime * 3) * 0.4;
                ctx.save();
                ctx.globalAlpha = pulse * 0.3;
                var auraGrad = ctx.createRadialGradient(scx, scy, 5, scx, scy, 40);
                auraGrad.addColorStop(0, "#FFD700");
                auraGrad.addColorStop(0.5, "rgba(255, 215, 0, 0.3)");
                auraGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
                ctx.fillStyle = auraGrad;
                ctx.beginPath();
                ctx.arc(scx, scy, 40, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                
                // Draw 5-point star
                ctx.save();
                ctx.translate(scx, scy);
                var starScale = 1 + Math.sin(sTime * 3) * 0.08;
                ctx.scale(starScale, starScale);
                ctx.rotate(Math.sin(sTime * 0.5) * 0.1);
                
                ctx.shadowBlur = 20;
                ctx.shadowColor = "#FFD700";
                ctx.fillStyle = "#FFD700";
                ctx.beginPath();
                for (var s = 0; s < 5; s++) {
                    var outerAngle = (s * 2 * Math.PI / 5) - Math.PI / 2;
                    var innerAngle = outerAngle + Math.PI / 5;
                    var outerR = 16;
                    var innerR = 7;
                    if (s === 0) {
                        ctx.moveTo(Math.cos(outerAngle) * outerR, Math.sin(outerAngle) * outerR);
                    } else {
                        ctx.lineTo(Math.cos(outerAngle) * outerR, Math.sin(outerAngle) * outerR);
                    }
                    ctx.lineTo(Math.cos(innerAngle) * innerR, Math.sin(innerAngle) * innerR);
                }
                ctx.closePath();
                ctx.fill();
                
                // Inner white highlight
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 0.5 + Math.sin(sTime * 4) * 0.3;
                ctx.fillStyle = "#FFF";
                ctx.beginPath();
                for (var s = 0; s < 5; s++) {
                    var outerAngle = (s * 2 * Math.PI / 5) - Math.PI / 2;
                    var innerAngle = outerAngle + Math.PI / 5;
                    if (s === 0) {
                        ctx.moveTo(Math.cos(outerAngle) * 9, Math.sin(outerAngle) * 9);
                    } else {
                        ctx.lineTo(Math.cos(outerAngle) * 9, Math.sin(outerAngle) * 9);
                    }
                    ctx.lineTo(Math.cos(innerAngle) * 4, Math.sin(innerAngle) * 4);
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                
                // Text label with glow
                ctx.save();
                ctx.shadowBlur = 8;
                ctx.shadowColor = "#FFD700";
                ctx.fillStyle = "#FFF";
                ctx.font = "10pt Determination Mono";
                ctx.textAlign = "center";
                ctx.fillText("SOUL CATALOG", scx, npc.y + npc.h + 18);
                ctx.restore();
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
            
            // --- TAB BAR ---
            var tabLabels = ["Corazones", "Pociones"];
            ctx.font = "16pt 'Determination Mono', monospace";
            ctx.textAlign = "center";
            for (var t = 0; t < tabLabels.length; t++) {
                var tabX = 160 + t * 320;
                if (t === catalogTab) {
                    ctx.fillStyle = "#FFD700";
                    ctx.fillText("[ " + tabLabels[t] + " ]", tabX, 18);
                    // Underline active tab
                    ctx.fillRect(tabX - 80, 22, 160, 2);
                } else {
                    ctx.fillStyle = "#666";
                    ctx.fillText(tabLabels[t], tabX, 18);
                }
            }
            ctx.fillStyle = "#555";
            ctx.font = "10pt 'Determination Mono', monospace";
            ctx.fillText("< LEFT / RIGHT >", 320, 18);
            
            // Draw Undertale style borders (white 4px)
            ctx.strokeStyle = "#FFF";
            ctx.lineWidth = 4;
            
            // Top Left Pane (Preview)
            ctx.strokeRect(20, 30, 280, 250);
            
            // Top Right Pane (List)
            ctx.strokeRect(320, 30, 300, 250);
            
            // Bottom Pane (Description)
            ctx.strokeRect(20, 300, 600, 160);
            
            var colors = ["#F00", "#0F0", "#FF0", "#A0A", "#00F", "#F80", "#0FF", "#F0F", "#408", "#FFF"];
            
            if (catalogTab === 0) {
                // =====================
                // TAB: CORAZONES
                // =====================
                var opt = catalogOptions[catalogIndex];
                
                // 1. Draw Preview (Top Left)
                ctx.fillStyle = "#FFF";
                ctx.font = "16pt 'Determination Mono', monospace";
                ctx.textAlign = "center";
                ctx.fillText(opt.name, 160, 60);
                
                // Draw Heart
                ctx.save();
                ctx.translate(160, 130);
                ctx.scale(3, 3);
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
                ctx.fillText("Equipped: " + (Player.getSoulClass() === catalogIndex ? "YES" : "NO"), 40, 215);
                ctx.fillStyle = "#888";
                ctx.fillText("[Z] Equip", 40, 240);
                ctx.fillText("[X] Exit", 40, 265);
                
                // 2. Draw List (Top Right)
                var maxVisible = 6;
                var itemHeight = 35;
                var startY = 70;
                
                if (catalogIndex < catalogScrollOffset) catalogScrollOffset = catalogIndex;
                if (catalogIndex >= catalogScrollOffset + maxVisible) catalogScrollOffset = catalogIndex - maxVisible + 1;
                
                var endIdx = Math.min(catalogOptions.length, catalogScrollOffset + maxVisible);
                
                ctx.font = "14pt 'Determination Mono', monospace";
                for (var i = catalogScrollOffset; i < endIdx; i++) {
                    var yPos = startY + (i - catalogScrollOffset) * itemHeight;
                    ctx.fillStyle = (i === catalogIndex) ? "#FF0" : "#FFF";
                    
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
                if (catalogScrollOffset > 0) ctx.fillText("\u25B2", 470, 45);
                if (endIdx < catalogOptions.length) ctx.fillText("\u25BC", 470, 275);
                
                // 3. Draw Description (Bottom Pane)
                ctx.textAlign = "left";
                ctx.fillStyle = "#FFF";
                ctx.font = "18pt 'Determination Mono', monospace";
                ctx.fillText("*", 40, 340);
                
                var words = opt.desc.split(" ");
                var line = "";
                var dy = 340;
                for (var w = 0; w < words.length; w++) {
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
            } else {
                // =====================
                // TAB: POCIONES
                // =====================
                var potionNames = Inventory.getAllNames();
                var potionCount = Inventory.getAllLength();
                var equippedCount = Inventory.getEquippedCount();
                
                // 1. Draw Preview (Top Left)
                ctx.fillStyle = "#FFF";
                ctx.font = "16pt 'Determination Mono', monospace";
                ctx.textAlign = "center";
                if (potionCount > 0 && catalogIndex < potionCount) {
                    ctx.fillText(potionNames[catalogIndex], 160, 60);
                    
                    // Draw item icon
                    var pName = potionNames[catalogIndex];
                    ctx.save();
                    ctx.translate(160, 140);
                    
                    if (pName.indexOf("Pie") !== -1) {
                        ctx.shadowBlur = 12; ctx.shadowColor = "#FF8";
                        ctx.fillStyle = "#D2691E"; // Crust
                        ctx.beginPath(); ctx.arc(0, 0, 25, Math.PI, 0); ctx.fill();
                        ctx.fillStyle = "#F4A460"; ctx.fillRect(-27, -2, 54, 8);
                        ctx.fillStyle = "#8B0000"; ctx.beginPath(); ctx.arc(0, -5, 18, Math.PI, 0); ctx.fill();
                    } else if (pName.indexOf("Noodles") !== -1) {
                        ctx.shadowBlur = 12; ctx.shadowColor = "#800080";
                        ctx.fillStyle = "#FFF"; ctx.beginPath(); ctx.arc(0, 5, 20, 0, Math.PI); ctx.fill();
                        ctx.strokeStyle = "#800080"; ctx.lineWidth = 3;
                        ctx.beginPath(); ctx.moveTo(-10, 5); ctx.lineTo(-15, -15); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(-5, -20); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(10, 5); ctx.lineTo(15, -10); ctx.stroke();
                    } else if (pName.indexOf("Fruit") !== -1) {
                        ctx.shadowBlur = 12; ctx.shadowColor = "#FF00FF";
                        ctx.fillStyle = "#FF1493"; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI*2); ctx.fill();
                        ctx.fillStyle = "#32CD32"; ctx.fillRect(-2, -24, 4, 10);
                    } else if (pName.indexOf("Matter") !== -1) {
                        ctx.shadowBlur = 15; ctx.shadowColor = "#800080";
                        ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill();
                        ctx.strokeStyle = "#800080"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI*2); ctx.stroke();
                    } else {
                        // Bottle
                        ctx.shadowBlur = 12;
                        ctx.shadowColor = "#0FF";
                        ctx.fillStyle = "rgba(0, 200, 255, 0.6)";
                        ctx.beginPath();
                        ctx.moveTo(-12, -20);
                        ctx.lineTo(-12, 20);
                        ctx.quadraticCurveTo(-12, 30, 0, 30);
                        ctx.quadraticCurveTo(12, 30, 12, 20);
                        ctx.lineTo(12, -20);
                        ctx.closePath();
                        ctx.fill();
                        ctx.fillStyle = "#AAA";
                        ctx.fillRect(-6, -30, 12, 12);
                        ctx.fillStyle = "#8B4513";
                        ctx.fillRect(-5, -36, 10, 8);
                        ctx.globalAlpha = 0.4 + Math.sin(animTimer * 4) * 0.3;
                        ctx.fillStyle = "#FFF";
                        ctx.fillRect(-8, -5, 4, 15);
                    }
                    ctx.restore();
                    
                    // Description from inventory
                    var potionText = Inventory.getAllText(catalogIndex);
                    ctx.font = "14pt 'Determination Mono', monospace";
                    ctx.textAlign = "left";
                    var isEq = Inventory.isEquipped(catalogIndex);
                    ctx.fillStyle = isEq ? "#0F0" : "#888";
                    ctx.fillText(isEq ? "Equipado (" + equippedCount + "/3)" : "Presiona Z para equipar (" + equippedCount + "/3)", 40, 240);
                    ctx.fillStyle = "#888";
                    ctx.fillText("[X] Exit", 40, 265);
                    
                    // Bottom pane: use text
                    ctx.textAlign = "left";
                    ctx.fillStyle = "#FFF";
                    ctx.font = "16pt 'Determination Mono', monospace";
                    
                    var textLines = potionText.split("\n");
                    var dy = 335;
                    for (var tl = 0; tl < textLines.length; tl++) {
                        ctx.fillText(textLines[tl], 40, dy);
                        dy += 30;
                    }
                } else {
                    ctx.fillStyle = "#888";
                    ctx.fillText("No items", 160, 150);
                }
                
                // 2. Draw List (Top Right)
                var maxVisible = 6;
                var itemHeight = 35;
                var startY = 70;
                
                if (catalogIndex < catalogScrollOffset) catalogScrollOffset = catalogIndex;
                if (catalogIndex >= catalogScrollOffset + maxVisible) catalogScrollOffset = catalogIndex - maxVisible + 1;
                
                var endIdx = Math.min(potionCount, catalogScrollOffset + maxVisible);
                
                ctx.font = "14pt 'Determination Mono', monospace";
                for (var i = catalogScrollOffset; i < endIdx; i++) {
                    var yPos = startY + (i - catalogScrollOffset) * itemHeight;
                    
                    // Draw potion cursor (small diamond)
                    if (i === catalogIndex) {
                        ctx.fillStyle = "#0FF";
                        ctx.save();
                        ctx.translate(340, yPos - 4);
                        ctx.rotate(Math.PI / 4);
                        ctx.fillRect(-4, -4, 8, 8);
                        ctx.restore();
                    }
                    
                    ctx.fillStyle = (i === catalogIndex) ? "#0FF" : "#FFF";
                    if (Inventory.isEquipped(i)) {
                        ctx.fillStyle = (i === catalogIndex) ? "#AFA" : "#0F0";
                    }
                    ctx.textAlign = "left";
                    var prefix = Inventory.isEquipped(i) ? "[E] " : "    ";
                    ctx.fillText(prefix + potionNames[i], 360, yPos);
                }
                
                // Scroll arrows
                ctx.fillStyle = "#888";
                ctx.textAlign = "center";
                if (catalogScrollOffset > 0) ctx.fillText("\u25B2", 470, 45);
                if (endIdx < potionCount) ctx.fillText("\u25BC", 470, 275);
            }
        }

        ctx.restore();
    }

    return { init: init, setup: setup, update: update, draw: draw };
}());
