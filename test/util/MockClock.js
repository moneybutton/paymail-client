class MockClock {
  constructor () {
    this._now = null
  }

  now () {
    if (this.now === null) {
      throw new Error('Set current mock time first!')
    }
    return this._now
  }

  setCurrentTime (newNow) {
    this._now = newNow
  }
}

export { MockClock }
