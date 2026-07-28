async function moveArticleUp(art: Article, secArticles: Article[]) {
  const idx = secArticles.findIndex(a => a.id === art.id)
  if (idx === 0) return
  const reindexed = secArticles.map((a, i) => ({ ...a, position: i }))
  const current = reindexed[idx]
  const prev = reindexed[idx - 1]
  await Promise.all([
    fetch(`/api/agent/articles/${current.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: idx - 1 }) }),
    fetch(`/api/agent/articles/${prev.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: idx }) }),
  ])
  await loadData()
}

async function moveArticleDown(art: Article, secArticles: Article[]) {
  const idx = secArticles.findIndex(a => a.id === art.id)
  if (idx === secArticles.length - 1) return
  const reindexed = secArticles.map((a, i) => ({ ...a, position: i }))
  const current = reindexed[idx]
  const next = reindexed[idx + 1]
  await Promise.all([
    fetch(`/api/agent/articles/${current.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: idx + 1 }) }),
    fetch(`/api/agent/articles/${next.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: idx }) }),
  ])
  await loadData()
}
