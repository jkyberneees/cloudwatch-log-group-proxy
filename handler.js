'use strict'

const winston = require('winston')
const WinstonCloudwatch = require('winston-cloudwatch')
const AWS = require('aws-sdk')
const zlib = require('zlib')

const decode = (data) => {
  const compressedPayload = Buffer.from(data, 'base64')
  const jsonPayload = zlib.gunzipSync(compressedPayload).toString('utf8')
  return JSON.parse(jsonPayload)
}

module.exports.proxy = event => {
  AWS.config.update({
    region: 'us-east-1',
  })

  return new Promise((resolve) => {
    const logsEvent = decode(event.awslogs.data)

    const transport = new WinstonCloudwatch({
      cloudWatchLogs: new AWS.CloudWatchLogs(),
      logGroupName: logsEvent.logGroup + '/proxy',
      logStreamName: logsEvent.logStream,
      jsonMessage: true,
      retentionInDays: 30
    })

    winston.add(transport)
    logsEvent.logEvents.forEach(e => {
      winston.log('info', e)
    })

    transport.kthxbye(() => {
      resolve({
        status: 'OK'
      })
    })
  })
}

