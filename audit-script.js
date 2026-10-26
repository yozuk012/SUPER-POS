const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPORT_PATH = path.join(__dirname, 'src', 'blueprint', 'AUDIT.md');

function runEslint() {
  return new Promise((resolve, reject) => {
    exec('npx eslint src/**/*.{js,jsx,ts,tsx} --format json', (error, stdout, stderr) => {
      if (stderr && !stdout) {
        reject(new Error(`ESLint error: ${stderr}`));
        return;
      }
      
      let results;
      try {
        results = JSON.parse(stdout || '[]');
      } catch (e) {
        reject(new Error(`Failed to parse ESLint output: ${e.message}`));
        return;
      }
      
      resolve(results);
    });
  });
}

function formatResults(results) {
  let markdown = `# Laporan Audit Kode\n\n`;
  markdown += `Tanggal: ${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString()}\n\n`;

  const checkedFiles = Array.isArray(results) ? results.length : 0;
  const hasIssues = Array.isArray(results)
    ? results.some((fileResult) => (fileResult.messages || []).length > 0)
    : false;

  if (!hasIssues) {
    markdown += `✅ Tidak ditemukan error atau warning.\n`;
    markdown += `File diperiksa: ${checkedFiles}.\n`;
    return markdown;
  }
  
  results.forEach((fileResult, index) => {
    if (fileResult.messages.length === 0) return;
    
    markdown += `## File: ${fileResult.filePath}\n`;
    
    fileResult.messages.forEach(msg => {
      const severity = msg.severity === 2 ? '**ERROR**' : '**WARNING**';
      const lineInfo = `[Laras ${msg.line}:${msg.column}]`;
      
      markdown += `- ${severity} ${lineInfo}: ${msg.message}\n\n`;
      
      if (msg.source) {
        // Show code snippet if available
        const lines = msg.source.split('\n');
        const lineNumber = msg.line;
        
        // Show context lines before and after
        const start = Math.max(0, lineNumber - 3);
        const end = lineNumber + 2;
        
        markdown += `\`\`\`javascript\n`;
        for (let i = start; i < lines.length && i <= end; i++) {
          const prefix = i + 1 === lineNumber ? '> ' : '  ';
          markdown += `${prefix}${i + 1} | ${lines[i]}\n`;
        }
        markdown += `\`\`\`\n\n`;
      }
      
      if (msg.ruleId) {
        markdown += `Aturan: \`${msg.ruleId}\`\n\n`;
      }
      
      if (msg.nodeType) {
        markdown += `Tipe node: ${msg.nodeType}\n\n`;
      }
    });
    
    if (index < results.length - 1) {
      markdown += `---\n\n`;
    }
  });
  
  return markdown;
}

async function main() {
  console.log('🔍 Menjalankan audit kode dengan ESLint...');
  
  try {
    const results = await runEslint();
    const markdown = formatResults(results);
    
    fs.writeFileSync(REPORT_PATH, markdown, 'utf8');
    console.log(`✅ Laporan audit disimpan di: ${REPORT_PATH}`);
    
    // Show summary
    const totalFiles = results.length;
    const totalErrors = results.reduce((sum, file) => 
      sum + file.messages.filter(m => m.severity === 2).length, 0);
    const totalWarnings = results.reduce((sum, file) => 
      sum + file.messages.filter(m => m.severity === 1).length, 0);
    
    console.log(`\n📊 Ringkasan:`);
    console.log(`   File diperiksa: ${totalFiles}`);
    console.log(`   Error: ${totalErrors}`);
    console.log(`   Warning: ${totalWarnings}`);
    
    if (totalErrors > 0) {
      console.log(`\n⚠️  Ditemukan ${totalErrors} error. Perbaiki segera.`);
      process.exit(1);
    } else if (totalWarnings > 0) {
      console.log(`\n📝 Ditemukan ${totalWarnings} warning. Periksa laporan.`);
    } else {
      console.log(`\n✨ Kode bersih dari error dan warning.`);
    }
    
  } catch (error) {
    console.error(`❌ Gagal menjalankan audit: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runEslint, formatResults };