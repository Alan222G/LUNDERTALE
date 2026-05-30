// effects.js — Screen shake and visual effects for LUNDERTALE
screen.fontSmoothingEnabled = false;

var cvsEff, cvsX = 0, cvsY = 0, deg = 0, effI = 0;
var shakeEnabled = false;
var shakeIntensity = 3;
var blackFlashTimer = 0;

function initEffects() {
    cvsEff = document.getElementById('cvs').style;
}

var Effects = function() {
    // 1. Shake logic
    if (shakeEnabled) {
        effI++;
        cvsX = Math.floor(Math.random() * shakeIntensity * 2) - shakeIntensity;
        cvsY = Math.floor(Math.random() * shakeIntensity * 2) - shakeIntensity;
        deg = Math.cos(effI / 20) * 2;
        cvsEff.marginLeft = cvsX + 'px';
        cvsEff.marginTop = cvsY + 'px';
        cvsEff.transform = 'rotate(' + deg + 'deg)';
    } else {
        cvsEff.marginLeft = '0px';
        cvsEff.marginTop = '0px';
        cvsEff.transform = 'rotate(0deg)';
    }

    // 2. Black Flash Filter logic (inverse colors, high contrast, red/dark shift)
    if (blackFlashTimer > 0) {
        blackFlashTimer -= 10;
        var filterStr = "invert(100%) hue-rotate(180deg) contrast(150%) saturate(150%)";
        cvsEff.filter = filterStr;
        cvsEff.webkitFilter = filterStr;
    } else {
        cvsEff.filter = "";
        cvsEff.webkitFilter = "";
    }
};

// Trigger a shake for a duration (ms)
function triggerShake(intensity, durationMs) {
    shakeIntensity = intensity || 3;
    shakeEnabled = true;
    setTimeout(function() {
        shakeEnabled = false;
    }, durationMs || 300);
}

// Trigger screen-wide negative flash and violent shake for Black Flash
function triggerBlackFlash() {
    blackFlashTimer = 450;
    triggerShake(12, 450);
}

