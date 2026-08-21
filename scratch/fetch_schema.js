import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Checking user_collections policies...");
  
  const { data, error } = await supabase
    .from('user_collections')
    .insert([
      { user_id: '00000000-0000-0000-0000-000000000000', target_id: 'b5bd3f5d-7672-46f8-8583-c065677e5f7d' }
    ])
    .select();

  console.log("Insert Result Data:", data);
  if (error) {
    console.error("Insert Error:", error);
  }
}

main();
