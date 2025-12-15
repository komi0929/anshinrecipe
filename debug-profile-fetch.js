const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envFile.split('\n').forEach(line => {
            const [key, ...values] = line.split('=');
            if (key && values.length > 0) {
                let val = values.join('=').trim();
                // Remove quotes if present
                if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                envVars[key.trim()] = val;
            }
        });
        return envVars;
    } catch (e) {
        console.error('Error reading .env.local', e);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkFetch() {
    console.log('--- CHECKING TRIED REPORTS FETCH ---');
    const { data, error } = await supabase
        .from('tried_reports')
        .select(`
            *,
            profiles:user_id (
                username,
                avatar_url
            )
        `)
        .limit(3);

    if (error) {
        console.error('FETCH ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('FETCH SUCCESS. Rows:', data.length);
        data.forEach((row, i) => {
            console.log(`[${i}] ID: ${row.id}, UserID: ${row.user_id}`);
            console.log(`    Profiles:`, JSON.stringify(row.profiles));
        });
    }

    console.log('--- CHECKING PROFILES TABLE ---');
    const { data: pros, error: pErr } = await supabase.from('profiles').select('id, username').limit(3);
    if (pErr) console.error('PROFILE CHECK ERR:', JSON.stringify(pErr));
    else console.log('Profiles sample:', JSON.stringify(pros));
}

checkFetch();
