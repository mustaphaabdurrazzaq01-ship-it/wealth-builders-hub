import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'

export default function NotFound() {
  return (
    <section className="section">
      <Seo title="Page not found" description="This page could not be found." path="/404" noindex />
      <div className="wrap" style={{ maxWidth: 640 }}>
        <p className="eyebrow">404</p>
        <h1>That page isn't here</h1>
        <p className="lede">It may have been unpublished or moved. Try the library instead.</p>
        <p style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link className="btn btn--primary" to="/articles">Browse articles</Link>
          <Link className="btn btn--ghost" to="/">Back to home</Link>
        </p>
      </div>
    </section>
  )
}
