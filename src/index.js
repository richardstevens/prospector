const puppeteer = require('puppeteer')
const logger = require('./functions/logger')
const scrapePage = require('./functions/scrapePage')
const ahrefScrape = require('./functions/ahrefs')
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
const saveRun = async result => {
  const { link, title, position } = result
  logger.info('Saving to runs', link)
  return database.query(resultQuery, [
    serpKeyword,
    link,
    coreTimestamp,
    title,
    position
  ]).catch(logger.error)
}
const saveResult = async result => {
  const { link, title, pageData, ahrefData } = result
  logger.info('Saving to scrapes', link)
  return database.query(scrapeQuery, [
    link,
    title,
    pageData.email,
    pageData.phone,
    pageData.facebook,
    pageData.twitter,
    pageData.linkedin,
    pageData.form,
    ahrefData.ahrefRank,
    ahrefData.domainRank,
    ahrefData.urlRank,
    ahrefData.referringDomains,
    ahrefData.backlinks,
    ahrefData.linkedDomains,
    ahrefData.brokenLinks,
    ahrefData.organicKeywords,
    ahrefData.social.twitter,
    ahrefData.social.facebook,
    ahrefData.social.pinterest
  ]).catch(logger.error)
}
const screenshot = async (filename, page) => {
  await page.screenshot({path: 'screenshots/' + filename + '.png'})
}

const serpKeyword = process.env.keyword
if (!serpKeyword) {
  logger.warn('No keyword provided')
  process.exit()
}
logger.info('Started timer', logger.timer('prospector'))
const coreTimestamp = process.env.timestamp || Date.now()
const searchNum = process.env.count || 50

const scrape = async () => {
  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36')
  await page.setViewport({ width: 1024, height: 768 })

  await page.goto('https://www.google.co.uk/search?q=' + serpKeyword + '&num=' + searchNum)
  page.on('console', msg => console.log('PAGE LOG:', msg.text()))
  const results = []
  const pagesFound = await page.evaluate(() => {
    const data = []
    let position = 0
    for (var el of document.querySelectorAll('.bkWMgd .g:not([id]):not(.gws-trips__outer-card) h3 a')) {
      data.push({
        link: el.getAttribute('href'),
        title: el.innerText,
        position: ++position
      })
    }
    return data
  })
  pagesFound.map(async pageData => {
    const result = {
      position: pageData.position,
      link: pageData.link,
      title: pageData.title,
      pageData: {
        email: '',
        phone: '',
        facebook: '',
        twitter: '',
        linkedin: '',
        form: 0
      },
      ahrefData: {
        ahrefRank: 0,
        domainRank: 0,
        urlRank: 0,
        referringDomains: 0,
        backlinks: 0,
        linkedDomains: 0,
        brokenLinks: 0,
        organicKeywords: 0,
        social: {
          twitter: 0,
          facebook: 0,
          pinterest: 0
        }
      }
    }
    saveResult(result) // Save the basics
    result.pageData = await scrapePage(result)
    saveResult(result) // Save initial pageData
    result.ahrefData = await ahrefScrape(result, page)
    saveResult(result) // Save the ahrefData too
    saveRun(result)
    results.push(result)
  })
  browser.close()
  return results // Pass all results back
}

scrape()
  .then(() => {
    logger.info('Finished for', serpKeyword)
    logger.info('Ended timer', logger.timerEnd('prospector'))
    process.exit()
  })
