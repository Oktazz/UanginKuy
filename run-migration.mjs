import postgres from 'postgres'
import fs from 'fs'

const sql = postgres('postgresql://postgres.pcqzoqqmrxarhjeduijo:45BaOs8JTZ3HSZse@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require');
const file = fs.readFileSync('docs/migration.sql', 'utf8');

async function main() {
  try {
    const res = await sql.unsafe(file);
    console.log("SUCCESS");
  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    await sql.end();
  }
}
main();
