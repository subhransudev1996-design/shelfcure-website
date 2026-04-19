const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
};

walkDir('.next', function(filePath) {
  if (filePath.endsWith('.map') && filePath.includes('src_app_page_tsx')) {
    const map = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let content = null;
    for (let i = 0; i < map.sources.length; i++) {
        if (map.sources[i].endsWith('page.tsx')) {
            content = map.sourcesContent && map.sourcesContent[i];
            break;
        }
    }
    if (content && content.length > 1000) {
        fs.writeFileSync('restored_page.tsx', content);
        console.log('Restored from ' + filePath);
    }
  }
});
