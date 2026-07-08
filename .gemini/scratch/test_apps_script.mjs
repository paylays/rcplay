

const url = 'https://script.google.com/macros/s/AKfycbyJmwdteuVZb0wsi5hK0b49FlraxG8vsssdyJg6wl6fcfdKwcZshAi8YauMD8L78Qqr/exec';
const codeHash = 'e840e78366b831b45c82d67be4967d953f6f02e222ebbaef7d743699a40bc461'; // valid hash from .env
const deviceId = 'test-device-id';

async function test() {
  try {
    console.log("Sending request to Google Apps Script...");
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        codeHash: codeHash,
        deviceId: deviceId
      })
    });
    
    console.log("Response status:", response.status);
    const text = await response.text();
    console.log("Response text:", text);
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}

test();
