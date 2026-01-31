'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Scale, Shield, CreditCard, Truck, RotateCcw } from 'lucide-react'

export default function TermsOfServicePage() {
  const sections = [
    {
      title: 'Acceptance of Terms',
      icon: FileText,
      content: `
        By accessing and using ZYRA Fashion's website and services, you accept and agree to be 
        bound by the terms and provision of this agreement. If you do not agree to abide by the 
        above, please do not use this service.
      `,
    },
    {
      title: 'Use License',
      icon: Scale,
      content: `
        Permission is granted to temporarily download one copy of the materials on ZYRA Fashion's 
        website for personal, non-commercial transitory viewing only. This is the grant of a license, 
        not a transfer of title, and under this license you may not:
        
        • Modify or copy the materials
        • Use the materials for any commercial purpose or for any public display
        • Attempt to reverse engineer any software contained on the website
        • Remove any copyright or other proprietary notations from the materials
      `,
    },
    {
      title: 'Product Information',
      icon: Shield,
      content: `
        We strive to provide accurate product descriptions and images. However, we do not warrant 
        that product descriptions or other content is accurate, complete, reliable, current, or 
        error-free. If a product offered by us is not as described, your sole remedy is to return 
        it in unused condition.
      `,
    },
    {
      title: 'Pricing and Payment',
      icon: CreditCard,
      content: `
        All prices are subject to change without notice. We reserve the right to modify prices at 
        any time. Payment must be received by us before shipment of your order. We accept various 
        payment methods as indicated on our website. You are responsible for all applicable taxes.
      `,
    },
    {
      title: 'Shipping and Delivery',
      icon: Truck,
      content: `
        We will make every effort to ship your order within the time frame specified. However, 
        delivery times may vary due to factors beyond our control. We are not responsible for 
        delays caused by shipping carriers, weather conditions, or other circumstances.
      `,
    },
    {
      title: 'Returns and Refunds',
      icon: RotateCcw,
      content: `
        We offer a 30-day return policy for most items. Items must be returned in original 
        condition with tags attached. Some items may be subject to restocking fees. Refunds will 
        be processed to the original payment method within 5-10 business days after we receive 
        the returned item.
      `,
    },
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
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
              Welcome to ZYRA Fashion. These Terms of Service ("Terms") govern your use of our 
              website and services. By using our services, you agree to these terms and conditions.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              Please read these Terms carefully before using our services. If you do not agree to 
              these Terms, please do not use our services.
            </p>
          </CardContent>
        </Card>

        {/* Terms Sections */}
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

        {/* User Accounts */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>User Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              When you create an account with us, you must provide accurate and complete information. 
              You are responsible for maintaining the confidentiality of your account and password. 
              You agree to accept responsibility for all activities that occur under your account.
            </p>
          </CardContent>
        </Card>

        {/* Prohibited Uses */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Prohibited Uses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed mb-4">
              You may not use our services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
              <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
              <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
              <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
              <li>To submit false or misleading information</li>
              <li>To upload or transmit viruses or any other type of malicious code</li>
              <li>To collect or track the personal information of others</li>
              <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
              <li>For any obscene or immoral purpose</li>
              <li>To interfere with or circumvent the security features of our services</li>
            </ul>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              In no event shall ZYRA Fashion, nor its directors, employees, partners, agents, 
              suppliers, or affiliates, be liable for any indirect, incidental, special, 
              consequential, or punitive damages, including without limitation, loss of profits, 
              data, use, goodwill, or other intangible losses, resulting from your use of our services.
            </p>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Disclaimer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              The information on this website is provided on an "as is" basis. To the fullest extent 
              permitted by law, ZYRA Fashion excludes all representations, warranties, conditions 
              and terms relating to our website and the use of this website.
            </p>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Governing Law</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              These Terms shall be interpreted and governed by the laws of the State of New York, 
              without regard to its conflict of law provisions. Our failure to enforce any right 
              or provision of these Terms will not be considered a waiver of those rights.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Terms */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any 
              time. If a revision is material, we will try to provide at least 30 days notice prior 
              to any new terms taking effect.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-gray-600">
                <strong>Email:</strong> legal@zyra-ultra.com
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




