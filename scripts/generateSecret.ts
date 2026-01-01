import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function generateSecret() {
  console.log('🔐 Secure Secret Generator');
  console.log('='.repeat(50));
  
  console.log('\n📋 Generating secure secrets...\n');
  
  // Generate different types of secrets
  const secrets = {
    JWT_SECRET_64: crypto.randomBytes(64).toString('base64'),
    JWT_SECRET_32: crypto.randomBytes(32).toString('hex'),
    JWT_SECRET_48: crypto.randomBytes(48).toString('base64url'),
    API_KEY: crypto.randomBytes(32).toString('hex'),
    ENCRYPTION_KEY: crypto.randomBytes(32).toString('base64'),
    REFRESH_SECRET: crypto.randomBytes(64).toString('hex'),
  };
  
  console.log('✅ Secure secrets generated!\n');
  
  console.log('='.repeat(50));
  console.log('🔑 RECOMMENDED FOR JWT_SECRET:');
  console.log('='.repeat(50));
  console.log(`\nJWT_SECRET=${secrets.JWT_SECRET_64}`);
  console.log(`\n# Length: ${secrets.JWT_SECRET_64.length} characters`);
  console.log(`# Format: Base64 (64 bytes)`);
  console.log(`# Entropy: High`);
  
  console.log('\n' + '='.repeat(50));
  console.log('📝 ALL GENERATED SECRETS:');
  console.log('='.repeat(50));
  
  Object.entries(secrets).forEach(([key, value]) => {
    console.log(`\n${key}:`);
    console.log(`  ${value}`);
    console.log(`  Length: ${value.length} chars`);
  });
  
  console.log('\n' + '='.repeat(50));
  console.log('💡 USAGE INSTRUCTIONS:');
  console.log('='.repeat(50));
  
  console.log('\n1. Copy the JWT_SECRET value above');
  console.log('2. Paste it in your .env.local file:');
  console.log('   JWT_SECRET=generated_value_here');
  console.log('\n3. For Vercel production:');
  console.log('   vercel env add JWT_SECRET');
  console.log('   # Paste the generated value when prompted');
  
  console.log('\n⚠️  SECURITY WARNINGS:');
  console.log('   • Never commit secrets to version control');
  console.log('   • Use different secrets for different environments');
  console.log('   • Rotate secrets periodically in production');
  console.log('   • Store secrets in secure environment variables');
  
  console.log('\n🔄 To add to .env.local automatically:');
  console.log('   Run: node scripts/generateSecret.js --save');
  
  // Check if --save flag is provided
  if (process.argv.includes('--save')) {
    const envPath = path.join(process.cwd(), '.env.local');
    
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // Remove existing JWT_SECRET if exists
      envContent = envContent.replace(/JWT_SECRET=.*\n?/, '');
    }
    
    envContent += `\n# Generated on ${new Date().toISOString()}\n`;
    envContent += `JWT_SECRET=${secrets.JWT_SECRET_64}\n`;
    
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    console.log(`\n✅ Saved JWT_SECRET to ${envPath}`);
  }
}

// Export for use in package.json script
if (require.main === module) {
  generateSecret();
}

export { generateSecret };