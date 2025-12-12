const nodemailer = require('nodemailer');

const sendMail = async (name, email, message, subject = 'Contact Form Submission', departmentEmail = 'guest-support@homyhive.com') => {
  try {
    // Check if Gmail app password is properly configured
    if (!process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD.includes('@')) {
      console.log('⚠️  Gmail app password not configured properly. Logging email instead:');
      console.log('=== EMAIL WOULD BE SENT ===');
      console.log('From:', name, '<' + process.env.GMAIL_USER + '>');
      console.log('To:', email);
      console.log('Department:', departmentEmail);
      console.log('Subject:', subject);
      console.log('Message:', message);
      console.log('========================');

      // Return success response for testing
      return { messageId: 'console-log-' + Date.now() };
    }

    // Configure transporter
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // your Gmail address from .env
        pass: process.env.GMAIL_APP_PASSWORD // use an app password, not your Gmail password
      }
    });

    // Email options
    let mailOptions = {
      from: `"${name} via HomyHive" <${process.env.GMAIL_USER}>`,
      replyTo: email, // This allows you to reply directly to the sender
      to: email, // Send to the user's email address
      subject: `[${departmentEmail.split('@')[0].toUpperCase()}] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #fe424d 0%, #ff7e5f 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">HomyHive Contact Form</h1>
            <p style="margin: 5px 0 0; opacity: 0.9;">New inquiry received</p>
          </div>

          <!-- Department Badge -->
          <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #fe424d;">
            <strong style="color: #fe424d;">📧 Department: ${departmentEmail}</strong>
          </div>

          <!-- Contact Details -->
          <div style="padding: 20px;">
            <h2 style="color: #fe424d; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Contact Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 10px 0; font-weight: bold; width: 100px;">Name:</td>
                <td style="padding: 10px 0;">${name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 10px 0; font-weight: bold;">Email:</td>
                <td style="padding: 10px 0;"><a href="mailto:${email}" style="color: #fe424d;">${email}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 10px 0; font-weight: bold;">Subject:</td>
                <td style="padding: 10px 0;">${subject}</td>
              </tr>
            </table>
          </div>

          <!-- Message -->
          <div style="padding: 0 20px 20px;">
            <h2 style="color: #fe424d; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Message</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; line-height: 1.6;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <!-- Quick Actions -->
          <div style="background: #f8f9fa; padding: 20px; text-align: center;">
            <p style="margin: 0 0 15px; color: #666;">Quick Actions:</p>
            <a href="mailto:${email}?subject=Re: ${subject}" style="display: inline-block; background: #fe424d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 0 5px;">
              📧 Reply to ${name}
            </a>
            <a href="tel:${email}" style="display: inline-block; background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 0 5px;">
              📞 Call Customer
            </a>
          </div>

          <!-- Footer -->
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">This email was sent from HomyHive contact form</p>
            <p style="margin: 5px 0 0; opacity: 0.7;">Timestamp: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
      text: `
HomyHive Contact Form Submission

Department: ${departmentEmail}
From: ${name} (${email})
Subject: ${subject}

Message:
${message}

Sent: ${new Date().toLocaleString()}
      ` // fallback for text-only email clients
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${email}`);
    console.log('📧 Department:', departmentEmail);
    console.log('📬 Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw error;
  }
};

module.exports = sendMail;
