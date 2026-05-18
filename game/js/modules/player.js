// player.js — Player stats module for LUNDERTALE
var Player = (function() {
    var weapon, armor, hpCur, hpMax;
    var buffSpd = 1.0, buffDef = 1.0, buffAtk = 1.0;

    function init() {
        weapon = {};
        armor = {};
        hpMax = 120;
        hpCur = hpMax;
        buffSpd = 1.0;
        buffDef = 1.0;
        buffAtk = 1.0;
    }

    function getWeapon() { return weapon; }
    function getArmor() { return armor; }
    function getHPCur() { return hpCur; }
    function getHPMax() { return hpMax; }
    function setHP(val) { hpCur = clamp(val, 0, hpMax); }

    function heal(value) {
        Sound.playSound("heal", true);
        hpCur += value;
        if (hpCur >= hpMax) {
            hpCur = hpMax;
            return true;
        }
        return false;
    }

    function damage(value) {
        Sound.playSound("damage", true);
        hpCur -= value;
        if (hpCur <= 0) {
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
            if (hpCur <= 0) { hpCur = 0; return true; }
        }
        
        if (bleedTimer > 0) {
            bleedTimer -= dt;
            // Drain 1 HP per second
            hpCur -= (1.0 * dt);
            if (hpCur <= 0) { hpCur = 0; return true; }
        }
        
        return false;
    }
    function getKarma() { return karmaBuffer; }

    return {
        init: init,
        getWeapon: getWeapon,
        getArmor: getArmor,
        getHPCur: getHPCur,
        getHPMax: getHPMax,
        setHP: setHP,
        heal: heal,
        damage: damage,
        addKarma: addKarma,
        updateKarma: updateKarma,
        getKarma: getKarma,
        addBleed: addBleed,
        getBleedTimer: getBleedTimer,
        getBuffSpd: function() { return buffSpd; },
        addBuffSpd: function(val) { buffSpd += val; },
        getBuffDef: function() { return buffDef; },
        addBuffDef: function(val) { buffDef += val; },
        getBuffAtk: function() { return buffAtk; },
        addBuffAtk: function(val) { buffAtk += val; }
    };
}());
