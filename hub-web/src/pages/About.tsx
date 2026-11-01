import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'

export default function About() {
  return (
    <>
      <Seo title="About" description="Wealth Builders Hub is a digital business education platform founded by Mustapha Abdurrazzaq (Boss Mustapha). Learn our mission, philosophy and commitment to transparency." path="/about" />
      <header className="page-head">
        <div className="wrap">
          <p className="eyebrow">About</p>
          <h1>Education for people building online</h1>
          <p className="lede">Wealth Builders Hub helps people understand digital business: the tools, the platforms and the habits behind sustainable online income.</p>
        </div>
      </header>

      <section className="section">
        <div className="wrap split">
          <div>
            <h2>Our mission</h2>
            <p>To make practical digital business knowledge clear, honest and usable, for readers in the United States, the United Kingdom, Canada, Nigeria and anywhere English-language education reaches.</p>
            <h2 style={{ marginTop: 40 }}>Our vision</h2>
            <p>A trusted international library where anyone can learn how online business actually works, then build something real with the templates and guides provided.</p>
          </div>
          <div>
            <h2>What you can learn</h2>
            <ul className="checklist">
              <li>Affiliate marketing and responsible promotion</li>
              <li>AI tools and workflow automation</li>
              <li>Content creation and digital marketing</li>
              <li>Creating and selling digital products</li>
              <li>Amazon KDP and self-publishing</li>
              <li>Productivity and business systems</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section section--cream">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <h2>Educational philosophy</h2>
          <p>We teach the mechanism before the method. A reader who understands why something works can adapt when platforms change, and platforms always change. So each guide explains the idea, shows the tool, and names the risks plainly.</p>
          <p>We prefer one useful template to ten motivational paragraphs. Where a topic is risky or unregulated, we leave it out rather than dress it up. That is why speculative trading and get-rich-quick schemes are not part of this library.</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap split">
          <div>
            <p className="eyebrow">Founder</p>
            <h2>Mustapha Abdurrazzaq</h2>
            <p>Mustapha, publicly known as Boss Mustapha, founded Wealth Builders Hub to turn what he teaches about digital business into a structured, searchable library. He writes and reviews the guides published here.</p>
          </div>
          <div className="notice notice--info">
            <h3 style={{ fontSize: '1.0625rem' }}>Our commitment to transparency</h3>
            <p style={{ margin: 0 }}>We publish no fake testimonials, invented statistics or earnings claims. Some links on this site are affiliate links, and we say so on every page where it applies. Read the <Link to="/legal/affiliate-disclosure">affiliate disclosure</Link> and the <Link to="/legal/disclaimer">educational disclaimer</Link>.</p>
          </div>
        </div>
      </section>
    </>
  )
}
