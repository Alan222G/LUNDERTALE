// effects.js — Screen shake and visual effects for LUNDERTALE
screen.fontSmoothingEnabled = false;

var cvsEff, cvsX = 0, cvsY = 0, deg = 0, effI = 0;
var shakeEnabled = false;
var shakeIntensity = 3;

function initEffects() {
    cvsEff = document.getElementById('cvs').style;
}

var Effects = function() {
    if (!shakeEnabled) {
        cvsEff.marginLeft = '0px';
        cvsEff.marginTop = '0px';
        cvsEff.transform = 'rotate(0deg)';
        return;
    }
    effI++;
    cvsX = Math.floor(Math.random() * shakeIntensity * 2) - shakeIntensity;
    cvsY = Math.floor(Math.random() * shakeIntensity * 2) - shakeIntensity;
    deg = Math.cos(effI / 20) * 2;
    cvsEff.marginLeft = cvsX + 'px';
    cvsEff.marginTop = cvsY + 'px';
    cvsEff.transform = 'rotate(' + deg + 'deg)';
};

// Trigger a shake for a duration (ms)
function triggerShake(intensity, durationMs) {
    shakeIntensity = intensity || 3;
    shakeEnabled = true;
    setTimeout(function() {
        shakeEnabled = false;
    }, durationMs || 300);
}
