const bcryptjs = require('bcryptjs');

async function testPassword() {
    const password = 'AdminPass123!';
    const hash = '$2b$10$4kvg6QGfz1qocpI3RiUMUebKj/yu9vjKYfKv7iR3is4piIeQMcX1e';
    
    console.log('Testing password verification...');
    console.log('Password:', password);
    console.log('Hash from database:', hash);
    
    const isValid = await bcryptjs.compare(password, hash);
    console.log('bcryptjs.compare result:', isValid);
    
    if (!isValid) {
        console.log('❌ FOUND THE ISSUE! bcrypt vs bcryptjs incompatibility');
        console.log('Generating new hash with bcryptjs...');
        
        const newHash = await bcryptjs.hash(password, 10);
        console.log('New bcryptjs hash:', newHash);
        
        const testNew = await bcryptjs.compare(password, newHash);
        console.log('New hash verification works:', testNew);
        
        console.log('\n🔧 UPDATE YOUR DATABASE:');
        console.log(`UPDATE users SET password_hash = '${newHash}' WHERE email = 'contact@preciseanalytics.io';`);
        
    } else {
        console.log('✅ Password verification works! The issue is elsewhere.');
    }
}

testPassword().catch(console.error);