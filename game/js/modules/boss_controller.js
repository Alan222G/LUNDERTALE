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
            "resonanceWave": function(cfg) { return new ResonanceWavePattern(cfg || { damVal: 7, duration: 7 }); },
            "prismRefract": function(cfg) { return new PrismRefractPattern(cfg || { damVal: 7, duration: 7 }); },
            "geometryShift": function(cfg) { return new GeometryShiftPattern(cfg || { damVal: 8, duration: 7 }); },
            "vortexPull": function(cfg) { return new VortexPullPattern(cfg || { damVal: 8, duration: 7 }); },
            "annihilationGrid": function(cfg) { return new AnnihilationGridPattern(cfg || { damVal: 9, duration: 8 }); },
            "fractureExplosion": function(cfg) { return new FractureExplosionPattern(cfg || { damVal: 8, duration: 7 }); },
            "divineSigil": function(cfg) { return new DivineSigilPattern(cfg || { damVal: 6, duration: 7 }); },
            "angelicChains": function(cfg) { return new AngelicChainsPattern(cfg || { damVal: 5, duration: 7 }); },
            "wheelOfFortune": function(cfg) { return new WheelOfFortunePattern(cfg || { damVal: 7, duration: 8 }); },
            "celestialJudgment": function(cfg) { return new CelestialJudgmentPattern(cfg || { damVal: 10, duration: 7 }); },
            "gravityWell": function(cfg) { return new GravityWellPattern(cfg || { damVal: 6, duration: 7 }); },
            "hawkingBurst": function(cfg) { return new HawkingBurstPattern(cfg || { damVal: 8, duration: 8 }); },
            "sandStream": function(cfg) { return new SandStreamPattern(cfg || { damVal: 6, duration: 7 }); },
            "clockworkGears": function(cfg) { return new ClockworkGearsPattern(cfg || { damVal: 7, duration: 8 }); },
            "pendulumSwing": function(cfg) { return new PendulumSwingPattern(cfg || { damVal: 8, duration: 7 }); },
            "timeReverse": function(cfg) { return new TimeReversePattern(cfg || { damVal: 7, duration: 8 }); },
            "temporalCollapse": function(cfg) { return new TemporalCollapsePattern(cfg || { damVal: 9, duration: 8 }); },
            "timeMines": function(cfg) { return new TimeMinesPattern(cfg || { damVal: 6, duration: 8 }); },
            "sandWhirlwind": function(cfg) { return new SandWhirlwindPattern(cfg || { damVal: 6, duration: 8 }); },
            "echoStrike": function(cfg) { return new EchoStrikePattern(cfg || { damVal: 8, duration: 8 }); },
            "timeLasers": function(cfg) { return new TimeLasersPattern(cfg || { damVal: 7, duration: 9 }); },
            "shatteredGlass": function(cfg) { return new ShatteredGlassPattern(cfg || { damVal: 8, duration: 8 }); },
            "glitchWalls": function(cfg) { return new GlitchWallsPattern(cfg || { damVal: 9, duration: 8 }); },
            "causalLightBeam": function(cfg) { return new CausalLightBeamPattern(cfg || { damVal: 10, duration: 7 }); },
            "bonePiercers": function(cfg) { return new BonePiercersPattern(cfg || { damVal: 8, duration: 8 }); },
            "timeDilation": function(cfg) { return new TimeDilationPattern(cfg || { damVal: 8, duration: 8 }); },
            "gravityInversion": function(cfg) { return new GravityInversionPattern(cfg || { damVal: 9, duration: 8 }); },
            "entropyVortex": function(cfg) { return new EntropyVortexPattern(cfg || { damVal: 10, duration: 9 }); },
            "coreEruption": function(cfg) { return new CoreEruptionPattern(cfg || { damVal: 12, duration: 7 }); },
            "bloodBoil": function(cfg) { return new BloodBoilPattern(cfg || { damVal: 11, duration: 8 }); },
            "voidImplosion": function(cfg) { return new VoidImplosionPattern(cfg || { damVal: 15, duration: 8 }); },
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
            w = 260; h = 260; // Expanded box for dodging
        } else if (patternName === "divinePillars") {
            w = 450; h = 100; // Wide and extremely short
        } else if (patternName === "featherStorm") {
            w = 260; h = 260; // Expanded box for dodging
        } else if (patternName === "judgmentRings") {
            w = 280; h = 280; // Enough space for expanding rings
        } else if (patternName === "heavenlyRays") {
            w = 240; h = 240; // Perfect for laser grid
        } else if (patternName === "accretionSpiral") {
            w = 300; h = 300; // Large square for spiral chaos
        } else if (patternName === "particleBeam") {
            w = 420; h = 300; // Extra wide for beam sweep
        } else if (patternName === "atField") {
            w = 280; h = 280; // Square for compression
        } else if (patternName === "geometricDrill") {
            w = 260; h = 300; // Tall for drill descent
        } else if (patternName === "crystalStorm") {
            w = 300; h = 280;
        } else if (patternName === "resonanceWave" || patternName === "prismRefract") {
            w = 280; h = 280;
        } else if (patternName === "geometryShift") {
            w = 300; h = 280;
        } else if (patternName === "vortexPull") {
            w = 280; h = 280;
        } else if (patternName === "annihilationGrid") {
            w = 280; h = 280;
        } else if (patternName === "fractureExplosion") {
            w = 300; h = 300;
        } else if (patternName === "divineSigil") {
            w = 260; h = 260;
        } else if (patternName === "angelicChains") {
            w = 300; h = 250;
        } else if (patternName === "wheelOfFortune") {
            w = 300; h = 280;
        } else if (patternName === "celestialJudgment") {
            w = 300; h = 300;
        } else if (patternName === "gravityWell") {
            w = 280; h = 280;
        } else if (patternName === "hawkingBurst") {
            w = 300; h = 300;
        } else if (patternName === "sandStream") {
            w = 260; h = 280;
        } else if (patternName === "clockworkGears") {
            w = 300; h = 300;
        } else if (patternName === "pendulumSwing") {
            w = 350; h = 240;
        } else if (patternName === "timeReverse") {
            w = 300; h = 300;
        } else if (patternName === "temporalCollapse") {
            w = 320; h = 320;
        } else if (patternName === "timeMines") {
            w = 280; h = 280;
        } else if (patternName === "sandWhirlwind") {
            w = 320; h = 320;
        } else if (patternName === "echoStrike") {
            w = 280; h = 240;
        } else if (patternName === "timeLasers") {
            w = 340; h = 340;
        } else if (patternName === "shatteredGlass") {
            w = 360; h = 220;
        } else if (patternName === "glitchWalls") {
            w = 300; h = 300;
        } else if (patternName === "causalLightBeam") {
            w = 300; h = 200;
        } else if (patternName === "bonePiercers") {
            w = 350; h = 250;
        } else if (patternName === "timeDilation") {
            w = 320; h = 320;
        } else if (patternName === "gravityInversion") {
            w = 300; h = 300;
        } else if (patternName === "entropyVortex") {
            w = 340; h = 340;
        } else if (patternName === "coreEruption") {
            w = 320; h = 320;
        } else if (patternName === "bloodBoil") {
            w = 300; h = 300;
        } else if (patternName === "voidImplosion") {
            w = 340; h = 340;
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
            // Clip to battle box to prevent visual artifacts at screen edges
            var bb = Cbbox.getBound();
            ctx.save();
            ctx.beginPath();
            ctx.rect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
            ctx.clip();
            currentPattern.draw(ctx);
            ctx.restore();
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
