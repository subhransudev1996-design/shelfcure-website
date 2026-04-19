const fs = require('fs');
const results = JSON.parse(fs.readFileSync('eslint-results.json', 'utf8'));
const counts = {};
results.forEach(res => {
  if (res.errorCount > 0 || res.warningCount > 0) {
    console.log('\n--- ' + res.filePath);
    res.messages.forEach(msg => {
      console.log('  Line ' + msg.line + ': ' + (msg.severity === 2 ? 'error' : 'warning') + ' ' + msg.message + ' (' + msg.ruleId + ')');
      counts[msg.ruleId] = (counts[msg.ruleId] || 0) + 1;
    });
  }
});
console.log('\nSummary:', counts);
