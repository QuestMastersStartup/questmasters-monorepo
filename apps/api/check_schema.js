const http = require('http');

// Payload WITHOUT 'name' at root, which matches the NEW schema.
// If the server is UPDATED, this should work (or fail with a different error).
// If the server is STALE, it will complain about missing 'name' or 'name' validation.
const data = JSON.stringify({
  index: "test-check-schema-" + Date.now(),
  type: "class",
  data: {
    some: "content"
  }
});

// We need a valid pack first. For this check, we'll try to create an asset in a non-existent pack
// just to see the VALIDATION response.
// If we get 404 (Pack not found), then Validation passed!
// If we get 400 (Bad Request) with 'name' errors, then Validation failed (Server Stale).

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/packs/non-existent-pack-for-schema-check/assets',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Sending request to check schema...');

const req = http.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);
  let body = '';
  res.on('data', (d) => { body += d; });
  res.on('end', () => {
    console.log('Response body:', body);
    if (res.statusCode === 404) {
      console.log("SUCCESS: Schema validation passed (Pack not found, but DTO was accepted). Server is UPDATED.");
    } else if (res.statusCode === 400 && body.includes('name')) {
      console.log("FAILURE: Schema validation failed (Server expects 'name'). Server is STALE.");
    } else {
        console.log("UNKNOWN: Check response manually.");
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(data);
req.end();
