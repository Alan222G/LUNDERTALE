// writer.js — Dialogue typewriter system for LUNDERTALE
// Ported from Under-Ground-Engine
var Writer = (function() {
    var timeCheck = 0;
    var timeAsterisk = 0.75, timePeriod = 0.33, timeComma = 0.21, timeStandard = 0.033;
    var text, charCounter, timeCounter;
    var horizontalPositions, verticalPositions;

    var textScrollY = 0;
    var targetTextScrollY = 0;
    var maxTextY = 396;
    var menuScrollOffset = 0;

    function init() {
        textScrollY = 0;
        targetTextScrollY = 0;
        maxTextY = 396;
        menuScrollOffset = 0;
        horizontalPositions = [
            [150, 396], [406, 396],
            [150, 428], [406, 428],
            [150, 460], [406, 460],
            [150, 492], [406, 492],
            [150, 524], [406, 524]
        ];
        verticalPositions = [
            [150, 396], [150, 428], [150, 460]
        ];
    }

    function setupTimes(_a, _p, _c, _s) {
        timeCheck = 0; timeAsterisk = _a; timePeriod = _p; timeComma = _c; timeStandard = _s;
    }

    function setupText(_text) {
        text = _text;
        charCounter = -1;
        timeCounter = 0;
        textScrollY = 0;
        targetTextScrollY = 0;
        maxTextY = 396;
    }

    function update(dt) {
        if (myKeys.isCancel()) skip();

        timeCounter += dt;
        if (timeCounter > timeCheck && charCounter < text.length) {
            timeCounter = timeCounter - timeCheck;
            charCounter++;
            if (charCounter < text.length - 2) {
                switch (text.charAt(charCounter + 1)) {
                    case "*":
                        Sound.pauseSound("text", 70);
                        timeCheck = timeAsterisk;
                        break;
                    default:
                        if (!(text.charAt(charCounter + 1) == '|' && text.charAt(charCounter + 2) == '#' ||
                            text.charAt(charCounter) == '|' && text.charAt(charCounter + 1) == '#' ||
                            text.charAt(charCounter - 1) == '|' && text.charAt(charCounter) == '#' ||
                            text.charAt(charCounter - 2) == '|' && text.charAt(charCounter - 1) == '#' ||
                            text.charAt(charCounter - 3) == '|' && text.charAt(charCounter - 2) == '#'))
                            Sound.playSound("text", false);
                        timeCheck = timeStandard;
                        break;
                }
            } else {
                Sound.playSound("text", false);
                timeCheck = timeStandard;
            }
        }
        if (charCounter >= text.length - 1) Sound.pauseSoundHard("text");

        // Dialogue text scrolling
        var maxScroll = Math.max(0, maxTextY - 460);
        if (maxScroll > 0) {
            if (myKeys.keydown[myKeys.KEYBOARD.KEY_UP] || myKeys.keydown[myKeys.KEYBOARD.KEY_W]) {
                targetTextScrollY = Math.max(0, targetTextScrollY - 200 * dt);
            }
            if (myKeys.keydown[myKeys.KEYBOARD.KEY_DOWN] || myKeys.keydown[myKeys.KEYBOARD.KEY_S]) {
                targetTextScrollY = Math.min(maxScroll, targetTextScrollY + 200 * dt);
            }
        }
        // Smooth scroll interpolation
        textScrollY += (targetTextScrollY - textScrollY) * 10 * dt;
    }

    function drawText(ctx) {
        ctx.save();
        
        // Clip text inside the combat/dialogue box bounds to prevent overflow
        ctx.beginPath();
        ctx.rect(88, 345, 564, 120);
        ctx.clip();
        
        document.getElementById('cvs').style.letterSpacing = '-1.5px';
        ctx.font = "19pt Determination Mono";
        ctx.fillStyle = "#FFF";
        
        var textXPos = 102;
        var textYPos = 396 - textScrollY;
        var startIndent = 102;
        var wrapIndent = 102;
        var maxWidth = 530;
        
        var tempMaxY = 396;
        
        for (var i = 0; i < charCounter + 1; i++) {
            var char = text.charAt(i);
            
            // Check for word wrap at the start of a word
            if (char !== " " && char !== "*" && char !== "|" && char !== "\n" && (i === 0 || text.charAt(i-1) === " " || text.charAt(i-1) === "*" || text.charAt(i-1) === "\n")) {
                var wordWidth = 0;
                var j = i;
                while (j < text.length && text.charAt(j) !== " " && text.charAt(j) !== "\n" && text.charAt(j) !== "*" && text.charAt(j) !== "|") {
                    wordWidth += ctx.measureText(text.charAt(j)).width + 2;
                    j++;
                }
                if (textXPos + wordWidth > startIndent + maxWidth) {
                    textXPos = wrapIndent;
                    textYPos += 32;
                }
            }

            if (char != "*" && char != "|" && i < charCounter) {
                if (char !== "\n") {
                    ctx.fillText(char,
                        textXPos + 2 * Math.floor(Math.random() * 1.0004),
                        textYPos + 2 * Math.floor(Math.random() * 1.0004));
                }
            }

            if (text.charAt(i + 1) == "|") {
                textXPos += ctx.measureText(char).width;
                if (text.charAt(i + 2) == '#') {
                    ctx.fillStyle = text.substring(i + 2, i + 6);
                    i += 5;
                }
                if (text.charAt(i + 2) == '/') {
                    Sound.pauseSound('text', 5);
                    i += 2;
                }
            } else if (text.charAt(i + 1) == "\n") {
                textXPos = wrapIndent; 
                textYPos += 32;
            } else if (text.charAt(i + 1) == "*") {
                textXPos = startIndent; 
                textYPos += 32;
            } else if (char !== "\n") {
                textXPos += ctx.measureText(char).width + 2;
            }
            
            // Track maximum vertical position reached
            var currentY = textYPos + textScrollY;
            if (currentY > tempMaxY) tempMaxY = currentY;
        }
        
        maxTextY = tempMaxY;
        ctx.restore();
        
        // Draw gold indicators outside of the clipping mask if text is scrollable
        var maxScroll = Math.max(0, maxTextY - 460);
        if (maxScroll > 0) {
            ctx.save();
            ctx.fillStyle = "#FFD700";
            ctx.font = "10pt 'Determination Mono', monospace";
            ctx.textAlign = "center";
            if (textScrollY > 5) {
                ctx.fillText("▲ (UP/W TO SCROLL)", 370, 350);
            }
            if (textScrollY < maxScroll - 5) {
                ctx.fillText("▼ (DOWN/S TO SCROLL)", 370, 470);
            }
            ctx.restore();
        }
    }

    function drawMenu(ctx, menu, menuState, MENU_STATE, selectStateOther) {
        ctx.save();
        document.getElementById('cvs').style.letterSpacing = '-1.5px';
        ctx.font = "19pt Determination Mono";
        ctx.fillStyle = "#FFF";
        
        if (menuState !== MENU_STATE.ACT && menuState !== MENU_STATE.ITEM) {
            menuScrollOffset = 0;
        } else {
            var selectedRow = Math.floor((selectStateOther || 0) / 2);
            var maxRows = Math.ceil(menu.length / 2);
            if (selectedRow < menuScrollOffset) {
                menuScrollOffset = selectedRow;
            } else if (selectedRow >= menuScrollOffset + 3) {
                menuScrollOffset = selectedRow - 2;
            }
            menuScrollOffset = Math.max(0, Math.min(maxRows - 3, menuScrollOffset));
        }

        switch (menuState) {
            case MENU_STATE.FIGHT:
                drawMenuTexts(ctx, menu, verticalPositions, true, false); break;
            case MENU_STATE.ACT:
                drawMenuTexts(ctx, menu, horizontalPositions, false, true); break;
            case MENU_STATE.ITEM:
                drawMenuTexts(ctx, menu, horizontalPositions, false, true); break;
            case MENU_STATE.MERCY:
                drawMenuTexts(ctx, menu, verticalPositions, false, false); break;
            default:
                drawMenuTexts(ctx, menu, verticalPositions, false, false); break;
        }
        ctx.restore();
    }

    function drawMenuTexts(ctx, menu, positions, bars, isScrollingGrid) {
        var barPos = 0;
        if (bars) {
            for (var i = 0; i < menu.length; i++) {
                var temp = ctx.measureText(menu[i]).width;
                if (temp > barPos) barPos = temp;
            }
        }
        
        if (isScrollingGrid) {
            var startIdx = menuScrollOffset * 2;
            var endIdx = Math.min(menu.length, (menuScrollOffset + 3) * 2);
            
            for (var i = startIdx; i < endIdx; i++) {
                var relativeIdx = i - startIdx;
                drawMenuText(ctx, menu[i], positions[relativeIdx][0], positions[relativeIdx][1]);
            }
            
            // Draw menu indicators
            var maxRows = Math.ceil(menu.length / 2);
            if (maxRows > 3) {
                ctx.save();
                ctx.fillStyle = "#FFD700";
                ctx.font = "10pt 'Determination Mono', monospace";
                ctx.textAlign = "center";
                if (menuScrollOffset > 0) {
                    ctx.fillText("▲ (MORE)", 370, 380);
                }
                if (menuScrollOffset < maxRows - 3) {
                    ctx.fillText("▼ (MORE)", 370, 472);
                }
                ctx.restore();
            }
        } else {
            for (var i = 0; i < menu.length; i++) {
                drawMenuText(ctx, menu[i], positions[i][0], positions[i][1]);
                if (bars) {
                    ctx.fillStyle = "#404040";
                    ctx.strokeStyle = "#000";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.rect(positions[i][0] + barPos + 50, positions[i][1] - 15, 100, 15);
                    ctx.fill(); ctx.stroke();
                    ctx.fillStyle = "#0F0";
                    ctx.fillRect(positions[i][0] + barPos + 50, positions[i][1] - 15,
                        100 * Cgroup.getCurHP(i) / Cgroup.getMaxHP(i), 15);
                }
                ctx.fillStyle = "#FFF";
            }
        }
    }

    function drawMenuText(ctx, option, xPos, yPos) {
        ctx.fillText("*",
            xPos + 2 * Math.floor(Math.random() * 1.0004),
            yPos + 2 * Math.floor(Math.random() * 1.0004));
        xPos += 32;
        for (var i = 0; i < option.length; i++) {
            if (option.charAt(i) == "|") {
                ctx.fillStyle = option.substring(i + 1, i + 5);
                i += 4;
            } else {
                ctx.fillText(option.charAt(i),
                    xPos + 2 * Math.floor(Math.random() * 1.0004),
                    yPos + 2 * Math.floor(Math.random() * 1.0004));
                xPos += ctx.measureText(option.charAt(i)).width;
            }
        }
    }

    function skip() { charCounter = text.length; }
    
    function reset() {
        charCounter = -1;
        timeCounter = 0;
        textScrollY = 0;
        targetTextScrollY = 0;
        maxTextY = 396;
        menuScrollOffset = 0;
    }

    function getSoulPos(index, style) {
        var pos;
        switch (style) {
            case 0:
                var drawRow = Math.floor(index / 2) - menuScrollOffset;
                var drawCol = index % 2;
                var mappedIndex = drawRow * 2 + drawCol;
                mappedIndex = Math.max(0, Math.min(horizontalPositions.length - 1, mappedIndex));
                pos = new Vect(horizontalPositions[mappedIndex][0] - 36, horizontalPositions[mappedIndex][1] - 18, 0);
                break;
            case 1:
                pos = new Vect(verticalPositions[index][0] - 36, verticalPositions[index][1] - 18, 0);
                break;
        }
        return pos;
    }

    function isFinished() { return charCounter >= text.length - 1; }

    return {
        init: init, setupTimes: setupTimes, setupText: setupText,
        update: update, drawText: drawText, drawMenu: drawMenu,
        skip: skip, reset: reset, getSoulPos: getSoulPos,
        isFinished: isFinished,
    };
}());
