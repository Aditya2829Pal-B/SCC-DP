import dns from 'dns';
dns.resolveSrv('_mongodb._tcp.sccdp-cluster.6ave2w8.mongodb.net', (err, addresses) => {
  if (err) {
    console.error("DNS Error:", err.message);
  } else {
    console.log("DNS Success:", addresses);
  }
});
