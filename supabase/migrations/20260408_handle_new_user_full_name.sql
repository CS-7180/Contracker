-- Update handle_new_user trigger to also capture full_name from user metadata.
-- Previously the trigger only inserted id, email, and role into profiles.
-- Now it reads full_name from raw_user_meta_data so the profiles row is complete
-- when created via the admin API signup route (app/api/auth/signup/route.ts).

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    CASE
      WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN 'admin'
      ELSE 'member'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
