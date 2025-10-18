import * as brevo from '@getbrevo/brevo'

const apiInstance = new brevo.TransactionalEmailsApi()
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY || ''
)

export interface SendChallengeEmailParams {
  to: string
  challengeId: string
  duration: number
  isNew: boolean // true for new challenges, false for "forgot link"
}

export async function sendChallengeEmail({
  to,
  challengeId,
  duration,
  isNew,
}: SendChallengeEmailParams) {
  const challengeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/challenge/${challengeId}`

  const subject = isNew
    ? '💪 Your Pushup Challenge Has Started!'
    : '💪 Here\'s Your Pushup Challenge Link'

  const html = isNew
    ? `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Pushup Challenge</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">💪 Challenge Started!</h1>
          </div>

          <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 20px;">You've just started your <strong>${duration}-day pushup challenge</strong>!</p>

            <p style="margin-bottom: 20px;">Every day, do one set of maximum pushups and track your progress. Watch your strength grow over time!</p>

            <div style="background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #667eea;">📌 Save this link:</p>
              <a href="${challengeUrl}" style="color: #764ba2; word-break: break-all;">${challengeUrl}</a>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${challengeUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Go to Your Challenge
              </a>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;"><strong>💡 Tip:</strong> Bookmark this link or save this email! This URL is your personal access to your challenge.</p>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">Good luck on your journey to greater strength! 💪</p>
          </div>
        </body>
      </html>
    `
    : `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Pushup Challenge Link</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🔗 Your Challenge Link</h1>
          </div>

          <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Here's the link to your <strong>${duration}-day pushup challenge</strong>:</p>

            <div style="background: white; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #10b981;">📌 Your Challenge:</p>
              <a href="${challengeUrl}" style="color: #059669; word-break: break-all;">${challengeUrl}</a>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${challengeUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Go to Your Challenge
              </a>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;"><strong>💡 Tip:</strong> Bookmark this link to easily access your challenge anytime!</p>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">Keep pushing! 💪</p>
          </div>
        </body>
      </html>
    `

  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail()

    sendSmtpEmail.sender = {
      email: process.env.BREVO_FROM_EMAIL || 'noreply@example.com',
      name: process.env.BREVO_FROM_NAME || 'Push Track',
    }

    sendSmtpEmail.to = [{ email: to }]
    sendSmtpEmail.subject = subject
    sendSmtpEmail.htmlContent = html

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail)

    return { success: true, data }
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}
