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
            // --- Custom Sachiel Attacks ---
            "sachielWaterBlast": function(cfg) { return new SachielWaterBlastPattern(cfg || { damVal: 8, duration: 7 }); },
            "sachielEyeSpark": function(cfg) { return new SachielEyeSparkPattern(cfg || { damVal: 6, duration: 7 }); },
            "sachielRibCage": function(cfg) { return new SachielRibCagePattern(cfg || { damVal: 10, duration: 8 }); },
            "sachielCrossExplosion": function(cfg) { return new SachielCrossExplosionPattern(cfg || { damVal: 12, duration: 8 }); },
            "sachielAtField": function(cfg) { return new SachielAtFieldPattern(cfg || { damVal: 10, duration: 8 }); },
            "sachielLonginus": function(cfg) { return new SachielLonginusPattern(cfg || { damVal: 15, duration: 8 }); },
            "sachielCoreLaser": function(cfg) { return new SachielCoreLaserPattern(cfg || { damVal: 14, duration: 8 }); },
            "sachielRegeneration": function(cfg) { return new SachielRegenerationPattern(cfg || { damVal: 8, duration: 8 }); },
            "sachielHaloCrush": function(cfg) { return new SachielHaloCrushPattern(cfg || { damVal: 9, duration: 8 }); },
            "sachielBloodRain": function(cfg) { return new SachielBloodRainPattern(cfg || { damVal: 8, duration: 8 }); },
            // --- Custom Godzilla Attacks ---
            "godzillaAtomicBreath": function(cfg) { return new GodzillaAtomicBreathPattern(cfg || { damVal: 12, duration: 8 }); },
            "godzillaTailWhip": function(cfg) { return new GodzillaTailWhipPattern(cfg || { damVal: 8, duration: 7 }); },
            "godzillaSpineLasers": function(cfg) { return new GodzillaSpineLasersPattern(cfg || { damVal: 9, duration: 8 }); },
            "godzillaAtomicCrush": function(cfg) { return new GodzillaAtomicCrushPattern(cfg || { damVal: 10, duration: 8 }); },
            "godzillaRadioactiveFissure": function(cfg) { return new GodzillaRadioactiveFissurePattern(cfg || { damVal: 9, duration: 8 }); },
            "godzillaClawSlash": function(cfg) { return new GodzillaClawSlashPattern(cfg || { damVal: 9, duration: 8 }); },
            "godzillaAtomicSpit": function(cfg) { return new GodzillaAtomicSpitPattern(cfg || { damVal: 8, duration: 7.5 }); },
            "godzillaBurningRain": function(cfg) { return new GodzillaBurningRainPattern(cfg || { damVal: 8, duration: 7.5 }); },
            "godzillaMeltdownSpikes": function(cfg) { return new GodzillaMeltdownSpikesPattern(cfg || { damVal: 9, duration: 8 }); },
            // --- Custom Darth Vader Attacks ---
            "vaderSaberThrow": function(cfg) { return new VaderSaberThrowPattern(cfg || { damVal: 9, duration: 8 }); },
            "vaderForceChoke": function(cfg) { return new VaderForceChokePattern(cfg || { damVal: 8, duration: 8 }); },
            "vaderImperialBarrage": function(cfg) { return new VaderImperialBarragePattern(cfg || { damVal: 9, duration: 8 }); },
            "vaderLethalStrike": function(cfg) { return new VaderLethalStrikePattern(cfg || { damVal: 9, duration: 8 }); },
            "vaderForcePush": function(cfg) { return new VaderForcePushPattern(cfg || { damVal: 8, duration: 8 }); },
            "vaderForceCrush": function(cfg) { return new VaderForceCrushPattern(cfg || { damVal: 10, duration: 8 }); },
            "vaderTIEStrike": function(cfg) { return new VaderTIEStrikePattern(cfg || { damVal: 8, duration: 8 }); },
            "vaderStormtrooper": function(cfg) { return new VaderStormtrooperPattern(cfg || { damVal: 7, duration: 8 }); },
            "vaderForceLevitation": function(cfg) { return new VaderForceLevitationPattern(cfg || { damVal: 9, duration: 8 }); },
            "vaderDeathStarLaser": function(cfg) { return new VaderDeathStarLaserPattern(cfg || { damVal: 12, duration: 8 }); },
            "vaderForcePull": function(cfg) { return new VaderForcePullPattern(cfg || { damVal: 8, duration: 8 }); },
            "vaderSaberShield": function(cfg) { return new VaderSaberShieldPattern(cfg || { damVal: 8, duration: 8 }); },
            "vaderImperialMarch": function(cfg) { return new VaderImperialMarchPattern(cfg || { damVal: 8, duration: 8 }); },
            "vaderRedemptionShock": function(cfg) { return new VaderRedemptionShockPattern(cfg || { damVal: 9, duration: 8 }); },
            "vaderDarkPresence": function(cfg) { return new VaderDarkPresencePattern(cfg || { damVal: 9, duration: 8 }); },
            // --- Custom Glitch (Error 404) Attacks ---
            "glitchErrorWindows": function(cfg) { return new GlitchErrorWindowsPattern(cfg || { damVal: 8, duration: 6.5 }); },
            "glitchMissingTexture": function(cfg) { return new GlitchMissingTexturePattern(cfg || { damVal: 9, duration: 6.5 }); },
            "glitchCodeRain": function(cfg) { return new GlitchCodeRainPattern(cfg || { damVal: 8, duration: 6.5 }); },
            "glitchCoordinateWarp": function(cfg) { return new GlitchCoordinateWarpPattern(cfg || { damVal: 8, duration: 7.0 }); },
            "glitchFlickerShards": function(cfg) { return new GlitchFlickerShardsPattern(cfg || { damVal: 8, duration: 6.5 }); },
            "glitchStaticBarrier": function(cfg) { return new GlitchStaticBarrierPattern(cfg || { damVal: 9, duration: 6.5 }); },
            "glitchSpamWarning": function(cfg) { return new GlitchSpamWarningPattern(cfg || { damVal: 9, duration: 6.5 }); },
            "glitchBBoxMorph": function(cfg) { return new GlitchBBoxMorphPattern(cfg || { damVal: 9, duration: 7.0 }); },
            "glitchDualSoul": function(cfg) { return new GlitchDualSoulPattern(cfg || { damVal: 8, duration: 6.5 }); },
            "glitchRGBVectorSplit": function(cfg) { return new GlitchRGBVectorSplitPattern(cfg || { damVal: 9, duration: 6.5 }); },
            "glitchMemoryLeak": function(cfg) { return new GlitchMemoryLeakPattern(cfg || { damVal: 8, duration: 6.5 }); },
            "glitchBufferOverflow": function(cfg) { return new GlitchBufferOverflowPattern(cfg || { damVal: 8, duration: 6.5 }); },
            "glitchBSODCrash": function(cfg) { return new GlitchBSODCrashPattern(cfg || { damVal: 12, duration: 7.2 }); },
            "glitchNullPointer": function(cfg) { return new GlitchNullPointerPattern(cfg || { damVal: 10, duration: 6.5 }); },
            "glitchHexRain": function(cfg) { return new GlitchHexRainPattern(cfg || { damVal: 8, duration: 6.5 }); },
            "glitchFormatDrive": function(cfg) { return new GlitchFormatDrivePattern(cfg || { damVal: 10, duration: 7.0 }); },
            "glitchKernelPanic": function(cfg) { return new GlitchKernelPanicPattern(cfg || { damVal: 10, duration: 7.0 }); },
            "glitchScreenTear": function(cfg) { return new GlitchScreenTearPattern(cfg || { damVal: 9, duration: 7.0 }); },
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
        } else if (patternName === "godzillaAtomicBreath") {
            w = 340; h = 320; // Expanded to hide behind rocks
        } else if (patternName === "godzillaTailWhip") {
            w = 420; h = 200; // Wide box for tail sweeping
        } else if (patternName === "godzillaNuclearPulse") {
            w = 280; h = 280; // Square box for dodging circles
        } else if (patternName === "godzillaSpineLasers") {
            w = 300; h = 300; // Large square for laser grid
        } else if (patternName === "godzillaAtomicCrush") {
            w = 280; h = 280; // Square for jaws slam
        } else if (patternName === "godzillaRadioactiveFissure") {
            w = 340; h = 250; // Wider box for fissure erupting
        } else if (patternName === "godzillaNuclearMeltdown") {
            w = 300; h = 300; // Large square for vortex + spirals
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
        } else if (patternName === "sachielWaterBlast") {
            w = 320; h = 260; // Wide enough for geysers
        } else if (patternName === "sachielEyeSpark") {
            w = 260; h = 260; // Fast bouncing sparks
        } else if (patternName === "sachielRibCage") {
            w = 350; h = 240; // Wide to allow ribs to close in
        } else if (patternName === "sachielCrossExplosion") {
            w = 300; h = 300; // Big square for crosses
        } else if (patternName === "sachielAtField") {
            w = 280; h = 280; // AT Field crush
        } else if (patternName === "sachielLonginus") {
            w = 360; h = 360; // Huge box to dodge the massive lance
        } else if (patternName === "sachielCoreLaser") {
            w = 350; h = 300; // Wide to run away from laser
        } else if (patternName === "sachielRegeneration") {
            w = 280; h = 280; // Fleshy walls
        } else if (patternName === "sachielHaloCrush") {
            w = 300; h = 300; // Shrinking halo
        } else if (patternName === "sachielBloodRain") {
            w = 300; h = 350; // Tall box for falling blood
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
        } else if (patternName === "vaderLethalStrike") {
            w = 260; h = 260;
        } else if (patternName === "vaderForcePush") {
            w = 340; h = 180;
        } else if (patternName === "vaderForceCrush") {
            w = 400; h = 160;
        } else if (patternName === "vaderTIEStrike") {
            w = 280; h = 280;
        } else if (patternName === "vaderStormtrooper") {
            w = 280; h = 280;
        } else if (patternName === "vaderForceLevitation") {
            w = 300; h = 300;
        } else if (patternName === "vaderDeathStarLaser") {
            w = 400; h = 180;
        } else if (patternName === "vaderForcePull") {
            w = 300; h = 300;
        } else if (patternName === "vaderSaberShield") {
            w = 280; h = 280;
        } else if (patternName === "vaderImperialMarch") {
            w = 320; h = 260;
        } else if (patternName === "vaderRedemptionShock") {
            w = 300; h = 300;
        } else if (patternName === "vaderDarkPresence") {
            w = 320; h = 320;
        } else if (patternName === "glitchErrorWindows") {
            w = 300; h = 300;
        } else if (patternName === "glitchMissingTexture") {
            w = 320; h = 320;
        } else if (patternName === "glitchCodeRain") {
            w = 320; h = 320;
        } else if (patternName === "glitchCoordinateWarp") {
            w = 300; h = 300;
        } else if (patternName === "glitchFlickerShards") {
            w = 320; h = 320;
        } else if (patternName === "glitchStaticBarrier") {
            w = 320; h = 320;
        } else if (patternName === "glitchSpamWarning") {
            w = 300; h = 300;
        } else if (patternName === "glitchBBoxMorph") {
            w = 340; h = 280;
        } else if (patternName === "glitchDualSoul") {
            w = 320; h = 320;
        } else if (patternName === "glitchRGBVectorSplit") {
            w = 320; h = 320;
        } else if (patternName === "glitchMemoryLeak") {
            w = 320; h = 280;
        } else if (patternName === "glitchBufferOverflow") {
            w = 320; h = 320;
        } else if (patternName === "glitchBSODCrash") {
            w = 350; h = 300;
        } else if (patternName === "glitchNullPointer") {
            w = 320; h = 320;
        } else if (patternName === "glitchHexRain") {
            w = 320; h = 320;
        } else if (patternName === "glitchFormatDrive") {
            w = 350; h = 280;
        } else if (patternName === "glitchKernelPanic") {
            w = 340; h = 300;
        } else if (patternName === "glitchScreenTear") {
            w = 320; h = 320;
        }

        return { patternName: patternName, width: w, height: h };
    }

    // Start a new attack turn
    function startAttack(enemy, battleBox, patternName) {
        turnCount++;
        currentPattern = createPattern(patternName);
        if (currentPattern) {
            currentPattern.generateBullets(battleBox);
            if (typeof Player !== "undefined" && Player.consumeNextAttackHalfDuration()) {
                if (currentPattern.duration) {
                    currentPattern.duration = Math.max(1, currentPattern.duration / 2);
                }
            }
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
        try {
            currentPattern.update(dt);
        } catch (e) {
            console.error("[BossController] Pattern update error:", e);
            // Gracefully end the attack instead of freezing
            isAttacking = false;
            currentPattern = null;
            return true;
        }

        // Karma update
        if (enemy && enemy.karmaEnabled) {
            Player.updateKarma(dt);
        }

        // Check collision with soul
        if (Soul.isOkay()) {
            var soulPos = Soul.getPos();
            var dmg = 0;
            try {
                dmg = currentPattern.checkCollision(
                    soulPos.x, soulPos.y, Soul.getWidth(), Soul.getHeight());
            } catch (e) {
                console.error("[BossController] Pattern collision error:", e);
                dmg = 0;
            }
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
                    
                    // Item Effect: Espejo del Vacío (Reflection)
                    if (typeof Player !== 'undefined' && Player.getReflectionRate && Player.getReflectionRate() > 0) {
                        var reflectDmg = Math.floor(finalDmg * Player.getReflectionRate());
                        if (enemy && enemy.mercyHP !== undefined) {
                            enemy.mercyHP = Math.max(0, enemy.mercyHP - reflectDmg);
                            Sound.playSound("ting", true); // Feedback sound
                        }
                    }
                }
            }
        }

        // Check if pattern is done
        var patternOver = false;
        try {
            patternOver = currentPattern.isOver();
        } catch (e) {
            console.error("[BossController] Pattern isOver error:", e);
            patternOver = true;
        }
        if (patternOver) {
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
            try {
                currentPattern.draw(ctx);
            } catch (e) {
                console.error("[BossController] Pattern draw error:", e);
                // Gracefully end the attack instead of freezing
                isAttacking = false;
                currentPattern = null;
            }
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
