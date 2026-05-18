// boss_controller.js — Boss fight controller for LUNDERTALE
// Manages phases, patterns, soul modes, and karma

var BossController = (function() {
    var currentPattern = null;
    var patternQueue = [];
    var turnCount = 0;
    var attackDuration = 5;
    var attackTimer = 0;
    var isAttacking = false;
    var lastPattern = null;

    // Pattern factory
    var patternMap = {};

    function init() {
        patternMap = {
            "bulletRain": function(cfg) { return new BulletRainPattern(cfg || { speed: 3, damVal: 4, rotation: 0, fadeSpeed: 0.3, color: "#FFF", bulletWidth: 14, bulletHeight: 14, duration: 5 }); },
            "wallsOBullet": function(cfg) { return new WallsOBulletPattern(cfg || { speed: 2, damVal: 4, rotation: 0, fadeSpeed: 0.5, color: "#FFF", bulletWidth: 14, bulletHeight: 14, maxWaves: 4 }); },
            "closingWalls": function(cfg) { return new ClosingWallsPattern(cfg || { speed: 2.5, damVal: 5, rotation: 0, fadeSpeed: 0.4, color: "#FFF", bulletWidth: 14, bulletHeight: 14, maxWaves: 3 }); },
            "crusher": function(cfg) { return new CrusherPattern(cfg || { speed: 4, damVal: 6, rotation: 180, fadeSpeed: 0.5, color: "#FFF", bulletWidth: 14, bulletHeight: 14, duration: 3 }); },
            "spiralShot": function(cfg) { return new SpiralShotPattern(cfg || { damVal: 4, color: "#0FF", bulletWidth: 8, bulletHeight: 8, numBullets: 10, ringInterval: 0.5, maxRings: 6, spinSpeed: 1.5, bulletSpeed: 100, duration: 5 }); },
            "gasterBlaster": function(cfg) { return new GasterBlasterPattern(cfg || { damVal: 8, maxBeams: 4, beamInterval: 1.0, warningDuration: 0.6, beamDuration: 0.7, beamWidth: 28, duration: 5 }); },
            "boneWave": function(cfg) { return new BoneWavePattern(cfg || { speed: 3.5, damVal: 5, color: "#FFF", boneWidth: 12, maxWaves: 8, waveInterval: 0.5, gapSize: 45, duration: 5 }); },
            "pulsarBeam": function(cfg) { return new PulsarBeamPattern(cfg || { damVal: 7, duration: 8 }); },
            "eventHorizon": function(cfg) { return new EventHorizonPattern(cfg || { damVal: 9, duration: 7 }); },
            "holyLance": function(cfg) { return new HolyLancePattern(cfg || { damVal: 6, duration: 6, spawnInterval: 0.25, lanceSpeed: 200 }); },
            "divinePillars": function(cfg) { return new DivinePillarsPattern(cfg || { damVal: 7, maxPillars: 8, pillarInterval: 0.5, duration: 6 }); },
            "featherStorm": function(cfg) { return new FeatherStormPattern(cfg || { damVal: 5, duration: 7 }); },
            "judgmentRings": function(cfg) { return new JudgmentRingsPattern(cfg || { damVal: 6, duration: 8 }); },
            "heavenlyRays": function(cfg) { return new HeavenlyRaysPattern(cfg || { damVal: 8, duration: 7 }); },
            "accretionSpiral": function(cfg) { return new AccretionSpiralPattern(cfg || { damVal: 7, duration: 8 }); },
            "particleBeam": function(cfg) { return new ParticleBeamPattern(cfg || { damVal: 10, duration: 7 }); },
            "atField": function(cfg) { return new ATFieldPattern(cfg || { damVal: 8, duration: 7 }); },
            "geometricDrill": function(cfg) { return new GeometricDrillPattern(cfg || { damVal: 9, duration: 7 }); },
            "crystalStorm": function(cfg) { return new CrystalStormPattern(cfg || { damVal: 6, duration: 7 }); },
        };
    }

    function getAttackDetails(enemy) {
        var attacks = enemy.getCurrentAttacks();
        var patternName = attacks[Math.floor(Math.random() * attacks.length)];
        
        if (attacks.length > 1 && patternName === lastPattern) {
            while (patternName === lastPattern) {
                patternName = attacks[Math.floor(Math.random() * attacks.length)];
            }
        }
        lastPattern = patternName;

        var w = 300, h = 300;
        if (patternName === "wallsOBullet") {
            w = 574; h = 140; // Wide
        } else if (patternName === "gasterBlaster") {
            w = 400; h = 300; // Wider
        } else if (patternName === "pulsarBeam" || patternName === "eventHorizon") {
            w = 340; h = 340; // Large square for epic attacks
        } else if (patternName === "holyLance") {
            w = 180; h = 180; // Tight box for micro-dodging
        } else if (patternName === "divinePillars") {
            w = 450; h = 100; // Wide and extremely short
        } else if (patternName === "featherStorm") {
            w = 200; h = 200; // Small claustrophobic box
        } else if (patternName === "judgmentRings") {
            w = 280; h = 280; // Enough space for expanding rings
        } else if (patternName === "heavenlyRays") {
            w = 240; h = 240; // Perfect for laser grid
        } else if (patternName === "accretionSpiral") {
            w = 300; h = 300; // Large square for spiral chaos
        } else if (patternName === "particleBeam") {
            w = 300; h = 300; // Wide for beam sweep
        } else if (patternName === "atField") {
            w = 280; h = 280; // Square for compression
        } else if (patternName === "geometricDrill") {
            w = 260; h = 300; // Tall for drill descent
        } else if (patternName === "crystalStorm") {
            w = 300; h = 280; // Wide for crystal rain
        }

        return { patternName: patternName, width: w, height: h };
    }

    // Start a new attack turn
    function startAttack(enemy, battleBox, patternName) {
        turnCount++;
        currentPattern = createPattern(patternName);
        if (currentPattern) {
            currentPattern.generateBullets(battleBox);
        }

        // Set soul mode based on enemy phase
        var mode = enemy.getCurrentSoulMode();
        switch (mode) {
            case "blue": Soul.setSoulMode(Soul.SOUL_MODE.BLUE); break;
            case "yellow": Soul.setSoulMode(Soul.SOUL_MODE.YELLOW); break;
            case "inverse": Soul.setSoulMode(Soul.SOUL_MODE.INVERSE); break;
            default: Soul.setSoulMode(Soul.SOUL_MODE.RED); break;
        }

        isAttacking = true;
        attackTimer = 0;
    }

    function createPattern(name) {
        if (patternMap[name]) return patternMap[name]();
        return patternMap["bulletRain"]();
    }

    // Update the current attack
    function update(dt, enemy) {
        if (!currentPattern || !isAttacking) return true; // Done

        attackTimer += dt;
        currentPattern.update(dt);

        // Karma update
        if (enemy && enemy.karmaEnabled) {
            Player.updateKarma(dt);
        }

        // Check collision with soul
        if (Soul.isOkay()) {
            var soulPos = Soul.getPos();
            var dmg = currentPattern.checkCollision(
                soulPos.x, soulPos.y, Soul.getWidth(), Soul.getHeight());
            if (dmg > 0) {
                if (Soul.takeDamage()) {
                    var dmgMult = (enemy && enemy.currentPhase === 1) ? 1.2 : 1.1; // +20% Phase 2, +10% Phase 1
                    var finalDmg = Math.ceil((dmg * dmgMult) / (Player.getBuffDef ? Player.getBuffDef() : 1.0));
                    if (enemy && enemy.karmaEnabled) {
                        Player.addKarma(finalDmg);
                        Player.damage(1); // Minimal direct damage with karma
                    } else {
                        Player.damage(finalDmg);
                    }
                    // Trigger brutal passives
                    if (enemy && typeof enemy.onHitPlayer === 'function') {
                        enemy.onHitPlayer(finalDmg);
                    }
                }
            }
        }

        // Check if pattern is done
        if (currentPattern.isOver()) {
            isAttacking = false;
            Soul.setSoulMode(Soul.SOUL_MODE.RED); // Reset to red
            return true;
        }

        return false;
    }

    function draw(ctx) {
        if (currentPattern && isAttacking) {
            currentPattern.draw(ctx);
        }
    }

    function getTurnCount() { return turnCount; }
    function isActive() { return isAttacking; }
    function reset() { turnCount = 0; currentPattern = null; isAttacking = false; }

    return {
        init: init, startAttack: startAttack, getAttackDetails: getAttackDetails,
        update: update, draw: draw,
        getTurnCount: getTurnCount, isActive: isActive, reset: reset,
    };
}());
