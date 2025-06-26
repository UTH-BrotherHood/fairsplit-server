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
      isArray: true,
      custom: {
        options: (value) => value && value.length > 0
      }
    },
    'participants.*.userId': {
      notEmpty: true,
      isMongoId: true
    },
    'participants.*.share': {
      notEmpty: true,
      isFloat: {
        options: { min: 0 }
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
      isArray: true,
      custom: {
        options: (value) => !value || value.length > 0
      }
    },
    'participants.*.userId': {
      optional: true,
      isMongoId: true
    },
    'participants.*.share': {
      optional: true,
      isFloat: {
        options: { min: 0 }
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
