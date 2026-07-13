// billPatterns.js â€” 21 Unique Bill Cipher themed patterns for LUNDERTALE

// Helper function to draw warning lines or simple shapes if needed
var billParticles = [];
function updateBillParticles(dt) {
    for (var i = billParticles.length - 1; i >= 0; i--) {
        var p = billParticles[i];
        p.vx += (p.ax || 0) * dt;
        p.vy += (p.ay || 0) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle = (p.angle || 0) + (p.rotSpeed || 0) * dt;
        p.life -= dt;
        if (p.life <= 0) {
            billParticles.splice(i, 1);
        }
    }
}
function drawBillParticles(ctx) {
    ctx.save();
    for (var i = 0; i < billParticles.length; i++) {
        var p = billParticles[i];
        var alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle || 0);
        ctx.globalAlpha = alpha * (p.alphaScale !== undefined ? p.alphaScale : 1.0);
        
        ctx.fillStyle = p.color || "#00FFFF";
        ctx.shadowBlur = (p.glow || 8) * alpha;
        ctx.shadowColor = p.color || "#00FFFF";
        
        var size = p.size * (p.shrink ? alpha : 1.0);
        
        if (p.type === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(0, -size / 2);
            ctx.lineTo(size / 2, size / 2);
            ctx.lineTo(-size / 2, size / 2);
            ctx.closePath();
            ctx.fill();
        } else if (p.type === 'star') {
            ctx.beginPath();
            for (var j = 0; j < 5; j++) {
                var angle = (Math.PI * 2 / 5) * j - Math.PI / 2;
                ctx.lineTo(Math.cos(angle) * size / 2, Math.sin(angle) * size / 2);
                var angle2 = angle + Math.PI / 5;
                ctx.lineTo(Math.cos(angle2) * size / 4, Math.sin(angle2) * size / 4);
            }
            ctx.closePath();
            ctx.fill();
        } else if (p.type === 'fire') {
            ctx.fillStyle = p.color || "#FF4500";
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.quadraticCurveTo(size / 2, -size / 2, size / 4, size / 2);
            ctx.lineTo(-size / 4, size / 2);
            ctx.quadraticCurveTo(-size / 2, -size / 2, 0, -size);
            ctx.closePath();
            ctx.fill();
        } else if (p.type === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'glyph') {
            ctx.font = "bold " + Math.round(size) + "px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            var glyphs = ["?", "★", "★", "▲", "▼", "◆", "X", "O", "★", "★"];
            var glyph = p.glyphChar || glyphs[Math.floor(p.seed || 0) % glyphs.length];
            ctx.fillText(glyph, 0, 0);
        } else {
            ctx.fillRect(-size/2, -size/2, size, size);
        }
        ctx.restore();
    }
    ctx.restore();
}
function spawnBillParticle(x, y, vx, vy, size, life, color, glow, config) {
    config = config || {};
    billParticles.push({
        x: x, y: y,
        vx: vx, vy: vy,
        ax: config.ax || 0,
        ay: config.ay || 0,
        size: size,
        life: life,
        maxLife: life,
        color: color,
        glow: glow,
        type: config.type || 'spark',
        angle: config.angle || Math.random() * Math.PI * 2,
        rotSpeed: config.rotSpeed || (Math.random() - 0.5) * 4,
        alphaScale: config.alphaScale !== undefined ? config.alphaScale : 1.0,
        shrink: config.shrink !== undefined ? config.shrink : true,
        glyphChar: config.glyphChar || null,
        seed: Math.random() * 100
    });
}

// ==========================================
// PHASE 1 PATTERNS (Yellow / Classic)
// ==========================================

// 1. billEyeLasers: Blinking lasers that sweep across the box
var BillEyeLasersPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.laserTimer = 0;
    this.damVal = config.damVal || 8;
    this.lasers = []; // { x, angle, targetAngle, speed, warning, active }
};
BillEyeLasersPattern.prototype = Object.create(BulletPattern.prototype);
BillEyeLasersPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.laserTimer = 0.5;
    this.lasers = [];
    billParticles = [];
};
BillEyeLasersPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.laserTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    if (this.laserTimer >= 1.4 && this.elapsed < this.duration - 1.5) {
        this.laserTimer = 0;
        var cx = (bb[0] + bb[2]) / 2;
        var startAngle = Math.PI / 4 + Math.random() * Math.PI / 2; // facing down-ish
        var targetAngle = startAngle + (Math.random() > 0.5 ? 0.8 : -0.8);
        this.lasers.push({
            x: cx,
            y: bb[1] - 15,
            angle: startAngle,
            targetAngle: targetAngle,
            warning: 0.9,
            active: 0.7,
            speed: (targetAngle - startAngle) / 0.7
        });
        Sound.playSound("laser", true);
    }
    
    for (var i = this.lasers.length - 1; i >= 0; i--) {
        var l = this.lasers[i];
        if (l.warning > 0) {
            l.warning -= dt;
        } else if (l.active > 0) {
            l.active -= dt;
            l.angle += l.speed * dt;
            if (Math.random() < 0.35) {
                var len = 100 + Math.random() * 200;
                var lx = l.x + Math.cos(l.angle) * len;
                var ly = l.y + Math.sin(l.angle) * len;
                spawnBillParticle(lx, ly, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, 6 + Math.random() * 4, 0.6, "#FFFF00", 10, {
                    type: Math.random() > 0.45 ? 'triangle' : 'star',
                    ay: 90,
                    rotSpeed: (Math.random() - 0.5) * 6
                });
            }
            if (l.active <= 0) {
                this.lasers.splice(i, 1);
            }
        }
    }
};
BillEyeLasersPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.warning <= 0 && l.active > 0) {
            // Distance from player center to line: d = |(y2-y1)*x0 - (x2-x1)*y0 + x2*y1 - y2*x1| / L
            var x2 = l.x + Math.cos(l.angle) * 500;
            var y2 = l.y + Math.sin(l.angle) * 500;
            var num = Math.abs((y2 - l.y)*scx - (x2 - l.x)*scy + x2*l.y - y2*l.x);
            var den = Math.sqrt(Math.pow(y2 - l.y, 2) + Math.pow(x2 - l.x, 2));
            var dist = num / (den || 1);
            if (dist < 12) return this.damVal;
        }
    }
    return 0;
};
BillEyeLasersPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        var x2 = l.x + Math.cos(l.angle) * 600;
        var y2 = l.y + Math.sin(l.angle) * 600;
        
        if (l.warning > 0) {
            ctx.save();
            ctx.strokeStyle = "rgba(255, 0, 0, 0.4)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(l.x, l.y);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.restore();
        } else if (l.active > 0) {
            ctx.save();
            ctx.strokeStyle = "#FFFF00";
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#FFD700";
            ctx.lineWidth = 14 * (l.active / 0.7);
            ctx.beginPath();
            ctx.moveTo(l.x, l.y);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 4 * (l.active / 0.7);
            ctx.stroke();
            ctx.restore();
        }
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillEyeLasersPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.lasers.length === 0;
};

// 2. billCipherWheel: Zodiac Wheel Attack â€” 10 cipher wheel symbols orbit and fire laser beams
var BillCipherWheelPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 9.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.wheelAngle = 0;
    this.wheelRadius = 0;
    this.symbols = []; // { index, angle, glowing, fireTimer, laserActive, laserAlpha }
    this.activeSymbol = -1;
    this.switchTimer = 0;
    this.switchInterval = 0.7;
    this.laserWarning = 0.45;
    this.laserDuration = 0.35;
};
BillCipherWheelPattern.prototype = Object.create(BulletPattern.prototype);
BillCipherWheelPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.wheelAngle = 0;
    billParticles = [];
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];
    this.wheelRadius = Math.min(boxW, boxH) * 0.42;
    this.symbols = [];
    var names = ["star", "crescent", "hand", "glasses", "icebag", "llama", "shootingstar", "heart", "pinetree", "question"];
    for (var i = 0; i < 10; i++) {
        this.symbols.push({
            index: i,
            name: names[i],
            baseAngle: (Math.PI * 2 / 10) * i,
            glowing: false,
            fireTimer: 0,
            laserActive: 0,
            laserAlpha: 0
        });
    }
    this.activeSymbol = -1;
    this.switchTimer = 0.3;
};
BillCipherWheelPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    // Slowly rotate the whole wheel
    this.wheelAngle += 0.35 * dt;
    // Handle symbol activation cycle
    if (this.elapsed < this.duration - 1.5) {
        this.switchTimer -= dt;
        if (this.switchTimer <= 0) {
            this.switchTimer = this.switchInterval;
            // Pick a new symbol to activate (avoid same twice in a row)
            var prev = this.activeSymbol;
            var tries = 0;
            do {
                this.activeSymbol = Math.floor(Math.random() * 10);
                tries++;
            } while (this.activeSymbol === prev && tries < 5);
            var sym = this.symbols[this.activeSymbol];
            sym.glowing = true;
            sym.fireTimer = this.laserWarning;
            sym.laserActive = 0;
            sym.laserAlpha = 1.0;
            Sound.playSound("ting", true);
        }
    }
    // Update each symbol
    for (var i = 0; i < this.symbols.length; i++) {
        var s = this.symbols[i];
        if (s.glowing) {
            if (s.fireTimer > 0) {
                s.fireTimer -= dt;
                if (s.fireTimer <= 0) {
                    // Fire the laser
                    s.laserActive = this.laserDuration;
                    Sound.playSound("laser", true);
                    if (typeof triggerShake !== "undefined") triggerShake(3, 80);
                    // Spawn particles at symbol position
                    var sAngle = s.baseAngle + this.wheelAngle;
                    var sx = cx + Math.cos(sAngle) * this.wheelRadius;
                    var sy = cy + Math.sin(sAngle) * this.wheelRadius;
                    for (var p = 0; p < 6; p++) {
                        spawnBillParticle(sx, sy, (Math.random() - 0.5) * 75, (Math.random() - 0.5) * 75, 9 + Math.random() * 5, 0.7, "#FF3333", 12, {
                            type: 'glyph',
                            rotSpeed: (Math.random() - 0.5) * 4
                        });
                    }
                }
            } else if (s.laserActive > 0) {
                s.laserActive -= dt;
                s.laserAlpha = s.laserActive / this.laserDuration;
                if (s.laserActive <= 0) {
                    s.glowing = false;
                    s.laserAlpha = 0;
                }
            }
        }
    }
    // Ambient particles along the wheel rim
    if (this.elapsed < this.duration - 1.0 && Math.random() < 0.4) {
        var rAngle = Math.random() * Math.PI * 2;
        var rx = cx + Math.cos(rAngle) * this.wheelRadius;
        var ry = cy + Math.sin(rAngle) * this.wheelRadius;
        spawnBillParticle(rx, ry, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, 5 + Math.random() * 4, 0.8, "#00FFFF", 6, {
            type: 'star',
            rotSpeed: (Math.random() - 0.5) * 3
        });
    }
};
BillCipherWheelPattern.prototype._drawSymbol = function(ctx, name, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.lineWidth = 2;
    var s = size;
    if (name === "star") {
        // Six-pointed star
        ctx.beginPath();
        for (var i = 0; i < 6; i++) {
            var a = (Math.PI * 2 / 6) * i - Math.PI / 2;
            var r = (i % 2 === 0) ? s : s * 0.45;
            if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else if (name === "crescent") {
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.8, 0.4, Math.PI * 2 - 0.4);
        ctx.arc(-s * 0.3, 0, s * 0.55, Math.PI * 2 - 0.6, 0.6, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else if (name === "hand") {
        // Open hand / fist icon (simplified)
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, s * 0.3);
        ctx.lineTo(-s * 0.5, -s * 0.1);
        ctx.lineTo(-s * 0.3, -s * 0.6);
        ctx.lineTo(-s * 0.1, -s * 0.7);
        ctx.lineTo(0, -s * 0.5);
        ctx.lineTo(s * 0.1, -s * 0.75);
        ctx.lineTo(s * 0.25, -s * 0.55);
        ctx.lineTo(s * 0.35, -s * 0.7);
        ctx.lineTo(s * 0.5, -s * 0.45);
        ctx.lineTo(s * 0.5, s * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else if (name === "glasses") {
        // Spectacles
        ctx.beginPath();
        ctx.arc(-s * 0.35, 0, s * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(s * 0.35, 0, s * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-s * 0.05, 0);
        ctx.lineTo(s * 0.05, 0);
        ctx.stroke();
    } else if (name === "icebag") {
        // Bag shape
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, -s * 0.5);
        ctx.lineTo(s * 0.3, -s * 0.5);
        ctx.lineTo(s * 0.45, s * 0.5);
        ctx.lineTo(-s * 0.45, s * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Tie at top
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.5);
        ctx.lineTo(0, -s * 0.7);
        ctx.stroke();
    } else if (name === "llama") {
        // Simplified llama head
        ctx.beginPath();
        ctx.moveTo(-s * 0.2, s * 0.4);
        ctx.lineTo(-s * 0.3, -s * 0.1);
        ctx.lineTo(-s * 0.35, -s * 0.65);
        ctx.lineTo(-s * 0.15, -s * 0.45);
        ctx.lineTo(0, -s * 0.2);
        ctx.lineTo(s * 0.15, -s * 0.45);
        ctx.lineTo(s * 0.35, -s * 0.65);
        ctx.lineTo(s * 0.3, -s * 0.1);
        ctx.lineTo(s * 0.2, s * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else if (name === "shootingstar") {
        // Star with trail
        ctx.beginPath();
        for (var i = 0; i < 5; i++) {
            var a = (Math.PI * 2 / 5) * i - Math.PI / 2;
            var r = (i % 2 === 0) ? s * 0.55 : s * 0.25;
            if (i === 0) ctx.moveTo(Math.cos(a) * r + s * 0.15, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r + s * 0.15, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Trail
        ctx.beginPath();
        ctx.moveTo(-s * 0.1, s * 0.1);
        ctx.lineTo(-s * 0.7, s * 0.35);
        ctx.stroke();
    } else if (name === "heart") {
        // Stitched heart
        ctx.beginPath();
        ctx.moveTo(0, s * 0.5);
        ctx.bezierCurveTo(-s * 0.6, s * 0.1, -s * 0.6, -s * 0.5, 0, -s * 0.2);
        ctx.bezierCurveTo(s * 0.6, -s * 0.5, s * 0.6, s * 0.1, 0, s * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Stitch line
        ctx.beginPath();
        ctx.setLineDash([2, 3]);
        ctx.moveTo(0, -s * 0.3);
        ctx.lineTo(0, s * 0.45);
        ctx.stroke();
        ctx.setLineDash([]);
    } else if (name === "pinetree") {
        // Pine tree
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.7);
        ctx.lineTo(s * 0.45, s * 0.3);
        ctx.lineTo(-s * 0.45, s * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Trunk
        ctx.fillRect(-s * 0.1, s * 0.3, s * 0.2, s * 0.25);
    } else if (name === "question") {
        // Question mark
        ctx.font = "bold " + Math.round(s * 1.4) + "px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", 0, 0);
        ctx.strokeText("?", 0, 0);
    }
    ctx.restore();
};
BillCipherWheelPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    for (var i = 0; i < this.symbols.length; i++) {
        var s = this.symbols[i];
        if (s.laserActive > 0) {
            // Laser goes from symbol position toward center and beyond
            var sAngle = s.baseAngle + this.wheelAngle;
            var sx1 = cx + Math.cos(sAngle) * 400;
            var sy1 = cy + Math.sin(sAngle) * 400;
            var sx2 = cx - Math.cos(sAngle) * 400;
            var sy2 = cy - Math.sin(sAngle) * 400;
            // Distance from player center to the laser line
            var num = Math.abs((sy2 - sy1) * scx - (sx2 - sx1) * scy + sx2 * sy1 - sy2 * sx1);
            var den = Math.sqrt(Math.pow(sy2 - sy1, 2) + Math.pow(sx2 - sx1, 2));
            var dist = num / (den || 1);
            if (dist < 10 + sw * 0.3) {
                return this.damVal;
            }
        }
        // Also check collision with the symbol orbs themselves
        var symAngle = s.baseAngle + this.wheelAngle;
        var symX = cx + Math.cos(symAngle) * this.wheelRadius;
        var symY = cy + Math.sin(symAngle) * this.wheelRadius;
        var distToSym = Math.sqrt(Math.pow(scx - symX, 2) + Math.pow(scy - symY, 2));
        if (distToSym < 10 + sw * 0.3) {
            return Math.max(1, Math.floor(this.damVal * 0.5));
        }
    }
    return 0;
};
BillCipherWheelPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    var r = this.wheelRadius;
    ctx.save();
    // Draw faint cipher wheel background â€” outer ring
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 12, 0, Math.PI * 2);
    ctx.stroke();
    // Spoke lines for each symbol slot
    for (var i = 0; i < 10; i++) {
        var a = (Math.PI * 2 / 10) * i + this.wheelAngle;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (r - 12), cy + Math.sin(a) * (r - 12));
        ctx.lineTo(cx + Math.cos(a) * (r + 12), cy + Math.sin(a) * (r + 12));
        ctx.stroke();
    }
    // Central eye triangle (Bill's form)
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 18);
    ctx.lineTo(cx + 16, cy + 12);
    ctx.lineTo(cx - 16, cy + 12);
    ctx.closePath();
    ctx.stroke();
    // Eye circle
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // Draw active cipher wheel ring with glow
    ctx.save();
    ctx.strokeStyle = "rgba(0, 255, 255, 0.2)";
    ctx.shadowBlur = 6;
    ctx.shadowColor = "#00FFFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // Draw laser beams (behind symbols)
    for (var i = 0; i < this.symbols.length; i++) {
        var s = this.symbols[i];
        var sAngle = s.baseAngle + this.wheelAngle;
        var sx = cx + Math.cos(sAngle) * r;
        var sy = cy + Math.sin(sAngle) * r;
        if (s.glowing && s.fireTimer > 0) {
            // Warning line: thin red dashed line from symbol through center and beyond
            ctx.save();
            ctx.strokeStyle = "rgba(255, 0, 0, " + (0.3 + 0.3 * Math.sin(this.elapsed * 20)) + ")";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 6]);
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(sAngle) * 400, cy + Math.sin(sAngle) * 400);
            ctx.lineTo(cx - Math.cos(sAngle) * 400, cy - Math.sin(sAngle) * 400);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        } else if (s.laserActive > 0) {
            // Active laser beam covering the full box width/height
            var startX = cx + Math.cos(sAngle) * 400;
            var startY = cy + Math.sin(sAngle) * 400;
            var endX = cx - Math.cos(sAngle) * 400;
            var endY = cy - Math.sin(sAngle) * 400;
            var alpha = s.laserAlpha;
            ctx.save();
            ctx.strokeStyle = "rgba(255, 50, 50, " + alpha + ")";
            ctx.shadowBlur = 14;
            ctx.shadowColor = "#FF0000";
            ctx.lineWidth = 12 * alpha;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            // White core
            ctx.strokeStyle = "rgba(255, 255, 255, " + (alpha * 0.8) + ")";
            ctx.lineWidth = 4 * alpha;
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.restore();
        }
    }
    // Draw symbols on the wheel
    for (var i = 0; i < this.symbols.length; i++) {
        var s = this.symbols[i];
        var sAngle = s.baseAngle + this.wheelAngle;
        var sx = cx + Math.cos(sAngle) * r;
        var sy = cy + Math.sin(sAngle) * r;
        ctx.save();
        if (s.glowing) {
            ctx.fillStyle = "#FF3333";
            ctx.strokeStyle = "#FF6666";
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#FF0000";
        } else {
            ctx.fillStyle = "#00DDDD";
            ctx.strokeStyle = "#00FFFF";
            ctx.shadowBlur = 6;
            ctx.shadowColor = "#00FFFF";
        }
        // Draw a small circle backdrop behind symbol
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(sx, sy, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        this._drawSymbol(ctx, s.name, sx, sy, 9);
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillCipherWheelPattern.prototype.isOver = function() {
    if (this.elapsed < this.duration) return false;
    for (var i = 0; i < this.symbols.length; i++) {
        if (this.symbols[i].laserActive > 0) return false;
    }
    return true;
};

// 3. billDealBlueFire: Spawn warning zones, followed by blue fire walls closing in
var BillDealBlueFirePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
    this.fires = []; // { x, y, warning, active, vx, vy }
};
BillDealBlueFirePattern.prototype = Object.create(BulletPattern.prototype);
BillDealBlueFirePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.fires = [];
    billParticles = [];
};
BillDealBlueFirePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 0.85 && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        // Spawn from edges targeting player
        if (typeof Soul !== "undefined") {
            var sPos = Soul.getPos();
            var px = sPos.x + Soul.getWidth()/2;
            var py = sPos.y + Soul.getHeight()/2;
            
            var side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
            var sx, sy;
            if (side === 0) { sx = bb[0] + Math.random() * (bb[2] - bb[0]); sy = bb[1] - 10; }
            else if (side === 1) { sx = bb[2] + 10; sy = bb[1] + Math.random() * (bb[3] - bb[1]); }
            else if (side === 2) { sx = bb[0] + Math.random() * (bb[2] - bb[0]); sy = bb[3] + 10; }
            else { sx = bb[0] - 10; sy = bb[1] + Math.random() * (bb[3] - bb[1]); }
            
            var angle = Math.atan2(py - sy, px - sx);
            
            this.fires.push({
                x: sx,
                y: sy,
                vx: Math.cos(angle) * 110,
                vy: Math.sin(angle) * 110,
                warning: 0.6,
                active: 1.8
            });
            Sound.playSound("laser", true);
        }
    }
    
    for (var i = this.fires.length - 1; i >= 0; i--) {
        var f = this.fires[i];
        if (f.warning > 0) {
            f.warning -= dt;
        } else {
            f.active -= dt;
            f.x += f.vx * dt;
            f.y += f.vy * dt;
            if (Math.random() < 0.35) {
                spawnBillParticle(f.x, f.y, (Math.random() - 0.5) * 20, -10 - Math.random() * 30, 8 + Math.random() * 6, 0.6, "#00BFFF", 8, {
                    type: 'fire',
                    ay: -25,
                    rotSpeed: (Math.random() - 0.5) * 2
                });
            }
            if (f.active <= 0 || f.x < bb[0] - 30 || f.x > bb[2] + 30 || f.y < bb[1] - 30 || f.y > bb[3] + 30) {
                this.fires.splice(i, 1);
            }
        }
    }
};
BillDealBlueFirePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    for (var i = 0; i < this.fires.length; i++) {
        var f = this.fires[i];
        if (f.warning <= 0) {
            var dist = Math.sqrt(Math.pow(scx - f.x, 2) + Math.pow(scy - f.y, 2));
            if (dist < 12 + sw/2) return this.damVal;
        }
    }
    return 0;
};
BillDealBlueFirePattern.prototype.draw = function(ctx) {
    ctx.save();
    var time = Date.now() / 1000;
    for (var i = 0; i < this.fires.length; i++) {
        var f = this.fires[i];
        ctx.save();
        if (f.warning > 0) {
            ctx.fillStyle = "rgba(0, 191, 255, 0.2)";
            ctx.beginPath();
            ctx.arc(f.x, f.y, 14, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#00BFFF";
            ctx.fillStyle = "#1E90FF";
            
            // Draw a flame shape
            ctx.beginPath();
            var size = 10 + Math.sin(time * 20) * 2;
            ctx.arc(f.x, f.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.arc(f.x, f.y, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillDealBlueFirePattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.fires.length === 0;
};

// 4. billHatDrop: Yellow-bordered black hats dropping from ceiling
var BillHatDropPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
};
BillHatDropPattern.prototype = Object.create(BulletPattern.prototype);
BillHatDropPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    billParticles = [];
};
BillHatDropPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 0.50 && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        var rx = bb[0] + 15 + Math.random() * (bb[2] - bb[0] - 30);
        this.bullets.push({
            x: rx,
            y: bb[1] - 15,
            vy: 110,
            width: 24,
            height: 18,
            bounced: false,
            active: true
        });
        Sound.playSound("hit_1", true);
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.y += b.vy * dt;
        
        // Bounce once on floor
        if (!b.bounced && b.y >= bb[3] - 12) {
            b.y = bb[3] - 12;
            b.vy = -70; // Bounce up
            b.bounced = true;
            Sound.playSound("ting", true);
            for (var p = 0; p < 8; p++) {
                spawnBillParticle(b.x, b.y, (Math.random() - 0.5) * 80, -30 - Math.random() * 60, 6 + Math.random() * 4, 0.5, "#FFFF00", 8, {
                    type: 'star',
                    ay: 100,
                    rotSpeed: (Math.random() - 0.5) * 8
                });
            }
        } else if (b.bounced && b.vy < 0 && b.y <= bb[3] - 45) {
            b.vy = 100; // Drop down again
        } else if (b.bounced && b.y > bb[3] + 15) {
            this.bullets.splice(i, 1);
        }
    }
};
BillHatDropPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.fillStyle = "#000000";
        ctx.strokeStyle = "#FFFF00";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#FFFF00";
        
        // Draw top hat
        ctx.fillRect(-10, -6, 20, 10);
        ctx.strokeRect(-10, -6, 20, 10);
        
        // Brim
        ctx.fillRect(-14, 4, 28, 3);
        ctx.strokeRect(-14, 4, 28, 3);
        
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillHatDropPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 5. billCaneSwack: A cane sweeps/swacks the player horizontally
var BillCaneSwackPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.swackTimer = 0;
    this.damVal = config.damVal || 8;
    this.canes = []; // { x, y, width, height, vx, dir, active, angle }
};
BillCaneSwackPattern.prototype = Object.create(BulletPattern.prototype);
BillCaneSwackPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.swackTimer = 0.5;
    this.canes = [];
    billParticles = [];
};
BillCaneSwackPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.swackTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    if (this.swackTimer >= 1.6 && this.elapsed < this.duration - 1.5) {
        this.swackTimer = 0;
        var side = Math.random() > 0.5; // Left to right or right to left
        var ry = bb[1] + 20 + Math.random() * (bb[3] - bb[1] - 40);
        this.canes.push({
            x: side ? bb[0] - 20 : bb[2] + 20,
            y: ry,
            w: 80,
            h: 8,
            vx: side ? 160 : -160,
            angle: side ? 0.3 : -0.3,
            rotSpeed: side ? 3 : -3,
            active: true
        });
        Sound.playSound("laser", true);
    }
    
    for (var i = this.canes.length - 1; i >= 0; i--) {
        var c = this.canes[i];
        c.x += c.vx * dt;
        c.angle += c.rotSpeed * dt;
        if (Math.random() < 0.2) {
            spawnBillParticle(c.x, c.y, -c.vx * 0.1, (Math.random() - 0.5) * 20, 2, 0.25, "#FFFF00", 5);
        }
        if (c.x < bb[0] - 100 || c.x > bb[2] + 100) {
            this.canes.splice(i, 1);
        }
    }
};
BillCaneSwackPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    for (var i = 0; i < this.canes.length; i++) {
        var c = this.canes[i];
        var dist = Math.sqrt(Math.pow(scx - c.x, 2) + Math.pow(scy - c.y, 2));
        // Simple bounding circle check for rotating cane
        if (dist < 35 + sw/2) return this.damVal;
    }
    return 0;
};
BillCaneSwackPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.canes.length; i++) {
        var c = this.canes[i];
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.angle);
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FFFF00";
        ctx.fillStyle = "#000000";
        ctx.strokeStyle = "#FFFF00";
        ctx.lineWidth = 2;
        
        // Draw cane hook
        ctx.fillRect(-25, -2, 50, 4);
        ctx.strokeRect(-25, -2, 50, 4);
        
        ctx.beginPath();
        ctx.arc(23, -6, 6, 0, Math.PI, true);
        ctx.stroke();
        
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillCaneSwackPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.canes.length === 0;
};

// 6. billTriangleBeams: Triangles expanding from center
var BillTriangleBeamsPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
    this.triangles = []; // { cx, cy, size, maxScale, scaleSpeed, rot, rotSpeed, active }
};
BillTriangleBeamsPattern.prototype = Object.create(BulletPattern.prototype);
BillTriangleBeamsPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.triangles = [];
    billParticles = [];
};
BillTriangleBeamsPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    if (this.spawnTimer >= 1.3 && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        this.triangles.push({
            x: cx,
            y: cy,
            size: 5,
            maxScale: 250,
            scaleSpeed: 150,
            rot: Math.random() * Math.PI,
            rotSpeed: 0.7,
            active: true,
            lifetime: 0
        });
        Sound.playSound("laser", true);
    }
    
    for (var i = this.triangles.length - 1; i >= 0; i--) {
        var t = this.triangles[i];
        t.size += t.scaleSpeed * dt;
        t.rot += t.rotSpeed * dt;
        t.lifetime += dt;
        // Remove when expanded past max OR hard timeout after 2.5s
        if (t.size >= t.maxScale || t.lifetime >= 2.5) {
            this.triangles.splice(i, 1);
        }
    }
};
BillTriangleBeamsPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    for (var i = 0; i < this.triangles.length; i++) {
        var t = this.triangles[i];
        // Collision if player touches the expanding border of the triangle
        var dist = Math.sqrt(Math.pow(scx - t.x, 2) + Math.pow(scy - t.y, 2));
        var thickness = 10;
        if (Math.abs(dist - t.size * 0.7) < thickness && t.size > 20) {
            return this.damVal;
        }
    }
    return 0;
};
BillTriangleBeamsPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.triangles.length; i++) {
        var t = this.triangles[i];
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.rot);
        ctx.strokeStyle = "#FFFF00";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FFFF00";
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        // Equilateral triangle coordinates
        ctx.moveTo(0, -t.size);
        ctx.lineTo(t.size * 0.86, t.size * 0.5);
        ctx.lineTo(-t.size * 0.86, t.size * 0.5);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillTriangleBeamsPattern.prototype.isOver = function() {
    // Safety: hard timeout after duration + 5s even if triangles remain
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.triangles.length === 0;
};

// 7. billPyramidTrap: Four yellow bars closing in on the player
var BillPyramidTrapPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.trapScale = 1.0;
};
BillPyramidTrapPattern.prototype = Object.create(BulletPattern.prototype);
BillPyramidTrapPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.trapScale = 1.6;
    billParticles = [];
};
BillPyramidTrapPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateBillParticles(dt);
    
    // Scale trap down slowly over time
    if (this.elapsed < 4.5) {
        this.trapScale = 1.6 - (this.elapsed / 4.5) * 1.05; // scales down to 0.55
    } else if (this.elapsed >= 6.0) {
        this.trapScale = 0.55 + ((this.elapsed - 6.0) / 1.5) * 1.5; // expands back
    }
    
    if (Math.random() < 0.2 && this.elapsed < this.duration - 1) {
        var bb = Cbbox.getBound();
        var cx = (bb[0] + bb[2]) / 2;
        var cy = (bb[1] + bb[3]) / 2;
        spawnBillParticle(cx + (Math.random() - 0.5) * 50, cy + (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, 2, 0.4, "#FFFF00", 5);
    }
};
BillPyramidTrapPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    if (this.elapsed >= this.duration - 0.5) return 0;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    
    // Boundaries of the trap box
    var sizeX = 75 * this.trapScale;
    var sizeY = 75 * this.trapScale;
    
    var left = cx - sizeX;
    var right = cx + sizeX;
    var top = cy - sizeY;
    var bottom = cy + sizeY;
    
    // Collides if player touches or is outside the closing square trap
    if (Math.abs(scx - left) < 6 || Math.abs(scx - right) < 6 || Math.abs(scy - top) < 6 || Math.abs(scy - bottom) < 6) {
        return this.damVal;
    }
    // Also hurt if completely outside!
    if (scx < left || scx > right || scy < top || scy > bottom) {
        return this.damVal;
    }
    return 0;
};
BillPyramidTrapPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    var sizeX = 75 * this.trapScale;
    var sizeY = 75 * this.trapScale;
    
    ctx.save();
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#FFFF00";
    
    ctx.strokeRect(cx - sizeX, cy - sizeY, sizeX * 2, sizeY * 2);
    
    // Draw warnings lines connecting from outer box to trap corners
    ctx.strokeStyle = "rgba(255, 0, 0, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bb[0], bb[1]); ctx.lineTo(cx - sizeX, cy - sizeY);
    ctx.moveTo(bb[2], bb[1]); ctx.lineTo(cx + sizeX, cy - sizeY);
    ctx.moveTo(bb[0], bb[3]); ctx.lineTo(cx - sizeX, cy + sizeY);
    ctx.moveTo(bb[2], bb[3]); ctx.lineTo(cx + sizeX, cy + sizeY);
    ctx.stroke();
    
    ctx.restore();
    drawBillParticles(ctx);
};
BillPyramidTrapPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};

// ==========================================
// PHASE 2 PATTERNS (Weirdmageddon / Red Madness)
// ==========================================

// 8. billMadnessBubbles: Shifting colorful bubbles bouncing on borders
var BillMadnessBubblesPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 9;
};
BillMadnessBubblesPattern.prototype = Object.create(BulletPattern.prototype);
BillMadnessBubblesPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    billParticles = [];
};
BillMadnessBubblesPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 0.50 && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        var cx = (bb[0] + bb[2]) / 2;
        var colors = ["#FF1493", "#FF8C00", "#7CFC00", "#00FFFF", "#DDA0DD", "#FF0000"];
        this.bullets.push({
            x: cx,
            y: bb[1] + 15,
            vx: -90 + Math.random() * 180,
            vy: 70 + Math.random() * 60,
            width: 16, height: 16,
            color: colors[Math.floor(Math.random() * colors.length)],
            active: true
        });
        Sound.playSound("hit_1", true);
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        
        var outOfBounds = (b.x < bb[0] - 25 || b.x > bb[2] + 25 || b.y < bb[1] - 25 || b.y > bb[3] + 25);
        if (this.elapsed >= this.duration) {
            // Stop bouncing and let them fly off-screen to clear
            if (outOfBounds) {
                this.bullets.splice(i, 1);
                continue;
            }
        } else {
            // Bounce on sides
            if (b.x < bb[0] + 10) { b.x = bb[0] + 10; b.vx = -b.vx; }
            if (b.x > bb[2] - 10) { b.x = bb[2] - 10; b.vx = -b.vx; }
            if (b.y < bb[1] + 10) { b.y = bb[1] + 10; b.vy = -b.vy; }
            if (b.y > bb[3] - 10) { b.y = bb[3] - 10; b.vy = -b.vy; }
        }
        
        if (Math.random() < 0.15) {
            spawnBillParticle(b.x, b.y, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, 2, 0.25, b.color, 4);
        }
    }
};
BillMadnessBubblesPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = b.color;
        ctx.globalAlpha = 0.85;
        
        ctx.beginPath();
        ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Bubble highlight
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(b.x - 3, b.y - 3, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillMadnessBubblesPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 9. billTimeGlitch: Drops falling down + player lag coordinate shifting
var BillTimeGlitchPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.glitchTimer = 0;
    this.damVal = config.damVal || 8;
};
BillTimeGlitchPattern.prototype = Object.create(BulletPattern.prototype);
BillTimeGlitchPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.glitchTimer = 0;
    billParticles = [];
};
BillTimeGlitchPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    this.glitchTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    // Spawn falling pixels
    if (this.spawnTimer >= 0.18 && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        var rx = bb[0] + 15 + Math.random() * (bb[2] - bb[0] - 30);
        this.bullets.push({
            x: rx,
            y: bb[1] - 10,
            vx: 0,
            vy: 130 + Math.random() * 40,
            width: 10, height: 10,
            active: true
        });
    }
    
    // Trigger motion glitches (shifts soul position slightly)
    if (this.glitchTimer >= 1.1 && this.elapsed < this.duration - 1.0) {
        this.glitchTimer = 0;
        if (typeof Soul !== "undefined") {
            var sPos = Soul.getPos();
            var shiftX = (Math.random() - 0.5) * 32;
            var shiftY = (Math.random() - 0.5) * 32;
            // Shift pos, bound to box
            var newX = Math.max(bb[0] + 10, Math.min(bb[2] - 26, sPos.x + shiftX));
            var newY = Math.max(bb[1] + 10, Math.min(bb[3] - 26, sPos.y + shiftY));
            Soul.setPos(newX, newY);
            Sound.playSound("damage", true); // Glitch sound
            
            // Particles
            for (var p = 0; p < 8; p++) {
                spawnBillParticle(newX + 8, newY + 8, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, 3, 0.3, "#FF0055", 10);
            }
        }
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.y += b.vy * dt;
        if (b.y > bb[3] + 15) {
            this.bullets.splice(i, 1);
        }
    }
};
BillTimeGlitchPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.fillStyle = "#FF0055";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#FF0000";
        ctx.fillRect(b.x - 5, b.y - 5, 10, 10);
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillTimeGlitchPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 10. billDimensionalRift: Ford's Portal â€” gravitational vortex with rotating hazard arms
var BillDimensionalRiftPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.portalAngle = 0;
    this.portalRadius = 0;
    this.portalPulse = 0;
    this.armCount = 3;
    this.armWidth = 12;
    this.coreRadius = 18;
    this.pullStrength = 0;
    this.debris = [];
    this.debrisTimer = 0;
    this.portalOpen = false;
    this.fadeAlpha = 0;
};
BillDimensionalRiftPattern.prototype = Object.create(BulletPattern.prototype);
BillDimensionalRiftPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.portalAngle = 0;
    this.portalRadius = 0;
    this.portalPulse = 0;
    this.pullStrength = 0;
    this.debris = [];
    this.debrisTimer = 0;
    this.portalOpen = false;
    this.fadeAlpha = 0;
    billParticles = [];
};
BillDimensionalRiftPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    var boxW = bb[2] - bb[0];
    var maxRadius = boxW * 0.38;

    // Phase: open portal (0-1s), active (1-6.5s), close (6.5-8s)
    if (this.elapsed < 1.0) {
        // Opening phase
        this.portalRadius = maxRadius * (this.elapsed / 1.0);
        this.fadeAlpha = this.elapsed / 1.0;
        this.pullStrength = 30 * (this.elapsed / 1.0);
        if (!this.portalOpen) {
            this.portalOpen = true;
            Sound.playSound("laser", true);
            triggerShake(4, 400);
        }
    } else if (this.elapsed < this.duration - 1.5) {
        // Active phase
        this.portalRadius = maxRadius;
        this.fadeAlpha = 1.0;
        this.pullStrength = 55;
    } else {
        // Closing phase
        var closeT = (this.elapsed - (this.duration - 1.5)) / 1.5;
        closeT = Math.min(closeT, 1.0);
        this.portalRadius = maxRadius * (1.0 - closeT);
        this.fadeAlpha = 1.0 - closeT;
        this.pullStrength = 55 * (1.0 - closeT);
        // Force-clear debris once portal fully closed to prevent isOver() from hanging
        if (closeT >= 1.0) {
            this.debris = [];
            this.pullStrength = 0;
        }
    }

    // Rotate arms
    this.portalAngle += 1.2 * dt;
    this.portalPulse += dt * 4.0;

    // Apply gravitational pull on soul toward portal center
    if (this.pullStrength > 0 && typeof Soul !== "undefined") {
        var sPos = Soul.getPos();
        var sdx = cx - (sPos.x + Soul.getWidth() / 2);
        var sdy = cy - (sPos.y + Soul.getHeight() / 2);
        var sDist = Math.sqrt(sdx * sdx + sdy * sdy);
        if (sDist > 1) {
            var pullFactor = this.pullStrength * dt / Math.max(sDist * 0.4, 20);
            var newX = sPos.x + sdx * pullFactor;
            var newY = sPos.y + sdy * pullFactor;
            newX = Math.max(bb[0] + 2, Math.min(bb[2] - Soul.getWidth() - 2, newX));
            newY = Math.max(bb[1] + 2, Math.min(bb[3] - Soul.getHeight() - 2, newY));
            Soul.setPos(newX, newY);
        }
    }

    // Spawn interdimensional debris orbiting the portal
    this.debrisTimer += dt;
    if (this.debrisTimer >= 0.35 && this.elapsed > 0.5 && this.elapsed < this.duration - 1.5) {
        this.debrisTimer = 0;
        var dAngle = Math.random() * Math.PI * 2;
        var dRadius = this.portalRadius * (0.5 + Math.random() * 0.5);
        var dSpeed = 1.5 + Math.random() * 1.0;
        var debrisColors = ["#FF00FF", "#00FFFF", "#8B00FF", "#FF1493", "#7B68EE"];
        this.debris.push({
            angle: dAngle,
            radius: dRadius,
            speed: dSpeed * (Math.random() > 0.5 ? 1 : -1),
            size: 5 + Math.random() * 6,
            color: debrisColors[Math.floor(Math.random() * debrisColors.length)],
            life: 3.5 + Math.random() * 2.0
        });
        Sound.playSound("hit_1", true);
    }

    // Update debris
    for (var i = this.debris.length - 1; i >= 0; i--) {
        var d = this.debris[i];
        d.angle += d.speed * dt;
        d.life -= dt;
        // Slowly spiral inward
        d.radius -= 8 * dt;
        if (d.life <= 0 || d.radius < 5) {
            spawnBillParticle(
                cx + Math.cos(d.angle) * d.radius,
                cy + Math.sin(d.angle) * d.radius,
                (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40,
                2, 0.3, d.color, 6
            );
            this.debris.splice(i, 1);
        }
    }

    // Ambient particles near portal
    if (Math.random() < 0.25 && this.fadeAlpha > 0.2) {
        var pAngle = Math.random() * Math.PI * 2;
        var pR = this.portalRadius * (0.8 + Math.random() * 0.6);
        spawnBillParticle(
            cx + Math.cos(pAngle) * pR, cy + Math.sin(pAngle) * pR,
            -Math.cos(pAngle) * 30, -Math.sin(pAngle) * 30,
            2, 0.5, "#9B59FF", 8
        );
    }
};
BillDimensionalRiftPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    if (this.fadeAlpha < 0.15) return 0;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;
    var dist = Math.sqrt(Math.pow(scx - cx, 2) + Math.pow(scy - cy, 2));

    // Damage from portal core
    if (dist < this.coreRadius) {
        return this.damVal;
    }

    // Damage from rotating arms
    for (var a = 0; a < this.armCount; a++) {
        var armAngle = this.portalAngle + (a * Math.PI * 2 / this.armCount);
        var armLen = this.portalRadius * 0.95;
        // Point-to-segment distance for the arm line
        var ax1 = cx;
        var ay1 = cy;
        var ax2 = cx + Math.cos(armAngle) * armLen;
        var ay2 = cy + Math.sin(armAngle) * armLen;
        // Vector math for point-to-segment
        var dx = ax2 - ax1;
        var dy = ay2 - ay1;
        var segLen2 = dx * dx + dy * dy;
        if (segLen2 > 0) {
            var t = ((scx - ax1) * dx + (scy - ay1) * dy) / segLen2;
            t = Math.max(0, Math.min(1, t));
            var closestX = ax1 + t * dx;
            var closestY = ay1 + t * dy;
            var armDist = Math.sqrt(Math.pow(scx - closestX, 2) + Math.pow(scy - closestY, 2));
            if (armDist < this.armWidth * 0.6 + sw * 0.3) {
                return this.damVal;
            }
        }
    }

    // Damage from debris
    for (var i = 0; i < this.debris.length; i++) {
        var d = this.debris[i];
        var dex = cx + Math.cos(d.angle) * d.radius;
        var dey = cy + Math.sin(d.angle) * d.radius;
        var deDist = Math.sqrt(Math.pow(scx - dex, 2) + Math.pow(scy - dey, 2));
        if (deDist < d.size * 0.5 + sw * 0.4) {
            return this.damVal;
        }
    }

    return 0;
};
BillDimensionalRiftPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    ctx.save();
    ctx.globalAlpha = this.fadeAlpha;

    // Draw outer distortion ring
    var pulse = Math.sin(this.portalPulse) * 4;
    ctx.save();
    ctx.strokeStyle = "#8B00FF";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#8B00FF";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, this.portalRadius + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Draw inner swirl gradient
    ctx.save();
    var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, this.portalRadius);
    grad.addColorStop(0, "rgba(139, 0, 255, 0.5)");
    grad.addColorStop(0.4, "rgba(75, 0, 130, 0.25)");
    grad.addColorStop(0.8, "rgba(30, 0, 60, 0.1)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, this.portalRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw rotating hazard arms
    for (var a = 0; a < this.armCount; a++) {
        var armAngle = this.portalAngle + (a * Math.PI * 2 / this.armCount);
        var armLen = this.portalRadius * 0.95;
        var endX = cx + Math.cos(armAngle) * armLen;
        var endY = cy + Math.sin(armAngle) * armLen;

        ctx.save();
        ctx.strokeStyle = "#FF00FF";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#FF00FF";
        ctx.lineWidth = this.armWidth;
        ctx.lineCap = "round";
        ctx.globalAlpha = this.fadeAlpha * 0.7;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Bright core line
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 3;
        ctx.globalAlpha = this.fadeAlpha * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.restore();
    }

    // Draw glowing core
    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#FF00FF";
    ctx.beginPath();
    ctx.arc(cx, cy, this.coreRadius + Math.sin(this.portalPulse * 1.5) * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#CC00FF";
    ctx.beginPath();
    ctx.arc(cx, cy, this.coreRadius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw orbiting debris
    for (var i = 0; i < this.debris.length; i++) {
        var d = this.debris[i];
        var dx = cx + Math.cos(d.angle) * d.radius;
        var dy = cy + Math.sin(d.angle) * d.radius;
        ctx.save();
        ctx.fillStyle = d.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = d.color;
        ctx.translate(dx, dy);
        ctx.rotate(d.angle * 2);
        // Draw jagged shard shape
        ctx.beginPath();
        ctx.moveTo(0, -d.size * 0.5);
        ctx.lineTo(d.size * 0.4, d.size * 0.3);
        ctx.lineTo(-d.size * 0.4, d.size * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    ctx.restore();
    drawBillParticles(ctx);
};
BillDimensionalRiftPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    // Debris is force-cleared at end of closing phase, so just check elapsed + fadeAlpha
    return this.elapsed >= this.duration && this.fadeAlpha <= 0.01;
};

// 11. billWeirdmageddonRain: Weirdmageddon Sky Tear â€” damaging zigzag cracks sweep across the box
var BillWeirdmageddonRainPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.crackTimer = 0;
    this.cracks = []; // { points[], sweepX, sweepSpeed, warning, active, width, color }
    this.invertTimer = 0;
    this.invertActive = false;
    this.invertAlpha = 0;
};
BillWeirdmageddonRainPattern.prototype = Object.create(BulletPattern.prototype);
BillWeirdmageddonRainPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.crackTimer = 0;
    this.cracks = [];
    this.invertTimer = 0;
    this.invertActive = false;
    this.invertAlpha = 0;
    billParticles = [];
};
BillWeirdmageddonRainPattern.prototype._buildCrack = function(bb, startX, isVertical) {
    var points = [];
    var segCount = 8 + Math.floor(Math.random() * 5);
    if (isVertical) {
        var step = (bb[3] - bb[1]) / segCount;
        for (var s = 0; s <= segCount; s++) {
            points.push({
                x: startX + (Math.random() - 0.5) * 20,
                y: bb[1] + s * step
            });
        }
    } else {
        var stepH = (bb[2] - bb[0]) / segCount;
        for (var s = 0; s <= segCount; s++) {
            points.push({
                x: bb[0] + s * stepH,
                y: bb[1] + (Math.random() - 0.5) * 20 + (bb[3] - bb[1]) * (0.2 + Math.random() * 0.6)
            });
        }
    }
    return points;
};
BillWeirdmageddonRainPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.crackTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    var boxH = bb[3] - bb[1];

    // Spawn new cracks periodically
    if (this.crackTimer >= 1.2 && this.elapsed < this.duration - 1.5) {
        this.crackTimer = 0;
        var isVertical = Math.random() > 0.4;
        var startX;
        var sweepSpeed;
        var crackColors = ["#FF4500", "#FF0044", "#FF6600", "#CC0000"];

        if (isVertical) {
            // Vertical crack that sweeps horizontally
            var fromLeft = Math.random() > 0.5;
            startX = fromLeft ? bb[0] : bb[2];
            sweepSpeed = fromLeft ? (60 + Math.random() * 40) : -(60 + Math.random() * 40);
        } else {
            // Horizontal crack that sweeps vertically
            startX = bb[1] + Math.random() * boxH * 0.6;
            sweepSpeed = 50 + Math.random() * 30;
        }

        var pts = this._buildCrack(bb, isVertical ? startX : (bb[0] + boxW * 0.5), isVertical);
        this.cracks.push({
            points: pts,
            sweepOffset: 0,
            sweepSpeed: sweepSpeed,
            isVertical: isVertical,
            warning: 0.6,
            active: 2.5,
            width: 6 + Math.random() * 4,
            color: crackColors[Math.floor(Math.random() * crackColors.length)]
        });

        Sound.playSound("impact", true);
        triggerShake(3, 200);

        // Trigger color inversion overlay
        this.invertActive = true;
        this.invertAlpha = 0.3;
    }

    // Update cracks
    for (var i = this.cracks.length - 1; i >= 0; i--) {
        var c = this.cracks[i];
        if (c.warning > 0) {
            c.warning -= dt;
            if (c.warning <= 0) {
                Sound.playSound("laser", true);
                triggerShake(5, 250);
            }
        } else {
            c.active -= dt;
            c.sweepOffset += c.sweepSpeed * dt;

            // Spawn particles along crack
            if (Math.random() < 0.3) {
                var rIdx = Math.floor(Math.random() * c.points.length);
                var rPt = c.points[rIdx];
                var px = c.isVertical ? (rPt.x + c.sweepOffset) : rPt.x;
                var py = c.isVertical ? rPt.y : (rPt.y + c.sweepOffset);
                spawnBillParticle(px, py, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, 3, 0.35, c.color, 8);
            }

            if (c.active <= 0) {
                this.cracks.splice(i, 1);
            }
        }
    }

    // Fade inversion overlay
    if (this.invertActive) {
        this.invertAlpha -= dt * 0.5;
        if (this.invertAlpha <= 0) {
            this.invertAlpha = 0;
            this.invertActive = false;
        }
    }
};
BillWeirdmageddonRainPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;

    for (var i = 0; i < this.cracks.length; i++) {
        var c = this.cracks[i];
        if (c.warning > 0) continue;
        if (c.active <= 0) continue;

        // Check distance from player to each crack segment
        for (var j = 0; j < c.points.length - 1; j++) {
            var p1x = c.isVertical ? (c.points[j].x + c.sweepOffset) : c.points[j].x;
            var p1y = c.isVertical ? c.points[j].y : (c.points[j].y + c.sweepOffset);
            var p2x = c.isVertical ? (c.points[j + 1].x + c.sweepOffset) : c.points[j + 1].x;
            var p2y = c.isVertical ? c.points[j + 1].y : (c.points[j + 1].y + c.sweepOffset);

            // Point-to-segment distance
            var segDx = p2x - p1x;
            var segDy = p2y - p1y;
            var segLen2 = segDx * segDx + segDy * segDy;
            if (segLen2 > 0) {
                var t = ((scx - p1x) * segDx + (scy - p1y) * segDy) / segLen2;
                t = Math.max(0, Math.min(1, t));
                var closestX = p1x + t * segDx;
                var closestY = p1y + t * segDy;
                var hitDist = Math.sqrt(Math.pow(scx - closestX, 2) + Math.pow(scy - closestY, 2));
                if (hitDist < c.width * 0.5 + sw * 0.3) {
                    return this.damVal;
                }
            }
        }
    }
    return 0;
};
BillWeirdmageddonRainPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();

    // Draw reality-warp inversion overlay
    if (this.invertActive && this.invertAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = this.invertAlpha;
        ctx.fillStyle = "#FF2200";
        ctx.globalCompositeOperation = "difference";
        ctx.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
        ctx.restore();
    }

    // Draw each crack
    for (var i = 0; i < this.cracks.length; i++) {
        var c = this.cracks[i];
        var pts = c.points;

        if (c.warning > 0) {
            // Warning: flickering thin red line
            ctx.save();
            ctx.strokeStyle = "rgba(255, 0, 0, " + (0.3 + Math.sin(this.elapsed * 20) * 0.2) + ")";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            for (var j = 0; j < pts.length; j++) {
                var wx = c.isVertical ? (pts[j].x + c.sweepOffset) : pts[j].x;
                var wy = c.isVertical ? pts[j].y : (pts[j].y + c.sweepOffset);
                if (j === 0) { ctx.moveTo(wx, wy); } else { ctx.lineTo(wx, wy); }
            }
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        } else if (c.active > 0) {
            var fadeAlpha = Math.min(1.0, c.active / 0.5);

            // Glow layer
            ctx.save();
            ctx.strokeStyle = c.color;
            ctx.shadowBlur = 18;
            ctx.shadowColor = c.color;
            ctx.lineWidth = c.width + 6;
            ctx.globalAlpha = fadeAlpha * 0.3;
            ctx.beginPath();
            for (var j = 0; j < pts.length; j++) {
                var gx = c.isVertical ? (pts[j].x + c.sweepOffset) : pts[j].x;
                var gy = c.isVertical ? pts[j].y : (pts[j].y + c.sweepOffset);
                if (j === 0) { ctx.moveTo(gx, gy); } else { ctx.lineTo(gx, gy); }
            }
            ctx.stroke();
            ctx.restore();

            // Main crack line
            ctx.save();
            ctx.strokeStyle = c.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#FFFFFF";
            ctx.lineWidth = c.width;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.globalAlpha = fadeAlpha;
            ctx.beginPath();
            for (var j = 0; j < pts.length; j++) {
                var mx = c.isVertical ? (pts[j].x + c.sweepOffset) : pts[j].x;
                var my = c.isVertical ? pts[j].y : (pts[j].y + c.sweepOffset);
                if (j === 0) { ctx.moveTo(mx, my); } else { ctx.lineTo(mx, my); }
            }
            ctx.stroke();
            ctx.restore();

            // White-hot core line
            ctx.save();
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 2;
            ctx.globalAlpha = fadeAlpha * 0.8;
            ctx.beginPath();
            for (var j = 0; j < pts.length; j++) {
                var hx = c.isVertical ? (pts[j].x + c.sweepOffset) : pts[j].x;
                var hy = c.isVertical ? pts[j].y : (pts[j].y + c.sweepOffset);
                if (j === 0) { ctx.moveTo(hx, hy); } else { ctx.lineTo(hx, hy); }
            }
            ctx.stroke();
            ctx.restore();
        }
    }

    ctx.restore();
    drawBillParticles(ctx);
};
BillWeirdmageddonRainPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.cracks.length === 0;
};

// 12. billFloatingPyramids: Giant floating red pyramids that explode
var BillFloatingPyramidsPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 9;
};
BillFloatingPyramidsPattern.prototype = Object.create(BulletPattern.prototype);
BillFloatingPyramidsPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    billParticles = [];
};
BillFloatingPyramidsPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 1.5 && this.elapsed < this.duration - 2.0) {
        this.spawnTimer = 0;
        var rx = bb[0] + 40 + Math.random() * (bb[2] - bb[0] - 80);
        this.bullets.push({
            x: rx,
            y: bb[1] - 30,
            vy: 90,
            width: 32, height: 32,
            isGiant: true,
            active: true
        });
        Sound.playSound("hit_2_crit", true);
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.y += b.vy * dt;
        
        // Explode halfway down the box or near bottom
        var cy = (bb[1] + bb[3])/2;
        if (b.isGiant && b.y >= cy + (Math.random() - 0.5) * 30) {
            b.active = false;
            this.bullets.splice(i, 1);
            
            // Spawn 6 small spikes
            for (var k = 0; k < 6; k++) {
                var angle = k * Math.PI / 3;
                this.bullets.push({
                    x: b.x,
                    y: b.y,
                    vx: Math.cos(angle) * 110,
                    vy: Math.sin(angle) * 110,
                    width: 10, height: 10,
                    isGiant: false,
                    active: true
                });
            }
            Sound.playSound("impact", true);
            if (typeof triggerShake !== "undefined") triggerShake(5, 150);
            for (var p = 0; p < 8; p++) {
                spawnBillParticle(b.x, b.y, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, 3, 0.4, "#FF0000", 8);
            }
        } else if (!b.isGiant && (b.x < bb[0] - 15 || b.x > bb[2] + 15 || b.y < bb[1] - 15 || b.y > bb[3] + 15)) {
            this.bullets.splice(i, 1);
        }
    }
};
BillFloatingPyramidsPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF0000";
        ctx.fillStyle = "#8B0000";
        ctx.strokeStyle = "#FF3333";
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        if (b.isGiant) {
            ctx.moveTo(0, -18);
            ctx.lineTo(16, 12);
            ctx.lineTo(-16, 12);
        } else {
            ctx.moveTo(0, -6);
            ctx.lineTo(5, 4);
            ctx.lineTo(-5, 4);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillFloatingPyramidsPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 13. billShadowClones: Mabel's Prison Bubble â€” shrinking/expanding colorful bubble with candy hazards
var BillShadowClonesPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.5;
    this.elapsed = 0;
    this.damVal = config.damVal || 8;
    this.bubbleRadius = 0;
    this.bubbleTargetRadius = 0;
    this.bubblePhase = 0; // 0=expand, 1=shrink1, 2=expand, 3=shrink2, etc.
    this.bubbleTimer = 0;
    this.bubbleHue = 0;
    this.candyZones = []; // { x, y, radius, pulsePhase, color, life, growing }
    this.candyTimer = 0;
    this.sparkleTimer = 0;
    this.fadeAlpha = 0;
};
BillShadowClonesPattern.prototype = Object.create(BulletPattern.prototype);
BillShadowClonesPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.bubblePhase = 0;
    this.bubbleTimer = 0;
    this.bubbleHue = 0;
    this.candyZones = [];
    this.candyTimer = 0;
    this.sparkleTimer = 0;
    this.fadeAlpha = 0;
    var bb = Cbbox.getBound();
    var boxW = bb[2] - bb[0];
    this.bubbleRadius = boxW * 0.48;
    this.bubbleTargetRadius = boxW * 0.48;
    billParticles = [];
};
BillShadowClonesPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.bubbleTimer += dt;
    this.candyTimer += dt;
    this.sparkleTimer += dt;
    this.bubbleHue += dt * 40;
    if (this.bubbleHue > 360) this.bubbleHue -= 360;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    var boxW = bb[2] - bb[0];
    var maxR = boxW * 0.48;
    var minR = boxW * 0.18;

    // Phase: intro (0-0.8s), active (0.8-7s), outro (7-8.5s)
    if (this.elapsed < 0.8) {
        // Intro: bubble appears
        this.fadeAlpha = this.elapsed / 0.8;
        this.bubbleTargetRadius = maxR;
    } else if (this.elapsed < this.duration - 1.5) {
        // Active phase: cycle between shrinking and expanding
        this.fadeAlpha = 1.0;
        var cycleTime = 2.2;
        var cycleProg = ((this.elapsed - 0.8) % cycleTime) / cycleTime;

        if (cycleProg < 0.5) {
            // Shrinking
            var shrinkT = cycleProg / 0.5;
            this.bubbleTargetRadius = maxR - (maxR - minR) * shrinkT;
        } else {
            // Expanding
            var expandT = (cycleProg - 0.5) / 0.5;
            this.bubbleTargetRadius = minR + (maxR - minR) * expandT;
        }
    } else {
        // Outro: bubble expands and fades
        var outT = (this.elapsed - (this.duration - 1.5)) / 1.5;
        outT = Math.min(outT, 1.0);
        this.fadeAlpha = 1.0 - outT;
        // Force-clear candy zones once fully faded to prevent isOver() hang
        if (outT >= 1.0) {
            this.candyZones = [];
        }
        this.bubbleTargetRadius = maxR + outT * 40;
    }

    // Smoothly lerp bubble radius
    this.bubbleRadius += (this.bubbleTargetRadius - this.bubbleRadius) * 4.0 * dt;

    // Spawn candy hazard zones inside the bubble
    if (this.candyTimer >= 1.0 && this.elapsed > 0.8 && this.elapsed < this.duration - 1.5) {
        this.candyTimer = 0;
        var candyColors = ["#FF69B4", "#FF1493", "#FF6347", "#FFD700", "#00FF7F", "#7B68EE", "#FF4500"];
        var candyAngle = Math.random() * Math.PI * 2;
        var candyDist = Math.random() * (this.bubbleRadius * 0.55);
        this.candyZones.push({
            x: cx + Math.cos(candyAngle) * candyDist,
            y: cy + Math.sin(candyAngle) * candyDist,
            radius: 10 + Math.random() * 10,
            maxRadius: 18 + Math.random() * 14,
            pulsePhase: Math.random() * Math.PI * 2,
            color: candyColors[Math.floor(Math.random() * candyColors.length)],
            life: 2.0 + Math.random() * 1.5,
            growing: true,
            moveAngle: Math.random() * Math.PI * 2,
            moveSpeed: 15 + Math.random() * 20
        });
        Sound.playSound("hit_1", true);
    }

    // Update candy zones
    for (var i = this.candyZones.length - 1; i >= 0; i--) {
        var cz = this.candyZones[i];
        cz.life -= dt;
        cz.pulsePhase += dt * 5;

        // Move the candy zone slowly
        cz.x += Math.cos(cz.moveAngle) * cz.moveSpeed * dt;
        cz.y += Math.sin(cz.moveAngle) * cz.moveSpeed * dt;

        // Keep candy inside bubble
        var dxC = cz.x - cx;
        var dyC = cz.y - cy;
        var distC = Math.sqrt(dxC * dxC + dyC * dyC);
        if (distC + cz.maxRadius > this.bubbleRadius * 0.85) {
            // Bounce direction
            cz.moveAngle = Math.atan2(cy - cz.y, cx - cz.x) + (Math.random() - 0.5) * 1.0;
        }

        // Pulse radius
        var pulseMod = Math.sin(cz.pulsePhase) * 5;
        cz.radius = cz.maxRadius + pulseMod;

        if (cz.life <= 0) {
            // Burst particles on candy pop
            for (var p = 0; p < 6; p++) {
                spawnBillParticle(cz.x, cz.y, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, 3, 0.3, cz.color, 6);
            }
            Sound.playSound("ting", true);
            this.candyZones.splice(i, 1);
        }
    }

    // Push player inside bubble boundary (cannot exit)
    if (this.fadeAlpha > 0.3 && typeof Soul !== "undefined") {
        var sPos = Soul.getPos();
        var sw = Soul.getWidth();
        var sh = Soul.getHeight();
        var soulCX = sPos.x + sw / 2;
        var soulCY = sPos.y + sh / 2;
        var soulDist = Math.sqrt(Math.pow(soulCX - cx, 2) + Math.pow(soulCY - cy, 2));
        var safeR = this.bubbleRadius - 8;
        if (soulDist > safeR && safeR > 10) {
            var pushAngle = Math.atan2(soulCY - cy, soulCX - cx);
            var newSX = cx + Math.cos(pushAngle) * safeR - sw / 2;
            var newSY = cy + Math.sin(pushAngle) * safeR - sh / 2;
            newSX = Math.max(bb[0] + 2, Math.min(bb[2] - sw - 2, newSX));
            newSY = Math.max(bb[1] + 2, Math.min(bb[3] - sh - 2, newSY));
            Soul.setPos(newSX, newSY);
        }
    }

    // Sparkle particles on bubble boundary
    if (this.sparkleTimer >= 0.08 && this.fadeAlpha > 0.2) {
        this.sparkleTimer = 0;
        var spAngle = Math.random() * Math.PI * 2;
        var spX = cx + Math.cos(spAngle) * this.bubbleRadius;
        var spY = cy + Math.sin(spAngle) * this.bubbleRadius;
        var sparkColors = ["#FF69B4", "#FFD700", "#00FFFF", "#FF1493", "#7CFC00"];
        spawnBillParticle(spX, spY, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, 2, 0.4, sparkColors[Math.floor(Math.random() * sparkColors.length)], 5);
    }
};
BillShadowClonesPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    if (this.fadeAlpha < 0.2) return 0;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;
    var dist = Math.sqrt(Math.pow(scx - cx, 2) + Math.pow(scy - cy, 2));

    // Damage from bubble boundary (touching the wall)
    var wallThickness = 8;
    if (Math.abs(dist - this.bubbleRadius) < wallThickness) {
        return this.damVal;
    }

    // Damage from candy hazard zones
    for (var i = 0; i < this.candyZones.length; i++) {
        var cz = this.candyZones[i];
        var czDist = Math.sqrt(Math.pow(scx - cz.x, 2) + Math.pow(scy - cz.y, 2));
        if (czDist < cz.radius + sw * 0.3) {
            return this.damVal;
        }
    }

    return 0;
};
BillShadowClonesPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    ctx.save();
    ctx.globalAlpha = this.fadeAlpha;

    // Draw bubble outer glow
    ctx.save();
    var hueStr = "hsl(" + Math.floor(this.bubbleHue) + ", 80%, 60%)";
    var hueStr2 = "hsl(" + Math.floor(this.bubbleHue + 60) + ", 80%, 70%)";
    ctx.strokeStyle = hueStr;
    ctx.shadowBlur = 20;
    ctx.shadowColor = hueStr;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, this.bubbleRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner rainbow border
    ctx.strokeStyle = hueStr2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = hueStr2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, this.bubbleRadius - 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Draw semi-transparent bubble fill
    ctx.save();
    var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, this.bubbleRadius);
    grad.addColorStop(0, "rgba(255, 182, 255, 0.03)");
    grad.addColorStop(0.7, "rgba(255, 105, 180, 0.06)");
    grad.addColorStop(1, "rgba(255, 20, 147, 0.12)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, this.bubbleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw bubble highlight (the classic shine)
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.ellipse(cx - this.bubbleRadius * 0.3, cy - this.bubbleRadius * 0.3, this.bubbleRadius * 0.18, this.bubbleRadius * 0.12, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw candy hazard zones
    for (var i = 0; i < this.candyZones.length; i++) {
        var cz = this.candyZones[i];
        var czAlpha = Math.min(1.0, cz.life / 0.5);

        // Glow
        ctx.save();
        ctx.fillStyle = cz.color;
        ctx.shadowBlur = 14;
        ctx.shadowColor = cz.color;
        ctx.globalAlpha = this.fadeAlpha * czAlpha * 0.4;
        ctx.beginPath();
        ctx.arc(cz.x, cz.y, cz.radius + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Main candy circle
        ctx.save();
        ctx.fillStyle = cz.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = cz.color;
        ctx.globalAlpha = this.fadeAlpha * czAlpha * 0.7;
        ctx.beginPath();
        ctx.arc(cz.x, cz.y, cz.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Star/sparkle in center
        ctx.save();
        ctx.fillStyle = "#FFFFFF";
        ctx.globalAlpha = this.fadeAlpha * czAlpha * 0.5;
        ctx.translate(cz.x, cz.y);
        ctx.rotate(cz.pulsePhase * 0.5);
        ctx.beginPath();
        for (var s = 0; s < 4; s++) {
            var sa = s * Math.PI / 2;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(sa) * cz.radius * 0.5, Math.sin(sa) * cz.radius * 0.5);
        }
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }

    ctx.restore();
    drawBillParticles(ctx);
};
BillShadowClonesPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    // candyZones are force-cleared at end of outro, so just check elapsed + fadeAlpha
    return this.elapsed >= this.duration && this.fadeAlpha <= 0.01;
};

// 14. billTeleportSlam: Bill teleports and slams down, causing shockwaves
var BillTeleportSlamPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.slamTimer = 0;
    this.damVal = config.damVal || 9;
    this.slams = []; // { x, y, warning, active, waveRadius }
};
BillTeleportSlamPattern.prototype = Object.create(BulletPattern.prototype);
BillTeleportSlamPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.slamTimer = 0.4;
    this.slams = [];
    billParticles = [];
};
BillTeleportSlamPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.slamTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    if (this.slamTimer >= 1.6 && this.elapsed < this.duration - 1.5) {
        this.slamTimer = 0;
        var rx = bb[0] + 30 + Math.random() * (bb[2] - bb[0] - 60);
        var ry = bb[1] + 30 + Math.random() * (bb[3] - bb[1] - 60);
        this.slams.push({
            x: rx,
            y: ry,
            warning: 0.75,
            active: 0.6,
            waveRadius: 0
        });
        Sound.playSound("laser", true);
    }
    
    for (var i = this.slams.length - 1; i >= 0; i--) {
        var s = this.slams[i];
        if (s.warning > 0) {
            s.warning -= dt;
            if (s.warning <= 0) {
                Sound.playSound("impact", true);
                if (typeof triggerShake !== "undefined") triggerShake(7, 180);
                for (var p = 0; p < 12; p++) {
                    spawnBillParticle(s.x, s.y, (Math.random() - 0.5) * 90, (Math.random() - 0.5) * 90, 3, 0.4, "#FFD700", 8);
                }
            }
        } else {
            s.active -= dt;
            s.waveRadius += 160 * dt; // expanding shockwave
            if (s.active <= 0) {
                this.slams.splice(i, 1);
            }
        }
    }
};
BillTeleportSlamPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    for (var i = 0; i < this.slams.length; i++) {
        var s = this.slams[i];
        if (s.warning <= 0) {
            var dist = Math.sqrt(Math.pow(scx - s.x, 2) + Math.pow(scy - s.y, 2));
            // Collision with expanding thin shockwave circle
            if (Math.abs(dist - s.waveRadius) < 10) {
                return this.damVal;
            }
            // Direct collision with center slam point
            if (dist < 15 + sw/2) {
                return this.damVal;
            }
        }
    }
    return 0;
};
BillTeleportSlamPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.slams.length; i++) {
        var s = this.slams[i];
        ctx.save();
        if (s.warning > 0) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.25)";
            ctx.strokeStyle = "#FF0000";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Reticle line
            ctx.beginPath();
            ctx.arc(s.x, s.y, 25 * (s.warning / 0.75), 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Draw slam star/triangle
            ctx.fillStyle = "#FFFF00";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#FFD700";
            ctx.beginPath();
            ctx.arc(s.x, s.y, 16, 0, Math.PI*2);
            ctx.fill();
            
            // Draw shockwave
            ctx.strokeStyle = "rgba(255, 215, 0, " + (s.active / 0.6) + ")";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.waveRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillTeleportSlamPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.slams.length === 0;
};

// ==========================================
// PHASE 3 PATTERNS (Apocalypse / Red Enraged Giant)
// ==========================================

// 15. billAngryRedNova: Giant expanding pulses from center
var BillAngryRedNovaPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.pulseTimer = 0;
    this.damVal = config.damVal || 9;
    this.pulses = []; // { cx, cy, radius, active }
};
BillAngryRedNovaPattern.prototype = Object.create(BulletPattern.prototype);
BillAngryRedNovaPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.pulseTimer = 0.5;
    this.pulses = [];
    billParticles = [];
};
BillAngryRedNovaPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.pulseTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    if (this.pulseTimer >= 1.5 && this.elapsed < this.duration - 1.5) {
        this.pulseTimer = 0;
        this.pulses.push({
            x: cx,
            y: cy,
            radius: 5,
            active: 1.0
        });
        Sound.playSound("impact", true);
        if (typeof triggerShake !== "undefined") triggerShake(6, 200);
    }
    
    for (var i = this.pulses.length - 1; i >= 0; i--) {
        var p = this.pulses[i];
        p.radius += 170 * dt; // expand
        p.active -= dt;
        if (p.active <= 0) {
            this.pulses.splice(i, 1);
        }
    }
};
BillAngryRedNovaPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    for (var i = 0; i < this.pulses.length; i++) {
        var p = this.pulses[i];
        var dist = Math.sqrt(Math.pow(scx - p.x, 2) + Math.pow(scy - p.y, 2));
        if (Math.abs(dist - p.radius) < 14) {
            return this.damVal;
        }
    }
    return 0;
};
BillAngryRedNovaPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.pulses.length; i++) {
        var p = this.pulses[i];
        ctx.save();
        ctx.strokeStyle = "rgba(255, 0, 0, " + (p.active / 1.0) + ")";
        ctx.lineWidth = 12;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#FF0000";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillAngryRedNovaPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.pulses.length === 0;
};

// 16. billFistSlam: Red giant fists slamming down from margins
var BillFistSlamPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.slamTimer = 0;
    this.damVal = config.damVal || 10;
    this.fists = []; // { x, y, warning, active, side }
};
BillFistSlamPattern.prototype = Object.create(BulletPattern.prototype);
BillFistSlamPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.slamTimer = 0.5;
    this.fists = [];
    billParticles = [];
};
BillFistSlamPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.slamTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    if (this.slamTimer >= 1.4 && this.elapsed < this.duration - 1.5) {
        this.slamTimer = 0;
        var side = Math.floor(Math.random() * 3); // 0: left side, 1: center, 2: right side
        var cx = bb[0] + (bb[2] - bb[0])/6 + side * (bb[2] - bb[0])/3;
        this.fists.push({
            x: cx,
            y: bb[1] - 40,
            targetY: bb[3] - 40,
            warning: 0.8,
            active: 0.5,
            side: side
        });
        Sound.playSound("laser", true);
    }
    
    for (var i = this.fists.length - 1; i >= 0; i--) {
        var f = this.fists[i];
        if (f.warning > 0) {
            f.warning -= dt;
            if (f.warning <= 0) {
                f.y = f.targetY; // slam down instantly!
                Sound.playSound("impact", true);
                if (typeof triggerShake !== "undefined") triggerShake(10, 250);
                for (var p = 0; p < 15; p++) {
                    spawnBillParticle(f.x, f.y + 40, (Math.random() - 0.5) * 120, -Math.random() * 60, 4, 0.4, "#FF3333", 10);
                }
            }
        } else {
            f.active -= dt;
            if (f.active <= 0) {
                this.fists.splice(i, 1);
            }
        }
    }
};
BillFistSlamPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    for (var i = 0; i < this.fists.length; i++) {
        var f = this.fists[i];
        if (f.warning <= 0) {
            // Fist hitbox is very wide
            if (Math.abs(scx - f.x) < 40 && scy > f.y - 40) {
                return this.damVal;
            }
        }
    }
    return 0;
};
BillFistSlamPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();
    for (var i = 0; i < this.fists.length; i++) {
        var f = this.fists[i];
        ctx.save();
        if (f.warning > 0) {
            // Warning zone for slam
            ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
            ctx.fillRect(f.x - 30, bb[1], 60, bb[3] - bb[1]);
            
            // Faint red fist floating at the top
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
            ctx.fillRect(f.x - 20, f.y, 40, 50);
        } else {
            // Giant red fist slammed down
            ctx.fillStyle = "#FF0000";
            ctx.strokeStyle = "#8B0000";
            ctx.lineWidth = 3;
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#FF0000";
            
            // Draw fist rectangle at y
            ctx.fillRect(f.x - 30, bb[1], 60, f.y - bb[1]);
            ctx.strokeRect(f.x - 30, bb[1], 60, f.y - bb[1]);
            
            ctx.fillRect(f.x - 35, f.y, 70, 40);
            ctx.strokeRect(f.x - 35, f.y, 70, 40);
        }
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillFistSlamPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.fists.length === 0;
};

// 17. billTeethChirp: Homing teeth bullets flying at player
var BillTeethChirpPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 9;
};
BillTeethChirpPattern.prototype = Object.create(BulletPattern.prototype);
BillTeethChirpPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    billParticles = [];
};
BillTeethChirpPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    
    if (this.spawnTimer >= 0.70 && this.elapsed < this.duration - 1.5) {
        this.spawnTimer = 0;
        this.bullets.push({
            x: cx,
            y: bb[1] - 15,
            vx: 0, vy: 50, // slowly starts falling down
            width: 14, height: 14,
            homeTimer: 1.8, // homes in for 1.8 seconds
            active: true
        });
        Sound.playSound("hit_1", true);
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        
        if (b.homeTimer > 0 && typeof Soul !== "undefined") {
            b.homeTimer -= dt;
            var sPos = Soul.getPos();
            var targetX = sPos.x + Soul.getWidth()/2;
            var targetY = sPos.y + Soul.getHeight()/2;
            var angle = Math.atan2(targetY - b.y, targetX - b.x);
            // Slowly adjust velocities to home in
            b.vx = b.vx * 0.90 + Math.cos(angle) * 115 * 0.10;
            b.vy = b.vy * 0.90 + Math.sin(angle) * 115 * 0.10;
        }
        
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        
        if (Math.random() < 0.2) {
            spawnBillParticle(b.x, b.y, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 2, 0.25, "#FFFFF0", 5);
        }
        
        if (b.x < bb[0] - 20 || b.x > bb[2] + 20 || b.y < bb[1] - 20 || b.y > bb[3] + 20) {
            this.bullets.splice(i, 1);
        }
    }
};
BillTeethChirpPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#FF3300";
        ctx.fillStyle = "#FFFFE0"; // Teeth white-ish
        ctx.strokeStyle = "#FF3300";
        ctx.lineWidth = 1.5;
        
        // Draw triangular tooth
        ctx.beginPath();
        ctx.moveTo(0, 7);
        ctx.lineTo(-6, -7);
        ctx.lineTo(6, -7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillTeethChirpPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 18. billCataclysmRays: Cross-shaped red blast beams erupting
var BillCataclysmRaysPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.rayTimer = 0;
    this.damVal = config.damVal || 9;
    this.rays = []; // { cx, cy, warning, active, angle }
};
BillCataclysmRaysPattern.prototype = Object.create(BulletPattern.prototype);
BillCataclysmRaysPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.rayTimer = 0.5;
    this.rays = [];
    billParticles = [];
};
BillCataclysmRaysPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.rayTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    if (this.rayTimer >= 1.5 && this.elapsed < this.duration - 1.5) {
        this.rayTimer = 0;
        var rx = bb[0] + 40 + Math.random() * (bb[2] - bb[0] - 80);
        var ry = bb[1] + 40 + Math.random() * (bb[3] - bb[1] - 80);
        this.rays.push({
            x: rx,
            y: ry,
            warning: 0.8,
            active: 0.6,
            angle: Math.random() * Math.PI / 4
        });
        Sound.playSound("laser", true);
    }
    
    for (var i = this.rays.length - 1; i >= 0; i--) {
        var r = this.rays[i];
        if (r.warning > 0) {
            r.warning -= dt;
            if (r.warning <= 0) {
                Sound.playSound("impact", true);
                if (typeof triggerShake !== "undefined") triggerShake(6, 180);
                for (var p = 0; p < 16; p++) {
                    spawnBillParticle(r.x, r.y, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120, 3, 0.4, "#FF0000", 8);
                }
            }
        } else {
            r.active -= dt;
            if (r.active <= 0) {
                this.rays.splice(i, 1);
            }
        }
    }
};
BillCataclysmRaysPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    for (var i = 0; i < this.rays.length; i++) {
        var r = this.rays[i];
        if (r.warning <= 0) {
            // Check collision with the cross beams
            var thickness = 10;
            // Beam 1: angled line
            var dx1 = Math.cos(r.angle);
            var dy1 = Math.sin(r.angle);
            var dist1 = Math.abs((scx - r.x) * dy1 - (scy - r.y) * dx1);
            
            // Beam 2: orthogonal angled line
            var dx2 = Math.cos(r.angle + Math.PI/2);
            var dy2 = Math.sin(r.angle + Math.PI/2);
            var dist2 = Math.abs((scx - r.x) * dy2 - (scy - r.y) * dx2);
            
            if (dist1 < thickness || dist2 < thickness) {
                return this.damVal;
            }
        }
    }
    return 0;
};
BillCataclysmRaysPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();
    for (var i = 0; i < this.rays.length; i++) {
        var r = this.rays[i];
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.rotate(r.angle);
        
        if (r.warning > 0) {
            ctx.strokeStyle = "rgba(255, 0, 0, 0.25)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-350, 0); ctx.lineTo(350, 0);
            ctx.moveTo(0, -350); ctx.lineTo(0, 350);
            ctx.stroke();
            
            ctx.strokeRect(-12, -12, 24, 24);
        } else {
            ctx.strokeStyle = "#FF3333";
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#FF0000";
            ctx.lineWidth = 18 * (r.active / 0.6);
            ctx.beginPath();
            ctx.moveTo(-350, 0); ctx.lineTo(350, 0);
            ctx.moveTo(0, -350); ctx.lineTo(0, 350);
            ctx.stroke();
            
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 5 * (r.active / 0.6);
            ctx.stroke();
        }
        ctx.restore();
    }
    ctx.restore();
    drawBillParticles(ctx);
};
BillCataclysmRaysPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.rays.length === 0;
};

// 19. billGravityChaos: Reality Unraveling â€” tear lines rip reality, sweeping eye laser, gravity shifts
var BillGravityChaosPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.tearTimer = 0;
    this.laserTimer = 0;
    this.shiftTimer = 0;
    this.damVal = config.damVal || 9;
    this.gravityDir = 0;
    this.tears = [];
    this.eyeLaser = null;
};
BillGravityChaosPattern.prototype = Object.create(BulletPattern.prototype);
BillGravityChaosPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.tearTimer = 0.3;
    this.laserTimer = 1.5;
    this.shiftTimer = 0.5;
    this.gravityDir = 0;
    this.tears = [];
    this.eyeLaser = null;
    billParticles = [];
    if (typeof Soul !== "undefined") {
        Soul.setSoulMode(Soul.SOUL_MODE.BLUE);
    }
};
BillGravityChaosPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.tearTimer += dt;
    this.laserTimer += dt;
    this.shiftTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    var bw = bb[2] - bb[0];
    var bh = bb[3] - bb[1];

    // Shift gravity direction every 2s
    if (this.shiftTimer >= 2.0 && this.elapsed < this.duration - 1.0) {
        this.shiftTimer = 0;
        this.gravityDir = (this.gravityDir + 1) % 4;
        Sound.playSound("impact", true);
        if (typeof triggerShake !== "undefined") triggerShake(5, 120);
        if (typeof Soul !== "undefined") {
            var sPos = Soul.getPos();
            var force = 22;
            if (this.gravityDir === 0) sPos.y += force;
            else if (this.gravityDir === 1) sPos.x -= force;
            else if (this.gravityDir === 2) sPos.y -= force;
            else sPos.x += force;
            Soul.setPos(sPos.x, sPos.y);
        }
        for (var p = 0; p < 10; p++) {
            spawnBillParticle(cx + (Math.random() - 0.5) * bw, cy + (Math.random() - 0.5) * bh,
                (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, 3, 0.4, "#FF3300", 8);
        }
    }

    // Apply gravity drift
    if (typeof Soul !== "undefined" && typeof Soul.getSoulMode === "function" && Soul.getSoulMode() === Soul.SOUL_MODE.BLUE) {
        var sPos2 = Soul.getPos();
        var speed = 130;
        if (this.gravityDir === 1) { sPos2.x -= speed * dt; }
        else if (this.gravityDir === 2) { sPos2.y -= speed * dt; }
        else if (this.gravityDir === 3) { sPos2.x += speed * dt; }
        Soul.setPos(sPos2.x, sPos2.y);
    }

    // Spawn reality tear lines
    if (this.tearTimer >= 1.1 && this.elapsed < this.duration - 1.5) {
        this.tearTimer = 0;
        var isH = Math.random() > 0.5;
        var tearPos;
        if (isH) {
            tearPos = bb[1] + 25 + Math.random() * (bh - 50);
        } else {
            tearPos = bb[0] + 25 + Math.random() * (bw - 50);
        }
        this.tears.push({
            pos: tearPos,
            isHorizontal: isH,
            warning: 0.7,
            active: 1.2
        });
        Sound.playSound("ting", true);
    }

    // Update tears
    for (var i = this.tears.length - 1; i >= 0; i--) {
        var t = this.tears[i];
        if (t.warning > 0) {
            t.warning -= dt;
            if (t.warning <= 0) {
                Sound.playSound("damage", true);
                if (typeof triggerShake !== "undefined") triggerShake(4, 100);
                var count = 8;
                for (var tp = 0; tp < count; tp++) {
                    var tpx, tpy;
                    if (t.isHorizontal) { tpx = bb[0] + Math.random() * bw; tpy = t.pos; }
                    else { tpx = t.pos; tpy = bb[1] + Math.random() * bh; }
                    spawnBillParticle(tpx, tpy, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, 3, 0.5, "#FF2222", 10);
                }
            }
        } else {
            t.active -= dt;
            if (Math.random() < 0.2) {
                if (t.isHorizontal) {
                    spawnBillParticle(bb[0] + Math.random() * bw, t.pos, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 30, 2, 0.3, "#FF4400", 6);
                } else {
                    spawnBillParticle(t.pos, bb[1] + Math.random() * bh, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20, 2, 0.3, "#FF4400", 6);
                }
            }
            if (t.active <= 0) {
                this.tears.splice(i, 1);
            }
        }
    }

    // Eye laser sweep
    if (this.eyeLaser === null && this.laserTimer >= 2.8 && this.elapsed < this.duration - 1.5) {
        this.laserTimer = 0;
        var startAngle = Math.PI * 0.3 + Math.random() * Math.PI * 0.4;
        var sweepDir = (Math.random() > 0.5 ? 1 : -1) * (0.9 + Math.random() * 0.5);
        this.eyeLaser = {
            cx: cx,
            cy: bb[1] - 10,
            angle: startAngle,
            speed: sweepDir / 0.7,
            warning: 0.6,
            active: 0.7
        };
        Sound.playSound("laser", true);
    }

    if (this.eyeLaser !== null) {
        var el = this.eyeLaser;
        if (el.warning > 0) {
            el.warning -= dt;
        } else {
            el.active -= dt;
            el.angle += el.speed * dt;
            if (Math.random() < 0.4) {
                var len = 50 + Math.random() * 200;
                var lx = el.cx + Math.cos(el.angle) * len;
                var ly = el.cy + Math.sin(el.angle) * len;
                spawnBillParticle(lx, ly, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, 3, 0.35, "#FFFF00", 8);
            }
            if (el.active <= 0) {
                this.eyeLaser = null;
            }
        }
    }
};
BillGravityChaosPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw / 2;
    var scy = sy + sh / 2;

    // Check tear line collisions
    for (var i = 0; i < this.tears.length; i++) {
        var t = this.tears[i];
        if (t.warning <= 0 && t.active > 0) {
            var thickness = 8;
            if (t.isHorizontal) {
                if (Math.abs(scy - t.pos) < thickness + sh * 0.3) return this.damVal;
            } else {
                if (Math.abs(scx - t.pos) < thickness + sw * 0.3) return this.damVal;
            }
        }
    }

    // Check eye laser collision
    if (this.eyeLaser !== null) {
        var el = this.eyeLaser;
        if (el.warning <= 0 && el.active > 0) {
            var x2 = el.cx + Math.cos(el.angle) * 600;
            var y2 = el.cy + Math.sin(el.angle) * 600;
            var num = Math.abs((y2 - el.cy) * scx - (x2 - el.cx) * scy + x2 * el.cy - y2 * el.cx);
            var den = Math.sqrt(Math.pow(y2 - el.cy, 2) + Math.pow(x2 - el.cx, 2));
            var dist = num / (den || 1);
            if (dist < 12) return this.damVal;
        }
    }

    return 0;
};
BillGravityChaosPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var bw = bb[2] - bb[0];
    var bh = bb[3] - bb[1];
    ctx.save();

    // Gravity direction indicator
    var arrows = ["â†“", "â†", "â†‘", "â†’"];
    ctx.fillStyle = "rgba(255, 50, 0, 0.18)";
    ctx.font = "14px Courier New";
    ctx.fillText("REALIDAD " + arrows[this.gravityDir], bb[0] + 8, bb[1] + 18);

    // Background glitch static
    ctx.globalAlpha = 0.05;
    for (var g = 0; g < 10; g++) {
        var gx = bb[0] + Math.random() * bw;
        var gy = bb[1] + Math.random() * bh;
        ctx.fillStyle = Math.random() > 0.5 ? "#FF0000" : "#00FFFF";
        ctx.fillRect(gx, gy, Math.random() * 25 + 5, 2);
    }
    ctx.globalAlpha = 1;

    // Draw tear lines
    for (var i = 0; i < this.tears.length; i++) {
        var t = this.tears[i];
        ctx.save();
        if (t.warning > 0) {
            var flash = Math.sin(this.elapsed * 25) * 0.3 + 0.5;
            ctx.strokeStyle = "rgba(255, 0, 0, " + (flash * 0.5).toFixed(2) + ")";
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 8]);
            ctx.beginPath();
            if (t.isHorizontal) {
                ctx.moveTo(bb[0], t.pos);
                ctx.lineTo(bb[2], t.pos);
            } else {
                ctx.moveTo(t.pos, bb[1]);
                ctx.lineTo(t.pos, bb[3]);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            // Warning markers
            ctx.fillStyle = "rgba(255, 0, 0, " + (flash * 0.8).toFixed(2) + ")";
            ctx.font = "bold 12px Arial";
            if (t.isHorizontal) {
                ctx.fillText("!", bb[0] + 4, t.pos - 4);
                ctx.fillText("!", bb[2] - 12, t.pos - 4);
            } else {
                ctx.fillText("!", t.pos + 4, bb[1] + 14);
                ctx.fillText("!", t.pos + 4, bb[3] - 6);
            }
        } else if (t.active > 0) {
            var fadeAlpha = Math.min(1.0, t.active / 0.3);
            ctx.shadowBlur = 14;
            ctx.shadowColor = "#FF2200";
            ctx.strokeStyle = "rgba(255, 60, 0, " + (fadeAlpha * 0.7).toFixed(2) + ")";
            ctx.lineWidth = 10 * fadeAlpha;
            ctx.beginPath();
            if (t.isHorizontal) {
                var x = bb[0];
                ctx.moveTo(x, t.pos);
                while (x < bb[2]) {
                    x += 8 + Math.random() * 12;
                    ctx.lineTo(x, t.pos + (Math.random() - 0.5) * 10);
                }
            } else {
                var y = bb[1];
                ctx.moveTo(t.pos, y);
                while (y < bb[3]) {
                    y += 8 + Math.random() * 12;
                    ctx.lineTo(t.pos + (Math.random() - 0.5) * 10, y);
                }
            }
            ctx.stroke();
            // White-hot core
            ctx.strokeStyle = "rgba(255, 255, 255, " + (fadeAlpha * 0.5).toFixed(2) + ")";
            ctx.shadowBlur = 0;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();
    }

    // Draw eye laser
    if (this.eyeLaser !== null) {
        var el = this.eyeLaser;
        var lx2 = el.cx + Math.cos(el.angle) * 600;
        var ly2 = el.cy + Math.sin(el.angle) * 600;
        ctx.save();
        if (el.warning > 0) {
            ctx.strokeStyle = "rgba(255, 255, 0, " + (0.2 + 0.2 * Math.sin(this.elapsed * 30)).toFixed(2) + ")";
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 5]);
            ctx.beginPath();
            ctx.moveTo(el.cx, el.cy);
            ctx.lineTo(lx2, ly2);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (el.active > 0) {
            var laserA = Math.min(1.0, el.active / 0.15);
            ctx.strokeStyle = "#FFFF00";
            ctx.shadowBlur = 16;
            ctx.shadowColor = "#FFFF00";
            ctx.lineWidth = 14 * laserA;
            ctx.beginPath();
            ctx.moveTo(el.cx, el.cy);
            ctx.lineTo(lx2, ly2);
            ctx.stroke();
            ctx.strokeStyle = "#FFFFFF";
            ctx.shadowBlur = 0;
            ctx.lineWidth = 4 * laserA;
            ctx.stroke();
        }
        ctx.restore();
    }

    ctx.restore();
    drawBillParticles(ctx);
};
BillGravityChaosPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    // Force-clear lingering elements once past duration
    if (this.elapsed >= this.duration) {
        this.tears = [];
        this.eyeLaser = null;
    }
    return this.elapsed >= this.duration;
};

// 20. billNightmareVortex: Central suction while fire lasers rotate
var BillNightmareVortexPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.5;
    this.elapsed = 0;
    this.damVal = config.damVal || 9;
    this.rotAngle = 0;
};
BillNightmareVortexPattern.prototype = Object.create(BulletPattern.prototype);
BillNightmareVortexPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.rotAngle = 0;
    billParticles = [];
};
BillNightmareVortexPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.rotAngle += 1.2 * dt; // rotation speed of lasers
    updateBillParticles(dt);
    
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    // Suction pull player towards center
    if (typeof Soul !== "undefined" && this.elapsed < this.duration - 0.5) {
        var sPos = Soul.getPos();
        var scx = sPos.x + Soul.getWidth()/2;
        var scy = sPos.y + Soul.getHeight()/2;
        
        var dx = cx - scx;
        var dy = cy - scy;
        var dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 8) {
            var pull = 45 * dt; // pull speed
            sPos.x += (dx / dist) * pull;
            sPos.y += (dy / dist) * pull;
            Soul.setPos(sPos.x, sPos.y);
        }
    }
    
    if (Math.random() < 0.3 && this.elapsed < this.duration - 1) {
        spawnBillParticle(cx + (Math.random() - 0.5) * 80, cy + (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, 2, 0.35, "#FF3300", 6);
    }
};
BillNightmareVortexPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    // 1. Direct collision with center vortex
    var dist = Math.sqrt(Math.pow(scx - cx, 2) + Math.pow(scy - cy, 2));
    if (dist < 20) return this.damVal;
    
    // 2. Collision with 3 rotating laser beams
    for (var k = 0; k < 3; k++) {
        var angle = this.rotAngle + (k * Math.PI * 2 / 3);
        var x2 = cx + Math.cos(angle) * 200;
        var y2 = cy + Math.sin(angle) * 200;
        
        // distance from point to line segment
        var num = Math.abs((y2 - cy)*scx - (x2 - cx)*scy + x2*cy - y2*cx);
        var den = Math.sqrt(Math.pow(y2 - cy, 2) + Math.pow(x2 - cx, 2));
        var d = num / (den || 1);
        if (d < 10) return this.damVal;
    }
    return 0;
};
BillNightmareVortexPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    var cx = (bb[0] + bb[2]) / 2;
    var cy = (bb[1] + bb[3]) / 2;
    
    ctx.save();
    
    // Draw central spinning vortex
    ctx.fillStyle = "#8B0000";
    ctx.strokeStyle = "#FF3300";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#FF0000";
    
    ctx.beginPath();
    ctx.arc(cx, cy, 20 + Math.sin(Date.now() / 80) * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Draw 3 rotating lasers
    ctx.strokeStyle = "#FF3300";
    ctx.lineWidth = 10;
    for (var k = 0; k < 3; k++) {
        var angle = this.rotAngle + (k * Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * 250, cy + Math.sin(angle) * 250);
        ctx.stroke();
    }
    
    // Inner white cores for lasers
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    for (var k = 0; k < 3; k++) {
        var angle = this.rotAngle + (k * Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * 250, cy + Math.sin(angle) * 250);
        ctx.stroke();
    }
    
    ctx.restore();
    drawBillParticles(ctx);
};
BillNightmareVortexPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};

// 21. billArmageddon: Final apocalyptic bullet storm
var BillArmageddonPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 8.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.laserTimer = 0;
    this.damVal = config.damVal || 12;
    this.lasers = []; // { x, warning, active, dir }
};
BillArmageddonPattern.prototype = Object.create(BulletPattern.prototype);
BillArmageddonPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.laserTimer = 0.5;
    this.lasers = [];
    billParticles = [];
};
BillArmageddonPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    this.laserTimer += dt;
    updateBillParticles(dt);
    var bb = Cbbox.getBound();
    
    // Spawn red fireballs falling rapidly
    if (this.spawnTimer >= 0.16 && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        var rx = bb[0] + 15 + Math.random() * (bb[2] - bb[0] - 30);
        this.bullets.push({
            x: rx,
            y: bb[1] - 10,
            vx: -30 + Math.random() * 60,
            vy: 160 + Math.random() * 40,
            width: 12, height: 12,
            active: true
        });
        if (Math.random() < 0.4) {
            Sound.playSound("hit_1", true);
        }
    }
    
    // Spawn sweeping vertical lasers
    if (this.laserTimer >= 1.8 && this.elapsed < this.duration - 1.5) {
        this.laserTimer = 0;
        var rx = bb[0] + 50 + Math.random() * (bb[2] - bb[0] - 100);
        this.lasers.push({
            x: rx,
            warning: 0.7,
            active: 0.6,
            vx: Math.random() > 0.5 ? 40 : -40 // sweeping speed
        });
        Sound.playSound("laser", true);
    }
    
    for (var i = this.lasers.length - 1; i >= 0; i--) {
        var l = this.lasers[i];
        if (l.warning > 0) {
            l.warning -= dt;
        } else {
            l.active -= dt;
            l.x += l.vx * dt; // sweep laser
            if (l.active <= 0) {
                this.lasers.splice(i, 1);
            }
        }
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y > bb[3] + 15) {
            this.bullets.splice(i, 1);
        }
    }
};
BillArmageddonPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var scx = sx + sw/2;
    var scy = sy + sh/2;
    var bb = Cbbox.getBound();
    
    // 1. Check falling fireballs
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active) {
            var dist = Math.sqrt(Math.pow(scx - b.x, 2) + Math.pow(scy - b.y, 2));
            if (dist < 8 + sw/2) return this.damVal;
        }
    }
    
    // 2. Check vertical sweeping lasers
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.warning <= 0) {
            if (Math.abs(scx - l.x) < 14) return this.damVal;
        }
    }
    return 0;
};
BillArmageddonPattern.prototype.draw = function(ctx) {
    var bb = Cbbox.getBound();
    ctx.save();
    
    // Red Armageddon screen glow tint
    ctx.fillStyle = "rgba(255, 0, 0, 0.04)";
    ctx.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
    
    // Draw sweeping lasers
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.warning > 0) {
            ctx.strokeStyle = "rgba(255, 0, 0, 0.35)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(l.x, bb[1]);
            ctx.lineTo(l.x, bb[3]);
            ctx.stroke();
        } else {
            ctx.strokeStyle = "#FF3333";
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#FF0000";
            ctx.lineWidth = 20 * (l.active / 0.6);
            ctx.beginPath();
            ctx.moveTo(l.x, bb[1]);
            ctx.lineTo(l.x, bb[3]);
            ctx.stroke();
            
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 4 * (l.active / 0.6);
            ctx.stroke();
        }
    }
    
    // Draw fireballs
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (!b.active) continue;
        ctx.fillStyle = "#FF4500";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF3300";
        ctx.beginPath();
        ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
    drawBillParticles(ctx);
};
BillArmageddonPattern.prototype.isOver = function() {
    if (this.elapsed >= this.duration + 5) return true;
    return this.elapsed >= this.duration && this.bullets.length === 0 && this.lasers.length === 0;
};
