import { Router } from 'express'
import authRoute from './auth.route'
import adminRoute from './admin.route'
import userRoute from './user.route'
import { OK } from '~/core/succes.response'
import groupRoute from './group.route'
import billRoute from './bill.route'
import debtRoute from './debt.route'

const rootRouterV1 = Router()

rootRouterV1.get('/health', (_req, res) => {
  new OK({
    message: 'Welcome to FairSplit API'
  }).send(res)
})

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute
  },
  {
    path: '/users',
    route: userRoute
  },
  {
    path: '/groups',
    route: groupRoute
  },
  {
    path: '/bills',
    route: billRoute
  },
  {
    path: '/debts',
    route: debtRoute
  },
  {
    path: '/admin',
    route: adminRoute
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
