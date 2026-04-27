const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const input = path.resolve(__dirname, '../../documentation/Proposal_Tugas_Besar_PPL_486.pdf');
const outTxt = path.resolve(__dirname, '../../documentation/PROPOSAL_TUGAS_BESAR.txt');
const outMd = path.resolve(__dirname, '../../documentation/PROPOSAL_TUGAS_BESAR.md');

if (!fs.existsSync(input)) {
  console.error('Input PDF not found:', input);
  process.exit(2);
}

const dataBuffer = fs.readFileSync(input);

pdf(dataBuffer).then(function(data) {
  // data.text has the extracted text with simple line breaks
  const text = data.text || '';

  // Write plain text
  fs.writeFileSync(outTxt, text, 'utf8');
  console.log('Wrote', outTxt);

  // Convert text to a simple markdown structure: preserve headings if any by detecting all-caps lines
  const lines = text.split(/\r?\n/);
  const mdLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      mdLines.push('');
      continue;
    }

    // simple heuristic: if line is ALL CAPS and short, make it an H2
    if (line === line.toUpperCase() && line.length > 3 && line.length < 80 && /[A-Z0-9]/.test(line)) {
      mdLines.push('## ' + line);
      continue;
    }

    // If line ends with ':' treat as subsection
    if (line.endsWith(':')) {
      mdLines.push('### ' + line.slice(0, -1));
      continue;
    }

    mdLines.push(line);
  }

  const md = ['# Proposal Tugas Besar', '', ...mdLines].join('\n');
  fs.writeFileSync(outMd, md, 'utf8');
  console.log('Wrote', outMd);
}).catch(function(err){
  console.error('Failed to extract PDF:', err);
  process.exit(1);
});
