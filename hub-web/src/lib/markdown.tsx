import type { ReactNode } from 'react'

// Small, safe renderer: no raw HTML is ever injected. Supports headings, lists,
// paragraphs, bold, italic and http(s) links.

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g
  let last = 0
  let i = 0
  for (const m of text.matchAll(re)) {
    const idx = m.index ?? 0
    if (idx > last) out.push(text.slice(last, idx))
    const tok = m[0]
    const key = `${keyBase}-${i++}`
    if (tok.startsWith('**')) out.push(<strong key={key}>{tok.slice(2, -2)}</strong>)
    else if (tok.startsWith('*')) out.push(<em key={key}>{tok.slice(1, -1)}</em>)
    else {
      const [, label, href] = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok) ?? []
      out.push(
        <a key={key} href={href} target="_blank" rel="noopener noreferrer nofollow">
          {label}
        </a>,
      )
    }
    last = idx + tok.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let para: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  let k = 0

  const flushPara = () => {
    if (para.length) {
      blocks.push(<p key={`p${k++}`}>{inline(para.join(' '), `p${k}`)}</p>)
      para = []
    }
  }
  const flushList = () => {
    if (list) {
      const items = list.items.map((t, j) => <li key={j}>{inline(t, `li${k}-${j}`)}</li>)
      blocks.push(list.ordered ? <ol key={`l${k++}`}>{items}</ol> : <ul key={`l${k++}`}>{items}</ul>)
      list = null
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const h = /^(#{1,3})\s+(.*)$/.exec(line)
    const ul = /^[-*]\s+(.*)$/.exec(line)
    const ol = /^\d+\.\s+(.*)$/.exec(line)
    if (!line.trim()) {
      flushPara()
      flushList()
    } else if (h) {
      flushPara()
      flushList()
      const level = h[1].length
      blocks.push(level === 3 ? <h3 key={`h${k++}`}>{h[2]}</h3> : <h2 key={`h${k++}`}>{h[2]}</h2>)
    } else if (ul || ol) {
      flushPara()
      const ordered = !!ol
      if (!list || list.ordered !== ordered) {
        flushList()
        list = { ordered, items: [] }
      }
      list.items.push((ul ?? ol)![1])
    } else {
      flushList()
      para.push(line.trim())
    }
  }
  flushPara()
  flushList()
  return <div className="prose">{blocks}</div>
}
