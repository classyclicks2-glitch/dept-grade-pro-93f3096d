-- Run this entire file in your Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → paste → Run)

CREATE TYPE public.person_status AS ENUM ('active','on_leave','inactive','terminated','resigned');
CREATE TYPE public.ethics_rating AS ENUM ('good','bad','na');

CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no direct access" ON public.departments FOR ALL USING (false) WITH CHECK (false);

CREATE TABLE public.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,
  instagram text,
  email text,
  phone text,
  department_slug text NOT NULL REFERENCES public.departments(slug) ON UPDATE CASCADE,
  status public.person_status NOT NULL DEFAULT 'active',
  status_reason text,
  leave_start date,
  leave_end date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX people_dept_idx ON public.people(department_slug);
CREATE INDEX people_status_idx ON public.people(status);
GRANT ALL ON public.people TO service_role;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no direct access" ON public.people FOR ALL USING (false) WITH CHECK (false);

CREATE TABLE public.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  date date NOT NULL,
  dept_task_detail text,
  dept_task_grade integer,
  da_task_detail text,
  da_task_grade integer,
  mkt_task_detail text,
  mkt_task_grade integer,
  hr_task_detail text,
  hr_task_grade integer,
  ethics public.ethics_rating,
  ethics_grade integer,
  ethics_comment text,
  other_remarks text,
  other_grade integer,
  hod_remarks text,
  hod_grade integer,
  is_auto_na boolean NOT NULL DEFAULT false,
  created_by_dept text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (person_id, date)
);
CREATE INDEX grades_person_date_idx ON public.grades(person_id, date);
GRANT ALL ON public.grades TO service_role;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no direct access" ON public.grades FOR ALL USING (false) WITH CHECK (false);

CREATE TABLE public.status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  status public.person_status NOT NULL,
  reason text,
  leave_start date,
  leave_end date,
  changed_by_dept text,
  changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX status_history_person_idx ON public.status_history(person_id);
GRANT ALL ON public.status_history TO service_role;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no direct access" ON public.status_history FOR ALL USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER people_touch BEFORE UPDATE ON public.people
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER grades_touch BEFORE UPDATE ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.departments (slug, name) VALUES
  ('delegate_affairs','Delegate Affairs'),
  ('marketing','Marketing'),
  ('hr','HR'),
  ('academics','Academics'),
  ('corporate_affairs','Corporate Affairs');

CREATE TABLE public.dept_credentials (
  slug text PRIMARY KEY,
  password text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.dept_credentials TO service_role;
ALTER TABLE public.dept_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no direct access" ON public.dept_credentials FOR ALL USING (false) WITH CHECK (false);
CREATE TRIGGER touch_dept_credentials BEFORE UPDATE ON public.dept_credentials
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
INSERT INTO public.dept_credentials(slug,password) VALUES
  ('delegate_affairs','2222'),('marketing','1111'),('hr','0000'),
  ('academics','3333'),('corporate_affairs','4444');

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

GRANT USAGE ON SCHEMA public TO service_role;
NOTIFY pgrst, 'reload schema';
