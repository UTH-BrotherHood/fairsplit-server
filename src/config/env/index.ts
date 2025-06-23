import { envConfig as developmentConfig } from './development'
import { envConfig as productionConfig } from './production'

const env = process.env.NODE_ENV || 'development'

export const envConfig = env === 'production' ? productionConfig : developmentConfig

export default envConfig
