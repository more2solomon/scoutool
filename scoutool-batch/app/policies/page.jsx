import Link from "next/link";

export default function PoliciesPage() {
  return (
    <main className="page legal">
      <header className="hero">
        <div className="brand">
          <div className="logo">
            S
          </div>

          <div>
            <h1>
              Scoutool
            </h1>

            <p>
              Policies
            </p>
          </div>
        </div>

        <nav className="nav">
          <Link href="/">Generator</Link>
          <Link href="/drafts">Drafts</Link>
          <Link href="/automation">Automation</Link>
          <Link href="/scraper">Scraper</Link>
          <Link href="/analytics">Analytics</Link>
        </nav>
      </header>

      <section className="panel">
        <h2>Legal Policies</h2>
        <p className="subtle">
          Please review our policies to understand your rights and responsibilities when using Scoutool Batch.
        </p>

        <div className="policyLinks">
          <Link href="/terms" className="policyCard">
            <h3>Terms of Service</h3>
            <p>
              The terms and conditions governing your use of Scoutool Batch, including user responsibilities, prohibited uses, and service limitations.
            </p>
            <span className="arrow">→</span>
          </Link>

          <Link href="/privacy" className="policyCard">
            <h3>Privacy Policy</h3>
            <p>
              How we collect, use, and protect your personal information, including data retention, security measures, and your privacy rights.
            </p>
            <span className="arrow">→</span>
          </Link>
        </div>
      </section>

      <section className="panel">
        <h2>Email Marketing Compliance</h2>
        <p>
          As an email automation platform, we require all users to comply with applicable email marketing laws and regulations.
        </p>

        <div className="complianceInfo">
          <h3>Key Regulations</h3>
          <ul>
            <li>
              <strong>CAN-SPAM Act (USA):</strong> Requires accurate header information, truthful subject lines, and clear opt-out mechanisms.
            </li>
            <li>
              <strong>GDPR (EU):</strong> Requires explicit consent for marketing emails, data minimization, and the right to be forgotten.
            </li>
            <li>
              <strong>CCPA (California):</strong> Gives consumers control over their personal information and requires transparency in data practices.
            </li>
            <li>
              <strong>CASL (Canada):</strong> Requires express or implied consent for commercial electronic messages.
            </li>
          </ul>

          <h3>Best Practices</h3>
          <ul>
            <li>Always obtain explicit consent before adding contacts to your email lists</li>
            <li>Include a clear and easy-to-use unsubscribe link in every email</li>
            <li>Use accurate and non-deceptive subject lines</li>
            <li>Include your physical mailing address in email footers</li>
            <li>Honor opt-out requests promptly (within 10 business days)</li>
            <li>Regularly clean your email lists to remove invalid addresses</li>
            <li>Segment your lists and send relevant content to each segment</li>
          </ul>
        </div>
      </section>

      <section className="panel">
        <h2>Acceptable Use Policy</h2>
        <p>
          Scoutool Batch is designed for legitimate email marketing and communication purposes. The following activities are strictly prohibited:
        </p>

        <ul className="prohibitedList">
          <li>Sending unsolicited commercial email (spam)</li>
          <li>Email harvesting or scraping without consent</li>
          <li>Using purchased or rented email lists without proper consent</li>
          <li>Sending fraudulent or deceptive content</li>
          <li>Impersonating other individuals or organizations</li>
          <li>Violating intellectual property rights</li>
          <li>Distributing malware, viruses, or harmful content</li>
          <li>Engaging in phishing or social engineering attacks</li>
          <li>Exceeding rate limits or abusing API resources</li>
          <li>Attempting to circumvent security measures</li>
        </ul>

        <p className="warning">
          Violation of this policy may result in immediate account termination and potential legal action.
        </p>
      </section>

      <section className="panel">
        <h2>Service Level Agreement (SLA)</h2>
        <p>
          We strive to provide reliable and high-quality service. Our commitment includes:
        </p>

        <ul>
          <li><strong>Uptime:</strong> We aim for 99.5% monthly uptime for our core services</li>
          <li><strong>Response Time:</strong> API responses typically under 500ms</li>
          <li><strong>Support:</strong> Email support responses within 24 business hours</li>
          <li><strong>Data Security:</strong> Industry-standard encryption and security practices</li>
          <li><strong>Backups:</strong> Regular data backups with disaster recovery procedures</li>
        </ul>

        <p className="subtle">
          This SLA is provided for informational purposes and does not constitute a legally binding guarantee. For enterprise agreements with specific SLA commitments, please contact our sales team.
        </p>
      </section>

      <section className="panel">
        <h2>Contact & Support</h2>
        <p>
          If you have questions about our policies or need assistance with compliance:
        </p>

        <div className="contactInfo">
          <div>
            <strong>General Support:</strong><br />
            <a href="mailto:support@scoutool.com">support@scoutool.com</a>
          </div>
          <div>
            <strong>Privacy Inquiries:</strong><br />
            <a href="mailto:privacy@scoutool.com">privacy@scoutool.com</a>
          </div>
          <div>
            <strong>Legal Inquiries:</strong><br />
            <a href="mailto:legal@scoutool.com">legal@scoutool.com</a>
          </div>
          <div>
            <strong>Website:</strong><br />
            <a href="https://scoutool.com" target="_blank" rel="noopener noreferrer">https://scoutool.com</a>
          </div>
        </div>
      </section>

      <footer>
        <div className="footerLinks">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/policies">Policies</Link>
        </div>
        <div className="footerText">
          Scoutool Batch · Legal policies and guidelines
        </div>
      </footer>
    </main>
  );
}
