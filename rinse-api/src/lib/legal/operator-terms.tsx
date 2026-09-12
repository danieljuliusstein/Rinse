import Link from 'next/link'

interface OperatorTermsProps {
  legalEntityName: string
  legalEmail: string | null
  supportEmail: string | null
  legalMailto: string | null
  supportMailto: string | null
}

export default function OperatorTerms({
  legalEntityName,
  legalEmail,
  supportEmail,
  legalMailto,
  supportMailto,
}: OperatorTermsProps) {
  return (
    <>
      <section>
        <h2>1. Acceptance of terms and eligibility</h2>
        <p>
          These Terms of Service are a binding agreement between {legalEntityName} (&quot;Rinse,&quot; &quot;we,&quot;{' '}
          &quot;us&quot;) and the business or individual identified at signup (&quot;Operator,&quot; &quot;you&quot;).
          By clicking &quot;I Agree,&quot; creating an account, or using the Service, you accept these
          Terms as of that date.
        </p>
        <p>
          You must be at least 18 years old and authorized to bind your business. If you are a sole
          proprietor, all obligations under these Terms apply to you individually.
        </p>
      </section>

      <section>
        <h2>2. Definitions</h2>
        <ul>
          <li>
            <strong>Operator:</strong> the detailing business using the Service.
          </li>
          <li>
            <strong>End Customer:</strong> a client who books, receives, or pays for detailing
            services through Rinse-powered pages.
          </li>
          <li>
            <strong>Personnel:</strong> your employees, contractors, and agents.
          </li>
          <li>
            <strong>Content:</strong> text, photos, invoices, quotes, and similar material uploaded
            or created in the Service.
          </li>
          <li>
            <strong>Tenant Data:</strong> your Content and account data.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Service scope</h2>
        <p>
          The Service provides software tools for booking, CRM, invoices, payments, and messaging.
          Rinse does not perform detailing services, is not the seller of your services, and does not
          guarantee quality, safety, legality, or outcomes of work performed by Operators.
        </p>
      </section>

      <section>
        <h2>4. Operator obligations</h2>
        <p>You represent and agree that you:</p>
        <ul>
          <li>Maintain all licenses, permits, and insurance required in your jurisdictions.</li>
          <li>Are solely responsible for your service quality, legality, and customer policies.</li>
          <li>Are solely responsible for tax obligations and worker classification decisions.</li>
          <li>Will not represent that Rinse provides detailing services on your behalf.</li>
        </ul>
      </section>

      <section>
        <h2>5. Account security</h2>
        <p>
          You are responsible for credential security and for activity under your account, including
          actions taken by your Personnel. Notify us promptly of unauthorized access.
        </p>
      </section>

      <section>
        <h2>6. Fees and billing</h2>
        <p>
          Subscription fees, billing frequency, renewal terms, and cancellation mechanics are defined
          in separate Payment Terms incorporated by reference.
        </p>
      </section>

      <section>
        <h2>7. Payment processing for your customers</h2>
        <p>
          Payment features are provided through Stripe connected accounts. You are the merchant of
          record for your End Customers and are responsible for pricing, refunds, tax collection,
          disputes, and chargebacks.
        </p>
      </section>

      <section>
        <h2>8. Messaging features</h2>
        <p>
          You may send SMS, email, and push messages to your customers. You are responsible for
          obtaining any legally required consent and for compliance with TCPA, CAN-SPAM, and related
          laws. STOP opt-outs are respected at the platform level.
        </p>
      </section>

      <section>
        <h2>9. Content and photos</h2>
        <p>
          You grant Rinse a limited, non-exclusive license to host and process Content solely to
          provide the Service. You represent that you have any permissions needed for images and
          uploads, including customer-facing photos.
        </p>
      </section>

      <section>
        <h2>10. Data and privacy</h2>
        <p>
          You retain ownership of your Tenant Data. Rinse may use de-identified or aggregated data
          derived from Tenant Data for operating and improving the Service.
        </p>
      </section>

      <section>
        <h2>11. Intellectual property</h2>
        <p>
          Rinse owns the Service and underlying technology. You retain rights in your own brand assets
          and grant us a limited license to display those assets within the Service.
        </p>
      </section>

      <section>
        <h2>12. Acceptable use</h2>
        <p>
          Use is subject to our Acceptable Use Policy, including prohibitions on fraudulent bookings,
          abuse of messaging features, unauthorized access attempts, and misrepresentation.
        </p>
      </section>

      <section>
        <h2>13. Suspension and termination</h2>
        <p>
          Rinse may suspend accounts for fraud, serious legal or platform risk, or material policy
          violations. For most violations, we provide notice and a reasonable opportunity to cure.
        </p>
        <p>
          After termination, you will have a reasonable data export window (currently 30 days) unless
          retention is required by law or dispute.
        </p>
      </section>

      <section>
        <h2>14. Warranty disclaimer</h2>
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT WARRANTIES OF ANY KIND,
          WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR
          PURPOSE, TITLE, AND NON-INFRINGEMENT, EXCEPT AS EXPRESSLY PROVIDED IN WRITING.
        </p>
      </section>

      <section>
        <h2>15. Liability and indemnification</h2>
        <p>
          To the maximum extent permitted by law, Rinse&apos;s total liability for claims relating to
          these Terms or the Service is limited to fees paid by you in the 12 months before the claim.
          Rinse is not liable for indirect, special, incidental, consequential, or lost-profit damages.
        </p>
        <p>
          You agree to indemnify Rinse for claims arising from your services, Personnel conduct,
          messaging consent failures, or uploaded Content.
        </p>
      </section>

      <section>
        <h2>16. Dispute resolution</h2>
        <p>
          Disputes arising out of these Terms will be resolved by binding individual arbitration and
          not as class, collective, or representative actions, except that either party may bring an
          individual claim in small-claims court. Claims involving sexual assault or sexual harassment
          may be brought in court.
        </p>
        <p>
          New Operators may opt out of arbitration by written notice within 30 days of first accepting
          these Terms.
        </p>
      </section>

      <section>
        <h2>17. Changes to terms</h2>
        <p>
          We may update these Terms from time to time with notice for material changes. Material changes
          to fees or arbitration require affirmative re-acceptance.
        </p>
      </section>

      <section>
        <h2>18. Beta features</h2>
        <p>
          Features labeled beta or experimental may change or be removed at any time and are provided
          without warranty or service-level commitments.
        </p>
      </section>

      <section>
        <h2>19. General terms</h2>
        <ul>
          <li>
            <strong>Governing law:</strong> Georgia law applies, without conflict-of-law principles.
          </li>
          <li>
            <strong>Assignment:</strong> you may not assign these Terms without consent.
          </li>
          <li>
            <strong>Entire agreement:</strong> these Terms and incorporated documents are the full
            agreement on this subject.
          </li>
          <li>
            <strong>No third-party beneficiaries:</strong> End Customers are not parties to this
            Operator agreement.
          </li>
        </ul>
        <p>
          Legal notices:{' '}
          {legalMailto && legalEmail ? (
            <a href={legalMailto} className="portal-contact-link">
              {legalEmail}
            </a>
          ) : supportMailto && supportEmail ? (
            <a href={supportMailto} className="portal-contact-link">
              {supportEmail}
            </a>
          ) : (
            'use the support contact listed in your account'
          )}
          .
        </p>
      </section>

      <section>
        <h2>Related policies</h2>
        <ul>
          <li>
            <Link href="/privacy">Privacy Policy</Link>
          </li>
          <li>
            <Link href="/terms/customers">End-Customer Terms of Use</Link>
          </li>
          <li>
            Payment Terms, SMS/Messaging Consent Terms, Acceptable Use Policy, and Data Processing
            Addendum are available on request through support.
          </li>
        </ul>
      </section>
    </>
  )
}
