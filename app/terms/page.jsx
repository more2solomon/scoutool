import Link from "next/link";

export default function TermsPage() {
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
              Terms of Service
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

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using Scoutool Batch ("the Service"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use the Service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          Scoutool Batch is an email automation tool that provides:
        </p>
        <ul>
          <li>Smart Gmail link generation for batch email campaigns</li>
          <li>Email address scraping from websites</li>
          <li>Gmail draft creation and management</li>
          <li>Automated email sending capabilities</li>
        </ul>

        <h2>3. User Responsibilities</h2>
        <p>
          As a user of the Service, you agree to:
        </p>
        <ul>
          <li>Use the Service only for lawful purposes and in accordance with these Terms</li>
          <li>Comply with all applicable laws and regulations, including anti-spam laws (CAN-SPAM, GDPR, etc.)</li>
          <li>Obtain proper consent before sending marketing emails to recipients</li>
          <li>Provide accurate and truthful information when using the Service</li>
          <li>Maintain the security of your account credentials</li>
          <li>Not use the Service to harass, abuse, or send unsolicited commercial email</li>
        </ul>

        <h2>4. Email Compliance</h2>
        <p>
          Users are solely responsible for ensuring their email communications comply with applicable laws and regulations, including but not limited to:
        </p>
        <ul>
          <li>The CAN-SPAM Act (United States)</li>
          <li>General Data Protection Regulation (GDPR) (European Union)</li>
          <li>California Consumer Privacy Act (CCPA) (California)</li>
          <li>Other international email marketing laws</li>
        </ul>
        <p>
          This includes providing clear opt-out mechanisms, accurate header information, and truthful subject lines.
        </p>

        <h2>5. Prohibited Uses</h2>
        <p>
          You may not use the Service to:
        </p>
        <ul>
          <li>Send spam or unsolicited commercial email</li>
          <li>Harvest email addresses without consent</li>
          <li>Violate any third-party rights, including intellectual property rights</li>
          <li>Transmit viruses, malware, or harmful code</li>
          <li>Impersonate any person or entity</li>
          <li>Interfere with or disrupt the Service or servers</li>
          <li>Attempt to gain unauthorized access to the Service</li>
        </ul>

        <h2>6. Intellectual Property</h2>
        <p>
          The Service and its original content, features, and functionality are owned by Scoutool and are protected by international copyright, trademark, and other intellectual property laws. You may not reproduce, modify, or distribute any part of the Service without express written permission.
        </p>

        <h2>7. User Data</h2>
        <p>
          You retain ownership of any data you provide to the Service. However, you grant Scoutool a license to use, process, and store your data solely for the purpose of providing the Service. Please refer to our Privacy Policy for details on data handling.
        </p>

        <h2>8. Third-Party Services</h2>
        <p>
          The Service integrates with third-party services, including Google (Gmail API). Your use of these integrations is subject to the terms and policies of those third parties. Scoutool is not responsible for the actions or policies of third-party services.
        </p>

        <h2>9. Disclaimer of Warranties</h2>
        <p>
          The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. Scoutool disclaims all warranties, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.
        </p>

        <h2>10. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, Scoutool shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
        </p>

        <h2>11. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless Scoutool and its affiliates, officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.
        </p>

        <h2>12. Termination</h2>
        <p>
          Scoutool reserves the right to terminate or suspend your access to the Service at any time, with or without cause, with or without notice. Upon termination, your right to use the Service will immediately cease.
        </p>

        <h2>13. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Scoutool is established, without regard to its conflict of law provisions.
        </p>

        <h2>14. Changes to Terms</h2>
        <p>
          Scoutool reserves the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on the Service. Your continued use of the Service after such modifications constitutes your acceptance of the new Terms.
        </p>

        <h2>15. Contact Information</h2>
        <p>
          If you have questions about these Terms, please contact us at:
        </p>
        <p>
          <strong>Email:</strong> support@scoutool.com<br />
          <strong>Website:</strong> https://scoutool.com
        </p>
      </section>

      <footer>
        <div className="footerLinks">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/policies">Policies</Link>
        </div>
        <div className="footerText">
          Scoutool Batch · Legal and policy information
        </div>
      </footer>
    </main>
  );
}
