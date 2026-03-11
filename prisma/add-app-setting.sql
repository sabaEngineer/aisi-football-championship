-- Add AppSetting table for charity_collected_amount
CREATE TABLE IF NOT EXISTS "AppSetting" (
  "id" SERIAL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" TEXT NOT NULL
);
