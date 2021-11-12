class Http {
  constructor ( fetch ) {
    this.fetch = fetch
  }

  async get ( url ) {
    return this._basicRequest( url )
  }

  async postJson ( url, body ) {
    return this._basicRequest( url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify( body )
    } )
  }

  async _basicRequest ( url, options = {} ) {
    const timeout = 5000
    return Promise.race( [
      this.fetch( url, {
        ...options,
        credentials: 'omit',
      } ),
      new Promise( ( _, reject ) =>
        setTimeout( () => reject( new Error( 'timeout' ) ), timeout )
      )
    ] );
  }
}

export { Http }
