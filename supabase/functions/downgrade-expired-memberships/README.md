# Downgrade Expired Memberships Function

This Edge Function automatically downgrades users from premium to free tier when their premium membership expires.

## Deployment

This function is deployed manually through the Supabase Dashboard:

1. Go to Edge Functions in the Supabase Dashboard
2. Create a new function named "downgrade-expired-memberships"
3. Copy the code from `index.ts` into the editor
4. Deploy the function

## Cron Job Setup

The function is scheduled to run via a cron job in the Supabase Dashboard:

1. Enable the pg_net extension (if not already enabled):
   ```sql
   create extension if not exists pg_net with schema extensions;
   ```

2. Create the cron job:
   - Go to Database → Jobs in the Dashboard
   - Create a new job
   - Name: "downgrade-expired-memberships"
   - Schedule: "*/10 * * * * *" (every 10 seconds for testing)
   - Type: Edge Function
   - Select: "downgrade-expired-memberships"
   - Headers:
     - Authorization: Bearer [your-service-role-key]
     - Content-Type: application/json
   - Body: Leave empty (the function doesn't require any input)

## Function Logic

The function:
1. Finds all premium users whose `premium_expires_at` is in the past
2. Downgrades them to free tier
3. Resets their query quota to 10 (free tier default)
4. Clears their premium expiration date

## Environment Variables

The function requires these environment variables (automatically set by Supabase):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Monitoring

Monitor the function's execution in the Supabase Dashboard:
- Edge Functions → Logs: For function execution logs
- Database → Jobs: For cron job execution status 