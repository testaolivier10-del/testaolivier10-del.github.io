/* Teacher scoring of free responses, the AI first pass (docs/teacher-classes.md, stream C).

   The teacher scores a student's sent answer against the rubric in the browser and saves it with
   teach_frq_score (SQL); this route only suggests a first pass, which the teacher can change point by point
   before saving. Nothing here is saved and nothing reaches the student until the teacher saves.

   Gated exactly like the student grader (docs/frq-grader.md): FRQ_GRADER "on" (or "owner" for the owner's
   own account), and only with a model that passed the launch rule in that file's Results table
   (CLASS_FRQ_PASSED_MODELS). Claude only: the Workers AI backup was never put through the eval, so it does
   not score anyone's work for a teacher. A teacher has CLASS_FRQ_DAILY first passes a day (the same
   frq_grade_daily counter as students, under the teacher's own account). */
import { sb } from './store.js';
import { isOwnerEmail } from './umami.js';
import {
  graderMode, claudeModel, gradeWithClaude, loadQuestion, cleanAnswers, cacheKey, cacheGet, cachePut, giveBack, countGrade,
  validQuestionId, FRQ_COURSES, GRADER_VERSION,
} from './frq-grade.js';
import { clsUuid, clsBody, clsUser, clsOwnClass } from './class-common.js';

/* Models whose full eval pass met the launch rule (docs/frq-grader.md, "Results"). Add one only with its row. */
export const CLASS_FRQ_PASSED_MODELS = ['claude-haiku-5-5'];
export const CLASS_FRQ_DAILY = 60;

export function classFrqAiOpen(env, isOwner) {
  const mode = graderMode(env);
  if (mode === 'off' || (mode === 'owner' && !isOwner)) return { ok: false, why: 'off' };
  if (!CLASS_FRQ_PASSED_MODELS.includes(claudeModel(env))) return { ok: false, why: 'model' };
  if (!env.ANTHROPIC_API_KEY) return { ok: false, why: 'key' };
  return { ok: true };
}

/* POST /class/frq/ai { class, assignment, student } -> { parts: [{ label, points: [{ earned, quote, reason }] }], summary } */
export async function classFrqAi(request, env, { fetcher } = {}) {
  if (graderMode(env) === 'off') return { status: 404, body: { error: 'The AI first pass is not turned on. Score it with the rubric.' } };
  const user = await clsUser(env, request);
  if (!user) return { status: 401, body: { error: 'Sign in again.' } };
  const open = classFrqAiOpen(env, await isOwnerEmail(user.email));
  if (!open.ok) return { status: 404, body: { error: 'The AI first pass is not turned on. Score it with the rubric.' } };
  const p = await clsBody(request);
  if (!p || !clsUuid(p.assignment) || !clsUuid(p.student)) return { status: 400, body: { error: 'Invalid request' } };
  const cls = await clsOwnClass(env, user.id, p.class);
  if (!cls) return { status: 404, body: { error: 'Class not found.' } };
  if (!FRQ_COURSES.includes(cls.course)) return { status: 404, body: { error: 'The AI first pass is not available for this course yet.' } };
  const ar = await sb(env, `class_assignments?select=id,kind,spec&id=eq.${p.assignment}&class_id=eq.${cls.id}&limit=1`);
  const a = ar.ok ? (await ar.json())[0] : null;
  const id = a && a.spec && a.spec.frq;
  if (!a || a.kind !== 'frq' || !validQuestionId(id)) return { status: 404, body: { error: 'Assignment not found.' } };
  const wr = await sb(env, `class_frq_work?select=answers&assignment_id=eq.${a.id}&student_id=eq.${p.student}&limit=1`);
  const work = wr.ok ? (await wr.json())[0] : null;
  if (!work) return { status: 404, body: { error: 'This student has not sent an answer yet.' } };

  const f = await loadQuestion(env, cls.course, id);
  if (!f) return { status: 404, body: { error: 'That question could not be loaded.' } };
  const answers = cleanAnswers(f, work.answers);
  if (!answers) return { status: 400, body: { error: 'The answer is empty or too long for the AI first pass.' } };

  const key = await cacheKey(env, cls.course, f, answers);
  const cached = await cacheGet(env, key);
  if (cached && cached.parts && cached.grader === 'claude') {
    await countGrade(env, cls.course, 'cached', null);
    return { status: 200, body: { parts: cached.parts, summary: cached.summary || '', model: cached.model, cached: true } };
  }
  let left;
  try {
    const res = await sb(env, 'rpc/frq_grade_take', { method: 'POST', body: JSON.stringify({ p_user: user.id, p_limit: CLASS_FRQ_DAILY }) });
    left = res.ok ? Number(await res.json()) : null;
  } catch { left = null; }
  if (left === null || !Number.isInteger(left)) return { status: 503, body: { error: 'Could not check today’s first passes. Try again.' } };
  if (left < 0) return { status: 429, body: { error: `You have used today’s ${CLASS_FRQ_DAILY} AI first passes. Score the rest with the rubric.` } };

  const claude = await gradeWithClaude(env, f, answers, cls.course, fetcher);
  await countGrade(env, cls.course, claude.ok ? 'claude' : 'none', claude.usage);
  if (!claude.ok) {
    await giveBack(env, user.id);
    return { status: 503, body: { error: 'The AI first pass is busy. Score it with the rubric; today’s count was not used.' } };
  }
  const parts = claude.grade.parts.map((x) => ({ label: x.label, points: x.points.map(({ earned, quote, reason }) => ({ earned, quote, reason })) }));
  const body = { version: GRADER_VERSION, course: cls.course, id, grader: 'claude', model: claude.model, parts, summary: claude.grade.summary || '' };
  await cachePut(env, key, body, 30 * 86400);
  return { status: 200, body: { parts, summary: body.summary, model: claude.model, left, cached: false } };
}
