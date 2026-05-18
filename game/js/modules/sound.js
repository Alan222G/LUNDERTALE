// sound.js — Audio manager for LUNDERTALE
// Ported from Under-Ground-Engine
var Sound = (function() {
    var pauser;

    function init(volume) {
        var sounds = document.querySelector("#audio").children;
        for (var i = 0; i < sounds.length; i++) {
            sounds[i].volume = volume;
        }
    }

    function update() {
        if (pauser != undefined) {
            var sound = document.querySelector("#" + pauser[0]);
            if (sound && Math.floor(sound.currentTime * 1000) % pauser[1] > 50) {
                sound.pause();
                pauser = undefined;
            }
        }
    }

    function playSound(id, disrupt) {
        var sound = document.querySelector("#" + id);
        if (!sound) return;
        if (disrupt) {
            sound.pause();
            sound.currentTime = 0;
        }
        sound.play().catch(function() {});
        pauser = undefined;
    }

    function pauseSound(id, step) {
        step = 70;
        pauser = [id, step];
    }

    function pauseSoundHard(id) {
        var sound = document.querySelector("#" + id);
        if (sound) sound.pause();
        pauser = undefined;
    }

    return {
        init: init,
        update: update,
        playSound: playSound,
        pauseSound: pauseSound,
        pauseSoundHard: pauseSoundHard,
    };
}());
