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
        } else if (currentBossId === "bill") {
            setupBillCipher();
        } else if (currentBossId === "galactus") {
            setupGalactus();
        } else {
            setupSingularity();
        }
    }

    function setupSingularity() {
        enemies = [
            new Enemy({
                name: "Anti-gravity",
                checkText: "A collapsed star... its pull is inescapable.",
                maxHP: 5100,
                curHP: 5100,
                renderType: "blackhole",
                atk: 12,
                def: 8,
                defense: 1,
                spareable: true,
                acts: ["Check", "Meditate", "Plead", "Absorb Waves", "Offer Gold", "Sing", "Flee"],
                actResponses: [
                    "* ANTI-GRAVITY - ATK ?? DEF ??\n* A tear in the fabric of reality.\n* It consumes all.",
                    "* Te sientas y meditas ante la inmensidad del vacío.\n* Sientes cómo la gravedad se calma ligeramente.",
                    "* Suplicas clemencia ante la singularidad.\n* El vacío resuena con un eco amortiguado.",
                    "* Intentas absorber las ondas gravitacionales con tu alma.\n* La inestabilidad cósmica disminuye.",
                    "* Lanzas unas monedas de oro hacia el agujero negro.\n* Desaparecen instantáneamente, pero parece saciar su hambre temporalmente.",
                    "* You hum a gentle melody to the cosmic silence.\n* The star pulses in harmony.",
                    "* You turn your back and run away..."
                ],
                actFunctions: [
                    function() { console.log("Checked Singularity"); },
                    function() {
                        console.log("Meditated");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 15);
                    },
                    function() {
                        console.log("Pleaded");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 12);
                    },
                    function() {
                        console.log("Absorbed waves");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 20);
                    },
                    function() {
                        console.log("Offered gold");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 25);
                    },
                    function() {
                        console.log("Sang");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 15);
                    },
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
                phaseHP: [5100, 5700],
                karmaEnabled: false,
                jitterEnabled: true,
                damagePos: new Vect(370, 320, 0),
                damageVel: 120,
                bubbleOff: 30,
                mercyHP: 100,
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
                maxHP: 4300,
                curHP: 4300,
                renderType: "seraph",
                atk: 10,
                def: 7,
                defense: 1,
                spareable: true,
                acts: ["Check", "Pray", "Sing", "Defy", "Bow", "Confess", "Flee"],
                actResponses: [
                    "* SERAPHINA VEX - ATK 10 DEF 5\n* The eyes judge your every sin.\n* The rings are unyielding.",
                    "* You kneel and offer a prayer.\n* The golden glow softens slightly.",
                    "* You hum a gentle melody.\n* The wings flutter to the rhythm.",
                    "* You stare directly into the central eye.\n* It narrows in anger.",
                    "* You bow deeply to show respect.\n* Seraphina's presence feels less threatening.",
                    "* You confess your deepest mistakes.\n* The wings wrap around, acknowledging your truth.",
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
                        console.log("Bowed to Seraphina");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 15);
                    },
                    function() {
                        console.log("Confessed to Seraphina");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 30);
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
                phaseHP: [4300, 5000, 6000],
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
                maxHP: 4700,
                curHP: 4700,
                renderType: "ramiel_crystal",
                atk: 14,
                def: 10,
                spareable: false,
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
                    },
                    function() {
                        console.log("Provoked Ramiel");
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
                phaseHP: [4700, 5500, 9250],
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
                maxHP: 4500,
                curHP: 4500,
                renderType: "sachiel",
                atk: 15,
                def: 12,
                spareable: false,
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
                    },
                    function() {
                        console.log("Shielded against Sachiel");
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
                phaseHP: [4500, 5000, 10500],
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
                maxHP: 5500,
                curHP: 5500,
                renderType: "hourglass",
                atk: 11,
                def: 8,
                spareable: true,
                acts: ["Check", "Observe", "Wait", "Break", "Wind Up", "Count Sand", "Flee"],
                actResponses: [
                    "* PARADOJA - ATK 11 DEF 8\n* El tiempo se dobla a su alrededor.",
                    "* Observas el flujo de las partículas.\n* El patrón se graba en tu mente.",
                    "* Te quedas completamente quieto.\n* El tiempo parece detenerse.\n* Paradoja se intriga.",
                    "* Golpeas el cristal del reloj.\n* Una grieta aparece.\n* Paradoja grita en agonía temporal.",
                    "* Le das cuerda al mecanismo trasero.\n* El tic-tac acelera de forma juguetona.",
                    "* Intentas contar cada grano de arena que cae.\n* Paradoja parece divertirse con tu intento inútil.",
                    "* Intentas huir, pero la paradoja te regresa al presente."
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
                    },
                    function() {
                        console.log("Wound up Paradox");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 30);
                    },
                    function() {
                        console.log("Counted sand of Paradox");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 10);
                    },
                    function() {
                        console.log("Flee Paradox failed");
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
                phaseHP: [5500, 6200, 7000],
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
                maxHP: 4700,
                curHP: 4700,
                renderType: "godzilla_head",
                atk: 18,
                def: 15,
                spareable: false,
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
                    },
                    function() {
                        console.log("Roared at Godzilla");
                        enemies[0].defense = Math.max(0.8, enemies[0].defense - 0.2);
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
                phaseHP: [4700, 6200, 10950],
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
                maxHP: 4500,
                curHP: 4500,
                renderType: "vader_normal",
                atk: 22,
                def: 18,
                spareable: false,
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
                    },
                    function() {
                        console.log("Bribed Vader");
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
                phaseHP: [4500, 5300, 6300],
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
                maxHP: 5500,
                curHP: 5500,
                renderType: "glitch_minor",
                atk: 32,
                def: 30,
                defense: 1.3,
                spareable: true,
                acts: ["Check", "Reboot/Rest", "Decode/Fix", "Clear Cache", "Ignore Log", "Overclock", "Flee"],
                actResponses: [
                    "* ERROR 404 - ATK 32 DEF 30\n* La Falla Criptográfica. Su inestabilidad corrompe todo lo que toca.",
                    "* Intentas reiniciar tus sensores temporales.\n* Recuperas algo de balance y curas 15 HP.",
                    "* Tratas de depurar y corregir los punteros de la Falla.\n* Su inestabilidad aumenta y su defensa disminuye.",
                    "* Borras el caché del buffer del juego.\n* Las fluctuaciones se estabilizan un poco.",
                    "* Ignoras los registros de advertencia rojos en tu visión.\n* La anomalía se confunde por la falta de atención.",
                    "* Forzar overclocking en el procesador local.\n* La velocidad del juego aumenta, pero el glitch se estresa.",
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
                        console.log("Cleared Cache");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 15);
                    },
                    function() {
                        console.log("Ignored Log");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 10);
                    },
                    function() {
                        console.log("Overclocked");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 30);
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
                phaseHP: [5500, 6700, 8700],
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
                maxHP: 6000,
                curHP: 6000,
                renderType: "prism_phase1",
                atk: 25,
                def: 24,
                spareable: true,
                acts: ["Check", "Polish/Clean", "Refract/Shatter", "Adjust Angle", "Wave at Self", "Break Ray", "Flee"],
                actResponses: [
                    "* COLOSO DE ESPEJOS - ATK 25 DEF 24\n* Un gigante de cristal y reflejos.\n* Su superficie copia todo destello de luz.",
                    "* Limpias y pules las facetas del Coloso.\n* Las reflexiones brillan con más intensidad, aumentando su vulnerabilidad (DEF -20%).",
                    "* Golpeas el aire creando vibraciones resonantes.\n* El cristal resuena y se debilita levemente.",
                    "* Ajustas tu posición con respecto al ángulo del cristal.\n* Coloso de Espejos se confunde al perder tu reflejo directo.",
                    "* Saludas alegremente a tu propio reflejo en el espejo.\n* El reflejo te devuelve el saludo... Coloso se siente extrañamente halagado.",
                    "* Interrumpes un rayo de luz espectral.\n* El Coloso vibra con una resonancia de color.",
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
                        console.log("Adjusted Angle");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 15);
                    },
                    function() {
                        console.log("Waved at Self");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 12);
                    },
                    function() {
                        console.log("Broke Ray");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 20);
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
                phaseHP: [6000, 7300, 12050],
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
                maxHP: 6700,
                curHP: 6700,
                renderType: "void_maw",
                atk: 28,
                def: 22,
                defense: 1.15,
                spareable: true,
                acts: ["Check", "Satiate/Feed", "Taunt", "Sacrifice Gold", "Sing Void Hymn", "Absorb Gravity", "Flee"],
                actResponses: [
                    "* EL HAMBRE CÓSMICA - ATK 28 DEF 22\n* Un maw cósmico devorador.\n* ¡Ten cuidado, se comerá tus objetos de inventario!",
                    "* Le ofreces uno de tus objetos de inventario al Hambre Cósmica.",
                    "* Te burlas de su apetito insaciable.\n* Ruge enfadado.",
                    "* Lanzas algo de oro hacia la singularidad para calmar su apetito.",
                    "* Entonas un himno al vacío infinito.\n* El Hambre Cósmica parece responder con un murmullo melódico.",
                    "* Intentas contrarrestar su tirón gravitacional concentrando tu energía.\n* La gravedad disminuye levemente.",
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
                                    enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 30);
                                    if (typeof Soul !== "undefined" && Soul.addFloatingText) {
                                        var sPos = Soul.getPos();
                                        Soul.addFloatingText("FED POTION! +30 SPARE", sPos.x + Soul.getWidth() / 2, sPos.y - 12, "#00FF00");
                                    }
                                } else {
                                    enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 20);
                                    if (typeof Soul !== "undefined" && Soul.addFloatingText) {
                                        var sPos = Soul.getPos();
                                        Soul.addFloatingText("FED ITEM! +20 SPARE", sPos.x + Soul.getWidth() / 2, sPos.y - 12, "#DDA0DD");
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
                        console.log("Sacrificed Gold");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 20);
                    },
                    function() {
                        console.log("Sang Void Hymn");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 15);
                    },
                    function() {
                        console.log("Absorbed Gravity");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 12);
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
                phaseHP: [6700, 7900, 12150],
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
        enemies[0].hitsThisTurn = 0;
        enemies[0].onHitPlayer = function(dmgVal, patternName) {
            if (typeof Inventory !== "undefined") {
                this.hitsThisTurn = (this.hitsThisTurn || 0) + 1;
                
                var shouldSteal = false;
                if (patternName === "voidInventoryDevourAttempt" || patternName === "voidInventoryPurge") {
                    shouldSteal = true;
                } else if (this.hitsThisTurn % 3 === 0) {
                    shouldSteal = true;
                }
                
                if (!shouldSteal) return;

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

    function setupGalactus() {
        enemies = [
            new Enemy({
                name: "GALACTUS",
                checkText: "El Devorador de Mundos. Su hambre es infinita y su poder, cósmico.",
                maxHP: 6500,
                curHP: 6500,
                renderType: "galactus_herald",
                atk: 30,
                def: 25,
                defense: 1.2,
                spareable: true,
                acts: ["Check", "Ofrecer Energía", "Razonar", "Invocar a Reed", "Compasión", "Flee"],
                actResponses: [
                    "* GALACTUS - ATK 30 DEF 25\n* El Devorador de Mundos. Su hambre es una fuerza fundamental del universo.\n* Su poder cósmico supera la comprensión mortal.",
                    "* Ofreces una pequeña porción de tu energía vital.\n* GALACTUS la absorbe... y por un instante, su hambre parece disminuir.",
                    "* Intentas razonar con GALACTUS sobre el valor de la vida.\n* '¿Razonar? Las estrellas no razonan antes de colapsar.'",
                    "* Invocas el nombre de Reed Richards.\n* GALACTUS se detiene un momento. 'Ese mortal... siempre persistente.'",
                    "* Muestras compasión genuina por su hambre eterna.\n* Algo cambia en sus ojos cósmicos... recuerda a Galan.",
                    "* Intentas huir del Devorador de Mundos.\n* La gravedad cósmica te lo impide."
                ],
                actFunctions: [
                    function() { console.log("Checked Galactus"); },
                    function() {
                        console.log("Offered Energy to Galactus");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 20);
                    },
                    function() {
                        console.log("Reasoned with Galactus");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 10);
                    },
                    function() {
                        console.log("Invoked Reed Richards");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 25);
                    },
                    function() {
                        console.log("Showed Compassion to Galactus");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 30);
                    },
                    function() {
                        console.log("Flee Galactus failed");
                    }
                ],
                texts: [
                    "* El cosmos tiembla ante la presencia de GALACTUS.",
                    "* Las estrellas cercanas se apagan lentamente.",
                    "* La gravedad cósmica distorsiona el espacio a tu alrededor.",
                    "* Sientes el hambre insaciable irradiando de su forma.",
                    "* Las galaxias giran más lento en su presencia."
                ],
                speech: [
                    "MI HAMBRE\nES ETERNA.",
                    "ESTE MUNDO\nSERA\nCONSUMIDO.",
                    "SOY\nINEVITABLE.",
                    "LA VIDA\nES EFIMERA.\nYO SOY\nETERNO."
                ],
                spriteId: "asriel",
                attacks: [
                    "galactusCosmicBeam", "galactusHeraldSurfer", "galactusPowerCosmic", "galactusGravityCrush", "galactusStarDrain", "galactusCosmicRift", "galactusWorldEngine",
                    "galactusDevourPull", "galactusNebulaBurst", "galactusOrbitalBombard", "galactusCosmicStorm", "galactusHungerWave", "galactusPlanetCrush", "galactusVoidTendrils",
                    "galactusUltimateNullifier", "galactusRealityTear", "galactusBlackHoleMaw", "galactusCosmicJudgment", "galactusDimensionalCollapse", "galactusDevourStar", "galactusEndOfAllThings"
                ],
                phases: [
                    {
                        patterns: ["galactusCosmicBeam", "galactusHeraldSurfer", "galactusPowerCosmic", "galactusGravityCrush", "galactusStarDrain", "galactusCosmicRift", "galactusWorldEngine"],
                        soulMode: "red",
                        renderType: "galactus_herald",
                        speech: ["MI HAMBRE\nES ETERNA.", "EL HERALDO\nHA ANUNCIADO\nMI LLEGADA.", "ESTE MUNDO\nSERA\nCONSUMIDO."]
                    },
                    {
                        patterns: ["galactusDevourPull", "galactusNebulaBurst", "galactusOrbitalBombard", "galactusCosmicStorm", "galactusHungerWave", "galactusPlanetCrush", "galactusVoidTendrils"],
                        soulMode: "red",
                        renderType: "galactus_hungry",
                        speech: ["TENGO\nHAMBRE.", "EL UNIVERSO\nSE ENCOGE\nANTE MI.", "NO PUEDES\nDETENER\nLO INEVITABLE."]
                    },
                    {
                        patterns: ["galactusUltimateNullifier", "galactusRealityTear", "galactusBlackHoleMaw", "galactusCosmicJudgment", "galactusDimensionalCollapse", "galactusDevourStar", "galactusEndOfAllThings"],
                        soulMode: "blue",
                        renderType: "galactus_devourer",
                        speech: ["¡SOY\nGALACTUS!", "¡EL FIN\nDE TODO\nHA LLEGADO!", "¡NADA\nESCAPARA\nMI HAMBRE!"]
                    }
                ],
                phaseHP: [6500, 7800, 13000],
                karmaEnabled: false,
                jitterEnabled: true,
                damagePos: new Vect(370, 290, 0),
                damageVel: 120,
                bubbleOff: 30,
                mercyHP: 100,
                xpReward: 6000,
                goldReward: 3500,
            })
        ];
        enemies[0].bubblePos = enemies[0].damagePos.getAdd(new Vect(60, -160, 0));
        mercies = ["Spare", "Flee"];
        defends = [];
    }

    function setupBillCipher() {
        enemies = [
            new Enemy({
                name: "Bill Cipher",
                checkText: "El demonio del sueño. Una mente triangular tridimensional.",
                maxHP: 5000,
                curHP: 5000,
                renderType: "bill_normal",
                atk: 24,
                def: 20,
                defense: 1.25,
                spareable: true,
                acts: ["Check", "Make a Deal", "Question", "Laugh", "Flatter", "Handshake", "Ignore", "Flee"],
                actResponses: [
                    "* BILL CIPHER - ATK 24 DEF 20\n* ¡Ten cuidado! No confíes en él, se meterá en tu mente.",
                    "* Intentas hacer un trato con Bill Cipher.\n* '¡Oh, me encantan los tratos! ¿Qué tal tu alma por un caramelo?'",
                    "* Le preguntas sobre el portal dimensional.\n* Se ríe ruidosamente. 'El portal es solo el comienzo'.",
                    "* Te ríes con él de la locura cósmica.\n* '¡Eso es! ¡La locura es divertida!'\n* Se siente más cómodo contigo.",
                    "* Halagas su sombrero de copa y su pajarita.\n* '¡Por fin alguien con buen gusto! ¡Mira y aprende, niño!'",
                    "* Estiras tu mano para un apretón de manos.\n* Tu mano se ilumina con fuego azul... ¡Eso fue arriesgado!",
                    "* Decides ignorar sus comentarios provocativos.\n* Bill se enoja ligeramente.",
                    "* Intentas huir, pero la física misma se tuerce a su favor."
                ],
                actFunctions: [
                    function() { console.log("Checked Bill Cipher"); },
                    function() {
                        console.log("Made Deal");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 15);
                    },
                    function() {
                        console.log("Questioned Bill");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 20);
                    },
                    function() {
                        console.log("Laughed with Bill");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 12);
                    },
                    function() {
                        console.log("Flattered Bill");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 25);
                    },
                    function() {
                        console.log("Handshake with Bill");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 35);
                    },
                    function() {
                        console.log("Ignored Bill");
                        enemies[0].mercyHP = Math.min(100, enemies[0].mercyHP + 15);
                    },
                    function() {
                        console.log("Flee failed");
                    }
                ],
                texts: [
                    "* Bill Cipher flota en el centro con su ojo girando.",
                    "* La música se distorsiona con ecos extraños.",
                    "* El espacio alrededor del cuadro de combate parpadea.",
                    "* Sientes como si tu mente estuviera siendo observada."
                ],
                speech: [
                    "¡HOLA, SACO\nDE HUESOS!",
                    "¿QUIERES HACER\nUN TRATO?",
                    "LA REALIDAD\nES UNA ILUSION.",
                    "¡COMPRA ORO!"
                ],
                spriteId: "asriel",
                attacks: [
                    "billEyeLasers", "billCipherWheel", "billDealBlueFire", "billHatDrop", "billCaneSwack", "billTriangleBeams", "billPyramidTrap",
                    "billMadnessBubbles", "billTimeGlitch", "billDimensionalRift", "billWeirdmageddonRain", "billFloatingPyramids", "billShadowClones", "billTeleportSlam",
                    "billAngryRedNova", "billFistSlam", "billTeethChirp", "billCataclysmRays", "billGravityChaos", "billNightmareVortex", "billArmageddon"
                ],
                phases: [
                    {
                        patterns: ["billEyeLasers", "billCipherWheel", "billDealBlueFire", "billHatDrop", "billCaneSwack", "billTriangleBeams", "billPyramidTrap"],
                        soulMode: "red",
                        renderType: "bill_normal",
                        speech: ["¡HOLA, SACO\nDE HUESOS!", "¿QUIERES HACER\nUN TRATO?", "LA REALIDAD\nES UNA ILUSION.", "¡COMPRA ORO!"]
                    },
                    {
                        patterns: ["billMadnessBubbles", "billTimeGlitch", "billDimensionalRift", "billWeirdmageddonRain", "billFloatingPyramids", "billShadowClones", "billTeleportSlam"],
                        soulMode: "red",
                        renderType: "bill_madness",
                        speech: ["¡BIENVENIDOS\nA RAROAGEDON!", "¡EL TIEMPO SE\nHA CONGELADO!", "¡LA LOCURA\nREINA AQUÍ!"]
                    },
                    {
                        patterns: ["billAngryRedNova", "billFistSlam", "billTeethChirp", "billCataclysmRays", "billGravityChaos", "billNightmareVortex", "billArmageddon"],
                        soulMode: "blue",
                        renderType: "bill_angry",
                        speech: ["¡ESTOY\nHARTODE TI!", "¡TE CONVERTIRÉ\nEN CENIZAS!", "¡EL JUEGO\nSE ACABÓ!"]
                    }
                ],
                phaseHP: [5000, 6000, 7300],
                karmaEnabled: false,
                jitterEnabled: true,
                damagePos: new Vect(370, 260, 0),
                damageVel: 120,
                bubbleOff: 30,
                mercyHP: 100,
                xpReward: 5000,
                goldReward: 3000,
            })
        ];
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
