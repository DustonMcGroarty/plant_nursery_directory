-- Enables Postgres Row Level Security on every table, with no policies
-- attached. This app never queries through Supabase's auto-generated
-- PostgREST API (no @supabase/supabase-js, no anon/service_role key used
-- anywhere in the codebase) — it only ever connects via Prisma using
-- DATABASE_URL/DIRECT_URL, authenticated as the table owner, which bypasses
-- RLS entirely regardless of this setting. So this has zero effect on the
-- app itself; it only closes the public REST API that Supabase exposes for
-- every table by default, which Supabase's own Security Advisor flags as
-- "publicly accessible" until RLS is turned on. With RLS enabled and no
-- policies, that API denies all access — exactly what we want, since
-- nothing is supposed to use it.
ALTER TABLE "Nursery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NurseryPhoto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NurserySpecialty" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Specialty" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClaimRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
