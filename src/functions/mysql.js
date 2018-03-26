const mysql = require('mysql')
const database = module.exports = { }
let pool
let credentials = {}

database.setCredentials = function (opts) {
  credentials = opts
}

database.getCredentials = function () {
  return {
    host: process.env.SQL_HOST || credentials.SQL_HOST || 'localhost',
    port: process.env.SQL_PORT || credentials.SQL_PORT || '3306',
    user: process.env.SQL_USERNAME || credentials.SQL_USERNAME || 'root',
    password: process.env.SQL_PASSWORD || credentials.SQL_PASSWORD || null
  }
}

database.start = function () {
  if (pool) return

  pool = mysql.createPool(Object.assign(database.getCredentials(), {
    connectionLimit: (process.env.SQL_CONNECTION_LIMIT / 1) || 25,
    timezone: 'Z'
  }))

  const databaseName = process.env.SQL_DATABASE || credentials.SQL_DATABASE
  pool.on('connection', function (connection) {
    connection.query(`SET SESSION sql_mode = 'ANSI_QUOTES';`)
    connection.query(`USE \`${databaseName}\`;`)
  })
}

database._getCaller = function (error) {
  const lines = error.stack.split('\n')
  const line = lines[2]
  if (!line) return null
  let callerFileAndLocation = line.split(' (')[1]
  if (!callerFileAndLocation) return null
  const databaseName = process.env.SQL_DATABASE || credentials.SQL_DATABASE
  callerFileAndLocation = callerFileAndLocation.slice(0, -1)
  return callerFileAndLocation.split(`${databaseName}/`).pop() || null
}

database.query = function (query, values, connection, callback) {
  if (!pool) database.start()

  if (connection instanceof Function) {
    callback = connection
    connection = pool
  }
  if (query instanceof Function) {
    query = query.toString().substring(10).slice(0, -4).replace(/^\n/, '')
  }

  const queryLocation = database._getCaller(new Error())
  const databaseName = process.env.SQL_DATABASE || credentials.SQL_DATABASE
  query = `/* ${databaseName}, ${queryLocation} */\n${query}`

  const _query = (cb) => {
    pool.query({
      sql: query,
      timeout: (process.env.SQL_QUERY_TIMEOUT / 1) || 10000,
      values
    }, (err, results, fields) => {
      if (err) return cb(err)
      return cb(null, results)
    })
  }
  if (callback) return _query(callback)
  return Promise.denodeify(_query)()
}

database.transaction = function (handler, callback) {
  if (!pool) database.start()

  pool.getConnection((err, connection) => {
    if (err) return callback(err)
    connection.beginTransaction((err) => {
      if (err) return callback(err)

      let finalResult = null
      let handlerErr = null

      const fakeConnection = {
        query: (query, values) => database.query(query, values, connection),
        commit: () => {
          return new Promise((resolve, reject) => {
            connection.commit((err) => {
              connection.release()
              if (err) return reject(err)
              resolve()
            })
          })
        },
        rollback: () => {
          return new Promise((resolve, reject) => {
            connection.rollback((err) => {
              connection.release()
              if (err) return reject(err)
              resolve()
            })
          })
        }
      }

      if (!callback) return handler(null, fakeConnection)

      handler(fakeConnection).then(finalResult => {
        fakeConnection.commit().then(() => {
          return callback(handlerErr, finalResult)
        })
      }).catch((e) => {
        handlerErr = e
        fakeConnection.rollback().then(() => {
          return callback(handlerErr, finalResult)
        })
      })
    })
  })
}

database.shutDown = (done = () => {}) => {
  if (!pool) return done()
  pool.end(done)
}

Promise.denodeify = function (fn, argumentCount) {
  argumentCount = argumentCount || Infinity
  return function () {
    var self = this
    var args = Array.prototype.slice.call(arguments)
    return new Promise(function (resolve, reject) {
      while (args.length && args.length > argumentCount) {
        args.pop()
      }
      args.push(function (err, res) {
        if (err) reject(err)
        else resolve(res)
      })
      var res = fn.apply(self, args)
      if (res &&
        (
          typeof res === 'object' ||
          typeof res === 'function'
        ) &&
        typeof res.then === 'function'
      ) {
        resolve(res)
      }
    })
  }
}
