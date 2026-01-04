import { NextRequest, NextResponse } from 'next/server'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'
import { sendEmail } from '@/lib/email-service'
import { validateBody } from '@/lib/api-validation'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Contact form validation schema
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200, 'Subject must be less than 200 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be less than 2000 characters'),
})

// Handle contact form submission
async function contactHandler(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json()

    // Validate input
    const validationResult = contactSchema.safeParse({ name, email, subject, message })
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    // Send email to support team
    const result = await sendEmail({
      to: { email: 'support@neoshop-ultra.com', name: 'Support Team' },
      subject: `Contact Form: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
      text: `
        New Contact Form Submission
        
        Name: ${name}
        Email: ${email}
        Subject: ${subject}
        Message: ${message}
      `,
      replyTo: email,
    })

    if (!result.success) {
      logger.error('Failed to send contact email:', { error: result.error })
      return NextResponse.json(
        { success: false, error: 'Failed to send message. Please try again later.' },
        { status: 500 }
      )
    }

    // Send confirmation email to user
    await sendEmail({
      to: { email, name },
      subject: 'Thank you for contacting NEOSHOP ULTRA',
      html: `
        <h2>Thank you for contacting us!</h2>
        <p>Hello ${name},</p>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p><strong>Your message:</strong></p>
        <p>${message}</p>
        <p>Best regards,<br>NEOSHOP ULTRA Team</p>
      `,
      text: `
        Thank you for contacting us!
        
        Hello ${name},
        
        We have received your message and will get back to you as soon as possible.
        
        Your message: ${message}
        
        Best regards,
        NEOSHOP ULTRA Team
      `,
    })

    logger.info('Contact form submitted', {
      name,
      email,
      subject,
      messageLength: message.length,
    })

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully. We will get back to you soon.',
    })

  } catch (error) {
    logger.error('Contact form error:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to send message. Please try again.' },
      { status: 500 }
    )
  }
}

export const POST = withApiVersioning(withErrorHandler(contactHandler))

