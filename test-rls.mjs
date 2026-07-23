import postgres from 'postgres'

const sql = postgres('postgresql://postgres.pcqzoqqmrxarhjeduijo:45BaOs8JTZ3HSZse@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require');

async function main() {
  try {
    const res = await sql`SELECT * FROM pg_policies WHERE tablename = 'schedules'`;
    console.log(res);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await sql.end();
  }
}
main();
