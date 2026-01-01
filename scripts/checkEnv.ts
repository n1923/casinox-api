import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

function checkEnvironmentVariables() {
  console.log('🔍 Environment Variables Check\n');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('='.repeat(50));

  const requiredVars = [
    'MONGODB_URI',
    'MONGODB_DB', 
    'JWT_SECRET',
  ];

  const optionalVars = [
    'JWT_EXPIRES_IN',
    'JWT_ALGORITHM',
    'ALLOWED_ORIGINS',
    'NODE_ENV',
  ];

  console.log('\n✅ REQUIRED VARIABLES:');
  let allRequiredSet = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    const isSet = !!value;
    
    if (isSet) {
      // Mask sensitive values
      let displayValue = value || '';
      if (varName.includes('SECRET') || varName.includes('URI')) {
        if (varName === 'MONGODB_URI' && value) {
          displayValue = value.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
        } else if (varName.includes('SECRET')) {
          displayValue = '***' + value!.substring(value!.length - 4);
        }
      }
      
      console.log(`  ${varName}: ${displayValue}`);
      console.log(`    Length: ${value?.length} characters`);
    } else {
      console.log(`  ❌ ${varName}: NOT SET`);
      allRequiredSet = false;
    }
  });

  console.log('\n📝 OPTIONAL VARIABLES:');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    const isSet = !!value;
    
    if (isSet) {
      console.log(`  ${varName}: ${value}`);
    } else {
      console.log(`  ⚠️  ${varName}: Not set (using default)`);
    }
  });

  console.log('\n' + '='.repeat(50));
  
  if (!allRequiredSet) {
    console.log('\n❌ ERROR: Missing required environment variables!');
    console.log('\n💡 SOLUTION:');
    console.log('   For Local Development:');
    console.log('     1. Create .env.local file in backend-ts directory');
    console.log('     2. Add required variables (see .env.example)');
    console.log('');
    console.log('   For Vercel Production:');
    console.log('     1. Run: vercel env add MONGODB_URI');
    console.log('     2. Run: vercel env add MONGODB_DB');
    console.log('     3. Run: vercel env add JWT_SECRET');
    console.log('');
    console.log('   To list all env vars: vercel env ls');
    process.exit(1);
  } else {
    console.log('\n🎉 All environment variables are properly set!');
    
    // Check MongoDB URI format
    const mongoUri = process.env.MONGODB_URI!;
    if (!mongoUri.includes('mongodb+srv://')) {
      console.log('⚠️  WARNING: MongoDB URI should start with mongodb+srv:// for Atlas');
    }
    
    // Check JWT secret strength
    const jwtSecret = process.env.JWT_SECRET!;
    if (jwtSecret.length < 32) {
      console.log('⚠️  WARNING: JWT_SECRET should be at least 32 characters');
    }
  }
}

checkEnvironmentVariables();