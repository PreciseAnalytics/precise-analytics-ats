const bcrypt = require('bcrypt');

async function generateHash() {
    const password = 'AdminPass123!'; // Change this to your desired password
    const hash = await bcrypt.hash(password, 10);
    
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nNow use this SQL:');
    console.log(`INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) 
VALUES (
    'contact@preciseanalytics.io', 
    '${hash}',
    'Contact',
    'Admin', 
    'admin',
    true
);`);
}

generateHash().catch(console.error);