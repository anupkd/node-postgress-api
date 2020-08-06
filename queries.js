const Pool = require('pg').Pool
const GeoPoint = require('geopoint')
const { v4: uuidv4 } = require('uuid');
const pool1 = new Pool({
  user: 'me',
  host: 'localhost',
  database: 'api',
  password: 'password',
  port: 32769,
})

const pool = new Pool({
  user: 'yllobeagwbouum',
  host: 'ec2-54-247-169-129.eu-west-1.compute.amazonaws.com',
  database: 'd28kentim5pts6',
  password: '62a3046a297f8f45124e68c7eb45093c4c43e861837dbf84c02d581194117780',
  port: 5432,
})

const getUsers = (request, response) => {
  pool.query('SELECT count(*) FROM gpslog ORDER BY id ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getUserById = (request, response) => {
  const id =  request.params.id
  console.log(id)
  pool.query('select DATE(created_at) date,count(distinct tripid) trips  from gpslog where deviceid =$1 group by  DATE(created_at)  order by  DATE(created_at) desc', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const createLog = (request, response) => {
  var data =    request.body
 
  data.forEach(item => {
       // Do something with item
       const { longitude, latitude,speed,time,user } = item
         var ltimestamp = -1
       var  tripId = uuidv4();
       console.log(user)
       pool.query('select  (($1 - time)/1000)/60 as last_timestamp,  last_tripid,latitude,longitude from devices where   deviceid = $2', [  time ,user], (error, results) => {
        if (error) {
          throw error
        } else if (!Array.isArray(results.rows) || results.rows.length < 1) {
          pool.query('INSERT INTO devices (deviceid, time) VALUES ($1, $2) RETURNING *', [user, time], (error, results) => {
            if (error) {
              throw error
            } else if (!Array.isArray(results.rows) || results.rows.length < 1) {
              throw error
            }
             
          })
          ltimestamp=-1
          tripId =uuidv4();
          console.log('er')
        } else {
          console.log('Start ' || ltimestamp)
          console.log( parseFloat(results.rows[0].latitude) ) 
          console.log( parseFloat(results.rows[0].longitude));
          point1 = new GeoPoint( parseFloat(results.rows[0].latitude) ,parseFloat(results.rows[0].longitude));
          point2 = new GeoPoint(latitude, longitude);
          var distance = point1.distanceTo(point2, true)
          console.log(distance)
        console.log(results.rows[0].last_timestamp)
        ltimestamp=   Math.round( results.rows[0].last_timestamp)
        console.log(results.rows[0].last_tripid)
        if(ltimestamp <= 15 && distance <= 1.5){
          console.log('Inside')
          tripId = results.rows[0].last_tripid
        }
        console.log(tripId)
        console.log('End')

        }
        pool.query('INSERT INTO gpslog (deviceid,time, latitude,longitude,speed,userid,tripid) VALUES ($1, $2,$3,$4,$5,$6,$7) RETURNING *', [user, time,latitude,longitude,speed,user,tripId], (error, results) => {
          if (error) {
            throw error
          } else if (!Array.isArray(results.rows) || results.rows.length < 1) {
            throw error
          }
          //response.status(201).send(`User added with ID: ${results.rows[0].id}`)
        })
  
        pool.query(
          'UPDATE devices SET time = $1, latitude = $2,longitude = $3,speed =$4 ,last_tripid = $5 WHERE deviceid = $6 RETURNING *',
          [time, latitude,longitude,speed,tripId, user],
          (error, results) => {
            if (error) {
              throw error
            } 
            if (typeof results.rows == 'undefined') {
              response.status(404).send(`Resource not found`);
            } else if (Array.isArray(results.rows) && results.rows.length < 1) {
              response.status(404).send(`device not found`);
            }  
            
          })
      })
      console.log('Out')
      console.log(ltimestamp)
      console.log(tripId)
     
      
       console.log(item)
    })
    response.status(201).send(`Data added with ID `)
  

 
}

const createDevice = (request, response) => {
 
 
    const {  deviceid,time } = request.body

  pool.query('INSERT INTO devices (deviceid, time) VALUES ($1, $2) RETURNING *', [deviceid, time], (error, results) => {
    if (error) {
      throw error
    } else if (!Array.isArray(results.rows) || results.rows.length < 1) {
    	throw error
    }
    response.status(201).send(`Device added with ID: ${results.rows[0].id}`)
  })

  
}

const createUser = (request, response) => {
  var data =    request.body
 
  data.forEach(item => {
       // Do something with item
       const { longitude, latitude,speed,time } = item
       console.log(time)
    })
   
 
  const { name, email } = request.body

  pool.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *', [name, email], (error, results) => {
    if (error) {
      throw error
    } else if (!Array.isArray(results.rows) || results.rows.length < 1) {
    	throw error
    }
    response.status(201).send(`User added with ID: ${results.rows[0].id}`)
  })
}

const updateUser = (request, response) => {
  const id = parseInt(request.params.id)
  const { name, email } = request.body

  pool.query(
    'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
    [name, email, id],
    (error, results) => {
      if (error) {
        throw error
      } 
      if (typeof results.rows == 'undefined') {
      	response.status(404).send(`Resource not found`);
      } else if (Array.isArray(results.rows) && results.rows.length < 1) {
      	response.status(404).send(`User not found`);
      } else {
  	 	  response.status(200).send(`User modified with ID: ${results.rows[0].id}`)         	
      }
      
    }
  )
}

const deleteUser = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).send(`User deleted with ID: ${id}`)
  })
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  createLog,
  createDevice
}
