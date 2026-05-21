// enemy.js — Configurable Enemy class for LUNDERTALE
// Replaces the hardcoded Cenemy/Cenemy2/Cenemy3 from UGE with a single data-driven class

var Enemy = function(config) {
    // Identity
    this.name = config.name || "Unknown";
    this.checkText = config.checkText || "* Just a regular enemy.";

    // Stats
    this.maxHP = config.maxHP || 100;
    this.curHP = config.curHP || this.maxHP;
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
    this.phaseHP = config.phaseHP || null; // Array of HP per phase, e.g. [3600, 4200]
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
    this.spareable = false;
    this.mercyHP = config.mercyHP || 0;
    this.totalMercyHP = config.mercyHP || 0;

    // Rewards
    this.xpReward = config.xpReward || 0;
    this.goldReward = config.goldReward || 0;
    this.renderType = config.renderType || "sprite";
    this.timeCounter = 0; // used for animation
};

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
};

// Draw
Enemy.prototype.draw = function(ctx) {
    ctx.save();
    ctx.translate(370, 200);
    ctx.scale(1.25, 1.25);
    ctx.translate(-370, -200);
    
    if (this.renderType === "supermassive_blackhole") {
        this.drawSupermassiveBlackHole(ctx);
    } else if (this.renderType === "blackhole") {
        this.drawBlackHole(ctx);
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
    } else if (this.renderType === "sachiel") {
        this.drawSachiel(ctx);
    } else if (this.renderType === "sachiel_mutated") {
        this.drawSachielMutated(ctx);
    } else if (this.renderType === "sachiel_beast") {
        this.drawSachielBeast(ctx);
    } else if (this.renderType === "sachiel_angelic") {
        this.drawSachielAngelic(ctx);
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
    return this.speech[Math.floor(Math.random() * this.speech.length)];
};

// Get a random flavor text
Enemy.prototype.getRandomText = function() {
    return this.texts[Math.floor(Math.random() * this.texts.length)];
};

// Deal damage to this enemy
Enemy.prototype.dealDamage = function(damage) {
    this.curHP -= damage / this.defense;
    if (this.curHP <= 0) {
        if (this.phases && this.currentPhase < this.phases.length - 1) {
            this.currentPhase++;
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
    ctx.scale(1.35, 1.35);
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
    ctx.scale(1.35, 1.35);
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
    ctx.scale(1.35, 1.35);
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

// Hook called when the enemy successfully damages the player
Enemy.prototype.onHitPlayer = function(damageDealt) {
    // Only Seraphina has these brutal passives
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
        if (typeof Player !== "undefined" && Player.addBleed) {
            Player.addBleed(5.0);
        }
    } else if (this.renderType === "ramiel_morph" || this.renderType === "ramiel_berserk") {
        // AT Field Reflect: heal 30% of damage dealt
        var reflectHeal = Math.ceil(damageDealt * 0.3);
        this.curHP = Math.min(this.maxHP, this.curHP + reflectHeal);
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
    var cx = 370, cy = 170;

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
    var cy = 180 + Math.sin(time * 3) * 5; // Erratic floating
    var size = 60;
    
    ctx.save();

    // Glitch temporal glow
    var distAlpha = (0.3 + Math.sin(time * 10) * 0.2).toFixed(2);
    var distGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 140);
    distGrad.addColorStop(0, "rgba(255, 255, 255, " + distAlpha + ")");
    distGrad.addColorStop(0.5, "rgba(255, 0, 0, " + (distAlpha * 0.5) + ")");
    distGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = distGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 140, 0, Math.PI * 2);
    ctx.fill();

    // Shattered fragments
    var primaryColor = "rgba(255, 255, 255, 0.8)";
    ctx.strokeStyle = primaryColor;
    ctx.fillStyle = "rgba(20, 0, 0, 0.8)";
    ctx.lineWidth = 2;

    var frags = [
        {x: -size*0.8, y: -size*0.8, rot: time},
        {x: size*0.8, y: -size*0.8, rot: -time*1.2},
        {x: 0, y: -size*0.3, rot: time*0.5},
        {x: -size*0.8, y: size*0.8, rot: -time},
        {x: size*0.8, y: size*0.8, rot: time*1.5},
        {x: 0, y: size*0.3, rot: -time*0.8}
    ];

    for(var f=0; f<frags.length; f++) {
        var frag = frags[f];
        // Erradic movement
        var fx = cx + frag.x + Math.sin(time * 5 + f) * 10;
        var fy = cy + frag.y + Math.cos(time * 6 + f) * 10;
        
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(frag.rot);
        ctx.beginPath();
        ctx.moveTo(-15, -15);
        ctx.lineTo(20, -5);
        ctx.lineTo(5, 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    // Chaotic sand particles in all directions
    ctx.fillStyle = "rgba(255, 200, 50, 0.8)";
    for(var i=0; i<40; i++) {
        var angle = i * Math.PI * 2 / 40 + time;
        var r = (time * 50 + i * 15) % 120;
        var px = cx + Math.cos(angle) * r;
        var py = cy + Math.sin(angle) * r;
        
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI*2);
        ctx.fill();
    }

    // Multiple erratic eyes
    for(var e=0; e<3; e++) {
        var eyeX = cx + Math.cos(time * 2 + e * 2) * 30;
        var eyeY = cy + Math.sin(time * 3 + e * 2) * 30;
        
        var eyeBlink = Math.sin(time * (5+e)) > 0.5 ? 0.1 : 1.0;
        ctx.fillStyle = "rgba(255, 0, 0, 0.9)";
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, 8, 3 * eyeBlink, time*e, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 1.5 * eyeBlink, 0, Math.PI * 2);
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

    // 1. Torso (Dark purplish, glossy, severely emaciated waist)
    var torsoGrad = ctx.createLinearGradient(0, bossY - 40, 0, bossY + 200);
    torsoGrad.addColorStop(0, "#2c2738");
    torsoGrad.addColorStop(0.3, "#1a1625");
    torsoGrad.addColorStop(0.8, "#0e0c14");
    ctx.fillStyle = torsoGrad;
    
    ctx.beginPath();
    // Neck/Top
    ctx.moveTo(bossX - 40, bossY - 30 + breatheY);
    ctx.quadraticCurveTo(bossX, bossY - 45 + breatheY, bossX + 40, bossY - 30 + breatheY);
    // Right shoulder width
    ctx.quadraticCurveTo(bossX + 90, bossY + 20 + breatheY, bossX + 60, bossY + 60 + breatheY);
    // Emaciated Right Waist
    ctx.bezierCurveTo(bossX + 20, bossY + 120 + breatheY, bossX + 15, bossY + 160 + breatheY, bossX + 35, bossY + 200 + breatheY);
    // Hips/Bottom
    ctx.lineTo(bossX - 35, bossY + 200 + breatheY);
    // Emaciated Left Waist
    ctx.bezierCurveTo(bossX - 15, bossY + 160 + breatheY, bossX - 20, bossY + 120 + breatheY, bossX - 60, bossY + 60 + breatheY);
    // Left shoulder width
    ctx.quadraticCurveTo(bossX - 90, bossY + 20 + breatheY, bossX - 40, bossY - 30 + breatheY);
    ctx.fill();
    
    // Glossy skin highlights (muscles stretching to the waist)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    for(var sl=0; sl<4; sl++) {
        ctx.beginPath();
        // Left side muscles
        ctx.moveTo(bossX - 30 + sl*5, bossY - 20 + breatheY);
        ctx.quadraticCurveTo(bossX - 50 + sl*10, bossY + 50 + breatheY, bossX - 10, bossY + 140 + breatheY);
        ctx.stroke();
        // Right side muscles
        ctx.beginPath();
        ctx.moveTo(bossX + 30 - sl*5, bossY - 20 + breatheY);
        ctx.quadraticCurveTo(bossX + 50 - sl*10, bossY + 50 + breatheY, bossX + 10, bossY + 140 + breatheY);
        ctx.stroke();
    }
    
    // Internal rib structures showing through skin at waist
    ctx.strokeStyle = "rgba(100, 90, 110, 0.3)";
    ctx.lineWidth = 4;
    for(var r=0; r<4; r++) {
        ctx.beginPath(); ctx.moveTo(bossX - 10, bossY + 110 + r*15 + breatheY); ctx.lineTo(bossX - 25, bossY + 105 + r*15 + breatheY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bossX + 10, bossY + 110 + r*15 + breatheY); ctx.lineTo(bossX + 25, bossY + 105 + r*15 + breatheY); ctx.stroke();
    }

    // 2. Arms (Impossibly thin, hanging from behind the shoulder pads)
    ctx.fillStyle = "#110f18";
    // Left Arm
    ctx.beginPath();
    ctx.moveTo(bossX - 100, bossY + 40 + shoulderY);
    ctx.quadraticCurveTo(bossX - 120, bossY + 100, bossX - 105, bossY + 220);
    ctx.lineTo(bossX - 90, bossY + 220);
    ctx.quadraticCurveTo(bossX - 100, bossY + 100, bossX - 85, bossY + 40 + shoulderY);
    ctx.fill();
    // Right Arm
    ctx.beginPath();
    ctx.moveTo(bossX + 100, bossY + 40 + shoulderY);
    ctx.quadraticCurveTo(bossX + 120, bossY + 100, bossX + 105, bossY + 220);
    ctx.lineTo(bossX + 90, bossY + 220);
    ctx.quadraticCurveTo(bossX + 100, bossY + 100, bossX + 85, bossY + 40 + shoulderY);
    ctx.fill();

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

    // 6. Three Bird Masks
    // Left small mask
    drawBirdMask(ctx, bossX - 25, bossY - 5 + breatheY, 0.7, -0.3);
    // Right small mask
    drawBirdMask(ctx, bossX + 35, bossY + 25 + breatheY, 0.8, 0.2);
    // Center large mask
    drawBirdMask(ctx, bossX, bossY + 10 + breatheY, 1.2, 0);

    // 7. Core Particles
    if (!this.sachielParticles) this.sachielParticles = [];
    if (Math.random() < 0.5) {
        this.sachielParticles.push({
            x: coreX + (Math.random()-0.5)*25,
            y: coreY + (Math.random()-0.5)*25,
            vx: (Math.random()-0.5)*40,
            vy: (Math.random()-0.5)*40 - 20,
            life: 1.0,
            size: Math.random()*3 + 1
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
    
    // --- Torso (asymmetric, swollen right side) ---
    ctx.fillStyle = "#2a1a15";
    ctx.beginPath();
    ctx.moveTo(-38, -10);
    ctx.quadraticCurveTo(-42, 40 + breathe, -30, 90);
    ctx.lineTo(35, 90);
    ctx.quadraticCurveTo(50 + Math.sin(time*3)*5, 40 + breathe, 42, -10);
    ctx.closePath();
    ctx.fill();
    
    // Pulsating dark veins
    ctx.strokeStyle = "rgba(150, 0, 50, 0.8)";
    ctx.lineWidth = 1.5;
    for (var v = 0; v < 8; v++) {
        var vx = -30 + v * 9;
        ctx.beginPath();
        ctx.moveTo(vx, -5 + Math.sin(v) * 5);
        for (var s = 0; s < 5; s++) {
            ctx.lineTo(vx + Math.sin(time * 4 + s * 2 + v) * 8, s * 18 + 5);
        }
        ctx.stroke();
    }
    
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
