const fs = require('fs');
const mockCloud = require('./mockCloud');

fs.writeFileSync(mockCloud.__dbPath, JSON.stringify({
  routes: {},
  spots: {},
  sessions: {},
  notes: {},
  oauthStates: {},
  users: {},
  external_identities: {}
}, null, 2));

console.log(`Local mock database reset: ${mockCloud.__dbPath}`);
