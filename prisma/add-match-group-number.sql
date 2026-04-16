DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Match' AND column_name = 'groupNumber'
  ) THEN
    ALTER TABLE "Match" ADD COLUMN "groupNumber" INTEGER;
  END IF;
END $$;
