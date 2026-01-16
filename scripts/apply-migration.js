/**
 * Apply Migration Script
 * Executes the add_evidence_columns migration using Supabase RPC
 * 
 * Run with: node scripts/apply-migration.js
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

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    console.log('[Migration] Applying add_evidence_columns migration...');

    // Execute migration statements individually
    const statements = [
        `ALTER TABLE menus ADD COLUMN IF NOT EXISTS evidence_url TEXT`,
        `ALTER TABLE menus ADD COLUMN IF NOT EXISTS source_image_url TEXT`,
        `ALTER TABLE menus ADD COLUMN IF NOT EXISTS safe_from_allergens TEXT[] DEFAULT '{}'`,
        `ALTER TABLE menus ADD COLUMN IF NOT EXISTS image_url TEXT`,
        `ALTER TABLE menus ADD COLUMN IF NOT EXISTS child_status TEXT DEFAULT 'checking'`,
        `ALTER TABLE menus ADD COLUMN IF NOT EXISTS child_details JSONB DEFAULT '{}'`
    ];

    for (const sql of statements) {
        console.log(`[Migration] Executing: ${sql.slice(0, 60)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
            // RPC might not exist, try raw query through postgrest
            console.warn(`[Migration] RPC failed, column may already exist or needs manual application: ${error.message}`);
        }
    }

    // Verify columns exist by trying to select them
    console.log('\n[Migration] Verifying columns...');
    const { data, error } = await supabase
        .from('menus')
        .select('id, evidence_url, source_image_url, image_url')
        .limit(1);

    if (error) {
        console.error('[Migration] Verification failed:', error.message);
        console.log('\n⚠️  Please apply the migration manually in Supabase SQL Editor:');
        console.log('   File: data/migrations/add_evidence_columns.sql');
        return false;
    }

    console.log('✅ Migration applied successfully!');
    return true;
}

// Also cleanup orphaned test restaurants
async function cleanupTestData() {
    console.log('\n[Cleanup] Removing orphaned test restaurants...');

    const { error } = await supabase
        .from('restaurants')
        .delete()
        .like('name', '%【テスト】%');

    if (error) {
        console.warn('[Cleanup] Warning:', error.message);
    } else {
        console.log('[Cleanup] Done');
    }
}

applyMigration().then(async (success) => {
    await cleanupTestData();
    if (!success) {
        console.log('\n❌ Migration needs manual application. Copy the SQL from data/migrations/add_evidence_columns.sql');
    }
    process.exit(success ? 0 : 1);
});
