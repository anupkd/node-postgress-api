const express = require('express')
const bodyParser = require('body-parser')
const uuid = require('uuid');
const app = express()
const db = require('./queries')
const port = process.env.PORT || 3000
const { v4: uuidv4 } = require('uuid');

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' })
})


app.get('/users', db.getUsers)
app.get('/users/:id', db.getUserById)
app.post('/users', db.createUser)
app.post('/logs', db.createLog)
app.post('/device' ,db.createDevice)
app.put('/users/:id', db.updateUser)
app.delete('/users/:id', db.deleteUser)

app.listen(port, () => {
const GeoPoint = require('geopoint')
   point1 = new GeoPoint(parseFloat("10.19267"),76.3869299999999);
          point2 = new GeoPoint(10.19257,76.3869299999999);
          var distance = point1.distanceTo(point2, true)
          console.log(distance)
  console.log(uuidv4());
  console.log(`App running on port ${port}.`)
})
