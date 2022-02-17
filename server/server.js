require('dotenv').config()

const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const mongoSanitize = require('express-mongo-sanitize');

// Connect to DB
let connectionString
if(process.env.PRODUCTION === "true") {
  connectionString = process.env.DATABASE_URL_PRODUCTION
} else {
  connectionString = process.env.DATABASE_URL_LOCAL
}
mongoose.connect(connectionString, { useNewUrlParser: true })
const db = mongoose.connection
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Connected to DB'))

app.use(express.json())
app.use(cors())
app.use(mongoSanitize())



// ROUTES
const userRouter = require('./routes/users')
const categoryRouter = require('./routes/categories')
const entryRouter = require('./routes/entries')
const suggestionRouter = require('./routes/suggestions')
app.use('/users', userRouter)
app.use('/categories', categoryRouter)
app.use('/entries', entryRouter)
app.use('/suggestions', suggestionRouter)

// Default route
app.get("*", (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

app.listen(process.env.PORT || 5000)