-- Add saves column to MatchPlayerStat (goalkeeper saves)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'MatchPlayerStat' AND column_name = 'saves'
  ) THEN
    ALTER TABLE "MatchPlayerStat" ADD COLUMN "saves" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;
