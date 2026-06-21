import axios from 'axios';
import assert from 'assert';

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Starting Complaint Lifecycle Tests ---');
  let token;
  let complaintId;

  try {
    // 1. Login
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@demo.com',
      password: 'admin123'
    });
    token = loginRes.data.data.token;
    console.log('✅ Login successful');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Create Complaint
    const createRes = await axios.post(`${API_URL}/complaints`, {
      title: 'Water pipe burst',
      description: 'The main water pipe burst in the neighborhood.',
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139],
        address: 'Connaught Place, New Delhi'
      },
      category: 'Water Supply'
    }, { headers });
    
    complaintId = createRes.data.data._id;
    console.log('✅ Complaint created:', complaintId);

    // 3. Get Complaints
    const getRes = await axios.get(`${API_URL}/complaints`, { headers });
    assert(getRes.data.data.complaints.some(c => c._id === complaintId), 'Complaint not found in list');
    console.log('✅ Complaint listed successfully');

    // 4. Update Complaint Status
    const updateRes = await axios.put(`${API_URL}/complaints/${complaintId}`, {
      status: 'In Progress',
      priority: 'high',
      adminNotes: 'Team dispatched'
    }, { headers });
    assert(updateRes.data.data.status === 'In Progress', 'Status not updated');
    console.log('✅ Complaint status updated successfully');

    console.log('--- All Tests Passed ---');
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();
