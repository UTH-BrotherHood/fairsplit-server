import { Router } from 'express'

const userRoute = Router()

userRoute.get('/', (_req, res) => {
  res.status(200).send({ message: 'Hello World' })
})

export default userRoute
