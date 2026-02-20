export interface DiffSegment {
  type: "keep" | "add" | "remove";
  text: string;
}

export function diffWords(oldStr: string, newStr: string): DiffSegment[] {
  const oldWords = oldStr.split(/\s+/).filter(Boolean);
  const newWords = newStr.split(/\s+/).filter(Boolean);
  const m = oldWords.length;
  const n = newWords.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        oldWords[i - 1] === newWords[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack to build diff segments
  const segments: DiffSegment[] = [];
  let i = m;
  let j = n;
  const raw: DiffSegment[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      raw.push({ type: "keep", text: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      raw.push({ type: "add", text: newWords[j - 1] });
      j--;
    } else {
      raw.push({ type: "remove", text: oldWords[i - 1] });
      i--;
    }
  }
  raw.reverse();

  // Merge consecutive segments of the same type
  for (const seg of raw) {
    const last = segments[segments.length - 1];
    if (last && last.type === seg.type) {
      last.text += ` ${seg.text}`;
    } else {
      segments.push({ ...seg });
    }
  }

  return segments;
}
