import { logger } from '~/loggers/my-logger.log'

export interface ISMSProvider {
  sendSMS(to: string, message: string): Promise<boolean>
}

class SMSService {
  private provider: ISMSProvider

  constructor(provider: ISMSProvider) {
    this.provider = provider
  }

  async sendVerificationCode(phone: string, code: string): Promise<boolean> {
    try {
      const message = `Your verification code is: ${code}. This code will expire in 5 minutes.`
      const result = await this.provider.sendSMS(phone, message)

      if (result) {
        logger.info('Verification SMS sent successfully', 'SMSService.sendVerificationCode', '', {
          phone
        })
      } else {
        logger.error('Failed to send verification SMS', 'SMSService.sendVerificationCode', '', {
          phone
        })
      }

      return result
    } catch (error) {
      logger.error('Error sending verification SMS', 'SMSService.sendVerificationCode', '', {
        phone,
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }
}

export default SMSService
