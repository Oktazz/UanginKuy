import postgres from 'postgres'

const sql = postgres('postgresql://postgres.pcqzoqqmrxarhjeduijo:45BaOs8JTZ3HSZse@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require');

async function main() {
  try {
    const res = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'schedules'`;
    console.log(res);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await sql.end();
  }
}
main();
