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
    this.damagePos = config.damagePos || new Vect(320, 220, 0);
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
};

Enemy.prototype.drawBlackHole = function(ctx) {
    var centerX = 320;
    var centerY = 160;
    if (this.jitterEnabled) {
        centerX += Math.sin(this.timeCounter * 50) * 1.5;
        centerY += Math.cos(this.timeCounter * 60) * 1.5;
    }

    ctx.save();
    
    var time = this.timeCounter;
    
    // 0. Outer gravitational halo
    var haloGrad = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 130);
    haloGrad.addColorStop(0, "rgba(120, 0, 255, 0.12)");
    haloGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 130, 0, Math.PI * 2);
    ctx.fill();
    
    // 1. Accretion Disk / Photon Ring (Glow)
    var pulse = Math.sin(time * 3) * 10;
    var outerRadius = 80 + pulse;
    
    var gradient = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, outerRadius);
    gradient.addColorStop(0, "rgba(200, 50, 255, 0.9)");
    gradient.addColorStop(0.3, "rgba(50, 200, 255, 0.6)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Swirling matter (arcs)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 2;
    for (var i = 0; i < 5; i++) {
        ctx.beginPath();
        var angleOffset = time * 2 + (i * Math.PI * 2 / 5);
        ctx.arc(centerX, centerY, 45 + i * 8 + pulse/2, angleOffset, angleOffset + Math.PI * 0.7);
        ctx.stroke();
    }

    // 3. The Event Horizon (Pure Black Center)
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, Math.PI * 2);
    ctx.fill();

    // 4. Chromatic aberration / rim lighting
    ctx.strokeStyle = "rgba(255, 100, 255, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner glow ring
    ctx.strokeStyle = "rgba(100, 200, 255, 0.3)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
};

Enemy.prototype.drawSupermassiveBlackHole = function(ctx) {
    var centerX = 320;
    var centerY = 160;
    if (this.jitterEnabled) {
        centerX += Math.sin(this.timeCounter * 40) * 1.5;
        centerY += Math.cos(this.timeCounter * 50) * 1.5;
    }
    ctx.save();
    
    var time = this.timeCounter;
    
    // 0. Deep space distortion halo (outermost glow)
    var haloAlpha = (0.15 + Math.sin(time * 1.5) * 0.05).toFixed(2);
    var haloGrad = ctx.createRadialGradient(centerX, centerY, 60, centerX, centerY, 220);
    haloGrad.addColorStop(0, "rgba(100, 0, 200, " + haloAlpha + ")");
    haloGrad.addColorStop(0.5, "rgba(30, 0, 80, " + (haloAlpha * 0.5).toFixed(2) + ")");
    haloGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 220, 0, Math.PI * 2);
    ctx.fill();

    // 1. Relativistic Jets (Dual beams — top and bottom)
    var jetPulse = Math.sin(time * 8) * 0.2 + 0.8;
    var alpha1 = (0.6 * jetPulse).toFixed(2);
    
    // Top jet
    var jetGradTop = ctx.createLinearGradient(centerX, centerY, centerX, centerY - 200);
    jetGradTop.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    jetGradTop.addColorStop(0.3, "rgba(50, 200, 255, " + alpha1 + ")");
    jetGradTop.addColorStop(1, "rgba(0, 50, 200, 0)");
    ctx.fillStyle = jetGradTop;
    ctx.beginPath();
    ctx.moveTo(centerX - 3, centerY - 40);
    ctx.lineTo(centerX + 3, centerY - 40);
    ctx.lineTo(centerX + 18, centerY - 200);
    ctx.lineTo(centerX - 18, centerY - 200);
    ctx.fill();
    
    // Bottom jet
    var jetGradBot = ctx.createLinearGradient(centerX, centerY, centerX, centerY + 200);
    jetGradBot.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    jetGradBot.addColorStop(0.3, "rgba(50, 200, 255, " + alpha1 + ")");
    jetGradBot.addColorStop(1, "rgba(0, 50, 200, 0)");
    ctx.fillStyle = jetGradBot;
    ctx.beginPath();
    ctx.moveTo(centerX - 3, centerY + 40);
    ctx.lineTo(centerX + 3, centerY + 40);
    ctx.lineTo(centerX + 18, centerY + 200);
    ctx.lineTo(centerX - 18, centerY + 200);
    ctx.fill();

    // 2. Accretion Disk — Back half (behind the black hole)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(0.12);
    ctx.scale(1, 0.28);
    
    var diskRadius = 190 + Math.sin(time * 2) * 12;
    var diskGrad = ctx.createRadialGradient(0, 0, 35, 0, 0, diskRadius);
    diskGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    diskGrad.addColorStop(0.15, "rgba(255, 200, 80, 0.9)");
    diskGrad.addColorStop(0.35, "rgba(255, 100, 20, 0.7)");
    diskGrad.addColorStop(0.6, "rgba(150, 20, 0, 0.4)");
    diskGrad.addColorStop(0.85, "rgba(60, 0, 120, 0.15)");
    diskGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = diskGrad;
    ctx.beginPath();
    ctx.arc(0, 0, diskRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Swirling streaks in the disk
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "#FFA500";
    ctx.lineWidth = 2;
    for (var i = 0; i < 5; i++) {
        var aOff = time * 1.5 + (i * Math.PI * 2 / 5);
        var r1 = 50 + i * 20;
        ctx.beginPath();
        ctx.arc(0, 0, r1, aOff, aOff + Math.PI * 0.6);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // 3. Gravitational Lensing Arcs (light bending around the hole)
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = "#FFC864";
    ctx.lineWidth = 1.5;
    for (var i = 0; i < 4; i++) {
        var lensAngle = time * 0.8 + (i * Math.PI / 2);
        var lensR = 52 + i * 6;
        ctx.beginPath();
        ctx.arc(centerX, centerY, lensR, lensAngle, lensAngle + Math.PI * 0.4);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 4. The Event Horizon (Pure Black Center)
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 42, 0, Math.PI * 2);
    ctx.fill();

    // 5. Photon Sphere (Pulsating bright ring)
    var photonPulse = Math.sin(time * 6) * 0.15 + 0.85;
    var photonAlpha = photonPulse.toFixed(2);
    ctx.strokeStyle = "rgba(255, 220, 120, " + photonAlpha + ")";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 42, 0, Math.PI * 2);
    ctx.stroke();
    
    // Secondary photon ring
    ctx.strokeStyle = "rgba(255, 100, 50, 0.45)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 47, 0, Math.PI * 2);
    ctx.stroke();
    
    // Tertiary faint outer glow
    ctx.strokeStyle = "rgba(200, 50, 255, 0.2)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 54, 0, Math.PI * 2);
    ctx.stroke();

    // 6. Orbiting matter particles
    for (var i = 0; i < 8; i++) {
        var orbitAngle = time * (1.8 + i * 0.3) + (i * Math.PI / 4);
        var orbitR = 60 + i * 8;
        var px = centerX + Math.cos(orbitAngle) * orbitR;
        var py = centerY + Math.sin(orbitAngle) * orbitR * 0.28; // Flattened orbit
        var pSize = 1.5 + Math.sin(time * 3 + i) * 0.5;
        var pAlpha = (0.5 + Math.sin(time * 4 + i) * 0.3).toFixed(2);
        ctx.fillStyle = "rgba(255, 180, 80, " + pAlpha + ")";
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
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
    ctx.translate(320, 130);
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
    
    ctx.restore();
};


// ---- PHASE 2: OPHANIM (Intense) ----
Enemy.prototype.drawOphanim = function(ctx) {
    var time = this.timeCounter;
    ctx.save();
    ctx.translate(320, 140);
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
    
    // Furious divine pressure — dark edges
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(0, 0, 640, 480);
    
    ctx.translate(320, 150);
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
        // Phase 1: Lifesteal (Damage * 10)
        var healAmount = damageDealt * 10;
        this.curHP = Math.min(this.maxHP, this.curHP + healAmount);
        console.log("Seraphina healed for " + healAmount);
    } else if (this.renderType === "ophanim") {
        // Phase 2: Steal item (max 1 per phase)
        if (!this.hasStolenItem && typeof Inventory !== "undefined" && Inventory.getLength() > 0) {
            this.hasStolenItem = true;
            var randIdx = Math.floor(Math.random() * Inventory.getLength());
            Inventory.removeItem(randIdx);
            console.log("Seraphina stole an item!");
        }
    } else if (this.renderType === "throne") {
        // Phase 3: Divine Bleed (5 seconds of 1HP/sec)
        if (typeof Player !== "undefined" && Player.addBleed) {
            Player.addBleed(5.0);
        }
    }
};
