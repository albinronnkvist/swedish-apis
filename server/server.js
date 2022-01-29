require('dotenv').config()

const express = require('express')
const app = express()
const mongoose = require('mongoose')

// Connect to DB
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true })
const db = mongoose.connection
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Connected to DB'))


// Accept JSON
app.use(express.json())



// ROUTES
const userRouter = require('./routes/users')
app.use('/users', userRouter)

// Default route
app.get("*", (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

app.listen(5000)