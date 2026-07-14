ALTER TABLE public.grades
  ALTER COLUMN dept_task_grade TYPE integer USING round(dept_task_grade)::integer,
  ALTER COLUMN da_task_grade TYPE integer USING round(da_task_grade)::integer,
  ALTER COLUMN mkt_task_grade TYPE integer USING round(mkt_task_grade)::integer,
  ALTER COLUMN hr_task_grade TYPE integer USING round(hr_task_grade)::integer,
  ALTER COLUMN ethics_grade TYPE integer USING round(ethics_grade)::integer,
  ALTER COLUMN other_grade TYPE integer USING round(other_grade)::integer,
  ALTER COLUMN hod_grade TYPE integer USING round(hod_grade)::integer;

NOTIFY pgrst, 'reload schema';