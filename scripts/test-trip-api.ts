import axios from 'axios';
import { config } from 'dotenv';

config();

const API_URL = 'http://localhost:3000/api';

async function testTripFlow() {
  console.log('🚀 Starting API Test Flow...');

  try {
    // 1. Login as Admin
    console.log('🔐 Logging in as admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      Password: 'Password123!'
    });

    const token = loginRes.data.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful!');

    // 2. Fetch Categories and Locations for IDs
    console.log('📂 Fetching categories and locations...');
    const catsRes = await axios.get(`${API_URL}/categories`);
    const locsRes = await axios.get(`${API_URL}/admin/location`, { headers });
    
    const categoriesList = catsRes.data.data.categories;
    const locationsList = locsRes.data.data.locations;

    if (!categoriesList || categoriesList.length === 0) throw new Error('No categories found');
    if (!locationsList || locationsList.length === 0) throw new Error('No locations found');

    const categoryId = categoriesList[0].id;
    const locationId = locationsList[0].id;
    console.log(`✅ Using Category: ${categoriesList[0].name} (${categoryId})`);
    console.log(`✅ Using Location: ${locationsList[0].name} (${locationId})`);

    // 3. Create a Trip
    console.log('📝 Creating a new trip...');
    const tripData = {
      title: 'API Test Trip ' + Date.now(),
      description: 'This trip was created by an automated test.',
      coverImage: 'https://example.com/cover.jpg',
      categoryId: categoryId,
      locationId: locationId,
      startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
      duration: '7 days',
      longDesc: 'Long description for the test trip.',
      groupSize: '10',
      sportLvl: 'medio',
      weekendTt: 'Test',
      shortDesc: 'Short desc',
      promotionalVideo: 'https://youtube.com/watch?v=test',
      galleryImages: ['https://example.com/img1.jpg'],
      bestPriceMsg: 'Best price!',
      perHeadPrice: '1000',
      status: 'pending'
    };

    const createRes = await axios.post(`${API_URL}/trips`, tripData, { headers });
    const tripId = createRes.data.data.trip.id;
    console.log(`✅ Trip created with ID: ${tripId}`);

    // 4. Update the Trip
    console.log('🔄 Updating the trip (standardizing sport level)...');
    await axios.put(`${API_URL}/trips/${tripId}`, {
      sportLvl: 'alto',
      title: 'Updated API Test Trip'
    }, { headers });
    console.log('✅ Trip updated successfully!');

    // 5. Fetch the Trip and check sportLvl
    console.log('🔍 Verifying trip data...');
    // Public detail route: /api/trips/detail/:id
    const getRes = await axios.get(`${API_URL}/trips/detail/${tripId}`);
    const trip = getRes.data.data.trip;
    console.log(`   Title: ${trip.title}`);
    console.log(`   Sport Level: ${trip.sportLvl}`);
    
    if (trip.sportLvl === 'alto') {
      console.log('✅ Sport Level correctly updated to "alto"!');
    } else {
      console.error(`❌ Sport Level mismatch! Expected "alto", got "${trip.sportLvl}"`);
      process.exit(1);
    }

    if (trip.rhythm) {
      console.error('❌ "rhythm" field still exists in the response!');
      process.exit(1);
    } else {
      console.log('✅ "rhythm" field is absent as expected.');
    }

    // 6. Delete the Trip
    console.log('🗑️ Cleaning up (deleting test trip)...');
    await axios.delete(`${API_URL}/trips/${tripId}`, { headers });
    console.log('✅ Test trip deleted!');

    console.log('\n✨ ALL API TESTS PASSED! ✨');

  } catch (error: any) {
    console.error('❌ API Test Failed!');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   URL:', error.config.url);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

testTripFlow();
