class AuthoriserNotFound extends Error {
  constructor (message, domain) {
    super(message)
    this.domain = domain
  }
}

export { AuthoriserNotFound }
