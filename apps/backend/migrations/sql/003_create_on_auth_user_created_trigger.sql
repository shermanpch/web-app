-- Trigger to automatically create a user quota upon new user signup
-- Run this AFTER creating the user_quotas table and the handle_new_user function
-- Drop the trigger first if it already exists to ensure idempotency
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger that executes the handle_new_user function
-- AFTER a new row (user) is inserted into the auth.users table.
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user ();