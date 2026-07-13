
CREATE TABLE public.dept_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_slug TEXT NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  update_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.dept_updates TO service_role;

ALTER TABLE public.dept_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no direct access" ON public.dept_updates FOR ALL USING (false) WITH CHECK (false);

CREATE INDEX idx_dept_updates_dept_date ON public.dept_updates(department_slug, update_date DESC, created_at DESC);

CREATE TRIGGER trg_dept_updates_touch
BEFORE UPDATE ON public.dept_updates
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
