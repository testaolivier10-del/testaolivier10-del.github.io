-- Teacher classes v2, stream B (docs/teacher-classes.md): classes for EMT (nremt),
-- organic chemistry (ochem) and anatomy and physiology (anp) as well as the ten
-- AP® courses. Named 2026-11e so it runs after 2026-11c-classes-v2.sql, whose
-- teach_save_question it redefines. Idempotent. schema.sql carries the same
-- definitions (scripts/test/sql-migration.test.mjs checks them word for word).
-- NOT APPLIED anywhere yet.
--
-- Run once, after 2026-11c-classes-v2.sql: Supabase dashboard -> SQL Editor ->
-- New query -> paste -> Run. Until it runs, making a class for one of the
-- three courses returns nothing and the teacher page says it did not save.
--
-- What it changes: the course check in teach_create_class and
-- teach_save_question now also accepts nremt, ochem and anp. Nothing else:
-- summaries are stored as before (the student's browser reads each course's
-- own progress into the same summary shape, assets/class/class-model.js).

create or replace function public.teach_create_class(p_course text, p_name text, p_unit_order jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.classes;
begin
  if auth.uid() is null then return null; end if;
  if not exists (select 1 from public.teacher_profiles where user_id = auth.uid()) then return null; end if;
  -- The ten AP® courses, EMT (nremt), organic chemistry (ochem) and A&P (anp).
  if p_course !~ '^(apbio|apchem|apphys|apcalc|apcalcbc|apstat|apenv|appsych|apprecalc|apmacro|nremt|ochem|anp)$' then return null; end if;
  if p_name is null or length(btrim(p_name)) < 1 or length(p_name) > 60 then return null; end if;
  if (select count(*) from public.classes where teacher_id = auth.uid() and not archived) >= 30 then return null; end if;
  insert into public.classes (teacher_id, course, name, code, unit_order)
  values (auth.uid(), p_course, btrim(p_name), public.class_new_code(),
          case when jsonb_typeof(p_unit_order) = 'array' then p_unit_order else '[]'::jsonb end)
  returning * into c;
  return jsonb_build_object('id', c.id, 'code', c.code);
end;
$$;

-- p_data: { course, topic, unit, q, options: [2..6 strings], correct, why }. Single choice only.
create or replace function public.teach_save_question(p_id uuid, p_data jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  n integer;
begin
  if auth.uid() is null then return null; end if;
  if not exists (select 1 from public.teacher_profiles where user_id = auth.uid()) then return null; end if;
  if coalesce(p_data->>'course', '') !~ '^(apbio|apchem|apphys|apcalc|apcalcbc|apstat|apenv|appsych|apprecalc|apmacro|nremt|ochem|anp)$' then return null; end if;
  if length(coalesce(p_data->>'q', '')) not between 1 and 2000 then return null; end if;
  if jsonb_typeof(p_data->'options') <> 'array' then return null; end if;
  n := jsonb_array_length(p_data->'options');
  if n not between 2 and 6 or octet_length((p_data->'options')::text) > 4000 then return null; end if;
  if exists (select 1 from jsonb_array_elements(p_data->'options') o where jsonb_typeof(o) <> 'string' or length(o #>> '{}') not between 1 and 500) then return null; end if;
  if jsonb_typeof(p_data->'correct') <> 'number' or (p_data->>'correct') !~ '^[0-5]$' or (p_data->>'correct')::integer >= n then return null; end if;
  if length(coalesce(p_data->>'why', '')) > 2000 then return null; end if;
  if coalesce(p_data->>'topic', '') <> '' and p_data->>'topic' !~ '^[a-z0-9][a-z0-9-]{0,79}$' then return null; end if;
  if coalesce(p_data->>'unit', '') <> '' and p_data->>'unit' !~ '^[a-z0-9][a-z0-9-]{0,79}$' then return null; end if;
  if p_id is null then
    if (select count(*) from public.class_questions where teacher_id = auth.uid()) >= 1000 then return null; end if;
    insert into public.class_questions (teacher_id, course, topic, unit, q, options, correct, why)
    values (auth.uid(), p_data->>'course', nullif(p_data->>'topic', ''), nullif(p_data->>'unit', ''), p_data->>'q',
            p_data->'options', (p_data->>'correct')::integer, nullif(p_data->>'why', ''))
    returning id into v_id;
  else
    update public.class_questions
       set course = p_data->>'course', topic = nullif(p_data->>'topic', ''), unit = nullif(p_data->>'unit', ''), q = p_data->>'q',
           options = p_data->'options', correct = (p_data->>'correct')::integer, why = nullif(p_data->>'why', ''), updated_at = now()
     where id = p_id and teacher_id = auth.uid()
    returning id into v_id;
  end if;
  return v_id;
end;
$$;

-- create or replace keeps the grants; restated so the file stands on its own.
revoke execute on function public.teach_create_class(text, text, jsonb) from public, anon;
revoke execute on function public.teach_save_question(uuid, jsonb) from public, anon;
grant execute on function public.teach_create_class(text, text, jsonb) to authenticated;
grant execute on function public.teach_save_question(uuid, jsonb) to authenticated;
