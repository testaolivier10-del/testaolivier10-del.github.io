#!/usr/bin/env node
/* AP® Psychology figures for author E (topics 3.7-3.9 and 4.1-4.3): standalone
   SVG diagrams written to psychology/figures/<id>.svg. Data figures are plot
   specs in the question files instead (drawn from their numbers at build time).
   Run: node scripts/appsych-figures/author-e.mjs
   Style (docs/appsych-briefs/content-common.md): white background, role="img"
   with <title> and <desc>, Arial/Helvetica, ink #1F2A28, cerulean #084F78 for
   emphasis, Okabe-Ito vermillion #D55E00 and green #009E73 as second colors. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'psychology', 'figures');
const INK = '#1F2A28', CER = '#084F78', VER = '#D55E00', GRN = '#009E73', GREY = '#5B6664';
const TINT = '#E3F0F8', VTINT = '#FBEADF', GTINT = '#E1F3EC', NTINT = '#F2F4F3';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function svg(id, w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="Arial, Helvetica, sans-serif">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
<defs>${[['ar', INK], ['arC', CER], ['arV', VER], ['arG', GRN]].map(([n, c]) => `<marker id="${id}-${n}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join('')}</defs>
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
`;
}
// Text lines centered at x, starting at y.
function lines(x, y, arr, { size = 15, weight = 'normal', fill = INK, gap = 1.3, anchor = 'middle' } = {}) {
  return arr.map((t, i) => `<text x="${x}" y="${y + i * size * gap}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(t)}</text>`).join('');
}
function box(x, y, w, h, { fill = NTINT, stroke = INK, sw = 2, rx = 8 } = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}
function arrow(id, x1, y1, x2, y2, { color = 'ar', stroke = INK, sw = 2.5, dash = '' } = {}) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''} marker-end="url(#${id}-${color})"/>`;
}

const figs = {};

/* 1. Classical conditioning: before, during and after. */
{
  const id = 'classical-conditioning-pairing', W = 820, H = 520;
  const rowY = [70, 230, 390], rowH = 110;
  const label = (y, a, b) => lines(20, y + 30, [a], { size: 16, weight: 'bold', anchor: 'start' }) + lines(20, y + 52, [b], { size: 13, fill: GREY, anchor: 'start' });
  let b = lines(W / 2, 34, ['Classical conditioning: a tone comes to trigger salivation'], { size: 19, weight: 'bold' });
  // Before
  b += label(rowY[0], 'Before', 'two separate links');
  b += box(170, rowY[0], 170, 46, { fill: NTINT }) + lines(255, rowY[0] + 29, ['Tone (NS)'], { size: 15, weight: 'bold' });
  b += arrow(id, 345, rowY[0] + 23, 455, rowY[0] + 23, { stroke: GREY, color: 'ar' }) + box(460, rowY[0], 300, 46, { fill: '#FFFFFF', stroke: GREY }) + lines(610, rowY[0] + 29, ['no salivation (perhaps a glance)'], { size: 14, fill: GREY });
  b += box(170, rowY[0] + 60, 170, 46, { fill: VTINT, stroke: VER }) + lines(255, rowY[0] + 89, ['Food (UCS)'], { size: 15, weight: 'bold', fill: VER });
  b += arrow(id, 345, rowY[0] + 83, 455, rowY[0] + 83, { stroke: VER, color: 'arV' }) + box(460, rowY[0] + 60, 300, 46, { fill: VTINT, stroke: VER }) + lines(610, rowY[0] + 89, ['salivation (UCR), unlearned'], { size: 14, weight: 'bold', fill: VER });
  // During
  b += label(rowY[1], 'During', 'acquisition: paired');
  b += box(170, rowY[1] + 20, 260, 70, { fill: TINT, stroke: CER }) + lines(300, rowY[1] + 50, ['Tone (NS) + Food (UCS)'], { size: 15, weight: 'bold', fill: CER }) + lines(300, rowY[1] + 72, ['paired many times'], { size: 13, fill: CER });
  b += arrow(id, 435, rowY[1] + 55, 535, rowY[1] + 55, { stroke: VER, color: 'arV' }) + box(540, rowY[1] + 32, 220, 46, { fill: VTINT, stroke: VER }) + lines(650, rowY[1] + 61, ['salivation (UCR)'], { size: 14, weight: 'bold', fill: VER });
  // After
  b += label(rowY[2], 'After', 'a learned link');
  b += box(170, rowY[2] + 20, 260, 70, { fill: TINT, stroke: CER, sw: 3 }) + lines(300, rowY[2] + 50, ['Tone alone (now the CS)'], { size: 15, weight: 'bold', fill: CER }) + lines(300, rowY[2] + 72, ['no food given'], { size: 13, fill: CER });
  b += arrow(id, 435, rowY[2] + 55, 535, rowY[2] + 55, { stroke: CER, color: 'arC', sw: 3 }) + box(540, rowY[2] + 32, 220, 46, { fill: TINT, stroke: CER, sw: 3 }) + lines(650, rowY[2] + 61, ['salivation (CR), learned'], { size: 14, weight: 'bold', fill: CER });
  b += `<line x1="20" y1="${rowY[1] - 25}" x2="${W - 20}" y2="${rowY[1] - 25}" stroke="#D5DBD9" stroke-width="1.5"/><line x1="20" y1="${rowY[2] - 25}" x2="${W - 20}" y2="${rowY[2] - 25}" stroke="#D5DBD9" stroke-width="1.5"/>`;
  figs[id] = { W, H, svg: svg(id, W, H, 'Classical conditioning: before, during and after',
    'Three rows. Before: a tone, the neutral stimulus, produces no salivation, while food, the unconditioned stimulus, produces salivation, the unconditioned response, without learning. During: the tone and food are paired many times and the food produces salivation. After: the tone alone, now the conditioned stimulus, produces salivation, the conditioned response.', b),
    alt: 'Before conditioning a tone (neutral stimulus) causes no salivation and food (UCS) causes salivation (UCR). During acquisition the tone and food are paired. After, the tone alone (now the CS) causes salivation (CR).' };
}

/* 2. Operant conditioning: the 2 x 2 grid of consequences. */
{
  const id = 'operant-conditioning-grid', W = 820, H = 470;
  const cx = [300, 580], cy = [150, 320], cw = 270, ch = 150;
  let b = lines(W / 2, 34, ['Four consequences: add or remove, increase or decrease'], { size: 19, weight: 'bold' });
  b += lines(cx[0], 92, ['Add a stimulus (positive)'], { size: 16, weight: 'bold' }) + lines(cx[1], 92, ['Remove a stimulus (negative)'], { size: 16, weight: 'bold' });
  b += lines(85, cy[0] + 70, ['Behavior'], { size: 15, weight: 'bold', fill: GRN }) + lines(85, cy[0] + 90, ['increases'], { size: 15, weight: 'bold', fill: GRN });
  b += lines(85, cy[1] + 70, ['Behavior'], { size: 15, weight: 'bold', fill: VER }) + lines(85, cy[1] + 90, ['decreases'], { size: 15, weight: 'bold', fill: VER });
  const cell = (x, y, head, ex, fill, stroke) => box(x - cw / 2, y - 45, cw, ch, { fill, stroke }) + lines(x, y - 12, [head], { size: 17, weight: 'bold', fill: stroke }) + lines(x, y + 18, ex, { size: 14 });
  b += cell(cx[0], cy[0], 'Positive reinforcement', ['Add something wanted.', 'Praise after homework;', 'homework happens more.'], GTINT, GRN);
  b += cell(cx[1], cy[0], 'Negative reinforcement', ['Remove something unpleasant.', 'Buckling up stops the beeping;', 'buckling up happens more.'], GTINT, GRN);
  b += cell(cx[0], cy[1], 'Positive punishment', ['Add something unpleasant.', 'Extra chores after lying;', 'lying happens less.'], VTINT, VER);
  b += cell(cx[1], cy[1], 'Negative punishment', ['Remove something wanted.', 'Phone taken after curfew;', 'late nights happen less.'], VTINT, VER);
  figs[id] = { W, H, svg: svg(id, W, H, 'Reinforcement and punishment, positive and negative',
    'A two by two grid. Columns: add a stimulus (positive) or remove a stimulus (negative). Rows: the behavior increases (reinforcement) or decreases (punishment). Positive reinforcement: praise after homework, homework happens more. Negative reinforcement: buckling up stops the beeping, buckling up happens more. Positive punishment: extra chores after lying, lying happens less. Negative punishment: phone taken after curfew, late nights happen less.', b),
    alt: 'A 2 by 2 grid: positive means a stimulus is added and negative means one is removed; reinforcement makes a behavior more likely and punishment less likely, with an everyday example in each cell.' };
}

/* 3. Social learning: watching a model, then the consequence the model gets. */
{
  const id = 'social-cognitive-learning-model', W = 820, H = 430;
  let b = lines(W / 2, 34, ['Learning by watching: what the model gets matters'], { size: 19, weight: 'bold' });
  b += box(30, 150, 200, 110, { fill: TINT, stroke: CER }) + lines(130, 190, ['An observer watches'], { size: 15, weight: 'bold', fill: CER }) + lines(130, 214, ['a model act'], { size: 15, weight: 'bold', fill: CER }) + lines(130, 238, ['(attention, memory)'], { size: 13, fill: GREY });
  b += arrow(id, 235, 180, 315, 110, { stroke: GRN, color: 'arG' }) + arrow(id, 235, 230, 315, 300, { stroke: VER, color: 'arV' });
  b += box(320, 60, 230, 100, { fill: GTINT, stroke: GRN }) + lines(435, 96, ['Model is rewarded'], { size: 16, weight: 'bold', fill: GRN }) + lines(435, 122, ['vicarious reinforcement'], { size: 14, fill: INK });
  b += box(320, 250, 230, 100, { fill: VTINT, stroke: VER }) + lines(435, 286, ['Model is punished'], { size: 16, weight: 'bold', fill: VER }) + lines(435, 312, ['vicarious punishment'], { size: 14, fill: INK });
  b += arrow(id, 555, 110, 615, 110, { stroke: GRN, color: 'arG' }) + arrow(id, 555, 300, 615, 300, { stroke: VER, color: 'arV' });
  b += box(620, 60, 175, 100, { fill: '#FFFFFF', stroke: GRN }) + lines(707, 98, ['Observer imitates'], { size: 14, weight: 'bold', fill: GRN }) + lines(707, 122, ['more often'], { size: 14, weight: 'bold', fill: GRN });
  b += box(620, 250, 175, 100, { fill: '#FFFFFF', stroke: VER }) + lines(707, 288, ['Observer imitates'], { size: 14, weight: 'bold', fill: VER }) + lines(707, 312, ['less often'], { size: 14, weight: 'bold', fill: VER });
  b += lines(W / 2, 395, ['Either way the behavior is learned: an observer who saw a punished model can still do it when it pays.'], { size: 14, fill: CER, weight: 'bold' });
  figs[id] = { W, H, svg: svg(id, W, H, 'Observational learning and vicarious conditioning',
    'An observer watches a model act. If the model is rewarded (vicarious reinforcement), the observer imitates more often. If the model is punished (vicarious punishment), the observer imitates less often. A note says the behavior is learned either way: an observer who saw a punished model can still perform it when it pays.', b),
    alt: 'An observer watches a model. A rewarded model (vicarious reinforcement) leads to more imitation; a punished model (vicarious punishment) leads to less. The behavior is learned either way.' };
}

/* 4. Attribution: two kinds of explanation and the three biases. */
{
  const id = 'attribution-biases', W = 820, H = 500;
  let b = lines(W / 2, 34, ['Explaining behavior: the person or the situation?'], { size: 19, weight: 'bold' });
  b += box(60, 60, 330, 92, { fill: TINT, stroke: CER }) + lines(225, 92, ['Dispositional attribution'], { size: 16, weight: 'bold', fill: CER }) + lines(225, 118, ['"She failed because she is lazy."'], { size: 14 }) + lines(225, 138, ['(traits, effort, ability)'], { size: 13, fill: GREY });
  b += box(430, 60, 330, 92, { fill: GTINT, stroke: GRN }) + lines(595, 92, ['Situational attribution'], { size: 16, weight: 'bold', fill: GRN }) + lines(595, 118, ['"She failed because the test was unfair."'], { size: 14 }) + lines(595, 138, ['(circumstances, luck, other people)'], { size: 13, fill: GREY });
  const row = (y, head, text, fill, stroke) => box(60, y, 700, 92, { fill, stroke }) + lines(80, y + 32, [head], { size: 16, weight: 'bold', fill: stroke, anchor: 'start' }) + lines(80, y + 58, text, { size: 14, anchor: 'start' });
  b += row(175, 'Fundamental attribution error (judging others)', ['We over-credit the person and under-credit the situation when we explain', 'someone else\'s behavior.'], NTINT, INK);
  b += row(285, 'Actor-observer bias (me versus you)', ['For my own actions I point to the situation; for yours I point to you.'], NTINT, INK);
  b += row(395, 'Self-serving bias (my wins and my losses)', ['My success is my doing (person); my failure is bad luck (situation).'], NTINT, INK);
  b += `<line x1="225" y1="152" x2="225" y2="172" stroke="${CER}" stroke-width="2"/><line x1="595" y1="152" x2="595" y2="172" stroke="${GRN}" stroke-width="2"/>`;
  figs[id] = { W, H, svg: svg(id, W, H, 'Dispositional and situational attributions and three biases',
    'Two boxes: a dispositional attribution explains behavior by the person (she failed because she is lazy); a situational attribution explains it by the circumstances (she failed because the test was unfair). Below, three biases: the fundamental attribution error, over-crediting the person when judging others; the actor-observer bias, pointing to the situation for my actions and to the person for yours; the self-serving bias, crediting myself for success and the situation for failure.', b),
    alt: 'Dispositional attributions explain behavior by the person, situational ones by the circumstances. Below: the fundamental attribution error, the actor-observer bias and the self-serving bias, each in one line.' };
}

/* 5. Cognitive dissonance: the loop from a clash to a change. */
{
  const id = 'attitudes-dissonance', W = 820, H = 440;
  let b = lines(W / 2, 34, ['Cognitive dissonance: when actions and attitudes clash'], { size: 19, weight: 'bold' });
  b += box(40, 80, 230, 110, { fill: NTINT }) + lines(155, 115, ['Attitude'], { size: 16, weight: 'bold' }) + lines(155, 140, ['"Vaping is harmful."'], { size: 14 });
  b += box(40, 240, 230, 110, { fill: NTINT }) + lines(155, 275, ['Action'], { size: 16, weight: 'bold' }) + lines(155, 300, ['"I vape every day."'], { size: 14 });
  b += arrow(id, 275, 135, 335, 195, { stroke: INK }) + arrow(id, 275, 295, 335, 235, { stroke: INK });
  b += box(340, 160, 180, 110, { fill: VTINT, stroke: VER }) + lines(430, 198, ['Discomfort'], { size: 16, weight: 'bold', fill: VER }) + lines(430, 222, ['(dissonance)'], { size: 14, fill: VER }) + lines(430, 244, ['wants to be reduced'], { size: 13 });
  const out = (y, t1, t2) => box(580, y, 210, 76, { fill: TINT, stroke: CER }) + lines(685, y + 31, [t1], { size: 14, weight: 'bold', fill: CER }) + lines(685, y + 53, [t2], { size: 13 });
  b += arrow(id, 525, 190, 575, 110, { stroke: CER, color: 'arC' }) + out(70, 'Change the attitude', '"It is not that harmful."');
  b += arrow(id, 525, 215, 575, 215, { stroke: CER, color: 'arC' }) + out(177, 'Change the action', '"I am quitting."');
  b += arrow(id, 525, 240, 575, 318, { stroke: CER, color: 'arC' }) + out(284, 'Add a justification', '"It helps my stress."');
  b += lines(W / 2, 412, ['The theory: the less outside excuse there is for the action, the stronger the pull to change.'], { size: 14, weight: 'bold', fill: CER });
  figs[id] = { W, H, svg: svg(id, W, H, 'Cognitive dissonance and three ways to reduce it',
    'An attitude (vaping is harmful) and an action (I vape every day) clash, producing discomfort called dissonance. Three arrows lead to ways of reducing it: change the attitude (it is not that harmful), change the action (I am quitting), or add a justification (it helps my stress). A note gives the theory: the less outside excuse there is for the action, the stronger the pull to change.', b),
    alt: 'An attitude and an action that clash produce discomfort (cognitive dissonance), reduced by changing the attitude, changing the action, or adding a justification.' };
}

/* 6. Helping: the steps before a bystander helps, and where crowds interfere. */
{
  const id = 'social-situations-helping', W = 820, H = 420;
  let b = lines(W / 2, 34, ['Before a bystander helps: four decisions'], { size: 19, weight: 'bold' });
  const steps = [['Notice', 'the event'], ['Interpret it', 'as an emergency'], ['Take', 'responsibility'], ['Decide how', 'and act']];
  const bx = i => 30 + i * 198;
  steps.forEach((s, i) => {
    b += box(bx(i), 80, 165, 92, { fill: TINT, stroke: CER }) + lines(bx(i) + 82, 118, [s[0]], { size: 16, weight: 'bold', fill: CER }) + lines(bx(i) + 82, 142, [s[1]], { size: 15, fill: CER });
    if (i < 3) b += arrow(id, bx(i) + 168, 126, bx(i) + 194, 126, { stroke: CER, color: 'arC' });
  });
  const note = (i, t) => `<line x1="${bx(i) + 82}" y1="176" x2="${bx(i) + 82}" y2="222" stroke="${VER}" stroke-width="2" stroke-dasharray="5 4"/>` + box(bx(i) - 5, 226, 175, 118, { fill: VTINT, stroke: VER }) + lines(bx(i) + 82, 254, t, { size: 13.5 });
  b += note(0, ['Busy, crowded', 'places: people', 'notice less']);
  b += note(1, ['Others look calm,', 'so it seems', 'not serious']);
  b += note(2, ['Diffusion of', 'responsibility:', '"someone else', 'will act"']);
  b += note(3, ['Unsure what to do,', 'or worried about', 'looking foolish']);
  b += lines(W / 2, 382, ['A crowd can block any step, yet in real recorded conflicts someone usually helps.'], { size: 14, weight: 'bold', fill: CER });
  figs[id] = { W, H, svg: svg(id, W, H, 'Four decisions before a bystander helps',
    'Four boxes in a row: notice the event, interpret it as an emergency, take responsibility, decide how and act. Below each, how other people can interfere: in busy places people notice less; others look calm so it seems not serious; diffusion of responsibility, someone else will act; unsure what to do or worried about looking foolish. A note says a crowd can block any step, yet in real recorded conflicts someone usually helps.', b),
    alt: 'Four steps before helping (notice, interpret as an emergency, take responsibility, act), each with how other bystanders can interfere, including diffusion of responsibility.' };
}

mkdirSync(OUT, { recursive: true });
for (const [id, f] of Object.entries(figs)) writeFileSync(join(OUT, `${id}.svg`), f.svg);
// Registry entries for psychology/data/figures/<topic>.json, printed for the author.
if (process.argv.includes('--registry')) console.log(JSON.stringify(Object.fromEntries(Object.entries(figs).map(([id, f]) => [id, { file: `figures/${id}.svg`, ext: 'svg', w: f.W, h: f.H, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt: f.alt }])), null, 1));
else console.log(`author-e figures: ${Object.keys(figs).length} written to psychology/figures/`);
