import postgres from 'postgres'

const sql = postgres('postgresql://postgres.pcqzoqqmrxarhjeduijo:45BaOs8JTZ3HSZse@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require');

async function main() {
  try {
    const res = await sql`ALTER TABLE schedules ALTER COLUMN cut_off_time TYPE TIME USING cut_off_time::TIME`;
    console.log("Success:", res);
  } catch (err) {
    console.error("Error inserting:", err.message);
  } finally {
    await sql.end();
  }
}
main();
