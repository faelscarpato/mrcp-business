import fs from 'fs';

async function fetchGovData() {
  const query = 'Constituição';
  const url = `https://dados.gov.br/api/3/action/package_search?q=${encodeURIComponent(query)}`;
  
  console.log('Fetching from:', url);
  
  try {
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0'
        }
    });
    console.log('Status:', response.status);
    const data = await response.text();
    console.log('Body length:', data.length);
    console.log(data.substring(0, 1000));
  } catch (err) {
    console.error('Error fetching data:', err);
  }
}

fetchGovData();
