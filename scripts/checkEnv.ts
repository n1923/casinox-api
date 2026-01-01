import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

function checkEnvironmentVariables() {
  console.log('🌍 Environment Variables Diagnostic Tool');
  console.log('='.repeat(60));
  
  console.log('\n📁 File Check:');
  
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (fs.existsSync(envLocalPath)) {
    const stats = fs.statSync(envLocalPath);
    console.log(`  ✅ .env.local: EXISTS (${stats.size} bytes)`);
    console.log(`     Modified: ${stats.mtime.toLocaleString()}`);
  } else {
    console.log('  ❌ .env.local: NOT FOUND');
  }
  
  if (fs.existsSync(envExamplePath)) {
    console.log(`  ✅ .env.example: EXISTS`);
  } else {
    console.log('  ⚠️  .env.example: NOT FOUND');
  }
  
  console.log('\n🔧 Runtime Environment:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`  Platform: ${process.platform}`);
  console.log(`  Node.js: ${process.version}`);
  console.log(`  Current Directory: ${process.cwd()}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('🔐 SECURITY CRITICAL VARIABLES (Required):');
  console.log('='.repeat(60));
  
  const criticalVariables = [
    { name: 'MONGODB_URI', minLength: 10, secret: true },
    { name: 'MONGODB_DB', minLength: 1, secret: false },
    { name: 'JWT_SECRET', minLength: 32, secret: true },
  ];
  
  let allCriticalSet = true;
  
  criticalVariables.forEach(variable => {
    const value = process.env[variable.name];
    const isSet = !!value;
    const isValidLength = isSet && value.length >= variable.minLength;
    
    console.log(`\n${variable.name}:`);
    console.log(`  Status: ${isSet ? '✅ SET' : '❌ NOT SET'}`);
    
    if (isSet) {
      // Mask secret values
      let displayValue = value;
      if (variable.secret) {
        if (variable.name === 'MONGODB_URI') {
          displayValue = value.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
        } else {
          const visibleChars = Math.min(4, value.length);
          displayValue = '***' + value.substring(value.length - visibleChars);
        }
      }
      
      console.log(`  Value: ${displayValue}`);
      console.log(`  Length: ${value.length} characters`);
      
      if (isValidLength) {
        console.log(`  Length Check: ✅ >= ${variable.minLength} chars`);
      } else {
        console.log(`  Length Check: ❌ Should be >= ${variable.minLength} chars`);
        allCriticalSet = false;
      }
      
      // Additional validation based on variable type
      switch(variable.name) {
        case 'MONGODB_URI':
          if (!value.includes('mongodb+srv://')) {
            console.log(`  Format Check: ⚠️  Should start with mongodb+srv://`);
          } else {
            console.log(`  Format Check: ✅ mongodb+srv:// format`);
          }
          break;
          
        case 'JWT_SECRET':
          const entropy = new Set(value.split('')).size / value.length;
          if (entropy > 0.6) {
            console.log(`  Entropy Check: ✅ High (${(entropy * 100).toFixed(1)}% unique)`);
          } else {
            console.log(`  Entropy Check: ⚠️  Low (${(entropy * 100).toFixed(1)}% unique)`);
          }
          break;
      }
    } else {
      allCriticalSet = false;
      console.log(`  Required: ✅ YES`);
      console.log(`  Min Length: ${variable.minLength} characters`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('⚙️  APPLICATION VARIABLES (Recommended):');
  console.log('='.repeat(60));
  
  const recommendedVariables = [
    { name: 'JWT_EXPIRES_IN', defaultValue: '7d' },
    { name: 'JWT_ALGORITHM', defaultValue: 'HS256' },
    { name: 'ALLOWED_ORIGINS', defaultValue: '*' },
    { name: 'RATE_LIMIT_WINDOW_MS', defaultValue: '900000' },
    { name: 'RATE_LIMIT_MAX_REQUESTS', defaultValue: '100' },
    { name: 'LOG_LEVEL', defaultValue: 'info' },
    { name: 'BCRYPT_SALT_ROUNDS', defaultValue: '12' },
    { name: 'API_PREFIX', defaultValue: '/api' },
  ];
  
  recommendedVariables.forEach(variable => {
    const value = process.env[variable.name];
    const isSet = !!value;
    const effectiveValue = value || variable.defaultValue;
    
    console.log(`${variable.name}:`);
    console.log(`  Status: ${isSet ? '✅ SET' : '⚠️  USING DEFAULT'}`);
    console.log(`  Value: ${effectiveValue}`);
    
    if (!isSet) {
      console.log(`  Default: ${variable.defaultValue}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNOSTIC SUMMARY:');
  console.log('='.repeat(60));
  
  // Count all environment variables
  const allEnvVars = Object.keys(process.env);
  const projectEnvVars = allEnvVars.filter(key => 
    key.startsWith('MONGODB_') || 
    key.startsWith('JWT_') || 
    key.startsWith('ALLOWED_') ||
    key.includes('RATE') ||
    key.includes('LOG') ||
    key.includes('API')
  );
  
  console.log(`\nTotal Environment Variables: ${allEnvVars.length}`);
  console.log(`Project-related Variables: ${projectEnvVars.length}`);
  
  if (allCriticalSet) {
    console.log('\n🎉 CRITICAL VARIABLES: ✅ ALL SET');
    console.log('   Your backend is properly configured!');
  } else {
    console.log('\n❌ CRITICAL VARIABLES: MISSING OR INVALID');
    console.log('   Please fix the issues above before proceeding.');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('💡 TROUBLESHOOTING GUIDE:');
  console.log('='.repeat(60));
  
  if (!allCriticalSet) {
    console.log('\n🔧 For Local Development:');
    console.log('   1. Copy .env.example to .env.local:');
    console.log('      cp .env.example .env.local');
    console.log('   2. Edit .env.local with your values');
    console.log('   3. Make sure .env.local is in .gitignore');
    console.log('');
    console.log('🔧 For Vercel Production:');
    console.log('   1. Add environment variables in Vercel dashboard:');
    console.log('      vercel env add MONGODB_URI');
    console.log('      vercel env add MONGODB_DB');
    console.log('      vercel env add JWT_SECRET');
    console.log('   2. Or use Vercel CLI:');
    console.log('      vercel env ls    # List variables');
    console.log('      vercel --prod    # Deploy with variables');
  }
  
  console.log('\n🔍 Common Issues:');
  console.log('   • .env.local not loading? Check file path and name');
  console.log('   • Variables not appearing? Restart your application');
  console.log('   • MongoDB connection failing? Check URI format');
  console.log('   • JWT errors? Verify secret length and algorithm');
  
  console.log('\n🚀 Quick Fix Commands:');
  console.log('   npm run setup            # Install + setup .env.local');
  console.log('   npm run check:jwt        # Check JWT configuration');
  console.log('   npm run test:connection  # Test MongoDB connection');
  
  console.log('\n' + '='.repeat(60));
  
  // Final recommendation
  if (allCriticalSet) {
    console.log('\n✅ READY FOR DEPLOYMENT!');
    console.log('   Next steps:');
    console.log('   1. npm run test:connection');
    console.log('   2. npm run build');
    console.log('   3. vercel --prod');
  } else {
    console.log('\n⛔ NOT READY - Fix configuration issues first');
    process.exit(1);
  }
}

// Run the diagnostic
checkEnvironmentVariables();