import dotenv from 'dotenv';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

dotenv.config({ path: '.env.local' });

function checkJWTConfig() {
  console.log('🔐 JWT Configuration Validation');
  console.log('='.repeat(50));
  
  const JWT_SECRET = process.env.JWT_SECRET;
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'HS256';
  
  let score = 0;
  const maxScore = 10;
  
  console.log('\n1. JWT_SECRET Analysis:');
  
  if (!JWT_SECRET) {
    console.log('   ❌ NOT SET - Critical security risk!');
    console.log('   Score: 0/3');
  } else {
    // Length check
    const lengthScore = Math.min(3, Math.floor(JWT_SECRET.length / 10));
    console.log(`   Length: ${JWT_SECRET.length} characters`);
    
    if (JWT_SECRET.length >= 32) {
      console.log('   ✅ Minimum length (32+): PASSED');
      score += lengthScore;
    } else {
      console.log(`   ⚠️  Minimum length: Should be at least 32 characters (currently: ${JWT_SECRET.length})`);
    }
    
    // Entropy check
    const charSet = new Set(JWT_SECRET.split(''));
    const entropy = charSet.size / JWT_SECRET.length;
    
    if (entropy > 0.6) {
      console.log('   ✅ High entropy: PASSED');
      score += 2;
    } else {
      console.log(`   ⚠️  Low entropy: ${(entropy * 100).toFixed(1)}% unique characters`);
    }
    
    // Pattern check
    const commonPatterns = [
      'password', 'secret', 'key', 'jwt', 'token',
      '123456', 'abcdef', 'qwerty', 'admin', 'test'
    ];
    
    let hasCommonPattern = false;
    for (const pattern of commonPatterns) {
      if (JWT_SECRET.toLowerCase().includes(pattern)) {
        hasCommonPattern = true;
        console.log(`   ⚠️  Contains common pattern: "${pattern}"`);
      }
    }
    
    if (!hasCommonPattern) {
      console.log('   ✅ No common patterns: PASSED');
      score += 1;
    }
    
    console.log(`   Score: ${Math.min(3, lengthScore + (entropy > 0.6 ? 2 : 0) + (!hasCommonPattern ? 1 : 0))}/3`);
  }
  
  console.log('\n2. JWT_EXPIRES_IN Analysis:');
  
  const validDurations = ['15m', '30m', '1h', '6h', '12h', '1d', '7d', '30d'];
  const durationRegex = /^(\d+)(s|m|h|d)$/;
  const match = JWT_EXPIRES_IN.match(durationRegex);
  
  if (match && validDurations.includes(JWT_EXPIRES_IN)) {
    console.log(`   Value: ${JWT_EXPIRES_IN}`);
    console.log('   ✅ Valid duration format');
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    // Convert to seconds for comparison
    let seconds = 0;
    switch (unit) {
      case 's': seconds = value; break;
      case 'm': seconds = value * 60; break;
      case 'h': seconds = value * 3600; break;
      case 'd': seconds = value * 86400; break;
    }
    
    if (seconds >= 900 && seconds <= 2592000) { // 15min to 30days
      console.log('   ✅ Reasonable expiration time');
      score += 2;
    } else if (seconds < 900) {
      console.log('   ⚠️  Very short expiration (<15min)');
    } else {
      console.log('   ⚠️  Very long expiration (>30days)');
    }
  } else {
    console.log(`   Value: ${JWT_EXPIRES_IN}`);
    console.log('   ⚠️  Non-standard duration format');
  }
  
  console.log(`   Score: ${seconds >= 900 && seconds <= 2592000 ? 2 : 0}/2`);
  
  console.log('\n3. JWT_ALGORITHM Analysis:');
  
  const validAlgorithms = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'];
  
  if (validAlgorithms.includes(JWT_ALGORITHM)) {
    console.log(`   Value: ${JWT_ALGORITHM}`);
    
    if (JWT_ALGORITHM.startsWith('HS')) {
      console.log('   ✅ HMAC algorithm (symmetric)');
      console.log('   ℹ️  Requires secure secret storage');
      score += 2;
    } else if (JWT_ALGORITHM.startsWith('RS') || JWT_ALGORITHM.startsWith('ES')) {
      console.log('   ✅ RSA/ECDSA algorithm (asymmetric)');
      console.log('   ℹ️  More secure, requires key pair');
      score += 3;
    }
  } else {
    console.log(`   Value: ${JWT_ALGORITHM}`);
    console.log('   ❌ Invalid algorithm');
    console.log('   Valid options:', validAlgorithms.join(', '));
  }
  
  console.log(`   Score: ${JWT_ALGORITHM.startsWith('HS') ? 2 : JWT_ALGORITHM.startsWith('RS') || JWT_ALGORITHM.startsWith('ES') ? 3 : 0}/3`);
  
  console.log('\n4. Token Generation Test:');
  
  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET not set');
    }
    
    const testPayload = {
      userId: 'test-123',
      email: 'test@example.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    
    const token = jwt.sign(testPayload, JWT_SECRET, {
      algorithm: JWT_ALGORITHM as jwt.Algorithm,
      expiresIn: JWT_EXPIRES_IN
    });
    
    console.log('   ✅ Token generation: PASSED');
    
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM as jwt.Algorithm]
    });
    
    console.log('   ✅ Token verification: PASSED');
    console.log(`   Token length: ${token.length} characters`);
    
    // Test signature
    const parts = token.split('.');
    if (parts.length === 3) {
      console.log('   ✅ Token structure: PASSED (header.payload.signature)');
      score += 2;
    } else {
      console.log('   ❌ Invalid token structure');
    }
    
  } catch (error: any) {
    console.log('   ❌ Token test failed:', error.message);
    
    if (error.message.includes('secret')) {
      console.log('   💡 Check JWT_SECRET format and length');
    } else if (error.message.includes('algorithm')) {
      console.log('   💡 Check JWT_ALGORITHM value');
    } else if (error.message.includes('expired')) {
      console.log('   💡 Check JWT_EXPIRES_IN value');
    }
  }
  
  console.log(`   Score: 2/2`);
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 FINAL SCORE:', `${score}/${maxScore}`);
  
  if (score >= 8) {
    console.log('🏆 EXCELLENT: JWT configuration is secure and properly set!');
  } else if (score >= 6) {
    console.log('✅ GOOD: JWT configuration is acceptable but could be improved');
  } else if (score >= 4) {
    console.log('⚠️  FAIR: JWT configuration needs improvements');
  } else {
    console.log('❌ POOR: JWT configuration has significant security issues');
  }
  
  console.log('='.repeat(50));
  
  console.log('\n🔒 SECURITY RECOMMENDATIONS:');
  
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    console.log('   1. Generate a new secure JWT_SECRET:');
    console.log('      npm run generate:secret');
  }
  
  if (!validDurations.includes(JWT_EXPIRES_IN)) {
    console.log('   2. Use standard duration format (15m, 1h, 1d, 7d, 30d)');
  }
  
  if (JWT_ALGORITHM.startsWith('HS') && score < 8) {
    console.log('   3. Consider using RS256 for better security');
  }
  
  console.log('   4. Store secrets in environment variables only');
  console.log('   5. Rotate JWT_SECRET periodically in production');
  console.log('   6. Use different secrets for different environments');
  
  console.log('\n🔄 To generate a new JWT_SECRET:');
  console.log('   npm run generate:secret');
}

// Run check
checkJWTConfig();