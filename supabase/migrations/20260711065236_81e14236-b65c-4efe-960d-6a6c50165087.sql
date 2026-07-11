GRANT ALL ON public.dept_credentials TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;
NOTIFY pgrst, 'reload schema';