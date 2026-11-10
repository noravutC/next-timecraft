-- Load-test data for a THROWAWAY database: 39 extra boards, ~98,000 tasks,
-- ~196,000 comments, all in the guest workspace. Never run it against a
-- database you care about; see scripts/perf/README.md.
--
--   psql "$PERF_DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/perf/seed.sql
--
-- Needs the guest account and one board (sign in once with "Continue as
-- guest" and create a board).
select id as guest from users where provider = 'guest' limit 1 \gset
select p.id as board, p.organization_id as org
  from projects p where p.owner_id = :'guest' order by p.created_at limit 1 \gset

begin;

-- 20 teammates
insert into users (full_name, email, provider, provider_id)
select 'Teammate ' || i, 'mate' || i || '@example.test', 'google', 'seed-' || i
from generate_series(1, 20) i;
insert into memberships (user_id, organization_id, role)
select id, :'org', 'member' from users where provider_id like 'seed-%';

-- 39 more boards, 5 columns each
insert into projects (organization_id, name, owner_id)
select :'org', 'Seed board ' || i, :'guest' from generate_series(1, 39) i;
insert into columns (project_id, name, order_fraction)
select p.id, c.name, c.f from projects p,
  (values ('Backlog','a0'),('To Do','a1'),('In Progress','a2'),('Review','a3'),('Done','a4')) c(name, f)
where p.name like 'Seed board %';
insert into project_members (project_id, user_id, role)
select p.id, :'guest', 'owner' from projects p where p.name like 'Seed board %';
insert into project_members (project_id, user_id, role)
select p.id, u.id, 'editor' from projects p, users u where u.provider_id like 'seed-%';

-- tasks: 4,000 per column on the first board (the worst case a board page
-- has to handle), 400 per column on the others
create temp table words (w text, n int);
insert into words select w, row_number() over () from unnest(array[
  'login','checkout','invoice','dashboard','migration','deploy','refactor','homepage','search','onboarding',
  'payment','profile','settings','notification','calendar','export','import','report','mobile','api',
  'cache','index','webhook','billing','avatar','upload','comment','filter','sorting','pagination',
  'timeout','crash','latency','design','copy','banner','footer','navbar','modal','tooltip']) w;

insert into tasks (column_id, title, description, priority, due_date, tags, order_fraction, archived, estimated_hours, comment_count)
select c.id,
  initcap(w1.w) || ' ' || w2.w || ' ' || w3.w || ' #' || g,
  'Investigate the ' || w2.w || ' flow and fix the ' || w3.w || ' issue reported by the ' || w1.w || ' team. Steps, expected result and notes follow.',
  (array['low','medium','high'])[1 + g % 3]::task_priority,
  case when g % 3 = 0 then null else now() + ((g % 120) - 60) * interval '1 day' end,
  case g % 5 when 0 then array['bug'] when 1 then array['feature','frontend']
    when 2 then array['backend'] when 3 then array[]::text[] else array['design','urgent'] end,
  'a' || lpad(to_hex(g), 5, '0'),
  g % 25 = 0,
  g % 9,
  2
from columns c
join projects p on p.id = c.project_id
cross join lateral generate_series(1, case when p.id = :'board' then 4000 else 400 end) g
join words w1 on w1.n = 1 + (g * 7 + ascii(c.name)) % 40
join words w2 on w2.n = 1 + (g * 13) % 40
join words w3 on w3.n = 1 + (g * 29 + 5) % 40
where p.id = :'board' or p.name like 'Seed board %';

-- one assignee per task; the guest gets every 200th (about 490)
insert into task_assignees (task_id, user_id)
select t.id, case when t.rn % 200 = 0 then :'guest'::uuid else u.id end
from (select id, row_number() over () rn from tasks) t
join (select id, row_number() over () rn from users where provider_id like 'seed-%') u
  on u.rn = 1 + t.rn % 20;

-- two comments, two subtasks, two activity rows per task
insert into task_comments (task_id, user_id, body)
select t.id, :'guest', 'Looked into the ' || w.w || ' part, still seeing the problem on staging. Comment ' || k
from tasks t cross join generate_series(1, 2) k
join words w on w.n = 1 + (ascii(substr(t.id::text, k, 1)) % 40);
insert into subtasks (task_id, title, completed, order_fraction)
select t.id, 'Step ' || k, k = 1, 'a' || k from tasks t cross join generate_series(1, 2) k;
insert into task_activities (task_id, actor_id, type)
select t.id, :'guest', case k when 1 then 'created' else 'moved' end
from tasks t cross join generate_series(1, 2) k;

commit;
analyze;

select (select count(*) from tasks) as tasks,
       (select count(*) from task_comments) as comments,
       (select count(*) from projects) as boards;
