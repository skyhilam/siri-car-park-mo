require('dotenv').config()
const express = require('express')
const expressGoogleAnalytics = require('express-google-analytics')
const v1 = require('./pages/v1')
// const v2 = require('./pages/v2')

const analytics = expressGoogleAnalytics('UA-80328109-11');




const app = express()
const port = process.env.APP_PORT

app.use(analytics)

app.get('/', (req, res) => res.send('Hello World!'))
app.use(v1)
// app.use(v2)


app.listen(port, () => console.log(`Example app listening on port ${port}!`))