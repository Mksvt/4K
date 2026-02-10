const pdfParse = require('pdf-parse');
const fs = require('fs');

console.log('Type of pdfParse:', typeof pdfParse);

async function test() {
  const testPdf =
    './sources/Academic Works/Hankins-MythPlatonicAcademy-1991.pdf';
  if (fs.existsSync(testPdf)) {
    const dataBuffer = fs.readFileSync(testPdf);
    console.log('Buffer size:', dataBuffer.length);

    try {
      const result = await pdfParse(dataBuffer);
      console.log('Success! Text length:', result.text.length);
      console.log('First 200 characters:', result.text.substring(0, 200));
    } catch (e) {
      console.log('Failed:', e.message);
    }
  } else {
    console.log('Test PDF not found!');
  }
}

test();
