-- Fix admin access for me@leonid.one

-- Create user if doesn't exist, update if exists
INSERT INTO users (email, name, is_admin)
VALUES ('me@leonid.one', 'Leonid', true)
ON CONFLICT (email)
DO UPDATE SET is_admin = true;

-- Verify
SELECT email, is_admin FROM users WHERE email = 'me@leonid.one';
