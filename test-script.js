const url = 'https://script.google.com/macros/s/AKfycbzWCKBqHWW6u5yRjwvmMFRz7Lk52QBaBMeXQK50v_UayuXKqoU_a9E7gDJzQmcdfhpX_A/exec';

async function testPost() {
  console.log('--- Testing POST ---');
  const params = new URLSearchParams();
  params.append('action', 'save');
  params.append('timestamp', new Date().toISOString());
  params.append('room', 'Mawar 1');
  params.append('rm', '123456');
  params.append('name', 'Budi Test');
  params.append('gender', 'Laki-laki (L)');
  params.append('age', '45');
  params.append('weight', '65');
  params.append('height', '170');
  params.append('followTtv', 'true');
  params.append('vitalsTime', '10:00');
  params.append('bp', '120/80');
  params.append('hr', '80');
  params.append('bcMakanType', 'Makan');
  params.append('bcMakanValue', '200');
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    
    // Some google macros redirect and we need to follow, node fetch does it by default
    const text = await res.text();
    console.log('POST Response:', text);
  } catch (err) {
    console.error('POST Error:', err);
  }
}

async function testGet() {
  console.log('\n--- Testing GET ---');
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('GET Response (first 2 rows):', data.slice(0, 2));
    if (data.length > 0) {
      console.log('Keys available in first row:', Object.keys(data[0]));
    }
  } catch (err) {
    console.error('GET Error:', err);
  }
}

async function run() {
  await testPost();
  await testGet();
}

run();
