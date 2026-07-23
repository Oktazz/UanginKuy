import postgres from 'postgres'

const sql = postgres('postgresql://postgres.pcqzoqqmrxarhjeduijo:45BaOs8JTZ3HSZse@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require');

async function main() {
  try {
    const res = await sql`INSERT INTO schedules (day_of_week, cut_off_time, is_active) VALUES (1, '10:00:00', true) RETURNING *`;
    console.log("Success:", res);
  } catch (err) {
    console.error("Error inserting:", err.message);
  } finally {
    await sql.end();
  }
}
main();
