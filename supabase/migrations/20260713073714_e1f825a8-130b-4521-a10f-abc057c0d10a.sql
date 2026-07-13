
CREATE POLICY "no direct access" ON public.departments FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "no direct access" ON public.dept_credentials FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "no direct access" ON public.grades FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "no direct access" ON public.people FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "no direct access" ON public.status_history FOR ALL USING (false) WITH CHECK (false);
