// player.js — Player stats module for LUNDERTALE
var Player = (function() {
    var weapon, armor, hpCur, hpMax;
    var baseSpd = 1.0, baseDef = 1.0, baseAtk = 1.0;
    var buffSpd = 1.0, buffDef = 1.0, buffAtk = 1.0;
    var soulClass = 0; // 0=Red, 1=Green, 2=Yellow, 3=Purple

    // Item/Passive Effects
    var invulnerableTurns = 0;
    var reflectionTurns = 0, reflectionRate = 0;
    var noSmallHeals = false;
    var permanentGravityDust = false;
    var nextAttackHalfDuration = false;
    var shieldCharges = 0, shieldTurns = 0;
    var healMultiplier = 1.0;
    var selfPoison = 0, poisonEnemy = false;
    var regenAmount = 0, regenTurns = 0;
    var nextBoxBigger = false;
    
    var phoenixEggActive = false;
    var hyperCoffee = false;
    var thornShield = false;
    var gravityAnchor = false;
    var shrunk = false;
    var giant = false;
    var magnetActive = false;
    var noHorizontalMovement = false;
    
    // Pop Culture Heart States
    var mahoragaDefStack = 0;
    var mahoragaAdaptations = {};
    var mahoragaWheelSpinTimer = 0;
    var gojoTurns = 0;
    var subaruRevives = 3;
    var hitboxScaleOverride = 1.0;
    var hitboxScaleTurns = 0;
    
    var activeSpdBuffs = []; // {val: 0.3, turns: 1}
    var activeDefBuffs = [];
    var activeAtkBuffs = [];

    function init() {
        weapon = {};
        armor = {};
        
        // Reset all crazy effects on new combat/init
        invulnerableTurns = 0; reflectionTurns = 0; reflectionRate = 0;
        noSmallHeals = false; permanentGravityDust = false; nextAttackHalfDuration = false;
        shieldCharges = 0; shieldTurns = 0; healMultiplier = 1.0;
        selfPoison = 0; poisonEnemy = false; regenAmount = 0; regenTurns = 0;
        nextBoxBigger = false;
        
        phoenixEggActive = false;
        hyperCoffee = false;
        thornShield = false;
        gravityAnchor = false;
        shrunk = false;
        giant = false;
        magnetActive = false;
        noHorizontalMovement = false;
        
        mahoragaDefStack = 0;
        mahoragaAdaptations = {};
        mahoragaWheelSpinTimer = 0;
        gojoTurns = 3; // Gojo starts with Infinity charged!
        subaruRevives = 3;
        hitboxScaleOverride = 1.0;
        hitboxScaleTurns = 0;
        
        activeSpdBuffs = []; activeDefBuffs = []; activeAtkBuffs = [];
        
        setSoulClass(soulClass || 0); // Keep current class, just reset HP and buffs

        // Passives based on soulClass
        if (soulClass === 7) { selfPoison = 1.0; } // Caffeine Heart
        if (soulClass === 8) { magnetActive = true; } // Magnetic Heart
    }

    function setSoulClass(classId) {
        soulClass = classId;
        switch (classId) {
            case 0: hpMax = 120; baseSpd = 1.0; baseAtk = 1.0; baseDef = 1.0; break;
            case 1: hpMax = 180; baseSpd = 0.8; baseAtk = 0.8; baseDef = 1.3; break;
            case 2: hpMax = 80;  baseSpd = 1.3; baseAtk = 1.4; baseDef = 0.7; break;
            case 3: hpMax = 100; baseSpd = 1.5; baseAtk = 1.0; baseDef = 1.0; break;
            case 4: hpMax = 120; baseSpd = 1.2; baseAtk = 1.0; baseDef = 1.0; break;
            case 5: hpMax = 110; baseSpd = 1.6; baseAtk = 1.1; baseDef = 0.8; break;
            case 6: hpMax = 140; baseSpd = 0.9; baseAtk = 1.0; baseDef = 1.2; break;
            case 7: hpMax = 110; baseSpd = 1.8; baseAtk = 1.1; baseDef = 0.8; break; // Cafeina
            case 8: hpMax = 90;  baseSpd = 1.0; baseAtk = 1.0; baseDef = 1.0; break; // Magnetico
            case 9: hpMax = 100; baseSpd = 1.0; baseAtk = 1.0; baseDef = 0.8; break; // Cristalino
            case 10: hpMax = 90;  baseSpd = 1.1; baseAtk = 1.2; baseDef = 1.0; break; // Vampire
            case 11: hpMax = 100; baseSpd = 1.0; baseAtk = 1.0; baseDef = 1.0; break; // Chaos
            case 12: hpMax = 120; baseSpd = 1.0; baseAtk = 1.0; baseDef = 1.0; break; // Divergent zilla
            case 13: hpMax = 110; baseSpd = 1.0; baseAtk = 1.0; baseDef = 1.0; break; // Eva 01
            case 14: hpMax = 90;  baseSpd = 1.2; baseAtk = 1.0; baseDef = 1.0; break; // Gojo
            case 15: hpMax = 70;  baseSpd = 1.0; baseAtk = 1.0; baseDef = 1.0; break; // Subaru (Retorno por Muerte)
            case 16: hpMax = 150; baseSpd = 1.0; baseAtk = 1.6; baseDef = 1.4; break; // All Might (One For All)
        }
        hpCur = hpMax;
        recalculateBuffs();
    }

    function recalculateBuffs() {
        buffSpd = baseSpd; buffDef = baseDef; buffAtk = baseAtk;
        for (var i = 0; i < activeSpdBuffs.length; i++) buffSpd += activeSpdBuffs[i].val;
        for (var i = 0; i < activeDefBuffs.length; i++) buffDef += activeDefBuffs[i].val;
        for (var i = 0; i < activeAtkBuffs.length; i++) buffAtk += activeAtkBuffs[i].val;
        
        if (permanentGravityDust) {
            buffSpd += 0.3;
        }

        // Eva 01 Berserk Mode (under 30% HP)
        if (soulClass === 13 && hpCur < hpMax * 0.3) {
            buffAtk += 1.0; // +100% ATK in Berserk
            buffSpd += 0.5; // +50% SPD in Berserk
        }
    }

    function resetBuffs() {
        // This is called at the end of the enemy's attack turn
        // Decrement durations
        if (invulnerableTurns > 0) invulnerableTurns--;
        if (reflectionTurns > 0) reflectionTurns--;
        if (shieldTurns > 0) shieldTurns--;
        if (regenTurns > 0) {
            heal(regenAmount);
            regenTurns--;
        }
        
        if (noHorizontalMovement) noHorizontalMovement = false;
        if (thornShield) thornShield = false;
        if (gravityAnchor) gravityAnchor = false;
        if (shrunk) shrunk = false;
        if (giant) giant = false;
        if (hyperCoffee) hyperCoffee = false;
        if (magnetActive) magnetActive = false;

        // Decrement hitbox scale turns
        if (hitboxScaleTurns > 0) {
            hitboxScaleTurns--;
            if (hitboxScaleTurns <= 0) {
                hitboxScaleOverride = 1.0;
            }
        }

        // Refresh/Restore passives based on active soulClass
        if (soulClass === 7) { selfPoison = 1.0; } // Caffeine Heart poison
        if (soulClass === 8) { magnetActive = true; } // Magnetic Heart pull
        
        // Gojo Infinity charging
        if (soulClass === 14) {
            gojoTurns++;
        }

        if (soulClass === 11) { // Chaos Heart (Rainbow)
            // Chaos Heart: random soul mode
            if (typeof Soul !== "undefined" && Soul.setSoulMode) {
                var modes = [Soul.SOUL_MODE.RED, Soul.SOUL_MODE.BLUE, Soul.SOUL_MODE.YELLOW, Soul.SOUL_MODE.INVERSE];
                var randMode = modes[Math.floor(Math.random() * modes.length)];
                Soul.setSoulMode(randMode);
            }
            // Chaos Heart: random stats
            baseSpd = 0.5 + Math.random() * 1.5;
            baseAtk = 0.5 + Math.random() * 1.5;
            baseDef = 0.5 + Math.random() * 1.5;
        }

        // All Might fatigue: HP max decays 3 per turn (minimum 60)
        if (soulClass === 16) {
            hpMax = Math.max(60, hpMax - 3);
            hpCur = Math.min(hpCur, hpMax);
        }
        
        // Decrement buff arrays
        for (var i = activeSpdBuffs.length - 1; i >= 0; i--) {
            activeSpdBuffs[i].turns--;
            if (activeSpdBuffs[i].turns <= 0) activeSpdBuffs.splice(i, 1);
        }
        for (var i = activeDefBuffs.length - 1; i >= 0; i--) {
            activeDefBuffs[i].turns--;
            if (activeDefBuffs[i].turns <= 0) activeDefBuffs.splice(i, 1);
        }
        for (var i = activeAtkBuffs.length - 1; i >= 0; i--) {
            activeAtkBuffs[i].turns--;
            if (activeAtkBuffs[i].turns <= 0) activeAtkBuffs.splice(i, 1);
        }
        recalculateBuffs();
    }

    function getSoulClass() { return soulClass; }
    function getWeapon() { return weapon; }
    function getArmor() { return armor; }
    function getHPCur() { return hpCur; }
    function getHPMax() { return hpMax; }
    function setHP(val) { hpCur = clamp(val, 0, hpMax); }

    function heal(value) {
        if (noSmallHeals && value < 999) return false;
        
        var actualHeal = value * healMultiplier;
        Sound.playSound("heal", true);
        hpCur += actualHeal;
        
        // Mirror Colossus healing refraction copying passive
        if (typeof Cgroup !== "undefined") {
            var enemyObj = Cgroup.getEnemy(0);
            if (enemyObj && enemyObj.name === "Coloso de Espejos") {
                enemyObj.curHP = Math.min(enemyObj.maxHP, enemyObj.curHP + actualHeal);
                console.log("Coloso de Espejos copied and refracted player healing: +" + actualHeal + " HP.");
            }
        }

        if (hpCur >= hpMax) {
            hpCur = hpMax;
            return true;
        }
        return false;
    }

    function checkRevive() {
        if (phoenixEggActive) {
            phoenixEggActive = false;
            hpMax = Math.floor(hpMax / 2);
            if (hpMax < 20) hpMax = 20; // Asegurar vida jugable mínima
            hpCur = hpMax;
            Sound.playSound("heal", true);
            console.log("PHOENIX EGG: Revived!");
            return true; // ¡Resucitado!
        }
        // Subaru — Retorno por Muerte (up to 3 revives per combat, preserves base stats)
        if (soulClass === 15 && subaruRevives > 0) {
            subaruRevives--;
            hpCur = Math.max(1, Math.floor(hpMax * 0.15)); // Revive at 15% HP
            invulnerableTurns = 2; // 2 seconds of invulnerability
            Sound.playSound("heal", true);
            if (typeof Soul !== "undefined" && Soul.addFloatingText) {
                var sPos = Soul.getPos();
                Soul.addFloatingText("RETURN BY DEATH", sPos.x + Soul.getWidth() / 2, sPos.y - 12, "#00BFFF");
            }
            console.log("SUBARU: Return by Death! Revives left: " + subaruRevives);
            return true; // ¡Resucitado!
        }
        return false;
    }

    function damage(value, attackName) {
        if (invulnerableTurns > 0) return false; // Immune
        
        if (shieldCharges > 0) {
            shieldCharges--;
            Sound.playSound("ting", true);
            return false; // Absorbed
        }

        if (thornShield) {
            thornShield = false;
            Sound.playSound("ting", true);
            var enemy = Cgroup.getEnemy(0);
            if (enemy) {
                enemy.mercyHP = Math.max(0, enemy.mercyHP - 30);
            }
            return false; // Blocked by thorn shield
        }

        // Gojo Infinity passive (blocks 1 hit every 4 turns)
        if (soulClass === 14 && gojoTurns >= 4) {
            gojoTurns = 0;
            Sound.playSound("ting", true);
            if (typeof Soul !== "undefined" && Soul.addFloatingText) {
                var sPos = Soul.getPos();
                Soul.addFloatingText("INFINITY", sPos.x + Soul.getWidth() / 2, sPos.y - 12, "#00FFFF");
            }
            console.log("INFINITY: Gojo blocked the hit!");
            return false;
        }

        // Divergent zilla adaptation (stack +30% DEF on hit, up to +150%)
        if (soulClass === 12) {
            if (mahoragaDefStack < 5) {
                mahoragaDefStack++;
                baseDef += 0.30;
                recalculateBuffs();
                console.log("MAHORAGA ADAPTED: Stack " + mahoragaDefStack + " (+ " + (mahoragaDefStack * 30) + "% DEF)");
            }
            mahoragaWheelSpinTimer = 2.0; // spin fast
            if (typeof Soul !== "undefined" && Soul.addFloatingText) {
                var sPos = Soul.getPos();
                Soul.addFloatingText("ADAPTED", sPos.x + Soul.getWidth() / 2, sPos.y - 12, "#FFD700");
            }
        }

        var dmg = value;
        if (permanentGravityDust) dmg *= 1.2;
        
        // Apply defense reduction
        dmg = Math.ceil(dmg / buffDef);

        Sound.playSound("damage", true);
        hpCur -= dmg;
        if (hpCur <= 0) {
            if (checkRevive()) {
                return false; // Revived!
            }
            hpCur = 0;
            return true; // Dead
        }
        return false;
    }

    // Karma damage (gradual drain)
    var karmaBuffer = 0;
    var bleedTimer = 0;

    function addKarma(amount) { karmaBuffer += amount; }
    
    function addBleed(seconds) {
        bleedTimer = seconds; // Overwrite so it doesn't stack infinitely
    }
    function getBleedTimer() { return bleedTimer; }
    
    function updateKarma(dt) {
        if (karmaBuffer > 0) {
            var drain = Math.min(karmaBuffer, 8 * dt);
            hpCur -= drain;
            karmaBuffer -= drain;
            if (hpCur <= 0) {
                if (checkRevive()) return false;
                hpCur = 0;
                return true;
            }
        }
        
        if (bleedTimer > 0) {
            bleedTimer -= dt;
            // Drain 1 HP per second
            hpCur -= (1.0 * dt);
            if (hpCur <= 0) {
                if (checkRevive()) return false;
                hpCur = 0;
                return true;
            }
        }
        
        if (selfPoison > 0) {
            hpCur -= (selfPoison * dt);
            if (hpCur <= 0) {
                if (checkRevive()) return false;
                hpCur = 0;
                return true;
            }
        }
        
        // Eva 01 Berserk regeneration (4 HP/sec under 30% HP)
        if (soulClass === 13 && hpCur < hpMax * 0.3) {
            hpCur = Math.min(hpMax, hpCur + 4.0 * dt);
        }
        
        // Decrement Mahoraga wheel spin timer
        if (mahoragaWheelSpinTimer > 0) {
            mahoragaWheelSpinTimer = Math.max(0, mahoragaWheelSpinTimer - dt);
        }
        
        return false;
    }
    function getKarma() { return karmaBuffer; }

    return {
        init: init,
        getWeapon: getWeapon, getArmor: getArmor,
        getHPCur: getHPCur, getHPMax: getHPMax, setHP: setHP,
        heal: heal, damage: damage,
        addKarma: addKarma, updateKarma: updateKarma, getKarma: getKarma,
        addBleed: addBleed, getBleedTimer: getBleedTimer,
        resetBuffs: resetBuffs,
        
        getBuffSpd: function() { return buffSpd; },
        addBuffSpd: function(val, turns) { activeSpdBuffs.push({val: val, turns: turns || 1}); recalculateBuffs(); },
        getBuffDef: function() { return buffDef; },
        addBuffDef: function(val, turns) { activeDefBuffs.push({val: val, turns: turns || 1}); recalculateBuffs(); },
        getBuffAtk: function() { return buffAtk; },
        addBuffAtk: function(val, turns) { activeAtkBuffs.push({val: val, turns: turns || 1}); recalculateBuffs(); },
        
        setSoulClass: setSoulClass, getSoulClass: getSoulClass,
        
        // Crazy Items Effects:
        setInvulnerable: function(turns) { invulnerableTurns = turns; },
        setReflection: function(rate, turns) { reflectionRate = rate; reflectionTurns = turns; },
        getReflectionRate: function() { 
            if (soulClass === 9) return 0.30; // Crystal is class 9
            return reflectionTurns > 0 ? reflectionRate : 0; 
        },
        setNoSmallHeals: function(val) { noSmallHeals = val; },
        setPermanentGravityDust: function() { permanentGravityDust = true; recalculateBuffs(); },
        isPermanentGravityDust: function() { return permanentGravityDust; },
        setNextAttackHalfDuration: function() { nextAttackHalfDuration = true; },
        consumeNextAttackHalfDuration: function() { if (nextAttackHalfDuration) { nextAttackHalfDuration = false; return true; } return false; },
        setShieldCharges: function(charges, turns) { shieldCharges = charges; shieldTurns = turns; },
        addHealMultiplier: function(val) { healMultiplier += val; },
        setSelfPoison: function(val) { selfPoison = val; },
        setPoisonEnemy: function(val) { poisonEnemy = val; },
        isPoisonEnemy: function() { return poisonEnemy; },
        setRegen: function(amount, turns) { regenAmount = amount; regenTurns = turns; },
        setNextBoxBigger: function(val) { nextBoxBigger = val; },
        consumeNextBoxBigger: function() { if (nextBoxBigger) { nextBoxBigger = false; return true; } return false; },
        
        // Brand New Dynamic Item Effects:
        setPhoenixEggActive: function(val) { phoenixEggActive = val; },
        setHyperCoffee: function(val) { hyperCoffee = val; if (val) { Player.addBuffSpd(1.0, 2); } },
        isHyperCoffee: function() { return hyperCoffee; },
        setThornShield: function(val) { thornShield = val; },
        isThornShield: function() { return thornShield; },
        setGravityAnchor: function(val) { gravityAnchor = val; },
        isGravityAnchor: function() { return gravityAnchor; },
        setShrunk: function(val) { shrunk = val; },
        isShrunk: function() { return shrunk; },
        setGiant: function(val) { giant = val; },
        isGiant: function() { return giant; },
        setMagnetActive: function(val) { magnetActive = val; },
        isMagnetActive: function() { return magnetActive || soulClass === 8; },
        setNoHorizontalMovement: function(val) { noHorizontalMovement = val; },
        isNoHorizontalMovement: function() { return noHorizontalMovement; },
        reduceMaxHP: function(amount) { hpMax = Math.max(20, hpMax - amount); hpCur = Math.min(hpCur, hpMax); },
        getBulletSpeedMultiplier: function() {
            if (soulClass === 14) { // Gojo Six Eyes
                if (typeof myKeys !== "undefined" && myKeys.isCancel()) {
                    return 0.60;
                }
                return 0.85;
            }
            return 1.0;
        },
        getHitboxScaleMultiplier: function() { return hitboxScaleOverride; },
        setHitboxScaleMultiplier: function(val, turns) { hitboxScaleOverride = val; hitboxScaleTurns = turns; },
        getGojoTurns: function() { return gojoTurns; },
        getMahoragaWheelSpinTimer: function() { return mahoragaWheelSpinTimer; },
        getSubaruRevives: function() { return subaruRevives; }
    };
}());
