'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Target, Award, Heart, ShoppingBag, Shield, Truck, Headphones } from 'lucide-react'

export default function AboutPage() {
  const stats = [
    { label: 'Happy Customers', value: '10,000+', icon: Users },
    { label: 'Products Sold', value: '50,000+', icon: ShoppingBag },
    { label: 'Years of Experience', value: '5+', icon: Award },
    { label: 'Countries Served', value: '25+', icon: Target },
  ]

  const values = [
    {
      title: 'Quality First',
      description: 'We carefully curate every product to ensure the highest quality standards.',
      icon: Award,
    },
    {
      title: 'Customer Care',
      description: 'Our dedicated support team is here to help you every step of the way.',
      icon: Heart,
    },
    {
      title: 'Secure Shopping',
      description: 'Your personal and payment information is protected with industry-leading security.',
      icon: Shield,
    },
    {
      title: 'Fast Delivery',
      description: 'Quick and reliable shipping to get your orders to you as fast as possible.',
      icon: Truck,
    },
  ]

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      image: '/team/sarah.jpg',
      bio: 'Passionate about creating the best online shopping experience.',
    },
    {
      name: 'Michael Chen',
      role: 'CTO',
      image: '/team/michael.jpg',
      bio: 'Leading our technical innovation and platform development.',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Head of Customer Experience',
      image: '/team/emily.jpg',
      bio: 'Ensuring every customer has an amazing experience with us.',
    },
    {
      name: 'David Kim',
      role: 'Head of Operations',
      image: '/team/david.jpg',
      bio: 'Managing our supply chain and logistics operations.',
    },
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">About ZYRA Fashion</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're passionate about providing the best online shopping experience with 
            high-quality products, exceptional customer service, and innovative technology.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <stat.icon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Story Section */}
        <div className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Our Story</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-600 leading-relaxed">
                ZYRA Fashion was founded in 2019 with a simple mission: to make online shopping 
                more enjoyable, convenient, and accessible for everyone. What started as a small 
                team of passionate individuals has grown into a thriving e-commerce platform 
                serving customers worldwide.
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                We believe that shopping should be an experience, not just a transaction. That's 
                why we've invested heavily in technology, customer service, and product quality 
                to create a platform that our customers love to use.
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                Today, we're proud to offer thousands of carefully curated products, fast and 
                reliable shipping, and award-winning customer service. But we're not stopping 
                here - we're constantly innovating and improving to make your shopping experience 
                even better.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <value.icon className="h-6 w-6 text-blue-500 mt-1" />
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                      <p className="text-gray-600">{value.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <p className="text-blue-500 mb-2">{member.role}</p>
                  <p className="text-sm text-gray-600">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mission Section */}
        <div className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed text-lg">
                To revolutionize online shopping by providing an unparalleled experience that 
                combines the best products, cutting-edge technology, and exceptional customer 
                service. We're committed to making shopping more convenient, enjoyable, and 
                accessible for everyone, everywhere.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card>
            <CardContent className="pt-8">
              <h2 className="text-2xl font-bold mb-4">Ready to Experience the Difference?</h2>
              <p className="text-gray-600 mb-6">
                Join thousands of satisfied customers and discover why ZYRA Fashion is the 
                preferred choice for online shopping.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Start Shopping
                </Button>
                <Button variant="outline" size="lg">
                  <Headphones className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}




