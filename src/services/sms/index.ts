// index.ts
import SMSService from '../sms.service'
import { TwilioSMSProvider } from './twilioProvider'

const smsService = new SMSService(new TwilioSMSProvider())
export default smsService
