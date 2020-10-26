class PaymailNotFound extends Error {
  constructor (message, paymail) {
    super(message)
    this.paymail = paymail
  }
}

export { PaymailNotFound }
