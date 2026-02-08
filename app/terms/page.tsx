import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | TOY',
  description: 'Terms of Service for TOY - Thinking Of You',
}

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-toy-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/" className="text-toy-text-secondary text-sm hover:underline">
          &larr; Back to TOY
        </Link>

        <h1 className="mt-8 text-4xl text-toy-text">Terms of Service</h1>
        <p className="mt-2 text-toy-text-secondary">Effective Date: February 7, 2025</p>

        <div className="mt-10 space-y-8 text-toy-text leading-relaxed">
          <section>
            <h2 className="text-2xl text-toy-text mb-3">1. Acceptance of Terms</h2>
            <p>
              Welcome to TOY (&ldquo;Thinking Of You&rdquo;). These Terms of Service (&ldquo;Terms&rdquo;) govern your
              access to and use of the TOY mobile application, website at sendtoycard.com, and all related services
              (collectively, the &ldquo;Service&rdquo;), operated by Day One Foundry LLC (&ldquo;Company,&rdquo;
              &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), a California limited liability company.
            </p>
            <p className="mt-3">
              By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these
              Terms, you may not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">2. Eligibility</h2>
            <p>
              You must be at least 13 years of age to use the Service. By using the Service, you represent and warrant
              that you are at least 13 years old. If you are under 18, you represent that you have your parent or
              guardian&rsquo;s permission to use the Service. We may, in our sole discretion, refuse to offer the Service
              to any person or entity and change eligibility criteria at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">3. Description of Service</h2>
            <p>
              TOY is a video greeting card platform that allows users to create and share video messages with others.
              Users can create video greeting cards and share them with recipients via shareable links. The Service may
              be accessed through our iOS mobile application and our website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">4. User Accounts</h2>
            <p>
              To use certain features of the Service, you may be required to create an account. You are responsible for
              maintaining the confidentiality of your account credentials and for all activities that occur under your
              account. You agree to provide accurate, current, and complete information during the registration process
              and to update such information to keep it accurate, current, and complete.
            </p>
            <p className="mt-3">
              You agree to notify us immediately of any unauthorized access to or use of your account. We are not
              responsible for any loss or damage arising from your failure to comply with this section.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">5. User Content</h2>
            <p>
              The Service allows you to upload, submit, store, and share content, including videos, images, and text
              (&ldquo;User Content&rdquo;). You retain all ownership rights in your User Content. By uploading or
              sharing User Content through the Service, you grant us a non-exclusive, worldwide, royalty-free,
              sublicensable, and transferable license to use, reproduce, distribute, prepare derivative works of,
              display, and perform your User Content solely in connection with operating, providing, and improving the
              Service.
            </p>
            <p className="mt-3">
              You represent and warrant that you own or have the necessary rights, licenses, consents, and permissions
              to submit your User Content and to grant the license described above. You are solely responsible for your
              User Content and the consequences of posting or publishing it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">6. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Violate any applicable law, regulation, or these Terms</li>
              <li>Upload or share content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable</li>
              <li>Upload or share content that infringes any patent, trademark, trade secret, copyright, or other intellectual property rights of any party</li>
              <li>Upload or share content that contains sexually explicit material involving minors</li>
              <li>Impersonate any person or entity or misrepresent your affiliation with a person or entity</li>
              <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
              <li>Attempt to gain unauthorized access to any part of the Service or any other systems or networks</li>
              <li>Use the Service for any commercial purpose not expressly permitted by us</li>
              <li>Use any automated means, including bots, scrapers, or spiders, to access or use the Service</li>
              <li>Collect or harvest any personally identifiable information from the Service</li>
            </ul>
            <p className="mt-3">
              We reserve the right to remove any User Content and to suspend or terminate your account if we determine,
              in our sole discretion, that you have violated these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">7. Intellectual Property</h2>
            <p>
              The Service, including its design, features, functionality, and all related intellectual property
              (excluding User Content), is and shall remain the exclusive property of Day One Foundry LLC and its
              licensors. The TOY name, logo, and all related names, logos, product and service names, designs, and
              slogans are trademarks of Day One Foundry LLC. You may not use such marks without our prior written
              permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">8. Third-Party Services</h2>
            <p>
              The Service may be available through third-party platforms, including the Apple App Store. Your use of the
              Service through such platforms is subject to the terms and conditions of those platforms in addition to
              these Terms. Any purchases made through the Apple App Store or other third-party platforms are subject to
              the terms and policies of those platforms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">9. Privacy</h2>
            <p>
              Your use of the Service is also governed by our{' '}
              <Link href="/privacy" className="underline hover:text-toy-text-secondary">
                Privacy Policy
              </Link>
              , which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our
              practices regarding the collection, use, and disclosure of your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">10. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY
              KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL
              BE UNINTERRUPTED, SECURE, OR ERROR-FREE, THAT DEFECTS WILL BE CORRECTED, OR THAT THE SERVICE OR THE
              SERVERS THAT MAKE IT AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
            </p>
            <p className="mt-3">
              YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK. NO ADVICE OR INFORMATION, WHETHER ORAL OR WRITTEN, OBTAINED
              FROM US OR THROUGH THE SERVICE, SHALL CREATE ANY WARRANTY NOT EXPRESSLY MADE HEREIN.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">11. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL DAY ONE FOUNDRY LLC, ITS OFFICERS,
              DIRECTORS, MEMBERS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
              OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER
              INTANGIBLE LOSSES, RESULTING FROM (A) YOUR ACCESS TO OR USE OF, OR INABILITY TO ACCESS OR USE, THE
              SERVICE; (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE; (C) ANY CONTENT OBTAINED FROM THE
              SERVICE; AND (D) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT, WHETHER BASED
              ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY, WHETHER OR NOT WE HAVE
              BEEN INFORMED OF THE POSSIBILITY OF SUCH DAMAGE.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">12. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless Day One Foundry LLC, its officers, directors, members,
              employees, and agents, from and against any and all claims, damages, obligations, losses, liabilities,
              costs, or debt, and expenses (including but not limited to attorney&rsquo;s fees) arising from: (a) your
              use of and access to the Service; (b) your violation of any term of these Terms; (c) your violation of any
              third-party right, including without limitation any copyright, property, or privacy right; or (d) any
              claim that your User Content caused damage to a third party.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">13. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service immediately, without prior notice or
              liability, for any reason whatsoever, including without limitation if you breach these Terms. Upon
              termination, your right to use the Service will immediately cease. All provisions of these Terms which by
              their nature should survive termination shall survive termination, including without limitation, ownership
              provisions, warranty disclaimers, indemnity, and limitations of liability.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">14. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of California,
              without regard to its conflict of law provisions. Any dispute arising out of or relating to these Terms or
              the Service shall be resolved exclusively in the state or federal courts located in the State of
              California, and you consent to the personal jurisdiction of such courts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">15. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision
              is material, we will provide at least 30 days&rsquo; notice prior to any new terms taking effect. What
              constitutes a material change will be determined at our sole discretion. By continuing to access or use the
              Service after those revisions become effective, you agree to be bound by the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">16. General</h2>
            <p>
              If any provision of these Terms is held to be invalid or unenforceable, such provision shall be struck and
              the remaining provisions shall be enforced to the fullest extent under law. Our failure to enforce any
              right or provision of these Terms will not be considered a waiver of those rights. These Terms constitute
              the entire agreement between you and Day One Foundry LLC regarding the Service and supersede any prior
              agreements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">17. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:{' '}
              <a href="mailto:support@sendtoycard.com" className="underline hover:text-toy-text-secondary">
                support@sendtoycard.com
              </a>
            </p>
          </section>
        </div>

        <footer className="mt-16 pt-8 border-t border-toy-text/10 text-center">
          <p className="text-sm text-toy-text-secondary">
            &copy; {new Date().getFullYear()} Day One Foundry LLC. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  )
}
