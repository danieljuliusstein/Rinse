import Link from 'next/link'

interface CustomerTermsProps {
  supportEmail: string | null
  supportMailto: string | null
}

export default function CustomerTerms({ supportEmail, supportMailto }: CustomerTermsProps) {
  return (
    <>
      <section>
        <h2>1. Who you are booking with</h2>
        <p>
          Services booked through this page are provided by an independent detailing business operating
          this booking experience (&quot;the Business&quot;). Rinse provides software and payment workflows for
          the Business but does not perform or supervise detailing services.
        </p>
      </section>

      <section>
        <h2>2. Payment processing</h2>
        <p>
          Payments are processed through Stripe. The Business is the merchant of record for your
          transaction and is responsible for service refunds, pricing disputes, and cancellation
          policies.
        </p>
      </section>

      <section>
        <h2>3. Communications</h2>
        <p>
          If you provide contact information, you may receive appointment and service-related
          communications. Reply STOP to opt out of SMS messages. Standard carrier rates may apply.
        </p>
      </section>

      <section>
        <h2>4. Your information</h2>
        <p>
          Booking details you submit are collected by the Business through Rinse software. Rinse
          handles this information as a service provider for the Business.
        </p>
        <p>
          See the <Link href="/privacy">Privacy Policy</Link> for details on data handling.
        </p>
      </section>

      <section>
        <h2>5. Photos</h2>
        <p>
          The Business may capture before/after, condition, or damage documentation photos in
          connection with services. These photos are stored in Rinse software on the Business&apos;s
          behalf.
        </p>
      </section>

      <section>
        <h2>6. Disputes about this booking page or payment system</h2>
        <p>
          This section applies only to disputes about the operation of this booking page or payment
          system itself, and not to disputes about service quality, which are between you and the
          Business.
        </p>
        <p>
          Such platform disputes are resolved by binding individual arbitration and not class actions,
          except you may bring eligible claims in small-claims court. Claims involving sexual assault
          or sexual harassment may be brought in court.
        </p>
      </section>

      <section>
        <h2>7. Governing law</h2>
        <p>
          These terms are governed by Georgia law, without conflict-of-law principles, except this
          clause does not waive non-waivable protections you may have under the law of your home state.
        </p>
      </section>

      <section>
        <h2>8. Changes</h2>
        <p>
          These terms may be updated from time to time. The version in effect when you book or pay
          applies to that transaction.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For service questions, contact the Business directly. For platform issues:{' '}
          {supportMailto && supportEmail ? (
            <a href={supportMailto} className="portal-contact-link">
              {supportEmail}
            </a>
          ) : (
            'use the support contact listed on this site'
          )}
          .
        </p>
      </section>
    </>
  )
}
