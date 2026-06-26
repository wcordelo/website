/** Contamination Regurgitation Score — CRS (BENCH-013). */

export interface CorpusMatch {
  source: string;
  similarity: number;
  excerpt: string;
}

/** Simple n-gram Jaccard similarity for v0 stub. */
function ngramSet(text: string, n = 4): Set<string> {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  const grams = new Set<string>();
  for (let i = 0; i <= normalized.length - n; i++) {
    grams.add(normalized.slice(i, i + n));
  }
  return grams;
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = ngramSet(a);
  const setB = ngramSet(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  let intersection = 0;
  for (const g of setA) {
    if (setB.has(g)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function computeCRS(
  taskTexts: string[],
  publicCorpus: Array<{ source: string; text: string }>,
  threshold = 0.85
): { crsScore: number; matches: Array<{ taskIndex: number } & CorpusMatch> } {
  const matches: Array<{ taskIndex: number } & CorpusMatch> = [];

  for (let ti = 0; ti < taskTexts.length; ti++) {
    const taskText = taskTexts[ti]!;
    for (const doc of publicCorpus) {
      const sim = jaccardSimilarity(taskText, doc.text);
      if (sim >= threshold) {
        matches.push({
          taskIndex: ti,
          source: doc.source,
          similarity: sim,
          excerpt: doc.text.slice(0, 120),
        });
      }
    }
  }

  const crsScore =
    taskTexts.length === 0
      ? 0
      : new Set(matches.map((m) => m.taskIndex)).size / taskTexts.length;

  return { crsScore, matches };
}
