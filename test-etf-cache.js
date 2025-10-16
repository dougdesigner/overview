// Script to test ETF cache by fetching QQQM data
const fetch = require('node-fetch');

async function testETFCache() {
  try {
    console.log('Testing ETF cache for QQQM...\n');

    const response = await fetch('http://localhost:3005/api/etf-holdings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ symbols: ['QQQM'] })
    });

    if (response.ok) {
      const data = await response.json();
      const qqqm = data.QQQM;

      if (qqqm) {
        console.log(`Symbol: ${qqqm.symbol}`);
        console.log(`Name: ${qqqm.name}`);
        console.log(`Holdings count: ${qqqm.holdings?.length || 0}`);
        console.log(`Last updated: ${qqqm.lastUpdated}`);

        if (qqqm.holdings && qqqm.holdings.length > 0) {
          console.log('\nTop 5 holdings:');
          qqqm.holdings.slice(0, 5).forEach(h => {
            console.log(`  ${h.symbol}: ${h.name} (${h.weight.toFixed(2)}%)`);
          });

          if (qqqm.holdings.length > 10) {
            console.log(`\n... and ${qqqm.holdings.length - 5} more holdings`);
          }
        }
      } else {
        console.log('No data returned for QQQM');
      }
    } else {
      console.error('API request failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error testing ETF cache:', error.message);
  }
}

testETFCache();