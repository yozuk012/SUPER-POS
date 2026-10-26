const { ESLint } = require("eslint");
const fs = require("fs");
const path = require("path");

async function runAudit() {
  // Inisialisasi ESLint
  const eslint = new ESLint();

  // Lint file di direktori src
  const results = await eslint.lintFiles(["src/**/*.{js,jsx}"]);

  let report = "# Laporan Audit Kode\n\n";
  report += `Tanggal: ${new Date().toLocaleString()}\n\n`;

  let totalErrors = 0;
  let totalWarnings = 0;

  results.forEach((result) => {
    if (result.messages.length > 0) {
      const relativePath = path.relative(process.cwd(), result.filePath);
      report += `## File: ${relativePath}\n`;
      
      result.messages.forEach((msg) => {
        const type = msg.severity === 2 ? "ERROR" : "WARNING";
        if (msg.severity === 2) totalErrors++;
        else totalWarnings++;

        report += `- **${type}** [Laras ${msg.line}:${msg.column}]: ${msg.message} (\`${msg.ruleId}\`)\n`;
      });
      report += "\n---\n\n";
    }
  });

  report += "## Ringkasan\n";
  report += `- Total Error: ${totalErrors}\n`;
  report += `- Total Warning: ${totalWarnings}\n`;

  if (totalErrors === 0 && totalWarnings === 0) {
    report += `\n✅ Tidak ditemukan error atau warning dari ${results.length} file yang diperiksa.\n`;
  }

  const outputPath = path.join(process.cwd(), "src/blueprint/AUDIT.md");
  
  // Pastikan folder blueprint ada
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, report);
  console.log(`Audit selesai. Hasil disimpan di: ${outputPath}`);
}

runAudit().catch((err) => {
  console.error("Gagal menjalankan audit:", err);
  process.exit(1);
});
