CREATE TABLE public.dept_credentials (
  slug text PRIMARY KEY,
  password text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.dept_credentials TO service_role;
ALTER TABLE public.dept_credentials ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER touch_dept_credentials BEFORE UPDATE ON public.dept_credentials
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();