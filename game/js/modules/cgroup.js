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
        } else if (currentBossId === "sachiel") {
            setupSachiel();
        } else if (currentBossId === "paradox") {
            setupParadox();
        } else if (currentBossId === "godzilla") {
            setupGodzilla();
        } else if (currentBossId === "vader") {
            setupVader();
        } else if (currentBossId === "glitch") {
            setupGlitch();
        } else if (currentBossId === "prism") {
            setupPrism();
        } else if (currentBossId === "void_maw") {
            setupVoidMaw();
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
                    { patterns: ["spiralShot", "gasterBlaster", "pulsarBeam", "eventHorizon", "accretionSpiral"], soulMode: "red", renderType: "supermassive_blackhole" }
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

    function setupSachiel() {
        enemies = [
            new Enemy({
                name: "Sachiel",
                checkText: "The Third Angel. Its core glows with a terrible light.",
                maxHP: 3000,
                curHP: 3000,
                renderType: "sachiel",
                atk: 15,
                def: 12,
                defense: 1.1,
                acts: ["Check", "Study Core", "Shield", "Flee"],
                actResponses: [
                    "* SACHIEL - ATK 15 DEF 12\n* The Third Angel.\n* Its A.T. Field is weak but its strikes are brutal.",
                    "* You observe the red core closely.\n* It pulses faster... is it afraid?",
                    "* You brace yourself.\n* A faint light surrounds you.",
                    "* You turn your back and run away..."
                ],
                actFunctions: [
                    function() { console.log("Checked Sachiel"); },
                    function() {
                        console.log("Studied Sachiel's Core");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 20);
                    },
                    function() {
                        console.log("Shielded against Sachiel");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 10);
                    },
                    function() {
                        console.log("Fled Sachiel");
                        Sound.playSound("flash", true);
                        Transition.start("overworld", function() {
                            main.gameState = main.GAME_STATE.OVERWORLD;
                            Overworld.setup(main.ctx);
                        });
                    }
                ],
                texts: [
                    "* The Third Angel stands before you.",
                    "* The core glows an angry red.",
                    "* You feel the heat of annihilation.",
                    "* The bone mask stares blankly.",
                    "* Sachiel's shoulders heave with each breath."
                ],
                speech: [
                    "...",
                    "...",
                    "...",
                    "..."
                ],
                spriteId: "asriel",
                attacks: ["causalLightBeam", "bonePiercers"],
                phases: [
                    { patterns: ["causalLightBeam", "bonePiercers", "sachielWaterBlast", "sachielEyeSpark"], soulMode: "red", renderType: "sachiel_beast",
                      speech: ["...", "...", "..."] },
                    { patterns: ["causalLightBeam", "bonePiercers", "coreEruption", "sachielRibCage", "sachielCrossExplosion"], soulMode: "red", renderType: "sachiel_mutated",
                      speech: ["GRRRR...", "THE CORE\nHUNGERS.", "YOU CANNOT\nSTOP IT."] },
                    { patterns: ["causalLightBeam", "bonePiercers", "coreEruption", "bloodBoil", "sachielAtField", "sachielLonginus", "sachielCoreLaser", "sachielRegeneration", "sachielBloodRain"], soulMode: "red", renderType: "sachiel",
                      speech: ["RAAAGH!", "I WILL\nDEVOUR\nYOU.", "BLOOD\nBOILS."] }
                ],
                phaseHP: [3000, 3500, 9000],
                karmaEnabled: false,
                jitterEnabled: true,
                damagePos: new Vect(370, 320, 0),
                damageVel: 120,
                bubbleOff: 30,
                mercyHP: 100,
                xpReward: 300,
                goldReward: 150,
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
                maxHP: 4000,
                curHP: 4000,
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
                    { patterns: ["sandStream", "clockworkGears", "pendulumSwing", "timeMines", "sandWhirlwind", "timeDilation"], soulMode: "red", renderType: "hourglass",
                      speech: ["EL TIEMPO\nNO PERDONA.", "TODO SE\nREPITE.\nSIEMPRE."] },
                    { patterns: ["timeReverse", "clockworkGears", "sandStream", "pendulumSwing", "echoStrike", "timeLasers", "gravityInversion"], soulMode: "red", renderType: "hourglass_inverted",
                      speech: ["¿CREES QUE\nEL PASADO\nES SEGURO?", "LA GRAVEDAD\nES UNA\nILUSION."] },
                    { patterns: ["temporalCollapse", "sandStream", "timeReverse", "pendulumSwing", "clockworkGears", "shatteredGlass", "glitchWalls", "entropyVortex"], soulMode: "red", renderType: "hourglass_shattered",
                      speech: ["YO HE VISTO\nTU FINAL.", "EL CICLO\nSE ROMPE.", "NO HAY\nFUTURO."] }
                ],
                phaseHP: [4000, 4700, 5500],
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

    function setupGodzilla() {
        enemies = [
            new Enemy({
                name: "Godzilla",
                checkText: "El Rey de los Monstruos. La radiación a su alrededor es palpable.",
                maxHP: 3200,
                curHP: 3200,
                renderType: "godzilla_head",
                atk: 18,
                def: 15,
                defense: 1.4,
                acts: ["Check", "Dodge", "Roar Back", "Flee"],
                actResponses: [
                    "* GODZILLA - ATK 18 DEF 15\n* El Titán Alfa. Su presencia es devastadora.",
                    "* Te preparas para esquivar.\n* Tu velocidad aumenta ligeramente para el siguiente ataque.",
                    "* Le ruges de vuelta con todas tus fuerzas.\n* Godzilla se ve desafiado. Su defensa baja temporalmente.",
                    "* ¡No hay forma de huir del Rey de los Monstruos!"
                ],
                actFunctions: [
                    function() { console.log("Checked Godzilla"); },
                    function() {
                        console.log("Dodged Godzilla");
                        if (typeof Player !== "undefined" && Player.addSpeedBuff) {
                            Player.addSpeedBuff(1.2, 1);
                        }
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 15);
                    },
                    function() {
                        console.log("Roared at Godzilla");
                        enemies[0].defense = Math.max(0.8, enemies[0].defense - 0.2);
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 25);
                    },
                    function() {
                        console.log("Flee Godzilla failed");
                    }
                ],
                texts: [
                    "* El suelo tiembla violentamente bajo tus pies.",
                    "* Un aire caliente cargado de estática y ozono llena el lugar.",
                    "* Las placas dorsales de Godzilla brillan con una luz azul cegadora.",
                    "* Godzilla te observa con ojos antiguos y colosales."
                ],
                speech: [
                    "SKREEEONNK!",
                    "RROOOAAARRR!",
                    "EL PODER\nATOMICO\nSE CARGA.",
                    "NO ERES\nNADA ANTE\nEL REY."
                ],
                spriteId: "asriel",
                attacks: ["godzillaAtomicBreath", "godzillaTailWhip", "godzillaSpineLasers", "godzillaAtomicCrush", "godzillaRadioactiveFissure", "godzillaClawSlash", "godzillaAtomicSpit", "godzillaBurningRain", "godzillaMeltdownSpikes"],
                phases: [
                    { patterns: ["godzillaTailWhip", "godzillaAtomicBreath", "godzillaSpineLasers", "godzillaAtomicCrush"], soulMode: "red", renderType: "godzilla_head",
                      speech: ["SKREEEONNK!", "RROOOAAARRR!"] },
                    { patterns: ["godzillaTailWhip", "godzillaAtomicBreath", "godzillaRadioactiveFissure", "godzillaClawSlash", "godzillaAtomicSpit"], soulMode: "red", renderType: "godzilla_charged",
                      speech: ["EL PODER\nATOMICO\nSE CARGA.", "EL SUELO\nSE FRACTURA."] },
                    { patterns: ["godzillaTailWhip", "godzillaAtomicBreath", "godzillaBurningRain", "godzillaMeltdownSpikes"], soulMode: "red", renderType: "godzilla_meltdown",
                      speech: ["SKREEEONNK!", "MELTDOWN\nPROTOCOL.", "TODO SERA\nCENIZAS."] }
                ],
                phaseHP: [3200, 4700, 6700],
                karmaEnabled: false,
                jitterEnabled: true,
                damagePos: new Vect(370, 290, 0),
                damageVel: 120,
                bubbleOff: 30,
                mercyHP: 100,
                xpReward: 1000,
                goldReward: 500,
            })
        ];
        enemies[0].bubblePos = enemies[0].damagePos.getAdd(new Vect(60, -160, 0));
        mercies = ["Spare", "Flee"];
        defends = [];
    }

    function setupVader() {
        enemies = [
            new Enemy({
                name: "Darth Vader",
                checkText: "El Lord Sith. Su respiración pesada resuena en la Fuerza.",
                maxHP: 3000,
                curHP: 3000,
                renderType: "vader_normal",
                atk: 22,
                def: 18,
                defense: 1.5,
                acts: ["Check", "Defy", "Bribe", "Flee"],
                actResponses: [
                    "* DARTH VADER - ATK 22 DEF 18\n* Sientes la inmensa presión del Lado Oscuro.",
                    "* Desafías a Darth Vader con determinación.\n* Vader levanta su mano. Sientes un leve ahogo en la garganta.",
                    "* Intentas sobornar al Lord Sith con unos créditos galácticos.\n* Vader destruye los créditos con su sable. 'Tus trucos no funcionan conmigo'.",
                    "* ¡No hay forma de huir del Lado Oscuro!"
                ],
                actFunctions: [
                    function() { console.log("Checked Vader"); },
                    function() {
                        console.log("Defied Vader");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 20);
                    },
                    function() {
                        console.log("Bribed Vader");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 5);
                    },
                    function() {
                        console.log("Flee Vader failed");
                    }
                ],
                texts: [
                    "* Una respiración profunda y mecánica resuena en la sala.",
                    "* El aire se siente denso y opresivo.",
                    "* Una luz roja ilumina el rostro de Vader.",
                    "* Sientes la perturbación en la Fuerza."
                ],
                speech: [
                    "...",
                    "UNIRTE A MI\nES TU UNICO\nCAMINO.",
                    "SUBESTIMAS EL\nPODER DEL\nLADO OSCURO.",
                    "LA RESISTENCIA\nES INUTIL."
                ],
                spriteId: "asriel",
                attacks: ["vaderSaberThrow", "vaderForceChoke", "vaderImperialBarrage", "vaderLethalStrike", "vaderForcePush", "vaderForceCrush", "vaderTIEStrike", "vaderStormtrooper", "vaderForceLevitation", "vaderDeathStarLaser", "vaderForcePull", "vaderSaberShield", "vaderImperialMarch", "vaderRedemptionShock", "vaderDarkPresence"],
                phases: [
                    { patterns: ["vaderImperialBarrage", "vaderStormtrooper", "vaderImperialMarch", "vaderSaberThrow", "vaderSaberShield", "vaderLethalStrike", "vaderTIEStrike"], soulMode: "red", renderType: "vader_normal",
                      speech: ["TE HE ESTADO\nESPERANDO.", "UNIRTE AL\nLADO OSCURO\nES TU DESTINO.", "EL PODER DE\nLA FUERZA\nES ABSOLUTO."] },
                    { patterns: ["vaderForceChoke", "vaderForcePush", "vaderForceLevitation", "vaderSaberThrow", "vaderSaberShield", "vaderForcePull", "vaderDeathStarLaser"], soulMode: "red", renderType: "vader_force",
                      speech: ["SIENTES EL AHOGO\nDEL LADO\nOSCURO?", "SUBESTIMAS EL\nPODER DE\nLA FUERZA.", "NO HAY\nESCAPE."] },
                    { patterns: ["vaderForceCrush", "vaderRedemptionShock", "vaderDarkPresence", "vaderForcePull", "vaderDeathStarLaser", "vaderLethalStrike", "vaderTIEStrike"], soulMode: "red", renderType: "vader_rage",
                      speech: ["¡ES INUTIL\nRESISTIRSE!", "¡SIENTE LA IRA\nDEL LORD SITH!", "¡VILLANO!\nNO ME\nVENCERAS."] }
                ],
                phaseHP: [3000, 3800, 4800],
                karmaEnabled: false,
                jitterEnabled: false,
                damagePos: new Vect(370, 290, 0),
                damageVel: 120,
                bubbleOff: 30,
                mercyHP: 100,
                xpReward: 1200,
                goldReward: 600,
            })
        ];
        enemies[0].bubblePos = enemies[0].damagePos.getAdd(new Vect(60, -160, 0));
        mercies = ["Spare", "Flee"];
        defends = [];
    }

    function setupGlitch() {
        enemies = [
            new Enemy({
                name: "Error 404",
                checkText: "Una falla crítica en el espacio-tiempo de LUNDERTALE. Nada tiene sentido.",
                maxHP: 4000,
                curHP: 4000,
                renderType: "glitch_minor",
                atk: 32,
                def: 30,
                defense: 1.3,
                acts: ["Check", "Reboot/Rest", "Decode/Fix", "Flee"],
                actResponses: [
                    "* ERROR 404 - ATK 32 DEF 30\n* La Falla Criptográfica. Su inestabilidad corrompe todo lo que toca.",
                    "* Intentas reiniciar tus sensores temporales.\n* Recuperas algo de balance y curas 15 HP.",
                    "* Tratas de depurar y corregir los punteros de la Falla.\n* Su inestabilidad aumenta y su defensa disminuye.",
                    "* ¡No puedes huir de una excepción fatal de kernel!"
                ],
                actFunctions: [
                    function() { console.log("Checked Glitch"); },
                    function() {
                        console.log("Rebooted Sensors / Healed");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 20);
                        if (typeof Player !== "undefined" && Player.heal) {
                            Player.heal(15);
                        }
                    },
                    function() {
                        console.log("Decoded Glitch / Defense down");
                        enemies[0].defense = Math.max(0.85, enemies[0].defense - 0.15);
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 25);
                    },
                    function() {
                        console.log("Flee Glitch failed");
                    }
                ],
                texts: [
                    "* Una cascada de caracteres binarios parpadea en el borde de tu visión.",
                    "* Hueles a silicio quemado y a registros de memoria corruptos.",
                    "* La pantalla parece temblar con aberración cromática.",
                    "* Una ventana de error del sistema se abre y se cierra instantáneamente."
                ],
                speech: [
                    "EXCEPTION...",
                    "NULL_PTR...",
                    "FATAL ERROR!",
                    "BSOD_INCOMING..."
                ],
                spriteId: "napstablook",
                attacks: [
                    "glitchErrorWindows", "glitchMissingTexture", "glitchCodeRain", "glitchCoordinateWarp", "glitchFlickerShards", 
                    "glitchStaticBarrier", "glitchSpamWarning", "glitchBBoxMorph", "glitchDualSoul", "glitchRGBVectorSplit", 
                    "glitchMemoryLeak", "glitchBufferOverflow", "glitchBSODCrash", "glitchNullPointer", "glitchHexRain", 
                    "glitchFormatDrive", "glitchKernelPanic", "glitchScreenTear"
                ],
                phases: [
                    { 
                        patterns: ["glitchErrorWindows", "glitchBBoxMorph", "glitchCodeRain", "glitchCoordinateWarp", "glitchFlickerShards", "glitchStaticBarrier", "glitchMissingTexture"], 
                        soulMode: "red", 
                        renderType: "glitch_minor",
                        speech: ["EXCEPTION...", "404_NOT_FOUND", "ERR_MEM_1"] 
                    },
                    { 
                        patterns: ["glitchErrorWindows", "glitchRGBVectorSplit", "glitchSpamWarning", "glitchDualSoul", "glitchMemoryLeak", "glitchBufferOverflow", "glitchScreenTear"], 
                        soulMode: "red", 
                        renderType: "glitch_core",
                        speech: ["SYS_PANIC!", "BUFFER_OVFL...", "RGB_SPLIT"] 
                    },
                    { 
                        patterns: ["glitchBBoxMorph", "glitchRGBVectorSplit", "glitchBSODCrash", "glitchNullPointer", "glitchHexRain", "glitchFormatDrive", "glitchKernelPanic"], 
                        soulMode: "red", 
                        renderType: "glitch_fatal",
                        speech: ["BSOD!", "FORMATTING_C...", "FATAL_EXCEPTION!"] 
                    }
                ],
                phaseHP: [4000, 5200, 7200],
                karmaEnabled: false,
                jitterEnabled: true,
                damagePos: new Vect(370, 290, 0),
                damageVel: 120,
                bubbleOff: 30,
                mercyHP: 100,
                xpReward: 2500,
                goldReward: 1200,
            })
        ];
        enemies[0].bubblePos = enemies[0].damagePos.getAdd(new Vect(60, -160, 0));
        mercies = ["Spare", "Flee"];
        defends = [];
    }

    function setupPrism() {
        enemies = [
            new Enemy({
                name: "Coloso de Espejos",
                checkText: "Un gigante de cristal y reflejos. Sus facetas brillan con luz espectral.",
                maxHP: 4500,
                curHP: 4500,
                renderType: "prism_phase1",
                atk: 25,
                def: 24,
                defense: 1.25,
                acts: ["Check", "Polish/Clean", "Refract/Shatter", "Flee"],
                actResponses: [
                    "* COLOSO DE ESPEJOS - ATK 25 DEF 24\n* Un gigante de cristal y reflejos.\n* Su superficie copia todo destello de luz.",
                    "* Limpias y pules las facetas del Coloso.\n* Las reflexiones brillan con más intensidad, aumentando su vulnerabilidad (DEF -20%).",
                    "* Golpeas el aire creando vibraciones resonantes.\n* El cristal resuena y se debilita levemente.",
                    "* ¡No puedes escapar de tus propias reflexiones!"
                ],
                actFunctions: [
                    function() { console.log("Checked Coloso"); },
                    function() {
                        console.log("Polished Coloso / Defense down");
                        enemies[0].defense = Math.max(0.75, enemies[0].defense - 0.20);
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 20);
                    },
                    function() {
                        console.log("Refracted Coloso");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 25);
                    },
                    function() {
                        console.log("Flee Coloso failed");
                    }
                ],
                texts: [
                    "* Destellos de luz multicolor parpadean en los espejos gigantes.",
                    "* Escuchas el sonido tintineante de cristales rozando entre sí.",
                    "* El Coloso de Espejos gira majestuosamente, refractando la luz.",
                    "* Te ves reflejado infinitas veces en las caras del coloso."
                ],
                speech: [
                    "SOY TU\nREPRODUCCION.",
                    "TE REFLEJAS\nEN MIS ESPEJOS.",
                    "NO PUEDES\nCORRER DE\nTI MISMO.",
                    "TODO SE\nFRACTURA."
                ],
                spriteId: "mettaton",
                attacks: [
                    "prismBeamGrid", "shatteringSpikes", "mirrorReflect", "crystallineShield", "refractionCascade",
                    "glassFracture", "kaleidoscopeSpiral", "prismLaserSweep", "birefringenceSplit", "mirrorMaze",
                    "shatteredCore", "mirrorShardVortex", "spectralRefract", "mirrorDimension", "crystalCataclysm",
                    "prismStrobe", "glassRain", "crystallineRay"
                ],
                phases: [
                    { 
                        patterns: ["prismBeamGrid", "shatteringSpikes", "mirrorReflect", "crystallineShield", "refractionCascade", "prismStrobe", "crystallineRay"], 
                        soulMode: "red", 
                        renderType: "prism_phase1",
                        speech: ["SOY TU\nREPRODUCCION.", "TE REFLEJAS\nEN MIS ESPEJOS.", "NO PUEDES\nCORRER DE\nTI MISMO."] 
                    },
                    { 
                        patterns: ["glassFracture", "kaleidoscopeSpiral", "prismLaserSweep", "birefringenceSplit", "mirrorMaze", "prismStrobe", "glassRain"], 
                        soulMode: "yellow", 
                        renderType: "prism_phase2",
                        speech: ["EL REFLEJO SE\nDISTORSIONA.", "LA BIREFRINGENCIA\nTE DIVIDE.", "MIRA LAS GRIETAS."] 
                    },
                    { 
                        patterns: ["shatteredCore", "mirrorShardVortex", "spectralRefract", "mirrorDimension", "crystalCataclysm", "glassRain", "crystallineRay"], 
                        soulMode: "red", 
                        renderType: "prism_phase3",
                        speech: ["TODO SE\nFRACTURA.", "EL ABISMO\nREFLEJA TU\nALMA.", "CRISTALIZATE!"] 
                    }
                ],
                phaseHP: [4500, 5800, 7800],
                karmaEnabled: false,
                jitterEnabled: false,
                damagePos: new Vect(370, 290, 0),
                damageVel: 120,
                bubbleOff: 30,
                mercyHP: 100,
                xpReward: 3000,
                goldReward: 1500,
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

    function setupVoidMaw() {
        enemies = [
            new Enemy({
                name: "El Hambre Cósmica",
                checkText: "Una anomalía gravitatoria hambrienta. Devora tu inventario.",
                maxHP: 5200,
                curHP: 5200,
                renderType: "void_maw",
                atk: 28,
                def: 22,
                defense: 1.15,
                acts: ["Check", "Satiate/Feed", "Taunt", "Flee"],
                actResponses: [
                    "* EL HAMBRE CÓSMICA - ATK 28 DEF 22\n* Un maw cósmico devorador.\n* ¡Ten cuidado, se comerá tus objetos de inventario!",
                    "* Le ofreces uno de tus objetos de inventario al Hambre Cósmica.",
                    "* Te burlas de su apetito insaciable.\n* Ruge enfadado.",
                    "* Intentas huir, pero su gravedad te arrastra de vuelta."
                ],
                actFunctions: [
                    function() { console.log("Checked Void Maw"); },
                    function() {
                        console.log("Fed Void Maw");
                        if (typeof Inventory !== "undefined") {
                            var len = Inventory.getLength();
                            if (len > 0) {
                                var index = Math.floor(Math.random() * len);
                                var item = Inventory.getEquippedItemObject(index);
                                Inventory.removeItem(index);
                                
                                if (item.name === "Brebaje Tóxico") {
                                    enemies[0].dealDamage(500);
                                    enemies[0].bleedTimer = 5.0;
                                    enemies[0].bleedDmg = 15;
                                    enemies[0].mercyHP = Math.min(100, enemies[0].mercyHP + 15);
                                    if (typeof Soul !== "undefined" && Soul.addFloatingText) {
                                        var sPos = Soul.getPos();
                                        Soul.addFloatingText("FED POISON! -500 HP", sPos.x + Soul.getWidth() / 2, sPos.y - 12, "#7CFC00");
                                    }
                                } else if (item.name === "Materia Inestable") {
                                    enemies[0].dealDamage(400);
                                    enemies[0].mercyHP = Math.min(100, enemies[0].mercyHP + 10);
                                    if (typeof Soul !== "undefined" && Soul.addFloatingText) {
                                        var sPos = Soul.getPos();
                                        Soul.addFloatingText("FED UNSTABLE! -400 HP", sPos.x + Soul.getWidth() / 2, sPos.y - 12, "#FF8C00");
                                    }
                                } else if (item.healVal > 0) {
                                    enemies[0].curHP = Math.min(enemies[0].maxHP, enemies[0].curHP + 400);
                                    enemies[0].mercyHP = Math.min(100, enemies[0].mercyHP + 30);
                                    if (typeof Soul !== "undefined" && Soul.addFloatingText) {
                                        var sPos = Soul.getPos();
                                        Soul.addFloatingText("FED POTION! +400 HP", sPos.x + Soul.getWidth() / 2, sPos.y - 12, "#00FF00");
                                    }
                                } else {
                                    enemies[0].mercyHP = Math.min(100, enemies[0].mercyHP + 20);
                                    if (typeof Soul !== "undefined" && Soul.addFloatingText) {
                                        var sPos = Soul.getPos();
                                        Soul.addFloatingText("FED ITEM! +20 MERCY", sPos.x + Soul.getWidth() / 2, sPos.y - 12, "#DDA0DD");
                                    }
                                }
                                Sound.playSound("heal", true);
                            } else {
                                if (typeof Soul !== "undefined" && Soul.addFloatingText) {
                                    var sPos = Soul.getPos();
                                    Soul.addFloatingText("NO ITEMS!", sPos.x + Soul.getWidth() / 2, sPos.y - 12, "#FF0000");
                                }
                            }
                        }
                    },
                    function() {
                        console.log("Taunted Void Maw");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 10);
                    },
                    function() {
                        console.log("Flee failed");
                    }
                ],
                texts: [
                    "* El Hambre Cósmica ruge con una resonancia de gravedad infinita.",
                    "* Tus objetos del inventario tiemblan ante el vacío.",
                    "* Tentáculos de energía oscura azotan el aire a tu alrededor.",
                    "* Una mirada de mil ojos amarillos te juzga desde el abismo."
                ],
                speech: [
                    "EL VACIO\nTIENE HAMBRE.",
                    "TU EXISTENCIA\nES MI\nALIMENTO.",
                    "ENTREGAME\nTUS BIENES.",
                    "MÁS... MÁS!"
                ],
                spriteId: "asriel",
                attacks: [
                    "voidTentacleLash", "voidBiteSlam", "voidEyeBeam", "voidGravitySingularity", 
                    "voidInventoryDevourAttempt", "voidSpitBackBarrage", "voidMawDrip", "voidCosmicDust", 
                    "voidGravityPlunge", "voidEldritchScream", "voidNebulaSwarm", "voidAbyssalRift", 
                    "voidTentacleFlurry", "voidCorrosiveSpit", "voidShatteredCorePulse", "voidSingularityOrbits", 
                    "voidCosmicCollapse", "voidEldritchCross", "voidInventoryPurge", "voidWormholeJump", "voidBlackHoleNova"
                ],
                phases: [
                    { 
                        patterns: ["voidTentacleLash", "voidEyeBeam", "voidSpitBackBarrage", "voidMawDrip", "voidCosmicDust", "voidGravityPlunge", "voidEldritchScream"], 
                        soulMode: "red", 
                        renderType: "void_maw",
                        speech: ["EL VACIO\nTIENE HAMBRE.", "TU EXISTENCIA\nES MI\nALIMENTO.", "ENTREGAME\nTUS BIENES."]
                    },
                    { 
                        patterns: ["voidBiteSlam", "voidGravitySingularity", "voidInventoryDevourAttempt", "voidNebulaSwarm", "voidAbyssalRift", "voidTentacleFlurry", "voidCorrosiveSpit"], 
                        soulMode: "red", 
                        renderType: "void_enraged",
                        speech: ["¡NADA SE\nESCAPA DEL\nABISMO!", "¡LA ANOMALIA\nSE EXPANDE!", "MÁS... ¡QUIERO\nMÁS!"]
                    },
                    { 
                        patterns: ["voidShatteredCorePulse", "voidSingularityOrbits", "voidCosmicCollapse", "voidEldritchCross", "voidInventoryPurge", "voidWormholeJump", "voidBlackHoleNova"], 
                        soulMode: "red", 
                        renderType: "void_shattered",
                        speech: ["¡TODO SE\nCOLAPSA!", "EL FINAL\nCÓSMICO...", "¡CONSUMO\nABSOLUTO!"]
                    }
                ],
                phaseHP: [5200, 6400, 7900],
                karmaEnabled: false,
                jitterEnabled: true,
                damagePos: new Vect(370, 260, 0),
                damageVel: 120,
                bubbleOff: 30,
                mercyHP: 100,
                xpReward: 4000,
                goldReward: 2000,
            })
        ];
        
        enemies[0].stolenItems = [];
        enemies[0].hitsSinceSteal = 0;
        enemies[0].onHitPlayer = function(dmgVal) {
            if (typeof Inventory !== "undefined") {
                var len = Inventory.getLength();
                if (len > 0) {
                    var index = Math.floor(Math.random() * len);
                    var item = Inventory.getEquippedItemObject(index);
                    Inventory.removeItem(index);
                    
                    if (item.name === "Brebaje Tóxico") {
                        this.dealDamage(500);
                        this.bleedTimer = 5.0;
                        this.bleedDmg = 15;
                        if (typeof Soul !== "undefined" && Soul.addFloatingText) {
                            var sPos = Soul.getPos();
                            Soul.addFloatingText("DEVOUR POISON! -500 HP", sPos.x + Soul.getWidth() / 2, sPos.y - 12, "#7CFC00");
                        }
                        Sound.playSound("damage", true);
                    } else if (item.name === "Materia Inestable") {
                        var rand = Math.random();
                        if (rand < 0.33) {
                            this.dealDamage(400);
                            if (typeof Soul !== "undefined" && Soul.addFloatingText) {
                                Soul.addFloatingText("UNSTABLE BOOM! -400 HP", 370, 150, "#FF0000");
                            }
                            Sound.playSound("impact", true);
                        } else if (rand < 0.66) {
                            this.curHP = Math.min(this.maxHP, this.curHP + 400);
                            if (typeof Soul !== "undefined" && Soul.addFloatingText) {
                                Soul.addFloatingText("UNSTABLE POWER! +400 HP", 370, 150, "#00FF00");
                            }
                            Sound.playSound("heal", true);
                        } else {
                            Player.damage(20);
                            if (typeof Soul !== "undefined" && Soul.addFloatingText) {
                                var sPos = Soul.getPos();
                                Soul.addFloatingText("UNSTABLE CORRUPTION! -20 HP", sPos.x + Soul.getWidth() / 2, sPos.y - 12, "#9900FF");
                            }
                            Sound.playSound("damage", true);
                        }
                    } else if (item.healVal > 0) {
                        this.curHP = Math.min(this.maxHP, this.curHP + 400);
                        if (typeof Soul !== "undefined" && Soul.addFloatingText) {
                            var sPos = Soul.getPos();
                            Soul.addFloatingText("DEVOUR POTION! +400 HP", sPos.x + Soul.getWidth() / 2, sPos.y - 12, "#00FF00");
                        }
                        Sound.playSound("heal", true);
                    } else {
                        this.stolenItems.push(item);
                        if (typeof Soul !== "undefined" && Soul.addFloatingText) {
                            var sPos = Soul.getPos();
                            Soul.addFloatingText("STOLE " + item.name.toUpperCase() + "!", sPos.x + Soul.getWidth() / 2, sPos.y - 12, "#DDA0DD");
                        }
                        Sound.playSound("ting", true);
                    }
                }
            }
        };

        enemies[0].bubblePos = enemies[0].damagePos.getAdd(new Vect(60, -160, 0));
        mercies = ["Spare", "Flee"];
        defends = [];
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
