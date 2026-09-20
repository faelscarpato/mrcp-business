import fs from 'fs';
import pdfParse from 'pdf-parse';

async function testPdf() {
  const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Count 1\n/Kids [ 3 0 R ]\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources << >>\n/MediaBox [ 0 0 612 792 ]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<< /Length 21 >>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000216 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n288\n%%EOF');
  
  try {
    const data = await pdfParse(dummyPdf);
    console.log(data.text);
  } catch (err) {
    console.error(err);
  }
}

testPdf();
