import { getTrips } from '../src/controllers/trips/get-trips.controller';
import { Request, Response } from 'express';

async function reproAll() {
  const filters = [
    {},
    { status: 'open' },
    { type: 'wild trips' },
    { past: 'true' },
    { upcoming: 'true' }
  ];

  for (const filter of filters) {
    console.log(`\n\n--- Testing Filter: ${JSON.stringify(filter)} ---`);
    const req = {
      query: filter
    } as unknown as Request;
    const res = {
      status: (code: number) => {
        console.log('Status:', code);
        return res;
      },
      json: (data: any) => {
        if (!data.success) {
           console.log('JSON FAILURE OUTPUT:', JSON.stringify(data, null, 2));
        } else {
           console.log('JSON SUCCESS: Fetched', data.data.trips.length, 'trips');
        }
        return res;
      },
      sendSuccess: () => {}, // mock some utility if present
      sendError: () => {}, 
    } as unknown as Response;

    try {
      await getTrips(req, res);
    } catch (err) {
      console.error('Fatal catch in repro:', err);
    }
  }
}

reproAll();
