class MockDNS {
  constructor () {
    this._records = {}
  }

  // dns interface

  resolveSrv (domain, callback) {
    const info = this._records[domain]
    if (!info) {
      throw new Error(`Not registered dns query: ${domain}`)
    }
    info.times++
    callback(info.error, [info.record])
  }

  // Mock API

  timesFor (domain) {
    return this._records[domain].times
  }

  registerRecord (domain, record) {
    this._records[domain] = {
      times: 0,
      record,
      error: null
    }
  }

  registerError (domain, errorCode) {
    const error = new Error(errorCode)
    error.errno = errorCode
    error.code = errorCode
    error.syscall = 'querySrv'
    error.hostname = domain
    this._records[domain] = {
      times: 0,
      error,
      record: null
    }
  }
}

export { MockDNS }
