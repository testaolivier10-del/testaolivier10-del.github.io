/* Workers AI, shared by the study assistant (index.js) and the backup FRQ
   grader (frq-grade.js): the model chain and the reader for its replies. */

// Tried in order until one answers. A single hard-coded model is a time bomb:
// this shipped on @cf/meta/llama-3.1-8b-instruct, which the docs still list but
// the platform had deprecated months earlier, and the assistant fell back to
// quoting notes for every question with nothing on the page saying why.
// A deprecated model fails immediately and costs no inference, so the chain is
// only ever walked when something is genuinely wrong.
export const MODELS = [
  '@cf/zai-org/glm-4.7-flash',
  '@cf/google/gemma-4-26b-a4b-it',
  '@cf/nvidia/nemotron-3-120b-a12b',
];

// Workers AI models do not agree on where the text goes: some return
// {response}, some nest it under result, some use the OpenAI shape, and some
// return the content as an array of parts. Reading only `response` made a
// working model look like a broken one — the call succeeded and the answer was
// thrown away as "Empty response".
export function extractText(result) {
  if (!result) return '';
  if (typeof result === 'string') return result.trim();

  const candidates = [
    result.response,
    result.result?.response,
    result.output_text,
    result.choices?.[0]?.message?.content,
    result.choices?.[0]?.text,
    result.message?.content,
    result.text,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    if (Array.isArray(candidate)) {
      const joined = candidate
        .map((part) => (typeof part === 'string' ? part : part?.text || part?.content || ''))
        .join('')
        .trim();
      if (joined) return joined;
    }
  }
  return '';
}
