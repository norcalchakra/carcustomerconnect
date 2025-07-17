# Supabase Database Setup Instructions

Since the Supabase JavaScript client doesn't allow executing arbitrary SQL statements for security reasons, you'll need to set up the database tables using the Supabase SQL Editor in the dashboard.

## Option 1: Using the Supabase Dashboard (Recommended)

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Select your project
3. Navigate to the SQL Editor (left sidebar)
4. Create a new query
5. Copy and paste the entire contents of the `supabase_setup.sql` file
6. Click "Run" to execute the SQL

## Option 2: Using the Supabase Management API (Advanced)

If you prefer a programmatic approach, you can use the Supabase Management API with your service role key:

```javascript
// Note: This requires a service role key which has higher privileges
// Be careful not to expose this key in client-side code
const serviceRoleKey = 'your-service-role-key'; // Get this from Supabase dashboard

const response = await fetch(`${supabaseUrl}/rest/v1/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${serviceRoleKey}`,
    'apikey': serviceRoleKey
  },
  body: JSON.stringify({
    query: sqlContent // Your SQL statements
  })
});

const result = await response.json();
```

## Troubleshooting

If you encounter errors during setup:

1. Check that your Supabase project exists and is accessible
2. Verify that you have the correct permissions
3. Try executing the SQL statements one by one to identify any specific issues
4. Check for any existing tables that might conflict with the setup

## After Setup

Once the database is set up successfully:

1. Restart your application
2. The 404 errors should be resolved
3. You should be able to see the sample vehicles and events in your application
