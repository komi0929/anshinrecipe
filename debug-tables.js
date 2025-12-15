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

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
    console.log('Checking "likes" table...');
    const { data: likes, error: likesError } = await supabase.from('likes').select('*').limit(1);
    if (likesError) {
        console.error('Error fetching likes:', JSON.stringify(likesError, null, 2));
    } else {
        console.log('Likes table exists.');
    }

    console.log('Checking "tried_reports" table...');
    const { data: reports, error: reportsError } = await supabase.from('tried_reports').select('*').limit(1);
    if (reportsError) {
        console.error('Error fetching tried_reports:', JSON.stringify(reportsError, null, 2));
    } else {
        console.log('Tried_reports table exists.');
    }
    console.log('Checking "notifications" table...');
    const { data: notifications, error: notificationsError } = await supabase.from('notifications').select('*').limit(1);
    if (notificationsError) {
        console.error('Error fetching notifications:', JSON.stringify(notificationsError, null, 2));
    } else {
        console.log('Notifications table exists.');
    }

    console.log('Checking "profiles" columns...');
    const { data: profile } = await supabase.from('profiles').select('*').limit(1);
    // ... (keep headers)

    console.log('Checking "notifications" columns...');
    const { data: notif } = await supabase.from('notifications').select('*').limit(1);
    if (notif && notif.length > 0) {
        console.log('Notification columns:', Object.keys(notif[0]));
    } else {
        console.log('Could not fetch notification (table empty?)');
    }
}

checkTables();
