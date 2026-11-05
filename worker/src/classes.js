/* The teacher-class integration routes in one table (docs/teacher-classes.md, stream C), wired in index.js.

   classPublicRoute: called before the Origin check, for what an LMS, Google or a mail client calls (each
   checks its own signature or state). classApiRoute: called after the Origin check and the per-IP throttle,
   for what the site calls with a session. Both return null for a path that is not theirs. */
import { classRemind, classEmailStop, classReportLink, classReportRevoke, classReportGet, classQuote } from './class-mail.js';
import { classFrqAi, classFrqAiOpen } from './class-frq.js';
import { clsUser, clsReady, clsMailReady } from './class-common.js';
import { isOwnerEmail } from './umami.js';
import { sb } from './store.js';
import { gcAllowed, gcStart, gcCallback, gcFinish, gcStatus, gcDisconnect, gcCourses, gcLink, gcRoster, gcInvite, gcPost, gcGrades } from './class-google.js';
import { ltiActivate, ltiAllowed, ltiLogin, ltiLaunch, ltiReturn, ltiRegister, ltiMine, ltiDeepLink, ltiBind, ltiGrades, ltiPublicJwk, ltiCanvasConfig } from './class-lti.js';

/* The hourly housekeeping (index.js cron): the 30-day mail log, expired report links, used launch nonces. */
export async function classPurge(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return { skipped: true };
  const res = await sb(env, 'rpc/class_purge', { method: 'POST', body: '{}' });
  return { ok: res.ok };
}

/* POST /class/features -> what this teacher's page may offer, so it shows only buttons that work. */
export async function classFeatures(request, env) {
  const user = await clsUser(env, request);
  if (!user) return { status: 401, body: { error: 'Sign in again.' } };
  const ready = clsReady(env);
  return {
    status: 200,
    body: {
      reminders: ready && clsMailReady(env),
      reports: ready,
      quote: clsMailReady(env),
      google: await gcAllowed(env, user),
      lti: await ltiAllowed(env, user),
      frqAi: classFrqAiOpen(env, await isOwnerEmail(user.email)).ok,
    },
  };
}

const CLASS_API = {
  '/class/features': classFeatures,
  '/class/remind': classRemind,
  '/class/report-link': classReportLink,
  '/class/report-link/revoke': classReportRevoke,
  '/class/report': classReportGet,
  '/class/quote': classQuote,
  '/class/frq/ai': classFrqAi,
  '/class/google/start': gcStart,
  '/class/google/finish': gcFinish,
  '/class/google/status': gcStatus,
  '/class/google/disconnect': gcDisconnect,
  '/class/google/courses': gcCourses,
  '/class/google/link': gcLink,
  '/class/google/roster': gcRoster,
  '/class/google/invite': gcInvite,
  '/class/google/post': gcPost,
  '/class/google/grades': gcGrades,
  '/lti/platforms': ltiRegister,
  '/lti/platforms/mine': ltiMine,
  '/lti/deeplink': ltiDeepLink,
  '/lti/bind': ltiBind,
  '/lti/grades': ltiGrades,
};

export const CLASS_PUBLIC_PATHS = ['/class/email/stop', '/class/google/callback', '/lti/activate', '/lti/login', '/lti/launch', '/lti/return', '/lti/jwks', '/lti/config.json'];

/* -> { status, body } | null */
export async function classApiRoute(request, env, path) {
  const fn = Object.prototype.hasOwnProperty.call(CLASS_API, path) ? CLASS_API[path] : null;
  if (!fn) return null;
  try {
    return await fn(request, env);
  } catch (e) {
    console.log('class route failed', path, String(e).slice(0, 200));
    return { status: 503, body: { error: 'Something went wrong. Try again in a minute.' } };
  }
}

const clsJsonPublic = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' },
});

/* -> Response | null */
export async function classPublicRoute(request, env, path) {
  if (!CLASS_PUBLIC_PATHS.includes(path)) return null;
  const m = request.method;
  try {
    if (path === '/class/email/stop' && (m === 'GET' || m === 'POST')) return await classEmailStop(request, env);
    if (path === '/class/google/callback' && m === 'GET') return await gcCallback(request, env);
    if (path === '/lti/activate' && (m === 'GET' || m === 'POST')) return await ltiActivate(request, env);
    if (path === '/lti/login' && (m === 'GET' || m === 'POST')) return await ltiLogin(request, env);
    if (path === '/lti/launch' && m === 'POST') return await ltiLaunch(request, env);
    if (path === '/lti/return' && m === 'GET') return await ltiReturn(request, env);
    if (path === '/lti/jwks' && m === 'GET') {
      const k = ltiPublicJwk(env);
      return clsJsonPublic({ keys: k ? [k] : [] });
    }
    if (path === '/lti/config.json' && m === 'GET') return clsJsonPublic(ltiCanvasConfig(env));
  } catch (e) {
    console.log('class public route failed', path, String(e).slice(0, 200));
    return new Response('Something went wrong. Try again in a minute.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  return new Response('Method not allowed', { status: 405, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
