// cattack.js — Player attack minigame (rhythm bar) for LUNDERTALE
// Ported from Under-Ground-Engine
var Cattack = (function() {
    var attackBox;
    var attackState;
    var ATTACK_STATE = Object.freeze({
        HIT: 0, SMASH: 1, DAMAGE: 2, DAMAGEMISS: 3, DELAY: 4, DELAYMISS: 5,
    });
    var attackBars, attackFades, attackBoxOpacity, totalDamage, durationCounter, duration;
    var healthTemp, healthBarPos, healthBarWidth, healthBarVel, healthTextPos, healthTextVel, healthTextAcc;

    function init() { attackBox = document.getElementById("attack_box"); }

    function setup() {
        attackBars = [87, 0 - Math.random() * 75];
        attackBars.push(attackBars[1] - 30 - Math.random() * 75);
        attackFades = [];
        attackState = ATTACK_STATE.HIT;
        attackBoxOpacity = 1;
        totalDamage = 0;
        var em = Combat.getSelectStateEnemy();
        healthTemp = Cgroup.getCurHP(em);
        healthBarWidth = Cgroup.getMaxHP(em);
        healthBarPos = Cgroup.getDamagePos(em).get();
        healthBarPos.x -= healthBarWidth / 2;
        healthBarVel = Cgroup.getDamageVel(em);
        healthTextPos = Cgroup.getDamagePos(em).get();
        healthTextPos.y -= 32;
        healthTextVel = -160;
        healthTextAcc = 500;
    }

    function update(dt) {
        switch (attackState) {
            case ATTACK_STATE.HIT:
                if (myKeys.isConfirm()) {
                    var hit = attackBars[0];
                    var damage = Math.max(0, 282 - Math.abs(hit - 370));
                    if (damage > 280) {
                        damage *= 1.5;
                        attackFades.push([hit, 1, 1]);
                    } else {
                        attackFades.push([hit, 0, 1]);
                    }
                    damage *= (Player.getBuffAtk ? Player.getBuffAtk() : 1.0);
                    damage = Math.floor(damage);
                    totalDamage += damage;
                    attackBars.splice(0, 1);
                    if (attackBars.length > 0) {
                        Sound.playSound(damage < 280 ? "hit_1" : "hit_1_crit", true);
                    } else {
                        Sound.playSound(damage < 280 ? "hit_2" : "hit_2_crit", true);
                    }
                }
                if (attackBars.length < 1 || attackBars[attackBars.length - 1] > 740) {
                    durationCounter = 0; duration = 1.2;
                    attackState = ATTACK_STATE.SMASH;
                }
                for (var i = 0; i < attackBars.length; i++) attackBars[i] += 480 * dt;
                break;
            case ATTACK_STATE.SMASH:
                attackBoxOpacity -= 2 * dt;
                if (attackBoxOpacity < 0) attackBoxOpacity = 0;
                durationCounter += dt;
                if (durationCounter > duration) {
                    if (totalDamage > 0) {
                        healthBarVel = totalDamage / 0.3;
                        totalDamage = totalDamage.toString();
                        for (var i = 0; i < totalDamage.length; i++) {
                            healthTextPos.x -= (totalDamage.charAt(i) == 1) ? 10 : 16;
                        }
                        Cgroup.dealDamage(Combat.getSelectStateEnemy(), totalDamage);
                        Sound.playSound("impact", true);
                        triggerShake(5, 300);
                        attackState = ATTACK_STATE.DAMAGE;
                    } else {
                        healthTextPos.x -= 59;
                        attackState = ATTACK_STATE.DAMAGEMISS;
                    }
                }
                break;
            case ATTACK_STATE.DAMAGEMISS:
            case ATTACK_STATE.DAMAGE:
                healthTextVel += healthTextAcc * dt;
                healthTextPos.y += healthTextVel * dt;
                if (healthTextPos.y > healthBarPos.y - 32 && healthTextVel > 0) {
                    healthTextPos.y = healthBarPos.y - 32;
                    healthTextVel = 0; healthTextAcc = 0;
                }
                healthTemp -= healthBarVel * dt;
                if (healthTemp < Cgroup.getCurHP(Combat.getSelectStateEnemy())) {
                    healthTemp = Cgroup.getCurHP(Combat.getSelectStateEnemy());
                }
                if (healthTemp <= Cgroup.getCurHP(Combat.getSelectStateEnemy()) && !healthTextAcc) {
                    durationCounter = 0;
                    if (totalDamage > 0) { attackState = ATTACK_STATE.DELAY; duration = 0.1; }
                    else { attackState = ATTACK_STATE.DELAYMISS; duration = 0.25; }
                }
                break;
            case ATTACK_STATE.DELAYMISS:
            case ATTACK_STATE.DELAY:
                durationCounter += dt;
                if (durationCounter > duration) return true;
                break;
        }
        for (var i = 0; i < attackFades.length; i++) {
            attackFades[i][2] -= 2 * dt;
            if (attackFades[i][2] < 0) attackFades[i][2] = 0;
        }
        return false;
    }

    function draw(ctx) {
        ctx.save();
        ctx.globalAlpha = attackBoxOpacity;
        ctx.drawImage(attackBox, 87, 355);
        ctx.restore();
        ctx.save();
        switch (attackState) {
            case ATTACK_STATE.HIT:
                ctx.lineWidth = 4;
                for (var i = 0; i < attackBars.length; i++) {
                    if (i) { ctx.strokeStyle = "#FFF"; ctx.fillStyle = "#000"; }
                    else { ctx.strokeStyle = "#000"; ctx.fillStyle = "#FFF"; }
                    ctx.beginPath();
                    ctx.rect(attackBars[i], 358, 14, 125);
                    ctx.fill(); ctx.stroke();
                }
                break;
            case ATTACK_STATE.DELAY:
            case ATTACK_STATE.DAMAGE:
                // Draw Health Bar
                var em = Combat.getSelectStateEnemy();
                var maxHP = Cgroup.getMaxHP(em);
                var hpRatio = healthTemp / maxHP;
                var drawWidth = 150; // Constrain width to 150 pixels
                
                ctx.fillStyle = "#404040"; ctx.strokeStyle = "#000"; ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.rect(healthBarPos.x - 0.5, healthBarPos.y - 0.5, drawWidth, 15);
                ctx.fill(); ctx.stroke();
                
                ctx.fillStyle = "#0F0";
                ctx.fillRect(healthBarPos.x - 0.5, healthBarPos.y - 0.5, hpRatio * drawWidth, 15);
                
                // Draw Damage Numbers
                var subPos = healthTextPos.get();
                for (var i = 0; i < totalDamage.length; i++) {
                    ctx.drawImage(document.getElementById("d" + totalDamage.charAt(i)), subPos.x, subPos.y);
                    subPos.x += (totalDamage.charAt(i) == 1) ? 20 : 32;
                }
                break;
            case ATTACK_STATE.DELAYMISS:
            case ATTACK_STATE.DAMAGEMISS:
                ctx.drawImage(document.getElementById("miss"), healthTextPos.x, healthTextPos.y);
                break;
        }
        for (var i = 0; i < attackFades.length; i++) {
            ctx.save();
            ctx.globalAlpha = attackFades[i][2];
            switch (attackFades[i][1]) {
                case 0: ctx.fillStyle = "#0FF"; break;
                case 1:
                    ctx.fillStyle = (Math.floor(attackFades[i][2] * 6) % 2) ? "#F80" : "#0F0";
                    break;
            }
            ctx.beginPath();
            ctx.rect(attackFades[i][0] - (1 - attackFades[i][2]) * 5,
                358 - (1 - attackFades[i][2]) * 40,
                14 + (1 - attackFades[i][2]) * 10,
                125 + (1 - attackFades[i][2]) * 80);
            ctx.fill(); ctx.restore();
        }
        ctx.restore();
    }

    return { init: init, setup: setup, update: update, draw: draw };
}());
