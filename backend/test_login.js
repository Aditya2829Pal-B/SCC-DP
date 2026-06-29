import axios from 'axios';

async function testLogin() {
  try {
    const res = await axios.post('https://scc-dp.onrender.com/api/auth/login', {
      email: 'admin@sccdp.me',
      password: 'Admin@2026'
    });
    console.log('Login success:', res.data);
  } catch (err) {
    console.error('Login failed:', err.response?.status, err.response?.data);
  }
}

testLogin();
