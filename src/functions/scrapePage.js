const request = require('superagent')
const logger = require('./logger')
const cheerio = require('cheerio')

const scrapePage = async result => {
  logger.debug('Scraping', result.link)
  if (!result.link) return Promise.resolve(result.pageData)
  try {
    const response = await request
      .get(result.link)
      .redirects(2)
      .timeout({
        response: 5000, // Wait 5 seconds for the server to start sending,
        deadline: 60000 // but allow 1 minute for the file to finish loading.
      })
    const domain = getDomain(result.link)
    if (!response || !response.text) return Promise.resolve(result.pageData)
    const $ = cheerio.load(response.text)
    // Ideally maybe we should just scrape the entire source for matching elements with regex?
    $('a[href]').each((i, element) => {
      const a = element.attribs.href
      if (!result.pageData.facebook) result.pageData.facebook = isFaceBookLink(a)
      if (!result.pageData.twitter) result.pageData.twitter = isTwitterLink(a)
      if (!result.pageData.linkedin) result.pageData.linkedin = isLinkedInLink(a)
      if (!result.pageData.email) result.pageData.email = isEmail(a, domain)
      if (!result.pageData.phone) result.pageData.phone = isPhone(a)
    })
    $('form').each((i, element) => {
      const form = $(element).html()
      if (isForm(form)) result.pageData.form = 1
    })
    result.pageData.ran = true
  } catch (error) {
    console.log('Couldn\'t get', result.link)
  }
  return Promise.resolve(result.pageData)
}

const getDomain = (url) => {
  const domain = url.split('/')
  if (domain[1] === '') return domain[2] // Was given as http://foo.com/
  return domain[0] // Was given as foo.com/
}

const isFaceBookLink = (link) => {
  if (!link.includes('facebook.com')) return '' // Not pointing to Facebook
  if (link.includes('=facebook.com')) return '' // This is a param
  if (link.includes('.php')) return '' // Dont want share links
  if ((link.slice(0, -1).match(/\//g) || []).length - 3 > 0) return '' // Facebook pages dont have subfolders
  link = link.split('?')[0]
  return link || ''
}

const isTwitterLink = (link) => {
  if (!link.includes('twitter.com')) return '' // Not pointing to Twitter
  if (link.includes('=twitter.com')) return '' // This is a param
  if (link.includes('/share?')) return '' // Dont want share links
  if (link.includes('/tweet')) return '' // Dont want tweet links
  if ((link.slice(0, -1).match(/\//g) || []).length - 3 > 0) return '' // Twitter pages dont have subfolders
  link = link.split('?')[0]
  return link || ''
}

const isLinkedInLink = (link) => {
  if (!link.includes('linkedin.com')) return '' // Not pointing to LinkedIn
  if (link.includes('=linkedin.com')) return '' // This is a param
  if (!link.includes('/company/')) return '' // Dont want personal links
  if (link.includes('.php')) return '' // Dont want share links
  if ((link.slice(0, -1).match(/\//g) || []).length - 3 > 1) return '' // LinkedIn pages dont have subfolders after company/
  link = link.split('?')[0]
  return link || ''
}

const isEmail = (link, domain) => {
  if (!link.includes('@')) return '' // No @ so can't be email
  if (link.includes('=')) return '' // No = in emails
  if (!link.includes(domain)) return '' // Not on same domain
  link = link.replace('mailto:', '').split('?')[0]
  return link || ''
}

const isPhone = (link) => {
  if (link.includes('=')) return '' // No = in phone numbers
  if (link.includes('?')) return '' // No ? in phone numbers
  link = link.replace(/\D+/g, '') // Strip out any non numerics
  if (link.slice(0, 2) === '44') link = '0' + link.slice(2) // UK format
  if (link.length !== 11) return '' // not a UK number!
  if (link.slice(0, 1) !== '0') return '' // All numbers start 0..
  link = link.split('?')[0]
  return link || ''
}

const isForm = (form) => {
  if (!form.includes('submit')) return false // Need to submit a form
  if (!form.includes('name')) return false // They need our name?
  if (!form.includes('textarea')) return false // We need to fill stuff in?
  return true
}

module.exports = scrapePage
