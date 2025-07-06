import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import envConfig from '~/config/env'
import httpStatusCode from '~/core/statusCodes'
import { ErrorWithStatus } from '~/utils/error.utils'
import { uploadFile, uploadMultipleFiles } from '~/utils/fileUploader'
import { wrapRequestHandler } from '~/utils/wrapHandler'

export const uploadMiddleware = wrapRequestHandler(
  async (req: Request<ParamsDictionary>, res: Response, next: NextFunction) => {
    try {
      if (!req.file && !req.files) {
        return next()
      }

      const {
        uploadService = envConfig.defaultUploadService,
        folder = 'Fairsplit/User/Avatar',
        fileType = req.file?.mimetype?.startsWith('image/') ? 'image' : 'raw'
      } = req.body

      console.log('Processing file upload:', {
        hasFile: !!req.file,
        hasFiles: !!req.files,
        mimetype: req.file?.mimetype || '',
        fileType: fileType,
        uploadService: uploadService
      })

      if (req.file) {
        const fileUrl = await uploadFile({
          file: req.file,
          uploadService,
          folder,
          fileType: fileType as 'image' | 'video' | 'raw' | 'auto'
        })

        console.log('Upload successful, file URL:', fileUrl)

        req.fileUrl = fileUrl

        if (fileType === 'image' || req.file.mimetype.startsWith('image/')) {
          req.body.avatarUrl = fileUrl
        }

        return next()
      }

      if (req.files && Array.isArray(req.files)) {
        const fileUrls = await uploadMultipleFiles({
          files: req.files,
          uploadService,
          folder,
          fileType: fileType as 'image' | 'video' | 'raw' | 'auto'
        })

        console.log('Multiple files upload successful, URLs:', fileUrls)
        req.fileUrls = fileUrls
        return next()
      }

      next()
    } catch (error) {
      console.error('File upload error:', error)
      const err = error as Error
      throw new ErrorWithStatus({
        message: err.message,
        status: httpStatusCode.INTERNAL_SERVER_ERROR
      })
    }
  }
)
