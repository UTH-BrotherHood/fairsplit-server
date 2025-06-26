import { checkSchema } from 'express-validator'
import { validate } from '~/utils/validation.utils'

export const groupIdValidation = validate(
  checkSchema({
    groupId: {
      in: ['params'],
      isString: true,
      trim: true,
      notEmpty: true
    }
  })
)

export const debtIdValidation = validate(
  checkSchema({
    debtId: {
      in: ['params'],
      isString: true,
      trim: true,
      notEmpty: true
    }
  })
)
