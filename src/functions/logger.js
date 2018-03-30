const pino = require('pino')
const through = require('through2')

const logger = module.exports = { }

const timers = {}
const levels = [ 'fatal', 'error', 'warn', 'info', 'debug', 'trace' ]
levels.forEach(level => {
  logger[level] = console.log.bind(console)
})

let stream = through(function (buffer, enc, callback) {
  callback(null, buffer)
})

stream.pipe(pino.pretty()).pipe(process.stderr)

const realLogger = pino({
  timestamp: pino.stdTimeFunctions.slowTime
}, stream)
levels.forEach(level => {
  logger[level] = function (...args) { realLogger[level].apply(realLogger, args) }
})
logger._raw = realLogger

logger.timer = name => {
  timers[name] = new Date()
  return name
}
logger.timerEnd = name => {
  if (!timers[name]) return 'No timer found for ' + name
  var diff = Math.floor(new Date() - timers[name])
  timers[name] = null
  var hours = Math.floor(diff / 1000 / 60 / 60)
  diff -= hours * 1000 * 60 * 60
  var mins = Math.floor(diff / 1000 / 60)
  diff -= mins * 1000 * 60
  var seconds = Math.floor(diff / 1000)
  return name + ' ' + (hours ? hours + 'hrs ' : '') + (mins ? mins + 'mins ' : '') + (seconds ? seconds + 'secs' : '')
}

console.log = logger.fatal.bind(logger, { accidental: 'console.log' })
console.error = logger.error.bind(logger, { accidental: 'console.error' })
console.warn = logger.warn.bind(logger, { accidental: 'console.warn' })
console.info = logger.info.bind(logger, { accidental: 'console.info' })
