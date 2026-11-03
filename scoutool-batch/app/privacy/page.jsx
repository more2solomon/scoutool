import Link from "next/link";

export default function PrivacyPage() {
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
              Privacy Policy
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

      <section className="panel legalContent">
        <p className="lastUpdated">Last updated: November 1, 2026</p>

        <h2>1. Introduction</h2>
        <p>
          Scoutool Batch ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our email automation service.
        </p>

        <h2>2. Information We Collect</h2>
        
        <h3>2.1 Information You Provide</h3>
        <ul>
          <li><strong>Account Information:</strong> Name, email address, and other registration details</li>
          <li><strong>Email Lists:</strong> Email addresses and contact information you upload for campaigns</li>
          <li><strong>Email Content:</strong> Subject lines, message bodies, and templates you create</li>
          <li><strong>Gmail Credentials:</strong> OAuth tokens for Gmail integration (stored securely)</li>
          <li><strong>Scraping Data:</strong> URLs you provide for email scraping</li>
        </ul>

        <h3>2.2 Automatically Collected Information</h3>
        <ul>
          <li><strong>Usage Data:</strong> Pages visited, features used, time spent, and actions taken</li>
          <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers</li>
          <li><strong>Log Data:</strong> IP address, access times, and referral sources</li>
        </ul>

        <h3>2.3 Third-Party Information</h3>
        <ul>
          <li><strong>Google Data:</strong> When you connect Gmail, we receive access tokens per Google's OAuth scope</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <p>We use your information for the following purposes:</p>
        <ul>
          <li><strong>Service Provision:</strong> To provide, maintain, and improve our email automation features</li>
          <li><strong>Email Campaigns:</strong> To generate Gmail links, create drafts, and send emails on your behalf</li>
          <li><strong>Account Management:</strong> To authenticate users and manage account settings</li>
          <li><strong>Communication:</strong> To send service updates, security alerts, and support communications</li>
          <li><strong>Analytics:</strong> To analyze usage patterns and improve the Service</li>
          <li><strong>Security:</strong> To detect fraud, abuse, and security threats</li>
          <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our Terms of Service</li>
        </ul>

        <h2>4. Data Sharing and Disclosure</h2>
        
        <h3>4.1 Third-Party Service Providers</h3>
        <p>We may share your information with trusted third parties who assist us in operating the Service:</p>
        <ul>
          <li><strong>Google:</strong> For Gmail API integration and OAuth authentication</li>
          <li><strong>Upstash Redis:</strong> For data storage and queue management</li>
          <li><strong>Vercel:</strong> For hosting and infrastructure services</li>
        </ul>

        <h3>4.2 Legal Requirements</h3>
        <p>We may disclose your information when required by law or to protect our rights:</p>
        <ul>
          <li>To comply with legal processes, court orders, or government requests</li>
          <li>To protect our rights, property, or safety, or that of our users</li>
          <li>To investigate and prevent fraud, security threats, or illegal activity</li>
        </ul>

        <h3>4.3 Business Transfers</h3>
        <p>
          In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
        </p>

        <h2>5. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your information:
        </p>
        <ul>
          <li><strong>Encryption:</strong> Data is encrypted in transit and at rest where applicable</li>
          <li><strong>Access Controls:</strong> Strict access controls limit who can access your data</li>
          <li><strong>Secure Storage:</strong> OAuth tokens and sensitive data are stored securely using industry-standard practices</li>
          <li><strong>Regular Audits:</strong> We conduct regular security reviews and updates</li>
        </ul>
        <p>
          However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
        </p>

        <h2>6. Data Retention</h2>
        <p>
          We retain your information for as long as necessary to provide the Service and fulfill the purposes outlined in this policy:
        </p>
        <ul>
          <li><strong>Account Data:</strong> Retained while your account is active</li>
          <li><strong>Email Lists:</strong> Retained until you delete them or close your account</li>
          <li><strong>Campaign Data:</strong> Retained for reporting and analytics purposes</li>
          <li><strong>OAuth Tokens:</strong> Retained until you revoke access or close your account</li>
        </ul>
        <p>
          You may request deletion of your data at any time by contacting us or using account deletion features.
        </p>

        <h2>7. Your Privacy Rights</h2>
        <p>Depending on your location, you may have the following rights:</p>
        <ul>
          <li><strong>Access:</strong> Request access to your personal information</li>
          <li><strong>Correction:</strong> Request correction of inaccurate information</li>
          <li><strong>Deletion:</strong> Request deletion of your personal information</li>
          <li><strong>Portability:</strong> Request transfer of your data to another service</li>
          <li><strong>Objection:</strong> Object to processing of your information</li>
          <li><strong>Restriction:</strong> Request restriction of data processing</li>
        </ul>
        <p>
          To exercise these rights, please contact us at support@scoutool.com.
        </p>

        <h2>8. Google Integration</h2>
        <p>
          When you connect your Gmail account, we use OAuth 2.0 for authentication. We request the following scopes:
        </p>
        <ul>
          <li><strong>Gmail API:</strong> To create drafts and send emails on your behalf</li>
          <li><strong>Profile Information:</strong> To display your email address and account status</li>
        </ul>
        <p>
          We do not store your Gmail password. We only store OAuth tokens which you can revoke at any time through your Google Account settings.
        </p>

        <h2>9. Email Scraping</h2>
        <p>
          When you use our email scraping feature:
        </p>
        <ul>
          <li>We only scrape publicly available information from websites you provide</li>
          <li>We do not scrape behind login walls or protected areas</li>
          <li>You are responsible for ensuring you have the right to scrape the provided URLs</li>
          <li>Scraped email addresses are stored securely and used only for your campaigns</li>
        </ul>

        <h2>10. Children's Privacy</h2>
        <p>
          The Service is not intended for children under the age of 13. We do not knowingly collect personal information from children. If we become aware of such collection, we will take steps to delete it.
        </p>

        <h2>11. International Data Transfers</h2>
        <p>
          Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
        </p>

        <h2>12. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify users of material changes by posting the new policy on the Service and updating the "Last updated" date. Your continued use of the Service after such changes constitutes acceptance of the new policy.
        </p>

        <h2>13. California Privacy Rights (CCPA)</h2>
        <p>
          If you are a California resident, you have specific rights regarding your personal information:
        </p>
        <ul>
          <li>Right to know what personal information is collected</li>
          <li>Right to know if personal information is sold or disclosed</li>
          <li>Right to delete personal information</li>
          <li>Right to non-discrimination for exercising privacy rights</li>
        </ul>
        <p>
          To exercise these rights, please contact us at support@scoutool.com.
        </p>

        <h2>14. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy or our data practices, please contact us:
        </p>
        <p>
          <strong>Email:</strong> privacy@scoutool.com<br />
          <strong>Website:</strong> https://scoutool.com<br />
          <strong>Address:</strong> [Your Business Address]
        </p>
      </section>

      <footer>
        <div className="footerLinks">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/policies">Policies</Link>
        </div>
        <div className="footerText">
          Scoutool Batch · Privacy and data protection
        </div>
      </footer>
    </main>
  );
}
