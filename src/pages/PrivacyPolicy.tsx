import React from 'react';
import '../styles/shared-theme.css';
import './PrivacyPolicy.css';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="privacy-policy-container">
      <div className="shared-container">
        <div className="shared-card">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section>
          <h2>1. Contact Information</h2>
          <p>
            Car Customer Connect is operated by Car Customer Connect. If you have any questions about this Privacy Policy, 
            please contact us at:
          </p>
          <div className="contact-info">
            <p><strong>Email:</strong> chris.ai.vids@outlook.com</p>
            <p><strong>Address:</strong> 1025 River Rd, Fulton, CA, 95439</p>
            <p><strong>Phone:</strong> 707-972-6402</p>
          </div>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <p>We collect the following types of personal information:</p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, phone number, and dealership information</li>
            <li><strong>Vehicle Data:</strong> Vehicle information, inventory details, and service records</li>
            <li><strong>Social Media Data:</strong> When you connect your Facebook account, we may access your Facebook Page information, including page details and posting permissions</li>
            <li><strong>Usage Data:</strong> Information about how you use our application, including features accessed and actions taken</li>
            <li><strong>Technical Data:</strong> IP address, browser type, device information, and cookies</li>
            <li><strong>Communication Data:</strong> Messages, support requests, and feedback you provide</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use your personal information for the following purposes:</p>
          <ul>
            <li>To provide and maintain our car dealership management services</li>
            <li>To enable social media posting functionality through Facebook integration</li>
            <li>To generate AI-powered content and captions for your social media posts</li>
            <li>To manage your vehicle inventory and workflow processes</li>
            <li>To provide customer support and respond to your inquiries</li>
            <li>To improve our services and develop new features</li>
            <li>To comply with legal obligations and protect our rights</li>
            <li>To send you important updates about our services</li>
          </ul>
        </section>

        <section>
          <h2>4. Information Sharing and Third Parties</h2>
          <p>We may share your information with the following third parties:</p>
          <ul>
            <li><strong>Facebook:</strong> When you use our Facebook integration features, we share necessary data with Facebook to enable posting and page management functionality</li>
            <li><strong>Service Providers:</strong> We work with trusted service providers who assist us in operating our application, including cloud hosting, analytics, and customer support</li>
            <li><strong>Legal Requirements:</strong> We may disclose your information if required by law, court order, or government request</li>
            <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred</li>
          </ul>
          <p><strong>We do not sell your personal information to third parties.</strong></p>
        </section>

        <section>
          <h2>5. Legal Basis for Processing</h2>
          <p>We process your personal information based on the following legal grounds:</p>
          <ul>
            <li><strong>Contract Performance:</strong> To provide the services you've requested</li>
            <li><strong>Legitimate Interests:</strong> To improve our services, ensure security, and provide customer support</li>
            <li><strong>Consent:</strong> When you've given explicit consent for specific processing activities</li>
            <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
          </ul>
        </section>

        <section>
          <h2>6. Data Retention and Storage</h2>
          <p>
            We retain your personal information for as long as necessary to provide our services and fulfill the purposes 
            outlined in this Privacy Policy. Specifically:
          </p>
          <ul>
            <li>Account information is retained while your account is active and for 3 years after account closure</li>
            <li>Vehicle and inventory data is retained for business record-keeping purposes</li>
            <li>Social media integration data is retained while the integration is active</li>
            <li>Usage and technical data may be retained for up to 2 years for analytics and improvement purposes</li>
          </ul>
          <p>
            Your data is stored securely using industry-standard encryption and security measures. We use Supabase 
            for data storage, which provides enterprise-grade security and compliance.
          </p>
        </section>

        <section>
          <h2>7. Your Rights Over Your Data</h2>
          <p>You have the following rights regarding your personal information:</p>
          <ul>
            <li><strong>Access:</strong> You can request a copy of the personal information we hold about you</li>
            <li><strong>Rectification:</strong> You can request that we correct any inaccurate or incomplete information</li>
            <li><strong>Erasure:</strong> You can request that we delete your personal information</li>
            <li><strong>Portability:</strong> You can request a copy of your data in a machine-readable format</li>
            <li><strong>Restriction:</strong> You can request that we limit how we process your information</li>
            <li><strong>Objection:</strong> You can object to certain types of processing</li>
            <li><strong>Withdraw Consent:</strong> You can withdraw consent for processing based on consent</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at privacy@carcustomerconnect.com or use our 
            <a href="/data-deletion" className="privacy-link">Data Deletion Request</a> page.
          </p>
        </section>

        <section>
          <h2>8. Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to enhance your experience and analyze usage patterns. 
            This includes:
          </p>
          <ul>
            <li>Essential cookies for application functionality</li>
            <li>Analytics cookies to understand how you use our services</li>
            <li>Facebook cookies and pixels when you use Facebook integration features</li>
          </ul>
          <p>
            You can control cookie settings through your browser preferences. Note that disabling certain cookies 
            may affect the functionality of our application.
          </p>
        </section>

        <section>
          <h2>9. Advertising and Marketing</h2>
          <p>
            We may use your information for marketing purposes, including sending you updates about new features 
            and services. You can opt-out of marketing communications at any time by:
          </p>
          <ul>
            <li>Clicking the unsubscribe link in our emails</li>
            <li>Contacting us directly at privacy@carcustomerconnect.com</li>
            <li>Adjusting your account settings</li>
          </ul>
          <p>
            For personalized advertising through Facebook and other platforms, you can opt-out through:
          </p>
          <ul>
            <li>Facebook Ad Preferences: <a href="https://www.facebook.com/ads/preferences" target="_blank" rel="noopener noreferrer">https://www.facebook.com/ads/preferences</a></li>
            <li>Your browser's privacy settings</li>
            <li>Industry opt-out tools like the Digital Advertising Alliance</li>
          </ul>
        </section>

        <section>
          <h2>10. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your own. We ensure that 
            such transfers are conducted in accordance with applicable data protection laws and with appropriate 
            safeguards in place.
          </p>
        </section>

        <section>
          <h2>11. Children's Privacy</h2>
          <p>
            Our services are not intended for children under 13 years of age. We do not knowingly collect personal 
            information from children under 13. If we become aware that we have collected such information, we will 
            take steps to delete it promptly.
          </p>
        </section>

        <section>
          <h2>12. Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information 
            against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission 
            over the internet or electronic storage is 100% secure.
          </p>
        </section>

        <section>
          <h2>13. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by 
            posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use 
            of our services after any changes constitutes acceptance of the updated Privacy Policy.
          </p>
        </section>

        <section>
          <h2>14. Facebook-Specific Information</h2>
          <p>
            When you connect your Facebook account to our application:
          </p>
          <ul>
            <li>We access your Facebook Page information to enable posting functionality</li>
            <li>We may store Facebook Page IDs and access tokens securely</li>
            <li>We comply with Facebook's Platform Policy and Data Policy</li>
            <li>You can disconnect your Facebook account at any time through your account settings</li>
            <li>Disconnecting will remove our access to your Facebook data</li>
          </ul>
          <p>
            For more information about Facebook's data practices, please review 
            <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer">Facebook's Privacy Policy</a>.
          </p>
        </section>

        <div className="contact-section">
          <h2>Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or our data practices, please contact us at:
          </p>
          <div className="contact-info">
            <p><strong>Business:</strong> Car Customer Connect</p>
            <p><strong>Email:</strong> chris.ai.vids@outlook.com</p>
            <p><strong>Phone:</strong> 707-972-6402</p>
            <p><strong>Address:</strong> 1025 River Rd, Fulton, CA, 95439</p>
            <p><strong>Subject Line:</strong> Privacy Policy Inquiry</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
