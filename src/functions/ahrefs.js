const logger = require('./logger')
const config = require('../../config')
const { ahrefs } = config
const timeout = { timeout: 5 * 1000 }

const convertString = str => {
  str = str.replace(/(https?:\/\/)/, '').replace(/[/.]/g, '_')
  str = str.replace(/_(php|html?|js|jsp)$/, '')
  return str
}

const getValueFor = async (opts = {}) => {
  const { page, waitForSelector, selector, defaultVal } = opts
  try {
    if (waitForSelector) {
      logger.debug('Waiting for', waitForSelector)
      await page.waitForSelector(waitForSelector, timeout)
    }
    await page.waitForSelector(selector, timeout)
    const value = await page.$eval(selector, el => el.innerText)
    logger.debug('Got', value, 'for', selector)
    return value || defaultVal
  } catch (e) {
    return defaultVal
  }
}
const click = async (page, selector) => {
  try {
    await page.waitForSelector(selector, timeout)
    return page.click(selector)
  } catch (e) {
    return Promise.resolve()
  }
}

const scrape = async (result, page) => {
  result.ahrefData = {
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
  if (!ahrefs.USERNAME || !ahrefs.PASSWORD) return result
  logger.info('Getting ahref data for', result.link)
  await page.waitFor(5 * 1000)
  await page.goto(ahrefs.LOGIN_URL)
  try {
    if (await page.url() === ahrefs.LOGIN_URL) {
      await click(page, ahrefs.USERNAME_SELECTOR)
      await page.keyboard.type(ahrefs.USERNAME)
      await click(page, ahrefs.PASSWORD_SELECTOR)
      await page.keyboard.type(ahrefs.PASSWORD)
      await click(page, ahrefs.SUBMIT_SELECTOR)
      await page.waitForNavigation()
    }
    await page.goto(ahrefs.URL)
    await click(page, ahrefs.SEARCH_SELECTOR)
    await page.keyboard.type(result.link)
    await click(page, ahrefs.SEARCH_TYPE_SELECTOR)
    await click(page, ahrefs.SEARCH_TYPE_VALUE)
    await click(page, ahrefs.SEARCH_BUTTON_SELECTOR)
    result.ahrefData.ahrefRank = await getValueFor({
      page,
      selector: '#topAhrefsRank',
      defaultVal: 0
    })
    result.ahrefData.domainRank = await getValueFor({
      page,
      selector: '#DomainRatingContainer span',
      defaultVal: 0
    })
    result.ahrefData.urlRank = await getValueFor({
      page,
      selector: '#UrlRatingContainer span',
      defaultVal: 0
    })
    result.ahrefData.referringDomains = await getValueFor({
      page,
      selector: '#ReferringDomainsStatsContainer [data-nav-type=se_referring_domains]',
      defaultVal: 0
    })
    result.ahrefData.backlinks = await getValueFor({
      page,
      selector: '#BacklinksStatsContainer [data-nav-type=se_backlinks]',
      defaultVal: 0
    })

    await click(page, 'a[data-nav-type=se_linked_domains]')
    result.ahrefData.linkedDomains = await getValueFor({
      page,
      waitForSelector: '.breadcrumb-ahrefs [data-tip=linked_domains_report_tooltip]',
      selector: '#result_info var',
      defaultVal: 0
    })
    await click(page, 'a[data-nav-type=se_backlinks]')
    result.ahrefData.brokenLinks = await getValueFor({
      page,
      waitForSelector: '.breadcrumb-ahrefs [data-tip=broken_links_report_tooltip]',
      selector: '#result_info var',
      defaultVal: 0
    })
    await click(page, 'a[data-nav-type=pe_organic_keywords]')
    result.ahrefData.organicKeywords = await getValueFor({
      page,
      waitForSelector: '.breadcrumb-ahrefs [data-tip=organic_keywords_report_tooltip]',
      selector: '#result_info var',
      defaultVal: 0
    })

    await click(page, 'a[data-nav-type=se_top_content]')
    result.ahrefData.social.twitter = await getValueFor({
      page,
      waitForSelector: '.breadcrumb-ahrefs [data-tip=top_content_report_tooltip]',
      selector: '#main_se_data_table tbody > tr:first-child .twitter',
      defaultVal: 0
    })
    result.ahrefData.social.facebook = await getValueFor({
      page,
      selector: '#main_se_data_table tbody > tr:first-child .facebook',
      defaultVal: 0
    })
    result.ahrefData.social.pinterest = await getValueFor({
      page,
      selector: '#main_se_data_table tbody > tr:first-child .pinterest',
      defaultVal: 0
    })
  } catch (e) {
    logger.error('error', e)
    await page.screenshot({path: 'screenshots/' + convertString(result.link) + '.png'})
  }
  return result
}

const runScrape = async opts => {
  const { page, results } = opts
  const output = []
  await results
    .reduce((chain, result) => chain
      .then(async () => {
        const response = await scrape(result, page)
        output.push(response)
        return response
      }), Promise.resolve())
  return output
}

module.exports = runScrape
