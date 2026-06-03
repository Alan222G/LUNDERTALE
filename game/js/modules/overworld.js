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
        { name: "Corazón Cafeína", desc: "Cafeína. HP:110, VEL +80%, pero sufres veneno de 1 HP/seg." },
        { name: "Corazón Magnético", desc: "Magnético. HP:90, Atrae balas, pero rozar balas cura 3 HP." },
        { name: "Corazón Cristalino", desc: "Cristalino. HP:100, Refleja 30% del daño recibido al jefe." },
        { name: "Corazón de Vampiro", desc: "Vampiro. HP:90, Lifesteal (cura 10% del daño infligido al jefe)." },
        { name: "Corazón Caótico", desc: "Caótico. HP:100, Cada turno cambia de alma y stats. Arcoíris." },
        { name: "Divergent zilla", desc: "Adaptación. HP:120. Se adapta ganando +30% DEF por golpe (máx +150%, recibe 1 HP mín). Se reinicia al cambiar fase del boss." },
        { name: "Eva 01", desc: "Berserk. HP:110. Si tu HP baja del 30%: +110% ATK, +55% VEL, regenera 4.4 HP/seg. +20% stats vs Ángeles." },
        { name: "Gojo", desc: "Infinito. HP:90, VEL:+20%. Satoru Gojo. Barrera de Infinito bloquea 1 golpe cada 4 turnos. RCT: cura progresivamente bajo 20% HP cada 8 turnos." },
        { name: "Subaru", desc: "Retorno por Muerte. HP:70. Si mueres, revives con 50% HP y 2 seg de invulnerabilidad (hasta 3 veces por combate)." },
        { name: "All Might", desc: "One For All. HP:150, ATK:+60%, DEF:+40%. Símbolo de la Paz. Tu HP Máximo decae -3/turno (mín 60)." },
        { name: "Itadori", desc: "Jujutsu. HP:100, VEL:+10%, ATK:+30%. Black Flash (20% crit 2.5x), Sangre Perforante (sangrado al enemigo), RCT cada 8 turnos." },
        { name: "Goku", desc: "Saiyan. HP:20. Cada turno te transformas: Base→SSJ→SSJ2→SSJ3→SSG→SSB→UI Sign→MUI. Cada forma mejora stats. MUI obtiene 10 esquives automáticos." },
        { name: "Sans", desc: "Mal Tiempo. HP:50. 10 esquives automáticos por turno (sin inmunidad). Cada golpe aplica veneno de 10seg (20 dmg/seg) al enemigo." }
    ];

    var bgImage = new Image();
    bgImage.src = "Resources/Fondo del overworld Best.png";
    
    var animTimer = 0;
    var singFrames = [];
    var seraFrames = [];
    var activeBossTriggerIndex = -1; // Track which boss trigger is in combat    
    function loadImg(src) { var i = new Image(); i.src = src; return i; }

    function init() {
        player = new OverworldPlayer();

        // Create Catalog Interactable (floating star/heart area)
        npcList.push({
            x: 370, y: 80, w: 40, h: 40, color: "rgba(255, 255, 0, 0.8)",
            isCatalog: true
        });

        // Singularity battle trigger (Anomalies Group)
        triggerList.push({
            x: 127, y: 157, w: 26, h: 26,
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
            x: 127, y: 417, w: 26, h: 26,
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
            x: 627, y: 157, w: 26, h: 26,
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
            x: 237, y: 297, w: 26, h: 26,
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
            x: 627, y: 417, w: 26, h: 26,
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

        // Godzilla battle trigger (Guest Group)
        triggerList.push({
            x: 377, y: 477, w: 26, h: 26,
            triggered: false,
            bossId: "godzilla",
            label: "GODZILLA",
            color: "rgba(0, 150, 255, 0.5)",
            action: function() {
                var self = this;
                Transition.start(function() {
                    main.gameState = main.GAME_STATE.COMBAT;
                    Combat.init(self.bossId);
                    Combat.setup(main.ctx);
                });
            }
        });

        // Darth Vader battle trigger (Guest Group)
        triggerList.push({
            x: 517, y: 297, w: 26, h: 26,
            triggered: false,
            bossId: "vader",
            label: "DARTH VADER",
            color: "rgba(220, 0, 0, 0.6)",
            action: function() {
                var self = this;
                Transition.start(function() {
                    main.gameState = main.GAME_STATE.COMBAT;
                    Combat.init(self.bossId);
                    Combat.setup(main.ctx);
                });
            }
        });

        // Glitch battle trigger (Anomalies Group)
        triggerList.push({
            x: 377, y: 207, w: 26, h: 26,
            triggered: false,
            bossId: "glitch",
            label: "ERROR 404",
            color: "rgba(255, 0, 255, 0.6)",
            action: function() {
                var self = this;
                Transition.start(function() {
                    main.gameState = main.GAME_STATE.COMBAT;
                    Combat.init(self.bossId);
                    Combat.setup(main.ctx);
                });
            }
        });
        
        // Mirror Colossus battle trigger (Anomalies Group)
        triggerList.push({
            x: 520, y: 207, w: 26, h: 26,
            triggered: false,
            bossId: "prism",
            label: "COLOSO DE ESPEJOS",
            color: "rgba(0, 240, 255, 0.6)",
            action: function() {
                var self = this;
                Transition.start(function() {
                    main.gameState = main.GAME_STATE.COMBAT;
                    Combat.init(self.bossId);
                    Combat.setup(main.ctx);
                });
            }
        });
        
        // El Hambre Cósmica battle trigger (Anomalies Group)
        triggerList.push({
            x: 640, y: 207, w: 26, h: 26,
            triggered: false,
            bossId: "void_maw",
            label: "EL HAMBRE CÓSMICA",
            color: "rgba(148, 0, 211, 0.6)",
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
        // Check if all bosses are defeated (Super Victory check)
        var allDefeated = true;
        for (var i = 0; i < triggerList.length; i++) {
            if (!triggerList[i].triggered) {
                allDefeated = false;
                break;
            }
        }
        if (allDefeated && triggerList.length > 0) {
            main.gameState = main.GAME_STATE.SUPER_WIN;
            Sound.pauseSoundHard("bgm_overworld");
            Sound.playSound("heal", true);
            active = false;
            return;
        }

        active = true;
        Sound.pauseSoundHard("bgm");
        Sound.pauseSoundHard("bgm_seraphina");
        Sound.pauseSoundHard("bgm_singularity");
        Sound.pauseSoundHard("bgm_evangelion");
        Sound.pauseSoundHard("bgm_paradox");
        Sound.pauseSoundHard("bgm_godzilla");
        Sound.pauseSoundHard("bgm_prism");
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
            var overlapping = rectsOverlap(pbox.x, pbox.y, pbox.w, pbox.h, t.x, t.y, t.w, t.h);
            
            // Reset needsExit once player walks away from the trigger zone
            if (t.needsExit && !overlapping) {
                t.needsExit = false;
            }
            
            if (!t.triggered && !t.needsExit && overlapping) {
                t.triggered = true; // Lock trigger during combat
                activeBossTriggerIndex = i;
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
                } else if (t.bossId === "ramiel" || t.bossId === "paradox" || t.bossId === "sachiel" || t.bossId === "vader" || t.bossId === "godzilla" || t.bossId === "glitch") {
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
                    var rSize = 16; // Scaled down
                    
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
                    var pSize = 16; // Scaled down
                    
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
                    var sSize = 16; // Scaled down
                    
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
                } else if (t.bossId === "godzilla") {
                    // Epic Godzilla representation in Overworld (Side-profile facing Left/Center)
                    var gTime = animTimer;
                    var gSize = 16; // Scaled down
                    
                    ctx.save();
                    // Shift center slightly to align with overworld grid
                    ctx.translate(gcx, gcy + Math.sin(gTime * 3.5) * 2.5);
                    
                    // SCALE -1 on X so the right-facing path is flipped to face LEFT (towards the center/player spawn)
                    ctx.scale(-1, 1);
                    
                    // Radiation blue aura glow
                    ctx.shadowBlur = 18;
                    ctx.shadowColor = "rgba(0, 160, 255, 0.85)";
                    
                    // Draw tail swaying in the background (rendered on the right side under scale(-1, 1))
                    ctx.strokeStyle = "#121A1A";
                    ctx.lineWidth = 6;
                    ctx.lineCap = "round";
                    ctx.beginPath();
                    ctx.moveTo(-gSize * 0.5, gSize * 0.6);
                    ctx.quadraticCurveTo(-gSize * 1.2 - Math.sin(gTime * 4.0) * 8, gSize * 0.2 + Math.cos(gTime * 3.5) * 5, -gSize * 1.5, gSize * 0.5 + Math.sin(gTime * 4.0) * 9);
                    ctx.stroke();
                    
                    // Body/Head outline (dark charcoal)
                    ctx.fillStyle = "#162020";
                    ctx.beginPath();
                    ctx.moveTo(-gSize * 0.8, gSize * 0.8);
                    ctx.quadraticCurveTo(-gSize * 0.6, -gSize * 0.4, -gSize * 0.2, -gSize * 0.6); // Head/Neck back
                    ctx.lineTo(gSize * 0.5, -gSize * 0.4); // snout top
                    ctx.lineTo(gSize * 0.6, -gSize * 0.1); // nose
                    ctx.lineTo(gSize * 0.2, -gSize * 0.0); // mouth top
                    ctx.lineTo(gSize * 0.5, gSize * 0.1); // jaw bottom
                    ctx.quadraticCurveTo(gSize * 0.6, gSize * 0.6, gSize * 0.8, gSize * 0.8); // Chest
                    ctx.closePath();
                    ctx.fill();
                    
                    // Glowing blue atomic dorsal spines on back
                    ctx.fillStyle = "rgba(0, 190, 255, 0.95)";
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = "#00B2FF";
                    for (var s = 0; s < 4; s++) {
                        var sx = -gSize * 0.65 + s * 7.5;
                        var sy = -gSize * 0.25 + s * 5.5;
                        ctx.beginPath();
                        ctx.moveTo(sx - 2, sy);
                        ctx.lineTo(sx - 7, sy - 8 - Math.sin(gTime * 4.5 + s) * 2);
                        ctx.lineTo(sx + 1, sy + 3);
                        ctx.closePath();
                        ctx.fill();
                    }
                    
                    // Glowing eye
                    ctx.fillStyle = "#00FFFF";
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = "#00FFFF";
                    ctx.beginPath();
                    ctx.arc(gSize * 0.15, -gSize * 0.38, 1.8, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.restore();
                    ctx.shadowBlur = 0;
                } else if (t.bossId === "vader") {
                    // Epic Mini Darth Vader representation
                    var vTime = animTimer;
                    var vSize = 16;
                    ctx.save();
                    ctx.translate(gcx, gcy - 5 + Math.sin(vTime * 3) * 2); // Floating/breathing
                    
                    // Draw cape (flowing behind)
                    ctx.fillStyle = "#0A0A0A";
                    ctx.beginPath();
                    ctx.moveTo(-vSize * 0.6, vSize * 0.8);
                    ctx.lineTo(-vSize * 0.8, vSize * 0.2);
                    ctx.quadraticCurveTo(-vSize * 0.4, -vSize * 0.2, 0, -vSize * 0.3);
                    ctx.quadraticCurveTo(vSize * 0.4, -vSize * 0.2, vSize * 0.8, vSize * 0.2);
                    ctx.lineTo(vSize * 0.6, vSize * 0.8);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Helmet Dome (Top curved part)
                    ctx.fillStyle = "#151515";
                    ctx.beginPath();
                    ctx.arc(0, -vSize * 0.1, vSize * 0.45, Math.PI, 0, false);
                    ctx.fill();
                    
                    // Helmet Flare (sides of mask)
                    ctx.beginPath();
                    ctx.moveTo(-vSize * 0.45, -vSize * 0.1);
                    ctx.lineTo(-vSize * 0.6, vSize * 0.3);
                    ctx.lineTo(-vSize * 0.2, vSize * 0.25);
                    ctx.lineTo(0, vSize * 0.1);
                    ctx.lineTo(vSize * 0.2, vSize * 0.25);
                    ctx.lineTo(vSize * 0.6, vSize * 0.3);
                    ctx.lineTo(vSize * 0.45, -vSize * 0.1);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Mask Face (eyes and grille)
                    ctx.fillStyle = "#090909";
                    ctx.beginPath();
                    ctx.moveTo(-vSize * 0.25, vSize * 0.05);
                    ctx.lineTo(vSize * 0.25, vSize * 0.05);
                    ctx.lineTo(vSize * 0.15, vSize * 0.35);
                    ctx.lineTo(-vSize * 0.15, vSize * 0.35);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Eyes (red glowing dots)
                    ctx.fillStyle = "rgba(255, 0, 0, 0.85)";
                    ctx.shadowBlur = 6;
                    ctx.shadowColor = "#FF0000";
                    ctx.beginPath();
                    ctx.arc(-vSize * 0.12, vTime * 0 + vSize * 0.1, 2, 0, Math.PI * 2);
                    ctx.arc(vSize * 0.12, vTime * 0 + vSize * 0.1, 2, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Grille detail
                    ctx.strokeStyle = "#555";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(0, vSize * 0.2);
                    ctx.lineTo(0, vSize * 0.35);
                    ctx.moveTo(-3, vSize * 0.25);
                    ctx.lineTo(3, vSize * 0.25);
                    ctx.stroke();
                    
                    // Chest control plate
                    ctx.fillStyle = "#222";
                    ctx.fillRect(-vSize * 0.25, vSize * 0.45, vSize * 0.5, vSize * 0.35);
                    
                    ctx.shadowBlur = 4;
                    ctx.fillStyle = "#FF0000"; ctx.shadowColor = "#FF0000";
                    ctx.fillRect(-vSize * 0.15, vSize * 0.52, 3, 3);
                    ctx.fillStyle = "#0000FF"; ctx.shadowColor = "#0000FF";
                    ctx.fillRect(vSize * 0.05, vSize * 0.52, 3, 3);
                    
                    // Glowing Red Lightsaber
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = "#FF0000";
                    ctx.strokeStyle = "#FFFFFF"; // White core
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(-vSize * 0.4, vSize * 0.5);
                    ctx.lineTo(-vSize * 0.8, -vSize * 0.1);
                    ctx.stroke();
                    
                    ctx.restore();
                   } else if (t.bossId === "glitch") {
                    // Epic Glitch (Error 404) representation
                    var tTime = animTimer;
                    var tSize = 13;
                    ctx.save();
                    ctx.translate(gcx, gcy + Math.sin(tTime * 5.0) * 3.0); // Floating nervously
                    
                    // 1. Draw a flickering checkered magenta and black cube (Missing Texture)
                    var pulse = Math.sin(tTime * 12.0) * 0.15 + 0.85;
                    ctx.fillStyle = "rgba(255, 0, 255, " + pulse.toFixed(2) + ")";
                    ctx.shadowBlur = 12;
                    ctx.shadowColor = "#FF00FF";
                    
                    for (var dx = -tSize; dx < tSize; dx += 6) {
                        for (var dy = -tSize; dy < tSize; dy += 6) {
                            ctx.fillStyle = ((dx + dy) % 12 === 0) ? "#FF00FF" : "#000000";
                            var jitterX = (Math.random() - 0.5) * 1.5;
                            var jitterY = (Math.random() - 0.5) * 1.5;
                            ctx.fillRect(dx + jitterX, dy + jitterY, 6, 6);
                        }
                    }
                    
                    // 2. Draw flashing green cybernetic code outline or lines floating around it
                    ctx.strokeStyle = "#00FF66";
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(-tSize - 2, -tSize - 2, tSize * 2 + 4, tSize * 2 + 4);
                    
                    // 3. Chromatic aberration splits (extra ghost lines)
                    if (Math.random() < 0.35) {
                        ctx.strokeStyle = "rgba(0, 255, 255, 0.7)";
                        ctx.strokeRect(-tSize - 4, -tSize - 3, tSize * 2 + 8, tSize * 2 + 6);
                        ctx.strokeStyle = "rgba(255, 0, 255, 0.7)";
                        ctx.strokeRect(-tSize + 2, -tSize + 3, tSize * 2 - 4, tSize * 2 - 6);
                    }
                    
                    ctx.restore();
                    ctx.shadowBlur = 0;
                } else if (t.bossId === "prism") {
                    // Crystalline Coloso de Espejos representation
                    var pTime = animTimer;
                    var pSize = 16;
                    ctx.save();
                    ctx.translate(gcx, gcy - 5 + Math.sin(pTime * 2.5) * 3); // floating gently
                    
                    // Rotate over time
                    var rot = pTime * 0.8;
                    
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = "#00FFFF";
                    ctx.strokeStyle = "#FFFFFF";
                    ctx.lineWidth = 1.0;
                    
                    // Draw outer crystal structure (overlapping glowing triangles)
                    for (var f = 0; f < 3; f++) {
                        var fAngle = rot + (f * Math.PI * 2 / 3);
                        ctx.fillStyle = "rgba(0, 220, 255, 0.4)";
                        ctx.beginPath();
                        ctx.moveTo(0, -pSize);
                        ctx.lineTo(Math.cos(fAngle) * pSize, Math.sin(fAngle) * (pSize * 0.5));
                        ctx.lineTo(Math.cos(fAngle + Math.PI*2/3) * pSize, Math.sin(fAngle + Math.PI*2/3) * (pSize * 0.5));
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();
                    }
                    
                    // Core diamond
                    ctx.fillStyle = "#FFFFFF";
                    ctx.beginPath();
                    ctx.moveTo(0, -pSize * 0.4);
                    ctx.lineTo(pSize * 0.3, 0);
                    ctx.lineTo(0, pSize * 0.4);
                    ctx.lineTo(-pSize * 0.3, 0);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.restore();
                    ctx.shadowBlur = 0;
                } else if (t.bossId === "void_maw") {
                    // Pulsing purple void portal for El Hambre Cósmica
                    var vTime = animTimer;
                    var vSize = 18 + Math.sin(vTime * 3.5) * 3;
                    ctx.save();
                    ctx.translate(gcx, gcy);
                    
                    // Rotate opposite to pulse
                    ctx.rotate(-vTime * 1.5);
                    
                    // Radial gradient glow
                    var pGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, vSize);
                    pGrad.addColorStop(0, "#000000");
                    pGrad.addColorStop(0.4, "#4B0082"); // Indigo
                    pGrad.addColorStop(0.8, "#9400D3"); // Violet
                    pGrad.addColorStop(1, "rgba(0,0,0,0)");
                    
                    ctx.fillStyle = pGrad;
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = "#FF00FF";
                    ctx.beginPath();
                    ctx.arc(0, 0, vSize, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Draw mini orbiting matter/debris
                    ctx.fillStyle = "#FFFFFF";
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = "#FFFFFF";
                    for (var d = 0; d < 4; d++) {
                        var dAngle = vTime * 2.5 + (d * Math.PI / 2);
                        var dx = Math.cos(dAngle) * (vSize * 0.7);
                        var dy = Math.sin(dAngle) * (vSize * 0.7);
                        ctx.fillRect(dx - 1.5, dy - 1.5, 3, 3);
                    }
                    
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
            
            var colors = ["#F00", "#0F0", "#FF0", "#A0A", "#00F", "#F80", "#0FF",
                          "#8B4513", "#C0C0C0", "#87CEEB", "#DC143C", "hsl(" + (Date.now() / 5 % 360) + ", 100%, 50%)",
                          "#4B0082", "#9400D3", "#00E5FF", "#FF5722", "#E91E63", "#FFD700", "#FFEB3B", "#FF1744", "#FF9100", "#00BFA5", "#00E676", "#2E7D32", "#80DEEA", "#0077FF", "#FF3D00"];
            
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
                    
                    if (pName === "Pie Cósmico") {
                        // Cosmic Pie - Glowing gold-crust pie slice
                        ctx.shadowBlur = 15; ctx.shadowColor = "#FFD700";
                        ctx.fillStyle = "#D2691E"; // Crust
                        ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(-25, -15); ctx.lineTo(25, -15); ctx.closePath(); ctx.fill();
                        ctx.fillStyle = "#FFA500"; // Inside filling
                        ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(-20, -10); ctx.lineTo(20, -10); ctx.closePath(); ctx.fill();
                        ctx.fillStyle = "#FFF"; // Floating sparkles/stars
                        for (var s = 0; s < 3; s++) {
                            var sx = Math.sin(animTimer * 5 + s) * 15;
                            var sy = -25 - s * 8;
                            ctx.fillRect(sx, sy, 3, 3);
                        }
                    } else if (pName === "Fideos del Vacío") {
                        // Void Noodles - A nice dark bowl with glowing noodles and chopsticks
                        ctx.shadowBlur = 15; ctx.shadowColor = "#8A2BE2";
                        // Bowl
                        ctx.fillStyle = "#4B0082";
                        ctx.beginPath(); ctx.arc(0, 5, 22, 0, Math.PI); ctx.fill();
                        ctx.fillStyle = "#000";
                        ctx.fillRect(-22, 3, 44, 4);
                        // Noodles sticking out
                        ctx.strokeStyle = "#DA70D6"; ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.moveTo(-12, 5); ctx.bezierCurveTo(-15, -10, -5, -20, -15, -22);
                        ctx.moveTo(0, 5); ctx.bezierCurveTo(5, -12, -5, -18, 5, -25);
                        ctx.moveTo(12, 5); ctx.bezierCurveTo(10, -8, 15, -15, 10, -20);
                        ctx.stroke();
                        // Chopsticks
                        ctx.strokeStyle = "#D2691E"; ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(15, -5); ctx.lineTo(-25, -25);
                        ctx.moveTo(20, 0); ctx.lineTo(-20, -30);
                        ctx.stroke();
                    } else if (pName === "Fruta de Nebulosa") {
                        // Nebula Fruit - Shifting pink/purple berry
                        ctx.shadowBlur = 15; ctx.shadowColor = "#FF00FF";
                        var rGrad = ctx.createRadialGradient(-5, -5, 2, 0, 0, 20);
                        rGrad.addColorStop(0, "#FF69B4");
                        rGrad.addColorStop(1, "#8A008A");
                        ctx.fillStyle = rGrad;
                        ctx.beginPath(); ctx.arc(0, 5, 20, 0, Math.PI*2); ctx.fill();
                        // Shading ring
                        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)"; ctx.lineWidth = 1.5;
                        ctx.beginPath(); ctx.arc(-6, -2, 10, 0, Math.PI*2); ctx.stroke();
                        // Leaf
                        ctx.fillStyle = "#32CD32";
                        ctx.beginPath(); ctx.ellipse(5, -18, 6, 12, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
                    } else if (pName === "Materia Oscura") {
                        // Dark Matter - Pitch black sphere with outer nebula halo and cosmic rings
                        ctx.shadowBlur = 20; ctx.shadowColor = "#800080";
                        // Orbiting ring back
                        ctx.strokeStyle = "#DA70D6"; ctx.lineWidth = 3;
                        ctx.save();
                        ctx.scale(1, 0.35);
                        ctx.beginPath(); ctx.arc(0, 0, 28, Math.PI, 0); ctx.stroke();
                        ctx.restore();
                        // Sphere
                        var sGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, 20);
                        sGrad.addColorStop(0, "#222");
                        sGrad.addColorStop(0.7, "#050505");
                        sGrad.addColorStop(1, "#000");
                        ctx.fillStyle = sGrad;
                        ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill();
                        // Orbiting ring front
                        ctx.save();
                        ctx.scale(1, 0.35);
                        ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI); ctx.stroke();
                        ctx.restore();
                    } else if (pName === "Huevo de Fénix") {
                        // Phoenix Egg - An oval glowing egg with fire accents
                        ctx.shadowBlur = 18; ctx.shadowColor = "#FF4500";
                        // Draw Egg
                        var eggGrad = ctx.createRadialGradient(-6, -10, 3, 0, 0, 22);
                        eggGrad.addColorStop(0, "#FFFFE0");
                        eggGrad.addColorStop(0.4, "#FFA500");
                        eggGrad.addColorStop(1, "#FF0000");
                        ctx.fillStyle = eggGrad;
                        ctx.save();
                        ctx.scale(1, 1.35);
                        ctx.beginPath(); ctx.arc(0, -2, 16, 0, Math.PI * 2); ctx.fill();
                        ctx.restore();
                        // Flame ripples around
                        ctx.strokeStyle = "#FF8C00"; ctx.lineWidth = 2.5;
                        ctx.beginPath();
                        ctx.moveTo(-12, 10); ctx.quadraticCurveTo(-18, -10, -5, -25);
                        ctx.moveTo(12, 10); ctx.quadraticCurveTo(18, -10, 5, -25);
                        ctx.stroke();
                    } else if (pName === "Reloj Detenido") {
                        // Stopped Clock - Pocket watch with cracked glass and cyan hands
                        ctx.shadowBlur = 15; ctx.shadowColor = "#00FFFF";
                        // Outer rim
                        ctx.fillStyle = "#C0C0C0";
                        ctx.beginPath(); ctx.arc(0, 4, 22, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = "#FFD700"; // Inner gold ring
                        ctx.beginPath(); ctx.arc(0, 4, 19, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = "#FFF"; // Face
                        ctx.beginPath(); ctx.arc(0, 4, 16, 0, Math.PI * 2); ctx.fill();
                        // Clock loop on top
                        ctx.strokeStyle = "#C0C0C0"; ctx.lineWidth = 3;
                        ctx.beginPath(); ctx.arc(0, -20, 5, 0, Math.PI * 2); ctx.stroke();
                        // Hands
                        ctx.strokeStyle = "#000"; ctx.lineWidth = 1.5;
                        ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, -6); // Hour hand
                        ctx.moveTo(0, 4); ctx.lineTo(8, 4); // Minute hand
                        ctx.stroke();
                        // Crack lines
                        ctx.strokeStyle = "rgba(0, 180, 255, 0.7)"; ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(-8, -4); ctx.lineTo(-2, 0); ctx.lineTo(6, -8);
                        ctx.stroke();
                    } else if (pName === "Agujero Negro") {
                        // Black Hole - Deep swirling vortex
                        ctx.shadowBlur = 22; ctx.shadowColor = "#BA55D3";
                        var bhTime = animTimer * 4;
                        // Swirling energy lines
                        ctx.strokeStyle = "rgba(186, 85, 211, 0.6)"; ctx.lineWidth = 1.5;
                        for (var angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                            ctx.beginPath();
                            for (var r = 8; r < 28; r++) {
                                var a = angle + r * 0.15 - bhTime;
                                var px = Math.cos(a) * r;
                                var py = Math.sin(a) * r;
                                if (r === 8) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                            }
                            ctx.stroke();
                        }
                        // Core singularity
                        ctx.fillStyle = "#000";
                        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
                    } else if (pName === "Ancla Gravitatoria") {
                        // Gravity Anchor - Dark blue metallic anchor
                        ctx.shadowBlur = 12; ctx.shadowColor = "#4682B4";
                        ctx.strokeStyle = "#708090"; ctx.lineWidth = 4;
                        // Vertical shaft
                        ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, 12); ctx.stroke();
                        // Crossbar
                        ctx.beginPath(); ctx.moveTo(-12, -10); ctx.lineTo(12, -10); ctx.stroke();
                        // Top ring
                        ctx.beginPath(); ctx.arc(0, -20, 5, 0, Math.PI * 2); ctx.stroke();
                        // Curved bottom
                        ctx.beginPath(); ctx.arc(0, 2, 16, 0, Math.PI); ctx.stroke();
                        // Left/Right hooks
                        ctx.fillStyle = "#708090";
                        ctx.beginPath(); ctx.moveTo(-16, 2); ctx.lineTo(-20, -4); ctx.lineTo(-12, 2); ctx.closePath(); ctx.fill();
                        ctx.beginPath(); ctx.moveTo(16, 2); ctx.lineTo(20, -4); ctx.lineTo(12, 2); ctx.closePath(); ctx.fill();
                    } else if (pName === "Estrella Fugaz" || pName === "Poción Estelar") {
                        // Star shape
                        ctx.shadowBlur = 18; ctx.shadowColor = "#FFFF00";
                        ctx.fillStyle = "#FFD700";
                        ctx.beginPath();
                        for (var starIdx = 0; starIdx < 5; starIdx++) {
                            var angle = (starIdx * 2 * Math.PI) / 5 - Math.PI / 2;
                            ctx.lineTo(Math.cos(angle) * 22, Math.sin(angle) * 22);
                            angle += Math.PI / 5;
                            ctx.lineTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
                        }
                        ctx.closePath();
                        ctx.fill();
                        // Trail for Shooting Star
                        if (pName === "Estrella Fugaz") {
                            ctx.strokeStyle = "rgba(255, 215, 0, 0.4)"; ctx.lineWidth = 3;
                            ctx.beginPath();
                            ctx.moveTo(-15, 15); ctx.lineTo(-35, 35);
                            ctx.moveTo(-5, 20); ctx.lineTo(-20, 35);
                            ctx.stroke();
                        }
                    } else if (pName === "Espejo del Vacío") {
                        // Void Mirror - Oval frame with swirling reflections
                        ctx.shadowBlur = 15; ctx.shadowColor = "#9370DB";
                        // Frame
                        ctx.fillStyle = "#DAA520"; // Golden bronze frame
                        ctx.save();
                        ctx.scale(1, 1.4);
                        ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
                        // Reflective glass
                        var mirrorGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 14);
                        mirrorGrad.addColorStop(0, "#EE82EE");
                        mirrorGrad.addColorStop(1, "#4B0082");
                        ctx.fillStyle = mirrorGrad;
                        ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
                        ctx.restore();
                        // Handle
                        ctx.fillStyle = "#DAA520";
                        ctx.fillRect(-3, 22, 6, 12);
                    } else if (pName === "Daga de Sacrificio") {
                        // Sacrifice Dagger - Crimson dagger with black obsidian handle
                        ctx.shadowBlur = 15; ctx.shadowColor = "#FF0000";
                        ctx.save();
                        ctx.rotate(-Math.PI / 4);
                        // Blade
                        ctx.fillStyle = "#DC143C"; // Crimson
                        ctx.beginPath();
                        ctx.moveTo(-5, -25);
                        ctx.lineTo(0, -38);
                        ctx.lineTo(5, -25);
                        ctx.lineTo(3, 5);
                        ctx.lineTo(-3, 5);
                        ctx.closePath(); ctx.fill();
                        // Blood groove
                        ctx.fillStyle = "#8B0000";
                        ctx.fillRect(-1, -25, 2, 22);
                        // Guard
                        ctx.fillStyle = "#222";
                        ctx.fillRect(-10, 5, 20, 4);
                        // Hilt/Grip
                        ctx.fillStyle = "#111";
                        ctx.fillRect(-3, 9, 6, 15);
                        // Pommel
                        ctx.fillStyle = "#DC143C";
                        ctx.beginPath(); ctx.arc(0, 24, 3, 0, Math.PI*2); ctx.fill();
                        ctx.restore();
                    } else if (pName === "Capa del Espectro") {
                        // Ghost Cloak - Translucent purple cowl
                        ctx.shadowBlur = 15; ctx.shadowColor = "#DA70D6";
                        ctx.fillStyle = "rgba(147, 112, 219, 0.75)";
                        ctx.beginPath();
                        // Hood outline
                        ctx.moveTo(-18, 15);
                        ctx.quadraticCurveTo(-18, -15, 0, -22);
                        ctx.quadraticCurveTo(18, -15, 18, 15);
                        ctx.lineTo(10, 12);
                        ctx.lineTo(0, 22);
                        ctx.lineTo(-10, 12);
                        ctx.closePath(); ctx.fill();
                        // Dark void inside hood
                        ctx.fillStyle = "#111";
                        ctx.beginPath(); ctx.ellipse(0, -2, 7, 10, 0, 0, Math.PI * 2); ctx.fill();
                    } else if (pName === "Imán Radiactivo") {
                        // Radioactive Magnet - Red/grey horseshoe magnet with green sparks
                        ctx.shadowBlur = 16; ctx.shadowColor = "#32CD32";
                        ctx.save();
                        ctx.rotate(Math.PI); // facing up
                        // Horseshoe body
                        ctx.strokeStyle = "#FF0000"; ctx.lineWidth = 8;
                        ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI, true); ctx.stroke();
                        // Prongs extension
                        ctx.strokeStyle = "#FF0000";
                        ctx.beginPath();
                        ctx.moveTo(-16, 0); ctx.lineTo(-16, -10);
                        ctx.moveTo(16, 0); ctx.lineTo(16, -10);
                        ctx.stroke();
                        // Metal tips
                        ctx.strokeStyle = "#C0C0C0";
                        ctx.beginPath();
                        ctx.moveTo(-16, -10); ctx.lineTo(-16, -15);
                        ctx.moveTo(16, -10); ctx.lineTo(16, -15);
                        ctx.stroke();
                        ctx.restore();
                        // Green magnetic waves/sparks
                        ctx.strokeStyle = "#32CD32"; ctx.lineWidth = 1.5;
                        var sparkY = -18 + Math.sin(animTimer * 10) * 3;
                        ctx.beginPath();
                        ctx.moveTo(-22, sparkY); ctx.quadraticCurveTo(0, sparkY - 10, 22, sparkY);
                        ctx.moveTo(-22, sparkY + 6); ctx.quadraticCurveTo(0, sparkY - 4, 22, sparkY + 6);
                        ctx.stroke();
                    } else if (pName === "Té de Resonancia") {
                        // Resonance Tea - Cute steaming cup of tea
                        ctx.shadowBlur = 12; ctx.shadowColor = "#FFF8DC";
                        // Plate
                        ctx.fillStyle = "#C0C0C0";
                        ctx.fillRect(-22, 18, 44, 4);
                        // Cup
                        ctx.fillStyle = "#F5F5F5";
                        ctx.beginPath();
                        ctx.moveTo(-16, -5);
                        ctx.lineTo(-12, 16);
                        ctx.quadraticCurveTo(0, 19, 12, 16);
                        ctx.lineTo(16, -5);
                        ctx.closePath(); ctx.fill();
                        // Handle
                        ctx.strokeStyle = "#F5F5F5"; ctx.lineWidth = 3.5;
                        ctx.beginPath(); ctx.arc(14, 5, 6, -Math.PI/2, Math.PI/2); ctx.stroke();
                        // Steam waves
                        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)"; ctx.lineWidth = 2;
                        for (var st = -6; st <= 6; st += 6) {
                            var steamOffset = Math.sin(animTimer * 4 + st) * 3;
                            ctx.beginPath();
                            ctx.moveTo(st, -10);
                            ctx.quadraticCurveTo(st + steamOffset, -18, st, -25);
                            ctx.stroke();
                        }
                    } else if (pName === "Ojo del Ángel") {
                        // Angel Eye - Mystic winged eye
                        ctx.shadowBlur = 18; ctx.shadowColor = "#FFD700";
                        // Wings
                        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                        ctx.beginPath();
                        ctx.moveTo(-15, 0); ctx.quadraticCurveTo(-32, -18, -12, -22); ctx.quadraticCurveTo(-18, -10, -5, 0); ctx.fill();
                        ctx.beginPath();
                        ctx.moveTo(15, 0); ctx.quadraticCurveTo(32, -18, 12, -22); ctx.quadraticCurveTo(18, -10, 5, 0); ctx.fill();
                        // Eye Sclera (White shape)
                        ctx.fillStyle = "#FFF";
                        ctx.beginPath();
                        ctx.moveTo(-18, 0);
                        ctx.quadraticCurveTo(0, -12, 18, 0);
                        ctx.quadraticCurveTo(0, 12, -18, 0);
                        ctx.closePath(); ctx.fill();
                        // Iris (Gold)
                        ctx.fillStyle = "#FF8C00";
                        ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI*2); ctx.fill();
                        // Pupil (Cyan glowing)
                        ctx.fillStyle = "#00FFFF";
                        ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI*2); ctx.fill();
                    } else if (pName === "Fruto de Cristal") {
                        // Crystal Fruit - glowing light blue crystal shard
                        ctx.shadowBlur = 20; ctx.shadowColor = "#00BFFF";
                        // Draw multi-faceted crystal
                        ctx.fillStyle = "#E0FFFF";
                        ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(12, 0); ctx.lineTo(0, 25); ctx.lineTo(-12, 0); ctx.closePath(); ctx.fill();
                        // Shading lines for facet edges
                        ctx.fillStyle = "#87CEFA";
                        ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(0, 25); ctx.lineTo(12, 0); ctx.closePath(); ctx.fill();
                        ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(0, 25); ctx.stroke();
                    } else if (pName === "Amuleto Caótico") {
                        // Chaos Amulet - Golden rune frame with color changing gem
                        ctx.shadowBlur = 16;
                        var amuletoHue = (animTimer * 120) % 360;
                        ctx.shadowColor = "hsl(" + amuletoHue + ", 100%, 60%)";
                        // Gold frame
                        ctx.fillStyle = "#D4AF37";
                        ctx.beginPath();
                        ctx.moveTo(0, -22); ctx.lineTo(18, 8); ctx.lineTo(-18, 8); ctx.closePath(); ctx.fill();
                        ctx.fillStyle = "#000";
                        ctx.beginPath();
                        ctx.moveTo(0, -16); ctx.lineTo(13, 5); ctx.lineTo(-13, 5); ctx.closePath(); ctx.fill();
                        // Changing center gem
                        ctx.fillStyle = "hsl(" + amuletoHue + ", 100%, 50%)";
                        ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
                    } else if (pName === "Píldora Veloz") {
                        // Speed Pill - Red & white medicine capsule rotated
                        ctx.shadowBlur = 12; ctx.shadowColor = "#FF6347";
                        ctx.save();
                        ctx.rotate(Math.PI / 4);
                        // Capsule bottom (white)
                        ctx.fillStyle = "#FFF";
                        ctx.beginPath(); ctx.arc(0, 6, 8, 0, Math.PI); ctx.fill();
                        ctx.fillRect(-8, -4, 16, 10);
                        // Capsule top (red)
                        ctx.fillStyle = "#FF0000";
                        ctx.beginPath(); ctx.arc(0, -6, 8, Math.PI, 0); ctx.fill();
                        ctx.fillRect(-8, -6, 16, 10);
                        // Highlight shine
                        ctx.fillStyle = "rgba(255,255,255,0.4)";
                        ctx.fillRect(-4, -10, 2, 16);
                        ctx.restore();
                    } else if (pName === "Corazón Sangrante") {
                        // Bleeding Heart - Red heart with pulsing animation and bleed drops
                        var pulseScale = 1.0 + Math.sin(animTimer * 6) * 0.12;
                        ctx.shadowBlur = 18; ctx.shadowColor = "#FF0000";
                        ctx.save();
                        ctx.scale(pulseScale, pulseScale);
                        ctx.fillStyle = "#8B0000";
                        ctx.beginPath();
                        ctx.moveTo(0, -10);
                        ctx.bezierCurveTo(-15, -25, -28, -5, 0, 20);
                        ctx.bezierCurveTo(28, -5, 15, -25, 0, -10);
                        ctx.fill();
                        ctx.restore();
                        // Falling blood droplets
                        ctx.fillStyle = "#DC143C";
                        for (var dropIdx = 0; dropIdx < 2; dropIdx++) {
                            var dropY = 16 + ((animTimer * 30 + dropIdx * 15) % 25);
                            var dropSize = Math.max(1, 4 - (dropY - 16) * 0.15);
                            ctx.beginPath(); ctx.arc(0, dropY, dropSize, 0, Math.PI * 2); ctx.fill();
                        }
                    } else if (pName === "Polvo Gravitatorio") {
                        // Gravity Dust - A glowing mound of dark purple star dust
                        ctx.shadowBlur = 15; ctx.shadowColor = "#9400D3";
                        // Pile
                        var dustGrad = ctx.createLinearGradient(-20, 20, 20, 20);
                        dustGrad.addColorStop(0, "#4B0082");
                        dustGrad.addColorStop(0.5, "#BA55D3");
                        dustGrad.addColorStop(1, "#4B0082");
                        ctx.fillStyle = dustGrad;
                        ctx.beginPath();
                        ctx.moveTo(-25, 20);
                        ctx.quadraticCurveTo(-18, -4, 0, -4);
                        ctx.quadraticCurveTo(18, -4, 25, 20);
                        ctx.closePath(); ctx.fill();
                        // Sparkles
                        ctx.fillStyle = "#FFF";
                        for (var sp = 0; sp < 4; sp++) {
                            var sx = Math.sin(animTimer * 7 + sp * 2) * 18;
                            var sy = 10 - sp * 6;
                            ctx.fillRect(sx, sy, 2, 2);
                        }
                    } else if (pName === "Alma Sintética") {
                        // Synthetic Soul - Robotic metal heart with circuit trace lines
                        ctx.shadowBlur = 14; ctx.shadowColor = "#00FFFF";
                        ctx.fillStyle = "#333";
                        ctx.strokeStyle = "#00FFFF"; ctx.lineWidth = 1.5;
                        // Heart outline
                        ctx.beginPath();
                        ctx.moveTo(0, -12);
                        ctx.bezierCurveTo(-16, -24, -26, -5, 0, 18);
                        ctx.bezierCurveTo(26, -5, 16, -24, 0, -12);
                        ctx.fill(); ctx.stroke();
                        // Electronic trace lines
                        ctx.beginPath();
                        ctx.moveTo(-10, -5); ctx.lineTo(-4, 0); ctx.lineTo(4, 0); ctx.lineTo(10, -5);
                        ctx.moveTo(0, -12); ctx.lineTo(0, 10);
                        ctx.stroke();
                        // Central light
                        ctx.fillStyle = (animTimer * 5 % 2 > 1) ? "#0FF" : "#008B8B";
                        ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
                    } else if (pName === "Pacto del Titán") {
                        // Titan Pact - heavy runic stone slab
                        ctx.shadowBlur = 15; ctx.shadowColor = "#D2691E";
                        ctx.fillStyle = "#2F4F4F"; // Dark slate grey stone
                        ctx.fillRect(-16, -24, 32, 44);
                        // Cracked edges
                        ctx.strokeStyle = "#1A3038"; ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(-16, -10); ctx.lineTo(-10, -6);
                        ctx.moveTo(16, 8); ctx.lineTo(8, 4);
                        ctx.moveTo(0, -24); ctx.lineTo(-4, -16);
                        ctx.stroke();
                        // Glowing red runes
                        ctx.strokeStyle = "#FF3300"; ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(-6, -12); ctx.lineTo(6, -12);
                        ctx.moveTo(-8, -2); ctx.lineTo(0, 4); ctx.lineTo(8, -2);
                        ctx.moveTo(-4, 12); ctx.lineTo(4, 12);
                        ctx.stroke();
                    } else if (pName === "Néctar del Olimpo") {
                        // Olympus Nectar - golden greek amphora vase overflowing with golden syrup
                        ctx.shadowBlur = 18; ctx.shadowColor = "#FFD700";
                        // Golden amphora
                        ctx.fillStyle = "#FF8C00";
                        ctx.beginPath();
                        ctx.moveTo(-6, -18);
                        ctx.lineTo(6, -18);
                        ctx.lineTo(12, -8);
                        ctx.quadraticCurveTo(18, 6, 10, 18);
                        ctx.lineTo(-10, 18);
                        ctx.quadraticCurveTo(-18, 6, -12, -8);
                        ctx.closePath(); ctx.fill();
                        // Base & Rim decoration
                        ctx.fillStyle = "#D4AF37";
                        ctx.fillRect(-8, 18, 16, 4);
                        ctx.fillRect(-8, -21, 16, 3);
                        // Handles
                        ctx.strokeStyle = "#D4AF37"; ctx.lineWidth = 2.5;
                        ctx.beginPath(); ctx.arc(-10, -3, 8, -Math.PI/2, Math.PI/2, true); ctx.stroke();
                        ctx.beginPath(); ctx.arc(10, -3, 8, -Math.PI/2, Math.PI/2, false); ctx.stroke();
                        // Golden overflowing syrup
                        ctx.fillStyle = "#FFFF00";
                        ctx.beginPath(); ctx.ellipse(0, -18, 6, 3, 0, 0, Math.PI*2); ctx.fill();
                        ctx.fillRect(-2, -18, 4, 15);
                        ctx.beginPath(); ctx.arc(0, -3, 2, 0, Math.PI*2); ctx.fill();
                    } else if (pName === "Materia Inestable") {
                        // Shifting energetic orb
                        ctx.shadowBlur = 18 + Math.sin(animTimer * 15) * 6;
                        ctx.shadowColor = "#FF4500";
                        var unstableGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 16 + Math.sin(animTimer * 10) * 4);
                        unstableGrad.addColorStop(0, "#FFFF00");
                        unstableGrad.addColorStop(0.5, "#FF4500");
                        unstableGrad.addColorStop(1, "rgba(255,0,0,0)");
                        ctx.fillStyle = unstableGrad;
                        ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
                    } else if (pName === "Escudo Espinoso") {
                        // Shield with thorns
                        ctx.shadowBlur = 12; ctx.shadowColor = "#87CEEB";
                        ctx.fillStyle = "#4682B4";
                        ctx.beginPath();
                        ctx.moveTo(-16, -16);
                        ctx.lineTo(16, -16);
                        ctx.lineTo(12, 4);
                        ctx.quadraticCurveTo(0, 18, 0, 22);
                        ctx.quadraticCurveTo(0, 18, -12, 4);
                        ctx.closePath(); ctx.fill();
                        // Silver border
                        ctx.strokeStyle = "#FFF"; ctx.lineWidth = 2;
                        ctx.stroke();
                        // Spikes
                        ctx.fillStyle = "#FFF";
                        ctx.beginPath();
                        ctx.moveTo(-18, -8); ctx.lineTo(-24, -8); ctx.lineTo(-15, -4); ctx.fill();
                        ctx.beginPath();
                        ctx.moveTo(18, -8); ctx.lineTo(24, -8); ctx.lineTo(15, -4); ctx.fill();
                    } else if (pName === "Café Hiperactivo") {
                        // Hyper Coffee - hot coffee mug
                        ctx.shadowBlur = 15; ctx.shadowColor = "#D2691E";
                        // Cup
                        ctx.fillStyle = "#8B4513";
                        ctx.fillRect(-15, -5, 30, 22);
                        // Handle
                        ctx.strokeStyle = "#8B4513"; ctx.lineWidth = 3.5;
                        ctx.beginPath(); ctx.arc(14, 5, 5, -Math.PI/2, Math.PI/2); ctx.stroke();
                        // Coffee surface
                        ctx.fillStyle = "#F5DEB3";
                        ctx.beginPath(); ctx.ellipse(0, -5, 15, 4, 0, 0, Math.PI*2); ctx.fill();
                        // Steam
                        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"; ctx.lineWidth = 1.5;
                        for (var steamIdx = -8; steamIdx <= 8; steamIdx += 8) {
                            var offset = Math.sin(animTimer * 5 + steamIdx) * 2;
                            ctx.beginPath(); ctx.moveTo(steamIdx, -10); ctx.quadraticCurveTo(steamIdx + offset, -16, steamIdx, -22); ctx.stroke();
                        }
                    } else if (pName === "Inversor Fatal") {
                        // Inverted black/white flask
                        ctx.shadowBlur = 18; ctx.shadowColor = "#FFF";
                        var invTime = (animTimer * 2) % 2;
                        ctx.fillStyle = (invTime > 1) ? "#000" : "#FFF";
                        ctx.strokeStyle = (invTime > 1) ? "#FFF" : "#000";
                        ctx.lineWidth = 2.5;
                        ctx.beginPath();
                        ctx.moveTo(-18, 18); ctx.lineTo(18, 18); ctx.lineTo(4, -14); ctx.lineTo(-4, -14);
                        ctx.closePath();
                        ctx.fill(); ctx.stroke();
                    } else if (pName.indexOf("Potion") !== -1 || pName.indexOf("Poción") !== -1 || pName.indexOf("Tónico") !== -1 || pName.indexOf("Brebaje") !== -1 || pName.indexOf("Elixir") !== -1) {
                        // VOLUMETRIC FLASK (Balón Aforado) / Custom potions
                        var fillCol = "#0FF";
                        var auraCol = "#0FF";
                        var sizeScale = 1.0;
                        var bubbleEffect = false;
                        var sparkEffect = false;
                        var toxicEffect = false;
                        
                        if (pName === "Poción de Gigante") {
                            fillCol = "#228B22"; // Dark Forest Green
                            auraCol = "#32CD32"; // Lime
                            sizeScale = 1.5;
                            bubbleEffect = true;
                        } else if (pName === "Brebaje Encojedor") {
                            fillCol = "#BA55D3"; // Orchid Violet
                            auraCol = "#EE82EE"; // Fuchsia
                            sizeScale = 0.55;
                            bubbleEffect = true;
                        } else if (pName === "Tónico Berserker") {
                            fillCol = "#FF0000"; // Pure Red
                            auraCol = "#FF8C00"; // Orange
                            sizeScale = 1.1;
                            sparkEffect = true;
                        } else if (pName === "Elixir Caducado") {
                            fillCol = "#BDB76B"; // Muddy Olive/Khaki
                            auraCol = "#808000"; // Olive
                            bubbleEffect = true;
                        } else if (pName === "Poción de Canje") {
                            var canjeGrad = ctx.createLinearGradient(-10, 0, 10, 0);
                            canjeGrad.addColorStop(0, "#FFD700");
                            canjeGrad.addColorStop(1, "#00FFFF");
                            fillCol = canjeGrad;
                            auraCol = "#E0FFFF";
                        } else if (pName === "Brebaje Tóxico") {
                            fillCol = "#7FFF00"; // Lime green
                            auraCol = "#32CD32";
                            toxicEffect = true;
                            bubbleEffect = true;
                        } else if (pName === "Tónico Necrótico") {
                            fillCol = "#4B0082"; // Indigo
                            auraCol = "#9400D3"; // Purple
                            bubbleEffect = true;
                        }
                        
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = auraCol;
                        ctx.save();
                        ctx.scale(sizeScale, sizeScale);
                        
                        // Flask base (flat bottom spherical flask)
                        ctx.fillStyle = fillCol;
                        ctx.beginPath();
                        ctx.arc(0, 10, 16, -Math.PI / 4, Math.PI + Math.PI / 4);
                        ctx.lineTo(-4, -14);
                        ctx.lineTo(4, -14);
                        ctx.closePath();
                        ctx.fill();
                        
                        // Flask glass body outline
                        ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
                        ctx.lineWidth = 2.0;
                        ctx.beginPath();
                        ctx.arc(0, 10, 18, -Math.PI / 4, Math.PI + Math.PI / 4);
                        ctx.lineTo(-5, -16);
                        ctx.lineTo(5, -16);
                        ctx.closePath();
                        ctx.stroke();
                        
                        // Liquid top curve (showing meniscus)
                        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
                        ctx.beginPath();
                        ctx.ellipse(0, -2, 11, 3, 0, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Graduation line (Aforado mark)
                        ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(5, -8); ctx.stroke();
                        
                        // Cork stopper
                        ctx.fillStyle = "#8B4513";
                        ctx.fillRect(-4.5, -22, 9, 7);
                        
                        // Bubble bubbles
                        if (bubbleEffect) {
                            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
                            for (var bubbleIdx = 0; bubbleIdx < 3; bubbleIdx++) {
                                var bx = Math.sin(animTimer * 6 + bubbleIdx * 2) * 8;
                                var by = 15 - ((animTimer * 15 + bubbleIdx * 10) % 18);
                                if (by > -3) {
                                    ctx.beginPath(); ctx.arc(bx, by, 1.5, 0, Math.PI * 2); ctx.fill();
                                }
                            }
                        }
                        // Electric sparks
                        if (sparkEffect) {
                            ctx.strokeStyle = "#FFFF00"; ctx.lineWidth = 1.5;
                            ctx.beginPath();
                            var sparkX = Math.sin(animTimer * 12) * 12;
                            var sparkY = Math.cos(animTimer * 12) * 12 + 10;
                            ctx.moveTo(sparkX - 3, sparkY - 3); ctx.lineTo(sparkX + 3, sparkY + 3);
                            ctx.stroke();
                        }
                        // Toxic skull inside flask
                        if (toxicEffect) {
                            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
                            ctx.beginPath(); ctx.arc(0, 10, 5, 0, Math.PI * 2); ctx.fill();
                            ctx.fillRect(-2, 13, 4, 3);
                        }
                        
                        ctx.restore();
                    } else {
                        // Fallback generic items (like custom items with no match)
                        // Volumetric Flask / Cylinder shape
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
                    ctx.fillText(isEq ? "Equipado (" + equippedCount + "/8)" : "Presiona Z para equipar (" + equippedCount + "/8)", 40, 240);
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

    function markBossDefeated() {
        if (activeBossTriggerIndex >= 0 && activeBossTriggerIndex < triggerList.length) {
            triggerList[activeBossTriggerIndex].triggered = true;
            console.log("Boss defeated! Trigger " + activeBossTriggerIndex + " marked as triggered.");
        }
        activeBossTriggerIndex = -1;
    }
    
    function resetBossTrigger() {
        // Called when player LOSES — un-trigger the boss but require walking away first
        if (activeBossTriggerIndex >= 0 && activeBossTriggerIndex < triggerList.length) {
            triggerList[activeBossTriggerIndex].triggered = false;
            triggerList[activeBossTriggerIndex].needsExit = true; // Must walk away before re-triggering
            console.log("Boss NOT defeated. Trigger " + activeBossTriggerIndex + " reset (needs exit).");
        }
        activeBossTriggerIndex = -1;
    }

    return { init: init, setup: setup, update: update, draw: draw, markBossDefeated: markBossDefeated, resetBossTrigger: resetBossTrigger };
}());
