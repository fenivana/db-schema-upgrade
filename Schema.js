class Schema {
  constructor(db, currentVersion) {
    this.db = db
    this.versions = []
    this.filteredVersions = []
    this.currentVersion = currentVersion
  }

  version(version, fn) {
    this.versions.push({ version, fn })
    this.versions.sort((a, b) => a.version - b.version)
  }

  latest() {
    if (this.versions.length) {
      return this.versions[this.versions.length - 1].version
    } else {
      return null
    }
  }

  async upgrade() {
    const latest = this.latest()
    if (latest === this.currentVersion) return true

    const upgrades = this.versions.filter(({ version }) => version > this.currentVersion)

    for (const { version, fn } of upgrades) {
      try {
        console.log(`Upgrading to version ${version} ...`) // eslint-disable-line no-console
        await fn(this.db)
        console.log('Success') // eslint-disable-line no-console
      } catch (e) {
        console.error('Error occurred when upgrading to version ' + version) // eslint-disable-line no-console
        throw e
      }
    }

    console.log('Database schema upgraded to version ' + latest) // eslint-disable-line no-console
    return true
  }
}

module.exports = Schema
