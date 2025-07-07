import { checkSchema } from 'express-validator'
import { validate } from '~/utils/validation.utils'

export const createBillValidation = validate(
  checkSchema({
    groupId: {
      notEmpty: true,
      isMongoId: true
    },
    title: {
      notEmpty: true,
      isString: true,
      trim: true,
      isLength: {
        options: { min: 1, max: 100 }
      }
    },
    description: {
      optional: true,
      isString: true,
      trim: true,
      isLength: {
        options: { max: 500 }
      }
    },
    amount: {
      notEmpty: true,
      isFloat: {
        options: { min: 0 }
      }
    },
    currency: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: { min: 3, max: 3 }
      }
    },
    date: {
      notEmpty: true,
      isISO8601: true
    },
    category: {
      optional: true,
      isString: true
    },
    splitMethod: {
      notEmpty: true,
      isIn: {
        options: [['equal', 'percentage']]
      }
    },
    paidBy: {
      notEmpty: true,
      isMongoId: true
    },
    participants: {
      optional: true,
      isArray: {
        errorMessage: 'participants must be an array of userId strings'
      },
      custom: {
        options: (participants, { req }) => {
          if (!Array.isArray(participants)) throw new Error('participants must be an array')
          if (participants.length === 0) throw new Error('participants must not be empty')

          const isPercentage = req.body.splitMethod === 'percentage'
          let totalShare = 0

          for (const p of participants) {
            if (!p.userId || typeof p.userId !== 'string') {
              throw new Error('Each participant must have a valid userId')
            }

            if (isPercentage) {
              if (typeof p.share !== 'number' || p.share < 0) {
                throw new Error('Each participant must have a non-negative share when splitMethod is percentage')
              }
              totalShare += p.share
            }
          }

          // Check tổng % phải ≈ 100 nếu là percentage
          if (isPercentage && Math.abs(totalShare - 100) > 0.01) {
            throw new Error('Total share must equal 100% when using percentage split')
          }

          return true
        }
      }
    }
  })
)

export const groupBillsValidation = validate(
  checkSchema({
    startDate: {
      optional: true,
      isISO8601: true
    },
    endDate: {
      optional: true,
      isISO8601: true
    },
    category: {
      optional: true,
      isString: true
    },
    status: {
      optional: true,
      isIn: {
        options: [['pending', 'partially_paid', 'completed', 'cancelled']]
      }
    },
    page: {
      optional: true,
      isInt: {
        options: { min: 1 }
      }
    },
    limit: {
      optional: true,
      isInt: {
        options: { min: 1, max: 100 }
      }
    }
  })
)

export const billIdValidation = validate(
  checkSchema({
    billId: {
      notEmpty: true,
      isMongoId: true
    }
  })
)

export const updateBillValidation = validate(
  checkSchema({
    title: {
      optional: true,
      isString: true,
      trim: true,
      isLength: {
        options: { min: 1, max: 100 }
      }
    },
    description: {
      optional: true,
      isString: true,
      trim: true,
      isLength: {
        options: { max: 500 }
      }
    },
    amount: {
      optional: true,
      isFloat: {
        options: { min: 0 }
      }
    },
    date: {
      optional: true,
      isISO8601: true
    },
    category: {
      optional: true,
      isString: true
    },
    splitMethod: {
      optional: true,
      isIn: {
        options: [['equal', 'percentage']]
      }
    },
    participants: {
      optional: true,
      isArray: {
        errorMessage: 'participants must be an array of userId strings'
      },
      custom: {
        options: (participants, { req }) => {
          if (!Array.isArray(participants)) throw new Error('participants must be an array')
          if (participants.length === 0) throw new Error('participants must not be empty')

          const isPercentage = req.body.splitMethod === 'percentage'
          let totalShare = 0

          for (const p of participants) {
            if (!p.userId || typeof p.userId !== 'string') {
              throw new Error('Each participant must have a valid userId')
            }

            if (isPercentage) {
              if (typeof p.share !== 'number' || p.share < 0) {
                throw new Error('Each participant must have a non-negative share when splitMethod is percentage')
              }
              totalShare += p.share
            }
          }

          // Check tổng % phải ≈ 100 nếu là percentage
          if (isPercentage && Math.abs(totalShare - 100) > 0.01) {
            throw new Error('Total share must equal 100% when using percentage split')
          }

          return true
        }
      }
    }
  })
)

export const addPaymentValidation = validate(
  checkSchema({
    amount: {
      notEmpty: true,
      isFloat: {
        options: { min: 0 }
      }
    },
    paidBy: {
      notEmpty: true,
      isMongoId: true
    },
    paidTo: {
      notEmpty: true,
      isMongoId: true
    },
    date: {
      notEmpty: true,
      isISO8601: true
    },
    method: {
      notEmpty: true,
      isIn: {
        options: [['cash', 'bank_transfer', 'other']]
      }
    },
    notes: {
      optional: true,
      isString: true,
      trim: true,
      isLength: {
        options: { max: 500 }
      }
    }
  })
)
