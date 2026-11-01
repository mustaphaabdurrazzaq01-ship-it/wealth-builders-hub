import { useParams } from 'react-router-dom'
import { Seo } from '../components/Seo'
import NotFound from './NotFound'

interface Doc { title: string; description: string; sections: { h: string; p: string[] }[] }

const DOCS: Record<string, Doc> = {
  privacy: {
    title: 'Privacy policy',
    description: 'How Wealth Builders Hub collects, uses and protects personal information.',
    sections: [
      { h: 'What we collect', p: ['When you use the contact form, affiliate application or newsletter signup, we store the details you enter: name, email address, country, optional WhatsApp number, social profile links and your message.', 'Purchases are completed on Selar. We do not receive or store your payment card details.'] },
      { h: 'How we use it', p: ['We use your details to reply to messages, review affiliate applications and send newsletter emails you asked for. We do not sell personal information.'] },
      { h: 'Where it is stored', p: ['Submissions are stored in a Supabase database. Access is limited to authorised administrators.'] },
      { h: 'Your choices', p: ['You can ask us to correct or delete your information, or to remove you from the newsletter, through the contact page.'] },
      { h: 'Cookies and analytics', p: ['This site does not currently run advertising or analytics scripts. This section will be updated before any are added.'] },
    ],
  },
  terms: {
    title: 'Terms of use',
    description: 'The terms that apply when you use the Wealth Builders Hub website.',
    sections: [
      { h: 'Using the site', p: ['The content here is provided for general education. You are responsible for how you use it and for following the laws and platform rules that apply to you.'] },
      { h: 'Downloads and products', p: ['Free resources and purchased products are for your personal use. You may not resell, redistribute or republish them without written permission.'] },
      { h: 'Third-party services', p: ['Checkout is provided by Selar and is governed by Selar\'s own terms. Links to other sites are provided for convenience and we do not control them.'] },
      { h: 'Changes', p: ['We may update these terms. Continued use of the site means you accept the current version.'] },
    ],
  },
  'affiliate-disclosure': {
    title: 'Affiliate disclosure',
    description: 'How affiliate relationships work on Wealth Builders Hub.',
    sections: [
      { h: 'What this means', p: ['Some links on this site, and on the pages of our approved affiliates, are affiliate links. If you buy through one, the seller or an affiliate may earn a commission at no extra cost to you.'] },
      { h: 'Our standard', p: ['We recommend products because we believe they are useful, not because of the commission. We require our affiliates to disclose their commission clearly and to describe products honestly.'] },
    ],
  },
  disclaimer: {
    title: 'Educational disclaimer',
    description: 'Wealth Builders Hub content is educational and does not guarantee any income or result.',
    sections: [
      { h: 'Education only', p: ['Everything published here is for general educational purposes. It is not financial, legal, tax or investment advice.'] },
      { h: 'No guarantees', p: ['We do not promise or imply any income, sales or outcome. Results depend on your skills, effort, market conditions and many factors outside our control. Examples are illustrations, not predictions.'] },
      { h: 'Do your own research', p: ['Before making business or financial decisions, consider speaking to a qualified professional who knows your situation.'] },
    ],
  },
}

export default function Legal() {
  const { doc = '' } = useParams()
  const d = DOCS[doc]
  if (!d) return <NotFound />
  return (
    <>
      <Seo title={d.title} description={d.description} path={`/legal/${doc}`} />
      <header className="page-head">
        <div className="wrap"><p className="eyebrow">Legal</p><h1>{d.title}</h1></div>
      </header>
      <section className="section">
        <div className="wrap legal">
          <div className="notice notice--info draft-banner"><strong>Draft for review.</strong> This text is an initial draft and has not been reviewed by a lawyer. It must be reviewed and approved before it is relied on.</div>
          {d.sections.map((s) => (
            <div key={s.h}>
              <h2>{s.h}</h2>
              {s.p.map((t) => <p key={t}>{t}</p>)}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
