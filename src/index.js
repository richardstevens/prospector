const puppeteer = require('puppeteer')
const scrapePage = require('./functions/scrapePage')
const database = require('./functions/mysql')
const config = require('config')
database.setCredentials(config)
const timestamp = Date.now()

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
  (url, title, email, phone, facebook, twitter, linkedin, form)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    title=VALUES(title),
    email=VALUES(email),
    phone=VALUES(phone),
    facebook=VALUES(facebook),
    twitter=VALUES(twitter),
    linkedin=VALUES(linkedin),
    form=VALUES(form)
`

const serpKeyword = process.env.keyword
if (!serpKeyword) {
  console.log('No keyword provided')
  process.exit()
}

let scrape = async () => {
  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()

  await page.goto('https://www.google.co.uk/search?q=' + serpKeyword + '&num=100')
  const result = await page.evaluate(async () => {
    let data = []
    let elements = document.querySelectorAll('.bkWMgd .g:not([id]):not(.gws-trips__outer-card)')

    for (var element of elements) {
      let link = element.querySelectorAll('a')[0].getAttribute('href')
      let title = element.querySelectorAll('h3')[0].innerText
      data.push({link, title, position: (data.length + 1)})
    }

    return data
  })

  browser.close()
  return result
}

scrape()
  .then(async (values) => {
    await values.reduce((chain, page) => chain.then(async () => {
      database.query(resultQuery, [ serpKeyword, page.link, timestamp, page.title, page.position ])
        .catch(err => {
          database.shutDown()
          console.log('mysql error', err)
        })
      const pageData = await scrapePage(page.link)
      if (!pageData.ran) return chain
      console.log('Running:', page.link)
      database.query(scrapeQuery, [ page.link, page.title, pageData.email, pageData.phone, pageData.facebook, pageData.twitter, pageData.linkedin, pageData.form ])
        .catch(err => {
          database.shutDown()
          console.log('mysql error', err)
        })
    }), Promise.resolve())
    console.log('Finished for', serpKeyword)
    process.exit()
  })
