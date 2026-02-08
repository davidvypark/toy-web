import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | TOY',
  description: 'Privacy Policy for TOY - Thinking Of You',
}

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-toy-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/" className="text-toy-text-secondary text-sm hover:underline">
          &larr; Back to TOY
        </Link>

        <h1 className="mt-8 text-4xl text-toy-text">Privacy Policy</h1>
        <p className="mt-2 text-toy-text-secondary">Effective Date: February 7, 2025</p>

        <div className="mt-10 space-y-8 text-toy-text leading-relaxed">
          <section>
            <h2 className="text-2xl text-toy-text mb-3">1. Introduction</h2>
            <p>
              Day One Foundry LLC (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
              operates the TOY (&ldquo;Thinking Of You&rdquo;) mobile application, the website at sendtoycard.com, and
              all related services (collectively, the &ldquo;Service&rdquo;). This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you use our Service.
            </p>
            <p className="mt-3">
              Please read this Privacy Policy carefully. By using the Service, you agree to the collection and use of
              information in accordance with this policy. If you do not agree with the terms of this Privacy Policy,
              please do not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">2. Information We Collect</h2>

            <h3 className="text-xl text-toy-text mt-4 mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account Information:</strong> When you create an account, we may collect your name, email
                address, and other information you provide during registration.
              </li>
              <li>
                <strong>User Content:</strong> When you use the Service, you may upload videos, images, text, and other
                content as part of creating and sharing video greeting cards. This content is stored on our servers to
                provide the Service.
              </li>
              <li>
                <strong>Communications:</strong> If you contact us directly, we may receive additional information about
                you, such as your name, email address, and the contents of your message.
              </li>
            </ul>

            <h3 className="text-xl text-toy-text mt-4 mb-2">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Device Information:</strong> We may collect information about the device you use to access the
                Service, including device type, operating system, unique device identifiers, and mobile network
                information.
              </li>
              <li>
                <strong>Usage Data:</strong> We may collect information about how you use the Service, including access
                times, features used, and interactions with the Service.
              </li>
              <li>
                <strong>Crash and Performance Data:</strong> We may collect crash reports and performance data to help us
                improve the stability and performance of the Service.
              </li>
            </ul>

            <h3 className="text-xl text-toy-text mt-4 mb-2">2.3 Payment Information</h3>
            <p>
              If you make purchases through the Service, payment transactions are processed by third-party payment
              processors (such as Apple via the App Store). We do not directly collect or store your payment card
              information. Please refer to the applicable payment processor&rsquo;s privacy policy for information on how
              they handle your payment data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide, operate, and maintain the Service</li>
              <li>Create and manage your account</li>
              <li>Process and deliver your video greeting cards to intended recipients</li>
              <li>Communicate with you, including responding to your inquiries and sending service-related notices</li>
              <li>Monitor and analyze usage and trends to improve the Service</li>
              <li>Detect, prevent, and address technical issues, fraud, or security concerns</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">4. How We Share Your Information</h2>
            <p>We may share your information in the following circumstances:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>With Recipients:</strong> When you share a video greeting card, the content of that card is made
                accessible to the intended recipient via a shareable link.
              </li>
              <li>
                <strong>Service Providers:</strong> We may share your information with third-party vendors and service
                providers that perform services on our behalf, such as hosting, data storage, and analytics. These
                service providers are contractually obligated to use your information only as necessary to provide
                services to us.
              </li>
              <li>
                <strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in
                response to valid requests by public authorities (e.g., a court order or government agency).
              </li>
              <li>
                <strong>Protection of Rights:</strong> We may disclose your information where we believe it is necessary
                to investigate, prevent, or take action regarding potential violations of our Terms of Service, suspected
                fraud, situations involving potential threats to the safety of any person, or as evidence in litigation.
              </li>
              <li>
                <strong>Business Transfers:</strong> If Day One Foundry LLC is involved in a merger, acquisition, or
                sale of all or a portion of its assets, your information may be transferred as part of that transaction.
                We will notify you via email and/or a prominent notice on our Service of any change in ownership or uses
                of your information.
              </li>
            </ul>
            <p className="mt-3">
              <strong>We do not sell your personal information to third parties.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">5. Data Storage and Security</h2>
            <p>
              Your information, including User Content such as videos, is stored on secure third-party servers. We
              implement appropriate technical and organizational security measures designed to protect your information
              against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission
              over the Internet or method of electronic storage is 100% secure, and we cannot guarantee absolute
              security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">6. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide you the Service.
              We may also retain and use your information as necessary to comply with our legal obligations, resolve
              disputes, and enforce our agreements. If you delete your account, we will make reasonable efforts to delete
              your information, though some information may be retained as required by law or for legitimate business
              purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">7. Children&rsquo;s Privacy</h2>
            <p>
              The Service is not intended for children under the age of 13. We do not knowingly collect personal
              information from children under 13. If we become aware that we have collected personal information from a
              child under 13 without verification of parental consent, we will take steps to remove that information
              from our servers. If you believe that we might have any information from or about a child under 13, please
              contact us at{' '}
              <a href="mailto:support@sendtoycard.com" className="underline hover:text-toy-text-secondary">
                support@sendtoycard.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">8. Your Rights and Choices</h2>

            <h3 className="text-xl text-toy-text mt-4 mb-2">8.1 Access and Correction</h3>
            <p>
              You may access and update certain account information by logging into your account. If you need to access,
              correct, or delete other personal information we hold about you, please contact us at{' '}
              <a href="mailto:support@sendtoycard.com" className="underline hover:text-toy-text-secondary">
                support@sendtoycard.com
              </a>
              .
            </p>

            <h3 className="text-xl text-toy-text mt-4 mb-2">8.2 Account Deletion</h3>
            <p>
              You may request deletion of your account and associated personal information by contacting us. Upon
              receiving your request, we will delete or anonymize your information unless we are required to retain it
              for legal or legitimate business purposes.
            </p>

            <h3 className="text-xl text-toy-text mt-4 mb-2">8.3 Communications</h3>
            <p>
              You may opt out of receiving promotional communications from us by following the unsubscribe instructions
              in those messages. Even if you opt out, we may still send you non-promotional communications, such as
              those about your account or our ongoing business relations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">9. California Privacy Rights</h2>
            <p>
              If you are a California resident, you may have additional rights under the California Consumer Privacy Act
              (CCPA) and the California Privacy Rights Act (CPRA), including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>The right to know what personal information we collect, use, disclose, and sell</li>
              <li>The right to request deletion of your personal information</li>
              <li>The right to opt out of the sale of your personal information (we do not sell your personal information)</li>
              <li>The right to non-discrimination for exercising your privacy rights</li>
              <li>The right to correct inaccurate personal information</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us at{' '}
              <a href="mailto:support@sendtoycard.com" className="underline hover:text-toy-text-secondary">
                support@sendtoycard.com
              </a>
              . We will respond to your request within the timeframes required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">10. Third-Party Links and Services</h2>
            <p>
              The Service may contain links to third-party websites or services that are not owned or controlled by Day
              One Foundry LLC. We have no control over, and assume no responsibility for, the content, privacy policies,
              or practices of any third-party websites or services. We encourage you to review the privacy policies of
              any third-party websites or services that you visit.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">11. International Data Transfers</h2>
            <p>
              Your information may be transferred to, and maintained on, servers located outside of your state, province,
              country, or other governmental jurisdiction where the data protection laws may differ from those in your
              jurisdiction. By using the Service, you consent to the transfer of your information to such locations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page and updating the &ldquo;Effective Date&rdquo; at the top. You are advised to
              review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when
              they are posted on this page. Your continued use of the Service after any modifications indicates your
              acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-toy-text mb-3">13. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or our data practices, please contact us
              at:{' '}
              <a href="mailto:support@sendtoycard.com" className="underline hover:text-toy-text-secondary">
                support@sendtoycard.com
              </a>
            </p>
            <p className="mt-3">
              Day One Foundry LLC<br />
              California, United States
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
