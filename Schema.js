class Schema {
  constructor(db, currentVersion) {
    this.db = db
    this.versions = []
    this.filteredVersions = []
    this.currentVersion = currentVersion
  }

  version(version, fn) {
    this.versions.push({ version, fn })
  }

  needUpgrade() {
    this.filteredVersions = this.versions
      .sort((a, b) => a.version - b.version)
      .filter(({ version }) => version > this.currentVersion)

    return Boolean(this.filteredVersions.length)
  }

  async upgrade() {
    if (!this.needUpgrade()) return true

    for (const { version, fn } of this.filteredVersions) {
      try {
        await fn(this.db)
      } catch (e) {
        console.error('Error occurred when upgrading to version ' + version) // eslint-disable-line
        throw e
      }
    }

    return true
  }
}

module.exports = Schema
