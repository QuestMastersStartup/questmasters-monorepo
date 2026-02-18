const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://admin:password123@127.0.0.1:5432/questmasters_local',
});
client.connect()
  .then(() => {
    console.log('Connected successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error', err.message);
    process.exit(1);
  });
