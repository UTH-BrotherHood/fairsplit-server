import { Router } from 'express'
import authRoute from './auth.route'
import userRoute from './user.route'

const rootRouterV1 = Router()

rootRouterV1.get('/health', (_req, res) => {
  console.log('Hello World')
  res.status(200).send({ message: 'Welcome to Express & TypeScript Server' })
})

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute
  },
  {
    path: '/users',
    route: userRoute
  }
]

// tao lười làm swagger quá hihi!
// const devRoutes = [
//   {
//     path: '/docs',
//     route: docsRoutes
//   }
// ]

defaultRoutes.forEach((route) => {
  rootRouterV1.use(route.path, route.route)
})

// if (envConfig.nodeEnv === 'development') {
//   devRoutes.forEach((route) => {
//     rootRouterV1.use(route.path, route.route)
//   })
// }

export default rootRouterV1
