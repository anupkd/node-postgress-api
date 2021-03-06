const Pool = require('pg').Pool
const GeoPoint = require('geopoint')
const { v4: uuidv4 } = require('uuid');
const pool = new Pool({
  user: 'postgres',
  host: 'travlog.cbrq6afqs7kz.eu-west-1.rds.amazonaws.com',
  database: 'postgres',
  password: 'travlog123',
  port: 5432,
})

const pool1 = new Pool({
  user: 'uuwisnkzdcdbvd',
  host: 'ec2-52-213-173-172.eu-west-1.compute.amazonaws.com',
  database: 'd5blg62473hnk4',
  password: '9e9d46f4e598cca454514c616a751d48cd71060525107560b729b1290590a35b',
  port: 5432,
})

const getTripsById = (request, response) => {
  const id =  request.params.uid
  pool.query('SELECT * FROM trips where userid=$1 ',[id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}
//polypoints
const getRoutePolyByTripId = (request, response) => {
  const id =  request.params.tripid
  pool.query('SELECT polypoints FROM trip_map where tripid=$1 ',[id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getRouteByTripId = (request, response) => {
  const id =  request.params.tripid
  pool.query('SELECT latitude,longitude FROM gpslog where tripid=$1 order by time',[id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getUserById = (request, response) => {
  const id =  request.params.id
  console.log(id)
  pool.query("select \'Current Day\' as label,1 as id,count(distinct tripid) trips  from trips where deviceid =$1 and DATE(start_time) = DATE(current_timestamp)   group by  DATE(start_time) union all select \'Current Month\' as  label,2 as id,count(distinct tripid) trips  from trips where deviceid =$1 and EXTRACT(MONTH FROM start_time)= EXTRACT(MONTH FROM current_timestamp) "
 , [id], (error, results) => {
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
       const { longitude, latitude,speed,time,user,deviceid } = item
         var ltimestamp = -1
       var  tripId = uuidv4();
       console.log(user)
       pool.query('select  (($1 - time)/1000)/60 as last_timestamp,  last_tripid,latitude,longitude from devices where   deviceid = $2', [  time ,deviceid], (error, results) => {
        if (error) {
          throw error
        } else if (!Array.isArray(results.rows) || results.rows.length < 1) {
          pool.query('INSERT INTO devices (deviceid, time) VALUES ($1, $2) RETURNING *', [deviceid, time], (error, results) => {
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
          var distance = 200;
          if( parseFloat(results.rows[0].latitude) > 0.00000000000000001){
              point1 = new GeoPoint( parseFloat(results.rows[0].latitude) ,parseFloat(results.rows[0].longitude));
              point2 = new GeoPoint(latitude, longitude);
              distance = point1.distanceTo(point2, true)
           }
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
        pool.query('INSERT INTO gpslog (deviceid,time, latitude,longitude,speed,userid,tripid) VALUES ($1, $2,$3,$4,$5,$6,$7) RETURNING *', [deviceid, time,latitude,longitude,speed,user,tripId], (error, results) => {
          if (error) {
            throw error
          } else if (!Array.isArray(results.rows) || results.rows.length < 1) {
            throw error
          }
          //response.status(201).send(`User added with ID: ${results.rows[0].id}`)
        })
  
        pool.query(
          'UPDATE devices SET time = $1, latitude = $2,longitude = $3,speed =$4 ,last_tripid = $5 WHERE deviceid = $6 RETURNING *',
          [time, latitude,longitude,speed,tripId, deviceid],
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
  getTripsById,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  createLog,
  createDevice,
  getRouteByTripId,
  getRoutePolyByTripId
}
