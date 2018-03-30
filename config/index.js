module.exports = {
  'SQL_HOST': process.env.SQL_HOST || 'localhost',
  'SQL_USERNAME': process.env.SQL_USERNAME || 'root',
  'SQL_PASSWORD': process.env.SQL_PASSWORD || '',
  'SQL_DATABASE': process.env.SQL_DATABASE || 'prospector',
  'ahrefs': {
    'URL': 'https://ahrefs.com/site-explorer',
    'LOGIN_URL': 'https://ahrefs.com/user/login',
    'USERNAME_SELECTOR': '#email_input',
    'USERNAME': process.env.AHREF_USERNAME || '',
    'PASSWORD_SELECTOR': '.logins input[name=password]',
    'PASSWORD': process.env.AHREF_PASSWORD || '',
    'SUBMIT_SELECTOR': 'input.btn.btn-primary.btn-primary-wide.pull-xs-right',
    'SEARCH_SELECTOR': '#se_index_target',
    'SEARCH_TYPE_SELECTOR': '.se-landing-form .input-group-substring span',
    'SEARCH_TYPE_VALUE': '.se-landing-form .dropdown-item[data-mode=exact]',
    'SEARCH_BUTTON_SELECTOR': '#se_index_start_analysing'
  }
}
