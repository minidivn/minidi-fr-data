/**
 * BM25 ranking function for full-text search.
 */
export function buildBM25(nodes) {
  const k1 = 1.5;
  const b = 0.75;
  const N = nodes.length;
  let avgdl = 0;
  const docLens = [];
  const tfs = [];
  const dfs = {};

  for (let i = 0; i < N; i++) {
    const text = [nodes[i].l || "", nodes[i].lv || "", nodes[i].d || ""]
      .join(" ")
      .toLowerCase();

    const terms = text.split(/\s+/).filter((t) => t.length > 1);
    docLens.push(terms.length);
    avgdl += terms.length;

    const tf = {};
    terms.forEach((t) => {
      tf[t] = (tf[t] || 0) + 1;
    });
    tfs.push(tf);

    for (const term in tf) {
      dfs[term] = (dfs[term] || 0) + 1;
    }
  }

  avgdl /= N;

  return function score(query) {
    const queryTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1);

    const scores = [];

    for (let i = 0; i < N; i++) {
      let score = 0;
      const docLen = docLens[i];
      const tf = tfs[i];

      for (const term of queryTerms) {
        const freq = tf[term] || 0;
        if (freq === 0) continue;

        const idf = Math.log(
          (N - (dfs[term] || 0) + 0.5) / ((dfs[term] || 0) + 0.5) + 1,
        );

        score +=
          idf *
          ((freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (docLen / avgdl))));
      }

      if (score > 0) {
        scores.push({ index: i, score });
      }
    }

    scores.sort((a, b) => b.score - a.score);
    return scores;
  };
}
