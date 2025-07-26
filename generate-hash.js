const bcrypt = require('bcryptjs');

const password = 'admin123';
const saltRounds = 12;

const hash = bcrypt.hashSync(password, saltRounds);
console.log('Password hash for admin123:');
console.log(hash);

// Test the hash
const isValid = bcrypt.compareSync(password, hash);
console.log('Hash verification:', isValid ? 'SUCCESS' : 'FAILED');