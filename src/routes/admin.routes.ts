import { Router } from 'express'

const adminRoute = Router()

adminRoute.post('/login', (req, res) => {
  res.send('Admin Dashboard')
})

export default adminRoute
