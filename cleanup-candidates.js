import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env.local manually
const envContent = readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key) envVars[key.trim()] = value.join('=').trim();
});

const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function cleanup() {
    console.log('=== Cleanup: Removing all pending candidates ===\n');

    // First, count how many we'll delete
    const { count: pendingCount } = await supabase
        .from('candidate_restaurants')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    console.log(`Found ${pendingCount} pending candidates to delete.\n`);

    if (pendingCount === 0) {
        console.log('Nothing to delete!');
        return;
    }

    // Delete all pending candidates
    const { error, count } = await supabase
        .from('candidate_restaurants')
        .delete()
        .eq('status', 'pending');

    if (error) {
        console.error('Delete error:', error);
    } else {
        console.log(`Successfully deleted pending candidates!`);
    }

    // Also clean up raw_collected_data (optional but recommended)
    const { error: rawError } = await supabase
        .from('raw_collected_data')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (rawError) {
        console.log('Raw data cleanup error:', rawError.message);
    } else {
        console.log('Raw collected data cleaned up.');
    }

    // Verify cleanup
    const { count: remainingCount } = await supabase
        .from('candidate_restaurants')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    console.log(`\nRemaining pending candidates: ${remainingCount}`);
}

cleanup().catch(console.error);
