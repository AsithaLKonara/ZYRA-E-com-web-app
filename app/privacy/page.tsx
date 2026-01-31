'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Eye, Lock, Database, UserCheck, Globe } from 'lucide-react'

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: 'Information We Collect',
      icon: Database,
      content: `
        We collect information you provide directly to us, such as when you create an account, 
        make a purchase, or contact us for support. This may include:
        
        • Personal information (name, email address, phone number)
        • Billing and shipping addresses
        • Payment information (processed securely through our payment partners)
        • Account preferences and settings
        • Communication preferences
      `,
    },
    {
      title: 'How We Use Your Information',
      icon: Eye,
      content: `
        We use the information we collect to:
        
        • Process and fulfill your orders
        • Provide customer support
        • Send you important updates about your orders
        • Improve our products and services
        • Personalize your shopping experience
        • Send marketing communications (with your consent)
        • Prevent fraud and ensure security
        • Comply with legal obligations
      `,
    },
    {
      title: 'Information Sharing',
      icon: Globe,
      content: `
        We do not sell, trade, or rent your personal information to third parties. We may 
        share your information only in the following circumstances:
        
        • With service providers who assist us in operating our business
        • With shipping carriers to deliver your orders
        • With payment processors to process your payments
        • When required by law or to protect our rights
        • In connection with a business transfer or merger
      `,
    },
    {
      title: 'Data Security',
      icon: Lock,
      content: `
        We implement appropriate security measures to protect your personal information:
        
        • Encryption of sensitive data in transit and at rest
        • Secure payment processing through industry-standard protocols
        • Regular security audits and updates
        • Access controls and authentication measures
        • Employee training on data protection
      `,
    },
    {
      title: 'Your Rights',
      icon: UserCheck,
      content: `
        You have certain rights regarding your personal information:
        
        • Access: Request a copy of your personal information
        • Correction: Update or correct your information
        • Deletion: Request deletion of your information
        • Portability: Export your data in a portable format
        • Opt-out: Unsubscribe from marketing communications
        • Restriction: Limit how we use your information
      `,
    },
    {
      title: 'Cookies and Tracking',
      icon: Shield,
      content: `
        We use cookies and similar technologies to:
        
        • Remember your preferences and settings
        • Analyze website traffic and usage patterns
        • Provide personalized content and recommendations
        • Improve website performance and functionality
        • Enable social media features
        
        You can control cookie settings through your browser preferences.
      `,
    },
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Introduction</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              At ZYRA Fashion, we are committed to protecting your privacy and ensuring the 
              security of your personal information. This Privacy Policy explains how we 
              collect, use, disclose, and safeguard your information when you use our website 
              and services.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              By using our services, you agree to the collection and use of information in 
              accordance with this policy. If you have any questions about this Privacy Policy, 
              please contact us at privacy@zyra-ultra.com.
            </p>
          </CardContent>
        </Card>

        {/* Policy Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <section.icon className="h-5 w-5 text-blue-500" />
                  <span>{section.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {section.content.split('\n').map((line, lineIndex) => (
                    <p key={lineIndex} className="text-gray-600 leading-relaxed">
                      {line.trim()}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Data Retention */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              We retain your personal information for as long as necessary to fulfill the 
              purposes outlined in this Privacy Policy, unless a longer retention period is 
              required or permitted by law. When we no longer need your information, we will 
              securely delete or anonymize it.
            </p>
          </CardContent>
        </Card>

        {/* International Transfers */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>International Data Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              Your information may be transferred to and processed in countries other than 
              your own. We ensure that such transfers comply with applicable data protection 
              laws and implement appropriate safeguards to protect your information.
            </p>
          </CardContent>
        </Card>

        {/* Children's Privacy */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              Our services are not intended for children under 13 years of age. We do not 
              knowingly collect personal information from children under 13. If we become 
              aware that we have collected personal information from a child under 13, we will 
              take steps to delete such information.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Policy */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Changes to This Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any 
              changes by posting the new Privacy Policy on this page and updating the "Last 
              updated" date. We encourage you to review this Privacy Policy periodically for 
              any changes.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, 
              please contact us at:
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-gray-600">
                <strong>Email:</strong> privacy@zyra-ultra.com
              </p>
              <p className="text-gray-600">
                <strong>Phone:</strong> +1 (555) 123-4567
              </p>
              <p className="text-gray-600">
                <strong>Address:</strong> 123 Commerce Street, Business District, New York, NY 10001
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}




