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
        } else {
            setupSingularity();
        }
    }

    function setupSingularity() {
        enemies = [
            new Enemy({
                name: "Singularity",
                checkText: "A collapsed star... its pull is inescapable.",
                maxHP: 3600,
                curHP: 3600,
                renderType: "blackhole",
                atk: 12,
                def: 8,
                defense: 1,
                acts: ["Check", "Observe", "Resist"],
                actResponses: [
                    "* SINGULARITY - ATK 12 DEF 8\n* A point of infinite density.\n* Science cannot explain its loneliness.",
                    "* You stare into the void...\n* The void stares back.\n* It seems... curious about you.",
                    "* You brace against the pull.\n* Singularity's gravity weakens slightly."
                ],
                actFunctions: [
                    function() { console.log("Checked Singularity"); },
                    function() { console.log("Observed Singularity"); },
                    function() {
                        console.log("Resisted Singularity");
                        enemies[0].mercyHP = Math.max(0, enemies[0].mercyHP - 30);
                    }
                ],
                texts: [
                    "* Singularity distorts the space around you.",
                    "* The air hums with gravitational waves.",
                    "* Light bends. Time slows. Singularity watches.",
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
                    { patterns: ["bulletRain", "wallsOBullet"], soulMode: "red", renderType: "blackhole" },
                    { patterns: ["spiralShot", "gasterBlaster", "pulsarBeam", "eventHorizon"], soulMode: "red", renderType: "supermassive_blackhole" }
                ],
                phaseHP: [3600, 4200],
                karmaEnabled: false,
                jitterEnabled: true,
                damagePos: new Vect(320, 220, 0),
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
                acts: ["Check", "Pray", "Sing", "Defy"],
                actResponses: [
                    "* SERAPHINA VEX - ATK 10 DEF 7\n* An Eywing Rey. Mistaken for a\n* biblically accurate angel.",
                    "* You kneel and pray.\n* Seraphina's gaze softens.\n* She seems to appreciate the gesture.",
                    "* You hum a gentle melody.\n* The golden rings slow their spin.\n* Seraphina listens, transfixed.",
                    "* You stare defiantly at the central eye.\n* Seraphina's wings bristle.\n* \"Bold. Very bold.\""
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
                    { patterns: ["holyLance", "featherStorm"], soulMode: "red", renderType: "seraph",
                      speech: ["BE NOT\nAFRAID.", "I HAVE\nWATCHED\nFOR EONS.", "YOUR SOUL\nIS... WARM."] },
                    { patterns: ["divinePillars", "judgmentRings", "featherStorm"], soulMode: "red", renderType: "ophanim",
                      speech: ["YOU DARE\nSTRIKE ME?", "MY PATIENCE\nWEARS THIN.", "THE RINGS\nSPIN FASTER\nNOW."] },
                    { patterns: ["heavenlyRays", "divinePillars", "holyLance", "judgmentRings"], soulMode: "red", renderType: "throne",
                      speech: ["ENOUGH!", "FEEL THE\nWRATH OF\nTHE DIVINE!", "YOU WILL\nBURN!", "NO MERCY\nFOR THE\nWICKED!"] }
                ],
                phaseHP: [2800, 3500, 4500],
                karmaEnabled: false,
                jitterEnabled: false,
                damagePos: new Vect(320, 220, 0),
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
