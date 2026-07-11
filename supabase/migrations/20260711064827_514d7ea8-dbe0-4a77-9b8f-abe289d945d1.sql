INSERT INTO public.dept_credentials(slug,password) VALUES
('delegate_affairs','2222'),('marketing','1111'),('hr','0000'),('academics','3333'),('corporate_affairs','4444')
ON CONFLICT (slug) DO UPDATE SET password=EXCLUDED.password;