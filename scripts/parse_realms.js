const fs = require('fs');

function parseCSV(text) {
    let result = [];
    let row = [];
    let val = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        let c = text[i];

        if (inQuotes) {
            if (c === '"') {
                if (i + 1 < text.length && text[i + 1] === '"') {
                    val += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                val += c;
            }
        } else {
            if (c === '"') {
                inQuotes = true;
            } else if (c === ',') {
                row.push(val);
                val = '';
            } else if (c === '\n' || c === '\r') {
                if (c === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
                    i++; // Skip \n after \r
                }
                row.push(val);
                val = '';
                if (row.length > 1 || row[0] !== '') {
                    result.push(row);
                }
                row = [];
            } else {
                val += c;
            }
        }
    }
    if (val || row.length > 0) {
        row.push(val);
        result.push(row);
    }
    return result;
}

const content = fs.readFileSync('Game_Rebird/data_Realm.csv', 'utf8');
const rows = parseCSV(content);

let sql = `
-- Create Rebirth Game Tables

CREATE TABLE IF NOT EXISTS public.game_rebirth_realms (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    short_desc TEXT,
    description TEXT,
    image_url TEXT,
    life_days INTEGER NOT NULL DEFAULT 0,
    dice_1 INTEGER,
    dice_2 INTEGER,
    dice_3 INTEGER,
    dice_4 INTEGER,
    dice_5 INTEGER,
    dice_6 INTEGER
);

CREATE TABLE IF NOT EXISTS public.user_rebirth_state (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    realm_id INTEGER REFERENCES public.game_rebirth_realms(id) DEFAULT 24,
    life_days_remaining INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.game_rebirth_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    from_realm_id INTEGER REFERENCES public.game_rebirth_realms(id),
    to_realm_id INTEGER REFERENCES public.game_rebirth_realms(id),
    dice_result INTEGER,
    days_spent INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.game_rebirth_mara_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    realm_id INTEGER REFERENCES public.game_rebirth_realms(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    difficulty_days INTEGER NOT NULL DEFAULT 1,
    active_until TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.game_rebirth_realms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Realms are viewable by everyone" ON public.game_rebirth_realms;
CREATE POLICY "Realms are viewable by everyone" ON public.game_rebirth_realms FOR SELECT USING (true);

ALTER TABLE public.user_rebirth_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all rebirth states" ON public.user_rebirth_state;
CREATE POLICY "Users can view all rebirth states" ON public.user_rebirth_state FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own rebirth state" ON public.user_rebirth_state;
CREATE POLICY "Users can update own rebirth state" ON public.user_rebirth_state FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own rebirth state" ON public.user_rebirth_state;
CREATE POLICY "Users can insert own rebirth state" ON public.user_rebirth_state FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.game_rebirth_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all rebirth history" ON public.game_rebirth_history;
CREATE POLICY "Users can view all rebirth history" ON public.game_rebirth_history FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own rebirth history" ON public.game_rebirth_history;
CREATE POLICY "Users can insert own rebirth history" ON public.game_rebirth_history FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.game_rebirth_mara_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view mara challenges" ON public.game_rebirth_mara_challenges;
CREATE POLICY "Everyone can view mara challenges" ON public.game_rebirth_mara_challenges FOR SELECT USING (true);
DROP POLICY IF EXISTS "Only admins can insert mara challenges" ON public.game_rebirth_mara_challenges;
CREATE POLICY "Only admins can insert mara challenges" ON public.game_rebirth_mara_challenges FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Seed Data
INSERT INTO public.game_rebirth_realms (id, name, short_desc, image_url, description, life_days, dice_1, dice_2, dice_3, dice_4, dice_5, dice_6) VALUES
`;

const seedRows = [];
const header = rows[0];
for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 12 || !row[0].trim() || isNaN(parseInt(row[0]))) continue;

    let id = parseInt(row[0]);
    let name = row[1].trim().replace(/'/g, "''");
    let short_desc = row[2].trim().replace(/'/g, "''");
    let image_url = row[3].trim().replace(/'/g, "''");
    let description = row[4].trim().replace(/'/g, "''");
    let life_days = parseInt(row[5]) || 0;
    let dice_1 = parseInt(row[6]) || null;
    let dice_2 = parseInt(row[7]) || null;
    let dice_3 = parseInt(row[8]) || null;
    let dice_4 = parseInt(row[9]) || null;
    let dice_5 = parseInt(row[10]) || null;
    let dice_6 = parseInt(row[11]) || null;

    seedRows.push(`(${id}, '${name}', '${short_desc}', '${image_url}', '${description}', ${life_days}, ${dice_1}, ${dice_2}, ${dice_3}, ${dice_4}, ${dice_5}, ${dice_6})`);
}

sql += seedRows.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, short_desc = EXCLUDED.short_desc, description = EXCLUDED.description, image_url = EXCLUDED.image_url, life_days = EXCLUDED.life_days, dice_1 = EXCLUDED.dice_1, dice_2 = EXCLUDED.dice_2, dice_3 = EXCLUDED.dice_3, dice_4 = EXCLUDED.dice_4, dice_5 = EXCLUDED.dice_5, dice_6 = EXCLUDED.dice_6;\n';

fs.writeFileSync('supabase/migrations/20260224_ADD_REBIRTH_GAME.sql', sql);
console.log('Migration file created with ' + seedRows.length + ' rows.');
