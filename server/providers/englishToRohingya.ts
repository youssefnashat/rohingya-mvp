import type { EnglishToRohingya, Phrase } from './types';

/**
 * MOCK. Scores each phrase by how many of its keywords appear in the English
 * text and returns the best one (plus a tie, at most two).
 */
export class KeywordEnglishToRohingya implements EnglishToRohingya {
  readonly name = 'mock-keywords';

  async translate(text: string, phrases: Phrase[]): Promise<{ phraseIds: string[]; noMatch: boolean }> {
    const normalized = ` ${text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ')} `;
    const scored = phrases
      .map((p) => ({
        id: p.id,
        // Longer keywords are more specific, so they count for more.
        score: p.keywords.reduce(
          (sum, k) => (normalized.includes(` ${k.toLowerCase()} `) ? sum + k.split(' ').length : sum),
          0,
        ),
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) return { phraseIds: [], noMatch: true };
    const best = scored[0].score;
    return { phraseIds: scored.filter((s) => s.score === best).slice(0, 2).map((s) => s.id), noMatch: false };
  }
}

// TODO(real): let an LLM pick the phrases. The model never generates Rohingya;
// it only selects IDs of clips recorded by community speakers, so it cannot
// invent a wrong translation — the worst case is "no_match".
//
// export class GroqEnglishToRohingya implements EnglishToRohingya {
//   readonly name = 'groq-llm';
//   async translate(text: string, phrases: Phrase[]) {
//     const phraseList = phrases.map((p) => `${p.id}: ${p.englishMeaning}`).join('\n');
//     const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         model: 'llama-3.3-70b-versatile',
//         temperature: 0,
//         response_format: { type: 'json_object' },
//         messages: [
//           {
//             role: 'system',
//             content:
//               'You map an English sentence onto a fixed bank of pre-recorded phrases.\n' +
//               'Reply with JSON: {"phraseIds": ["id", ...]} listing 1-3 phrase IDs, in\n' +
//               'speaking order, that together convey the same meaning. Only use IDs from\n' +
//               'the list. If no phrase conveys the meaning, reply {"phraseIds": "no_match"}.\n' +
//               'Never guess: a wrong phrase is worse than no_match.\n\nPHRASES:\n' + phraseList,
//           },
//           { role: 'user', content: text },
//         ],
//       }),
//     });
//     const json = await res.json();
//     const { phraseIds } = JSON.parse(json.choices[0].message.content);
//     const known = new Set(phrases.map((p) => p.id));
//     if (!Array.isArray(phraseIds)) return { phraseIds: [], noMatch: true };
//     const valid = phraseIds.filter((id: string) => known.has(id)); // drop hallucinated IDs
//     return { phraseIds: valid, noMatch: valid.length === 0 };
//   }
// }
