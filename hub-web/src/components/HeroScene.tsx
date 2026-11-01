import { Link } from 'react-router-dom'
import type { Article, Product, Resource } from '../lib/types'

interface Props {
  article?: Article
  resource?: Resource
  product?: Product
}

// The three stages show the newest real item from the database. When nothing is
// published for a stage yet, the card describes the stage instead of faking content.
export function HeroScene({ article, resource, product }: Props) {
  return (
    <div className="scene" aria-label="Learn, Build, Grow">
      <div className="scene__orbit" aria-hidden="true" />
      <div className="scene__orbit scene__orbit--inner" aria-hidden="true" />
      <div className="scene__line" aria-hidden="true" />

      <div className="stage">
        <div className="stage__dot" aria-hidden="true">01</div>
        {article ? (
          <Link className="stage__card" to={`/articles/${article.slug}`}>
            <div className="stage__label">Learn · newest article</div>
            <p className="stage__title">{article.title}</p>
            <p className="stage__text">{article.category ?? 'Article'}</p>
          </Link>
        ) : (
          <div className="stage__card">
            <div className="stage__label">Learn</div>
            <p className="stage__title">Guides on AI, content and online business</p>
            <p className="stage__text">Plain-language articles you can act on this week.</p>
          </div>
        )}
      </div>

      <div className="stage">
        <div className="stage__dot" aria-hidden="true">02</div>
        {resource ? (
          <Link className="stage__card" to="/resources">
            <div className="stage__label">Build · newest resource</div>
            <p className="stage__title">{resource.title}</p>
            <p className="stage__text">{resource.resource_type ?? 'Download'}</p>
          </Link>
        ) : (
          <div className="stage__card">
            <div className="stage__label">Build</div>
            <p className="stage__title">Templates, checklists and worksheets</p>
            <p className="stage__text">Downloadable tools for doing the work, not just reading.</p>
          </div>
        )}
      </div>

      <div className="stage">
        <div className="stage__dot" aria-hidden="true">03</div>
        {product ? (
          <Link className="stage__card" to={`/products/${product.slug}`}>
            <div className="stage__label">Grow · newest product</div>
            <p className="stage__title">{product.title}</p>
            <p className="stage__text">{product.category ?? 'Digital product'}</p>
          </Link>
        ) : (
          <div className="stage__card">
            <div className="stage__label">Grow</div>
            <p className="stage__title">Digital products and the affiliate programme</p>
            <p className="stage__text">Deeper material when you are ready to go further.</p>
          </div>
        )}
      </div>
    </div>
  )
}
