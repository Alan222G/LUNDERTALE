// cgroup.js — Enemy group manager for LUNDERTALE
// Refactored from UGE to use configurable Enemy class

var Cgroup = (function() {
    var enemies = [];
    var mercies = [];
    var defends = [];
    var currentBossId = "singularity";

    function setup(bossId) {
        currentBossId = bossId || "singularity";
        
        if (currentBossId === "seraphina") {
            setupSeraphina();
        } else if (currentBossId === "ramiel") {
            setupRamiel();
        } else if (currentBossId === "paradox") {
            setupParadox();
        } else {
            setupSingularity();
        }
    }

    function setupSingularity() {
        enemies = [
            new Enemy({
                name: "Anti-gravity",
                checkText: "A collapsed star... its pull is inescapable.",
                maxHP: 3600,
                curHP: 3600,
                renderType: "blackhole",
                atk: 12,
                def: 8,
                defense: 1,
                acts: ["Check", "Study", "Taunt", "Flee"],
                actResponses: [
                    "* ANTI-GRAVITY - ATK ?? DEF ??\n* A tear in the fabric of reality.\n* It consumes all.",
                    "* You try to understand the anomaly.\n* Your mind aches.",
                    "* You taunt the void.\n* It does not care.",
                    "* You turn your back and run away..."
                ],
                actFunctions: [
                    function() { console.log("Checked Singularity"); },
                    function() { console.log("Studied Singularity"); },
                    function() { console.log("Taunted Singularity"); },
                    function() {
                        console.log("Fled Singularity");
                        Sound.playSound("flash", true);
                        Transition.start("overworld", function() {
                            main.gameState = main.GAME_STATE.OVERWORLD;
                            Overworld.setup(main.ctx);
                        });
                    }
                ],
                texts: [
                    "* Anti-gravity distorts the space around you.",
                    "* The air hums with gravitational waves.",
                    "* Light bends. Time slows. Anti-gravity watches.",
                    "* You feel the pull of something ancient."
                ],
                speech: [
                    "...",
                    "ALL RETURNS\nTO ME.",
                    "TIME IS\nMEANINGLESS\nHERE.",
                    "YOU RESIST?\nCURIOUS."
                ],
                spriteId: "asriel",
                attacks: ["bulletRain"],
                phases: [
                    { patterns: ["bulletRain", "wallsOBullet", "gravityWell"], soulMode: "red", renderType: "blackhole" },
                    { patterns: ["spiralShot", "gasterBlaster", "pulsarBeam", "eventHorizon", "accretionSpiral", "hawkingBurst"], soulMode: "red", renderType: "supermassive_blackhole" }
                ],
                phaseHP: [3600, 4200],
                karmaEnabled: false,
                jitterEnabled: true,
                damagePos: new Vect(370, 320, 0),
                damageVel: 120,
                bubbleOff: 30,
                mercyHP: 90,
                xpReward: 200,
                goldReward: 100,
            })
        ];
        enemies[0].bubblePos = enemies[0].damagePos.getAdd(new Vect(60, -160, 0));
        mercies = ["Spare", "Flee"];
        defends = [];
    }

    function setupSeraphina() {
        enemies = [
            new Enemy({
                name: "Seraphina Vex",
                checkText: "A divine being with many eyes... watching you.",
                maxHP: 2800,
                curHP: 2800,
                renderType: "seraph",
                atk: 10,
                def: 7,
                defense: 1,
                acts: ["Check", "Pray", "Sing", "Defy", "Flee"],
                actResponses: [
                    "* SERAPHINA VEX - ATK 10 DEF 5\n* The eyes judge your every sin.\n* The rings are unyielding.",
                    "* You kneel and offer a prayer.\n* The golden glow softens slightly.",
                    "* You hum a gentle melody.\n* The wings flutter to the rhythm.",
                    "* You stare directly into the central eye.\n* It narrows in anger.",
                    "* You turn your back and run away..."
                ],
                actFunctions: [
                    function() { console.log("Checked Seraphina"); },
                    function() {
                        console.log("Prayed to Seraphina");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 20);
                    },
                    function() {
                        console.log("Sang to Seraphina");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 25);
                    },
                    function() {
                        console.log("Defied Seraphina");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 5);
                    },
                    function() {
                        console.log("Fled Seraphina");
                        Sound.playSound("flash", true);
                        Transition.start("overworld", function() {
                            main.gameState = main.GAME_STATE.OVERWORLD;
                            Overworld.setup(main.ctx);
                        });
                    }
                ],
                texts: [
                    "* Seraphina's eyes follow your every move.",
                    "* Golden light pulses from her rings.",
                    "* The air smells like incense and ozone.",
                    "* You hear whispers in a forgotten language.",
                    "* Feathers drift gently around you."
                ],
                speech: [
                    "BE NOT\nAFRAID.",
                    "I HAVE\nWATCHED\nFOR EONS.",
                    "YOUR SOUL\nIS... WARM.",
                    "INTERESTING\nCREATURE."
                ],
                spriteId: "asriel",
                attacks: ["holyLance"],
                phases: [
                    { patterns: ["holyLance", "featherStorm", "divineSigil", "angelicChains"], soulMode: "red", renderType: "seraph",
                      speech: ["BE NOT\nAFRAID.", "I HAVE\nWATCHED\nFOR EONS.", "YOUR SOUL\nIS... WARM."] },
                    { patterns: ["divinePillars", "judgmentRings", "featherStorm", "wheelOfFortune"], soulMode: "red", renderType: "ophanim",
                      speech: ["YOU DARE\nSTRIKE ME?", "MY PATIENCE\nWEARS THIN.", "THE RINGS\nSPIN FASTER\nNOW."] },
                    { patterns: ["heavenlyRays", "divinePillars", "holyLance", "judgmentRings", "celestialJudgment"], soulMode: "red", renderType: "throne",
                      speech: ["ENOUGH!", "FEEL THE\nWRATH OF\nTHE DIVINE!", "YOU WILL\nBURN!", "NO MERCY\nFOR THE\nWICKED!"] }
                ],
                phaseHP: [2800, 3500, 4500],
                karmaEnabled: false,
                jitterEnabled: false,
                damagePos: new Vect(370, 320, 0),
                damageVel: 120,
                bubbleOff: 30,
                mercyHP: 100,
                xpReward: 350,
                goldReward: 200,
            })
        ];
        enemies[0].bubblePos = enemies[0].damagePos.getAdd(new Vect(60, -160, 0));
        mercies = ["Spare", "Flee"];
        defends = [];
    }

    function setupRamiel() {
        enemies = [
            new Enemy({
                name: "RAMIEL",
                checkText: "A perfect geometric form... it hums with annihilating energy.",
                maxHP: 3200,
                curHP: 3200,
                renderType: "ramiel_crystal",
                atk: 14,
                def: 10,
                defense: 1.2,
                acts: ["Check", "Analyze", "Provoke", "Flee"],
                actResponses: [
                    "* RAMIEL - ATK 14 DEF 10\n* The 5th Angel. A fortress of light.\n* Its A.T. Field is almost absolute.",
                    "* You study the geometric patterns.\n* The hum grows louder.\n* It seems to be... drilling.",
                    "* You shout at the crystal.\n* The octahedron vibrates.\n* Was that... anger?",
                    "* You turn your back and run away..."
                ],
                actFunctions: [
                    function() { console.log("Checked Ramiel"); },
                    function() {
                        console.log("Analyzed Ramiel");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 15);
                    },
                    function() {
                        console.log("Provoked Ramiel");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 10);
                    },
                    function() {
                        console.log("Fled Ramiel");
                        Sound.playSound("flash", true);
                        Transition.start("overworld", function() {
                            main.gameState = main.GAME_STATE.OVERWORLD;
                            Overworld.setup(main.ctx);
                        });
                    }
                ],
                texts: [
                    "* The crystal hums at a frequency that hurts.",
                    "* Light refracts through the perfect geometry.",
                    "* The air vibrates with absolute power.",
                    "* You feel insignificant before its form.",
                    "* The octahedron rotates silently."
                ],
                speech: [
                    "...",
                    "...",
                    "GEOMETRY\nIS\nABSOLUTE.",
                    "YOU CANNOT\nPENETRATE\nTHE FIELD."
                ],
                spriteId: "asriel",
                attacks: ["particleBeam"],
                phases: [
                    { patterns: ["particleBeam", "crystalStorm", "resonanceWave", "prismRefract"], soulMode: "red", renderType: "ramiel_crystal",
                      speech: ["...", "...", "GEOMETRY\nIS\nABSOLUTE."] },
                    { patterns: ["atField", "particleBeam", "crystalStorm", "geometryShift", "vortexPull"], soulMode: "red", renderType: "ramiel_morph",
                      speech: ["FORM\nSHIFTS.", "YOU PERSIST?\nINTRIGUING.", "THE FIELD\nIS ETERNAL."] },
                    { patterns: ["geometricDrill", "atField", "particleBeam", "crystalStorm", "annihilationGrid", "fractureExplosion"], soulMode: "red", renderType: "ramiel_berserk",
                      speech: ["ENOUGH.", "ANNIHILATION\nPROTOCOL.", "THE DRILL\nWILL PIERCE\nALL.", "NO BARRIER\nCAN SAVE\nYOU."] }
                ],
                phaseHP: [3200, 4000, 5000],
                karmaEnabled: false,
                jitterEnabled: false,
                damagePos: new Vect(370, 320, 0),
                damageVel: 120,
                bubbleOff: 30,
                mercyHP: 100,
                xpReward: 400,
                goldReward: 250,
            })
        ];
        enemies[0].bubblePos = enemies[0].damagePos.getAdd(new Vect(60, -160, 0));
        mercies = ["Spare", "Flee"];
        defends = [];
    }

    function setupParadox() {
        enemies = [
            new Enemy({
                name: "Paradoja",
                checkText: "Una anomalía temporal con forma de reloj. Contiene toda la arena del tiempo.",
                maxHP: 2500,
                curHP: 2500,
                renderType: "hourglass",
                atk: 11,
                def: 8,
                defense: 1.0,
                acts: ["Check", "Observe", "Wait", "Break"],
                actResponses: [
                    "* PARADOJA - ATK 11 DEF 8\n* El tiempo se dobla a su alrededor.",
                    "* Observas el flujo de las partículas.\n* El patrón se graba en tu mente.",
                    "* Te quedas completamente quieto.\n* El tiempo parece detenerse.\n* Paradoja se intriga.",
                    "* Golpeas el cristal del reloj.\n* Una grieta aparece.\n* Paradoja grita en agonía temporal."
                ],
                actFunctions: [
                    function() { console.log("Checked Paradox"); },
                    function() {
                        console.log("Observed Paradox");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 15);
                    },
                    function() {
                        console.log("Waited for Paradox");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 25);
                    },
                    function() {
                        console.log("Broke Paradox");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 5);
                        // Maybe enrage later
                    }
                ],
                texts: [
                    "* El reloj de arena late con un ritmo ancestral.",
                    "* Las partículas fluyen... pero ¿hacia arriba o abajo?",
                    "* El tiempo se siente distorsionado a tu alrededor.",
                    "* Escuchas el tic-tac de un reloj invisible."
                ],
                speech: [
                    "EL TIEMPO\nNO PERDONA.",
                    "¿CREES QUE\nEL PASADO\nES SEGURO?",
                    "TODO SE\nREPITE.\nSIEMPRE.",
                    "YO HE VISTO\nTU FINAL."
                ],
                spriteId: "asriel",
                attacks: ["sandStream"],
                phases: [
                    { patterns: ["sandStream", "clockworkGears", "pendulumSwing"], soulMode: "red", renderType: "hourglass",
                      speech: ["EL TIEMPO\nNO PERDONA.", "TODO SE\nREPITE.\nSIEMPRE."] },
                    { patterns: ["timeReverse", "clockworkGears", "sandStream", "pendulumSwing"], soulMode: "red", renderType: "hourglass_inverted",
                      speech: ["¿CREES QUE\nEL PASADO\nES SEGURO?", "LA GRAVEDAD\nES UNA\nILUSION."] },
                    { patterns: ["temporalCollapse", "sandStream", "timeReverse", "pendulumSwing", "clockworkGears"], soulMode: "red", renderType: "hourglass_shattered",
                      speech: ["YO HE VISTO\nTU FINAL.", "EL CICLO\nSE ROMPE.", "NO HAY\nFUTURO."] }
                ],
                phaseHP: [2500, 3200, 4000],
                karmaEnabled: false,
                jitterEnabled: false,
                damagePos: new Vect(370, 320, 0),
                damageVel: 120,
                bubbleOff: 30,
                mercyHP: 100,
                xpReward: 300,
                goldReward: 200,
            })
        ];
        enemies[0].bubblePos = enemies[0].damagePos.getAdd(new Vect(60, -160, 0));
        mercies = ["Spare", "Flee"];
        defends = [];
    }

    function getBossId() { return currentBossId; }

    function loadAnimation(index, text, pos) {
        if (enemies[index]) enemies[index].addAnimation(text, pos);
    }

    function update(dt) {
        for (var i = 0; i < enemies.length; i++) enemies[i].update(dt);
    }

    function draw(ctx) {
        for (var i = 0; i < enemies.length; i++) enemies[i].draw(ctx);
    }

    function getDefends() { return defends[0]; }
    function getNames() {
        var names = [];
        for (var i = 0; i < enemies.length; i++) names.push(enemies[i].name);
        return names;
    }
    function getText() { return enemies[0].getRandomText(); }
    function getActs(idx) { return enemies[idx].acts; }
    function getRes(eIdx, aIdx) {
        if (enemies[eIdx].actFunctions[aIdx]) enemies[eIdx].actFunctions[aIdx]();
        return enemies[eIdx].actResponses[aIdx];
    }
    function getDamagePos(idx) { return enemies[idx].damagePos; }
    function getDamageVel(idx) { return enemies[idx].damageVel; }
    function getMaxHP(idx) { return enemies[idx].maxHP; }
    function getCurHP(idx) { return enemies[idx].curHP; }
    function getBubblePos(idx) { return enemies[idx].bubblePos; }
    function getBubbleOff(idx) { return enemies[idx].bubbleOff; }
    function getMercies() { return mercies; }
    function getEnemy(idx) { return enemies[idx]; }

    function dealDamage(idx, damage) {
        return enemies[idx].dealDamage(damage);
    }

    return {
        setup: setup, loadAnimation: loadAnimation, getBossId: getBossId,
        update: update, draw: draw,
        getDefends: getDefends, getNames: getNames, getText: getText,
        getActs: getActs, getRes: getRes,
        getDamagePos: getDamagePos, getDamageVel: getDamageVel,
        getMaxHP: getMaxHP, getCurHP: getCurHP,
        getBubblePos: getBubblePos, getBubbleOff: getBubbleOff,
        getMercies: getMercies, getEnemy: getEnemy, dealDamage: dealDamage,
    };
}());
