import { checkSchema } from 'express-validator'
import { validate } from '~/utils/validation.utils'
import { USER_MESSAGES } from '~/constants/messages'

export const changePasswordValidation = validate(
  checkSchema({
    oldPassword: {
      notEmpty: {
        errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: USER_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      }
    },
    newPassword: {
      notEmpty: {
        errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: USER_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRONG
      }
    },
    confirmNewPassword: {
      notEmpty: {
        errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.newPassword) {
            throw new Error(USER_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
          }
          return true
        }
      }
    }
  })
)

export const searchUsersValidation = validate(
  checkSchema({
    query: {
      optional: true,
      isString: {
        errorMessage: 'Search query must be a string'
      },
      trim: true,
      isLength: {
        options: { min: 1 },
        errorMessage: 'Search query cannot be empty'
      }
    },
    page: {
      optional: true,
      isInt: {
        options: { min: 1 },
        errorMessage: 'Page must be a positive integer'
      },
      toInt: true
    },
    limit: {
      optional: true,
      isInt: {
        options: { min: 1, max: 100 },
        errorMessage: 'Limit must be between 1 and 100'
      },
      toInt: true
    }
  })
)

export const userPreferencesValidation = validate(
  checkSchema({
    language: {
      optional: true,
      isString: {
        errorMessage: 'Language must be a string'
      },
      isLength: {
        options: { min: 2, max: 5 },
        errorMessage: 'Language code must be between 2 and 5 characters'
      }
    },
    theme: {
      optional: true,
      isString: {
        errorMessage: 'Theme must be a string'
      },
      isIn: {
        options: [['light', 'dark', 'system']],
        errorMessage: 'Invalid theme value'
      }
    },
    'notifications.email': {
      optional: true,
      isBoolean: {
        errorMessage: 'Email notification setting must be a boolean'
      }
    },
    'notifications.push': {
      optional: true,
      isBoolean: {
        errorMessage: 'Push notification setting must be a boolean'
      }
    },
    'notifications.sms': {
      optional: true,
      isBoolean: {
        errorMessage: 'SMS notification setting must be a boolean'
      }
    }
  })
)

export const updatePrivacySettingsValidation = validate(
  checkSchema({
    profile_visibility: {
      optional: true,
      isString: {
        errorMessage: 'Profile visibility must be a string'
      },
      isIn: {
        options: [['public', 'friends', 'private']],
        errorMessage: 'Invalid profile visibility value'
      }
    },
    friend_requests: {
      optional: true,
      isString: {
        errorMessage: 'Friend requests setting must be a string'
      },
      isIn: {
        options: [['everyone', 'friends_of_friends', 'none']],
        errorMessage: 'Invalid friend requests value'
      }
    }
  })
)

export const blockUserValidation = validate(
  checkSchema({
    reason: {
      optional: true,
      isString: {
        errorMessage: 'Block reason must be a string'
      },
      isLength: {
        options: { max: 500 },
        errorMessage: 'Block reason cannot exceed 500 characters'
      }
    }
  })
)

export const updateProfileValidation = validate(
  checkSchema({
    username: {
      optional: true,
      isString: {
        errorMessage: USER_MESSAGES.USERNAME_MUST_BE_A_STRING
      },
      trim: true,
      isLength: {
        options: { min: 3, max: 50 },
        errorMessage: USER_MESSAGES.USERNAME_LENGTH_MUST_BE_FROM_1_TO_50
      }
    },
    avatarUrl: {
      optional: true,
      isString: {
        errorMessage: 'Avatar URL must be a string'
      },
      isLength: {
        options: {
          min: 0,
          max: 2000
        },
        errorMessage: 'Avatar URL length must be between 0 and 2000 characters'
      },
      trim: true,
      matches: {
        options: /^https?:\/\//,
        errorMessage: 'Avatar URL must be a valid HTTP/HTTPS URL'
      }
    },
    dateOfBirth: {
      optional: true,
      isISO8601: {
        errorMessage: USER_MESSAGES.DATE_OF_BIRTH_MUST_BE_ISO8601
      }
    }
  })
)
