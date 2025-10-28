-- Clear cache entries that might have fallback data
-- Run this if you need to regenerate options after fixing the JSON parsing

DELETE FROM options_cache 
WHERE cache_key LIKE 'tasks-%' 
  AND (options @> '["Product development"]' OR options @> '["Team collaboration"]');

-- Or to clear all task cache entries:
-- DELETE FROM options_cache WHERE cache_key LIKE 'tasks-%';

-- To see what's currently cached:
-- SELECT cache_key, options FROM options_cache WHERE cache_key LIKE 'tasks-%';
