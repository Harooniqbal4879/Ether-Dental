import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

async function main() {
  const prodDbUrl = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!prodDbUrl) {
    console.error('No database URL found');
    process.exit(1);
  }
  
  const password = 'March670$';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Generated hash:', hash);
  console.log('Updating password for admin@test.com...');
  
  const sql = neon(prodDbUrl);
  await sql`UPDATE practice_admins SET password_hash = ${hash} WHERE email = 'admin@test.com'`;
  
  console.log('Password updated successfully!');
}

main().catch(console.error);
