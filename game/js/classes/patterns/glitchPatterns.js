// glitchPatterns.js — Unified Pattern Library for LA FALLA CRIPTOGRÁFICA (The Glitch / Error 404)
// Renders high-quality pixelated digital anomalies, 7 per phase with at most 2 repeated.
// Entirely fresh mechanics, no circles/waves, maximum visual excellence.

// ============================================================================
// SHARED UTILITIES & DRAWING HELPERS
// ============================================================================
function drawGlitchStatic(ctx, x, y, w, h, density) {
    ctx.save();
    var d = density || 0.25;
    for (var px = 0; px < w; px += 5) {
        for (var py = 0; py < h; py += 5) {
            if (Math.random() < d) {
                ctx.fillStyle = Math.random() < 0.5 ? "#FF00FF" : "#00FFFF";
                ctx.fillRect(x + px, y + py, 5, 5);
            }
        }
    }
    ctx.restore();
}

function drawGlitchText(ctx, text, x, y, font, color, splitAmount) {
    ctx.save();
    ctx.font = font || "20px 'Determination Mono'";
    var clr = color || "#00FF00";
    var split = splitAmount || 3.5;
    
    // RGB split aberration effect
    ctx.fillStyle = "rgba(255, 0, 255, 0.75)";
    ctx.fillText(text, x - split, y);
    ctx.fillStyle = "rgba(0, 255, 255, 0.75)";
    ctx.fillText(text, x + split, y);
    ctx.fillStyle = clr;
    ctx.fillText(text, x, y);
    ctx.restore();
}

function drawErrorBox(ctx, x, y, w, h, title, message) {
    ctx.save();
    // Drop shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(x + 4, y + 4, w, h);
    
    // Main panel
    ctx.fillStyle = "#c0c0c0";
    ctx.strokeStyle = "#808080";
    ctx.lineWidth = 2.0;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    
    // Classic Windows 95 title bar
    var titleBarGrad = ctx.createLinearGradient(x, y, x + w, y);
    titleBarGrad.addColorStop(0, "#000080");
    titleBarGrad.addColorStop(1, "#1080d0");
    ctx.fillStyle = titleBarGrad;
    ctx.fillRect(x + 3, y + 3, w - 6, 16);
    
    ctx.font = "8pt 'Determination Mono'";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(title || "System Error", x + 8, y + 14);
    
    // [X] close button
    ctx.fillStyle = "#c0c0c0";
    ctx.fillRect(x + w - 16, y + 5, 11, 11);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + w - 16, y + 5, 11, 11);
    ctx.fillStyle = "#000";
    ctx.font = "bold 7px Arial";
    ctx.fillText("x", x - 13 + w - 1, y + 13);
    
    // Red error circle icon
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(x + 22, y + 44, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // white cross inside circle
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(x + 18, y + 40); ctx.lineTo(x + 26, y + 48);
    ctx.moveTo(x + 26, y + 40); ctx.lineTo(x + 18, y + 48);
    ctx.stroke();
    
    // Text message
    ctx.fillStyle = "#000000";
    ctx.font = "9pt 'Determination Mono'";
    ctx.fillText(message || "Fatal Error 404", x + 38, y + 44);
    
    // "Aceptar" Button
    var btnW = 54;
    var btnH = 18;
    var btnX = x + w / 2 - btnW / 2;
    var btnY = y + h - 26;
    ctx.fillStyle = "#c0c0c0";
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = "#808080";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = "#000";
    ctx.beginPath(); ctx.moveTo(btnX, btnY + btnH); ctx.lineTo(btnX + btnW, btnY + btnH); ctx.lineTo(btnX + btnW, btnY); ctx.stroke();
    ctx.fillStyle = "#000";
    ctx.font = "8pt 'Determination Mono'";
    ctx.fillText("Aceptar", btnX + 8, btnY + 13);
    
    ctx.restore();
}

function drawPixelSkullForPattern(ctx, cx, cy, scale, chompY) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    
    // Pixel skull map (12x12 grid)
    // 0 = empty, 1 = skull pixel, 2 = eye socket, 3 = nasal cavity
    var grid = [
        [0,0,0,1,1,1,1,1,1,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,2,2,1,1,1,1,2,2,1,1],
        [1,1,2,2,1,1,1,1,2,2,1,1],
        [1,1,1,1,1,3,3,1,1,1,1,1],
        [0,1,1,1,1,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,1,1,1,1,0,0]
    ];
    
    var size = 4; // size of each pixel
    var offsetX = -24; // center the 12-wide grid (12 * 4 / 2 = 24)
    var offsetY = -24;
    
    // Draw skull dome
    for (var r = 0; r < grid.length; r++) {
        for (var c = 0; c < grid[r].length; c++) {
            var val = grid[r][c];
            var px = offsetX + c * size;
            var py = offsetY + r * size;
            if (val === 1) {
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(px, py, size, size);
            } else if (val === 2) {
                ctx.fillStyle = "#000082"; // blue eye sockets for BSOD!
                ctx.fillRect(px, py, size, size);
                ctx.fillStyle = "#FF0055"; // pupil
                ctx.fillRect(px + 1, py + 1, 2, 2);
            } else if (val === 3) {
                ctx.fillStyle = "#000000";
                ctx.fillRect(px, py, size, size);
            }
        }
    }
    
    // Draw moving jaw block with voxel teeth
    ctx.save();
    ctx.translate(0, chompY);
    var jawGrid = [
        [0,0,1,1,4,4,4,4,1,1,0,0],
        [0,0,1,1,0,0,0,0,1,1,0,0],
        [0,0,1,1,1,1,1,1,1,1,0,0]
    ];
    for (var r = 0; r < jawGrid.length; r++) {
        for (var c = 0; c < jawGrid[r].length; c++) {
            var val = jawGrid[r][c];
            var px = offsetX + c * size;
            var py = offsetY + (r + 9) * size;
            if (val === 1) {
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(px, py, size, size);
            } else if (val === 4) {
                ctx.fillStyle = (c % 2 === 0) ? "#FFFFFF" : "#808080";
                ctx.fillRect(px, py, size, size);
            }
        }
    }
    ctx.restore();
    
    ctx.restore();
}

// ============================================================================
// PHASE 1 PATTERNS
// ============================================================================

// 1. glitchErrorWindows (Error Windows)
var GlitchErrorWindowsPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
    this.windows = []; // {x, y, w, h, vx, vy, message}
};
GlitchErrorWindowsPattern.prototype = Object.create(BulletPattern.prototype);
GlitchErrorWindowsPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2;
    this.windows = [];
};
GlitchErrorWindowsPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 0.8 && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        Sound.playSound("hit_1", true);
        var randX = bb[0] + 20 + Math.random() * (bb[2] - bb[0] - 170);
        var randY = bb[1] - 40;
        var messages = ["SYS_CORRUPT", "ERROR_404", "GLITCH_DET", "FILE_MISSING", "MEM_LEAK_40"];
        this.windows.push({
            x: randX,
            y: randY,
            w: 140,
            h: 80,
            vx: (Math.random() - 0.5) * 30,
            vy: 85 + Math.random() * 40,
            message: messages[Math.floor(Math.random() * messages.length)]
        });
    }
    
    for (var i = this.windows.length - 1; i >= 0; i--) {
        var w = this.windows[i];
        w.x += w.vx * dt;
        w.y += w.vy * dt;
        if (w.y > bb[3]) {
            this.windows.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
GlitchErrorWindowsPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.windows.length; i++) {
        var w = this.windows[i];
        if (rectsOverlap(w.x, w.y, w.w, w.h, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    return 0;
};
GlitchErrorWindowsPattern.prototype.draw = function(ctx) {
    ctx.save();
    var t = Date.now() / 1000;
    
    // Scanline overlay across entire battle area
    var bb = Cbbox.getBound();
    ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
    for (var sl = bb[1]; sl < bb[3]; sl += 3) {
        ctx.fillRect(bb[0], sl, bb[2] - bb[0], 1);
    }
    
    for (var i = 0; i < this.windows.length; i++) {
        var w = this.windows[i];
        
        // RGB chromatic aberration ghost behind each window
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(w.x - 4, w.y - 1, w.w, w.h);
        ctx.fillStyle = "#0000FF";
        ctx.fillRect(w.x + 4, w.y + 1, w.w, w.h);
        ctx.globalAlpha = 1.0;
        
        // Main error box
        drawErrorBox(ctx, w.x, w.y, w.w, w.h, "Critical Error", w.message);
        
        // Glitch corruption pixels around each window
        for (var p = 0; p < 6; p++) {
            var px = w.x + Math.random() * w.w;
            var py = w.y + Math.random() * w.h;
            ctx.fillStyle = Math.random() < 0.5 ? "#FF00FF" : "#00FFFF";
            ctx.fillRect(px, py, Math.random() * 8 + 2, 2);
        }
        
        // Neon shadow glow under window
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#FF0055";
        ctx.strokeStyle = "rgba(255, 0, 85, " + (0.3 + Math.sin(t * 8 + i) * 0.2).toFixed(2) + ")";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(w.x - 1, w.y - 1, w.w + 2, w.h + 2);
        ctx.shadowBlur = 0;
    }
    
    // Floating error text fragments
    if (this.windows.length > 0) {
        ctx.font = "7px 'Determination Mono'";
        ctx.globalAlpha = 0.25;
        var errTexts = ["FATAL", "0xDEAD", "SEGFAULT", "ERR_404", "CRITICAL"];
        for (var e = 0; e < 4; e++) {
            var ex = bb[0] + Math.sin(t * 2 + e * 1.7) * (bb[2] - bb[0]) * 0.4 + (bb[2] - bb[0]) * 0.5;
            var ey = bb[1] + ((t * 30 + e * 40) % (bb[3] - bb[1]));
            ctx.fillStyle = "#00FF00";
            ctx.fillText(errTexts[e % errTexts.length], ex, ey);
        }
        ctx.globalAlpha = 1.0;
    }
    
    ctx.restore();
};
GlitchErrorWindowsPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.windows.length === 0;
};

// 2. glitchMissingTexture (Missing Texture Checkers)
var GlitchMissingTexturePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 9;
    this.blocks = []; // {x, y, size, warning, active, type}
};
GlitchMissingTexturePattern.prototype = Object.create(BulletPattern.prototype);
GlitchMissingTexturePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.15;
    this.blocks = [];
};
GlitchMissingTexturePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 0.75 && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        var rx = bb[0] + 15 + Math.random() * (bb[2] - bb[0] - 50);
        var ry = bb[1] + 15 + Math.random() * (bb[3] - bb[1] - 50);
        this.blocks.push({
            x: rx,
            y: ry,
            size: 32,
            warning: 0.6,
            active: 0.35,
            type: Math.random() < 0.5 ? 'H' : 'V'
        });
    }
    
    for (var i = this.blocks.length - 1; i >= 0; i--) {
        var b = this.blocks[i];
        if (b.warning > 0) {
            b.warning -= dt;
            if (b.warning <= 0) {
                Sound.playSound("impact", true);
            }
        } else {
            b.active -= dt;
            if (b.active <= 0) {
                this.blocks.splice(i, 1);
            }
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
GlitchMissingTexturePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    for (var i = 0; i < this.blocks.length; i++) {
        var b = this.blocks[i];
        if (b.warning <= 0 && b.active > 0) {
            // Erupts into full glitch beam
            if (b.type === 'H') {
                if (rectsOverlap(bb[0], b.y, bb[2] - bb[0], b.size, sx, sy, sw, sh)) return this.damVal;
            } else {
                if (rectsOverlap(b.x, bb[1], b.size, bb[3] - bb[1], sx, sy, sw, sh)) return this.damVal;
            }
        } else if (b.warning > 0) {
            // Initial bounding box collision
            if (rectsOverlap(b.x, b.y, b.size, b.size, sx, sy, sw, sh)) return this.damVal - 2;
        }
    }
    return 0;
};
GlitchMissingTexturePattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var t = Date.now() / 1000;
    
    for (var i = 0; i < this.blocks.length; i++) {
        var b = this.blocks[i];
        if (b.warning > 0) {
            // RGB split aberration on the checker box
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = "#FF0000";
            ctx.fillRect(b.x - 3, b.y, b.size, b.size);
            ctx.fillStyle = "#00FFFF";
            ctx.fillRect(b.x + 3, b.y, b.size, b.size);
            ctx.globalAlpha = 1.0;
            
            // Renders checkered black and magenta ("Missing Texture") box
            for (var dx = 0; dx < b.size; dx += 8) {
                for (var dy = 0; dy < b.size; dy += 8) {
                    ctx.fillStyle = ((dx + dy) % 16 === 0) ? "#FF00FF" : "#000000";
                    ctx.fillRect(b.x + dx, b.y + dy, 8, 8);
                }
            }
            
            // "MISSING" text label
            ctx.font = "bold 6px Courier";
            ctx.fillStyle = "#FFFF00";
            ctx.shadowBlur = 4;
            ctx.shadowColor = "#FFFF00";
            ctx.fillText("MISSING", b.x + 2, b.y - 4);
            ctx.shadowBlur = 0;
            
            // Warning border outline with enhanced glow
            ctx.strokeStyle = "rgba(255, 0, 255, " + (Math.sin(t * 12) * 0.4 + 0.6).toFixed(2) + ")";
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#FF00FF";
            ctx.strokeRect(b.x - 2, b.y - 2, b.size + 4, b.size + 4);
            ctx.shadowBlur = 0;
            
            // Diagonal scanlines across checker
            ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
            ctx.lineWidth = 1;
            for (var sl = 0; sl < b.size * 2; sl += 4) {
                ctx.beginPath();
                ctx.moveTo(b.x + sl, b.y);
                ctx.lineTo(b.x, b.y + sl);
                ctx.stroke();
            }
        } else if (b.active > 0) {
            // Enhanced beam with glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#FF00FF";
            
            if (b.type === 'H') {
                drawGlitchStatic(ctx, bb[0], b.y, bb[2] - bb[0], b.size, 0.4);
                // Neon edge lines
                ctx.fillStyle = "rgba(0, 255, 255, 0.6)";
                ctx.fillRect(bb[0], b.y, bb[2] - bb[0], 1);
                ctx.fillRect(bb[0], b.y + b.size - 1, bb[2] - bb[0], 1);
                // Error text on beam
                ctx.font = "bold 7px Courier";
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("ERR_TEXTURE_NULL", bb[0] + 10 + Math.sin(t * 6) * 20, b.y + b.size / 2 + 3);
            } else {
                drawGlitchStatic(ctx, b.x, bb[1], b.size, bb[3] - bb[1], 0.4);
                ctx.fillStyle = "rgba(0, 255, 255, 0.6)";
                ctx.fillRect(b.x, bb[1], 1, bb[3] - bb[1]);
                ctx.fillRect(b.x + b.size - 1, bb[1], 1, bb[3] - bb[1]);
            }
            ctx.shadowBlur = 0;
        }
    }
    ctx.restore();
};
GlitchMissingTexturePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.blocks.length === 0;
};

// 3. glitchCodeRain (Cascading Green/Red streams)
var GlitchCodeRainPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
    this.columns = []; // {x, y, speed, length, chars: {char, isRed}[]}
};
GlitchCodeRainPattern.prototype = Object.create(BulletPattern.prototype);
GlitchCodeRainPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.1;
    this.columns = [];
};
GlitchCodeRainPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 0.28 && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        var rx = bb[0] + 10 + Math.random() * (bb[2] - bb[0] - 25);
        var length = 5 + Math.floor(Math.random() * 6);
        var chars = [];
        for (var c = 0; c < length; c++) {
            chars.push({
                char: Math.random() < 0.5 ? "0" : "1",
                isRed: Math.random() < 0.26
            });
        }
        this.columns.push({
            x: rx,
            y: bb[1] - 15 * length,
            speed: 130 + Math.random() * 60,
            length: length,
            chars: chars
        });
    }
    
    for (var i = this.columns.length - 1; i >= 0; i--) {
        var col = this.columns[i];
        col.y += col.speed * dt;
        
        // Dynamically toggle chars
        if (Math.random() < 0.2) {
            for (var c = 0; c < col.chars.length; c++) {
                col.chars[c].char = Math.random() < 0.5 ? "0" : "1";
            }
        }
        
        if (col.y > bb[3] + 15 * col.length) {
            this.columns.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
GlitchCodeRainPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.columns.length; i++) {
        var col = this.columns[i];
        for (var c = 0; c < col.chars.length; c++) {
            var cy = col.y - c * 15;
            var charObj = col.chars[c];
            if (charObj.isRed && rectsOverlap(col.x - 4, cy - 10, 10, 12, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }
    return 0;
};
GlitchCodeRainPattern.prototype.draw = function(ctx) {
    ctx.save();
    var t = Date.now() / 1000;
    var bb = Cbbox.getBound();
    
    // Background matrix effect — faint column lines
    ctx.strokeStyle = "rgba(0, 255, 102, 0.04)";
    ctx.lineWidth = 1;
    for (var mx = bb[0] + 8; mx < bb[2]; mx += 16) {
        ctx.beginPath();
        ctx.moveTo(mx, bb[1]);
        ctx.lineTo(mx, bb[3]);
        ctx.stroke();
    }
    
    // Scanlines
    ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
    for (var sl = bb[1]; sl < bb[3]; sl += 2) {
        ctx.fillRect(bb[0], sl, bb[2] - bb[0], 1);
    }
    
    ctx.font = "12px 'Determination Mono'";
    ctx.textAlign = "center";
    
    for (var i = 0; i < this.columns.length; i++) {
        var col = this.columns[i];
        for (var c = 0; c < col.chars.length; c++) {
            var cy = col.y - c * 15;
            var charObj = col.chars[c];
            
            // Fade older characters (trail effect)
            var fadeAlpha = Math.max(0.2, 1.0 - c * 0.1);
            
            if (charObj.isRed) {
                // Dangerous red chars with strong glow
                ctx.fillStyle = "rgba(255, 0, 85, " + fadeAlpha.toFixed(2) + ")";
                ctx.shadowBlur = 12;
                ctx.shadowColor = "#FF0055";
                
                // RGB split on red chars
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = "#FF0000";
                ctx.fillText(charObj.char, col.x - 2, cy);
                ctx.fillStyle = "#0000FF";
                ctx.fillText(charObj.char, col.x + 2, cy);
                ctx.globalAlpha = fadeAlpha;
                ctx.fillStyle = "#FF0055";
            } else {
                ctx.fillStyle = "rgba(0, 255, 102, " + fadeAlpha.toFixed(2) + ")";
                ctx.shadowBlur = 4;
                ctx.shadowColor = "#00FF66";
                ctx.globalAlpha = fadeAlpha;
            }
            ctx.fillText(charObj.char, col.x, cy);
            ctx.globalAlpha = 1.0;
        }
        
        // Bright head character glow
        if (col.chars.length > 0) {
            ctx.fillStyle = "#FFFFFF";
            ctx.shadowBlur = 16;
            ctx.shadowColor = "#00FF66";
            ctx.globalAlpha = 0.9;
            ctx.fillText(col.chars[0].char, col.x, col.y);
            ctx.globalAlpha = 1.0;
        }
    }
    
    ctx.shadowBlur = 0;
    ctx.restore();
};
GlitchCodeRainPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.columns.length === 0;
};

// 4. glitchCoordinateWarp (Grid pull & coordinate tag sweeps)
var GlitchCoordinateWarpPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
};
GlitchCoordinateWarpPattern.prototype = Object.create(BulletPattern.prototype);
GlitchCoordinateWarpPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2;
    this.bullets = [];
};
GlitchCoordinateWarpPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    // Push the player's soul horizontally in a sine wave force!
    if (typeof Soul !== "undefined" && Soul.getPos && Soul.x !== undefined) {
        var waveForce = Math.sin(this.elapsed * 4.0) * 130 * dt;
        Soul.x += waveForce;
    }
    
    // Spawn coordinate tag bullets from edges
    if (this.spawnTimer >= 0.45 && this.elapsed < this.duration - 0.8) {
        this.spawnTimer = 0;
        Sound.playSound("hit_1", true);
        var side = Math.random() < 0.5 ? 'L' : 'R';
        var ry = bb[1] + 15 + Math.random() * (bb[3] - bb[1] - 30);
        var b = new Bullet({
            x: side === 'L' ? bb[0] - 15 : bb[2] + 15,
            y: ry,
            width: 16,
            height: 16,
            speed: 160,
            damVal: this.damVal,
            color: "#00FFFF",
            vx: side === 'L' ? 160 : -160,
            vy: 0,
            useVelocity: true
        });
        b.text = Math.random() < 0.5 ? "X" : "Y";
        this.bullets.push(b);
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        if (b.isOutOfBounds(bb)) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
GlitchCoordinateWarpPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    return 0;
};
GlitchCoordinateWarpPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var t = Date.now() / 1000;
    
    // Distortion grid with color shifts
    var shear = Math.sin(this.elapsed * 4.0) * 22;
    
    // Red channel grid offset
    ctx.strokeStyle = "rgba(255, 0, 0, 0.08)";
    ctx.lineWidth = 1.0;
    for (var x = bb[0] + 15; x < bb[2]; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x - shear - 2, bb[1]);
        ctx.lineTo(x + shear - 2, bb[3]);
        ctx.stroke();
    }
    // Cyan channel grid
    ctx.strokeStyle = "rgba(0, 255, 255, 0.12)";
    for (var x = bb[0] + 15; x < bb[2]; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x - shear + 2, bb[1]);
        ctx.lineTo(x + shear + 2, bb[3]);
        ctx.stroke();
    }
    // Main green grid
    ctx.strokeStyle = "rgba(0, 255, 255, 0.18)";
    for (var x = bb[0] + 15; x < bb[2]; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x - shear, bb[1]);
        ctx.lineTo(x + shear, bb[3]);
        ctx.stroke();
    }
    for (var y = bb[1] + 15; y < bb[3]; y += 30) {
        ctx.beginPath();
        ctx.moveTo(bb[0], y);
        ctx.lineTo(bb[2], y);
        ctx.stroke();
    }
    
    // Coordinate numbers along edges
    ctx.font = "6px Courier";
    ctx.fillStyle = "rgba(0, 255, 255, 0.3)";
    for (var x = bb[0] + 15; x < bb[2]; x += 30) {
        ctx.fillText(Math.floor(x).toString(), x - 8, bb[1] + 8);
    }
    for (var y = bb[1] + 15; y < bb[3]; y += 30) {
        ctx.fillText(Math.floor(y).toString(), bb[0] + 3, y + 3);
    }
    
    // Draw coordinate label tag bullets with enhanced effects
    ctx.font = "bold 9pt Courier";
    ctx.textAlign = "center";
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        
        // Motion trail
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = "#FF00FF";
        var trailDir = b.vx > 0 ? -1 : 1;
        for (var tr = 1; tr <= 3; tr++) {
            ctx.fillRect(b.x + trailDir * tr * 6, b.y, b.width, b.height);
        }
        ctx.globalAlpha = 1.0;
        
        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FF00FF";
        ctx.fillStyle = "#FF00FF";
        ctx.fillRect(b.x, b.y, b.width, b.height);
        
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(b.x, b.y, b.width, b.height);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(b.text || "X", b.x + 8, b.y + 12);
    }
    
    // Warp distortion label
    if (this.bullets.length > 0) {
        ctx.font = "bold 7px Courier";
        ctx.fillStyle = "rgba(255, 0, 255, " + (0.3 + Math.sin(t * 6) * 0.2).toFixed(2) + ")";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#FF00FF";
        drawGlitchText(ctx, "COORDINATE_WARP", bb[0] + (bb[2] - bb[0]) / 2 - 40, bb[1] + 12, "bold 7px Courier", "#FF00FF", 2);
        ctx.shadowBlur = 0;
    }
    
    ctx.restore();
};
GlitchCoordinateWarpPattern.prototype.isOver = function() {
    var over = this.elapsed >= this.duration;
    if (over) {
        this.bullets = [];
    }
    return over;
};

// 5. glitchFlickerShards (Pixels zooming in)
var GlitchFlickerShardsPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
};
GlitchFlickerShardsPattern.prototype = Object.create(BulletPattern.prototype);
GlitchFlickerShardsPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.1;
};
GlitchFlickerShardsPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 0.26 && this.elapsed < this.duration - 0.8) {
        this.spawnTimer = 0;
        Sound.playSound("hit_1", true);
        var dir = Math.random() * Math.PI * 2;
        var startDist = 180;
        var cX = bb[0] + (bb[2] - bb[0])/2;
        var cY = bb[1] + (bb[3] - bb[1])/2;
        
        var bullet = new Bullet({
            x: cX + Math.cos(dir) * startDist,
            y: cY + Math.sin(dir) * startDist,
            width: 10,
            height: 10,
            speed: 155,
            damVal: this.damVal,
            color: "#FF00FF",
            vx: -Math.cos(dir) * 155,
            vy: -Math.sin(dir) * 155,
            useVelocity: true
        });
        // custom properties for flicker
        bullet.flickerTime = 0;
        bullet.visible = true;
        this.bullets.push(bullet);
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.flickerTime += dt;
        if (b.flickerTime >= 0.12) {
            b.flickerTime = 0;
            b.visible = !b.visible;
        }
        b.progressMovement(dt);
        if (b.isOutOfBounds(bb)) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
GlitchFlickerShardsPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && b.visible) {
            if (rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }
    return 0;
};
GlitchFlickerShardsPattern.prototype.draw = function(ctx) {
    ctx.save();
    var t = Date.now() / 1000;
    var bb = Cbbox.getBound();
    var cX = bb[0] + (bb[2] - bb[0]) / 2;
    var cY = bb[1] + (bb[3] - bb[1]) / 2;
    
    // Convergence indicator — pulsing rings at center
    if (this.bullets.length > 0) {
        ctx.strokeStyle = "rgba(255, 0, 255, " + (0.08 + Math.sin(t * 4) * 0.05).toFixed(2) + ")";
        ctx.lineWidth = 1;
        for (var r = 20; r < 180; r += 30) {
            ctx.beginPath();
            ctx.arc(cX, cY, r + Math.sin(t * 3) * 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.visible) {
            // Directional trail
            var dirX = b.vx !== undefined ? -Math.sign(b.vx) : 0;
            var dirY = b.vy !== undefined ? -Math.sign(b.vy) : 0;
            ctx.globalAlpha = 0.12;
            ctx.fillStyle = "#FF00FF";
            for (var tr = 1; tr <= 4; tr++) {
                ctx.fillRect(b.x + dirX * tr * 5, b.y + dirY * tr * 5, b.width, b.height);
            }
            ctx.globalAlpha = 1.0;
            
            // Main shard with intense glow
            ctx.fillStyle = "#FF00FF";
            ctx.shadowBlur = 14;
            ctx.shadowColor = "#FF00FF";
            ctx.fillRect(b.x, b.y, b.width, b.height);
            
            // Inner bright core
            ctx.fillStyle = "#FFFFFF";
            ctx.shadowBlur = 0;
            ctx.fillRect(b.x + 2, b.y + 2, b.width - 4, b.height - 4);
            
            // RGB aberration on shard
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = "#FF0000";
            ctx.fillRect(b.x - 2, b.y, b.width, b.height);
            ctx.fillStyle = "#0000FF";
            ctx.fillRect(b.x + 2, b.y, b.width, b.height);
            ctx.globalAlpha = 1.0;
        } else {
            // Ghost outline when invisible (flickering)
            ctx.strokeStyle = "rgba(255, 0, 255, 0.1)";
            ctx.lineWidth = 1;
            ctx.strokeRect(b.x, b.y, b.width, b.height);
        }
    }
    ctx.restore();
};
GlitchFlickerShardsPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 6. glitchStaticBarrier (Closing static & crossing scan lasers)
var GlitchStaticBarrierPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.laserTimer = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 9;
    this.lasers = []; // { y, warning, active }
};
GlitchStaticBarrierPattern.prototype = Object.create(BulletPattern.prototype);
GlitchStaticBarrierPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.laserTimer = 0.2;
    this.spawnTimer = 0;
    this.lasers = [];
    this.bullets = [];
};
GlitchStaticBarrierPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.laserTimer += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    // Barrier width closes in over time
    var widthScale = Math.min(80, this.elapsed * 12);
    var safeX1 = bb[0] + widthScale;
    var safeX2 = bb[2] - widthScale;
    
    // Trigger horizontal lasers to jump over
    if (this.laserTimer >= 1.2 && this.elapsed < this.duration - 1.0) {
        this.laserTimer = 0;
        var ry = bb[1] + 15 + Math.random() * (bb[3] - bb[1] - 30);
        this.lasers.push({ y: ry, warning: 0.5, active: 0.25 });
    }
    
    // Spawn falling binary code rain in the safe zone
    if (this.spawnTimer >= 0.32 && this.elapsed < this.duration - 0.8) {
        this.spawnTimer = 0;
        var rx = safeX1 + Math.random() * (safeX2 - safeX1 - 10);
        this.bullets.push(new Bullet({
            x: rx,
            y: bb[1] - 10,
            width: 8,
            height: 8,
            speed: 130,
            damVal: this.damVal - 2,
            color: "#00FF66",
            vx: 0,
            vy: 130,
            useVelocity: true
        }));
    }
    
    // Update lasers
    for (var i = this.lasers.length - 1; i >= 0; i--) {
        var l = this.lasers[i];
        if (l.warning > 0) {
            l.warning -= dt;
            if (l.warning <= 0) {
                Sound.playSound("laser", true);
            }
        } else {
            l.active -= dt;
            if (l.active <= 0) {
                this.lasers.splice(i, 1);
            }
        }
    }
    
    // Update bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        if (b.isOutOfBounds(bb)) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
GlitchStaticBarrierPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    var widthScale = Math.min(80, this.elapsed * 12);
    
    // Left/Right barrier collision
    if (rectsOverlap(bb[0], bb[1], widthScale, bb[3] - bb[1], sx, sy, sw, sh)) return this.damVal;
    if (rectsOverlap(bb[2] - widthScale, bb[1], widthScale, bb[3] - bb[1], sx, sy, sw, sh)) return this.damVal;
    
    // Laser collisions
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.warning <= 0 && l.active > 0) {
            if (rectsOverlap(bb[0], l.y - 4, bb[2] - bb[0], 8, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }
    
    // Bullet collisions
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
            return b.damVal;
        }
    }
    
    return 0;
};
GlitchStaticBarrierPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var t = Date.now() / 1000;
    var widthScale = Math.min(80, this.elapsed * 12);
    
    if (widthScale > 4) {
        // Draw left static wall with gradient edge
        drawGlitchStatic(ctx, bb[0], bb[1], widthScale, bb[3] - bb[1], 0.35);
        drawGlitchStatic(ctx, bb[2] - widthScale, bb[1], widthScale, bb[3] - bb[1], 0.35);
        
        // Gradient fading edge on inner boundary
        var leftGrad = ctx.createLinearGradient(bb[0] + widthScale - 15, 0, bb[0] + widthScale + 5, 0);
        leftGrad.addColorStop(0, "rgba(0, 255, 255, 0.3)");
        leftGrad.addColorStop(1, "rgba(0, 255, 255, 0)");
        ctx.fillStyle = leftGrad;
        ctx.fillRect(bb[0] + widthScale - 15, bb[1], 20, bb[3] - bb[1]);
        
        var rightGrad = ctx.createLinearGradient(bb[2] - widthScale + 15, 0, bb[2] - widthScale - 5, 0);
        rightGrad.addColorStop(0, "rgba(0, 255, 255, 0.3)");
        rightGrad.addColorStop(1, "rgba(0, 255, 255, 0)");
        ctx.fillStyle = rightGrad;
        ctx.fillRect(bb[2] - widthScale - 5, bb[1], 20, bb[3] - bb[1]);
        
        // Neon edge lines with glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00FFFF";
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bb[0] + widthScale, bb[1]); ctx.lineTo(bb[0] + widthScale, bb[3]);
        ctx.moveTo(bb[2] - widthScale, bb[1]); ctx.lineTo(bb[2] - widthScale, bb[3]);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // "BARRIER" text on walls
        ctx.save();
        ctx.font = "bold 7px Courier";
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.translate(bb[0] + widthScale / 2, bb[1] + (bb[3] - bb[1]) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("STATIC_WALL", -30, 3);
        ctx.restore();
        
        ctx.save();
        ctx.font = "bold 7px Courier";
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.translate(bb[2] - widthScale / 2, bb[1] + (bb[3] - bb[1]) / 2);
        ctx.rotate(Math.PI / 2);
        ctx.fillText("STATIC_WALL", -30, 3);
        ctx.restore();
    }
    
    // Draw lasers with enhanced effects
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.warning > 0) {
            // Pulsing warning line
            ctx.strokeStyle = "rgba(255, 0, 255, " + (0.2 + Math.sin(t * 15) * 0.25).toFixed(2) + ")";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(bb[0], l.y); ctx.lineTo(bb[2], l.y);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Warning triangles
            ctx.fillStyle = "rgba(255, 204, 0, 0.6)";
            ctx.font = "bold 8px Courier";
            ctx.fillText("⚠", bb[0] + 5, l.y + 3);
            ctx.fillText("⚠", bb[2] - 15, l.y + 3);
        } else if (l.active > 0) {
            // Outer glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#FF00FF";
            ctx.fillStyle = "rgba(255, 0, 255, 0.85)";
            ctx.fillRect(bb[0], l.y - 4, bb[2] - bb[0], 8);
            // Inner bright core
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(bb[0], l.y - 1, bb[2] - bb[0], 2);
            ctx.shadowBlur = 0;
            
            // RGB split on laser
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = "#FF0000";
            ctx.fillRect(bb[0], l.y - 6, bb[2] - bb[0], 3);
            ctx.fillStyle = "#0000FF";
            ctx.fillRect(bb[0], l.y + 3, bb[2] - bb[0], 3);
            ctx.globalAlpha = 1.0;
        }
    }
    
    // Draw bullets with glow
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        ctx.shadowBlur = 6;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
        // Bright core
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(b.x + 2, b.y + 2, b.width - 4, b.height - 4);
    }
    ctx.shadowBlur = 0;
    
    ctx.restore();
};
GlitchStaticBarrierPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};

// 7. glitchSpamWarning (Warning explosions)
var GlitchSpamWarningPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 9;
    this.warnings = []; // {x, y, timer, detonated}
};
GlitchSpamWarningPattern.prototype = Object.create(BulletPattern.prototype);
GlitchSpamWarningPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2;
    this.warnings = [];
};
GlitchSpamWarningPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 0.72 && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        var rx = bb[0] + 30 + Math.random() * (bb[2] - bb[0] - 60);
        var ry = bb[1] + 20 + Math.random() * (bb[3] - bb[1] - 40);
        this.warnings.push({
            x: rx,
            y: ry,
            timer: 0.65,
            detonated: false
        });
    }
    
    for (var i = this.warnings.length - 1; i >= 0; i--) {
        var w = this.warnings[i];
        if (w.timer > 0) {
            w.timer -= dt;
            if (w.timer <= 0) {
                w.detonated = true;
                Sound.playSound("hit_2_crit", true);
                
                // Explode shards in 4 cardinal directions
                var speeds = [
                    {vx: 130, vy: 0},
                    {vx: -130, vy: 0},
                    {vx: 0, vy: 130},
                    {vx: 0, vy: -130}
                ];
                for (var d = 0; d < 4; d++) {
                    var s = speeds[d];
                    this.bullets.push(new Bullet({
                        x: w.x,
                        y: w.y,
                        width: 8,
                        height: 8,
                        speed: 130,
                        damVal: this.damVal - 2,
                        color: "#FFCC00",
                        vx: s.vx,
                        vy: s.vy,
                        useVelocity: true
                    }));
                }
                this.warnings.splice(i, 1);
            }
        }
    }
    
    // Update normal bullets
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        if (b.isOutOfBounds(bb)) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
GlitchSpamWarningPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.warnings.length; i++) {
        var w = this.warnings[i];
        if (!w.detonated && rectsOverlap(w.x - 12, w.y - 12, 24, 24, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
            return b.damVal;
        }
    }
    return 0;
};
GlitchSpamWarningPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.warnings.length; i++) {
        var w = this.warnings[i];
        // Draw triangular warning icon with pulsing yellow glow
        var pulse = Math.sin(Date.now() / 40) * 0.2 + 0.8;
        ctx.fillStyle = "rgba(255, 204, 0, " + pulse.toFixed(2) + ")";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FFCC00";
        
        ctx.beginPath();
        ctx.moveTo(w.x, w.y - 14);
        ctx.lineTo(w.x + 14, w.y + 10);
        ctx.lineTo(w.x - 14, w.y + 10);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = "#000000";
        ctx.font = "bold 10px Courier";
        ctx.fillText("!", w.x - 3, w.y + 6);
    }
    // Draw bullets
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        ctx.fillStyle = "#FFCC00";
        ctx.fillRect(b.x, b.y, b.width, b.height);
    }
    ctx.restore();
};
GlitchSpamWarningPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.warnings.length === 0 && this.bullets.length === 0;
};

// ============================================================================
// PHASE 2 PATTERNS
// ============================================================================

// 8. glitchBBoxMorph (Morphing Arena)
var GlitchBBoxMorphPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 9;
};
GlitchBBoxMorphPattern.prototype = Object.create(BulletPattern.prototype);
GlitchBBoxMorphPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
};
GlitchBBoxMorphPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    // Smoothly interpolate size of battle box in real-time!
    if (typeof Cbbox !== "undefined" && Cbbox.setSize) {
        var newW = 340 + Math.sin(this.elapsed * 2.5) * 160;
        var newH = 140 + Math.cos(this.elapsed * 2.5) * 45;
        Cbbox.setSize(Math.floor(newW), Math.floor(newH), false);
    }
    
    // Spawn bouncing red nodes inside box
    if (this.spawnTimer >= 0.5 && this.elapsed < this.duration - 0.8) {
        this.spawnTimer = 0;
        var cX = bb[0] + (bb[2] - bb[0])/2;
        var cY = bb[1] + (bb[3] - bb[1])/2;
        var a = Math.random() * Math.PI * 2;
        this.bullets.push(new Bullet({
            x: cX,
            y: cY,
            width: 8,
            height: 8,
            speed: 120,
            damVal: this.damVal,
            color: "#FF0055",
            vx: Math.cos(a) * 120,
            vy: Math.sin(a) * 120,
            useVelocity: true
        }));
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        
        // Custom bounce within the dynamic morphing bounding box!
        if (b.x <= bb[0] + 2) { b.x = bb[0] + 3; b.vx = -b.vx; }
        if (b.x >= bb[2] - b.width - 2) { b.x = bb[2] - b.width - 3; b.vx = -b.vx; }
        if (b.y <= bb[1] + 2) { b.y = bb[1] + 3; b.vy = -b.vy; }
        if (b.y >= bb[3] - b.height - 2) { b.y = bb[3] - b.height - 3; b.vy = -b.vy; }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
GlitchBBoxMorphPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    return 0;
};
GlitchBBoxMorphPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        ctx.fillStyle = "#FF0055";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#FF0055";
        ctx.fillRect(b.x, b.y, b.width, b.height);
    }
    ctx.restore();
};
GlitchBBoxMorphPattern.prototype.isOver = function() {
    var over = this.elapsed >= this.duration;
    if (over) {
        this.bullets = [];
        if (typeof Cbbox !== "undefined" && Cbbox.setSize) {
            // Restore normal bounds
            Cbbox.setSize(574, 140, false);
        }
    }
    return over;
};

// 9. glitchDualSoul (Duplicate Player Soul)
var GlitchDualSoulPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
};
GlitchDualSoulPattern.prototype = Object.create(BulletPattern.prototype);
GlitchDualSoulPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
    
    // Enable mirror soul configuration in player/soul!
    if (typeof Soul !== "undefined") {
        Soul.dualActive = true;
    }
};
GlitchDualSoulPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    // Spawn floating popups to dodge
    if (this.spawnTimer >= 0.9 && this.elapsed < this.duration - 1.0) {
        this.spawnTimer = 0;
        var rX = bb[0] + 50 + Math.random() * (bb[2] - bb[0] - 100);
        this.bullets.push(new Bullet({
            x: rX,
            y: bb[1] - 15,
            width: 14,
            height: 14,
            speed: 120,
            damVal: this.damVal,
            color: "#00FFFF",
            vx: 0,
            vy: 110,
            useVelocity: true
        }));
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        if (b.isOutOfBounds(bb)) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
GlitchDualSoulPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    // Check main soul
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    
    // Check mirror soul (if it exists)
    if (typeof Soul !== "undefined" && Soul.dualActive && Soul.getMirrorPos) {
        var mPos = Soul.getMirrorPos();
        for (var i = 0; i < this.bullets.length; i++) {
            var b = this.bullets[i];
            if (b.active && rectsOverlap(b.x, b.y, b.width, b.height, mPos.x - 8, mPos.y - 8, 16, 16)) {
                return this.damVal;
            }
        }
    }
    return 0;
};
GlitchDualSoulPattern.prototype.draw = function(ctx) {
    ctx.save();
    // Render custom mirror soul indicator
    if (typeof Soul !== "undefined" && Soul.dualActive && Soul.getMirrorPos) {
        var mPos = Soul.getMirrorPos();
        ctx.fillStyle = "#00FFFF"; // Mirror soul glows Cyan!
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#00FFFF";
        
        ctx.beginPath();
        ctx.moveTo(mPos.x, mPos.y - 8);
        ctx.bezierCurveTo(mPos.x - 9, mPos.y - 12, mPos.x - 12, mPos.y - 3, mPos.x, mPos.y + 8);
        ctx.bezierCurveTo(mPos.x + 12, mPos.y - 3, mPos.x + 9, mPos.y - 12, mPos.x, mPos.y - 8);
        ctx.closePath();
        ctx.fill();
    }
    
    // Draw bullets
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        ctx.fillStyle = "#00FFFF";
        ctx.fillRect(b.x, b.y, b.width, b.height);
    }
    ctx.restore();
};
GlitchDualSoulPattern.prototype.isOver = function() {
    var over = this.elapsed >= this.duration && this.bullets.length === 0;
    if (over && typeof Soul !== "undefined") {
        Soul.dualActive = false; // Restore single soul
    }
    return over;
};

// 10. glitchRGBVectorSplit (RGB chromatic aberration lasers)
var GlitchRGBVectorSplitPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.laserTimer = 0;
    this.damVal = config.damVal || 9;
    this.lasers = []; // { x, warning, active, colorIndex: 0(R)|1(G)|2(B) }
};
GlitchRGBVectorSplitPattern.prototype = Object.create(BulletPattern.prototype);
GlitchRGBVectorSplitPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.laserTimer = 0.2;
    this.lasers = [];
};
GlitchRGBVectorSplitPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.laserTimer += dt;
    var bb = Cbbox.getBound();
    
    if (this.laserTimer >= 1.1 && this.elapsed < this.duration - 1.0) {
        this.laserTimer = 0;
        var rx = bb[0] + 50 + Math.random() * (bb[2] - bb[0] - 100);
        // Spawn 3 coordinate component lasers
        this.lasers.push({ x: rx - 20, warning: 0.6, active: 0.25, color: "#FF0000" }); // RED split left
        this.lasers.push({ x: rx,      warning: 0.6, active: 0.25, color: "#00FF00" }); // GREEN center
        this.lasers.push({ x: rx + 20, warning: 0.6, active: 0.25, color: "#0000FF" }); // BLUE split right
    }
    
    for (var i = this.lasers.length - 1; i >= 0; i--) {
        var l = this.lasers[i];
        if (l.warning > 0) {
            l.warning -= dt;
            if (l.warning <= 0) {
                Sound.playSound("laser", true);
            }
        } else {
            l.active -= dt;
            if (l.active <= 0) {
                this.lasers.splice(i, 1);
            }
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
GlitchRGBVectorSplitPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.warning <= 0 && l.active > 0) {
            if (rectsOverlap(l.x - 5, bb[1], 10, bb[3] - bb[1], sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }
    return 0;
};
GlitchRGBVectorSplitPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.warning > 0) {
            ctx.strokeStyle = l.color;
            ctx.globalAlpha = 0.2;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(l.x, bb[1]);
            ctx.lineTo(l.x, bb[3]);
            ctx.stroke();
        } else if (l.active > 0) {
            ctx.fillStyle = l.color;
            ctx.globalAlpha = 0.75;
            ctx.fillRect(l.x - 5, bb[1], 10, bb[3] - bb[1]);
            
            // Draw core white laser line
            ctx.fillStyle = "#FFFFFF";
            ctx.globalAlpha = 0.9;
            ctx.fillRect(l.x - 1.5, bb[1], 3, bb[3] - bb[1]);
        }
    }
    ctx.restore();
};
GlitchRGBVectorSplitPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.lasers.length === 0;
};

// 11. glitchMemoryLeak (Rising purple acid tide & leak bytes)
var GlitchMemoryLeakPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
};
GlitchMemoryLeakPattern.prototype = Object.create(BulletPattern.prototype);
GlitchMemoryLeakPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2;
    this.bullets = [];
};
GlitchMemoryLeakPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    var baseTide = Math.min(55, this.elapsed * 9.5);
    var tideHeight = baseTide + Math.sin(this.elapsed * 5.0) * 8.0;
    
    // Spawn leak byte droplets shooting upwards
    if (this.spawnTimer >= 0.38 && this.elapsed < this.duration - 0.8) {
        this.spawnTimer = 0;
        Sound.playSound("hit_1", true);
        var rx = bb[0] + 15 + Math.random() * (bb[2] - bb[0] - 30);
        this.bullets.push(new Bullet({
            x: rx,
            y: bb[3] - tideHeight - 2,
            width: 8,
            height: 8,
            speed: 130 + Math.random() * 60,
            damVal: this.damVal,
            color: "#FF00FF",
            vx: 0,
            vy: -(130 + Math.random() * 60),
            useVelocity: true
        }));
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        if (b.isOutOfBounds(bb)) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
GlitchMemoryLeakPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    var baseTide = Math.min(55, this.elapsed * 9.5);
    var tideHeight = baseTide + Math.sin(this.elapsed * 5.0) * 8.0;
    
    // Tide collision
    if (rectsOverlap(bb[0], bb[3] - tideHeight, bb[2] - bb[0], tideHeight, sx, sy, sw, sh)) {
        return this.damVal;
    }
    
    // Droplet collisions
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
            return b.damVal;
        }
    }
    
    return 0;
};
GlitchMemoryLeakPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var baseTide = Math.min(55, this.elapsed * 9.5);
    var tideHeight = baseTide + Math.sin(this.elapsed * 5.0) * 8.0;
    
    if (tideHeight > 2) {
        // Draw toxic checkered purple leaking memory waves at bottom
        for (var x = bb[0]; x < bb[2]; x += 16) {
            var blockH = tideHeight + Math.sin(this.elapsed * 4 + x * 0.1) * 3;
            ctx.fillStyle = "#FF00FF";
            ctx.fillRect(x, bb[3] - blockH, 16, blockH);
            
            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx.fillRect(x, bb[3] - blockH + 6, 8, blockH - 6);
        }
    }
    
    // Draw rising droplets
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        ctx.fillStyle = "#FF00FF";
        ctx.fillRect(b.x, b.y, b.width, b.height);
    }
    
    ctx.restore();
};
GlitchMemoryLeakPattern.prototype.isOver = function() {
    var over = this.elapsed >= this.duration;
    if (over) {
        this.bullets = [];
    }
    return over;
};

// 12. glitchBufferOverflow (Digit flood)
var GlitchBufferOverflowPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
};
GlitchBufferOverflowPattern.prototype = Object.create(BulletPattern.prototype);
GlitchBufferOverflowPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.15;
};
GlitchBufferOverflowPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 0.32 && this.elapsed < this.duration - 0.8) {
        this.spawnTimer = 0;
        Sound.playSound("hit_1", true);
        var side = Math.random() < 0.5 ? 'L' : 'R';
        var randY = bb[1] + 10 + Math.random() * (bb[3] - bb[1] - 25);
        var b = new Bullet({
            x: side === 'L' ? bb[0] - 10 : bb[2] + 10,
            y: randY,
            width: 12,
            height: 12,
            speed: 160,
            damVal: this.damVal,
            color: "#FF00FF",
            vx: side === 'L' ? 160 : -160,
            vy: 0,
            useVelocity: true
        });
        b.char = Math.floor(Math.random() * 10).toString(); // numerical digit
        this.bullets.push(b);
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        
        // Rapidly change digit value
        if (Math.random() < 0.15) b.char = Math.floor(Math.random() * 10).toString();
        
        if (b.isOutOfBounds(bb)) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
GlitchBufferOverflowPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    return 0;
};
GlitchBufferOverflowPattern.prototype.draw = function(ctx) {
    ctx.save();
    ctx.font = "12pt 'Determination Mono'";
    ctx.fillStyle = "#FF00FF";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#FF00FF";
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        ctx.fillText(b.char || "8", b.x, b.y + 10);
    }
    ctx.restore();
};
GlitchBufferOverflowPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// ============================================================================
// PHASE 3 PATTERNS
// ============================================================================

// 13. glitchBSODCrash (BSOD Screen & Voxel Skull & memory lasers)
var GlitchBSODCrashPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.2;
    this.elapsed = 0;
    this.damVal = config.damVal || 12;
    this.skullY = 0;
    this.skullState = 0; // 0 (warn), 1 (chomp), 2 (retract)
    this.laserTimer = 0;
    this.lasers = []; // { y, warning, active }
};
GlitchBSODCrashPattern.prototype = Object.create(BulletPattern.prototype);
GlitchBSODCrashPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.skullY = battleBox[1] - 100;
    this.skullState = 0;
    this.laserTimer = 0.2;
    this.lasers = [];
    this.bullets = [];
};
GlitchBSODCrashPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.laserTimer += dt;
    var bb = Cbbox.getBound();
    
    // Skull chomping state machine
    if (this.skullState === 0) {
        if (this.elapsed >= 1.2) {
            this.skullState = 1;
            Sound.playSound("impact", true);
        }
    } else if (this.skullState === 1) {
        this.skullY = Math.min(bb[3] - 48, this.skullY + 230 * dt);
        if (this.skullY >= bb[3] - 48) {
            this.skullState = 2;
            
            // Reached maximum chomp: shake screen & launch 6 radiating hex shards!
            if (typeof Camera !== "undefined" && Camera.shake) {
                Camera.shake(5.5);
            }
            Sound.playSound("hit_2_crit", true);
            var cX = bb[0] + (bb[2] - bb[0])/2;
            for (var d = 0; d < 6; d++) {
                var angle = (d * Math.PI / 3) + (Math.random() - 0.5) * 0.2;
                var b = new Bullet({
                    x: cX,
                    y: this.skullY + 16,
                    width: 24,
                    height: 12,
                    speed: 140,
                    damVal: this.damVal - 2,
                    color: "#00FFFF",
                    vx: Math.cos(angle) * 140,
                    vy: Math.sin(angle) * 140,
                    useVelocity: true
                });
                b.text = Math.random() < 0.5 ? "0x404" : "0x0A";
                this.bullets.push(b);
            }
        }
    } else if (this.skullState === 2) {
        this.skullY -= 130 * dt;
        if (this.skullY <= bb[1] - 100) {
            this.skullState = 0;
        }
    }
    
    // Spawn horizontal crossing Memory-Dump lasers
    if (this.laserTimer >= 1.5 && this.elapsed < this.duration - 1.0) {
        this.laserTimer = 0;
        var ry = bb[1] + 25 + Math.random() * (bb[3] - bb[1] - 50);
        this.lasers.push({ y: ry, warning: 0.55, active: 0.25 });
    }
    
    // Update lasers
    for (var i = this.lasers.length - 1; i >= 0; i--) {
        var l = this.lasers[i];
        if (l.warning > 0) {
            l.warning -= dt;
            if (l.warning <= 0) {
                Sound.playSound("laser", true);
            }
        } else {
            l.active -= dt;
            if (l.active <= 0) {
                this.lasers.splice(i, 1);
            }
        }
    }
    
    // Update bullets (flying hex shards)
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        if (b.isOutOfBounds(bb)) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
GlitchBSODCrashPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    
    // Giant chomp box collision (the pixel skull itself)
    if (this.skullState === 1 || this.skullState === 2) {
        var cX = bb[0] + (bb[2] - bb[0])/2;
        if (rectsOverlap(cX - 24, this.skullY - 24, 48, 48, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    
    // Laser collisions
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.warning <= 0 && l.active > 0) {
            if (rectsOverlap(bb[0], l.y - 4, bb[2] - bb[0], 8, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }
    
    // Radial hex bullet collisions
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && rectsOverlap(b.x - 12, b.y - 6, 24, 12, sx, sy, sw, sh)) {
            return b.damVal;
        }
    }
    
    return 0;
};
GlitchBSODCrashPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    
    // 1. Mini-BSOD Background
    ctx.fillStyle = "#000082";
    ctx.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "8px 'Determination Mono'";
    ctx.fillText("*** FATAL EXCEPTION 0x0000000A ***", bb[0] + 15, bb[1] + 25);
    ctx.fillText("A fatal error occurred at register 404:CORE_STR.", bb[0] + 15, bb[1] + 45);
    ctx.fillText("Formatting C:\\ ...", bb[0] + 15, bb[1] + 65);
    
    // Draw lasers
    for (var i = 0; i < this.lasers.length; i++) {
        var l = this.lasers[i];
        if (l.warning > 0) {
            ctx.strokeStyle = "rgba(255, 0, 0, 0.4)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(bb[0], l.y); ctx.lineTo(bb[2], l.y);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (l.active > 0) {
            ctx.fillStyle = "rgba(0, 240, 255, 0.85)";
            ctx.fillRect(bb[0], l.y - 4, bb[2] - bb[0], 8);
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(bb[0], l.y - 1, bb[2] - bb[0], 2);
        }
    }
    
    // Draw radial hex bullets
    ctx.font = "bold 7pt Courier";
    ctx.textAlign = "center";
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        ctx.fillStyle = "#00FFFF";
        ctx.fillRect(b.x - 12, b.y - 6, 24, 12);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1;
        ctx.strokeRect(b.x - 12, b.y - 6, 24, 12);
        ctx.fillStyle = "#000000";
        ctx.fillText(b.text || "0x404", b.x, b.y + 3);
    }
    
    // 2. Draw Chomping Voxel/Pixel-Art Skull
    var cX = bb[0] + (bb[2] - bb[0])/2;
    if (this.skullState === 0) {
        // warning guidelines
        ctx.strokeStyle = "rgba(255, 0, 85, 0.6)";
        ctx.lineWidth = 2.0;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(cX - 30, bb[1] + 10, 60, bb[3] - bb[1] - 20);
        ctx.setLineDash([]);
    } else {
        // Draw using our pixel skull helper
        var scale = 1.0;
        var chompYVal = Math.sin(this.elapsed * 14) > 0.3 ? (Math.sin(this.elapsed * 14) - 0.3) * 6.0 : 0.0;
        drawPixelSkullForPattern(ctx, cX, this.skullY, scale, chompYVal);
    }
    
    ctx.restore();
};
GlitchBSODCrashPattern.prototype.isOver = function() {
    var over = this.elapsed >= this.duration;
    if (over) {
        this.bullets = [];
    }
    return over;
};

// 14. glitchNullPointer (Coordinate Claws)
var GlitchNullPointerPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.clawTimer = 0;
    this.damVal = config.damVal || 10;
    this.claws = []; // {x, y, targetX, targetY, warning, progress}
};
GlitchNullPointerPattern.prototype = Object.create(BulletPattern.prototype);
GlitchNullPointerPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.clawTimer = 0.2;
    this.claws = [];
};
GlitchNullPointerPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.clawTimer += dt;
    var bb = Cbbox.getBound();
    
    if (this.clawTimer >= 1.1 && this.elapsed < this.duration - 1.2) {
        this.clawTimer = 0;
        // Lock on to player position
        var tx = bb[0] + (bb[2] - bb[0])/2;
        var ty = bb[1] + (bb[3] - bb[1])/2;
        if (typeof Soul !== "undefined" && Soul.getPos) {
            var sPos = Soul.getPos();
            tx = sPos.x;
            ty = sPos.y;
        }
        
        this.claws.push({
            x: tx,
            y: bb[1] - 80,
            targetX: tx,
            targetY: ty,
            warning: 0.6,
            progress: 0
        });
    }
    
    for (var i = this.claws.length - 1; i >= 0; i--) {
        var c = this.claws[i];
        if (c.warning > 0) {
            c.warning -= dt;
            if (c.warning <= 0) {
                Sound.playSound("hit_2_crit", true);
            }
        } else {
            c.progress += dt * 3.5; // fast strike
            c.y = c.y + (c.targetY - c.y) * dt * 8.5;
            if (c.progress >= 1.2) {
                this.claws.splice(i, 1);
            }
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
GlitchNullPointerPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.claws.length; i++) {
        var c = this.claws[i];
        if (c.warning <= 0) {
            // Claw rectangular strike collision
            if (rectsOverlap(c.x - 15, c.y, 30, 50, sx, sy, sw, sh)) {
                return this.damVal;
            }
        }
    }
    return 0;
};
GlitchNullPointerPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    for (var i = 0; i < this.claws.length; i++) {
        var c = this.claws[i];
        if (c.warning > 0) {
            // laser lock indicator
            ctx.strokeStyle = "rgba(255, 0, 255, 0.4)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(c.x, bb[1]);
            ctx.lineTo(c.x, bb[3]);
            ctx.stroke();
            
            // X pointer lock
            ctx.strokeRect(c.x - 10, c.targetY - 10, 20, 20);
        } else {
            // Draw pixelated green/cyan claw pointing down
            ctx.fillStyle = "#00FF66";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#00FF66";
            
            // Main claw shaft
            ctx.fillRect(c.x - 6, c.y - 40, 12, 40);
            
            // 3 fingers pointing down
            ctx.fillRect(c.x - 15, c.y, 6, 20);
            ctx.fillRect(c.x - 3, c.y + 6, 6, 22);
            ctx.fillRect(c.x + 9, c.y, 6, 20);
        }
    }
    ctx.restore();
};
GlitchNullPointerPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.claws.length === 0;
};

// 15. glitchHexRain (Hex string rain)
var GlitchHexRainPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 6.5;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 8;
};
GlitchHexRainPattern.prototype = Object.create(BulletPattern.prototype);
GlitchHexRainPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.15;
};
GlitchHexRainPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    if (this.spawnTimer >= 0.28 && this.elapsed < this.duration - 0.8) {
        this.spawnTimer = 0;
        Sound.playSound("hit_1", true);
        var rx = bb[0] + 25 + Math.random() * (bb[2] - bb[0] - 50);
        var hexes = ["0xFF", "0x00", "0x404", "0xEF", "0xDB", "0xAA"];
        var selectedHex = hexes[Math.floor(Math.random() * hexes.length)];
        
        var b = new Bullet({
            x: rx,
            y: bb[1] - 15,
            width: 32,
            height: 12,
            speed: 135,
            damVal: this.damVal,
            color: "#00FFFF",
            vx: (Math.random() - 0.5) * 40,
            vy: 135,
            useVelocity: true
        });
        b.hexString = selectedHex;
        this.bullets.push(b);
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        if (b.isOutOfBounds(bb)) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
GlitchHexRainPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && rectsOverlap(b.x - 16, b.y - 6, 32, 12, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    return 0;
};
GlitchHexRainPattern.prototype.draw = function(ctx) {
    ctx.save();
    ctx.font = "bold 10pt Courier";
    ctx.textAlign = "center";
    ctx.fillStyle = "#00FFFF";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#00FFFF";
    
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        ctx.fillText(b.hexString, b.x, b.y + 6);
    }
    ctx.restore();
};
GlitchHexRainPattern.prototype.isOver = function() {
    return this.elapsed >= this.duration && this.bullets.length === 0;
};

// 16. glitchFormatDrive (Formatting C: progress bar thorns)
var GlitchFormatDrivePattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.damVal = config.damVal || 10;
};
GlitchFormatDrivePattern.prototype = Object.create(BulletPattern.prototype);
GlitchFormatDrivePattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
};
GlitchFormatDrivePattern.prototype.update = function(dt) {
    this.elapsed += dt;
    BulletPattern.prototype.update.call(this, dt);
};
GlitchFormatDrivePattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    var bb = Cbbox.getBound();
    var progress = Math.min(100, Math.floor((this.elapsed / this.duration) * 100));
    
    // Top Progress Bar boundary collision
    if (rectsOverlap(bb[0] + 20, bb[1] + 12, (bb[2] - bb[0] - 40), 20, sx, sy, sw, sh)) {
        return this.damVal - 3;
    }
    
    // Pixelated directories spikes growing from bottom
    var spikeHeight = Math.min(36, this.elapsed * 6);
    if (rectsOverlap(bb[0], bb[3] - spikeHeight, bb[2] - bb[0], spikeHeight, sx, sy, sw, sh)) {
        return this.damVal;
    }
    
    return 0;
};
GlitchFormatDrivePattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var progress = Math.min(100, Math.floor((this.elapsed / this.duration) * 100));
    
    // 1. Draw "FORMATTING C: [ progress % ]" bar at top
    var barW = bb[2] - bb[0] - 40;
    var fillW = barW * (progress / 100);
    
    ctx.fillStyle = "#c0c0c0";
    ctx.fillRect(bb[0] + 20, bb[1] + 12, barW, 20);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(bb[0] + 20, bb[1] + 12, barW, 20);
    
    ctx.fillStyle = "#000080";
    ctx.fillRect(bb[0] + 20, bb[1] + 12, fillW, 20);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "8pt 'Determination Mono'";
    ctx.fillText("FORMATTING C: " + progress + "%", bb[0] + 35, bb[1] + 26);
    
    // 2. Draw directories thorns at the bottom
    var spikeHeight = Math.min(36, this.elapsed * 6);
    if (spikeHeight > 2) {
        ctx.fillStyle = "#FF00FF";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF00FF";
        
        for (var x = bb[0] + 10; x < bb[2]; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x - 8, bb[3]);
            ctx.lineTo(x, bb[3] - spikeHeight);
            ctx.lineTo(x + 8, bb[3]);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    ctx.restore();
};
GlitchFormatDrivePattern.prototype.isOver = function() {
    return this.elapsed >= this.duration;
};

// 17. glitchKernelPanic (Bouncing Kernel Panics)
var GlitchKernelPanicPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 10;
};
GlitchKernelPanicPattern.prototype = Object.create(BulletPattern.prototype);
GlitchKernelPanicPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0;
};
GlitchKernelPanicPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    // Heavy screen shake during Kernel Panic
    if (typeof Camera !== "undefined" && Camera.shake) {
        Camera.shake(3.0);
    }
    
    if (this.spawnTimer >= 1.0 && this.elapsed < this.duration - 1.2) {
        this.spawnTimer = 0;
        Sound.playSound("impact", true);
        var rx = bb[0] + 40 + Math.random() * (bb[2] - bb[0] - 120);
        var ry = bb[1] + 15 + Math.random() * (bb[3] - bb[1] - 40);
        
        var bullet = new Bullet({
            x: rx,
            y: ry,
            width: 80,
            height: 18,
            speed: 130,
            damVal: this.damVal,
            color: "#FF0000",
            vx: (Math.random() < 0.5 ? 1 : -1) * 110,
            vy: (Math.random() < 0.5 ? 1 : -1) * 70,
            useVelocity: true
        });
        this.bullets.push(bullet);
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        
        // Bounce off bounds
        if (b.x <= bb[0] || b.x >= bb[2] - b.width) b.vx = -b.vx;
        if (b.y <= bb[1] || b.y >= bb[3] - b.height) b.vy = -b.vy;
    }
    
    BulletPattern.prototype.update.call(this, dt);
};
GlitchKernelPanicPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    return 0;
};
GlitchKernelPanicPattern.prototype.draw = function(ctx) {
    ctx.save();
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        // Draw bouncing red warning badge
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(b.x, b.y, b.width, b.height);
        
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 7pt 'Determination Mono'";
        ctx.fillText("KERNEL PANIC!", b.x + 6, b.y + 13);
    }
    ctx.restore();
};
GlitchKernelPanicPattern.prototype.isOver = function() {
    var over = this.elapsed >= this.duration;
    if (over) {
        this.bullets = [];
    }
    return over;
};

// 18. glitchScreenTear (Screen tearing & split seams)
var GlitchScreenTearPattern = function(config) {
    BulletPattern.call(this, config);
    this.duration = config.duration || 7.0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.damVal = config.damVal || 9;
};
GlitchScreenTearPattern.prototype = Object.create(BulletPattern.prototype);
GlitchScreenTearPattern.prototype.generateBullets = function(battleBox) {
    BulletPattern.prototype.generateBullets.call(this, battleBox);
    this.elapsed = 0;
    this.spawnTimer = 0.2;
    this.bullets = [];
};
GlitchScreenTearPattern.prototype.update = function(dt) {
    this.elapsed += dt;
    this.spawnTimer += dt;
    var bb = Cbbox.getBound();
    
    // Spawn falling tear shards down the splits
    if (this.spawnTimer >= 0.35 && this.elapsed < this.duration - 0.8) {
        this.spawnTimer = 0;
        var rx = bb[0] + 15 + Math.random() * (bb[2] - bb[0] - 30);
        this.bullets.push(new Bullet({
            x: rx,
            y: bb[1] - 10,
            width: 10,
            height: 10,
            speed: 150,
            damVal: this.damVal,
            color: "#FF00FF",
            vx: 0,
            vy: 150,
            useVelocity: true
        }));
    }
    
    for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.progressMovement(dt);
        if (b.isOutOfBounds(bb)) {
            b.active = false;
            this.bullets.splice(i, 1);
        }
    }
    BulletPattern.prototype.update.call(this, dt);
};
GlitchScreenTearPattern.prototype.checkCollision = function(sx, sy, sw, sh) {
    // Collision with falling shards
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        if (b.active && rectsOverlap(b.x, b.y, b.width, b.height, sx, sy, sw, sh)) {
            return this.damVal;
        }
    }
    
    // Horizontal screen tearing seams (slivers of high damage at static tear lines)
    var bb = Cbbox.getBound();
    var h = bb[3] - bb[1];
    var line1Y = bb[1] + h / 3;
    var line2Y = bb[1] + 2 * h / 3;
    
    // Small laser-like tear collision at the seams when flashing
    if (Math.sin(this.elapsed * 15) > 0.7) {
        if (rectsOverlap(bb[0], line1Y - 2, bb[2] - bb[0], 4, sx, sy, sw, sh)) return this.damVal;
        if (rectsOverlap(bb[0], line2Y - 2, bb[2] - bb[0], 4, sx, sy, sw, sh)) return this.damVal;
    }
    
    return 0;
};
GlitchScreenTearPattern.prototype.draw = function(ctx) {
    ctx.save();
    var bb = Cbbox.getBound();
    var w = bb[2] - bb[0];
    var h = bb[3] - bb[1];
    var line1Y = bb[1] + h / 3;
    var line2Y = bb[1] + 2 * h / 3;
    
    // Draw sliding horizontal grids representing "teared" screen slices
    ctx.strokeStyle = "rgba(0, 255, 255, 0.25)";
    ctx.lineWidth = 1;
    
    // Slice 1: shifts left
    var shift1 = Math.sin(this.elapsed * 5) * 15;
    ctx.save();
    ctx.beginPath(); ctx.rect(bb[0], bb[1], w, h / 3); ctx.clip();
    for (var x = bb[0] + 15 + shift1; x < bb[2] + 30; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, bb[1]); ctx.lineTo(x, line1Y); ctx.stroke();
    }
    ctx.restore();
    
    // Slice 2: shifts right
    var shift2 = -Math.sin(this.elapsed * 5) * 15;
    ctx.save();
    ctx.beginPath(); ctx.rect(bb[0], line1Y, w, h / 3); ctx.clip();
    for (var x = bb[0] + 15 + shift2; x < bb[2] + 30; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, line1Y); ctx.lineTo(x, line2Y); ctx.stroke();
    }
    ctx.restore();
    
    // Slice 3: shifts left
    ctx.save();
    ctx.beginPath(); ctx.rect(bb[0], line2Y, w, h / 3); ctx.clip();
    for (var x = bb[0] + 15 + shift1; x < bb[2] + 30; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, line2Y); ctx.lineTo(x, bb[3]); ctx.stroke();
    }
    ctx.restore();
    
    // Draw red/cyan screen tear seams
    if (Math.sin(this.elapsed * 15) > 0.7) {
        ctx.fillStyle = "rgba(255, 0, 255, 0.8)";
        ctx.fillRect(bb[0], line1Y - 2, w, 4);
        ctx.fillStyle = "rgba(0, 255, 255, 0.8)";
        ctx.fillRect(bb[0], line2Y - 2, w, 4);
    } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.fillRect(bb[0], line1Y - 1, w, 2);
        ctx.fillRect(bb[0], line2Y - 1, w, 2);
    }
    
    // Draw falling bullets
    for (var i = 0; i < this.bullets.length; i++) {
        var b = this.bullets[i];
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
    }
    
    ctx.restore();
};
GlitchScreenTearPattern.prototype.isOver = function() {
    var over = this.elapsed >= this.duration;
    if (over) {
        this.bullets = [];
    }
    return over;
};
