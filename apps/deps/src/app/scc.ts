// https://cp-algorithms.com/graph/strongly-connected-components.html#description-of-the-algorithm
export function scc(graph: Record<string, string[]>) {
  let visited: Record<string, boolean> = {};
  const tOut: Record<string, number> = {};
  let i = 1;

  function dfs(node: string) {
    visited[node] = true;
    for (const target of graph[node]) {
      if (visited[target]) {
        continue;
      }
      dfs(target);
    }
    tOut[node] = i++;
  }

  for (const node of Object.keys(graph)) {
    if (!visited[node]) dfs(node);
  }

  // Get the transposed graph
  const transposed = Object.fromEntries(Object.keys(graph).map((node) => [node, [] as string[]]));
  for (const [source, targets] of Object.entries(graph)) {
    for (const target of targets) {
      transposed[target].push(source);
    }
  }

  visited = {};
  function* components(node: string): IterableIterator<string> {
    visited[node] = true;
    yield node;
    for (const target of transposed[node]) {
      if (visited[target]) {
        continue;
      }
      yield* components(target);
    }
  }

  const out: string[][] = [];
  for (const node of Object.keys(tOut).reverse()) {
    if (!visited[node]) out.push(Array.from(components(node)));
  }

  return out;
}
