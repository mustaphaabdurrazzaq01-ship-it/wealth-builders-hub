import { Seo } from '../components/Seo'
import { AffiliateForm } from '../components/Forms'

export default function Affiliate() {
  return (
    <>
      <Seo title="Affiliate programme" description="Apply to promote Wealth Builders Hub digital products through Selar affiliate links. Applications are reviewed by hand and approval is not guaranteed." path="/affiliate" />
      <header className="page-head">
        <div className="wrap">
          <p className="eyebrow">Affiliate programme</p>
          <h1>Promote products you can stand behind</h1>
          <p className="lede">Approved affiliates share Wealth Builders Hub digital products with their own audience using Selar affiliate links. We are selective, because the people who promote us represent us.</p>
        </div>
      </header>

      <section className="section">
        <div className="wrap split" style={{ alignItems: 'start' }}>
          <div>
            <h2>Who can apply</h2>
            <p>Creators, educators, bloggers and community owners who already talk about digital business, AI tools or online skills, anywhere in the world. A large audience is welcome but not required. An honest one is.</p>

            <h2 style={{ marginTop: 40 }}>Programme requirements</h2>
            <ul>
              <li>A real profile, channel or site we can review</li>
              <li>A Selar account for receiving affiliate links and tracking</li>
              <li>Agreement to the promotion guidelines below</li>
            </ul>

            <h2 style={{ marginTop: 40 }}>How applications are reviewed</h2>
            <p>Every application is read by a person. We look at your profile, your audience and your plan. You will be contacted by email, and some applications will be declined. Approval, sales and income are never guaranteed.</p>

            <h2 style={{ marginTop: 40 }}>Promotion guidelines</h2>
            <ul>
              <li>Disclose that you earn a commission, clearly and near the link</li>
              <li>Never promise or imply income, and never post invented earnings or testimonials</li>
              <li>Describe products accurately, including what they do not cover</li>
              <li>No spam, no misleading ads, no impersonating Wealth Builders Hub</li>
            </ul>

            <h2 style={{ marginTop: 40 }}>After approval</h2>
            <p>Approved affiliates receive an email with onboarding instructions, the products open for promotion and the Selar affiliate link for each. Commission and tracking are handled through Selar's own affiliate tools.</p>
          </div>

          <div id="apply" style={{ position: 'sticky', top: 88 }}>
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: '1.375rem' }}>Apply now</h2>
              <p className="muted">Takes about three minutes. One application per email address.</p>
              <AffiliateForm />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
