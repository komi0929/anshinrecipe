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

async function checkJoins() {
    console.log('--- TRIED REPORTS JOIN CHECK ---');
    // Attempt exact query from socialActions.js
    const { data, error } = await supabase
        .from('tried_reports')
        .select(`
            *,
            profiles:user_id (
                username,
                avatar_url
            )
        `)
        .limit(1);

    if (error) {
        console.error('JOIN QUERY FAILED:', JSON.stringify(error, null, 2));
    } else {
        console.log('JOIN QUERY SUCCESS. Data:', data);
    }

    console.log('--- INSERT CHECK ---');
    // Check if we can get schema info or just basic select without join
    const { error: simpleError } = await supabase.from('tried_reports').select('*').limit(1);
    if (simpleError) {
        console.error('SIMPLE SELECT FAILED:', JSON.stringify(simpleError, null, 2));
    } else {
        console.log('SIMPLE SELECT SUCCESS');
    }
}

checkJoins();
