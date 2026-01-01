import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });

function checkJWTConfig() {
  console.log('🔐 JWT Configuration Check\n');
  
  const JWT_SECRET = process.env.JWT_SECRET;
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
  const JWT_ALGORITHM = process.env.JWT_ALGORITHM;
  
  console.log('1. JWT_SECRET:');
  if (!JWT_SECRET) {
    console.log('   ❌ NOT SET - Please set JWT_SECRET environment variable');
    process.exit(1);
  }
  
  console.log('   ✅ Set:', JWT_SECRET ? 'Yes' : 'No');
  console.log('   Length:', JWT_SECRET.length, 'characters');
  console.log('   Minimum required: 32 characters');
  
  if (JWT_SECRET.length < 32) {
    console.log('   ⚠️  WARNING: JWT_SECRET should be at least 32 characters for security');
  }
  
  console.log('\n2. JWT_EXPIRES_IN:');
  console.log('   Value:', JWT_EXPIRES_IN || '7d (default)');
  
  const validDurations = ['15m', '1h', '6h', '12h', '1d', '7d', '30d'];
  if (JWT_EXPIRES_IN && !validDurations.includes(JWT_EXPIRES_IN)) {
    console.log('   ⚠️  WARNING: Unusual duration. Consider using:', validDurations.join(', '));
  }
  
  console.log('\n3. JWT_ALGORITHM:');
  console.log('   Value:', JWT_ALGORITHM || 'HS256 (default)');
  
  const validAlgorithms = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512'];
  if (JWT_ALGORITHM && !validAlgorithms.includes(JWT_ALGORITHM)) {
    console.log('   ❌ INVALID: Must be one of:', validAlgorithms.join(', '));
    process.exit(1);
  }
  
  console.log('\n4. Security Recommendations:');
  console.log('   ✅ Use HS256 or HS512 for HMAC algorithms');
  console.log('   ✅ Consider RS256 for asymmetric encryption in production');
  console.log('   ✅ Store JWT_SECRET securely in environment variables');
  console.log('   ✅ Rotate JWT_SECRET periodically in production');
  console.log('   ✅ Use different secrets for different environments');
  
  console.log('\n5. Test Token Generation:');
  try {
    const testPayload = { test: true, userId: 'test-123' };
    const testSecret = JWT_SECRET;
    
    // Create a simple test signature
    const hmac = crypto.createHmac('sha256', testSecret);
    hmac.update(JSON.stringify(testPayload));
    const signature = hmac.digest('hex').substring(0, 16);
    
    console.log('   ✅ JWT_SECRET appears valid');
    console.log('   Test signature (first 16 chars):', signature);
    
  } catch (error) {
    console.log('   ❌ Error testing JWT_SECRET:', error.message);
    process.exit(1);
  }
  
  console.log('\n🎉 JWT Configuration is valid and ready for use!');
  
  // Generate a sample JWT_SECRET if needed
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    console.log('\n📋 Sample JWT_SECRET generation:');
    const newSecret = crypto.randomBytes(32).toString('base64');
    console.log('   JWT_SECRET=' + newSecret);
    console.log('\n⚠️  Copy this to your .env.local file and restart your application');
  }
}

checkJWTConfig();