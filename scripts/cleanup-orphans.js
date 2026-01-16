/**
 * Cleanup: Delete orphan test restaurant without menus
 */
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim();
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log('Deleting orphan test restaurant (30362592...)');

    const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', '30362592-6c47-407a-8531-51b8f12bb7d5');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('✅ Deleted orphan restaurant');
    }

    // Also delete the 01cf433a one from earlier failed attempt
    const { error: error2 } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', '01cf433a-ba41-4a9c-8e56-');

    // Verify remaining test restaurants
    const { data } = await supabase
        .from('restaurants')
        .select('id, name')
        .like('name', '%テスト%');

    console.log('\nRemaining test restaurants:', data?.length || 0);
    data?.forEach(r => console.log(`  - ${r.id}: ${r.name}`));
}

cleanup().then(() => process.exit(0));
