-- Automatically grant admin access to any user provisioned in Supabase Authentication.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_app_meta_data ->> 'role', 'admin')
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      role = 'admin';
  return new;
end;
$$;

-- Any authenticated user provisioned in Supabase Auth is authorized for the workspace.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select auth.uid() is not null;
$$;

-- Backfill existing auth users so they have an admin profile immediately.
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  'admin'
from auth.users u
on conflict (id) do update
set role = 'admin';
