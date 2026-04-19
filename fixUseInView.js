const fs = require('fs');

function fixUseInView(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Find all constants initialized with useInView
  const varRegex = /const (\w+) = useInView\((.*?)\);/g;
  let match;
  let replacements = [];

  while ((match = varRegex.exec(content)) !== null) {
    const varName = match[1];
    const args = match[2];
    replacements.push({
      original: match[0],
      replacement: `const { ref: ${varName}Ref, inView: ${varName}InView } = useInView(${args});`
    });
  }

  // Apply replacements for the variable declarations
  replacements.forEach(({original, replacement}) => {
    content = content.replace(original, replacement);
  });

  // Apply replacements for usages
  replacements.forEach(r => {
    const varName = r.original.match(/const (\w+) =/)[1];
    const inViewRegex = new RegExp(`\\b${varName}\\.inView\\b`, 'g');
    const refRegex = new RegExp(`\\b${varName}\\.ref\\b`, 'g');
    
    content = content.replace(inViewRegex, `${varName}InView`);
    content = content.replace(refRegex, `${varName}Ref`);
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${filePath}`);
}

try {
  fixUseInView('src/app/page.tsx');
  fixUseInView('src/app/features/page.tsx');
  console.log("Done");
} catch (e) {
  console.error(e);
}
