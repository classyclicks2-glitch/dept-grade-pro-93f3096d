
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

CREATE TABLE public.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  date date NOT NULL,
  dept_task_detail text,
  dept_task_grade numeric,
  da_task_detail text,
  da_task_grade numeric,
  mkt_task_detail text,
  mkt_task_grade numeric,
  hr_task_detail text,
  hr_task_grade numeric,
  ethics public.ethics_rating,
  ethics_grade numeric,
  ethics_comment text,
  other_remarks text,
  other_grade numeric,
  hod_remarks text,
  hod_grade numeric,
  is_auto_na boolean NOT NULL DEFAULT false,
  created_by_dept text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (person_id, date)
);
CREATE INDEX grades_person_date_idx ON public.grades(person_id, date);
GRANT ALL ON public.grades TO service_role;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

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
