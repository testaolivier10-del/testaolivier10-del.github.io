# Invite friends (2026-10-29)

Status file for the invite program. Read this, not the chat history.

## Owner decisions (2026-10-29)

- Goal: turn existing students into a channel. Most study signed out (21 accounts on 2026-10-29), so **anyone can
  share**; signing in is only needed to collect.
- **Friend:** 3 days of Premium in the course of the link, when a **new** account (made within 3 days) claims it.
  A homepage link has no course; the gift then lands on the course of the friend's first answer.
- **Sharer:** 7 days of Premium in that course once the friend has **answered 20 questions**. At most **8 rewards
  in any 365 days**. Earned while signed out, it is paid when the sharer signs in on the browser that shared.
- One claim per person: per account and per normalized email (case, +tags, Gmail dots). A code never pays its owner.

## How it works

| Piece | File |
|---|---|
| Tables `referral_codes`, `referral_claims`; RPCs `referral_register`, `_my_code`, `_adopt`, `_claim`, `_note_answer`, `_summary`; internal `_welcome`, `_reward`, `_email_key` | `scripts/sql/migrations/2026-10m-referrals.sql` (same in `schema.sql` section 8) |
| Code made on first share (8 chars + a secret kept in `levlprep_invite_mine_v1`); **every** shared link carries `r=<code>` next to `ref=share` | `assets/share.js` (`myInvite`, `shareUrl(url, base, code)`) |
| `?r=` read on landing, kept 30 days in `levlprep_invited_v1`, first link wins; claim/adopt run on sign-in only when there is work | `assets/account.js` (`takeInvite`, `inviteWork`) |
| Claim, answer counting, card after a good session, landing offer, account panel | `assets/invite.js` (lazy: `LevlLazy('invite')`) |
| Each answer counted while `levlprep_invite_counting_v1` is set | `assets/premium.js` `noteAnswer` |
| Pass labels "Invite reward", "Welcome gift from a friend" | `assets/account-page.js` |
| No "a pass you bought ends" email for invite passes (`GIFT_PASSES`) | `worker/src/premium.js` |

Rewards go through `premium_add_pass` with `order_id` `refw:<claim>` / `refr:<claim>` (paid once) and
`funded_by = 'referral'`, so they stack after any pass like the others. No refunds (no amount).

Anti-abuse: secret needed to bind a code (a friend who saw the link cannot take it); account age 3 days for
claims; email-key uniqueness survives account deletion (`friend_id` set null); answers closer than 2 seconds
are not counted; 3,000 new codes a day max; 8 rewards a year per sharer. Known gap: one person with two email
addresses can refer themselves once per address (bounded by the yearly cap).

**When the card shows:** only where the save-your-progress prompt and the one-time "how did you hear" question
stay quiet (`promptToSave`), after an exam at 70%+ (5+ questions), a set of 8+ or a level-up. Once per 4 days;
after 3 "Not now"s, quiet 30 days. Never mid-question; withdraws by itself after 15 s.

## Reading the numbers

```sql
select count(*) claims, count(welcome_at) gifts, count(qualified_at) studying,
       count(rewarded_at) rewarded, count(*) filter (where capped) capped from referral_claims;
select count(*) codes, count(user_id) bound from referral_codes;
```

Umami events: `invite-card`, `invite-card-dismissed`, `invite-share` (from, method), `invite-open`,
`invite-landing` (signup/later), `invite-claim` (status), `invite-qualified`. Shared visits also count under
`ref=share` in `ref_events` as before.

## Status

- 2026-10-29: built on branch `claude/invite-friends`. SQL behaviour checked against a real Postgres (PGlite):
  register, wrong-secret adopt refused, claim + 3-day gift, second claim and Gmail alias refused, old account
  refused, 20 answers qualify, reward paid on adopt, fast answers ignored, bad course cleared, 8-a-year cap.
- 2026-10-29: migration applied to the live database (grants checked: only register is open to signed-out visitors; the reward helpers are callable by no one but the database itself).

## Not done / later

- Leaderboard of top inviters (owner: later).
- A teacher version (one link for a whole class) would need a different cap.
