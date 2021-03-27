class ProtocolNotSupported extends Error {
  constructor (message, protocol) {
    super(message)
    this.protocol = protocol
  }
}

export { ProtocolNotSupported }
