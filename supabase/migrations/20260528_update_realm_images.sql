-- Migration to update game rebirth realm images with 20 optimized landscape borderless illustrations

-- Hot Hells
UPDATE public.game_rebirth_realms SET image_url = 'Realm_01.jpg' WHERE id IN (1, 2, 3, 4, 5, 6);
-- Cold Hell
UPDATE public.game_rebirth_realms SET image_url = 'Realm_02.jpg' WHERE id IN (7);
-- Temporary Hells & Judgements
UPDATE public.game_rebirth_realms SET image_url = 'Realm_03.jpg' WHERE id IN (8, 9);
-- Hungry Ghosts (Preta)
UPDATE public.game_rebirth_realms SET image_url = 'Realm_04.jpg' WHERE id IN (10);
-- Animals
UPDATE public.game_rebirth_realms SET image_url = 'Realm_05.jpg' WHERE id IN (11);
-- Dragon Kings (Nagas)
UPDATE public.game_rebirth_realms SET image_url = 'Realm_19.jpg' WHERE id IN (12, 13);
-- Yakshas / Ghost continental
UPDATE public.game_rebirth_realms SET image_url = 'Realm_07.jpg' WHERE id IN (14);
-- Asuras
UPDATE public.game_rebirth_realms SET image_url = 'Realm_08.jpg' WHERE id IN (15, 16);
-- Human Continents (Jambudvipa, etc.)
UPDATE public.game_rebirth_realms SET image_url = 'Realm_09.jpg' WHERE id IN (17, 18, 19, 21);
-- Utopian Human Continent (Uttarakuru)
UPDATE public.game_rebirth_realms SET image_url = 'Realm_10.jpg' WHERE id IN (20);
-- Non-buddhist paths (Tirthikas)
UPDATE public.game_rebirth_realms SET image_url = 'Realm_11.jpg' WHERE id IN (22, 23);
-- Bardo Transition
UPDATE public.game_rebirth_realms SET image_url = 'Realm_08.jpg' WHERE id IN (24);
-- Tantra Ngondro
UPDATE public.game_rebirth_realms SET image_url = 'Realm_13.jpg' WHERE id IN (25, 33);
-- Chakravartin King
UPDATE public.game_rebirth_realms SET image_url = 'Realm_14.jpg' WHERE id IN (26);
-- Deva Kings (Four Directions)
UPDATE public.game_rebirth_realms SET image_url = 'Realm_15.jpg' WHERE id IN (27, 28, 29);
-- Tushita Heaven (Maitreya)
UPDATE public.game_rebirth_realms SET image_url = 'Realm_18.jpg' WHERE id IN (30);
-- Higher Desire Heavens
UPDATE public.game_rebirth_realms SET image_url = 'Realm_09.jpg' WHERE id IN (31, 32);
-- Wrathful Protectors (Mahakala)
UPDATE public.game_rebirth_realms SET image_url = 'Realm_16.jpg' WHERE id IN (34);
-- Form & Formless Heavens
UPDATE public.game_rebirth_realms SET image_url = 'Realm_17.jpg' WHERE id IN (35, 36, 37);

-- Buddhist Paths (Realms 38 to 100)
-- 38-50: Sravaka/Arhat stages (Realm_07 - Monks walking)
UPDATE public.game_rebirth_realms SET image_url = 'Realm_07.jpg' WHERE id >= 38 AND id <= 50;
-- 51-68: Bodhisattva bhumis (Realm_11 - Sukhavati golden pure land)
UPDATE public.game_rebirth_realms SET image_url = 'Realm_11.jpg' WHERE id >= 51 AND id <= 68;
-- 69-80: Higher Tantras (Realm_12 - Vajrasattva white peak)
UPDATE public.game_rebirth_realms SET image_url = 'Realm_12.jpg' WHERE id >= 69 AND id <= 80;
-- 81-100: Anuyoga/Atiyoga (Realm_20 - Primordial samantabhadra gold)
UPDATE public.game_rebirth_realms SET image_url = 'Realm_20.jpg' WHERE id >= 81 AND id <= 100;

-- Ultimate Pure Lands & Buddha Realms (Realms 101 to 108)
UPDATE public.game_rebirth_realms SET image_url = 'Realm_11.jpg' WHERE id = 101; -- Sukhavati Pure Land
UPDATE public.game_rebirth_realms SET image_url = 'Realm_13.jpg' WHERE id = 102; -- Medicine Buddha Lapis Palace
UPDATE public.game_rebirth_realms SET image_url = 'Realm_14.jpg' WHERE id = 103; -- Guru Rinpoche Copper Mountain
UPDATE public.game_rebirth_realms SET image_url = 'Realm_15.jpg' WHERE id = 104; -- Green Tara Forest
UPDATE public.game_rebirth_realms SET image_url = 'Realm_18.jpg' WHERE id = 105; -- Maitreya Tushita
UPDATE public.game_rebirth_realms SET image_url = 'Realm_16.jpg' WHERE id = 106; -- Vajra protective wrathful
UPDATE public.game_rebirth_realms SET image_url = 'Realm_17.jpg' WHERE id = 107; -- Wisdom void mandala
UPDATE public.game_rebirth_realms SET image_url = 'Realm_20.jpg' WHERE id = 108; -- Primordial Dharmakaya
