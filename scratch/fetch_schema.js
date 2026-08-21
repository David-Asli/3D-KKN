import fs from 'fs';
import { randomUUID } from 'crypto';

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim().replace(/^"|"$/g, '');
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)[1].trim().replace(/^"|"$/g, '');

const fakeUUID1 = randomUUID();
const fakeUUID2 = randomUUID();

fetch(`${url}/rest/v1/user_collections`, {
  method: 'POST',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: JSON.stringify({ "user_id": fakeUUID1, "target_id": fakeUUID2 })
})
.then(res => res.json())
.then(data => {
  console.log("Response:", data);
})
.catch(err => console.error("Error:", err));
