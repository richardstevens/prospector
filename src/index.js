const puppeteer = require('puppeteer')
const logger = require('./functions/logger')
const scrapePage = require('./functions/scrapePage')
const getaHrefData = require('./functions/ahrefs')
const database = require('./functions/mysql')
const config = require('../config')
database.setCredentials(config)

const resultQuery = `
  INSERT INTO runs
  (keyword, url, timestamp, title, position)
  VALUES (?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    timestamp=VALUES(timestamp),
    title=VALUES(title),
    position=VALUES(position)
`
const scrapeQuery = `
  INSERT INTO scrapes
  (url, title, email, phone, facebook, twitter, linkedin, form, ahrefRank, domainRank, urlRank, referringDomains, backlinks, linkedDomains, brokenLinks, organicKeywords, twitterCount, facebookCount, pinterestCount)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    title=VALUES(title),
    email=VALUES(email),
    phone=VALUES(phone),
    facebook=VALUES(facebook),
    twitter=VALUES(twitter),
    linkedin=VALUES(linkedin),
    form=VALUES(form),
    ahrefRank=VALUES(ahrefRank),
    domainRank=VALUES(domainRank),
    urlRank=VALUES(urlRank),
    referringDomains=VALUES(referringDomains),
    backlinks=VALUES(backlinks),
    linkedDomains=VALUES(linkedDomains),
    brokenLinks=VALUES(brokenLinks),
    organicKeywords=VALUES(organicKeywords),
    twitterCount=VALUES(twitterCount),
    facebookCount=VALUES(facebookCount),
    pinterestCount=VALUES(pinterestCount)
`

const serpKeyword = process.env.keyword
if (!serpKeyword) {
  logger.warn('No keyword provided')
  process.exit()
}
logger.info('Started timer', logger.timer('prospector'))
const searchNum = process.env.count || 50

let scrape = async () => {
  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36')
  await page.setViewport({ width: 1024, height: 768 })

  await page.goto('https://www.google.co.uk/search?q=' + serpKeyword + '&num=' + searchNum)
  let results = await page.evaluate(async () => {
    let data = []
    let elements = document.querySelectorAll('.bkWMgd .g:not([id]):not(.gws-trips__outer-card)')

    for (var element of elements) {
      let link = element.querySelectorAll('a')[0].getAttribute('href')
      let title = element.querySelectorAll('h3')[0].innerText || 'Direct Answer: ' + element.querySelectorAll('a')[0].innerText
      data.push({link, title, position: (data.length + 1)})
    }

    return data
  })
  results = await getaHrefData({
    page,
    results
  })
  logger.debug('results', results)
  browser.close()
  return results
}

scrape()
  .then(async (values) => {
    await values.reduce((chain, page) => chain.then(async () => {
      database.query(resultQuery, [ serpKeyword, page.link, process.env.timestamp, page.title, page.position ]).catch(logger.error)
      const pageData = await scrapePage(page.link)
      if (!pageData.ran) return chain
      logger.info('Saving:', page.link)
      database.query(scrapeQuery, [
        page.link,
        page.title,
        pageData.email,
        pageData.phone,
        pageData.facebook,
        pageData.twitter,
        pageData.linkedin,
        pageData.form,
        pageData.ahrefData.ahrefRank,
        pageData.ahrefData.domainRank,
        pageData.ahrefData.urlRank,
        pageData.ahrefData.referringDomains,
        pageData.ahrefData.backlinks,
        pageData.ahrefData.linkedDomains,
        pageData.ahrefData.brokenLinks,
        pageData.ahrefData.organicKeywords,
        pageData.ahrefData.social.twitter,
        pageData.ahrefData.social.facebook,
        pageData.ahrefData.social.pinterest
      ]).catch(logger.error)
    }), Promise.resolve())
    logger.info('Finished for', serpKeyword)
    logger.info('Ended timer', logger.timerEnd('prospector'))
    process.exit()
  })
