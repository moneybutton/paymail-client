class AssetNotAccepted extends Error {
  constructor (message, asset) {
    super(message)
    this.asset = asset
  }
}

export { AssetNotAccepted }
