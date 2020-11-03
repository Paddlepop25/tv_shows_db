// load express, handlebars, mysql2, dotenv
const express = require('express')
const handlebars = require('express-handlebars')
// get the driver with promise support
const mysql = require('mysql2/promise')
require('dotenv').config()

// configure PORT
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

// SQL
// 'SELECT * FROM tv_shows ORDER BY name desc LIMIT 20'
const SQL_FIND_BY_NAME = 'SELECT * FROM tv_shows ORDER BY name asc LIMIT ?'
// 'select * from apps where name like ? limit ?,?'
const SQL_FIND_BY_ID = 'SELECT * FROM tv_shows WHERE tvid=?' //'select * from tv_shows where app_id = ?'

// create the database connection pool
// remember export DB_USER, DB_PASSWORD, DB_NAME

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'leisure',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 4,
  timezone: '+8:00',
})

const startApp = async (app, pool) => {
  try {
    // get a connection from the connection pool
    const conn = await pool.getConnection()
    console.info('Pinging database')

    await conn.ping()

    // release the connection
    conn.release()

    // start the server only if connected to database
    app.listen(PORT, () => {
      console.info(`Application started on port ${PORT} at ${new Date()}`)
    })

  } catch (exception) {
    console.error('Cannot ping database ---> ', exception)
  }
}

// create an instance of express
const app = express()

// configure handlebars
app.engine('hbs', handlebars({ defaultLayout: 'default.hbs' }))
app.set('view engine', 'hbs')

// configure the application
let limit = 20
app.get('/',
  async (req, res) => {
    // acquire a connection from the pool
    const conn = await pool.getConnection()
    try {
      // const SQL_FIND_BY_NAME = 'SELECT * FROM tv_shows ORDER BY ? desc LIMIT ?'
      const results = await conn.query(SQL_FIND_BY_NAME, [limit])
      const result = results[0]
      // console.info('result --->', result)

      res.status(200)
      res.type('text/html')
      res.render('index', { result })

    } catch (err) {
      console.error('error ---> ', error)
    }
  })

app.get('/name/:tvid',
  async (req, res) => {
    const tvID = req.params['tvid']
    // console.info(tvID)
    const conn = await pool.getConnection()

    try {
      const results2 = await conn.query(SQL_FIND_BY_ID, [tvID])
      const recs2 = results2[0]
      // console.info('results2 --->', results2)
      // console.info('recs2 --->', recs2)
      res.status(200)
      res.type('text/html')
      res.render('info', { recs2 })
    } catch (e) {
      res.status(500)
      res.type('text/html')
      res.send(JSON.stringify(e))
    } finally {
      conn.release()
    }
  }
)


startApp(app, pool)  
