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

async function checkProfiles() {
    console.log('--- CHECKING PROFILES ---');
    const { data: pros, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, picture_url')
        .order('updated_at', { ascending: false }) // Get most recently updated
        .limit(5);

    if (error) {
        console.error('ERROR:', error);
    } else {
        console.log('Recent Profiles:', JSON.stringify(pros, null, 2));
    }
}

checkProfiles();
