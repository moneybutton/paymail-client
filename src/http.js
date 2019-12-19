import AbortController from 'abort-controller'

class Http {
  constructor (fetch) {
    this.fetch = fetch
  }

  async get (url) {
    return this._basicRequest(url)
  }

  async postJson (url, body) {
    return this._basicRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
  }

  async _basicRequest (url, options = {}) {
    var controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 30000)
    return this.fetch(url, {
      ...options,
      credentials: 'omit',
      signal: controller.signal
    }).then(result => {
      clearTimeout(timer)
      return result
    })
  }
}

export { Http }
