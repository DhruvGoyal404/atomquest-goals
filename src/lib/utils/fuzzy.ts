export function fuzzyScore(query: string, target: string | null | undefined): number {
  if (!query || !target) return 0;
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const t = target.toLowerCase();
  if (!t) return 0;

  if (t === q) return 1;
  if (t.startsWith(q)) return 0.92 - Math.min(0.05, (t.length - q.length) * 0.001);
  if (t.includes(q)) return 0.78 - Math.min(0.18, t.indexOf(q) * 0.005);

  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti += 1) {
    if (t[ti] === q[qi]) qi += 1;
  }
  const isSubsequence = qi === q.length;

  const tokens = t.split(/[\s\-_/.,]+/).filter(Boolean);
  let bestTokenScore = 0;
  for (const tok of tokens) {
    if (Math.abs(tok.length - q.length) > Math.max(3, Math.floor(q.length / 2))) continue;
    const distance = levenshtein(q, tok);
    const maxLen = Math.max(q.length, tok.length);
    if (maxLen === 0) continue;
    const score = 1 - distance / maxLen;
    if (score > bestTokenScore) bestTokenScore = score;
  }

  if (bestTokenScore >= 0.75) return 0.55 + bestTokenScore * 0.2;
  if (isSubsequence && bestTokenScore >= 0.55) return 0.45 + bestTokenScore * 0.15;
  if (isSubsequence) return 0.35;
  if (bestTokenScore >= 0.6) return bestTokenScore * 0.45;
  return 0;
}

export function bestFieldScore(query: string, fields: Array<{ text: string | null | undefined; weight?: number }>): number {
  let best = 0;
  for (const { text, weight = 1 } of fields) {
    const s = fuzzyScore(query, text) * weight;
    if (s > best) best = s;
  }
  return best;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (Math.abs(a.length - b.length) > 6) return 99;

  const dp = new Array<number>(a.length + 1);
  for (let i = 0; i <= a.length; i += 1) dp[i] = i;

  for (let j = 1; j <= b.length; j += 1) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= a.length; i += 1) {
      const temp = dp[i];
      if (a[i - 1] === b[j - 1]) {
        dp[i] = prev;
      } else {
        dp[i] = 1 + Math.min(prev, dp[i], dp[i - 1]);
      }
      prev = temp;
    }
  }
  return dp[a.length];
}
