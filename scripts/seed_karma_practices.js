#!/usr/bin/env node
/**
 * Karma Practices Seeding Script
 * Seeds the karma_practices table in Supabase from the local JSON file.
 * 
 * Usage:
 *   node scripts/seed_karma_practices.js
 * 
 * Env vars required:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (from .env.local)
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    console.error('   Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file');
    process.exit(1);
}

// Load practices data
const dataPath = path.join(__dirname, 'karma_practices_365.json');
if (!fs.existsSync(dataPath)) {
    console.error('❌ karma_practices_365.json not found at', dataPath);
    process.exit(1);
}

const practices = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
console.log(`📚 Loaded ${practices.length} practices from JSON`);

async function seed() {
    console.log('🌱 Starting seed to Supabase...');
    console.log(`   URL: ${SUPABASE_URL}`);

    let successCount = 0;
    let errorCount = 0;

    for (const p of practices) {
        const record = {
            id: p.id,
            title: p.title,
            category: p.category || null,
            energy_type: p.energy_type || null,
            tags: p.tags || [],
            target_flaw: p.target_flaw || null,
            practice_type: p.practice_type || 'Normal',
            content: p.content,
            embedding: null // Will be populated later when embeddings API is available
        };

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/karma_practices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify(record)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`  ❌ [${p.id}] ${p.title}: ${response.status} — ${errText}`);
                errorCount++;
            } else {
                console.log(`  ✅ [${p.id}] ${p.title}`);
                successCount++;
            }
        } catch (err) {
            console.error(`  ❌ [${p.id}] ${p.title}: Network error — ${err.message}`);
            errorCount++;
        }
    }

    console.log('\n─────────────────────────────────────────');
    console.log(`✅ Success: ${successCount}/${practices.length}`);
    if (errorCount > 0) {
        console.log(`❌ Errors:  ${errorCount}/${practices.length}`);
    }
    console.log('─────────────────────────────────────────');

    if (successCount > 0) {
        console.log('\n📊 Verifying count in DB...');
        const countRes = await fetch(`${SUPABASE_URL}/rest/v1/karma_practices?select=id`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'count=exact'
            }
        });
        const countHeader = countRes.headers.get('content-range');
        console.log(`   Total rows in karma_practices: ${countHeader || 'unknown'}`);
    }
}

seed().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
