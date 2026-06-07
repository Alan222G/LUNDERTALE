// enemy.js — Configurable Enemy class for LUNDERTALE
// Replaces the hardcoded Cenemy/Cenemy2/Cenemy3 from UGE with a single data-driven class

var Enemy = function(config) {
    // Identity
    this.name = config.name || "Unknown";
    this.checkText = config.checkText || "* Just a regular enemy.";

    // Stats and Dynamic HP Scaling according to guidelines:
    // - Reduce HP by 500 for characters with > 5000 HP.
    // - Reduce HP by 1000 for characters with >= 7000 HP.
    // - For Godzilla, increase the reduction by 200 for each 1000 HP above 7000.
    var isGodzilla = (config.name && config.name.toLowerCase() === "godzilla");
    function adjustHP(hp) {
        if (hp > 5000 && hp < 7000) {
            return hp - 500;
        } else if (hp >= 7000) {
            var reduction = 1000;
            if (isGodzilla) {
                var extraThousands = Math.floor((hp - 7000) / 1000);
                reduction += 200 * extraThousands;
            }
            return hp - reduction;
        }
        return hp;
    }

    var baseMaxHP = config.maxHP || 100;
    this.maxHP = adjustHP(baseMaxHP);
    if (config.curHP) {
        this.curHP = adjustHP(config.curHP);
    } else {
        this.curHP = this.maxHP;
    }

    this.atk = config.atk || 5;
    this.def = config.def || 5;
    this.defense = config.defense || 1; // Damage divisor

    // Combat data
    this.acts = config.acts || ["Check"];
    this.actResponses = config.actResponses || ["* ..."];
    this.actFunctions = config.actFunctions || [function() {}];
    this.texts = config.texts || ["* The enemy stands before you."];
    this.speech = config.speech || ["..."];

    // Boss phases (optional)
    this.phases = config.phases || null;
    if (config.phaseHP) {
        this.phaseHP = config.phaseHP.map(function(hp) {
            return adjustHP(hp);
        });
    } else {
        this.phaseHP = null;
    }
    this.currentPhase = 0;

    // Attack patterns (array of pattern names)
    this.attacks = config.attacks || ["bulletRain"];

    // Karma (residual damage) settings
    this.karmaEnabled = config.karmaEnabled || false;
    this.karmaRate = config.karmaRate || 1;

    // Visual
    this.spriteId = config.spriteId || null;
    this.damageVel = config.damageVel || 120;
    this.damagePos = config.damagePos || new Vect(370, 270, 0);
    this.bubblePos = config.bubblePos || this.damagePos.getAdd(new Vect(0, -160, 0));
    this.bubbleOff = config.bubbleOff || 30;

    // Animation
    this.active = false;
    this.modelPoses = [];
    this.animations = [];

    // Idle jitter
    this.jitterEnabled = config.jitterEnabled || false;
    this.jitterX = 0;
    this.jitterY = 0;

    // Spareable flag
    this.spareable = config.spareable !== undefined ? config.spareable : true;
    this.mercyHP = config.mercyHP || 0;
    this.totalMercyHP = config.mercyHP || 0;

    // Rewards
    this.xpReward = config.xpReward || 0;
    this.goldReward = config.goldReward || 0;
    this.renderType = config.renderType || "sprite";
    this.timeCounter = 0; // used for animation
};

// Getter/setter to scale mercy changes for spareable bosses in Phase 1
Object.defineProperty(Enemy.prototype, "mercyHP", {
    get: function() {
        return this._mercyHP;
    },
    set: function(val) {
        if (this._mercyHP === undefined) {
            this._mercyHP = val;
            this.totalMercyHP = val;
            return;
        }
        var diff = val - this._mercyHP;
        if (diff < 0) {
            // Decrease (Mercy going up / bar filling)
            // Apply scale factor of 0.45 to ensure at least 10 actions are required
            var scale = (this.spareable && this.currentPhase === 0) ? 0.45 : 1.0;
            this._mercyHP = Math.max(0, this._mercyHP + diff * scale);
        } else {
            // Increase (Mercy going down / penalty)
            this._mercyHP = Math.min(this.totalMercyHP || 100, this._mercyHP + diff);
        }
    },
    configurable: true,
    enumerable: true
});

// Add an animation from JSON data
Enemy.prototype.addAnimation = function(text, pos) {
    this.active = true;
    this.modelPoses.push(pos);
    var anim = JSON.parse(text);
    if (anim.image_id === this.spriteId) {
        this.animations.push(new AnimationNum(anim, this.name));
    } else {
        this.animations.push(new Animation(anim));
    }
    this.sortAnimations();
};

// Sort animations by z-index
Enemy.prototype.sortAnimations = function() {
    for (var i = this.animations.length - 1; i > 0; i--) {
        if (this.animations[i].zindex > this.animations[i - 1].zindex) {
            var temp = this.animations[i];
            this.animations[i] = this.animations[i - 1];
            this.animations[i - 1] = temp;
        }
    }
};

// Update
Enemy.prototype.update = function(dt) {
    this.timeCounter += dt;
    if (this.active) {
        for (var i = 0; i < this.animations.length; i++) {
            this.animations[i].update(dt);
        }
    }
    // Idle jitter effect
    if (this.jitterEnabled) {
        this.jitterX = randomRange(-2, 2);
        this.jitterY = randomRange(-1, 1);
    }
    // Update render type from phase
    if (this.phases && this.phases[this.currentPhase]) {
        this.renderType = this.phases[this.currentPhase].renderType || "sprite";
    }
    
    // Itadori Blood Piercing: enemy bleed DOT
    if (this.bleedTimer && this.bleedTimer > 0) {
        this.bleedTimer -= dt;
        this.curHP -= (this.bleedDmg || 5) * dt;
        if (this.curHP < 0) this.curHP = 0;
    }
    
    // Sans poison: enemy poison DOT (20 dmg/sec for 10 sec)
    if (this.sansPoisonTimer && this.sansPoisonTimer > 0) {
        this.sansPoisonTimer -= dt;
        this.curHP -= (this.sansPoisonDmg || 20) * dt;
        if (this.curHP < 0) this.curHP = 0;
    }
};

// Draw
Enemy.prototype.draw = function(ctx) {
    ctx.save();
    ctx.translate(370, 200);
    ctx.scale(1.25, 1.25);
    ctx.translate(-370, -200);
    
    if (this.renderType === "supermassive_blackhole") {
        ctx.save(); ctx.translate(370, 190); ctx.scale(1.5, 1.5); ctx.translate(-370, -190);
        this.drawSupermassiveBlackHole(ctx);
        ctx.restore();
    } else if (this.renderType === "blackhole") {
        ctx.save(); ctx.translate(370, 190); ctx.scale(1.5, 1.5); ctx.translate(-370, -190);
        this.drawBlackHole(ctx);
        ctx.restore();
    } else if (this.renderType === "seraph") {
        this.drawSeraph(ctx);
    } else if (this.renderType === "ophanim") {
        this.drawOphanim(ctx);
    } else if (this.renderType === "throne") {
        this.drawThrone(ctx);
    } else if (this.renderType === "ramiel_crystal") {
        this.drawRamielCrystal(ctx);
    } else if (this.renderType === "ramiel_morph") {
        this.drawRamielMorph(ctx);
    } else if (this.renderType === "ramiel_berserk") {
        this.drawRamielBerserk(ctx);
    } else if (this.renderType === "hourglass") {
        this.drawHourglass(ctx, 1);
    } else if (this.renderType === "hourglass_inverted") {
        this.drawHourglass(ctx, -1);
    } else if (this.renderType === "hourglass_shattered") {
        this.drawHourglassShattered(ctx);
    } else if (this.renderType === "godzilla_head" || this.renderType === "godzilla_charged" || this.renderType === "godzilla_meltdown") {
        ctx.save(); ctx.translate(370, 160); ctx.scale(1.4, 1.4); ctx.translate(-370, -160);
        this.drawGodzilla(ctx);
        ctx.restore();
    } else if (this.renderType === "vader_normal" || this.renderType === "vader_force" || this.renderType === "vader_rage") {
        ctx.save(); ctx.translate(370, 160); ctx.scale(1.4, 1.4); ctx.translate(-370, -160);
        this.drawVader(ctx);
        ctx.restore();
    } else if (this.renderType === "glitch_minor" || this.renderType === "glitch_core" || this.renderType === "glitch_fatal") {
        ctx.save(); ctx.translate(370, 160); ctx.scale(1.3, 1.3); ctx.translate(-370, -160);
        this.drawGlitch(ctx);
        ctx.restore();
    } else if (this.renderType === "prism_phase1" || this.renderType === "prism_phase2" || this.renderType === "prism_phase3") {
        ctx.save(); ctx.translate(370, 160); ctx.scale(1.4, 1.4); ctx.translate(-370, -160);
        this.drawPrism(ctx);
        ctx.restore();
    } else if (this.renderType === "void_maw" || this.renderType === "void_enraged" || this.renderType === "void_shattered") {
        ctx.save(); ctx.translate(370, 160); ctx.scale(1.4, 1.4); ctx.translate(-370, -160);
        this.drawVoidMaw(ctx);
        ctx.restore();
    } else if (this.renderType === "bill_normal" || this.renderType === "bill_madness" || this.renderType === "bill_angry") {
        ctx.save(); ctx.translate(370, 160); ctx.scale(1.4, 1.4); ctx.translate(-370, -160);
        this.drawBillCipher(ctx);
        ctx.restore();
    } else if (this.renderType === "sachiel") {
        ctx.save(); ctx.translate(370, 160); ctx.scale(1.4, 1.4); ctx.translate(-370, -160);
        this.drawSachiel(ctx);
        ctx.restore();
    } else if (this.renderType === "sachiel_mutated") {
        ctx.save(); ctx.translate(370, 160); ctx.scale(1.4, 1.4); ctx.translate(-370, -160);
        this.drawSachielMutated(ctx);
        ctx.restore();
    } else if (this.renderType === "sachiel_beast") {
        ctx.save(); ctx.translate(370, 160); ctx.scale(1.4, 1.4); ctx.translate(-370, -160);
        this.drawSachielBeast(ctx);
        ctx.restore();
    } else if (this.renderType === "sachiel_angelic") {
        ctx.save(); ctx.translate(370, 160); ctx.scale(1.4, 1.4); ctx.translate(-370, -160);
        this.drawSachielAngelic(ctx);
        ctx.restore();
    } else if (this.active) {
        for (var i = 0; i < this.animations.length; i++) {
            ctx.save();
            ctx.translate(
                this.modelPoses[i].x + this.jitterX,
                this.modelPoses[i].y + this.jitterY);
            this.animations[i].draw(ctx);
            ctx.restore();
        }
    }
    ctx.restore();
};

Enemy.prototype.drawBlackHole = function(ctx) {
    var centerX = 370;
    var centerY = 190;
    if (this.jitterEnabled) {
        centerX += Math.sin(this.timeCounter * 50) * 1.5;
        centerY += Math.cos(this.timeCounter * 60) * 1.5;
    }

    ctx.save();
    
    var time = this.timeCounter;
    
    // 0. Deep spacetime distortion field (outermost)
    var distortAlpha = (0.08 + Math.sin(time * 0.8) * 0.03).toFixed(3);
    var distortGrad = ctx.createRadialGradient(centerX, centerY, 60, centerX, centerY, 170);
    distortGrad.addColorStop(0, "rgba(80, 0, 180, " + distortAlpha + ")");
    distortGrad.addColorStop(0.4, "rgba(30, 0, 100, " + (distortAlpha * 0.6).toFixed(3) + ")");
    distortGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = distortGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 170, 0, Math.PI * 2);
    ctx.fill();

    // 0.5 Spacetime warp rings (gravitational lensing)
    ctx.globalAlpha = 0.12;
    for (var lr = 0; lr < 3; lr++) {
        var lensR = 90 + lr * 25 + Math.sin(time * 1.2 + lr) * 5;
        ctx.strokeStyle = "rgba(150, 100, 255, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, lensR, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    // 1. Accretion Disk (tilted elliptical, multi-color)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(0.15);
    ctx.scale(1, 0.3);
    
    var diskPulse = Math.sin(time * 2.5) * 8;
    var diskR = 100 + diskPulse;
    var diskGrad = ctx.createRadialGradient(0, 0, 25, 0, 0, diskR);
    diskGrad.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    diskGrad.addColorStop(0.15, "rgba(200, 80, 255, 0.7)");
    diskGrad.addColorStop(0.4, "rgba(50, 150, 255, 0.5)");
    diskGrad.addColorStop(0.7, "rgba(20, 50, 200, 0.2)");
    diskGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = diskGrad;
    ctx.beginPath();
    ctx.arc(0, 0, diskR, 0, Math.PI * 2);
    ctx.fill();
    
    // Swirling matter streaks in disk
    ctx.globalAlpha = 0.4;
    for (var i = 0; i < 6; i++) {
        var aOff = time * 2.0 + (i * Math.PI * 2 / 6);
        var r1 = 35 + i * 10;
        var hue = i % 2 === 0 ? "rgba(150, 100, 255, 0.5)" : "rgba(80, 200, 255, 0.4)";
        ctx.strokeStyle = hue;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r1, aOff, aOff + Math.PI * 0.5);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // 2. Photon orbit particles (fast-orbiting bright dots)
    for (var i = 0; i < 10; i++) {
        var orbitAngle = time * (2.5 + i * 0.4) + (i * Math.PI / 5);
        var orbitR = 42 + i * 3;
        var px = centerX + Math.cos(orbitAngle) * orbitR;
        var py = centerY + Math.sin(orbitAngle) * orbitR * 0.3;
        var pAlpha = (0.6 + Math.sin(time * 5 + i * 1.7) * 0.3).toFixed(2);
        var pSize = 1.2 + Math.sin(time * 3 + i) * 0.4;
        ctx.fillStyle = "rgba(180, 140, 255, " + pAlpha + ")";
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. The Event Horizon (Pure Black Center)
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, Math.PI * 2);
    ctx.fill();

    // 4. Photon Sphere — triple-layered chromatic edge
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#8844FF";
    ctx.strokeStyle = "rgba(200, 100, 255, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(100, 180, 255, 0.4)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = "rgba(60, 0, 120, 0.25)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 44, 0, Math.PI * 2);
    ctx.stroke();

    // 5. Gravitational lensing arcs (light bending)
    ctx.globalAlpha = 0.2;
    for (var i = 0; i < 5; i++) {
        var lAngle = time * 0.6 + (i * Math.PI * 2 / 5);
        var lR = 50 + i * 7;
        ctx.strokeStyle = i % 2 === 0 ? "rgba(255, 200, 100, 0.35)" : "rgba(150, 200, 255, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, lR, lAngle, lAngle + Math.PI * 0.35);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.restore();
};

Enemy.prototype.drawSupermassiveBlackHole = function(ctx) {
    var centerX = 370;
    var centerY = 190;
    if (this.jitterEnabled) {
        centerX += Math.sin(this.timeCounter * 40) * 1.5;
        centerY += Math.cos(this.timeCounter * 50) * 1.5;
    }
    ctx.save();
    
    var time = this.timeCounter;
    
    // -1. Screen-edge darkness vignette (cosmic dread)
    var vigGrad = ctx.createRadialGradient(centerX, centerY, 120, centerX, centerY, 350);
    vigGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    vigGrad.addColorStop(0.7, "rgba(0, 0, 0, 0.1)");
    vigGrad.addColorStop(1, "rgba(0, 0, 0, 0.35)");
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, 740, 580);
    
    // 0. Deep space distortion halo (outermost glow) — intensified
    var haloAlpha = (0.2 + Math.sin(time * 1.5) * 0.06).toFixed(3);
    var haloGrad = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 250);
    haloGrad.addColorStop(0, "rgba(120, 20, 255, " + haloAlpha + ")");
    haloGrad.addColorStop(0.3, "rgba(60, 0, 150, " + (haloAlpha * 0.6).toFixed(3) + ")");
    haloGrad.addColorStop(0.6, "rgba(20, 0, 60, " + (haloAlpha * 0.25).toFixed(3) + ")");
    haloGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 250, 0, Math.PI * 2);
    ctx.fill();

    // 0.5 Einstein ring arcs (gravitational lensing of background stars)
    ctx.globalAlpha = 0.15;
    for (var er = 0; er < 4; er++) {
        var eAngle = time * 0.3 + er * Math.PI / 2;
        var eR = 130 + er * 18 + Math.sin(time * 0.7 + er) * 6;
        ctx.strokeStyle = "rgba(200, 180, 255, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, eR, eAngle, eAngle + Math.PI * 0.5);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 1. Relativistic Jets (Dual beams — top and bottom) — enhanced with inner core
    var jetPulse = Math.sin(time * 8) * 0.2 + 0.8;
    var alpha1 = (0.6 * jetPulse).toFixed(2);
    
    // Top jet — outer glow
    var jetGradTop = ctx.createLinearGradient(centerX, centerY, centerX, centerY - 220);
    jetGradTop.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    jetGradTop.addColorStop(0.15, "rgba(100, 200, 255, " + alpha1 + ")");
    jetGradTop.addColorStop(0.5, "rgba(50, 100, 255, " + (alpha1 * 0.5).toFixed(2) + ")");
    jetGradTop.addColorStop(1, "rgba(0, 30, 150, 0)");
    ctx.fillStyle = jetGradTop;
    ctx.beginPath();
    ctx.moveTo(centerX - 4, centerY - 42);
    ctx.lineTo(centerX + 4, centerY - 42);
    ctx.lineTo(centerX + 22, centerY - 220);
    ctx.lineTo(centerX - 22, centerY - 220);
    ctx.fill();
    // Top jet — inner white core
    ctx.fillStyle = "rgba(255, 255, 255, " + (0.4 * jetPulse).toFixed(2) + ")";
    ctx.beginPath();
    ctx.moveTo(centerX - 1, centerY - 42);
    ctx.lineTo(centerX + 1, centerY - 42);
    ctx.lineTo(centerX + 6, centerY - 200);
    ctx.lineTo(centerX - 6, centerY - 200);
    ctx.fill();
    
    // Bottom jet — outer glow
    var jetGradBot = ctx.createLinearGradient(centerX, centerY, centerX, centerY + 220);
    jetGradBot.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    jetGradBot.addColorStop(0.15, "rgba(100, 200, 255, " + alpha1 + ")");
    jetGradBot.addColorStop(0.5, "rgba(50, 100, 255, " + (alpha1 * 0.5).toFixed(2) + ")");
    jetGradBot.addColorStop(1, "rgba(0, 30, 150, 0)");
    ctx.fillStyle = jetGradBot;
    ctx.beginPath();
    ctx.moveTo(centerX - 4, centerY + 42);
    ctx.lineTo(centerX + 4, centerY + 42);
    ctx.lineTo(centerX + 22, centerY + 220);
    ctx.lineTo(centerX - 22, centerY + 220);
    ctx.fill();
    // Bottom jet — inner white core
    ctx.fillStyle = "rgba(255, 255, 255, " + (0.4 * jetPulse).toFixed(2) + ")";
    ctx.beginPath();
    ctx.moveTo(centerX - 1, centerY + 42);
    ctx.lineTo(centerX + 1, centerY + 42);
    ctx.lineTo(centerX + 6, centerY + 200);
    ctx.lineTo(centerX - 6, centerY + 200);
    ctx.fill();

    // 2. Accretion Disk — tilted elliptical with hot-spot asymmetry
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(0.12);
    ctx.scale(1, 0.28);
    
    var diskRadius = 200 + Math.sin(time * 2) * 14;
    var diskGrad = ctx.createRadialGradient(0, 0, 35, 0, 0, diskRadius);
    diskGrad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
    diskGrad.addColorStop(0.1, "rgba(255, 220, 100, 0.95)");
    diskGrad.addColorStop(0.25, "rgba(255, 150, 50, 0.8)");
    diskGrad.addColorStop(0.45, "rgba(220, 60, 0, 0.55)");
    diskGrad.addColorStop(0.65, "rgba(120, 0, 80, 0.3)");
    diskGrad.addColorStop(0.85, "rgba(40, 0, 120, 0.12)");
    diskGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = diskGrad;
    ctx.beginPath();
    ctx.arc(0, 0, diskRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Swirling streaks — multi-colored
    ctx.globalAlpha = 0.4;
    for (var i = 0; i < 8; i++) {
        var aOff = time * 1.5 + (i * Math.PI * 2 / 8);
        var r1 = 45 + i * 18;
        var colors = ["rgba(255, 200, 80, 0.5)", "rgba(255, 120, 40, 0.4)", "rgba(200, 50, 200, 0.35)", "rgba(100, 150, 255, 0.3)"];
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = 2.5 - i * 0.2;
        ctx.beginPath();
        ctx.arc(0, 0, r1, aOff, aOff + Math.PI * 0.55);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // 3. Gravitational Lensing Arcs — more prominent
    ctx.globalAlpha = 0.3;
    for (var i = 0; i < 6; i++) {
        var lensAngle = time * 0.6 + (i * Math.PI / 3);
        var lensR = 52 + i * 8;
        ctx.strokeStyle = i % 2 === 0 ? "rgba(255, 200, 100, 0.4)" : "rgba(180, 150, 255, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, lensR, lensAngle, lensAngle + Math.PI * 0.35);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 4. Gravitational Shadow (ultra-dark zone just outside event horizon)
    var shadowGrad = ctx.createRadialGradient(centerX, centerY, 42, centerX, centerY, 56);
    shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.95)");
    shadowGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.4)");
    shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 56, 0, Math.PI * 2);
    ctx.fill();

    // 5. The Event Horizon (Pure Black Center)
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 44, 0, Math.PI * 2);
    ctx.fill();

    // 6. Photon Sphere — quad-layered chromatic edge
    var photonPulse = Math.sin(time * 6) * 0.12 + 0.88;
    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(255, 180, 50, 0.8)";
    ctx.strokeStyle = "rgba(255, 230, 140, " + photonPulse.toFixed(2) + ")";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 44, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 120, 40, 0.5)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 49, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = "rgba(200, 50, 255, 0.25)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 55, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = "rgba(80, 0, 180, 0.1)";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 64, 0, Math.PI * 2);
    ctx.stroke();

    // 7. Orbiting matter with comet tails
    for (var i = 0; i < 12; i++) {
        var orbitAngle = time * (1.5 + i * 0.25) + (i * Math.PI / 6);
        var orbitR = 62 + i * 7;
        var px = centerX + Math.cos(orbitAngle) * orbitR;
        var py = centerY + Math.sin(orbitAngle) * orbitR * 0.28;
        var pSize = 1.8 + Math.sin(time * 3 + i) * 0.6;
        var pAlpha = (0.55 + Math.sin(time * 4 + i) * 0.25).toFixed(2);
        
        // Comet tail
        var tailAngle = orbitAngle - 0.4;
        var tx = centerX + Math.cos(tailAngle) * orbitR;
        var ty = centerY + Math.sin(tailAngle) * orbitR * 0.28;
        ctx.strokeStyle = "rgba(255, 180, 80, " + (pAlpha * 0.4).toFixed(2) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        
        // Particle head
        var pColors = ["rgba(255, 200, 80, ", "rgba(255, 150, 50, ", "rgba(200, 100, 255, "];
        ctx.fillStyle = pColors[i % pColors.length] + pAlpha + ")";
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 8. Flickering captured star fragments (tiny bright flashes)
    for (var i = 0; i < 5; i++) {
        var fAngle = time * 3.0 + i * Math.PI * 2 / 5;
        var fR = 75 + Math.sin(time * 7 + i * 3) * 12;
        var fx = centerX + Math.cos(fAngle) * fR;
        var fy = centerY + Math.sin(fAngle) * fR * 0.28;
        var fAlpha = Math.max(0, Math.sin(time * 10 + i * 2)).toFixed(2);
        if (parseFloat(fAlpha) > 0.3) {
            ctx.fillStyle = "rgba(255, 255, 255, " + fAlpha + ")";
            ctx.beginPath();
            ctx.arc(fx, fy, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
};

// Get current phase's attack patterns
Enemy.prototype.getCurrentAttacks = function() {
    if (this.phases && this.phases[this.currentPhase]) {
        return this.phases[this.currentPhase].patterns;
    }
    return this.attacks;
};

// Get current phase's soul mode
Enemy.prototype.getCurrentSoulMode = function() {
    if (this.phases && this.phases[this.currentPhase]) {
        return this.phases[this.currentPhase].soulMode || "red";
    }
    return "red";
};

// Get a random attack pattern name for current phase
Enemy.prototype.getRandomAttack = function() {
    var attacks = this.getCurrentAttacks();
    return attacks[Math.floor(Math.random() * attacks.length)];
};

// Get a random dialogue line
Enemy.prototype.getRandomSpeech = function() {
    var speechArray = this.speech;
    if (this.phases && this.phases[this.currentPhase] && this.phases[this.currentPhase].speech) {
        speechArray = this.phases[this.currentPhase].speech;
    }
    return speechArray[Math.floor(Math.random() * speechArray.length)];
};

// Get a random flavor text
Enemy.prototype.getRandomText = function() {
    return this.texts[Math.floor(Math.random() * this.texts.length)];
};

// Deal damage to this enemy
Enemy.prototype.dealDamage = function(damage) {
    var finalDmg = damage;
    var sClass = (typeof Player !== "undefined") ? Player.getSoulClass() : 0;
    
    // Itadori Black Flash (20% chance, 2.5x damage)
    if (sClass === 17 && Math.random() < 0.20) {
        finalDmg *= 2.5;
        Sound.playSound("hit_2_crit", true);
        if (typeof triggerBlackFlash === "function") {
            triggerBlackFlash();
        }
        if (typeof Soul !== "undefined" && Soul.addFloatingText) {
            var sPos = Soul.getPos();
            Soul.addFloatingText("BLACK FLASH", sPos.x + Soul.getWidth() / 2, sPos.y - 18, "#FF1493");
        }
        console.log("ITADORI BLACK FLASH! 2.5x damage dealt!");
    }
    
    
    this.curHP -= finalDmg / this.defense;
    
    // El Hambre Cósmica: hits recover utility items
    if (this.name === "El Hambre Cósmica" && this.stolenItems && this.stolenItems.length > 0) {
        this.hitsSinceSteal = (this.hitsSinceSteal || 0) + 1;
        if (this.hitsSinceSteal >= 3) {
            this.hitsSinceSteal = 0;
            var recoveredItem = this.stolenItems.shift();
            if (recoveredItem && typeof Inventory !== "undefined") {
                Inventory.addItem(recoveredItem);
                if (typeof Soul !== "undefined" && Soul.addFloatingText) {
                    var sPos = Soul.getPos();
                    Soul.addFloatingText("RECOVERED " + recoveredItem.name.toUpperCase() + "!", sPos.x + Soul.getWidth() / 2, sPos.y - 12, "#00FF7F");
                }
                Sound.playSound("heal", true);
            }
        }
    }
    
    // Lifesteal Passives
    if (typeof Player !== "undefined") {
        if (sClass === 10) { // Vampire: 10% lifesteal
            Player.heal(Math.ceil(finalDmg * 0.10));
        }
    }
    
    // Itadori Blood Piercing: apply 3 second bleed to enemy
    if (sClass === 17 && typeof Player !== "undefined") {
        this.bleedTimer = (this.bleedTimer || 0);
        this.bleedTimer = 3.0; // 3 seconds of bleed (resets, doesn't stack)
        this.bleedDmg = 5; // 5 HP/sec enemy bleed
    }
    
    // Sans: each hit applies 10 second poison (non-stackable, resets on each hit)
    if (sClass === 19) {
        this.sansPoisonTimer = 10.0; // 10 seconds
        this.sansPoisonDmg = 20; // 20 damage per tick (per second)
    }
    
    if (this.curHP <= 0) {
        // Return stolen items for El Hambre Cósmica on phase defeat / death
        if (this.name === "El Hambre Cósmica" && this.stolenItems && this.stolenItems.length > 0) {
            if (typeof Inventory !== "undefined") {
                while (this.stolenItems.length > 0) {
                    var item = this.stolenItems.shift();
                    Inventory.addItem(item);
                }
                if (typeof Soul !== "undefined" && Soul.addFloatingText) {
                    var sPos = Soul.getPos();
                    Soul.addFloatingText("ITEMS RETURNED!", sPos.x + Soul.getWidth() / 2, sPos.y - 12, "#00FF7F");
                }
                Sound.playSound("heal", true);
                console.log("El Hambre Cósmica defeated phase/dead: Stolen items returned!");
            }
        }

        if (this.phases && this.currentPhase < this.phases.length - 1) {
            this.currentPhase++;
            // Reset Mahoraga adaptation on boss phase change!
            if (typeof Player !== "undefined" && Player.resetMahoragaAdaptation) {
                Player.resetMahoragaAdaptation();
            }
            // Use phaseHP array if available, otherwise use maxHP
            if (this.phaseHP && this.phaseHP[this.currentPhase]) {
                this.maxHP = this.phaseHP[this.currentPhase];
            }
            this.curHP = this.maxHP; // Refill HP for next phase
            return false; // Not fully dead yet!
        }
        this.curHP = 0;
        return true; // Fully Dead
    }
    return false;
};

// Check if enemy is dead
Enemy.prototype.isDead = function() {
    return this.curHP <= 0;
};

// ============================================================
// SERAPHINA VEX — Angel Boss Rendering
// ============================================================

// Helper: draw a feathered wing
Enemy.prototype.drawWing = function(ctx, cx, cy, angle, size, time, mirror) {
    ctx.save();
    ctx.translate(cx, cy);
    if (mirror) ctx.scale(-1, 1);
    ctx.rotate(angle + Math.sin(time * 2) * 0.08);
    
    // Wing shape (layered feathers)
    var feathers = 7;
    for (var i = 0; i < feathers; i++) {
        var fAngle = -0.3 + (i / feathers) * 0.9;
        var fLen = size * (0.6 + (i / feathers) * 0.4);
        ctx.save();
        ctx.rotate(fAngle);
        
        // Feather gradient
        var fGrad = ctx.createLinearGradient(0, 0, fLen, 0);
        fGrad.addColorStop(0, "rgba(255, 250, 235, 0.9)");
        fGrad.addColorStop(0.7, "rgba(240, 230, 200, 0.6)");
        fGrad.addColorStop(1, "rgba(220, 210, 180, 0)");
        ctx.fillStyle = fGrad;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(fLen * 0.5, -6 - i, fLen, -2);
        ctx.quadraticCurveTo(fLen * 0.5, 6 - i, 0, 0);
        ctx.fill();
        
        ctx.restore();
    }
    ctx.restore();
};

// Helper: draw a golden ring with eyes
Enemy.prototype.drawGoldenRing = function(ctx, cx, cy, radiusX, radiusY, rotation, numEyes, time, eyeColor) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.scale(1, radiusY / radiusX);
    
    // Ring body
    ctx.strokeStyle = "#DAA520";
    ctx.lineWidth = 8;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#FFD700";
    ctx.beginPath();
    ctx.arc(0, 0, radiusX, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner gold highlight
    ctx.strokeStyle = "rgba(255, 235, 150, 0.6)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radiusX, 0, Math.PI * 2);
    ctx.stroke();
    
    // Eyes on the ring
    for (var i = 0; i < numEyes; i++) {
        var eAngle = (i / numEyes) * Math.PI * 2 + time * 0.8;
        var ex = Math.cos(eAngle) * radiusX;
        var ey = Math.sin(eAngle) * radiusX;
        
        // Eye white
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.ellipse(ex, ey, 6, 4, eAngle, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupil
        ctx.fillStyle = eyeColor || "#4488FF";
        ctx.beginPath();
        ctx.arc(ex, ey, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
};

// ---- PHASE 1: SERAPH (Calm) ----
Enemy.prototype.drawSeraph = function(ctx) {
    var time = this.timeCounter;
    ctx.save();
    ctx.translate(370, 160);
    ctx.scale(1.8, 1.8);
    var cx = 0, cy = 0;
    
    // Soft divine aura
    var auraAlpha = (0.12 + Math.sin(time * 1.5) * 0.04).toFixed(2);
    var auraGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 150);
    auraGrad.addColorStop(0, "rgba(255, 215, 0, " + auraAlpha + ")");
    auraGrad.addColorStop(1, "rgba(255, 255, 200, 0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 150, 0, Math.PI * 2);
    ctx.fill();
    
    // Wings (2 — gentle sway)
    this.drawWing(ctx, cx - 20, cy + 5, -0.5, 90, time, false);
    this.drawWing(ctx, cx + 20, cy + 5, 0.5, 90, time, true);
    
    // Single golden ring
    this.drawGoldenRing(ctx, cx, cy, 55, 20, time * 0.5, 4, time, "#4488FF");
    
    // Central eye (blue, calm)
    // Eye white
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Iris
    var irisGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 10);
    irisGrad.addColorStop(0, "#2266DD");
    irisGrad.addColorStop(0.7, "#1144AA");
    irisGrad.addColorStop(1, "#0A2266");
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
    // Pupil
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    // Highlight
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Halo
    ctx.strokeStyle = "rgba(255, 215, 0, 0.8)";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#FFD700";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 45, 25, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    // Floating divine light motes
    ctx.shadowBlur = 0;
    for (var m = 0; m < 8; m++) {
        var mAngle = time * 0.5 + m * Math.PI / 4;
        var mR = 60 + Math.sin(time * 1.5 + m * 2) * 25;
        var mx = cx + Math.cos(mAngle) * mR;
        var my = cy + Math.sin(mAngle * 0.7) * mR * 0.4 - 10;
        var mAlpha = (0.25 + Math.sin(time * 2 + m) * 0.15).toFixed(2);
        var mSize = 1.2 + Math.sin(time * 3 + m) * 0.5;
        ctx.fillStyle = "rgba(255, 240, 180, " + mAlpha + ")";
        ctx.beginPath();
        ctx.arc(mx, my, mSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
};


// ---- PHASE 2: OPHANIM (Intense) ----
Enemy.prototype.drawOphanim = function(ctx) {
    var time = this.timeCounter;
    ctx.save();
    ctx.translate(370, 170);
    ctx.scale(1.8, 1.8);
    var cx = 0, cy = 0;
    
    // Intense divine aura
    var auraAlpha = (0.18 + Math.sin(time * 2) * 0.06).toFixed(2);
    var auraGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 180);
    auraGrad.addColorStop(0, "rgba(255, 200, 0, " + auraAlpha + ")");
    auraGrad.addColorStop(0.5, "rgba(255, 150, 50, " + (auraAlpha * 0.5).toFixed(2) + ")");
    auraGrad.addColorStop(1, "rgba(255, 100, 0, 0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 180, 0, Math.PI * 2);
    ctx.fill();
    
    // Wings (4 — spread wide, faster sway)
    this.drawWing(ctx, cx - 25, cy - 15, -0.7, 110, time * 1.3, false);
    this.drawWing(ctx, cx + 25, cy - 15, 0.7, 110, time * 1.3, true);
    this.drawWing(ctx, cx - 15, cy + 20, -0.3, 80, time * 1.1, false);
    this.drawWing(ctx, cx + 15, cy + 20, 0.3, 80, time * 1.1, true);
    
    // Two intersecting golden rings
    this.drawGoldenRing(ctx, cx, cy, 60, 22, time * 0.7, 6, time, "#8844FF");
    this.drawGoldenRing(ctx, cx, cy, 55, 25, -time * 0.5 + 1.2, 5, time, "#8844FF");
    
    // Central eye (purple/violet — getting intense)
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 20, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    var irisGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
    irisGrad.addColorStop(0, "#AA44FF");
    irisGrad.addColorStop(0.7, "#7722CC");
    irisGrad.addColorStop(1, "#440088");
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Halo (brighter, dual)
    ctx.strokeStyle = "rgba(255, 215, 0, 0.9)";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#FFD700";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 50, 28, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 180, 0, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 55, 35, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    // Holy fire particles
    for (var i = 0; i < 6; i++) {
        var pAngle = time * 1.2 + (i * Math.PI / 3);
        var pR = 75 + Math.sin(time * 3 + i) * 8;
        var px = cx + Math.cos(pAngle) * pR;
        var py = cy + Math.sin(pAngle) * pR * 0.35;
        var pAlpha = (0.4 + Math.sin(time * 4 + i) * 0.2).toFixed(2);
        ctx.fillStyle = "rgba(255, 200, 50, " + pAlpha + ")";
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
};

// ---- PHASE 3: THRONE OF JUDGMENT (Furious) ----
Enemy.prototype.drawThrone = function(ctx) {
    var time = this.timeCounter;
    ctx.save();
    
    // Furious divine pressure — vignette
    var vigGrad = ctx.createRadialGradient(370, 160, 80, 370, 290, 380);
    vigGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    vigGrad.addColorStop(0.6, "rgba(0, 0, 0, 0.12)");
    vigGrad.addColorStop(1, "rgba(0, 0, 0, 0.35)");
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, 740, 580);
    
    // Lightning flickers
    if (Math.random() < 0.04) {
        ctx.fillStyle = "rgba(255, 200, 100, 0.08)";
        ctx.fillRect(0, 0, 740, 580);
    }
    
    ctx.translate(370, 170);
    ctx.scale(1.8, 1.8);
    var cx = 0, cy = 0;
    
    // Massive raging aura
    var auraAlpha = (0.25 + Math.sin(time * 3) * 0.08).toFixed(2);
    var auraGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 220);
    auraGrad.addColorStop(0, "rgba(255, 50, 0, " + auraAlpha + ")");
    auraGrad.addColorStop(0.3, "rgba(255, 150, 0, " + (auraAlpha * 0.7).toFixed(2) + ")");
    auraGrad.addColorStop(0.6, "rgba(200, 0, 50, " + (auraAlpha * 0.3).toFixed(2) + ")");
    auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 220, 0, Math.PI * 2);
    ctx.fill();
    
    // Wings (6 — massive, aggressive movement)
    this.drawWing(ctx, cx - 30, cy - 25, -0.9, 130, time * 1.8, false);
    this.drawWing(ctx, cx + 30, cy - 25, 0.9, 130, time * 1.8, true);
    this.drawWing(ctx, cx - 20, cy + 5, -0.4, 100, time * 1.5, false);
    this.drawWing(ctx, cx + 20, cy + 5, 0.4, 100, time * 1.5, true);
    this.drawWing(ctx, cx - 10, cy + 30, -0.1, 70, time * 1.2, false);
    this.drawWing(ctx, cx + 10, cy + 30, 0.1, 70, time * 1.2, true);
    
    // Three interlocking golden rings (fast spin)
    this.drawGoldenRing(ctx, cx, cy, 65, 24, time * 1.0, 5, time, "#FF2200");
    this.drawGoldenRing(ctx, cx, cy, 58, 28, -time * 0.8 + 1.0, 4, time, "#FF2200");
    this.drawGoldenRing(ctx, cx, cy, 52, 20, time * 0.6 + 2.0, 3, time, "#FF4400");
    
    // Central eye (CRIMSON — slit pupil, furious)
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 22, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    // Crimson iris
    var irisGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
    irisGrad.addColorStop(0, "#FF2200");
    irisGrad.addColorStop(0.5, "#CC0000");
    irisGrad.addColorStop(1, "#660000");
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    // Slit pupil (vertical)
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 2, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Angry highlight
    ctx.fillStyle = "rgba(255,200,200,0.7)";
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 4, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Broken/cracked halo (shaking)
    var haloShake = Math.sin(time * 20) * 2;
    ctx.strokeStyle = "rgba(255, 100, 0, 0.9)";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 25;
    ctx.shadowColor = "#FF4400";
    ctx.beginPath();
    ctx.ellipse(cx + haloShake, cy - 52, 30, 10, Math.sin(time * 5) * 0.05, 0, Math.PI * 2);
    ctx.stroke();
    
    // Divine fire emanating
    for (var i = 0; i < 12; i++) {
        var fAngle = time * 2.0 + (i * Math.PI / 6);
        var fR = 80 + Math.sin(time * 5 + i * 2) * 15;
        var fx = cx + Math.cos(fAngle) * fR;
        var fy = cy + Math.sin(fAngle) * fR * 0.3;
        var fSize = 2 + Math.sin(time * 6 + i) * 1.5;
        var fAlpha = (0.5 + Math.sin(time * 5 + i) * 0.3).toFixed(2);
        ctx.fillStyle = "rgba(255, " + Math.floor(100 + Math.sin(time + i) * 80) + ", 0, " + fAlpha + ")";
        ctx.beginPath();
        ctx.arc(fx, fy, fSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
};

Enemy.prototype.onHitPlayer = function(damageDealt, patternName) {
    if (typeof Player === "undefined") return;
    
    // 1. Seraphina passives
    if (this.renderType === "seraph") {
        var healAmount = damageDealt * 10;
        this.curHP = Math.min(this.maxHP, this.curHP + healAmount);
        console.log("Seraphina healed for " + healAmount);
    } else if (this.renderType === "ophanim") {
        if (!this.hasStolenItem && typeof Inventory !== "undefined" && Inventory.getLength() > 0) {
            this.hasStolenItem = true;
            var randIdx = Math.floor(Math.random() * Inventory.getLength());
            Inventory.removeItem(randIdx);
            console.log("Seraphina stole an item!");
        }
    } else if (this.renderType === "throne") {
        if (Player.addBleed) {
            Player.addBleed(5.0);
        }
    }
    
    // 2. Anti-gravity passive: slow player speed by 15% on hit (case-insensitive)
    if (this.name && this.name.toUpperCase() === "ANTI-GRAVITY") {
        if (Player.addBuffSpd) {
            Player.addBuffSpd(-0.15, 1);
            console.log("Anti-gravity pull slowed your speed by 15%!");
        }
    }
    
    // 3. Error 404 (Glitch) passive: controls inversion (case-insensitive)
    if (this.name && (this.name.toUpperCase() === "ERROR 404" || this.name.toUpperCase() === "GLITCH")) {
        this.corruption = (this.corruption || 0) + 1;
        if (this.corruption >= 3) {
            this.corruption = 0;
            if (typeof Soul !== "undefined") {
                var oldMode = Soul.getSoulMode();
                Soul.setSoulMode(Soul.SOUL_MODE.INVERSE);
                Sound.playSound("hit_2_crit", true);
                if (typeof Camera !== "undefined" && Camera.shake) {
                    Camera.shake(7.0);
                }
                this.latencyActive = true;
                var self = this;
                setTimeout(function() {
                    if (typeof Soul !== "undefined" && Soul.getSoulMode() === Soul.SOUL_MODE.INVERSE) {
                        Soul.setSoulMode(oldMode);
                    }
                    self.latencyActive = false;
                }, 2200);
            }
        }
    }
};

// ============================================================
// RAMIEL — Evangelion Angel Boss Rendering
// ============================================================

// Helper: draw an octahedron (diamond) shape
Enemy.prototype.drawOctahedron = function(ctx, cx, cy, size, rotation, colors) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    var topY = -size;
    var botY = size;
    var midW = size * 0.9;

    // Main body gradient
    var bodyGrad = ctx.createLinearGradient(-midW, topY, midW, botY);
    bodyGrad.addColorStop(0, colors[0]);
    bodyGrad.addColorStop(0.35, colors[1]);
    bodyGrad.addColorStop(0.5, colors[2]);
    bodyGrad.addColorStop(0.65, colors[1]);
    bodyGrad.addColorStop(1, colors[0]);

    // Left face
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(0, topY);
    ctx.lineTo(-midW, 0);
    ctx.lineTo(0, botY);
    ctx.closePath();
    ctx.fill();

    // Right face (slightly brighter)
    var rightGrad = ctx.createLinearGradient(0, topY, midW, 0);
    rightGrad.addColorStop(0, colors[1]);
    rightGrad.addColorStop(0.5, colors[2]);
    rightGrad.addColorStop(1, colors[1]);
    ctx.fillStyle = rightGrad;
    ctx.beginPath();
    ctx.moveTo(0, topY);
    ctx.lineTo(midW, 0);
    ctx.lineTo(0, botY);
    ctx.closePath();
    ctx.fill();

    // Edge highlights
    ctx.strokeStyle = colors[3] || "rgba(180, 220, 255, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, topY);
    ctx.lineTo(-midW, 0);
    ctx.lineTo(0, botY);
    ctx.lineTo(midW, 0);
    ctx.closePath();
    ctx.stroke();

    // Center dividing line
    ctx.strokeStyle = colors[4] || "rgba(200, 240, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, topY);
    ctx.lineTo(0, botY);
    ctx.stroke();

    ctx.restore();
};

// ---- PHASE 1: CRYSTAL OCTAHEDRON (Calm, Perfect) ----
Enemy.prototype.drawRamielCrystal = function(ctx) {
    var time = this.timeCounter;
    ctx.save();
    var cx = 370, cy = 195;

    // Soft blue aura
    var auraAlpha = (0.1 + Math.sin(time * 1.2) * 0.04).toFixed(3);
    var auraGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 160);
    auraGrad.addColorStop(0, "rgba(50, 100, 255, " + auraAlpha + ")");
    auraGrad.addColorStop(0.5, "rgba(20, 50, 180, " + (auraAlpha * 0.5).toFixed(3) + ")");
    auraGrad.addColorStop(1, "rgba(0, 0, 80, 0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 160, 0, Math.PI * 2);
    ctx.fill();

    // Floating light motes
    for (var m = 0; m < 10; m++) {
        var mAngle = time * 0.4 + m * Math.PI / 5;
        var mR = 70 + Math.sin(time * 1.2 + m * 2) * 20;
        var mx = cx + Math.cos(mAngle) * mR;
        var my = cy + Math.sin(mAngle * 0.6) * mR * 0.4;
        var mAlpha = (0.2 + Math.sin(time * 2 + m) * 0.12).toFixed(2);
        ctx.fillStyle = "rgba(150, 200, 255, " + mAlpha + ")";
        ctx.beginPath();
        ctx.arc(mx, my, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Slow idle rotation
    var idleRot = Math.sin(time * 0.5) * 0.08;

    // Shadow/glow beneath
    ctx.shadowBlur = 25;
    ctx.shadowColor = "rgba(50, 120, 255, 0.6)";

    // Main octahedron
    this.drawOctahedron(ctx, cx, cy, 60, idleRot, [
        "rgba(15, 30, 120, 0.9)",   // dark sapphire
        "rgba(30, 80, 200, 0.85)",   // medium blue
        "rgba(60, 140, 255, 0.9)",   // bright blue
        "rgba(120, 200, 255, 0.6)",  // edge highlight
        "rgba(180, 230, 255, 0.3)"   // center line
    ]);
    ctx.shadowBlur = 0;

    // Internal refraction lines
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(idleRot);
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = "rgba(200, 240, 255, 0.5)";
    ctx.lineWidth = 1;
    // Horizontal refraction
    ctx.beginPath();
    ctx.moveTo(-42 * 0.9, 0);
    ctx.lineTo(42 * 0.9, 0);
    ctx.stroke();
    // Diagonal refractions
    for (var r = 0; r < 3; r++) {
        var ry = -30 + r * 30;
        ctx.beginPath();
        var rw = 42 * (1 - Math.abs(ry) / 60) * 0.9;
        ctx.moveTo(-rw, ry);
        ctx.lineTo(rw, ry);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Red pulsing core
    var corePulse = Math.sin(time * 2.5) * 0.15 + 0.85;
    var coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
    coreGrad.addColorStop(0, "rgba(255, 50, 30, " + (0.9 * corePulse).toFixed(2) + ")");
    coreGrad.addColorStop(0.5, "rgba(200, 20, 20, " + (0.5 * corePulse).toFixed(2) + ")");
    coreGrad.addColorStop(1, "rgba(100, 0, 0, 0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();

    // Core bright dot
    ctx.fillStyle = "rgba(255, 200, 200, " + (0.7 * corePulse).toFixed(2) + ")";
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};

// ---- PHASE 2: GEOMETRIC MORPHING (Rebuild) ----
Enemy.prototype.drawRamielMorph = function(ctx) {
    var time = this.timeCounter;
    ctx.save();
    var cx = 370, cy = 200;

    // Distortion vignette
    var vigGrad = ctx.createRadialGradient(cx, cy, 80, cx, cy, 340);
    vigGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    vigGrad.addColorStop(0.7, "rgba(0, 0, 30, 0.08)");
    vigGrad.addColorStop(1, "rgba(0, 0, 50, 0.2)");
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, 740, 580);

    // Intense pulsing aura
    var auraAlpha = (0.15 + Math.sin(time * 2) * 0.06).toFixed(3);
    var auraGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 180);
    auraGrad.addColorStop(0, "rgba(80, 100, 255, " + auraAlpha + ")");
    auraGrad.addColorStop(0.4, "rgba(40, 60, 200, " + (auraAlpha * 0.6).toFixed(3) + ")");
    auraGrad.addColorStop(1, "rgba(20, 0, 120, 0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 180, 0, Math.PI * 2);
    ctx.fill();

    // Morphing shape: interpolate vertices between octahedron and star
    var morphPhase = (Math.sin(time * 1.5) + 1) / 2; // 0 to 1
    var numPoints = 8;
    var baseSize = 65;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time * 0.3);

    // Generate morphing vertices
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(60, 100, 255, 0.7)";

    var grad = ctx.createRadialGradient(0, 0, 10, 0, 0, baseSize);
    grad.addColorStop(0, "rgba(100, 180, 255, 0.95)");
    grad.addColorStop(0.4, "rgba(50, 100, 230, 0.85)");
    grad.addColorStop(0.8, "rgba(30, 50, 180, 0.8)");
    grad.addColorStop(1, "rgba(20, 30, 120, 0.7)");
    ctx.fillStyle = grad;

    ctx.beginPath();
    for (var i = 0; i < numPoints; i++) {
        var angle = (i / numPoints) * Math.PI * 2;
        // Alternate between inner and outer radii for star shape
        var octR = baseSize; // Octahedron radius
        var starOuter = baseSize * 1.3;
        var starInner = baseSize * 0.4;
        var targetR = (i % 2 === 0) ? starOuter : starInner;
        var r = octR + (targetR - octR) * morphPhase;

        var px = Math.cos(angle) * r;
        var py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Edge glow
    ctx.strokeStyle = "rgba(150, 200, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner morphing lines
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = "rgba(200, 230, 255, 0.5)";
    ctx.lineWidth = 1;
    for (var i = 0; i < numPoints; i++) {
        var angle = (i / numPoints) * Math.PI * 2;
        var octR2 = baseSize;
        var targetR2 = (i % 2 === 0) ? baseSize * 1.3 : baseSize * 0.4;
        var r2 = octR2 + (targetR2 - octR2) * morphPhase;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // Energy particles orbiting wildly
    for (var i = 0; i < 14; i++) {
        var pAngle = time * (2.0 + i * 0.3) + i * Math.PI / 7;
        var pR = 50 + i * 5 + Math.sin(time * 3 + i) * 10;
        var px = cx + Math.cos(pAngle) * pR;
        var py = cy + Math.sin(pAngle) * pR * 0.5;
        var pAlpha = (0.4 + Math.sin(time * 4 + i * 2) * 0.25).toFixed(2);
        var pSize = 1.5 + Math.sin(time * 3 + i) * 0.5;
        ctx.fillStyle = i % 3 === 0
            ? "rgba(150, 100, 255, " + pAlpha + ")"
            : "rgba(80, 180, 255, " + pAlpha + ")";
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // Red core (more intense)
    var corePulse = Math.sin(time * 3.5) * 0.2 + 0.8;
    var coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16);
    coreGrad.addColorStop(0, "rgba(255, 60, 30, " + (0.95 * corePulse).toFixed(2) + ")");
    coreGrad.addColorStop(0.4, "rgba(220, 30, 30, " + (0.6 * corePulse).toFixed(2) + ")");
    coreGrad.addColorStop(1, "rgba(120, 0, 0, 0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};

// ---- PHASE 3: BERSERK FRACTAL ----
Enemy.prototype.drawRamielBerserk = function(ctx) {
    var time = this.timeCounter;
    ctx.save();
    var cx = 370, cy = 200;

    // Heavy vignette (dread)
    var vigGrad = ctx.createRadialGradient(cx, cy, 60, cx, cy, 350);
    vigGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    vigGrad.addColorStop(0.5, "rgba(0, 0, 20, 0.1)");
    vigGrad.addColorStop(1, "rgba(0, 0, 0, 0.35)");
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, 740, 580);

    // Lightning flickers
    if (Math.random() < 0.05) {
        ctx.fillStyle = "rgba(100, 150, 255, 0.08)";
        ctx.fillRect(0, 0, 740, 580);
    }

    // Raging aura (red-violet)
    var auraAlpha = (0.22 + Math.sin(time * 3) * 0.07).toFixed(3);
    var auraGrad = ctx.createRadialGradient(cx, cy, 15, cx, cy, 200);
    auraGrad.addColorStop(0, "rgba(200, 50, 255, " + auraAlpha + ")");
    auraGrad.addColorStop(0.3, "rgba(150, 20, 200, " + (auraAlpha * 0.6).toFixed(3) + ")");
    auraGrad.addColorStop(0.6, "rgba(80, 0, 120, " + (auraAlpha * 0.3).toFixed(3) + ")");
    auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 200, 0, Math.PI * 2);
    ctx.fill();

    // Multiple overlapping octahedrons at different rotations (fractal look)
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(200, 50, 255, 0.5)";

    // Background octahedrons (faded, different sizes)
    ctx.globalAlpha = 0.2;
    this.drawOctahedron(ctx, cx, cy, 75, time * 0.7, [
        "rgba(100, 0, 150, 0.6)", "rgba(150, 30, 200, 0.5)",
        "rgba(200, 80, 255, 0.6)", "rgba(220, 150, 255, 0.3)", "rgba(255, 200, 255, 0.2)"
    ]);
    ctx.globalAlpha = 0.3;
    this.drawOctahedron(ctx, cx, cy, 65, -time * 0.5 + 1.0, [
        "rgba(120, 20, 180, 0.6)", "rgba(160, 40, 220, 0.5)",
        "rgba(200, 100, 255, 0.6)", "rgba(230, 160, 255, 0.3)", "rgba(255, 200, 255, 0.2)"
    ]);
    ctx.globalAlpha = 1;

    // Main octahedron (cracked, red-shifted)
    ctx.shadowBlur = 25;
    ctx.shadowColor = "rgba(255, 50, 100, 0.6)";
    this.drawOctahedron(ctx, cx, cy, 60, Math.sin(time * 0.8) * 0.12, [
        "rgba(80, 10, 80, 0.9)",     // dark magenta
        "rgba(150, 30, 120, 0.85)",   // medium magenta
        "rgba(200, 60, 180, 0.9)",    // bright magenta
        "rgba(255, 120, 200, 0.7)",   // edge highlight
        "rgba(255, 180, 220, 0.4)"    // center line
    ]);
    ctx.shadowBlur = 0;

    // Crack lines (white energy leaking)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(time * 0.8) * 0.12);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 1.5;
    // Random-looking cracks
    var cracks = [
        [-10, -40, 5, -15], [5, -15, -8, 10], [-8, 10, 12, 35],
        [15, -30, 25, -5], [25, -5, 10, 20],
        [-20, -10, -30, 15]
    ];
    for (var c = 0; c < cracks.length; c++) {
        var crack = cracks[c];
        var cAlpha = (0.3 + Math.sin(time * 6 + c * 2) * 0.3).toFixed(2);
        ctx.strokeStyle = "rgba(255, 255, 255, " + cAlpha + ")";
        ctx.beginPath();
        ctx.moveTo(crack[0], crack[1]);
        ctx.lineTo(crack[2], crack[3]);
        ctx.stroke();
    }
    ctx.restore();

    // AT Field hexagonal rings (visible permanently)
    ctx.globalAlpha = 0.15 + Math.sin(time * 2) * 0.05;
    var hexRingR = 85 + Math.sin(time * 1.5) * 5;
    ctx.strokeStyle = "rgba(255, 180, 0, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var h = 0; h < 6; h++) {
        var hAngle = (h / 6) * Math.PI * 2 + time * 0.3;
        var hx = cx + Math.cos(hAngle) * hexRingR;
        var hy = cy + Math.sin(hAngle) * hexRingR;
        if (h === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Electric arcs from body
    for (var e = 0; e < 4; e++) {
        var eAngle = time * 2.5 + e * Math.PI / 2;
        var eLen = 40 + Math.sin(time * 5 + e * 3) * 20;
        var ex1 = cx + Math.cos(eAngle) * 42 * 0.7;
        var ey1 = cy + Math.sin(eAngle) * 30;
        var ex2 = cx + Math.cos(eAngle) * (42 * 0.7 + eLen);
        var ey2 = cy + Math.sin(eAngle) * (30 + eLen * 0.5);
        var eMid1x = (ex1 + ex2) / 2 + (Math.random() - 0.5) * 15;
        var eMid1y = (ey1 + ey2) / 2 + (Math.random() - 0.5) * 15;
        var eAlpha = (0.3 + Math.sin(time * 8 + e) * 0.2).toFixed(2);
        ctx.strokeStyle = "rgba(180, 200, 255, " + eAlpha + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ex1, ey1);
        ctx.lineTo(eMid1x, eMid1y);
        ctx.lineTo(ex2, ey2);
        ctx.stroke();
    }

    // Fire particles
    for (var i = 0; i < 10; i++) {
        var fAngle = time * 1.8 + i * Math.PI / 5;
        var fR = 70 + Math.sin(time * 4 + i * 2) * 12;
        var fx = cx + Math.cos(fAngle) * fR;
        var fy = cy + Math.sin(fAngle) * fR * 0.4;
        var fSize = 2 + Math.sin(time * 5 + i) * 1;
        var fAlpha = (0.4 + Math.sin(time * 4 + i) * 0.25).toFixed(2);
        ctx.fillStyle = "rgba(255, " + Math.floor(50 + Math.sin(time + i) * 50) + ", " + Math.floor(150 + Math.sin(time * 2 + i) * 80) + ", " + fAlpha + ")";
        ctx.beginPath();
        ctx.arc(fx, fy, fSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // Core (intense red, flickering)
    var corePulse = Math.sin(time * 5) * 0.2 + 0.8;
    var coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
    coreGrad.addColorStop(0, "rgba(255, 40, 20, " + (1.0 * corePulse).toFixed(2) + ")");
    coreGrad.addColorStop(0.3, "rgba(255, 80, 50, " + (0.7 * corePulse).toFixed(2) + ")");
    coreGrad.addColorStop(0.6, "rgba(200, 20, 80, " + (0.4 * corePulse).toFixed(2) + ")");
    coreGrad.addColorStop(1, "rgba(100, 0, 0, 0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};

Enemy.prototype.drawHourglass = function(ctx, gravityDir) {
    var time = this.timeCounter;
    var cx = 370;
    var cy = 180 + Math.sin(time * 1.5) * 10; // Floating
    var size = 65; // Slightly larger
    
    ctx.save();
    
    // Rotation if inverted
    if (gravityDir === -1) {
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI);
        ctx.translate(-cx, -cy);
    }

    var isBlue = gravityDir === -1;
    var primaryColor = isBlue ? "rgba(100, 220, 255, 1)" : "rgba(255, 220, 100, 1)";
    var glowColor = isBlue ? "rgba(50, 150, 255, 0.4)" : "rgba(255, 150, 50, 0.4)";

    // 1. Background Runes/Roman Numerals
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time * 0.2 * (isBlue ? -1 : 1));
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 20px 'Georgia', serif";
    ctx.fillStyle = glowColor;
    ctx.shadowBlur = 15;
    ctx.shadowColor = primaryColor;
    var numerals = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
    var ringRadius = 140;
    for(var n=0; n<12; n++) {
        var a = (n/12) * Math.PI * 2 - Math.PI/2;
        ctx.save();
        ctx.translate(Math.cos(a) * ringRadius, Math.sin(a) * ringRadius);
        ctx.rotate(a + Math.PI/2);
        ctx.fillText(numerals[n], 0, 0);
        ctx.restore();
    }
    // Inner delicate ring
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius - 20, 0, Math.PI*2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius + 20, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();

    // 2. Temporal distortion glow
    var distGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 160);
    distGrad.addColorStop(0, glowColor);
    distGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = distGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 160, 0, Math.PI * 2);
    ctx.fill();

    // 3. Sand particles (procedural with trails and glow)
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for(var i=0; i<60; i++) {
        var pTime = (time * 0.8 + i * 0.03) % 1.0; 
        // Flowing down funnel
        var px, py;
        if (pTime < 0.5) {
            // Upper half: falling and gathering
            var progress = pTime * 2; // 0 to 1
            var spread = (1 - progress) * size * 0.8;
            px = cx + Math.sin(time*5 + i) * spread;
            py = cy - size + progress * size;
        } else {
            // Lower half: falling and piling
            var progress = (pTime - 0.5) * 2; // 0 to 1
            var spread = progress * size * 0.8;
            px = cx + Math.sin(time*6 + i) * spread;
            py = cy + progress * size;
        }

        ctx.fillStyle = primaryColor;
        ctx.shadowBlur = 10;
        ctx.shadowColor = primaryColor;
        ctx.beginPath();
        ctx.arc(px, py, 2 + Math.random(), 0, Math.PI*2);
        ctx.fill();
    }
    ctx.restore();

    // 4. Intricate Metallic Frames (The Hourglass structure)
    // Metallic gradient
    var metalGrad = ctx.createLinearGradient(cx - size, cy - size, cx + size, cy + size);
    metalGrad.addColorStop(0, "#F5D76E"); // Light Gold
    metalGrad.addColorStop(0.3, "#A67C00"); // Dark Gold
    metalGrad.addColorStop(0.7, "#BF953F"); // Mid Gold
    metalGrad.addColorStop(1, "#FCF6BA"); // Highlight
    if (isBlue) {
        metalGrad = ctx.createLinearGradient(cx - size, cy - size, cx + size, cy + size);
        metalGrad.addColorStop(0, "#C4E0E5"); 
        metalGrad.addColorStop(0.3, "#4CA1AF"); 
        metalGrad.addColorStop(0.7, "#2C3E50"); 
        metalGrad.addColorStop(1, "#FDFFFF"); 
    }

    ctx.fillStyle = "rgba(10, 10, 15, 0.85)"; // Glass back
    ctx.strokeStyle = metalGrad;
    ctx.lineWidth = 6;
    ctx.lineJoin = "round";

    // Top Pyramid
    ctx.beginPath();
    ctx.moveTo(cx - size, cy - size);
    ctx.lineTo(cx + size, cy - size);
    ctx.lineTo(cx + 8, cy - 8); // Neck
    ctx.lineTo(cx - 8, cy - 8); // Neck
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bottom Pyramid
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy + 8); // Neck
    ctx.lineTo(cx + 8, cy + 8); // Neck
    ctx.lineTo(cx + size, cy + size);
    ctx.lineTo(cx - size, cy + size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Side Pillars (to hold the glass)
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx - size, cy - size); ctx.lineTo(cx - size, cy + size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + size, cy - size); ctx.lineTo(cx + size, cy + size); ctx.stroke();

    // Glass reflection
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.beginPath();
    ctx.moveTo(cx - size*0.8, cy - size*0.9);
    ctx.lineTo(cx - size*0.2, cy - size*0.9);
    ctx.lineTo(cx - 5, cy - 15);
    ctx.lineTo(cx - 15, cy - 15);
    ctx.closePath();
    ctx.fill();

    // 5. Central glowing Eye (The God's Core)
    var eyeBlink = Math.sin(time * 4) > 0.8 ? 0.1 : 1.0;
    ctx.fillStyle = isBlue ? "#00FFFF" : "#FF3300";
    ctx.shadowBlur = 20;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 12, 5 * eyeBlink, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Slit pupil
    ctx.fillStyle = "#000";
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 2, 4 * eyeBlink, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx, cy, 2 * eyeBlink, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};

Enemy.prototype.drawHourglassShattered = function(ctx) {
    var time = this.timeCounter;
    var cx = 370;
    var cy = 180 + Math.sin(time * 3) * 12; // Extremely erratic floating
    
    ctx.save();

    // 1. OMEGA VORTEX BACKGROUND (Massive dark red portal)
    var vortexAlpha = (0.5 + Math.sin(time * 15) * 0.2).toFixed(2);
    var vortexGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 280);
    vortexGrad.addColorStop(0, "rgba(255, 255, 255, " + vortexAlpha + ")");
    vortexGrad.addColorStop(0.2, "rgba(255, 0, 0, " + (vortexAlpha * 0.8).toFixed(2) + ")");
    vortexGrad.addColorStop(0.5, "rgba(80, 0, 50, " + (vortexAlpha * 0.4).toFixed(2) + ")");
    vortexGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time * 0.5); // Rotating vortex
    ctx.fillStyle = vortexGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 280, 0, Math.PI * 2);
    ctx.fill();
    
    // Vortex spiral arms
    ctx.strokeStyle = "rgba(255, 50, 50, 0.3)";
    ctx.lineWidth = 4;
    for(var s=0; s<6; s++) {
        ctx.beginPath();
        for(var a=0; a<Math.PI*2; a+=0.2) {
            var r = a * 30;
            var tx = Math.cos(a + s * (Math.PI/3) - time*2) * r;
            var ty = Math.sin(a + s * (Math.PI/3) - time*2) * r;
            if (a===0) ctx.moveTo(tx, ty);
            else ctx.lineTo(tx, ty);
        }
        ctx.stroke();
    }
    ctx.restore();

    // 2. GIANT OMEGA EYE (Center of the vortex)
    var eyeBlink = Math.sin(time * 5) > 0.8 ? 0.1 : 1.0;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#FF0000";
    ctx.fillStyle = "rgba(100, 0, 0, 0.9)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 45, 25 * eyeBlink, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Slit pupil
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 8, 20 * eyeBlink, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 2, 18 * eyeBlink, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. GLITCH REALITY TEARS
    ctx.lineWidth = 3;
    for (var g = 0; g < 15; g++) {
        var gY = cy - 150 + g * 20 + (Math.random()-0.5)*10;
        var gX = cx + (Math.random()-0.5)*200;
        if (Math.random() < 0.3) { // Flicker
            ctx.strokeStyle = Math.random() > 0.5 ? "rgba(0, 255, 255, 0.7)" : "rgba(255, 0, 255, 0.7)";
            ctx.beginPath();
            ctx.moveTo(gX - 50 - Math.random()*50, gY);
            ctx.lineTo(gX + 50 + Math.random()*50, gY + (Math.random()-0.5)*10);
            ctx.stroke();
            
            // Glitch block
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fillRect(gX - 10, gY - 5, Math.random()*40, Math.random()*10);
        }
    }

    // 4. SHATTERED OMEGA FRAME (Orbiting chaotic metal parts)
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(255, 200, 50, 0.6)";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    
    var frameParts = [
        {x: -80, y: -90, a: time*2.1}, {x: 80, y: -90, a: -time*1.8},
        {x: -90, y: 0, a: time*1.5}, {x: 90, y: 0, a: -time*1.2},
        {x: -80, y: 90, a: time*2.5}, {x: 80, y: 90, a: -time*2}
    ];
    
    for (var i = 0; i < frameParts.length; i++) {
        var fp = frameParts[i];
        ctx.save();
        ctx.translate(cx + fp.x + Math.sin(time*5+i)*10, cy + fp.y + Math.cos(time*4+i)*10);
        ctx.rotate(fp.a);
        
        ctx.strokeStyle = i%2===0 ? "#8b7355" : "#a68862"; // Dark gold/bronze
        ctx.beginPath();
        ctx.moveTo(-30, -10);
        ctx.quadraticCurveTo(0, -30, 30, 10);
        ctx.stroke();
        
        // Spikes on the frame
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#553311";
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(0, -35);
        ctx.stroke();
        
        ctx.restore();
    }
    
    ctx.shadowBlur = 0;

    // 5. CHAOTIC SAND OF TIME HURRICANE
    ctx.fillStyle = "rgba(255, 215, 0, 0.9)";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(255, 200, 50, 1)";
    for (var i = 0; i < 150; i++) {
        var angle = i * 0.1 + time * (2 + (i % 3));
        var r = (time * 100 + i * 15) % 200;
        
        // Swirling outwards then falling
        var px = cx + Math.cos(angle) * r;
        var py = cy + Math.sin(angle) * r * 0.5 + (r * 0.8);
        
        var sSize = 1 + Math.random() * 3;
        ctx.globalAlpha = 1 - (r / 200);
        ctx.beginPath();
        ctx.arc(px, py, sSize, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // 6. MASSIVE SHATTERED GLASS CLOUD
    var glassColor = "rgba(180, 240, 255, 0.4)";
    var glassGlow = "rgba(255, 255, 255, 0.9)";
    
    for (var f = 0; f < 12; f++) {
        // Orbiting glass shards
        var gA = time * (1 + f*0.2) + f * (Math.PI/6);
        var gR = 60 + Math.sin(time*2 + f)*30;
        
        var fx = cx + Math.cos(gA) * gR;
        var fy = cy + Math.sin(gA) * gR * 0.5 + Math.sin(time*5+f)*15;
        
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(time * (f%2===0?2:-2) + f);
        
        // Huge jagged shapes
        ctx.fillStyle = glassColor;
        ctx.beginPath();
        ctx.moveTo(-15, -20);
        ctx.lineTo(25, -10);
        ctx.lineTo(10, 30);
        ctx.lineTo(-20, 15);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(150, 200, 255, 1)";
        ctx.strokeStyle = glassGlow;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Reflection
        ctx.beginPath();
        ctx.moveTo(-5, -10);
        ctx.lineTo(10, 5);
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.stroke();
        
        ctx.restore();
    }

    // 7. ORBITING GEARS OF TIME
    for(var gr=0; gr<4; gr++) {
        var gearA = -time * (0.5 + gr*0.3) + gr * (Math.PI/2);
        var gearR = 150 + Math.sin(time*3+gr)*20;
        var gearX = cx + Math.cos(gearA) * gearR;
        var gearY = cy + Math.sin(gearA) * gearR;
        
        ctx.save();
        ctx.translate(gearX, gearY);
        ctx.rotate(time * (3 + gr));
        
        ctx.fillStyle = "rgba(30, 20, 10, 0.8)";
        ctx.strokeStyle = "rgba(255, 200, 50, 0.8)";
        ctx.lineWidth = 2;
        
        // Draw gear
        ctx.beginPath();
        for(var i=0; i<8; i++) {
            var ga = i * (Math.PI/4);
            ctx.lineTo(Math.cos(ga-0.1)*15, Math.sin(ga-0.1)*15);
            ctx.lineTo(Math.cos(ga)*20, Math.sin(ga)*20);
            ctx.lineTo(Math.cos(ga+0.1)*15, Math.sin(ga+0.1)*15);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Gear center
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI*2);
        ctx.stroke();
        
        ctx.restore();
    }

    // 8. CREEPY MULTIPLE EYES IN THE SHARDS
    for (var e = 0; e < 6; e++) {
        var eyeR = 80 + Math.sin(time * 4 + e) * 20; 
        var eyeA = time * (1.2 + e * 0.3) + e * (Math.PI / 3);
        
        var eyeX = cx + Math.cos(eyeA) * eyeR + (Math.random() - 0.5) * 8;
        var eyeY = cy + Math.sin(eyeA) * eyeR * 0.7 + (Math.random() - 0.5) * 8;
        
        var eb = Math.sin(time * (8 + e)) > 0.6 ? 0.1 : 1.0;
        
        // Sclera
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FF0000";
        ctx.fillStyle = "rgba(200, 0, 0, 0.9)";
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, 15, 6 * eb, eyeA, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupil
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#FFF";
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 3 * eb, 0, Math.PI * 2);
        ctx.fill();
        
        // Slit
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, 1 * eb, 2.5 * eb, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
};

Enemy.prototype.drawSachiel = function(ctx) {
    var time = this.timeCounter * 5;
    var bossX = 370;
    var bossY = 130; // Raised to fit the arms and large shoulders
    
    if (this.jitterEnabled) {
        bossX += Math.sin(this.timeCounter * 50) * 1.5;
        bossY += Math.cos(this.timeCounter * 60) * 1.5;
    }
    
    ctx.save();
    
    var breatheY = Math.sin(time) * 4;
    var shoulderY = Math.cos(time * 0.7) * 6;

    // VFX: Ambient pulsing dark aura behind the whole figure
    var auraPulse = 0.15 + Math.sin(time * 0.8) * 0.08;
    var auraGrad = ctx.createRadialGradient(bossX, bossY + 80, 20, bossX, bossY + 80, 200);
    auraGrad.addColorStop(0, "rgba(80, 0, 0, " + auraPulse.toFixed(2) + ")");
    auraGrad.addColorStop(0.4, "rgba(40, 0, 20, " + (auraPulse * 0.6).toFixed(2) + ")");
    auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(bossX, bossY + 80, 200, 0, Math.PI * 2);
    ctx.fill();

    // VFX: Floating dark energy wisps around the body
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (var w = 0; w < 12; w++) {
        var wAngle = time * 0.4 + w * Math.PI * 2 / 12;
        var wRadX = 100 + Math.sin(time * 0.6 + w * 1.5) * 40;
        var wRadY = 80 + Math.cos(time * 0.5 + w * 2) * 30;
        var wx = bossX + Math.cos(wAngle) * wRadX;
        var wy = bossY + 60 + Math.sin(wAngle) * wRadY;
        var wSize = 3 + Math.sin(time * 2 + w) * 1.5;
        var wAlpha = (0.08 + Math.sin(time * 1.5 + w * 3) * 0.06);
        if (wAlpha < 0) wAlpha = 0;
        var wGrad = ctx.createRadialGradient(wx, wy, 0, wx, wy, wSize * 3);
        wGrad.addColorStop(0, "rgba(60, 0, 30, " + wAlpha.toFixed(3) + ")");
        wGrad.addColorStop(1, "rgba(20, 0, 10, 0)");
        ctx.fillStyle = wGrad;
        ctx.beginPath();
        ctx.arc(wx, wy, wSize * 3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    // Helper function to draw a bird mask
    function drawBirdMask(ctx, mx, my, scale, rot) {
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(rot);
        ctx.scale(scale, scale);
        
        ctx.fillStyle = "#e0dad0"; // Pale aged bone color
        ctx.shadowBlur = 12;
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        
        // Draw main mask shape (rounder top, sharper beak)
        ctx.beginPath();
        ctx.moveTo(-18, -10);
        ctx.bezierCurveTo(-18, -30, 18, -30, 18, -10); // Bulging round top
        ctx.quadraticCurveTo(14, 15, 0, 40); // Sharp beak down
        ctx.quadraticCurveTo(-14, 15, -18, -10); // Sharp beak up
        ctx.closePath();
        ctx.fill();
        
        // Soft shading for the mask's roundness
        var maskGrad = ctx.createRadialGradient(-5, -15, 2, 0, -5, 30);
        maskGrad.addColorStop(0, "rgba(255, 255, 255, 0.7)");
        maskGrad.addColorStop(0.5, "rgba(0, 0, 0, 0)");
        maskGrad.addColorStop(1, "rgba(0, 0, 0, 0.5)");
        ctx.fillStyle = maskGrad;
        ctx.fill();
        
        // Outline / wear and tear
        ctx.strokeStyle = "rgba(50, 40, 30, 0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Eye Sockets (Deep hollows)
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#0a0a0a"; // Almost black socket
        
        ctx.beginPath();
        ctx.arc(-8, -4, 4.5, 0, Math.PI * 2); // Left socket
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(8, -4, 4.5, 0, Math.PI * 2); // Right socket
        ctx.fill();
        
        // The glowing yellow/amber Irises
        ctx.fillStyle = "#d4a017"; // Amber
        ctx.beginPath(); ctx.arc(-8, -4, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, -4, 1.8, 0, Math.PI * 2); ctx.fill();
        
        // Pupils
        ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.arc(-8, -4, 0.8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, -4, 0.8, 0, Math.PI * 2); ctx.fill();
        
        // Tiny eye reflection
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(-8.5, -4.5, 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(7.5, -4.5, 0.5, 0, Math.PI * 2); ctx.fill();
        
        ctx.restore();
    }

    // Outer aura/glow
    ctx.shadowBlur = 40;
    ctx.shadowColor = "rgba(100, 0, 0, 0.3)";
    
    // Small back bone spikes (behind the neck)
    ctx.fillStyle = "#d4c8a0";
    ctx.beginPath();
    ctx.moveTo(bossX - 25, bossY - 35 + breatheY);
    ctx.lineTo(bossX - 35, bossY - 50 + breatheY);
    ctx.lineTo(bossX - 15, bossY - 30 + breatheY);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bossX + 25, bossY - 35 + breatheY);
    ctx.lineTo(bossX + 35, bossY - 50 + breatheY);
    ctx.lineTo(bossX + 15, bossY - 30 + breatheY);
    ctx.fill();

    // 1. Torso (Dark purplish, glossy, severely emaciated waist, extending wide under shoulders)
    var torsoGrad = ctx.createLinearGradient(0, bossY - 40, 0, bossY + 200);
    torsoGrad.addColorStop(0, "#2c2738");
    torsoGrad.addColorStop(0.3, "#1a1625");
    torsoGrad.addColorStop(0.8, "#0e0c14");
    ctx.fillStyle = torsoGrad;
    
    ctx.beginPath();
    // Neck/Top
    ctx.moveTo(bossX - 40, bossY - 30 + breatheY);
    ctx.quadraticCurveTo(bossX, bossY - 45 + breatheY, bossX + 40, bossY - 30 + breatheY);
    // Right shoulder extension (reaching out to the far arm)
    ctx.bezierCurveTo(bossX + 90, bossY - 30 + breatheY, bossX + 160, bossY - 10 + breatheY, bossX + 160, bossY + 40 + breatheY);
    // Emaciated Right Waist (coming all the way back in)
    ctx.bezierCurveTo(bossX + 100, bossY + 120 + breatheY, bossX + 15, bossY + 160 + breatheY, bossX + 35, bossY + 200 + breatheY);
    // Hips/Bottom
    ctx.lineTo(bossX - 35, bossY + 200 + breatheY);
    // Emaciated Left Waist (going back out)
    ctx.bezierCurveTo(bossX - 15, bossY + 160 + breatheY, bossX - 100, bossY + 120 + breatheY, bossX - 160, bossY + 40 + breatheY);
    // Left shoulder extension
    ctx.bezierCurveTo(bossX - 160, bossY - 10 + breatheY, bossX - 90, bossY - 30 + breatheY, bossX - 40, bossY - 30 + breatheY);
    ctx.fill();
    
    // Glossy skin highlights (muscles stretching to the waist)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    for(var sl=0; sl<4; sl++) {
        ctx.beginPath();
        // Left side muscles
        ctx.moveTo(bossX - 40 - sl*15, bossY - 10 + breatheY);
        ctx.quadraticCurveTo(bossX - 60 - sl*10, bossY + 50 + breatheY, bossX - 10, bossY + 140 + breatheY);
        ctx.stroke();
        // Right side muscles
        ctx.beginPath();
        ctx.moveTo(bossX + 40 + sl*15, bossY - 10 + breatheY);
        ctx.quadraticCurveTo(bossX + 60 + sl*10, bossY + 50 + breatheY, bossX + 10, bossY + 140 + breatheY);
        ctx.stroke();
    }
    
    // Internal rib structures showing through skin at waist
    ctx.strokeStyle = "rgba(100, 90, 110, 0.3)";
    ctx.lineWidth = 4;
    for(var r=0; r<4; r++) {
        ctx.beginPath(); ctx.moveTo(bossX - 10, bossY + 110 + r*15 + breatheY); ctx.lineTo(bossX - 25, bossY + 105 + r*15 + breatheY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bossX + 10, bossY + 110 + r*15 + breatheY); ctx.lineTo(bossX + 25, bossY + 105 + r*15 + breatheY); ctx.stroke();
    }

    // 2. Arms (Muscular but elongated, hanging down directly from the shoulder pad peaks)
    var armGradL = ctx.createLinearGradient(bossX - 200, bossY, bossX - 120, bossY);
    armGradL.addColorStop(0, "#1a1625"); // Outer dark edge
    armGradL.addColorStop(0.4, "#3d364d"); // Glossy muscle highlight
    armGradL.addColorStop(1, "#0e0c14"); // Inner shadow
    
    // Left Arm (Moved far left to bossX - 165)
    ctx.fillStyle = armGradL;
    ctx.beginPath();
    ctx.moveTo(bossX - 150, bossY + 40 + shoulderY); // Inner armpit
    // Bicep bulge
    ctx.bezierCurveTo(bossX - 170, bossY + 60, bossX - 185, bossY + 100, bossX - 165, bossY + 140);
    // Forearm bulge
    ctx.bezierCurveTo(bossX - 180, bossY + 180, bossX - 170, bossY + 220, bossX - 155, bossY + 260);
    // Inner arm going back up
    ctx.lineTo(bossX - 135, bossY + 260);
    ctx.bezierCurveTo(bossX - 145, bossY + 220, bossX - 150, bossY + 180, bossX - 145, bossY + 140);
    ctx.bezierCurveTo(bossX - 135, bossY + 100, bossX - 130, bossY + 60, bossX - 135, bossY + 40 + shoulderY);
    ctx.fill();
    
    // Muscle striations / highlights for left arm
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(bossX - 165, bossY + 70); ctx.quadraticCurveTo(bossX - 175, bossY + 100, bossX - 155, bossY + 135); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bossX - 160, bossY + 150); ctx.quadraticCurveTo(bossX - 170, bossY + 190, bossX - 150, bossY + 240); ctx.stroke();

    // Right Arm (Moved far right to bossX + 165)
    var armGradR = ctx.createLinearGradient(bossX + 120, bossY, bossX + 200, bossY);
    armGradR.addColorStop(0, "#0e0c14"); // Inner shadow
    armGradR.addColorStop(0.6, "#3d364d"); // Glossy muscle highlight
    armGradR.addColorStop(1, "#1a1625"); // Outer dark edge
    
    ctx.fillStyle = armGradR;
    ctx.beginPath();
    ctx.moveTo(bossX + 150, bossY + 40 + shoulderY); // Inner armpit
    // Bicep bulge
    ctx.bezierCurveTo(bossX + 170, bossY + 60, bossX + 185, bossY + 100, bossX + 165, bossY + 140);
    // Forearm bulge
    ctx.bezierCurveTo(bossX + 180, bossY + 180, bossX + 170, bossY + 220, bossX + 155, bossY + 260);
    // Inner arm going back up
    ctx.lineTo(bossX + 135, bossY + 260);
    ctx.bezierCurveTo(bossX + 145, bossY + 220, bossX + 150, bossY + 180, bossX + 145, bossY + 140);
    ctx.bezierCurveTo(bossX + 135, bossY + 100, bossX + 130, bossY + 60, bossX + 135, bossY + 40 + shoulderY);
    ctx.fill();

    // Muscle striations / highlights for right arm
    ctx.beginPath(); ctx.moveTo(bossX + 165, bossY + 70); ctx.quadraticCurveTo(bossX + 175, bossY + 100, bossX + 155, bossY + 135); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bossX + 160, bossY + 150); ctx.quadraticCurveTo(bossX + 170, bossY + 190, bossX + 150, bossY + 240); ctx.stroke();

    // 3. Massive Bone Shoulder Pads (Evangelion Style)
    // They are huge, bulbous at the top, sweeping down to a sharp point on the outside.
    var shoulderGrad = ctx.createLinearGradient(0, bossY - 50, 0, bossY + 120);
    shoulderGrad.addColorStop(0, "#f2ede4"); // Top highlight
    shoulderGrad.addColorStop(0.5, "#d6cfc3"); // Mid bone
    shoulderGrad.addColorStop(1, "#80786c"); // Dark bottom edge
    
    ctx.fillStyle = shoulderGrad;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    
    function drawShoulderPad(isRight) {
        ctx.save();
        ctx.translate(bossX, bossY + shoulderY);
        if (isRight) ctx.scale(-1, 1);
        
        ctx.beginPath();
        // Start near the neck
        ctx.moveTo(-35, -25);
        // Bulbous massive top
        ctx.bezierCurveTo(-60, -45, -110, -45, -135, -10);
        // Sweeping down to sharp point
        ctx.bezierCurveTo(-150, 20, -165, 80, -170, 140);
        // Inner curve coming back up
        ctx.bezierCurveTo(-150, 100, -120, 60, -80, 40);
        // Connect back to neck
        ctx.bezierCurveTo(-50, 30, -35, 0, -35, -25);
        ctx.fill();
        
        // Bone textures / cracks
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-110, -15); ctx.lineTo(-140, 25); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-70, -25); ctx.quadraticCurveTo(-90, -10, -100, 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-135, 40); ctx.lineTo(-155, 90); ctx.stroke();
        
        // The 3 iconic holes cluster
        ctx.shadowBlur = 0;
        function drawPadHole(hx, hy, r) {
            var hGrad = ctx.createRadialGradient(hx - r*0.3, hy - r*0.3, r*0.1, hx, hy, r);
            hGrad.addColorStop(0, "#050505");
            hGrad.addColorStop(1, "#151515");
            ctx.fillStyle = hGrad;
            ctx.beginPath(); ctx.arc(hx, hy, r, 0, Math.PI*2); ctx.fill();
            // Rim
            ctx.strokeStyle = "rgba(255,255,255,0.4)";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(hx, hy, r, Math.PI, Math.PI*1.5); ctx.stroke();
        }
        
        // Cluster on the wide part of the shoulder pad
        drawPadHole(-100, 15, 16); // Large bottom hole
        drawPadHole(-120, -10, 8); // Top outer hole
        drawPadHole(-80, -5, 7);   // Top inner hole
        
        ctx.restore();
    }
    
    drawShoulderPad(false); // Left
    drawShoulderPad(true);  // Right

    // 4. Red Glowing Core
    var coreGlow = 0.6 + Math.sin(time * 3) * 0.4;
    var coreX = bossX;
    var coreY = bossY + 90 + breatheY;
    
    ctx.shadowBlur = 25 + Math.sin(time * 6) * 15;
    ctx.shadowColor = "#FF0000";
    ctx.fillStyle = "rgba(255, 0, 0, " + coreGlow + ")";
    ctx.beginPath();
    ctx.arc(coreX, coreY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Inner bright core
    ctx.fillStyle = "rgba(255, 200, 200, " + (coreGlow * 0.9) + ")";
    ctx.beginPath();
    ctx.arc(coreX, coreY, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // 5. Bone Ribs/Thorns around core (like a skeletal hand gripping the core)
    ctx.fillStyle = "#e0dad0";
    ctx.strokeStyle = "rgba(50, 40, 30, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    
    function drawRib(rx, ry, isRight) {
        ctx.save();
        ctx.translate(rx, ry);
        if (isRight) ctx.scale(-1, 1);
        
        ctx.beginPath();
        // Main thick rib curving in
        ctx.moveTo(-50, -20);
        ctx.quadraticCurveTo(-20, -5, -5, -20); // Top inward spike
        ctx.lineTo(-8, -10);
        ctx.quadraticCurveTo(-25, 0, -50, -10);
        
        // Middle inward spike
        ctx.moveTo(-45, -5);
        ctx.quadraticCurveTo(-20, 15, -10, 5);
        ctx.lineTo(-14, 12);
        ctx.quadraticCurveTo(-25, 20, -45, 5);
        
        // Upward/Outward spikes (like in the image)
        ctx.moveTo(-25, -5);
        ctx.lineTo(-30, -35); // Sharp spike pointing up-left
        ctx.lineTo(-20, -10);
        
        ctx.moveTo(-15, 5);
        ctx.lineTo(-10, -25); // Sharp spike pointing up
        ctx.lineTo(-10, 0);
        
        // Lower downward spike
        ctx.moveTo(-35, 2);
        ctx.lineTo(-35, 25);
        ctx.lineTo(-28, 5);
        
        ctx.fill();
        ctx.stroke();
        
        // Skeletal stubs/vertebrae attaching to the core side
        ctx.fillStyle = "#baa892";
        for(var i=0; i<4; i++) {
            ctx.fillRect(-50, -15 + i*10, 10, 5);
            ctx.strokeRect(-50, -15 + i*10, 10, 5);
        }
        
        ctx.restore();
    }
    
    drawRib(coreX, coreY, false); // Left ribs
    drawRib(coreX, coreY, true);  // Right ribs

    // VFX: Faint red energy lines connecting masks to core
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var maskPositions = [
        { x: bossX - 25, y: bossY - 5 + breatheY },
        { x: bossX + 35, y: bossY + 25 + breatheY },
        { x: bossX, y: bossY + 10 + breatheY }
    ];
    for (var ml = 0; ml < maskPositions.length; ml++) {
        var mp = maskPositions[ml];
        var lineAlpha = (0.08 + Math.sin(time * 3 + ml * 2) * 0.06).toFixed(3);
        var lineGrad = ctx.createLinearGradient(mp.x, mp.y, coreX, coreY);
        lineGrad.addColorStop(0, "rgba(255, 50, 0, " + lineAlpha + ")");
        lineGrad.addColorStop(0.5, "rgba(255, 0, 0, " + (parseFloat(lineAlpha) * 1.5).toFixed(3) + ")");
        lineGrad.addColorStop(1, "rgba(255, 80, 0, " + lineAlpha + ")");
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(mp.x, mp.y);
        // Curvy energy line with midpoint offset
        var midX = (mp.x + coreX) / 2 + Math.sin(time * 4 + ml * 3) * 12;
        var midY = (mp.y + coreY) / 2 + Math.cos(time * 3 + ml * 2) * 8;
        ctx.quadraticCurveTo(midX, midY, coreX, coreY);
        ctx.stroke();
    }
    ctx.restore();

    // 6. Three Bird Masks
    // Left small mask
    drawBirdMask(ctx, bossX - 25, bossY - 5 + breatheY, 0.7, -0.3);
    // Right small mask
    drawBirdMask(ctx, bossX + 35, bossY + 25 + breatheY, 0.8, 0.2);
    // Center large mask
    drawBirdMask(ctx, bossX, bossY + 10 + breatheY, 1.2, 0);

    // 7. Core Particles (MORE numerous and dramatic)
    if (!this.sachielParticles) this.sachielParticles = [];
    // Spawn 2-3 particles per frame instead of 0-1
    var spawnCount = 2 + (Math.random() < 0.5 ? 1 : 0);
    for (var sp = 0; sp < spawnCount; sp++) {
        this.sachielParticles.push({
            x: coreX + (Math.random()-0.5)*30,
            y: coreY + (Math.random()-0.5)*30,
            vx: (Math.random()-0.5)*60,
            vy: (Math.random()-0.5)*50 - 30,
            life: 0.8 + Math.random() * 0.6,
            size: Math.random()*4 + 1.5
        });
    }
    
    var dt = 1/60;
    ctx.fillStyle = "#FF3300";
    for (var i = this.sachielParticles.length - 1; i >= 0; i--) {
        var p = this.sachielParticles[i];
        p.life -= dt;
        if (p.life <= 0) {
            this.sachielParticles.splice(i, 1);
            continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        
        ctx.globalAlpha = p.life;
        ctx.globalCompositeOperation = "lighter";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = "source-over";
    
    ctx.restore();
}

// ---- SACHIEL PHASE 2: MUTATED FORM ----
Enemy.prototype.drawSachielMutated = function(ctx) {
    var time = this.timeCounter || 0;
    var cx = this.damagePos.x;
    var cy = this.damagePos.y - 100;
    var breathe = Math.sin(time * 2.5) * 3;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1.4, 1.4);
    
    // --- Dark pulsing aura ---
    ctx.globalCompositeOperation = "lighter";
    var auraGrad = ctx.createRadialGradient(0, 10, 20, 0, 10, 100 + breathe);
    auraGrad.addColorStop(0, "rgba(200, 0, 0, 0.2)");
    auraGrad.addColorStop(0.5, "rgba(80, 0, 0, 0.1)");
    auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 10, 100 + breathe, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    
    // VFX: Corruption particles floating off the body
    if (!this._mutCorruptionParticles) this._mutCorruptionParticles = [];
    if (Math.random() < 0.7) {
        this._mutCorruptionParticles.push({
            x: (Math.random() - 0.5) * 80,
            y: -10 + Math.random() * 100,
            vx: (Math.random() - 0.5) * 15,
            vy: -15 - Math.random() * 25,
            life: 0.8 + Math.random() * 0.6,
            maxLife: 0.8 + Math.random() * 0.6,
            size: 1.5 + Math.random() * 3
        });
    }
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var cdt = 1/60;
    for (var cp = this._mutCorruptionParticles.length - 1; cp >= 0; cp--) {
        var cPart = this._mutCorruptionParticles[cp];
        cPart.life -= cdt;
        if (cPart.life <= 0) { this._mutCorruptionParticles.splice(cp, 1); continue; }
        cPart.x += cPart.vx * cdt;
        cPart.y += cPart.vy * cdt;
        var cpAlpha = (cPart.life / cPart.maxLife) * 0.5;
        ctx.fillStyle = "rgba(180, 0, 40, " + cpAlpha.toFixed(3) + ")";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(255, 0, 50, 0.3)";
        ctx.beginPath();
        ctx.arc(cPart.x, cPart.y, cPart.size * (cPart.life / cPart.maxLife), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    // --- Torso (asymmetric, swollen right side) ---
    ctx.fillStyle = "#2a1a15";
    ctx.beginPath();
    ctx.moveTo(-38, -10);
    ctx.quadraticCurveTo(-42, 40 + breathe, -30, 90);
    ctx.lineTo(35, 90);
    ctx.quadraticCurveTo(50 + Math.sin(time*3)*5, 40 + breathe, 42, -10);
    ctx.closePath();
    ctx.fill();
    
    // Pulsating dark veins (VFX: glow brighter over time)
    var veinTimeFactor = Math.min(time * 0.04, 1.0); // gradually intensify
    var veinBaseAlpha = 0.5 + veinTimeFactor * 0.4;
    var veinGlow = 3 + veinTimeFactor * 10;
    ctx.save();
    ctx.shadowBlur = veinGlow;
    ctx.shadowColor = "rgba(255, 0, 50, " + (veinTimeFactor * 0.6).toFixed(2) + ")";
    ctx.strokeStyle = "rgba(150, 0, 50, " + veinBaseAlpha.toFixed(2) + ")";
    ctx.lineWidth = 1.5 + veinTimeFactor * 0.8;
    for (var v = 0; v < 8; v++) {
        var vx = -30 + v * 9;
        ctx.beginPath();
        ctx.moveTo(vx, -5 + Math.sin(v) * 5);
        for (var s = 0; s < 5; s++) {
            ctx.lineTo(vx + Math.sin(time * 4 + s * 2 + v) * 8, s * 18 + 5);
        }
        ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
    
    // --- Shoulders ---
    ctx.fillStyle = "#3a2a20";
    ctx.beginPath();
    ctx.ellipse(-50, 0, 18, 14, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Right shoulder (swollen)
    ctx.fillStyle = "#3a2015";
    ctx.beginPath();
    ctx.ellipse(55, -5, 25 + Math.sin(time*3)*3, 18, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Bone spur
    ctx.fillStyle = "#d4c8a0";
    ctx.beginPath();
    ctx.moveTo(65, -20); ctx.lineTo(80, -35); ctx.lineTo(70, -15);
    ctx.closePath();
    ctx.fill();

    // VFX: Dripping liquid/corruption from swollen right shoulder & arms
    ctx.save();
    var dripPoints = [
        { x: 55, y: 13, speed: 0.7 },   // right shoulder bottom
        { x: 65, y: 10, speed: 0.9 },   // right shoulder edge
        { x: 42, y: 85, speed: 1.1 },   // right torso bottom edge
        { x: -38, y: 80, speed: 0.8 },  // left torso bottom
        { x: 70, y: 55, speed: 0.6 }    // right arm
    ];
    for (var d = 0; d < dripPoints.length; d++) {
        var dp = dripPoints[d];
        // Each drip cycles: falls, resets
        var dripCycle = ((time * dp.speed + d * 1.3) % 2.0) / 2.0; // 0..1
        var dripLen = 8 + dripCycle * 18;
        var dripAlpha = (1 - dripCycle) * 0.6;
        var dGrad = ctx.createLinearGradient(dp.x, dp.y, dp.x, dp.y + dripLen);
        dGrad.addColorStop(0, "rgba(100, 0, 20, " + dripAlpha.toFixed(2) + ")");
        dGrad.addColorStop(0.6, "rgba(60, 0, 10, " + (dripAlpha * 0.6).toFixed(2) + ")");
        dGrad.addColorStop(1, "rgba(40, 0, 0, 0)");
        ctx.strokeStyle = dGrad;
        ctx.lineWidth = 2 + Math.sin(d * 2) * 0.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(dp.x, dp.y);
        ctx.lineTo(dp.x + Math.sin(time * 2 + d) * 2, dp.y + dripLen);
        ctx.stroke();
        // Drip droplet at the bottom
        if (dripCycle > 0.6) {
            var dropAlpha = (1 - dripCycle) * 1.5;
            ctx.fillStyle = "rgba(120, 0, 30, " + dropAlpha.toFixed(2) + ")";
            ctx.beginPath();
            ctx.arc(dp.x + Math.sin(time * 2 + d) * 2, dp.y + dripLen, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
    
    // --- Arms ---
    ctx.fillStyle = "#2a1a15";
    ctx.fillRect(-65, 5, 18, 55);
    ctx.fillRect(52, 0, 22, 60);
    
    // --- Bone Mask (cracked) ---
    ctx.fillStyle = "#e8dcc0";
    ctx.beginPath();
    ctx.moveTo(-25, -55);
    ctx.quadraticCurveTo(0, -75, 25, -55);
    ctx.quadraticCurveTo(30, -30, 0, -15);
    ctx.quadraticCurveTo(-30, -30, -25, -55);
    ctx.closePath();
    ctx.fill();
    // Cracks
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(5, -70); ctx.lineTo(8, -55); ctx.lineTo(15, -45); ctx.lineTo(20, -35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, -55); ctx.lineTo(-5, -48);
    ctx.stroke();
    // Eye sockets
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.ellipse(-10, -45, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(10, -45, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
    
    // Third eye
    var thirdEyePulse = 0.6 + Math.sin(time * 6) * 0.4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(255, 0, 0, " + thirdEyePulse + ")";
    ctx.fillStyle = "rgba(255, 30, 0, " + thirdEyePulse + ")";
    ctx.beginPath(); ctx.arc(5, -55, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#FFF";
    ctx.beginPath(); ctx.arc(5, -55, 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // VFX: Rotating energy rings emanating from the third eye
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (var ring = 0; ring < 3; ring++) {
        var ringRadius = 10 + ring * 8 + Math.sin(time * 3 + ring * 2) * 3;
        var ringAlpha = (0.15 - ring * 0.04 + Math.sin(time * 5 + ring) * 0.05);
        if (ringAlpha < 0) ringAlpha = 0;
        ctx.strokeStyle = "rgba(255, 30, 0, " + ringAlpha.toFixed(3) + ")";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(5, -55, ringRadius, ringRadius * 0.4, time * (1.5 + ring * 0.5), 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
    
    // --- Core (intensely throbbing) ---
    var corePulse = 0.7 + Math.sin(time * 5) * 0.3;
    ctx.shadowBlur = 25 * corePulse;
    ctx.shadowColor = "#FF0000";
    var coreGrad = ctx.createRadialGradient(0, 30, 0, 0, 30, 20);
    coreGrad.addColorStop(0, "rgba(255, 255, 255, " + corePulse + ")");
    coreGrad.addColorStop(0.4, "rgba(255, 50, 0, 0.9)");
    coreGrad.addColorStop(1, "rgba(200, 0, 0, 0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath(); ctx.arc(0, 30, 20, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    
    ctx.restore();
};

// ---- SACHIEL PHASE 3: BEAST FORM ----
Enemy.prototype.drawSachielBeast = function(ctx) {
    var time = this.timeCounter || 0;
    var cx = this.damagePos.x;
    var cy = this.damagePos.y - 80;
    var breathe = Math.sin(time * 4) * 5;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1.5, 1.5);
    
    // --- Violent aura ---
    ctx.globalCompositeOperation = "lighter";
    for (var a = 0; a < 6; a++) {
        var aAngle = time * 2 + a * Math.PI / 3;
        var aR = 80 + Math.sin(time * 5 + a) * 20;
        var aGrad = ctx.createRadialGradient(Math.cos(aAngle) * 10, Math.sin(aAngle) * 10, 0, 0, 10, aR);
        aGrad.addColorStop(0, "rgba(255, 0, 0, 0.15)");
        aGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = aGrad;
        ctx.beginPath(); ctx.arc(Math.cos(aAngle) * 10, Math.sin(aAngle) * 10, aR, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    
    // --- Hunched Body ---
    ctx.fillStyle = "#1a0f0a";
    ctx.beginPath();
    ctx.moveTo(-50, -20);
    ctx.quadraticCurveTo(-60, 30 + breathe, -40, 100);
    ctx.lineTo(40, 100);
    ctx.quadraticCurveTo(60, 30 + breathe, 50, -20);
    ctx.closePath();
    ctx.fill();
    
    // --- Energy Veins ---
    var veinPulse = 0.5 + Math.sin(time * 8) * 0.5;
    ctx.strokeStyle = "rgba(255, 0, 50, " + (0.2 + veinPulse * 0.5) + ")";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#FF0000";
    ctx.beginPath();
    ctx.moveTo(-30, 0); ctx.quadraticCurveTo(-45, 40, -25, 90);
    ctx.moveTo(30, 0); ctx.quadraticCurveTo(45, 40, 25, 90);
    ctx.moveTo(-10, 20); ctx.lineTo(-20, 70);
    ctx.moveTo(10, 20); ctx.lineTo(20, 70);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // --- Ribcage opening ---
    var ribOpen = 5 + Math.abs(Math.sin(time * 3)) * 15;
    ctx.strokeStyle = "#d4c8a0";
    ctx.lineWidth = 3;
    for (var r = 0; r < 6; r++) {
        var ribY = 20 + r * 12;
        ctx.beginPath(); ctx.moveTo(0, ribY); ctx.quadraticCurveTo(-20 - ribOpen, ribY - 5, -35 - ribOpen * 0.5, ribY + 3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, ribY); ctx.quadraticCurveTo(20 + ribOpen, ribY - 5, 35 + ribOpen * 0.5, ribY + 3); ctx.stroke();
    }
    
    // Core exposed
    var corePulse = 0.8 + Math.sin(time * 8) * 0.2;
    ctx.shadowBlur = 35 * corePulse;
    ctx.shadowColor = "#FF0000";
    var coreGrad = ctx.createRadialGradient(0, 50, 0, 0, 50, 25);
    coreGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
    coreGrad.addColorStop(0.3, "rgba(255, 0, 0, 0.9)");
    coreGrad.addColorStop(1, "rgba(100, 0, 0, 0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath(); ctx.arc(0, 50, 25, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    
    // --- Massive shoulders ---
    ctx.fillStyle = "#2a1510";
    ctx.beginPath(); ctx.ellipse(-55, -15, 25, 20, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(55, -15, 25, 20, 0.5, 0, Math.PI * 2); ctx.fill();
    
    // --- Arms with CLAWS ---
    ctx.fillStyle = "#1a0f0a";
    ctx.fillRect(-75, -5, 22, 65);
    ctx.fillRect(53, -5, 22, 65);
    
    // Left claws
    ctx.fillStyle = "#d4c8a0";
    for (var c = 0; c < 3; c++) {
        ctx.save();
        ctx.translate(-70 + c * 5, 60);
        ctx.rotate(-0.3 + c * 0.15 + Math.sin(time * 6 + c) * 0.1);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-2, 25); ctx.lineTo(2, 25); ctx.closePath(); ctx.fill();
        ctx.restore();
    }
    // Right claws
    for (var c = 0; c < 3; c++) {
        ctx.save();
        ctx.translate(60 + c * 5, 60);
        ctx.rotate(0.3 - c * 0.15 + Math.sin(time * 6 + c) * 0.1);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-2, 25); ctx.lineTo(2, 25); ctx.closePath(); ctx.fill();
        ctx.restore();
    }
    
    // --- Head (predatory) ---
    ctx.fillStyle = "#d4c8a0";
    ctx.beginPath();
    ctx.moveTo(-20, -50);
    ctx.quadraticCurveTo(0, -65, 20, -50);
    ctx.quadraticCurveTo(22, -30, 0, -22);
    ctx.quadraticCurveTo(-22, -30, -20, -50);
    ctx.closePath();
    ctx.fill();
    
    // Feral eyes
    ctx.shadowBlur = 10; ctx.shadowColor = "#F00";
    ctx.fillStyle = "#FF0000";
    ctx.beginPath(); ctx.ellipse(-8, -40, 4, 3, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(8, -40, 4, 3, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    
    // Jagged mouth
    ctx.strokeStyle = "#222"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-12, -28);
    for (var t = 0; t < 6; t++) { ctx.lineTo(-12 + t * 5, -28 + (t % 2 === 0 ? -4 : 4)); }
    ctx.stroke();
    
    ctx.restore();
};

// ---- SACHIEL PHASE 4: ANGELIC VOID FORM ----
Enemy.prototype.drawSachielAngelic = function(ctx) {
    var time = this.timeCounter || 0;
    var cx = this.damagePos.x;
    var cy = this.damagePos.y - 90;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1.25, 1.25);
    
    // --- Dark Halo ---
    ctx.save();
    ctx.translate(0, -70);
    ctx.rotate(time * 0.5);
    ctx.strokeStyle = "rgba(100, 0, 200, 0.8)";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(0, 0, 40, 10, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(200, 100, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 35, 8, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    
    // --- Holy Light Rays ---
    ctx.globalCompositeOperation = "lighter";
    for (var r = 0; r < 12; r++) {
        var rayAngle = time * 0.2 + (r * Math.PI / 6);
        var rayLength = 300 + Math.sin(time * 3 + r) * 50;
        var rayGrad = ctx.createLinearGradient(0, -30, Math.cos(rayAngle) * rayLength, Math.sin(rayAngle) * rayLength - 30);
        rayGrad.addColorStop(0, "rgba(255, 255, 255, 0.3)");
        rayGrad.addColorStop(1, "rgba(200, 100, 255, 0)");
        
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(Math.cos(rayAngle - 0.1) * rayLength, Math.sin(rayAngle - 0.1) * rayLength - 30);
        ctx.lineTo(Math.cos(rayAngle + 0.1) * rayLength, Math.sin(rayAngle + 0.1) * rayLength - 30);
        ctx.fill();
    }
    
    // --- Ethereal Body ---
    ctx.globalCompositeOperation = "lighter";
    
    // Massive radiant aura
    var auraR = 100 + Math.sin(time * 3) * 15;
    var auraGrad = ctx.createRadialGradient(0, 10, 10, 0, 10, auraR);
    auraGrad.addColorStop(0, "rgba(255, 255, 255, 0.4)");
    auraGrad.addColorStop(0.3, "rgba(200, 150, 255, 0.2)");
    auraGrad.addColorStop(0.6, "rgba(100, 0, 200, 0.1)");
    auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath(); ctx.arc(0, 10, auraR, 0, Math.PI * 2); ctx.fill();
    
    var bodyAlpha = 0.6 + Math.sin(time * 4) * 0.2;
    
    // Head
    ctx.fillStyle = "rgba(255, 255, 255, " + bodyAlpha + ")";
    ctx.beginPath(); ctx.arc(0, -50, 18, 0, Math.PI * 2); ctx.fill();
    
    // Torso
    ctx.fillStyle = "rgba(200, 180, 255, " + (bodyAlpha * 0.8) + ")";
    ctx.beginPath();
    ctx.moveTo(-30, -30); ctx.lineTo(30, -30); ctx.lineTo(20, 80); ctx.lineTo(-20, 80);
    ctx.closePath(); ctx.fill();
    
    // Arms (ethereal)
    ctx.strokeStyle = "rgba(255, 255, 255, " + (bodyAlpha * 0.7) + ")";
    ctx.lineWidth = 8; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-30, -20);
    ctx.quadraticCurveTo(-60 + Math.sin(time * 3) * 10, 10, -50 + Math.sin(time * 2) * 15, 50);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(30, -20);
    ctx.quadraticCurveTo(60 + Math.sin(time * 3 + 1) * 10, 10, 50 + Math.sin(time * 2 + 1) * 15, 50);
    ctx.stroke();
    
    // --- Void Core ---
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.arc(0, 15, 15, 0, Math.PI * 2); ctx.fill();
    
    // Core ring
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowBlur = 20; ctx.shadowColor = "#FF00FF";
    ctx.strokeStyle = "rgba(255, 100, 255, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 15, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
    
    // --- Floating particles ---
    for (var i = 0; i < 20; i++) {
        var pAngle = time * (0.5 + i * 0.1) + i * Math.PI * 2 / 20;
        var pR = 40 + Math.sin(time * 2 + i * 0.7) * 30;
        var px = Math.cos(pAngle) * pR;
        var py = Math.sin(pAngle) * pR * 0.6 + 10;
        var pAlpha = 0.3 + Math.sin(time * 4 + i) * 0.2;
        ctx.fillStyle = i % 3 === 0 ? "rgba(255, 255, 255, " + pAlpha + ")" : "rgba(200, 100, 255, " + pAlpha + ")";
        ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
    }
    
    // --- Wings of Light ---
    var wingAlpha = 0.2 + Math.sin(time * 2) * 0.15;
    ctx.strokeStyle = "rgba(255, 255, 255, " + wingAlpha + ")";
    ctx.lineWidth = 1.5;
    for (var w = 0; w < 5; w++) {
        ctx.beginPath(); ctx.moveTo(-20, -20 + w * 5);
        ctx.quadraticCurveTo(-80 - w * 10, -40 + w * 15 + Math.sin(time * 2 + w) * 10, -100 - w * 5, -10 + w * 20);
        ctx.stroke();
    }
    for (var w = 0; w < 5; w++) {
        ctx.beginPath(); ctx.moveTo(20, -20 + w * 5);
        ctx.quadraticCurveTo(80 + w * 10, -40 + w * 15 + Math.sin(time * 2 + w) * 10, 100 + w * 5, -10 + w * 20);
        ctx.stroke();
    }
    
    ctx.globalCompositeOperation = "source-over";
    
    // --- Empty white eyes ---
    ctx.fillStyle = "#FFF";
    ctx.beginPath(); ctx.arc(-7, -52, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, -52, 3, 0, Math.PI * 2); ctx.fill();
    
    ctx.restore();
};

Enemy.prototype.drawGodzilla = function(ctx) {
    var time = this.timeCounter;
    var bossX = 370;
    var bossY = 140; // centered front-facing
    
    // Determine state
    var isCharged = this.renderType === "godzilla_charged";
    var isMeltdown = this.renderType === "godzilla_meltdown";
    
    // Choose glow colors
    var glowColor = "rgba(0, 160, 255, 0.8)";
    var auraColor = "rgba(0, 80, 200, 0.15)";
    var eyeColor = "#00D2FF";
    var spineInnerColor = "#FFFFFF";
    var gillColor = "rgba(0, 190, 255, 0.65)";
    var skinColor = "#1B2424";
    var scaleOutline = "#101616";
    
    if (isMeltdown) {
        // Vibrant Pink for evolved/meltdown canon state
        glowColor = "rgba(255, 0, 160, 0.85)";
        auraColor = "rgba(255, 0, 100, 0.18)";
        eyeColor = "#FF00AA";
        spineInnerColor = "#FFAAFF";
        gillColor = "rgba(255, 0, 140, 0.75)";
    } else if (!isCharged) {
        // Normal state: dimmer blue glow
        glowColor = "rgba(0, 100, 200, 0.55)";
        auraColor = "rgba(0, 50, 150, 0.08)";
        eyeColor = "#00A0FF";
        spineInnerColor = "#E6F5FF";
        gillColor = "rgba(0, 110, 220, 0.4)";
    }
    
    // Shaking / Trembling (Imposing heavy titan feel)
    var shakeX = 0;
    var shakeY = 0;
    if (isCharged) {
        shakeX = (Math.random() - 0.5) * 4;
        shakeY = (Math.random() - 0.5) * 3;
    } else if (isMeltdown) {
        shakeX = (Math.random() - 0.5) * 6;
        shakeY = (Math.random() - 0.5) * 4;
    } else {
        shakeX = Math.sin(time * 6) * 0.8;
        shakeY = Math.cos(time * 5) * 0.5;
    }
    
    bossX += shakeX;
    bossY += shakeY;
    
    ctx.save();
    
    // Breathing scale factor (symmetrical)
    var breath = 1.0 + Math.sin(time * 2.2) * 0.022;
    
    // 1. Heat steam / radiation wave effect (translucent rising waves in background)
    ctx.save();
    ctx.globalAlpha = isMeltdown ? 0.35 : (isCharged ? 0.22 : 0.08);
    ctx.strokeStyle = isMeltdown ? "#FF0080" : "#00A0FF";
    ctx.lineWidth = 3;
    for (var w = 0; w < 8; w++) {
        var wX = bossX - 180 + w * 51;
        var wSway = Math.sin(time * 3 + w) * 12;
        ctx.beginPath();
        ctx.moveTo(wX + wSway, bossY + 160);
        ctx.quadraticCurveTo(wX - wSway, bossY + 50, wX + wSway * 1.5, bossY - 80);
        ctx.stroke();
    }
    ctx.restore();
    
    // 2. Ambient double-layered radiation aura behind the figure
    var auraPulse = 220 + Math.sin(time * 4) * 25;
    var auraGrad = ctx.createRadialGradient(bossX, bossY + 40, 10, bossX, bossY + 40, auraPulse);
    auraGrad.addColorStop(0, auraColor);
    auraGrad.addColorStop(0.4, isMeltdown ? "rgba(220, 0, 120, 0.08)" : "rgba(0, 80, 200, 0.06)");
    auraGrad.addColorStop(0.8, isMeltdown ? "rgba(100, 0, 50, 0.01)" : "rgba(0, 20, 80, 0.01)");
    auraGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(bossX, bossY + 40, auraPulse, 0, Math.PI * 2);
    ctx.fill();
    
    // 3. RADIATION PARTICLES / ASH (floating upwards and swirling)
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var pCount = isMeltdown ? 32 : (isCharged ? 22 : 10);
    for (var i = 0; i < pCount; i++) {
        var pAngle = time * 0.35 + i * 1.8;
        var pDist = 40 + (i * 12 + time * 35) % 160;
        var px = bossX + Math.cos(pAngle) * pDist + Math.sin(time * 2 + i) * 6;
        var py = bossY + 140 - ((i * 18 + time * 65) % 240); // Floats straight up
        var pSize = 1.5 + Math.sin(time * 3 + i) * 0.9;
        if (pSize < 0.5) pSize = 0.5;
        ctx.fillStyle = isMeltdown ? "rgba(255, 50, 200, 0.75)" : "rgba(100, 220, 255, 0.65)";
        ctx.shadowBlur = 8;
        ctx.shadowColor = isMeltdown ? "#FF00B2" : "#00D2FF";
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
    
    // 4. HIGH QUALITY SEGMENTED BACKGROUND SWAYING TAIL
    ctx.save();
    for (var seg = 0; seg < 12; seg++) {
        var tRatio = seg / 11;
        var segSway = Math.sin(time * 2.2 - tRatio * 2.5) * 55;
        // Calculate coordinates along a natural sinuous curve
        var segX = bossX - 35 - tRatio * 110 + segSway;
        var segY = bossY + 115 - tRatio * 70 + Math.cos(time * 2.2 - tRatio * 2) * 12;
        var segRad = 24 * (1 - tRatio * 0.65);
        
        // Draw segment shadow/body
        ctx.fillStyle = "#141B1B";
        ctx.beginPath();
        ctx.arc(segX, segY, segRad, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw scale outlines on segments
        ctx.strokeStyle = "#0E1212";
        ctx.lineWidth = 2.2;
        ctx.stroke();
        
        // Draw glowing spines on top of tail segments (symmetrical alignment)
        if (seg > 1 && seg % 2 === 0) {
            ctx.save();
            ctx.fillStyle = glowColor;
            ctx.shadowBlur = 12;
            ctx.shadowColor = glowColor;
            ctx.translate(segX, segY - segRad + 3);
            ctx.rotate(-0.3 - tRatio * 0.6);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-segRad * 0.3, -segRad * 0.7);
            ctx.lineTo(segRad * 0.2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
    ctx.restore();
    
    // 5. THREE-LAYERED JAGGED DORSAL SPINES (LEFT, CENTER, RIGHT)
    // Towering crystalline spikes that pulse in order
    var leftSpines = [
        { x: bossX - 48, y: bossY + 45, size: 26, angle: -0.38 },
        { x: bossX - 62, y: bossY + 68, size: 40, angle: -0.58 },
        { x: bossX - 74, y: bossY + 95, size: 36, angle: -0.72 },
        { x: bossX - 82, y: bossY + 120, size: 28, angle: -0.84 }
    ];
    var rightSpines = [
        { x: bossX + 48, y: bossY + 45, size: 26, angle: 0.38 },
        { x: bossX + 62, y: bossY + 68, size: 40, angle: 0.58 },
        { x: bossX + 74, y: bossY + 95, size: 36, angle: 0.72 },
        { x: bossX + 82, y: bossY + 120, size: 28, angle: 0.84 }
    ];
    var centerSpines = [
        { x: bossX - 5, y: bossY + 15, size: 16, angle: -0.05 },
        { x: bossX + 5, y: bossY + 15, size: 16, angle: 0.05 },
        { x: bossX, y: bossY - 8, size: 14, angle: 0.0 }
    ];
    
    function drawSpineSet(spinesList, isCenter) {
        for (var sIdx = 0; sIdx < spinesList.length; sIdx++) {
            var sp = spinesList[sIdx];
            ctx.save();
            ctx.translate(sp.x, sp.y);
            ctx.rotate(sp.angle);
            
            ctx.shadowBlur = isCharged || isMeltdown ? 20 : 8;
            ctx.shadowColor = glowColor;
            
            // Highly jagged complex outer spine shape (poly with 8 vertices)
            ctx.fillStyle = isCenter ? "#101616" : "#131C1C";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-sp.size * 0.35, -sp.size * 0.2);
            ctx.lineTo(-sp.size * 0.55, -sp.size * 0.55);
            ctx.lineTo(-sp.size * 0.15, -sp.size * 0.75);
            ctx.lineTo(-sp.size * 0.85, -sp.size * 1.15);
            ctx.lineTo(0, -sp.size * 1.55);
            ctx.lineTo(sp.size * 0.45, -sp.size * 1.1);
            ctx.lineTo(sp.size * 0.25, -sp.size * 0.6);
            ctx.closePath();
            ctx.fill();
            
            // Glowing core of spine (basalt energy cracks)
            var pulseScale = 0.75 + Math.sin(time * 5.5 - sIdx) * 0.25;
            ctx.fillStyle = glowColor;
            ctx.beginPath();
            ctx.moveTo(0, -sp.size * 0.2);
            ctx.lineTo(-sp.size * 0.25, -sp.size * 0.45);
            ctx.lineTo(-sp.size * 0.55 * pulseScale, -sp.size * 0.9 * pulseScale);
            ctx.lineTo(0, -sp.size * 1.15 * pulseScale);
            ctx.lineTo(sp.size * 0.25 * pulseScale, -sp.size * 0.8 * pulseScale);
            ctx.closePath();
            ctx.fill();
            
            // Ultra bright hot core
            if (isCharged || isMeltdown) {
                ctx.fillStyle = spineInnerColor;
                ctx.beginPath();
                ctx.arc(-sp.size * 0.05, -sp.size * 0.7, sp.size * 0.28 * pulseScale, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }
    
    // Draw background/side spine sets
    drawSpineSet(leftSpines, false);
    drawSpineSet(rightSpines, false);
    drawSpineSet(centerSpines, true);
    
    // 6. MASSIVE SHOULDERS, NECK PLATES AND CHEST
    ctx.save();
    ctx.scale(breath, breath);
    
    // Base neck silhouette (Much bulkier/wider shoulders than before)
    ctx.fillStyle = "#161E1E";
    ctx.beginPath();
    ctx.moveTo(bossX - 110, bossY + 130);
    ctx.quadraticCurveTo(bossX - 80, bossY + 60, bossX - 44, bossY + 22); // Left neck
    ctx.lineTo(bossX + 44, bossY + 22); // Right neck
    ctx.quadraticCurveTo(bossX + 80, bossY + 60, bossX + 110, bossY + 130); // Right shoulder
    ctx.closePath();
    ctx.fill();
    
    // --- Scale Plating Texture (Heavy muscular shoulders) ---
    ctx.fillStyle = "#202A2A";
    ctx.strokeStyle = scaleOutline;
    ctx.lineWidth = 1.8;
    
    var shoulderScales = [
        // Left side scales
        { x: bossX - 85, y: bossY + 110, w: 22, h: 12 },
        { x: bossX - 68, y: bossY + 95, w: 20, h: 11 },
        { x: bossX - 52, y: bossY + 75, w: 16, h: 9 },
        // Right side scales
        { x: bossX + 85, y: bossY + 110, w: 22, h: 12 },
        { x: bossX + 68, y: bossY + 95, w: 20, h: 11 },
        { x: bossX + 52, y: bossY + 75, w: 16, h: 9 }
    ];
    
    for (var s = 0; s < shoulderScales.length; s++) {
        var sc = shoulderScales[s];
        ctx.beginPath();
        ctx.ellipse(sc.x, sc.y, sc.w, sc.h, 0.22 * (s < 3 ? -1 : 1), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    
    // Symmetrical chest armor plates (Thick interlocking plates with center line)
    ctx.fillStyle = "#273434";
    for (var rIdx = 0; rIdx < 3; rIdx++) {
        var ry = bossY + 90 + rIdx * 14;
        var rWidth = 46 - rIdx * 6;
        var rHeight = 10;
        
        // Left plate
        ctx.beginPath();
        ctx.moveTo(bossX - rWidth, ry);
        ctx.lineTo(bossX - rWidth * 0.4, ry - 3);
        ctx.lineTo(bossX - 2, ry);
        ctx.lineTo(bossX - 2, ry + rHeight);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Right plate
        ctx.beginPath();
        ctx.moveTo(bossX + rWidth, ry);
        ctx.lineTo(bossX + rWidth * 0.4, ry - 3);
        ctx.lineTo(bossX + 2, ry);
        ctx.lineTo(bossX + 2, ry + rHeight);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    // --- Glowing Nuclear Gills / Neck Cracks ---
    ctx.save();
    ctx.strokeStyle = gillColor;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.shadowBlur = 12;
    ctx.shadowColor = gillColor;
    var gillPulse = 0.5 + Math.sin(time * 5.0) * 0.5;
    ctx.globalAlpha = 0.3 + gillPulse * 0.7;
    
    for (var gLine = 0; gLine < 3; gLine++) {
        var gy = bossY + 45 + gLine * 15;
        var gLength = 22 + gLine * 6;
        // Left gills
        ctx.beginPath();
        ctx.moveTo(bossX - 38 + gLine * 2, gy);
        ctx.quadraticCurveTo(bossX - 26, gy + 6, bossX - 38 + gLength, gy + 3);
        ctx.stroke();
        // Right gills
        ctx.beginPath();
        ctx.moveTo(bossX + 38 - gLine * 2, gy);
        ctx.quadraticCurveTo(bossX + 26, gy + 6, bossX + 38 - gLength, gy + 3);
        ctx.stroke();
    }
    ctx.restore();
    
    // --- Charging Energy Veins (Crawl down neck and chest in charged states) ---
    if (isCharged || isMeltdown) {
        ctx.save();
        ctx.strokeStyle = gillColor;
        ctx.lineWidth = 1.8;
        ctx.shadowBlur = 8;
        ctx.shadowColor = gillColor;
        ctx.globalAlpha = 0.4 + Math.sin(time * 8) * 0.4;
        
        // Draw branching lines on chest
        ctx.beginPath();
        ctx.moveTo(bossX - 10, bossY + 80); ctx.lineTo(bossX - 22, bossY + 110);
        ctx.moveTo(bossX + 10, bossY + 80); ctx.lineTo(bossX + 22, bossY + 110);
        ctx.moveTo(bossX - 30, bossY + 60); ctx.lineTo(bossX - 45, bossY + 90);
        ctx.moveTo(bossX + 30, bossY + 60); ctx.lineTo(bossX + 45, bossY + 90);
        ctx.stroke();
        ctx.restore();
    }
    
    // 7. FRONT-FACING HEAD (Heavy brow, wrinkles, snarling snout)
    ctx.save();
    ctx.translate(bossX, bossY + 15);
    
    // Head shape base (Front-facing jaws)
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.moveTo(-35, 0); // Bottom left jaw
    ctx.quadraticCurveTo(-41, -34, -25, -48); // Left skull side
    ctx.quadraticCurveTo(0, -60, 25, -48); // Crown
    ctx.quadraticCurveTo(41, -34, 35, 0); // Right skull side
    ctx.quadraticCurveTo(0, 12, -35, 0); // Chin
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Snarl skin wrinkles above snout
    ctx.strokeStyle = scaleOutline;
    ctx.lineWidth = 2;
    for (var w = 0; w < 3; w++) {
        var wy = -38 + w * 6;
        ctx.beginPath();
        ctx.moveTo(-12, wy);
        ctx.quadraticCurveTo(0, wy - 4, 12, wy);
        ctx.stroke();
    }
    
    // Forehead scale textures (overlapping layers)
    ctx.fillStyle = "#243232";
    for (var fs = 0; fs < 3; fs++) {
        var fsY = -50 + fs * 7;
        var fsW = 18 - fs * 3;
        ctx.beginPath();
        ctx.moveTo(-fsW, fsY);
        ctx.quadraticCurveTo(0, fsY - 3, fsW, fsY);
        ctx.quadraticCurveTo(0, fsY + 3, -fsW, fsY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    // Snout / Nose ridge (Thick, textured centered structure)
    ctx.fillStyle = "#1E2A2A";
    ctx.beginPath();
    ctx.moveTo(-13, -36);
    ctx.lineTo(13, -36);
    ctx.lineTo(16, -18);
    ctx.lineTo(-16, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Symmetrical nostrils (flared style)
    ctx.fillStyle = "#090C0C";
    ctx.beginPath();
    ctx.arc(-6, -20, 2.5, 0, Math.PI * 2);
    ctx.arc(6, -20, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Snarl mouth cavity (centered snarling mouth glowing with gradient)
    ctx.save();
    ctx.shadowBlur = isCharged || isMeltdown ? 15 : 0;
    ctx.shadowColor = glowColor;
    
    var mouthGrad = ctx.createRadialGradient(0, -5, 2, 0, -5, 25);
    if (isCharged || isMeltdown) {
        mouthGrad.addColorStop(0, "#FFFFFF");
        mouthGrad.addColorStop(0.35, eyeColor);
        mouthGrad.addColorStop(1, glowColor);
    } else {
        mouthGrad.addColorStop(0, "#881111");
        mouthGrad.addColorStop(0.6, "#441111");
        mouthGrad.addColorStop(1, "#180505");
    }
    ctx.fillStyle = mouthGrad;
    
    ctx.beginPath();
    ctx.moveTo(-25, -12); // Left corner
    ctx.quadraticCurveTo(0, -18, 25, -12); // Upper lip
    ctx.quadraticCurveTo(27, 2, 0, 6); // Lower lip center
    ctx.quadraticCurveTo(-27, 2, -25, -12);
    ctx.closePath();
    ctx.fill();
    
    // Draw tongue inside mouth
    ctx.fillStyle = isCharged || isMeltdown ? glowColor : "#661122";
    ctx.beginPath();
    ctx.moveTo(-11, 2);
    ctx.quadraticCurveTo(0, -4, 11, 2);
    ctx.quadraticCurveTo(0, 5, -11, 2);
    ctx.closePath();
    ctx.fill();
    
    // Symmetrical sharp fangs/teeth (Longer, jagged, terrifying double rows)
    ctx.fillStyle = "#F5ECD8";
    var teethCount = 10;
    for (var t = 0; t < teethCount; t++) {
        var tx = -22 + t * 4.6;
        // Upper teeth pointing down (varying lengths)
        var tLen = 6.5 + (t % 3 === 0 ? 3.5 : 0);
        ctx.beginPath();
        ctx.moveTo(tx, -14);
        ctx.lineTo(tx + 1.5, -14 + tLen);
        ctx.lineTo(tx + 3, -14);
        ctx.fill();
        // Lower teeth pointing up
        ctx.beginPath();
        ctx.moveTo(tx, 2);
        ctx.lineTo(tx + 1.5, 2 - tLen * 0.75);
        ctx.lineTo(tx + 3, 2);
        ctx.fill();
    }
    ctx.restore();
    
    // 8. GLOWING ATOMIC EYES (Angled, angry glare under thick brow)
    ctx.save();
    ctx.shadowBlur = isCharged || isMeltdown ? 20 : 7;
    ctx.shadowColor = glowColor;
    ctx.fillStyle = eyeColor;
    
    // Left eye slit (angled angry)
    ctx.beginPath();
    ctx.moveTo(-24, -34);
    ctx.lineTo(-11, -31);
    ctx.lineTo(-22, -30);
    ctx.closePath();
    ctx.fill();
    
    // Right eye slit (mirrored angled angry)
    ctx.beginPath();
    ctx.moveTo(23, -34);
    ctx.lineTo(10, -31);
    ctx.lineTo(21, -30);
    ctx.closePath();
    ctx.fill();
    
    // Symmetrical inner white pupil highlights
    if (isCharged || isMeltdown) {
        ctx.fillStyle = "#FFF";
        ctx.beginPath();
        ctx.arc(-16, -32, 1.2, 0, Math.PI * 2);
        ctx.arc(16, -32, 1.2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
    
    // Brow ridge highlights (glowing above eye slits)
    ctx.strokeStyle = gillColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-25, -37); ctx.lineTo(-12, -34);
    ctx.moveTo(25, -37); ctx.lineTo(12, -34);
    ctx.stroke();
    
    // --- Energy Suction / Absorption Lines (Rushing into his mouth when charging) ---
    if (isCharged || isMeltdown) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 1;
        for (var ep = 0; ep < 8; ep++) {
            var epAngle = time * 3.5 + ep * (Math.PI / 4);
            var epDist = 130 - ((time * 95 + ep * 30) % 120);
            if (epDist < 8) continue;
            var epx = Math.cos(epAngle) * epDist;
            var epy = -6 + Math.sin(epAngle) * epDist;
            ctx.beginPath();
            ctx.moveTo(epx, epy);
            ctx.lineTo(epx * 0.7, epy * 0.7); // lines pointing to jaws
            ctx.stroke();
            
            // Suction spark
            ctx.fillStyle = eyeColor;
            ctx.beginPath();
            ctx.arc(epx, epy, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
    
    // --- Electric Spine Crackles / Lightning Arcs (Spawning randomly around him) ---
    if (isCharged || isMeltdown) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = eyeColor;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = eyeColor;
        
        if (Math.random() < 0.3) {
            ctx.beginPath();
            ctx.moveTo(-60 - Math.random() * 20, 20 + Math.random() * 60);
            ctx.lineTo(-40 - Math.random() * 10, Math.random() * 30);
            ctx.lineTo(-20 - Math.random() * 10, -20 - Math.random() * 20);
            ctx.stroke();
        }
        if (Math.random() < 0.3) {
            ctx.beginPath();
            ctx.moveTo(60 + Math.random() * 20, 20 + Math.random() * 60);
            ctx.lineTo(40 + Math.random() * 10, Math.random() * 30);
            ctx.lineTo(20 + Math.random() * 10, -20 - Math.random() * 20);
            ctx.stroke();
        }
        ctx.restore();
    }
    
    ctx.restore(); // Head
    ctx.restore(); // Body
    ctx.restore(); // Main save
};

Enemy.prototype.drawVader = function(ctx) {
    var time = Date.now() / 1000;
    var isForce = this.renderType === "vader_force";
    var isRage = this.renderType === "vader_rage";
    var breathe = 1.0 + Math.sin(time * 2.5) * 0.015;

    ctx.save();
    ctx.translate(370, 160);
    ctx.scale(breathe, breathe);

    // ----------------------------------------------------
    // 0. AURA SITH FLUIDA (Ominous dark side aura surrounding Vader)
    // ----------------------------------------------------
    if (isForce || isRage) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        var pulse = 1.0 + Math.sin(time * 6) * 0.15;
        var auraGrad = ctx.createRadialGradient(0, 0, 15, 0, 0, 110 * pulse);
        if (isRage) {
            auraGrad.addColorStop(0, "rgba(255, 0, 0, 0.28)");
            auraGrad.addColorStop(0.4, "rgba(139, 0, 0, 0.18)");
            auraGrad.addColorStop(0.8, "rgba(75, 0, 130, 0.08)");
            auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        } else {
            auraGrad.addColorStop(0, "rgba(138, 43, 226, 0.25)");
            auraGrad.addColorStop(0.5, "rgba(75, 0, 130, 0.15)");
            auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        }
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 120 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ----------------------------------------------------
    // 1. EL CAPOTE IMPERIAL (Majestic Cape flowing)
    // ----------------------------------------------------
    var capeGrad = ctx.createLinearGradient(-80, 0, 80, 0);
    capeGrad.addColorStop(0, "#020202");
    capeGrad.addColorStop(0.2, "#0c0c0c");
    capeGrad.addColorStop(0.5, "#151515");
    capeGrad.addColorStop(0.8, "#0c0c0c");
    capeGrad.addColorStop(1, "#020202");
    
    ctx.fillStyle = capeGrad;
    ctx.beginPath();
    ctx.moveTo(-65, 80);
    ctx.quadraticCurveTo(-90, 25, -45, -3);
    ctx.lineTo(45, -3);
    ctx.quadraticCurveTo(90, 25, 65, 80);
    ctx.lineTo(35, 80);
    ctx.bezierCurveTo(20, 55, -20, 55, -35, 80);
    ctx.closePath();
    ctx.fill();

    // Cape folds/creases (Volumetric lines)
    ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-35, 5); ctx.quadraticCurveTo(-45, 30, -50, 75);
    ctx.moveTo(35, 5); ctx.quadraticCurveTo(45, 30, 50, 75);
    ctx.moveTo(-15, 2); ctx.quadraticCurveTo(-20, 35, -22, 75);
    ctx.moveTo(15, 2); ctx.quadraticCurveTo(20, 35, 22, 75);
    ctx.stroke();

    // ----------------------------------------------------
    // 2. CORAZA DE HOMBROS Y TORSO HUMANO (Human proportions)
    // ----------------------------------------------------
    // Shoulders armor (Chest bell & Collar guards)
    var armorGrad = ctx.createLinearGradient(-50, -10, 50, -10);
    armorGrad.addColorStop(0, "#111111");
    armorGrad.addColorStop(0.3, "#333333");
    armorGrad.addColorStop(0.5, "#444444");
    armorGrad.addColorStop(0.7, "#333333");
    armorGrad.addColorStop(1, "#111111");
    
    ctx.fillStyle = armorGrad;
    ctx.beginPath();
    ctx.moveTo(-52, 10);
    ctx.bezierCurveTo(-35, -8, -15, -10, 0, -8);
    ctx.bezierCurveTo(15, -10, 35, -8, 52, 10);
    ctx.quadraticCurveTo(55, 30, 48, 50);
    ctx.lineTo(-48, 50);
    ctx.quadraticCurveTo(-55, 30, -52, 10);
    ctx.closePath();
    ctx.fill();

    // Silver and charcoal alternating stripes on collar
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-45, 7); ctx.lineTo(-40, 50);
    ctx.moveTo(-32, 2); ctx.lineTo(-28, 50);
    ctx.moveTo(-18, -4); ctx.lineTo(-15, 50);
    ctx.moveTo(18, -4); ctx.lineTo(15, 50);
    ctx.moveTo(32, 2); ctx.lineTo(28, 50);
    ctx.moveTo(45, 7); ctx.lineTo(40, 50);
    ctx.stroke();

    // Cape Chain Clasp (Silver metal chain across chest)
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-28, 12);
    ctx.quadraticCurveTo(0, 18, 28, 12);
    ctx.stroke();

    // Chain links dots
    ctx.fillStyle = "#CCCCCC";
    for (var cIdx = 0; cIdx <= 6; cIdx++) {
        var cx = -28 + cIdx * 9.3;
        var cy = 12 + Math.sin(cIdx * 0.5) * 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, 1.8, 0, Math.PI * 2); ctx.fill();
    }

    // Main torso and black body suit (highly proportional waist)
    ctx.fillStyle = "#141414";
    ctx.beginPath();
    ctx.moveTo(-30, 50);
    ctx.lineTo(30, 50);
    ctx.lineTo(24, 90);
    ctx.lineTo(-24, 90);
    ctx.closePath();
    ctx.fill();

    // Ribbed leather texture lines on body suit
    ctx.strokeStyle = "#080808";
    ctx.lineWidth = 2;
    for (var ry = 53; ry <= 85; ry += 5) {
        ctx.beginPath(); ctx.moveTo(-26 + (ry-50)*0.1, ry); ctx.lineTo(26 - (ry-50)*0.1, ry); ctx.stroke();
    }

    // Inner tunic lining (hanging down)
    ctx.fillStyle = "#0c0c0c";
    ctx.fillRect(-12, 50, 24, 40);

    // ----------------------------------------------------
    // 3. PANEL DE CONTROL DE SOPORTE VITAL (Life support box)
    // ----------------------------------------------------
    ctx.fillStyle = "#1e1e1e";
    ctx.strokeStyle = "#3a3a3a";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.rect(-12, 56, 24, 28);
    ctx.fill(); ctx.stroke();

    // Red and Blue buttons (Blinking animation)
    var isBlink = Math.floor(time * 2.2) % 2;
    ctx.fillStyle = isBlink ? "#FF1e1e" : "#660000";
    ctx.fillRect(-8, 60, 5, 5); // top-left red led
    ctx.fillStyle = !isBlink ? "#1e5eff" : "#000066";
    ctx.fillRect(3, 60, 5, 5); // top-right blue led
    
    // Green button
    ctx.fillStyle = "#00FF00";
    ctx.fillRect(-8, 68, 5, 3);

    // Silver switches vertical lines
    ctx.fillStyle = "#D2D2D2";
    ctx.fillRect(-8, 74, 3, 7);
    ctx.fillRect(-2, 74, 3, 7);
    ctx.fillRect(4, 74, 3, 7);

    // ----------------------------------------------------
    // 4. CASCO DE OBSIDIANA (Highly realistic Darth Vader helmet)
    // ----------------------------------------------------
    
    // Helmet Shroud Flare (Proportional Sith wings - max width ±32px instead of 42px)
    var flareGrad = ctx.createLinearGradient(-26, -18, 26, -18);
    flareGrad.addColorStop(0, "#080808");
    flareGrad.addColorStop(0.3, "#1a1a1a");
    flareGrad.addColorStop(0.5, "#282828");
    flareGrad.addColorStop(0.7, "#1a1a1a");
    flareGrad.addColorStop(1, "#080808");
    ctx.fillStyle = flareGrad;
    
    ctx.beginPath();
    ctx.moveTo(-22, -30);
    ctx.bezierCurveTo(-28, -12, -30, 2, -32, 8);
    ctx.lineTo(-14, 4);
    ctx.lineTo(0, -10);
    ctx.lineTo(14, 4);
    ctx.lineTo(32, 8);
    ctx.bezierCurveTo(30, 2, 28, -12, 22, -30);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Helmet Dome (Polished black skull top)
    var domeGrad = ctx.createRadialGradient(-5, -38, 2, 0, -32, 25);
    domeGrad.addColorStop(0, "#484848");
    domeGrad.addColorStop(0.4, "#222222");
    domeGrad.addColorStop(1, "#090909");
    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.arc(0, -32, 25, Math.PI, 0, false);
    ctx.fill();

    // Sharp specular reflection running down the center of the helmet (3D metallic effect)
    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    ctx.beginPath();
    ctx.ellipse(0, -42, 3, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -32, 23.5, -Math.PI * 0.8, -Math.PI * 0.4);
    ctx.stroke();

    // Helmet brow ridge (The majestic aggressive forehead line)
    ctx.fillStyle = "#121212";
    ctx.beginPath();
    ctx.moveTo(-25, -31);
    ctx.bezierCurveTo(-15, -28, 0, -29, 0, -29);
    ctx.bezierCurveTo(0, -29, 15, -28, 25, -31);
    ctx.lineTo(25, -28);
    ctx.bezierCurveTo(15, -25, 0, -26, 0, -26);
    ctx.bezierCurveTo(0, -26, -15, -25, -25, -28);
    ctx.closePath();
    ctx.fill();

    // ----------------------------------------------------
    // 4.5 EL CUELLO MECÁNICO E IMPONENTE (A solid, cybernetic neck)
    // Conectando el casco con los hombros por detrás de la barbilla
    // ----------------------------------------------------
    var neckGrad = ctx.createLinearGradient(-12, -15, 12, -15);
    neckGrad.addColorStop(0, "#0e0e0e");
    neckGrad.addColorStop(0.3, "#252525");
    neckGrad.addColorStop(0.5, "#383838");
    neckGrad.addColorStop(0.7, "#252525");
    neckGrad.addColorStop(1, "#0e0e0e");
    ctx.fillStyle = neckGrad;
    
    ctx.beginPath();
    ctx.moveTo(-11, -17);
    ctx.quadraticCurveTo(-11, -5, -12.5, 6);
    ctx.lineTo(12.5, 6);
    ctx.quadraticCurveTo(11, -5, 11, -17);
    ctx.closePath();
    ctx.fill();

    // Costillas mecánicas verticales de cuero acanalado/metalizado
    ctx.strokeStyle = "#050505";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-7, -15); ctx.lineTo(-8.5, 5);
    ctx.moveTo(-2, -16); ctx.lineTo(-2, 6);
    ctx.moveTo(2, -16); ctx.lineTo(2, 6);
    ctx.moveTo(7, -15); ctx.lineTo(8.5, 5);
    ctx.stroke();

    // Collarín plateado metálico inferior
    ctx.strokeStyle = "#444444";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-12.5, 4);
    ctx.quadraticCurveTo(0, 6.5, 12.5, 4);
    ctx.stroke();

    // ----------------------------------------------------
    // 5. MASCARA FACIAL (Aggressive Sith Skull Mask)
    // ----------------------------------------------------
    var faceGrad = ctx.createLinearGradient(-15, -25, 15, -25);
    faceGrad.addColorStop(0, "#080808");
    faceGrad.addColorStop(0.5, "#1c1c1c");
    faceGrad.addColorStop(1, "#080808");
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.moveTo(-15, -27);
    ctx.lineTo(15, -27);
    ctx.lineTo(12, -7);
    ctx.lineTo(-12, -7);
    ctx.closePath();
    ctx.fill();

    // Cheeks specular metallic highlight (Giving 3D cheekbones)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-12, -18); ctx.lineTo(-6, -12);
    ctx.moveTo(12, -18); ctx.lineTo(6, -12);
    ctx.stroke();

    // Eyes Lenses (Slightly angled humanistic skull-like eye sockets)
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(-7.5, -21, 5.5, 4.2, 0.12, 0, Math.PI * 2);
    ctx.ellipse(7.5, -21, 5.5, 4.2, -0.12, 0, Math.PI * 2);
    ctx.fill();

    // Glossy glass reflection on lenses
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.beginPath();
    ctx.ellipse(-6, -22, 1.8, 0.8, -0.2, 0, Math.PI * 2);
    ctx.ellipse(9, -22, 1.8, 0.8, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Threatening glowing Sith crimson pupils
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#FF1e1e";
    ctx.fillStyle = "#FF1e1e";
    ctx.beginPath();
    ctx.arc(-8, -20.5, 1.5, 0, Math.PI * 2);
    ctx.arc(8, -20.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Nose bridge and breathing triangular snout
    ctx.strokeStyle = "#444444";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -21); ctx.lineTo(0, -13);
    ctx.stroke();

    // Breathing Grille structure (centered triangular metallic guard)
    ctx.fillStyle = "#0c0c0c";
    ctx.strokeStyle = "#383838";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-5.5, -13);
    ctx.lineTo(5.5, -13);
    ctx.lineTo(0, -4);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Metallic silver grill mesh bars
    ctx.strokeStyle = "#BFBFBF";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-4, -12); ctx.lineTo(-1.2, -6);
    ctx.moveTo(4, -12); ctx.lineTo(1.2, -6);
    ctx.moveTo(-2, -12.5); ctx.lineTo(-0.6, -5.5);
    ctx.moveTo(2, -12.5); ctx.lineTo(0.6, -5.5);
    ctx.moveTo(0, -13); ctx.lineTo(0, -4.5);
    ctx.stroke();

    // Chrome corner tusks
    ctx.fillStyle = "#EAEAEA";
    ctx.fillRect(-7.5, -7.5, 2.2, 2.5);
    ctx.fillRect(5.3, -7.5, 2.2, 2.5);

    // ----------------------------------------------------
    // 6. PHASE SPECIFIC VISUAL OVERLAYS
    // ----------------------------------------------------

    // FASE 2: Force Hand Raised (Left side of screen/Vader's right hand)
    if (isForce) {
        ctx.save();
        ctx.translate(-42, 22);
        ctx.rotate(Math.sin(time * 3.8) * 0.06 - 0.22);

        // Hombrera lateral en 3D para robustez
        var shoulderGrad = ctx.createLinearGradient(-15, -15, 10, 10);
        shoulderGrad.addColorStop(0, "#333333");
        shoulderGrad.addColorStop(0.5, "#151515");
        shoulderGrad.addColorStop(1, "#020202");
        ctx.fillStyle = shoulderGrad;
        ctx.beginPath();
        ctx.arc(-8, 12, 12, 0, Math.PI * 2);
        ctx.fill();

        // Arm sleeve with realistic folds
        var armGrad = ctx.createLinearGradient(-8, 30, -20, -5);
        armGrad.addColorStop(0, "#080808");
        armGrad.addColorStop(0.4, "#181818");
        armGrad.addColorStop(0.7, "#282828");
        armGrad.addColorStop(1, "#020202");
        ctx.fillStyle = armGrad;
        
        ctx.beginPath();
        ctx.moveTo(-6, 45);
        ctx.lineTo(-26, 0);
        ctx.lineTo(-14, -8);
        ctx.lineTo(6, 45);
        ctx.closePath();
        ctx.fill();

        // Arm specular fold highlights
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(-16, 25); ctx.lineTo(-22, 5); ctx.stroke();

        // Detailed leather glove fist
        var gloveGrad = ctx.createRadialGradient(-20, -5, 2, -20, -5, 8);
        gloveGrad.addColorStop(0, "#2c2c2c");
        gloveGrad.addColorStop(0.7, "#141414");
        gloveGrad.addColorStop(1, "#020202");
        ctx.fillStyle = gloveGrad;
        ctx.beginPath();
        ctx.arc(-20, -5, 8.0, 0, Math.PI * 2);
        ctx.fill();
        
        // Individual clenched leather fingers with specular gloss
        ctx.fillStyle = "#2a2a2a";
        ctx.fillRect(-27, -11, 6, 4);
        ctx.fillRect(-26, -7, 6, 4);
        ctx.fillRect(-25, -3, 6, 4);

        // --- EFECTO DE ENERGÍA SITH / FUERZA DE PLASMA PREMIUM ---
        ctx.save();
        ctx.globalCompositeOperation = "screen";

        // 1. Núcleo de plasma fluctuante en la mano
        var forcePulse = 1.0 + Math.sin(time * 12) * 0.12;
        var plasmaGrad = ctx.createRadialGradient(-20, -5, 1, -20, -5, 22 * forcePulse);
        plasmaGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        plasmaGrad.addColorStop(0.3, "rgba(186, 85, 211, 0.8)");
        plasmaGrad.addColorStop(0.7, "rgba(138, 43, 226, 0.35)");
        plasmaGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = plasmaGrad;
        ctx.beginPath();
        ctx.arc(-20, -5, 24 * forcePulse, 0, Math.PI * 2);
        ctx.fill();

        // 2. Rayos Sith en zigzag dinámicos
        ctx.lineWidth = 1.8;
        ctx.shadowBlur = 14;
        for (var fs = 0; fs < 6; fs++) {
            var angle = (fs / 6) * Math.PI * 2 + Math.sin(time * 5) * 0.5;
            var dist = 22 + Math.random() * 18;
            var targetX = -20 + Math.cos(angle) * dist;
            var targetY = -5 + Math.sin(angle) * dist;

            // Generate zigzag points
            var curX = -20;
            var curY = -5;
            var steps = 3;
            ctx.beginPath();
            ctx.moveTo(curX, curY);
            ctx.strokeStyle = fs % 2 === 0 ? "#BA55D3" : "#00FFFF"; // Alternating violet/cyan electric lightning
            ctx.shadowColor = ctx.strokeStyle;
            
            for (var st = 1; st <= steps; st++) {
                var ratio = st / steps;
                var nextX = -20 + Math.cos(angle) * dist * ratio + (Math.random() - 0.5) * 8;
                var nextY = -5 + Math.sin(angle) * dist * ratio + (Math.random() - 0.5) * 8;
                ctx.lineTo(nextX, nextY);
                curX = nextX;
                curY = nextY;
            }
            ctx.stroke();
        }

        // 3. Partículas de plasma flotantes ascendentes
        for (var pt = 0; pt < 4; pt++) {
            var pSeed = time * 3 + pt;
            var px = -20 + Math.sin(pSeed * 7) * 16;
            var py = -5 - ((pSeed * 25) % 45);
            var pAlpha = 1.0 - (Math.abs(py - (-5)) / 45);
            var pSize = 1.5 + (pSeed % 3.0);

            ctx.fillStyle = "rgba(218, 112, 214, " + pAlpha + ")";
            ctx.shadowColor = "#FF00FF";
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(px, py, pSize, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
        ctx.restore();
    }

    // FASE 3: Battle Damaged Armor + Cracked Mask with glowing wires & Cybernetic eye
    if (isRage) {
        // Vapor escaping from punctured chest suit vents (Fluido real)
        ctx.fillStyle = "rgba(220, 220, 220, " + (0.18 + Math.sin(time * 12) * 0.08) + ")";
        for (var vp = 0; vp < 3; vp++) {
            var vpx = -35 + vp * 35 + Math.sin(time * 5 + vp) * 6;
            var vpy = 18 - (time * 85 + vp * 35) % 55;
            ctx.beginPath();
            ctx.arc(vpx, vpy, 5 + (18 - vpy) * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }

        // Gran sección de la máscara rota revelando el cráneo metálico y cables
        var scarColor = "rgba(150, 40, 30, 0.9)"; // Tejido quemado
        ctx.fillStyle = scarColor;
        ctx.beginPath();
        ctx.moveTo(5, -24);
        ctx.lineTo(17, -24);
        ctx.lineTo(15, -10);
        ctx.lineTo(3, -10);
        ctx.closePath();
        ctx.fill();

        // Cráneo cibernético metálico
        ctx.fillStyle = "#444444";
        ctx.fillRect(7, -22, 7, 10);
        ctx.fillStyle = "#777777";
        ctx.fillRect(8.5, -20, 4, 7);

        // Cables expuestos quemados (colores de cobre, rojo, azul)
        ctx.strokeStyle = "#B87333"; // Cobre
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(7, -14); ctx.quadraticCurveTo(9, -8, 8, -6);
        ctx.stroke();

        ctx.strokeStyle = "#0000FF"; // Azul eléctrico
        ctx.beginPath();
        ctx.moveTo(14, -13); ctx.quadraticCurveTo(12, -7, 13, -5);
        ctx.stroke();

        // Ojo cibernético extremadamente brillante (rojo Sith)
        ctx.save();
        ctx.shadowBlur = 16;
        ctx.shadowColor = "#FF0000";
        ctx.fillStyle = "#FF3333";
        ctx.beginPath();
        ctx.arc(10.5, -17, 2.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#FFFFFF"; // Destello central puro
        ctx.beginPath();
        ctx.arc(10.5, -17, 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Chispas eléctricas (Cian/Celeste de cortocircuito) parpadeando
        ctx.save();
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#00FFFF";
        if (Math.random() < 0.5) {
            ctx.beginPath();
            ctx.moveTo(10, -17);
            ctx.lineTo(15 + (Math.random() - 0.5) * 12, -14 + (Math.random() - 0.5) * 12);
            ctx.stroke();
        }
        ctx.restore();
    }

    // ----------------------------------------------------
    // 7. SABLE DE LUZ ROJO IMPERIAL (With plasma sparks and intense core glow)
    // ----------------------------------------------------
    if (!isForce) {
        ctx.save();
        // Posicionamiento de la empuñadura (Mano de Vader a la derecha de la pantalla)
        ctx.translate(36, 48);
        ctx.rotate(0.32 + Math.sin(time * 2.5) * 0.03);

        // Guante de cuero negro con pliegues
        ctx.fillStyle = "#1e1e1e";
        ctx.beginPath();
        ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#080808";
        ctx.beginPath();
        ctx.ellipse(0, 0, 8.5, 4.5, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Empuñadura metálica de sable de luz
        ctx.fillStyle = "#888888";
        ctx.fillRect(-3.5, -14, 7, 14);
        
        // Relieves negros de agarre
        ctx.fillStyle = "#111111";
        ctx.fillRect(-3.5, -11, 7, 2);
        ctx.fillRect(-3.5, -7, 7, 2);
        
        // Botón de activación rojo
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(2.0, -9, 2, 2);

        // --- EFECTO SABLE PREMIUM ---
        // 1. Aura gigante de resplandor externo
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.shadowBlur = 38;
        ctx.shadowColor = "#FF0000";
        ctx.strokeStyle = "rgba(255, 0, 0, 0.35)";
        ctx.lineWidth = 11;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(0, -104);
        ctx.stroke();
        ctx.restore();

        // 2. Núcleo sólido blanco y borde rojo
        ctx.shadowBlur = 18;
        ctx.shadowColor = "#FF0000";
        ctx.strokeStyle = "#FFFFFF"; // Núcleo blanco
        ctx.lineWidth = 3.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(0, -102);
        ctx.stroke();

        // 3. Pequeñas chispas de plasma de luz Sith (Flickering effect)
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#FF3333";
        ctx.lineWidth = 1.0;
        for (var spk = 0; spk < 2; spk++) {
            if (Math.random() < 0.5) {
                var spkY = -14 - Math.random() * 85;
                var spkX = (Math.random() - 0.5) * 8;
                ctx.beginPath();
                ctx.moveTo(0, spkY);
                ctx.lineTo(spkX, spkY + (Math.random() - 0.5) * 6);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    // ====================================================
    // PHASE-SPECIFIC VISUAL OVERLAYS
    // ====================================================
    
    // Force Phase: Purple Force energy orbs orbiting
    if (isForce) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        for (var fo = 0; fo < 4; fo++) {
            var foAngle = (fo * Math.PI / 2) + time * 1.8;
            var foDist = 55 + Math.sin(time * 3 + fo) * 8;
            var foX = Math.cos(foAngle) * foDist;
            var foY = Math.sin(foAngle) * foDist * 0.6;
            var foGrad = ctx.createRadialGradient(foX, foY, 0, foX, foY, 8);
            foGrad.addColorStop(0, "rgba(138, 43, 226, 0.6)");
            foGrad.addColorStop(0.5, "rgba(75, 0, 130, 0.3)");
            foGrad.addColorStop(1, "rgba(75, 0, 130, 0)");
            ctx.fillStyle = foGrad;
            ctx.beginPath();
            ctx.arc(foX, foY, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        // Electric arcs between orbs
        ctx.strokeStyle = "rgba(180, 100, 255, 0.4)";
        ctx.lineWidth = 0.8;
        for (var ea = 0; ea < 3; ea++) {
            var a1 = (ea * Math.PI / 2) + time * 1.8;
            var a2 = ((ea + 1) * Math.PI / 2) + time * 1.8;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a1) * 55, Math.sin(a1) * 33);
            ctx.quadraticCurveTo(
                (Math.cos(a1) + Math.cos(a2)) * 25 + Math.sin(time * 6) * 8,
                (Math.sin(a1) + Math.sin(a2)) * 15,
                Math.cos(a2) * 55, Math.sin(a2) * 33
            );
            ctx.stroke();
        }
        ctx.restore();
    }
    
    // Rage Phase: Force lightning + dark energy vortex + intense red eyes
    if (isRage) {
        // Force Lightning (red-purple bolts crackling outward)
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.strokeStyle = "rgba(255, 50, 50, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF0000";
        for (var fl = 0; fl < 5; fl++) {
            var flAngle = (fl * Math.PI * 2 / 5) + time * 2.5;
            ctx.beginPath();
            var flX = 0, flY = 0;
            ctx.moveTo(flX, flY);
            for (var seg = 0; seg < 4; seg++) {
                flX += Math.cos(flAngle) * 18 + (Math.random() - 0.5) * 12;
                flY += Math.sin(flAngle) * 18 + (Math.random() - 0.5) * 12;
                ctx.lineTo(flX, flY);
            }
            ctx.stroke();
        }
        ctx.restore();
        
        // Dark energy particle vortex
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        for (var dp = 0; dp < 8; dp++) {
            var dpAngle = (dp * Math.PI / 4) + time * 3;
            var dpDist = 70 + Math.sin(time * 5 + dp * 1.2) * 15;
            var dpX = Math.cos(dpAngle) * dpDist;
            var dpY = Math.sin(dpAngle) * dpDist * 0.5;
            var dpAlpha = 0.3 + Math.sin(time * 8 + dp) * 0.2;
            ctx.fillStyle = "rgba(180, 0, 0, " + dpAlpha + ")";
            ctx.beginPath();
            ctx.arc(dpX, dpY, 2 + Math.sin(time * 4 + dp) * 1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    ctx.restore();
};

Enemy.prototype.drawGlitch = function(ctx) {
    var time = Date.now() / 1000;
    var type = this.renderType; // "glitch_minor", "glitch_core", "glitch_fatal"
    
    // Nervous glitchy breathing and float
    var breatheSpeed = type === "glitch_fatal" ? 5.5 : (type === "glitch_core" ? 4.2 : 2.8);
    var breathe = 1.0 + Math.sin(time * breatheSpeed) * 0.025;
    
    // Core jitter is highly pronounced in Phase 2 & 3, causing dramatic screen offsets
    var jitterX = 0;
    var jitterY = 0;
    if (Math.random() < 0.25) {
        var jitterAmt = type === "glitch_fatal" ? 12 : (type === "glitch_core" ? 7 : 3);
        jitterX = (Math.random() - 0.5) * jitterAmt;
        jitterY = (Math.random() - 0.5) * jitterAmt;
    }
    
    var floatAmp = type === "glitch_fatal" ? 14.0 : (type === "glitch_minor" ? 5.0 : 9.0);
    var floatY = Math.sin(time * 3.0) * floatAmp + jitterY;

    ctx.save();
    ctx.translate(370 + jitterX, 145 + floatY); // Centered and adjusted height
    ctx.scale(breathe, breathe);

    // ====================================================================
    // CHROMATIC ABERRATION SHADOW LAYERS (Dynamic screen-split composite rendering)
    // ====================================================================
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    var splitVal = type === "glitch_fatal" ? 12 + Math.sin(time * 24) * 6 : (type === "glitch_core" ? 7 + Math.sin(time * 16) * 4 : 3);
    
    // Magenta Left-Shift Copy
    ctx.save();
    ctx.translate(-splitVal, 0);
    ctx.fillStyle = "rgba(255, 0, 128, 0.35)";
    ctx.fillRect(-65, -10, 130, 90);
    ctx.restore();
    
    // Cyan Right-Shift Copy
    ctx.save();
    ctx.translate(splitVal, 0);
    ctx.fillStyle = "rgba(0, 240, 255, 0.35)";
    ctx.fillRect(-65, -10, 130, 90);
    ctx.restore();
    
    ctx.restore();

    // ====================================================================
    // DYNAMIC FLOATING CORRUPTED DATA MATRIX PACKETS (Floating Voxel Particles)
    // ====================================================================
    ctx.save();
    for (var p = 0; p < 12; p++) {
        var pSeed = p * 1234.56;
        var pAngle = time * 1.5 + (p * Math.PI / 6);
        var pxDist = 65 + (Math.sin(time + pSeed) * 20);
        var pyDist = 35 + (Math.cos(time * 1.2 + pSeed) * 45);
        var px = Math.cos(pAngle) * pxDist;
        var py = Math.sin(pAngle) * pyDist;
        
        if (Math.random() < 0.15) continue; // Shimmering
        ctx.fillStyle = (Math.floor(p + time * 5) % 2 === 0) ? "#FF00FF" : "#00FFFF";
        var pSize = 4 + (p % 3) * 3;
        ctx.fillRect(px - pSize/2, py - pSize/2, pSize, pSize);
        
        // Draw cyber-link traces joining particles
        if (p % 3 === 0 && type !== "glitch_minor") {
            ctx.strokeStyle = "rgba(0, 255, 100, 0.15)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(0, 30);
            ctx.stroke();
        }
    }
    ctx.restore();

    if (type === "glitch_minor") {
        // ====================================================================
        // PHASE 1: MINOR CORRUPTION (Checkerboard Humanoid & CPU Crown)
        // ====================================================================
        ctx.save();
        
        // Background spatial lines
        ctx.strokeStyle = "rgba(255, 0, 255, 0.15)";
        ctx.lineWidth = 1.5;
        for (var l = -70; l <= 70; l += 20) {
            ctx.beginPath(); 
            ctx.moveTo(l, -90); 
            ctx.lineTo(l + Math.sin(time * 6) * 15, 90); 
            ctx.stroke();
        }
        
        // Humanoid checkered body blocks
        var pxSize = 8;
        for (var y = -24; y < 85; y += pxSize) {
            var xSpan = 45;
            if (y < 0) xSpan = 18; // Neck/Head
            else if (y < 28) xSpan = 58; // Pectorals/Shoulders
            else if (y < 65) xSpan = 40; // Abs/Waist
            else xSpan = 48; // Pelvis
            
            for (var x = -xSpan; x < xSpan; x += pxSize) {
                // Flicker transparency
                if (Math.random() < 0.10) continue;
                ctx.fillStyle = ((Math.floor(x/pxSize) + Math.floor(y/pxSize) + Math.floor(time * 2)) % 2 === 0) ? "#FF00FF" : "#000000";
                ctx.fillRect(x, y, pxSize, pxSize);
                
                // Neon glow outline overlay on random blocks
                if (Math.random() < 0.04) {
                    ctx.strokeStyle = "#00FFFF";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, pxSize, pxSize);
                }
            }
        }
        
        // Green matrix code rain
        ctx.fillStyle = "#00FF66";
        ctx.font = "bold 9px Courier";
        for (var c = 0; c < 8; c++) {
            var cx = -50 + c * 14;
            var cy = (time * 95 + c * 25) % 115 - 30;
            ctx.fillText(Math.random() < 0.5 ? "0" : "1", cx, cy);
        }
        
        // REDESIGNED GLITCH FACE/HEAD (Pixel CPU/Skull)
        ctx.save();
        ctx.translate(0, -38);
        
        // Floating pixel cluster head
        for (var hy = -15; hy <= 15; hy += 5) {
            for (var hx = -15; hx <= 15; hx += 5) {
                if (Math.abs(hx) + Math.abs(hy) > 22) continue; // Round corners
                if (Math.random() < 0.08) continue; // Shimmer
                ctx.fillStyle = ((Math.floor(hx/5) + Math.floor(hy/5) + Math.floor(time * 4)) % 2 === 0) ? "#FF00FF" : "#00FFFF";
                ctx.fillRect(hx, hy, 5, 5);
            }
        }
        
        // Shimmering Eye sockets
        ctx.fillStyle = "#000000";
        ctx.fillRect(-10, -5, 6, 6);
        ctx.fillRect(4, -5, 6, 6);
        // Neon green/red flashing pupils
        ctx.fillStyle = Math.random() < 0.25 ? "#FF0055" : "#00FF66";
        ctx.fillRect(-8, -3, 3, 3);
        ctx.fillRect(6, -3, 3, 3);
        
        // Rotating bracket framing vectors
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 2.0;
        var scaleBrac = 1.12 + Math.sin(time * 7) * 0.09;
        ctx.scale(scaleBrac, scaleBrac);
        // Left bracket
        ctx.beginPath();
        ctx.moveTo(-22, -18); ctx.lineTo(-26, -18); ctx.lineTo(-26, 18); ctx.lineTo(-22, 18);
        ctx.stroke();
        // Right bracket
        ctx.beginPath();
        ctx.moveTo(22, -18); ctx.lineTo(26, -18); ctx.lineTo(26, 18); ctx.lineTo(22, 18);
        ctx.stroke();
        
        ctx.restore();
        
        // Glowing Binary CPU Crown
        ctx.save();
        ctx.translate(0, -62);
        ctx.fillStyle = "#00FF66";
        ctx.font = "bold 8px Courier";
        for (var bi = 0; bi < 10; bi++) {
            var bAngle = time * 2.5 + (bi * Math.PI / 5);
            var bx = Math.cos(bAngle) * 26;
            var by = Math.sin(bAngle) * 7;
            ctx.fillText(bi % 2 === 0 ? "0" : "1", bx - 2, by + 2);
        }
        ctx.restore();
        
        ctx.restore();
        
    } else if (type === "glitch_core") {
        // ====================================================================
        // PHASE 2: THE SYSTEM THREAT (Hyper-defined Voxel Warrior)
        // ====================================================================
        ctx.save();
        
        // Massive voxel shoulders backing shadow
        ctx.fillStyle = "#070707";
        ctx.fillRect(-90, 8, 180, 80);
        ctx.strokeStyle = "rgba(255, 0, 255, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-90, 8, 180, 80);
        
        // Overlapping Pectoral Voxel Plates (cyber armor plates)
        ctx.fillStyle = "#1b1b1b";
        ctx.fillRect(-50, 14, 45, 26); // Left chest
        ctx.fillRect(5, 14, 45, 26);  // Right chest
        
        // Neon cyan/magenta highlights on chest voxel edges
        ctx.strokeStyle = Math.random() < 0.2 ? "#FF00FF" : "#00FFFF";
        ctx.lineWidth = 2.0;
        ctx.strokeRect(-50, 14, 45, 26);
        ctx.strokeRect(5, 14, 45, 26);
        
        // Pulsating Concentric Core Reactor Rings
        ctx.strokeStyle = "rgba(255, 170, 0, 0.55)";
        ctx.lineWidth = 1.5;
        for (var r = 0; r < 4; r++) {
            var radius = 10 + r * 11 + (time * 15) % 11;
            ctx.beginPath();
            ctx.ellipse(0, 20, radius, radius * 0.42, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Glowing Core Reactor (System Warning Icon with extreme glow)
        ctx.save();
        ctx.fillStyle = "#FFAA00";
        ctx.shadowBlur = 18 + Math.sin(time * 10) * 6;
        ctx.shadowColor = "#FFAA00";
        ctx.beginPath();
        ctx.moveTo(0, 8); ctx.lineTo(14, 28); ctx.lineTo(-14, 28); ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.shadowBlur = 0;
        ctx.fillRect(-1.5, 14, 3, 7);
        ctx.fillRect(-1.5, 23, 3, 3);
        ctx.restore();
        
        // Orbiting Warning Nodes
        for (var o = 0; o < 4; o++) {
            var oAngle = time * 2.6 + (o * Math.PI / 2);
            var ox = Math.cos(oAngle) * 60;
            var oy = Math.sin(oAngle) * 14 + 20;
            ctx.fillStyle = "#FFCC00";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#FFCC00";
            ctx.fillRect(ox - 4, oy - 4, 8, 8);
            ctx.shadowBlur = 0;
        }
        
        // Ripped 8-Pack Abs drawn as Shaded Voxel blocks
        var abGlow = "rgba(0, 255, 102, " + (0.6 + Math.sin(time * 8) * 0.3).toFixed(2) + ")";
        for (var row = 0; row < 4; row++) {
            var abY = 44 + row * 12;
            var abW = 18 - row * 1.5;
            
            // Left ab block
            ctx.fillStyle = "#252525";
            ctx.fillRect(-abW - 5, abY, abW, 10);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
            ctx.strokeRect(-abW - 5, abY, abW, 10);
            
            // Right ab block
            ctx.fillStyle = "#1e1e1e";
            ctx.fillRect(5, abY, abW, 10);
            ctx.strokeRect(5, abY, abW, 10);
            
            // Glowing neon separators
            ctx.strokeStyle = abGlow;
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(-abW - 12, abY + 11);
            ctx.lineTo(abW + 12, abY + 11);
            ctx.stroke();
        }
        
        // Biomechanical Rib Voxel Lines
        ctx.strokeStyle = "#505050";
        ctx.lineWidth = 2.5;
        for (var ri = 0; ri < 4; ri++) {
            var ribY = 18 + ri * 14;
            ctx.strokeRect(-66, ribY, 16, 7);
            ctx.strokeRect(50, ribY, 16, 7);
        }
        
        // Overlapping Shoulder Deltoid Plates
        ctx.fillStyle = "#303030";
        ctx.fillRect(-85, 16, 32, 34);
        ctx.fillRect(53, 16, 32, 34);
        ctx.strokeStyle = "#909090";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-85, 16, 32, 34);
        ctx.strokeRect(53, 16, 32, 34);
        
        // Floating cybernetic weapon nodes at sides (Glow)
        ctx.save();
        ctx.fillStyle = "#00FFFF";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#00FFFF";
        var wingOsc = Math.sin(time * 5) * 10;
        ctx.fillRect(-105, 30 + wingOsc, 10, 20);
        ctx.fillRect(95, 30 - wingOsc, 10, 20);
        ctx.restore();
        
        // Glowing red orbital threat rings (Rotating in 3D perspective)
        ctx.strokeStyle = "rgba(255, 0, 85, 0.65)";
        ctx.lineWidth = 2.2;
        ctx.save();
        ctx.rotate(time * 1.8);
        ctx.beginPath();
        ctx.ellipse(0, 38, 95, 30, 0.28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        
        ctx.save();
        ctx.rotate(-time * 1.8);
        ctx.beginPath();
        ctx.ellipse(0, 38, 95, 30, -0.28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        
        // Muscular voxel neck
        ctx.fillStyle = "#1e1e1e";
        ctx.fillRect(-16, -16, 32, 17);
        
        // Floating Voxel Glitch Skull Head (Redesigned Phase 2 Head)
        ctx.save();
        ctx.translate(0, -38);
        
        // Voxel matrix grid face
        ctx.fillStyle = "#FF00FF";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#FF00FF";
        ctx.fillRect(-24, -16, 48, 32);
        
        // Cyber-Slit Eye Sockets
        ctx.fillStyle = "#000000";
        ctx.shadowBlur = 0;
        ctx.fillRect(-18, -7, 11, 9);
        ctx.fillRect(7, -7, 11, 9);
        
        // Glowing double pupils
        ctx.fillStyle = "#00FF66";
        ctx.fillRect(-15, -5, 5, 5);
        ctx.fillRect(10, -5, 5, 5);
        
        // Holographic horns/lines shooting up
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-20, -16); ctx.lineTo(-26, -32);
        ctx.moveTo(20, -16); ctx.lineTo(26, -32);
        ctx.stroke();
        
        ctx.restore();
        
        ctx.restore();
        
    } else {
        // ====================================================================
        // PHASE 3: THE FATAL EXCEPTION (Blue-Screen Digital Sovereign)
        // ====================================================================
        ctx.save();
        
        // 0. GLITCH CLOCKWORK ORBIT (Hourglass-inspired epic rings)
        ctx.save();
        ctx.translate(0, 30);
        ctx.rotate(time * 0.45);
        ctx.strokeStyle = "rgba(0, 240, 255, 0.3)";
        ctx.lineWidth = 2.0;
        ctx.shadowBlur = 16;
        ctx.shadowColor = "#00FFFF";
        
        ctx.beginPath();
        ctx.arc(0, 0, 110, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
        
        ctx.save();
        ctx.translate(0, 30);
        ctx.rotate(-time * 0.35);
        ctx.fillStyle = "rgba(255, 0, 255, 0.45)";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FF00FF";
        ctx.font = "bold 9px Courier";
        var cyberNumerals = ["0x00", "0x0A", "0x7F", "0xDB", "0xFF", "0xEF", "0x404", "0x88"];
        for (var n = 0; n < 8; n++) {
            var a = (n / 8) * Math.PI * 2 - Math.PI / 2;
            ctx.save();
            ctx.translate(Math.cos(a) * 125, Math.sin(a) * 125);
            ctx.rotate(a + Math.PI / 2);
            ctx.fillText(cyberNumerals[n], -12, 0);
            ctx.restore();
        }
        ctx.restore();
        
        // Spatial Cracks (Torn canvas fragments representing broken code)
        ctx.strokeStyle = "#FF00FF";
        ctx.lineWidth = 3.0;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#FF00FF";
        for (var cr = 0; cr < 6; cr++) {
            var cAngle = cr * Math.PI / 3 + Math.sin(time * 3.5) * 0.25;
            ctx.save();
            ctx.rotate(cAngle);
            ctx.beginPath();
            ctx.moveTo(115, 0);
            ctx.lineTo(142, -18);
            ctx.lineTo(158, 12);
            ctx.lineTo(180, -6);
            ctx.stroke();
            ctx.restore();
        }
        ctx.shadowBlur = 0;
        
        // Coordinate Grid warping in the background
        ctx.strokeStyle = "rgba(0, 255, 255, 0.18)";
        ctx.lineWidth = 1.2;
        var gridShear = Math.sin(time * 3.2) * 22;
        for (var gx = -180; gx <= 180; gx += 40) {
            ctx.beginPath();
            ctx.moveTo(gx - gridShear, -130);
            ctx.lineTo(gx + gridShear, 130);
            ctx.stroke();
        }
        for (var gy = -130; gy <= 130; gy += 40) {
            ctx.beginPath();
            ctx.moveTo(-180, gy - Math.cos(time * 3)*10);
            ctx.lineTo(180, gy + Math.cos(time * 3)*10);
            ctx.stroke();
        }
        
        // Massive invader shoulder block
        ctx.fillStyle = "#060618";
        ctx.fillRect(-155, 10, 310, 78);
        ctx.strokeStyle = "rgba(0, 255, 255, 0.6)";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-155, 10, 310, 78);
        
        // 1. CHEST: BLUE SCREEN OF DEATH (BSOD) TERMINAL REACTOR CORE
        ctx.fillStyle = "#000099"; // deep royal blue
        ctx.fillRect(-70, 16, 140, 64);
        ctx.strokeStyle = "#00f0ff"; // neon cyan border
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-70, 16, 140, 64);
        
        // Scrolling raw white hex strings inside BSOD
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 7px Courier";
        var hexLines = [
            "FATAL_ERROR_0x000F",
            "REG:0x404:COREPANIC",
            "FORMATTING_C:99%",
            "NULL_PTR_DEREF",
            "SYS_CRITICAL_HALT",
            "STACK_OVERFLOW_404",
            "KERNEL_PANIC_00A"
        ];
        var scrollIndex = Math.floor(time * 3.0) % hexLines.length;
        for (var hl = 0; hl < 5; hl++) {
            var lineY = 28 + hl * 11;
            var textStr = hexLines[(scrollIndex + hl) % hexLines.length];
            if (hl === 4 && Math.floor(time * 3) % 2 === 0) {
                textStr += " _"; // blinking block cursor
            }
            ctx.fillText(textStr, -64, lineY);
        }
        
        // 2. DETAILED BIOMECHANICAL CLAWS TEARING Spatial coordinates on sides
        // Left Giant Claw
        ctx.save();
        ctx.translate(-126, 30 + Math.sin(time * 5.0) * 11);
        ctx.rotate(-0.3 + Math.sin(time * 3.0) * 0.15);
        
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(-28, -20, 56, 40);
        ctx.strokeStyle = "#FF00FF";
        ctx.lineWidth = 2.2;
        ctx.strokeRect(-28, -20, 56, 40);
        
        // Glowing internal circuit traces
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-18, -12); ctx.lineTo(18, -12);
        ctx.moveTo(-18, 0); ctx.lineTo(18, 0);
        ctx.moveTo(-18, 12); ctx.lineTo(18, 12);
        ctx.stroke();
        
        // Segmented hydraulic piston shaft
        ctx.fillStyle = "#d0d0d0";
        var shaftOsc = Math.sin(time * 5.0) * 6;
        ctx.fillRect(-11, 20, 9, 14 + shaftOsc);
        ctx.fillRect(2, 20, 9, 14 + shaftOsc);
        
        // 3 sharp biomechanical voxel claws (metallic silver)
        ctx.fillStyle = "#ededed";
        ctx.fillRect(-24, 32 + shaftOsc, 11, 24);
        ctx.fillRect(-6, 32 + shaftOsc, 13, 30);
        ctx.fillRect(13, 32 + shaftOsc, 11, 24);
        
        // Flashing crimson tip lasers
        ctx.fillStyle = Math.random() < 0.3 ? "#00FFFF" : "#FF0055";
        ctx.fillRect(-21, 52 + shaftOsc, 5, 5);
        ctx.fillRect(-2, 58 + shaftOsc, 5, 5);
        ctx.fillRect(16, 52 + shaftOsc, 5, 5);
        
        ctx.restore();
        
        // Right Giant Claw
        ctx.save();
        ctx.translate(126, 30 - Math.sin(time * 5.0) * 11);
        ctx.rotate(0.3 - Math.sin(time * 3.0) * 0.15);
        
        ctx.fillStyle = "#121212";
        ctx.fillRect(-28, -20, 56, 40);
        ctx.strokeStyle = "#FF00FF";
        ctx.lineWidth = 2.2;
        ctx.strokeRect(-28, -20, 56, 40);
        
        // Circuit traces
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-18, -12); ctx.lineTo(18, -12);
        ctx.moveTo(-18, 0); ctx.lineTo(18, 0);
        ctx.moveTo(-18, 12); ctx.lineTo(18, 12);
        ctx.stroke();
        
        // Hydraulic shaft
        ctx.fillStyle = "#d0d0d0";
        ctx.fillRect(-11, 20, 9, 14 - shaftOsc);
        ctx.fillRect(2, 20, 9, 14 - shaftOsc);
        
        // Claws
        ctx.fillStyle = "#ededed";
        ctx.fillRect(-24, 32 - shaftOsc, 11, 24);
        ctx.fillRect(-6, 32 - shaftOsc, 13, 30);
        ctx.fillRect(13, 32 - shaftOsc, 11, 24);
        
        // Flashing tip lasers
        ctx.fillStyle = Math.random() < 0.3 ? "#00FFFF" : "#FF0055";
        ctx.fillRect(-21, 52 - shaftOsc, 5, 5);
        ctx.fillRect(-2, 58 - shaftOsc, 5, 5);
        ctx.fillRect(16, 52 - shaftOsc, 5, 5);
        
        ctx.restore();
        
        // 3. FLOATING BINARY SKULL SOVEREIGN (Redesigned Phase 3 Head)
        ctx.save();
        ctx.translate(0, -38);
        var chompY = Math.sin(time * 8.5) > 0.15 ? (Math.sin(time * 8.5) - 0.15) * 12.0 : 0.0;
        
        // Draw double cybernetic neon outline shadow for the skull (extreme glow)
        ctx.strokeStyle = "#FF00FF";
        ctx.lineWidth = 3.5;
        ctx.shadowBlur = 22 + Math.sin(time * 8) * 6;
        ctx.shadowColor = "#FF00FF";
        ctx.beginPath();
        ctx.arc(0, -10, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(0, -10, 29, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw main white voxel skull
        ctx.fillStyle = "#FFFFFF";
        
        // dome
        ctx.beginPath();
        ctx.arc(0, -10, 24, 0, Math.PI * 2);
        ctx.fill();
        
        // Jaw block (moving down)
        ctx.fillRect(-15, 10 + chompY, 30, 13);
        // Sharp metallic silver teeth rows
        ctx.fillStyle = "#b0b0b0";
        for (var t = -12; t <= 12; t += 6) {
            ctx.fillRect(t - 2.5, 8, 5, 4);
            ctx.fillRect(t - 2.5, 10 + chompY, 5, 4);
        }
        
        // Black Eye Cavities
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(-8, -12, 6, 0, Math.PI * 2);
        ctx.arc(8, -12, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Red glowing warning slits in eyes
        ctx.fillStyle = "#FF0055";
        ctx.fillRect(-11, -14, 5, 3);
        ctx.fillRect(6, -14, 5, 3);
        
        // Neon energy trails shooting out of eyes
        ctx.strokeStyle = "rgba(255, 0, 85, 0.65)";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-10, -12); ctx.lineTo(-35 - Math.sin(time*6)*6, -12);
        ctx.moveTo(6, -12); ctx.lineTo(35 + Math.sin(time*6)*6, -12);
        ctx.stroke();
        
        // Nasal Cavity
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.moveTo(0, -4); ctx.lineTo(-2.5, 0.5); ctx.lineTo(2.5, 0.5); ctx.closePath();
        ctx.fill();
        
        // Rotating Crown of Hex Strings
        ctx.fillStyle = "#00FFFF";
        ctx.font = "bold 7px Courier";
        var hexKeys = ["0x404", "0x0A", "0xFF", "0xDB"];
        for (var hk = 0; hk < 4; hk++) {
            var hkAngle = -time * 2.2 + (hk * Math.PI / 2);
            var hkx = Math.cos(hkAngle) * 38;
            var hky = Math.sin(hkAngle) * 9 - 14;
            ctx.fillText(hexKeys[hk], hkx - 11, hky);
        }
        
        ctx.restore();
        
        // 4. VERTICAL GLITCH TERMINAL SCANLINES OVERLAY (Thicker and flickering)
        ctx.fillStyle = "rgba(0, 255, 100, 0.08)";
        var scanY = (time * 140) % 220 - 110;
        ctx.fillRect(-155, scanY, 310, 5);
        if (Math.random() < 0.1) {
            ctx.fillStyle = "rgba(255, 0, 255, 0.07)";
            ctx.fillRect(-155, -110, 310, 220); // full space flash glitch
        }
        
        ctx.restore();
    }

    // ====================================================
    // PHASE-SPECIFIC VISUAL OVERLAYS
    // ====================================================
    
    // Core Phase: Matrix rain columns + error text
    if (type === "glitch_core" || type === "glitch_fatal") {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.font = "8px monospace";
        var matrixChars = "01アイウエオカキクケコ∀∃∈∉⊂⊃";
        for (var mc = 0; mc < 6; mc++) {
            var mcX = -50 + mc * 20 + Math.sin(time + mc) * 5;
            var mcBaseY = ((time * 80 + mc * 37) % 120) - 60;
            for (var mr = 0; mr < 4; mr++) {
                var mcAlpha = 0.4 - mr * 0.1;
                ctx.fillStyle = "rgba(0, 255, 0, " + mcAlpha + ")";
                var ch = matrixChars[Math.floor((time * 8 + mc * 3 + mr) % matrixChars.length)];
                ctx.fillText(ch, mcX, mcBaseY + mr * 10);
            }
        }
        ctx.restore();
    }
    
    // Fatal Phase: BSOD flicker + kernel panic text + pixel storm
    if (type === "glitch_fatal") {
        // Random BSOD flash
        if (Math.random() < 0.03) {
            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 180, 0.15)";
            ctx.fillRect(-120, -100, 240, 200);
            ctx.restore();
        }
        
        // Kernel panic error text fragments
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.font = "6px monospace";
        var errTexts = ["SEGFAULT", "0xDEAD", "PANIC", "ERR:404", "NULL_PTR", "OVERFLOW", "CORRUPT"];
        for (var et = 0; et < 3; et++) {
            var etIdx = Math.floor(time * 2 + et * 3) % errTexts.length;
            var etX = -60 + Math.sin(time * 4 + et * 2) * 50;
            var etY = -40 + Math.cos(time * 3 + et * 1.5) * 40;
            ctx.fillStyle = "rgba(255, 0, 0, " + (0.3 + Math.sin(time * 6 + et) * 0.2) + ")";
            ctx.fillText(errTexts[etIdx], etX, etY);
        }
        ctx.restore();
        
        // RGB pixel storm
        ctx.save();
        for (var ps = 0; ps < 10; ps++) {
            var psX = (Math.sin(time * 7 + ps * 1.1) * 80);
            var psY = (Math.cos(time * 5 + ps * 0.8) * 50);
            var psColors = ["#FF0000", "#00FF00", "#0000FF", "#FF00FF", "#00FFFF"];
            ctx.fillStyle = psColors[ps % 5];
            ctx.globalAlpha = 0.3 + Math.sin(time * 10 + ps) * 0.2;
            ctx.fillRect(psX - 2, psY - 2, 4, 4);
        }
        ctx.globalAlpha = 1.0;
        ctx.restore();
    }

    ctx.restore();
};

Enemy.prototype.drawPrism = function(ctx) {
    var time = Date.now() / 1000;
    var type = this.renderType; // "prism_phase1", "prism_phase2", "prism_phase3"
    
    // Floating and breathing motions
    var breathe = 1.0 + Math.sin(time * 2.0) * 0.02;
    var floatY = Math.sin(time * 1.8) * 6.0;
    
    ctx.save();
    ctx.translate(370, 200 + floatY);
    ctx.scale(breathe, breathe);
    
    // Local helper for drawing crystal facets
    function drawFacet(x1, y1, x2, y2, x3, y3, fill, stroke) {
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    if (type === "prism_phase1") {
        // ====================================================================
        // PHASE 1: IMMACULATE CRYSTAL GOLEM
        // ====================================================================
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00FFFF";
        
        // 1. Draw floating crystal shoulders
        var shDist = 55 + Math.sin(time * 3) * 3;
        drawCrystalShard(ctx, -shDist, -15, 14, time * 0.5, "#00E5FF");
        drawCrystalShard(ctx, shDist, -15, 14, -time * 0.5, "#00E5FF");
        
        // 2. Draw diamond head
        ctx.save();
        ctx.translate(0, -50);
        drawFacet(0, -22, 12, 0, 0, 12, "rgba(224, 255, 255, 0.7)", "#FFFFFF");
        drawFacet(0, -22, -12, 0, 0, 12, "rgba(0, 240, 255, 0.7)", "#FFFFFF");
        drawFacet(0, 12, 12, 0, 0, 22, "rgba(0, 191, 255, 0.7)", "#FFFFFF");
        drawFacet(0, 12, -12, 0, 0, 22, "rgba(0, 150, 255, 0.7)", "#FFFFFF");
        // Glowing eyes (cyan sparks)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(-3, 0, 2, 2);
        ctx.fillRect(2, 0, 2, 2);
        ctx.restore();
        
        // 3. Draw heavy multi-faceted torso
        ctx.save();
        ctx.translate(0, 10);
        // Top front facet
        drawFacet(0, -30, 28, -10, -28, -10, "rgba(224, 255, 255, 0.75)", "#FFFFFF");
        // Left facet
        drawFacet(-28, -10, 0, 30, -38, 10, "rgba(0, 220, 255, 0.75)", "#FFFFFF");
        // Right facet
        drawFacet(28, -10, 0, 30, 38, 10, "rgba(0, 180, 255, 0.75)", "#FFFFFF");
        // Bottom front facet
        drawFacet(0, 30, 28, -10, -28, -10, "rgba(0, 200, 255, 0.65)", "#FFFFFF");
        // Rear side wings/crystals
        drawFacet(-28, -10, -38, 10, -18, -40, "rgba(0, 130, 240, 0.5)", "#FFFFFF");
        drawFacet(28, -10, 38, 10, 18, -40, "rgba(0, 130, 240, 0.5)", "#FFFFFF");
        ctx.restore();
        
        ctx.restore();
        
    } else if (type === "prism_phase2") {
        // ====================================================================
        // PHASE 2: CRACKED KALEIDOSCOPIC GOLEM (Refracting spectrum light)
        // ====================================================================
        ctx.save();
        
        // 1. Rainbow light sweeps radiating from back
        ctx.save();
        var numRays = 8;
        ctx.globalCompositeOperation = "screen";
        for (var r = 0; r < numRays; r++) {
            var rayAngle = time * 0.5 + (r * Math.PI * 2 / numRays);
            var grad = ctx.createLinearGradient(0, 0, Math.cos(rayAngle) * 120, Math.sin(rayAngle) * 120);
            var colors = ["rgba(255,0,0,0.25)", "rgba(0,255,0,0.25)", "rgba(0,0,255,0.25)", "rgba(255,255,0,0.25)", "rgba(255,0,255,0.25)", "rgba(0,255,255,0.25)"];
            grad.addColorStop(0, "rgba(255, 255, 255, 0.6)");
            grad.addColorStop(0.5, colors[r % colors.length]);
            grad.addColorStop(1, "rgba(0, 0, 0, 0)");
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(rayAngle - 0.15) * 140, Math.sin(rayAngle - 0.15) * 140);
            ctx.lineTo(Math.cos(rayAngle + 0.15) * 140, Math.sin(rayAngle + 0.15) * 140);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
        
        // 2. Rotating hexagonal crystal ring around it
        ctx.save();
        ctx.strokeStyle = "rgba(0, 240, 255, 0.6)";
        ctx.lineWidth = 2.0;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00FFFF";
        ctx.beginPath();
        for (var h = 0; h <= 6; h++) {
            var hAngle = -time * 1.2 + (h * Math.PI / 3);
            var hx = Math.cos(hAngle) * 65;
            var hy = Math.sin(hAngle) * 45;
            if (h === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
        }
        ctx.stroke();
        // Draw small shards on vertices of the hex ring
        for (var h = 0; h < 6; h++) {
            var hAngle = -time * 1.2 + (h * Math.PI / 3);
            drawCrystalShard(ctx, Math.cos(hAngle) * 65, Math.sin(hAngle) * 45, 6, hAngle, "#FFFFFF");
        }
        ctx.restore();
        
        // 3. Cracked head (gaps between facets)
        ctx.save();
        ctx.translate(0, -50 + Math.sin(time*5.0)*1.5);
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#FF1493";
        // Displace facets outward slightly to represent cracks
        var gap = 2.0 + Math.sin(time * 8) * 1.0;
        drawFacet(0, -22 - gap, 12 + gap, -gap, 0 + gap, 12, "rgba(224, 255, 255, 0.75)", "#FF00FF");
        drawFacet(0, -22 - gap, -12 - gap, -gap, 0 - gap, 12, "rgba(0, 240, 255, 0.75)", "#FF00FF");
        drawFacet(0, 12 + gap, 12 + gap, gap, 0, 22 + gap, "rgba(0, 191, 255, 0.75)", "#FF00FF");
        drawFacet(0, 12 + gap, -12 - gap, gap, 0, 22 + gap, "rgba(0, 150, 255, 0.75)", "#FF00FF");
        ctx.restore();
        
        // 4. Cracked torso
        ctx.save();
        ctx.translate(0, 10);
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#FF00FF";
        var cgap = 3.0;
        drawFacet(0, -30 - cgap, 28 + cgap, -10 - cgap, -28 - cgap, -10 - cgap, "rgba(224, 255, 255, 0.8)", "#FF1493");
        drawFacet(-28 - cgap, -10, 0, 30 + cgap, -38 - cgap, 10, "rgba(0, 220, 255, 0.8)", "#FF1493");
        drawFacet(28 + cgap, -10, 0, 30 + cgap, 38 + cgap, 10, "rgba(0, 180, 255, 0.8)", "#FF1493");
        drawFacet(0, 30 + cgap, 28 + cgap, -10 + cgap, -28 - cgap, -10 + cgap, "rgba(0, 200, 255, 0.7)", "#FF1493");
        ctx.restore();
        
        // 5. Floating shoulders oscillating
        var shDist = 60 + Math.sin(time * 4) * 5;
        drawCrystalShard(ctx, -shDist, -15, 14, time * 0.9, "#FF00FF");
        drawCrystalShard(ctx, shDist, -15, 14, -time * 0.9, "#00FFFF");
        
        ctx.restore();
        
    } else if (type === "prism_phase3") {
        // ====================================================================
        // PHASE 3: SHATTERED KALEIDOSCOPE CORE (Floating fragments & hyper core)
        // ====================================================================
        ctx.save();
        
        // 1. Intense concentric background geometry rings (rotating opposite directions)
        ctx.save();
        ctx.strokeStyle = "rgba(0, 255, 255, 0.22)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 75, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = "rgba(255, 0, 255, 0.22)";
        ctx.beginPath();
        ctx.arc(0, 0, 95, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        
        // 2. Exploded/Shattered outer shards drifting in orbit
        ctx.save();
        var numFragments = 10;
        for (var f = 0; f < numFragments; f++) {
            var fAngle = time * 0.75 + (f * Math.PI * 2 / numFragments);
            var fDist = 70 + Math.sin(time * 2.5 + f) * 12;
            var fx = Math.cos(fAngle) * fDist;
            var fy = Math.sin(fAngle) * (fDist * 0.65);
            var fColor = (f % 2 === 0) ? "#FF00FF" : "#00FFFF";
            drawCrystalShard(ctx, fx, fy, 8 + (f % 3) * 3, fAngle * 2, fColor);
        }
        ctx.restore();
        
        // 3. Floating exploded shoulder/head fragments far away
        ctx.save();
        ctx.translate(Math.sin(time*3.5)*15, -80 + Math.cos(time*2.8)*10);
        // Head segments split apart
        drawFacet(-10, -10, -2, -22, -18, -12, "rgba(224, 255, 255, 0.4)", "#FFFFFF");
        drawFacet(10, -10, 2, -22, 18, -12, "rgba(0, 240, 255, 0.4)", "#00FFFF");
        ctx.restore();
        
        // Shoulders drifting
        drawCrystalShard(ctx, -85 + Math.sin(time*2)*4, -25, 12, time * 0.4, "#FF00FF");
        drawCrystalShard(ctx, 85 - Math.sin(time*2)*4, -25, 12, -time * 0.4, "#00FFFF");
        
        // 4. Central Spinning Octahedron Hyper Core
        ctx.save();
        ctx.scale(1.3, 1.3);
        ctx.shadowBlur = 25;
        ctx.shadowColor = (Math.floor(time * 4) % 2 === 0) ? "#00FFFF" : "#FF00FF";
        
        var coreRot = time * 1.6;
        // Draw 3D octahedron sides with shifting spectrum gradients
        // Top front
        drawFacet(0, -28, 18, 0, 0, 0, "rgba(255, 255, 255, 0.8)", "#FFFFFF");
        // Top left
        drawFacet(0, -28, -18, 0, 0, 0, "rgba(0, 255, 255, 0.75)", "#00FFFF");
        // Bottom front
        drawFacet(0, 28, 18, 0, 0, 0, "rgba(255, 0, 255, 0.75)", "#FF00FF");
        // Bottom left
        drawFacet(0, 28, -18, 0, 0, 0, "rgba(0, 0, 255, 0.75)", "#0000FF");
        
        // Inner glowing core
        var corePulse = 8 + Math.sin(time * 12) * 2;
        drawCrystalShard(ctx, 0, 0, corePulse, -coreRot, "#FFFFFF");
        ctx.restore();
        
        // 5. Light beam tracers scanning the screen
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(Math.cos(time*2.5)*220, Math.sin(time*2.5)*220);
        ctx.moveTo(0, 0); ctx.lineTo(Math.cos(time*2.5 + Math.PI)*220, Math.sin(time*2.5 + Math.PI)*220);
        ctx.stroke();
        ctx.restore();
        
        ctx.restore();
    }
    
    ctx.restore();
};

Enemy.prototype.drawVoidMaw = function(ctx) {
    ctx.save();
    var time = Date.now() / 1000;
    var bossX = 370;
    var bossY = 160;
    
    // Position bounce/breathing
    var breatheSpeed = (this.renderType === "void_enraged" || this.renderType === "void_shattered") ? 8 : 3;
    var breatheAmp = (this.renderType === "void_enraged" || this.renderType === "void_shattered") ? 8 : 5;
    var breatheY = Math.sin(time * breatheSpeed) * breatheAmp;
    var shakeX = (this.renderType === "void_shattered" || this.renderType === "void_enraged") ? (Math.random() - 0.5) * 5 : 0;
    var shakeY = (this.renderType === "void_shattered" || this.renderType === "void_enraged") ? (Math.random() - 0.5) * 5 : 0;
    
    ctx.translate(bossX + shakeX, bossY + breatheY + shakeY);
    
    // Core color theme
    var borderGlow = "#9400D3"; // Dark Violet
    var innerMawColor = "#4B0082"; // Indigo
    if (this.renderType === "void_enraged") {
        borderGlow = "#FF00FF"; // Neon Magenta
        innerMawColor = "#300030";
    } else if (this.renderType === "void_shattered") {
        borderGlow = "#BA55D3"; // Medium Orchid
        innerMawColor = "#1A002C";
    }
    
    // 1. Draw Squirming Void Tentacles (6 tentacles)
    var numTentacles = 6;
    for (var t = 0; t < numTentacles; t++) {
        ctx.save();
        var tAngle = (t * Math.PI * 2 / numTentacles) + (Math.sin(time * 1.5 + t) * 0.2);
        ctx.rotate(tAngle);
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        
        var length = 90 + Math.sin(time * 3 + t) * 15;
        var startX = 0;
        var startY = 0;
        ctx.strokeStyle = t % 2 === 0 ? "#8B008B" : "#4B0082";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.shadowBlur = 12;
        ctx.shadowColor = borderGlow;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (var seg = 0; seg <= 10; seg++) {
            var progress = seg / 10;
            var segX = progress * length;
            var segY = Math.sin(progress * Math.PI * 2 + time * 4 + t) * 12;
            ctx.lineTo(segX, segY);
        }
        ctx.stroke();
        ctx.restore();
    }
    
    // 2. Draw Floating Void Particles for Shattered Phase
    if (this.renderType === "void_shattered") {
        ctx.save();
        for (var p = 0; p < 15; p++) {
            var pAngle = (time * 2 + p * 123.4) % (Math.PI * 2);
            var pDist = 45 + ((time * 40 + p * 17) % 70);
            var px = Math.cos(pAngle) * pDist;
            var py = Math.sin(pAngle) * pDist;
            var pSize = 2 + (p % 4);
            ctx.fillStyle = borderGlow;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#FFFFFF";
            ctx.fillRect(px, py, pSize, pSize);
        }
        ctx.restore();
    }
    
    // 3. Draw Singularity Core (inside maw)
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = borderGlow;
    var grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 35);
    grad.addColorStop(0, "#000000");
    grad.addColorStop(0.5, innerMawColor);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Shattered core pulse
    if (this.renderType === "void_shattered") {
        ctx.save();
        ctx.rotate(-time * 2);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (var edge = 0; edge < 6; edge++) {
            var eAngle = edge * Math.PI / 3;
            var eDist = 18 + Math.sin(time * 8) * 3;
            var ex = Math.cos(eAngle) * eDist;
            var ey = Math.sin(eAngle) * eDist;
            if (edge === 0) ctx.moveTo(ex, ey);
            else ctx.lineTo(ex, ey);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
    
    // 4. Draw Jaws & Teeth
    var mouthOpen = 8 + Math.sin(time * 2.5) * 6;
    if (this.renderType === "void_enraged" || this.renderType === "void_shattered") {
        mouthOpen = 14 + Math.sin(time * 6) * 10;
    }
    
    // Upper Jaw
    ctx.save();
    ctx.translate(0, -mouthOpen);
    ctx.fillStyle = "#1A002C";
    ctx.strokeStyle = borderGlow;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = borderGlow;
    ctx.beginPath();
    ctx.moveTo(-50, -5);
    ctx.bezierCurveTo(-45, -35, 45, -35, 50, -5);
    ctx.bezierCurveTo(30, -15, -30, -15, -50, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Upper Teeth
    ctx.fillStyle = "#E0FFFF";
    ctx.strokeStyle = "#00FFFF";
    ctx.lineWidth = 0.8;
    for (var tx = -35; tx <= 35; tx += 14) {
        ctx.beginPath();
        ctx.moveTo(tx, -10);
        ctx.lineTo(tx + 4, 3);
        ctx.lineTo(tx + 8, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();
    
    // Lower Jaw
    ctx.save();
    ctx.translate(0, mouthOpen);
    ctx.fillStyle = "#1A002C";
    ctx.strokeStyle = borderGlow;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = borderGlow;
    ctx.beginPath();
    ctx.moveTo(-50, 5);
    ctx.bezierCurveTo(-45, 35, 45, 35, 50, 5);
    ctx.bezierCurveTo(30, 15, -30, 15, -50, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Lower Teeth
    ctx.fillStyle = "#E0FFFF";
    ctx.strokeStyle = "#00FFFF";
    ctx.lineWidth = 0.8;
    for (var tx = -35; tx <= 35; tx += 14) {
        ctx.beginPath();
        ctx.moveTo(tx, 10);
        ctx.lineTo(tx + 4, -3);
        ctx.lineTo(tx + 8, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();
    
    // 5. Draw Blinking Yellow/Red Cosmic Eyes
    var eyes = [
        { x: -65, y: -25, r: 6 },
        { x: 65, y: -25, r: 6 },
        { x: -35, y: -45, r: 4 },
        { x: 35, y: -45, r: 4 },
        { x: -75, y: 15, r: 5 },
        { x: 75, y: 15, r: 5 }
    ];
    for (var e = 0; e < eyes.length; e++) {
        var eye = eyes[e];
        var blink = (time * 1.5 + e * 0.7) % 3 > 2.7; // Blink logic
        if (blink) continue;
        
        ctx.save();
        ctx.translate(eye.x, eye.y);
        ctx.fillStyle = this.renderType === "void_enraged" ? "#FF0000" : "#FFD700";
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.renderType === "void_enraged" ? "#FF0000" : "#FFD700";
        ctx.beginPath();
        ctx.arc(0, 0, eye.r, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupil
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.ellipse(0, 0, 1.5, eye.r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    ctx.restore();
};

Enemy.prototype.drawBillCipher = function(ctx) {
    var time = Date.now() / 1000;
    ctx.save();
    
    var isP1 = (this.renderType === "bill_normal");
    var isP2 = (this.renderType === "bill_madness");
    var isP3 = (this.renderType === "bill_angry");
    
    // Jitter/shake effect when angry
    var shakeX = isP3 ? (Math.random() - 0.5) * 4 : (isP2 ? (Math.random() - 0.5) * 1.5 : 0);
    var shakeY = isP3 ? (Math.random() - 0.5) * 4 : (isP2 ? (Math.random() - 0.5) * 1.5 : 0);
    
    // Floating movement
    var floatOffset = Math.sin(time * 3) * 6;
    ctx.translate(370 + shakeX, 150 + floatOffset + shakeY);
    
    // 0. Draw Background Aura / Cipher Wheel / Magical Effects
    if (isP1) {
        ctx.save();
        // Rotating golden Cipher Wheel behind Bill
        ctx.strokeStyle = "rgba(255, 215, 0, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, 68, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.rotate(-time * 0.4);
        ctx.setLineDash([]);
        ctx.strokeStyle = "rgba(255, 215, 0, 0.15)";
        // Draw spokes
        for (var sp = 0; sp < 8; sp++) {
            var sa = sp * Math.PI / 4;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(sa) * 68, Math.sin(sa) * 68);
            ctx.stroke();
        }
        ctx.restore();
    } else if (isP2) {
        ctx.save();
        // Shifting neon magenta/cyan halo
        var madnessHue = (time * 90) % 360;
        ctx.shadowBlur = 35;
        ctx.shadowColor = "hsl(" + madnessHue + ", 100%, 50%)";
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.beginPath();
        ctx.arc(0, 0, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    } else if (isP3) {
        ctx.save();
        // Fiery red energy tendrils discharging from back
        ctx.shadowBlur = 30;
        ctx.shadowColor = "#FF0000";
        ctx.strokeStyle = "rgba(255, 0, 0, 0.45)";
        ctx.lineWidth = 2;
        for (var l = 0; l < 6; l++) {
            var la = l * Math.PI / 3 + time * 1.5;
            var lLen = 60 + Math.sin(time * 8 + l) * 20;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(Math.cos(la + 0.3) * (lLen * 0.5), Math.sin(la + 0.3) * (lLen * 0.5), Math.cos(la) * lLen, Math.sin(la) * lLen);
            ctx.stroke();
        }
        ctx.restore();
    }
    
    // 1. Draw limbs (behind body)
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    
    // Left Leg
    ctx.beginPath();
    ctx.moveTo(-15, 40);
    if (isP3) {
        ctx.lineTo(-25, 75);
        ctx.lineTo(-35, 75); // Foot
    } else {
        var legSwing = Math.sin(time * 4) * 5;
        ctx.lineTo(-20 + legSwing, 70);
        ctx.lineTo(-28 + legSwing, 70);
    }
    ctx.stroke();
    
    // Right Leg
    ctx.beginPath();
    ctx.moveTo(15, 40);
    if (isP3) {
        ctx.lineTo(25, 75);
        ctx.lineTo(35, 75); // Foot
    } else {
        var legSwing = Math.cos(time * 4) * 5;
        ctx.lineTo(20 + legSwing, 70);
        ctx.lineTo(28 + legSwing, 70);
    }
    ctx.stroke();
    
    // Left Arm
    ctx.beginPath();
    ctx.moveTo(-22, 10);
    if (isP3) {
        ctx.lineTo(-55, -20); // Arms raised angrily
    } else if (isP2) {
        ctx.lineTo(-45 + Math.sin(time * 15) * 8, 5); // Glitchy arms
    } else {
        ctx.lineTo(-45, -5 + Math.sin(time * 2.5) * 8); // Floating arms
    }
    ctx.stroke();
    
    // Right Arm
    ctx.beginPath();
    ctx.moveTo(22, 10);
    if (isP3) {
        ctx.lineTo(55, -20); // Arms raised angrily
    } else if (isP2) {
        ctx.lineTo(45 + Math.cos(time * 15) * 8, 5); // Glitchy arms
    } else {
        ctx.lineTo(45, -5 + Math.cos(time * 2.5) * 8); // Floating arms
    }
    ctx.stroke();
 
    // 2. Draw Triangle Body
    ctx.beginPath();
    ctx.moveTo(0, -45); // Apex
    ctx.lineTo(45, 40);  // Bottom-right
    ctx.lineTo(-45, 40); // Bottom-left
    ctx.closePath();
    
    if (isP1) {
        ctx.fillStyle = "#FFD700"; // Gold/Yellow
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#FFD700";
        ctx.fill();
    } else if (isP2) {
        // Shifting madness cosmic space texture mapped inside body
        ctx.save();
        ctx.fillStyle = "#0D001A";
        ctx.fill();
        ctx.clip();
        
        // Draw rotating stars/nebula inside triangle
        ctx.fillStyle = "rgba(255, 0, 255, 0.15)";
        ctx.beginPath();
        ctx.arc(Math.sin(time) * 15, Math.cos(time) * 15, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(0, 255, 255, 0.15)";
        ctx.beginPath();
        ctx.arc(Math.cos(time * 1.5) * 20, Math.sin(time * 1.5) * 20, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Stars drifting
        for (var s = 0; s < 15; s++) {
            var sa = time * 0.8 + s * (Math.PI * 2 / 15);
            var sd = 15 + ((s * 4) % 25);
            var sx = Math.cos(sa) * sd;
            var sy = Math.sin(sa) * sd;
            ctx.fillStyle = s % 2 === 0 ? "#FF00FF" : "#00FFFF";
            ctx.fillRect(sx, sy, 2.5, 2.5);
        }
        ctx.restore();
        
        ctx.shadowBlur = 20;
        var rRed = Math.floor(180 + Math.sin(time * 6) * 75);
        var rBlue = Math.floor(180 + Math.sin(time * 6 + Math.PI) * 75);
        ctx.shadowColor = "rgba(" + rRed + ",0," + rBlue + ",0.8)";
    } else {
        // Fiery red body with licking outer flames
        ctx.fillStyle = "#FF0000"; // Angry Red
        ctx.shadowBlur = 25;
        ctx.shadowColor = "#FF0000";
        ctx.fill();
        
        // Draw fire details on chest
        ctx.fillStyle = "#B30000";
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.quadraticCurveTo(-15, 25, -25, 40);
        ctx.lineTo(25, 40);
        ctx.quadraticCurveTo(15, 25, 0, 10);
        ctx.closePath();
        ctx.fill();
    }
    
    ctx.shadowBlur = 0; // reset shadow for body outline
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3.5;
    ctx.stroke();
    
    // Brick pattern lines inside Bill's body (Gravity Falls style)
    if (!isP2) { // Skip bricks for P2 cosmic body
        ctx.save();
        ctx.strokeStyle = isP3 ? "rgba(0, 0, 0, 0.22)" : "rgba(0, 0, 0, 0.15)";
        ctx.lineWidth = 1.5;
        // Horizontal lines
        for (var ly = -20; ly < 40; ly += 15) {
            // Calculate horizontal bounds of the triangle at this height
            var t = (ly + 45) / 85; // 0 at apex (-45), 1 at bottom (40)
            var halfW = t * 45;
            ctx.beginPath();
            ctx.moveTo(-halfW, ly);
            ctx.lineTo(halfW, ly);
            ctx.stroke();
            
            // Vertical lines (bricks staggered)
            var numSegments = Math.floor(halfW / 12) + 1;
            for (var s = -numSegments; s <= numSegments; s++) {
                var sx = s * 16 + (Math.floor(ly / 15) % 2 === 0 ? 8 : 0);
                if (Math.abs(sx) < halfW - 2) {
                    ctx.beginPath();
                    ctx.moveTo(sx, ly);
                    ctx.lineTo(sx, ly + 15);
                    ctx.stroke();
                }
            }
        }
        ctx.restore();
    }
    
    // 3. Draw Bow Tie (overlapping body slightly at base)
    ctx.save();
    ctx.fillStyle = "#000000";
    ctx.shadowBlur = isP3 ? 8 : 0;
    ctx.shadowColor = "#FF0000";
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(-12, 33);
    ctx.lineTo(-12, 47);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(12, 33);
    ctx.lineTo(12, 47);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 40, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // 4. Draw Single Centered Eye
    ctx.save();
    ctx.translate(0, 0); // Center of triangle roughly
    
    // Eye outline
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Iris / Pupil
    var isBlinking = (Math.sin(time * 2.2) > 0.92);
    if (!isBlinking) {
        if (isP1) {
            ctx.fillStyle = "#000000";
            ctx.beginPath();
            ctx.ellipse(0, 0, 3.5, 9, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (isP2) {
            // Glowing red madness eye
            ctx.fillStyle = "#FF0000";
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#FF0000";
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupil slit
            ctx.fillStyle = "#000000";
            ctx.beginPath();
            ctx.ellipse(0, 0, 2, 7, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Angry giant veins / fiery glowing red eye
            ctx.fillStyle = "#8B0000";
            ctx.beginPath();
            ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fill();
            
            // Fiery yellow pupil slit
            ctx.fillStyle = "#FFFF00";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#FFFF00";
            ctx.beginPath();
            ctx.ellipse(0, 0, 3, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // Draw closed eye line (blink)
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(18, 0);
        ctx.stroke();
    }
    
    // Eye lash lines (four lash lines radiating outward)
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    // Top lashes
    ctx.beginPath(); ctx.moveTo(-12, -8); ctx.lineTo(-18, -14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-4, -11); ctx.lineTo(-6, -18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -11); ctx.lineTo(6, -18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, -8); ctx.lineTo(18, -14); ctx.stroke();
    // Bottom lashes
    ctx.beginPath(); ctx.moveTo(-12, 8); ctx.lineTo(-18, 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-4, 11); ctx.lineTo(-6, 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, 11); ctx.lineTo(6, 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, 8); ctx.lineTo(18, 14); ctx.stroke();
    
    ctx.restore();
    
    // 5. Draw Floating Top Hat (drawn above apex)
    ctx.save();
    // Hover hat offset slightly separate from body float
    var hatFloat = Math.sin(time * 3.5) * 2;
    ctx.translate(0, -48 + hatFloat);
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = isP3 ? "#FF0000" : "#000000";
    ctx.lineWidth = 2;
    if (isP3) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF0000";
    }
    
    // Hat cylinder
    ctx.fillRect(-10, -25, 20, 25);
    ctx.strokeRect(-10, -25, 20, 25);
    
    // Hat brim
    ctx.fillRect(-18, 0, 36, 4);
    ctx.strokeRect(-18, 0, 36, 4);
    ctx.restore();
    
    ctx.restore();
};


