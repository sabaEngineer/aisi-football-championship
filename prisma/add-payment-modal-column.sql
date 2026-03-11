-- Add paymentModalShownAt column to TeamMember (nullable, safe for existing rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'TeamMember' AND column_name = 'paymentModalShownAt'
  ) THEN
    ALTER TABLE "TeamMember" ADD COLUMN "paymentModalShownAt" TIMESTAMP(3);
  END IF;
END $$;
