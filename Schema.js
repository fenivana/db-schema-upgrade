class Schema {
  constructor(currentVersion, ...args) {
    this.currentVersion = currentVersion
    this.args = args
    this.versions = []
    this.filteredVersions = []
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

    if (latest === this.currentVersion) {
      return true
    }

    const upgrades = this.versions.filter(({ version }) => version > this.currentVersion)

    for (const { fn } of upgrades) {
      await fn(...this.args)
    }

    return true
  }
}

module.exports = Schema
