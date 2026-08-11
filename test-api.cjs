const fs = require('fs');
const path = require('path');

async function testPreflight() {
  const zipBuffer = fs.readFileSync('test-bulk.zip');
  const fileBlob = new Blob([zipBuffer], { type: 'application/zip' });
  
  const formData = new FormData();
  formData.append('zipFile', fileBlob, 'test-bulk.zip');
  formData.append('startSku', 'PG80004'); // from scratch-db: PEG-NP-PG80004-202546E
  formData.append('endSku', 'PG80006');   // so we expect 80004, 80005, 80006. Note: 1.jpeg -> 80004, 2.jpeg -> 80005, 3.jpeg -> 80006

  console.log("Sending preflight request...");
  try {
    const res = await fetch('http://localhost:3001/api/parts/bulk-assign/preflight', {
      method: 'POST',
      body: formData
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
    
    // We should see missing image / extra image logic working, 
    // and product validation (if 80006 doesn't exist, it should say product not found)
  } catch (e) {
    console.error("Fetch failed", e);
  }
}

testPreflight();
