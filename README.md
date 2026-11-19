# KODNOD Admin — Multi-Company Editorial Console

A clean, white-themed multi-company admin panel built with Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth/Postgres/Storage, and Tiptap.

## Setup Steps

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env.local` and fill in your Supabase project credentials:
```bash
cp .env.example .env.local
```
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Run the Supabase SQL schema & seed data
Open your Supabase project's **SQL Editor** and run `supabase/schema.sql`.
This creates:
- `profiles`, `companies`, and `articles` tables
- Row Level Security policies restricting read/write access to `admin` users
- The `article-images` Storage bucket and admin upload policies
- 7 seeded portfolio companies and sample articles

### 4. Create an admin user
1. In **Supabase Dashboard → Authentication → Users**, create a user with email and password.
2. Promote that user to `admin` in the SQL Editor:
   ```sql
   update public.profiles
   set role = 'admin'
   where email = 'your-admin@company.com';
   ```

### 5. Run the development server
```bash
npm run dev
```
Visit `http://localhost:3000/login` and sign in with your admin account.
