import { Seo } from '../components/Seo'
import { ContactForm } from '../components/Forms'
import { CONTACT_EMAIL } from '../lib/site'

export default function Contact() {
  return (
    <>
      <Seo title="Contact" description="Contact Wealth Builders Hub about products, downloads, partnerships or the affiliate programme." path="/contact" />
      <header className="page-head">
        <div className="wrap">
          <p className="eyebrow">Contact</p>
          <h1>Send us a message</h1>
          <p className="lede">Questions about a product, a download or a partnership are all welcome. Your message is saved securely and we reply by email.</p>
        </div>
      </header>
      <section className="section">
        <div className="wrap" style={{ maxWidth: 680 }}>
          <ContactForm />
          <p className="muted" style={{ marginTop: 28 }}>
            Prefer email? Write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </div>
      </section>
    </>
  )
}
