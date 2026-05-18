const fs = require('fs');
const path = require('path');

const replacements = [
    { from: /myKeys\.keydown\[myKeys\.KEYBOARD\.KEY_Z\]/g, to: 'myKeys.isConfirm()' },
    { from: /myKeys\.keydown\[myKeys\.KEYBOARD\.KEY_X\]/g, to: 'myKeys.isCancel()' },
    { from: /myKeys\.keydown\[myKeys\.KEYBOARD\.KEY_UP\]/g, to: 'myKeys.isUp()' },
    { from: /myKeys\.keydown\[myKeys\.KEYBOARD\.KEY_DOWN\]/g, to: 'myKeys.isDown()' },
    { from: /myKeys\.keydown\[myKeys\.KEYBOARD\.KEY_LEFT\]/g, to: 'myKeys.isLeft()' },
    { from: /myKeys\.keydown\[myKeys\.KEYBOARD\.KEY_RIGHT\]/g, to: 'myKeys.isRight()' },
    { from: /myKeys\.keydown\[myKeys\.KEYBOARD\.KEY_ENTER\]/g, to: 'myKeys.isConfirm()' },
    { from: /myKeys\.keydown\[88\]/g, to: 'myKeys.isCancel()' }
];

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const jsFiles = walkDir('./js');

jsFiles.forEach(file => {
    // Skip keys.js and soul.js as they might be manually configured already
    if (file.endsWith('keys.js')) return;
    
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    replacements.forEach(r => {
        if (r.from.test(content)) {
            content = content.replace(r.from, r.to);
            changed = true;
        }
    });
    
    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated: ' + file);
    }
});
