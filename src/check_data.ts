import { database } from "./configs/connection.config";
import { trips } from "./schema/schema";

async function check() {
  const db = await database();
  const allTrips = await db.select().from(trips);
  console.log('Total Trips:', allTrips.length);
  for (const trip of allTrips) {
    if (!trip.id || !trip.title) {
       console.log('BAD TRIP:', JSON.stringify(trip));
    }
  }
}

check();
