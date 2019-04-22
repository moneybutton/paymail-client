class MockDNS {
  constructor () {
    this._records = {}
  }

  // dns interface

  resolveSrv (domain, callback) {
    const info = this._records[domain]
    if (info) {
      info.times++
      callback(null, [ info.record ])
    }
  }

  // Mock API

  timesFor (domain) {
    return this._records[domain].times
  }

  registerRecord (domain, record) {
    this._records[domain] = {
      times: 0,
      record
    }
  }
}

export { MockDNS }
