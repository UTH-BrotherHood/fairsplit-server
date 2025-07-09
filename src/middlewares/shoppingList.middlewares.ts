// shoppingList.validation.ts

import { checkSchema } from 'express-validator'
import { validate } from '~/utils/validation.utils'

export const createShoppingListValidation = validate(
  checkSchema({
    name: { notEmpty: true, isString: true },
    description: { optional: true, isString: true },
    tags: { optional: true, isArray: true },
    dueDate: { optional: true, isISO8601: true }
  })
)

export const updateShoppingListValidation = validate(
  checkSchema({
    name: { optional: true, isString: true },
    description: { optional: true, isString: true },
    status: { optional: true, isIn: { options: [['active', 'completed', 'archived']] } },
    tags: { optional: true, isArray: true },
    dueDate: { optional: true, isISO8601: true }
  })
)

export const addShoppingListItemValidation = validate(
  checkSchema({
    items: {
      in: ['body'],
      isArray: true,
      errorMessage: 'items must array'
    },
    'items.*.name': { notEmpty: true, isString: true },
    'items.*.quantity': { notEmpty: true, isFloat: { options: { min: 1 } } },
    'items.*.unit': { optional: true, isString: true },
    'items.*.estimatedPrice': { optional: true, isFloat: { options: { min: 0 } } },
    'items.*.note': { optional: true, isString: true },
    'items.*.category': { optional: true, isString: true }
  })
)

export const updateShoppingListItemValidation = validate(
  checkSchema({
    name: { optional: true, isString: true },
    quantity: { optional: true, isFloat: { options: { min: 1 } } },
    unit: { optional: true, isString: true },
    estimatedPrice: { optional: true, isFloat: { options: { min: 0 } } },
    note: { optional: true, isString: true },
    isPurchased: { optional: true, isBoolean: true },
    purchasedBy: { optional: true, isMongoId: true },
    purchasedAt: { optional: true, isISO8601: true },
    category: { optional: true, isString: true }
  })
)
