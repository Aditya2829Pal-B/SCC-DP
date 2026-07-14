import axios from 'axios';

async function testApi() {
  try {
    const loginRes = await axios.post('https://scc-dp.onrender.com/api/auth/login', {
      email: 'admin@sccdp.me',
      password: 'Admin@2026'
    });
    const token = loginRes.data.data.token;
    
    const res = await axios.get('https://scc-dp.onrender.com/api/analytics/overview', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Live API Response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('API failed:', err.response?.data || err.message);
  }
}

testApi();
