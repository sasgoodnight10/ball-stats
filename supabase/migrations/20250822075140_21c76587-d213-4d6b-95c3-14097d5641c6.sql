-- Check current enum values and add 'free-training' if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'free-training' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'game_type')
    ) THEN
        ALTER TYPE game_type ADD VALUE 'free-training';
    END IF;
END $$;