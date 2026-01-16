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

async function investigate() {
    console.log('=== Investigating Pending Candidates ===\n');

    // Check count of pending candidates
    const { count: pendingCount } = await supabase
        .from('candidate_restaurants')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
    console.log(`Total Pending Candidates: ${pendingCount}\n`);

    // Check recent jobs
    const { data: jobs, error: jobError } = await supabase
        .from('data_collection_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    console.log('=== Recent Collection Jobs ===');
    if (jobError) console.log('Job Error:', jobError);
    if (jobs && jobs.length > 0) {
        jobs.forEach(j => {
            console.log(`  [${j.status}] ${j.area_name} - ${j.collected_count || 0} collected, ${j.processed_count || 0} processed - ${j.created_at}`);
        });
    } else {
        console.log('  No jobs found');
    }

    // Check sample of pending candidates to see the source
    const { data: samples } = await supabase
        .from('candidate_restaurants')
        .select('id, shop_name, job_id, sources, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log('\n=== Sample Pending Candidates (newest first) ===');
    if (samples && samples.length > 0) {
        samples.forEach(s => {
            console.log(`  - ${s.shop_name} (job_id: ${s.job_id}) created: ${s.created_at}`);
        });
    } else {
        console.log('  No pending candidates found');
    }

    // Check unique job_ids from candidates
    const { data: jobIds } = await supabase
        .from('candidate_restaurants')
        .select('job_id')
        .eq('status', 'pending');

    if (jobIds) {
        const uniqueJobIds = [...new Set(jobIds.map(j => j.job_id))];
        console.log(`\n=== Unique Job IDs in pending candidates: ${uniqueJobIds.length} ===`);
        console.log(uniqueJobIds.slice(0, 10).join(', '));
    }
}

investigate().catch(console.error);
