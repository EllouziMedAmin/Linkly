import nodemailer from 'nodemailer';

// Create a test account for development/demo purposes
let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  try {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    
    // Create reusable transporter object using the default SMTP transport
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });

    console.log("📧 Ethereal Email Transporter Created.");
    return transporter;
  } catch (error) {
    console.error("Failed to create email transporter:", error);
    return null;
  }
}

export async function sendApplicationEmail(
  toEmail: string, 
  teamName: string, 
  status: 'received' | 'accepted' | 'rejected' | 'waitlisted',
  aiScore?: number,
  aiReasoning?: string
) {
  const mailer = await getTransporter();
  if (!mailer) return;

  let subject = '';
  let html = '';

  switch (status) {
    case 'received':
      subject = `Application Received - El-Rojla-Bwai`;
      html = `
        <h2>Hi ${teamName},</h2>
        <p>We have successfully received your application to the ecosystem.</p>
        <p>Our AI is currently screening your pitch. You can check your live status anytime using this email address at our status portal.</p>
        <br/>
        <p>Best regards,<br/>The El-Rojla-Bwai Team</p>
      `;
      break;

    case 'accepted':
      subject = `🎉 You're In! Welcome to El-Rojla-Bwai`;
      html = `
        <h2>Congratulations ${teamName}!</h2>
        <p>Your application has been <strong>ACCEPTED</strong>.</p>
        ${aiScore ? `<p><strong>AI Screening Score:</strong> ${aiScore}/100</p>` : ''}
        ${aiReasoning ? `<p><strong>AI Feedback:</strong> ${aiReasoning}</p>` : ''}
        <br/>
        <p>You will soon receive further instructions regarding your onboarding and bipartite matching.</p>
        <br/>
        <p>Welcome to the ecosystem,<br/>The El-Rojla-Bwai Team</p>
      `;
      break;

    case 'rejected':
      subject = `Application Update - El-Rojla-Bwai`;
      html = `
        <h2>Hi ${teamName},</h2>
        <p>Thank you for applying. Unfortunately, your application has not been accepted at this time.</p>
        ${aiScore ? `<p><strong>AI Screening Score:</strong> ${aiScore}/100</p>` : ''}
        ${aiReasoning ? `<p><strong>Feedback:</strong> ${aiReasoning}</p>` : ''}
        <br/>
        <p>We encourage you to refine your pitch and try again in the future.</p>
        <br/>
        <p>Best regards,<br/>The El-Rojla-Bwai Team</p>
      `;
      break;

    case 'waitlisted':
      subject = `You are on the Waitlist - El-Rojla-Bwai`;
      html = `
        <h2>Hi ${teamName},</h2>
        <p>Your application is currently on the waitlist.</p>
        <p>We are reviewing our capacity and will let you know as soon as a spot opens up.</p>
        <br/>
        <p>Best regards,<br/>The El-Rojla-Bwai Team</p>
      `;
      break;
  }

  try {
    // Send mail with defined transport object
    const info = await mailer.sendMail({
      from: '"El-Rojla-Bwai Ecosystem" <no-reply@elrojla.demo>', // sender address
      to: toEmail, // list of receivers
      subject: subject, // Subject line
      html: html, // html body
    });

    console.log("-----------------------------------------");
    console.log("📬 Email Sent to: %s", toEmail);
    console.log("👉 Preview URL: %s", nodemailer.getTestMessageUrl(info));
    console.log("-----------------------------------------");
    
    return { success: true, previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}
