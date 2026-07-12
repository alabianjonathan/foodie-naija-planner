REVOKE EXECUTE ON FUNCTION public.admin_seed_restaurants(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_seed_restaurants(jsonb) TO sandbox_exec;