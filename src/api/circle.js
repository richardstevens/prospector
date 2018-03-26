'use strict'

const circleHandler = {}

const config = require('config')
const CircleCI = require('circleci')

const ci = new CircleCI({
  auth: config.circleConfig.token
})

circleHandler.triggerDeployment = (templateGroupData) => {
  return new Promise((resolve, reject) => {
    circleHandler.deployBranch(templateGroupData)
      .then((buildStatus) => {
        resolve(buildStatus)
      }).catch((err) => {
        reject(err)
      })
  })
}

circleHandler.deployBranch = (templateGroupData) => {
  return new Promise((resolve, reject) => {
    const ciParams = {
      username: config.circleConfig.organisation,
      project: config.circleConfig.repo,
      branch: config.circleConfig.deploymentBranch,
      body: {
        build_parameters: {
          keyword: templateGroupData.keyword,
          timestamp: templateGroupData.timestamp || new Date(),
          CIRCLE_JOB: 'runner'
        }
      }
    }
    ci.startBuild(ciParams).then((buildStatus) => {
      resolve(buildStatus)
    }).catch((err) => {
      reject(err)
    })
  })
}

module.exports = circleHandler
