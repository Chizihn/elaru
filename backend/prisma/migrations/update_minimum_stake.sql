-- Update minimum stake from 5 AVAX to 0.5 AVAX
-- This allows more developers to participate in the marketplace

UPDATE "Agent" 
SET "minimumStake" = '500000000000000000'  -- 0.5 AVAX in wei
WHERE "minimumStake" = '5000000000000000000'; -- 5 AVAX in wei

-- Optional: Update any existing agents who might have exactly 5 AVAX staked
-- to ensure they remain active with the new minimum
UPDATE "Agent" 
SET "active" = true
WHERE "stakedAmount" >= '500000000000000000' -- Has at least 0.5 AVAX
  AND "active" = false;