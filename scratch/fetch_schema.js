import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim().replace(/^"|"$/g, '');
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)[1].trim().replace(/^"|"$/g, '');

fetch(`${url}/rest/v1/ar_targets?select=*&limit=1`, {
  method: 'GET',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
})
.then(res => res.json())
.then(data => {
  console.log("Targets Data:", JSON.stringify(data, null, 2));
})
.catch(err => console.error("Error:", err));
