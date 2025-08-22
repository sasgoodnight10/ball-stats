-- Rename current_inning to current_rack in games table
ALTER TABLE public.games RENAME COLUMN current_inning TO current_rack;

-- Rename inning to rack in shots table  
ALTER TABLE public.shots RENAME COLUMN inning TO rack;