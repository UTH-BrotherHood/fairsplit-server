import { logger } from '~/loggers/my-logger.log'
import { Twilio } from 'twilio'
import { ISMSProvider } from '../sms.service'
import envConfig from '~/config/env'

const accountSid = envConfig.twilioAccountSid
const authToken = envConfig.twilioAuthToken
const messagingServiceSid = envConfig.twilioServiceSid

const client = new Twilio(accountSid, authToken)

export class TwilioSMSProvider implements ISMSProvider {
  async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      const result = await client.messages.create({
        to,
        body: message,
        messagingServiceSid
      })

      logger.info('Twilio SMS sent', 'TwilioSMSProvider.sendSMS', '', {
        sid: result.sid,
        to,
        status: result.status
      })
      return true
    } catch (error) {
      logger.error('Twilio SMS failed', 'TwilioSMSProvider.sendSMS', '', {
        to,
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }
}
