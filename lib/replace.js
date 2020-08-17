const Finder = require("find-in-files")
const ReplaceUtil = require("replace-in-file")
const Utils = require("./utils")

class Replace {
  constructor(dir, inputs) {
    this.dir = dir
    this.delimiter = inputs.delimiter
    this.fileTypes = inputs.fileTypes
  }

  async perform() {
    let files = await this.getFiles()
    Object.keys(files).map(file => {
      this.files[file].results = []
      files[file].instances.map(async v => {
        const value = this.getVar(v)
        if (value) {
          let options = {
            files: file,
            from: this.escapeVar(v),
            to: value,
            countMatches: true
          }
          const results = ReplaceUtil.sync(options)[0]
          this.files[file].results.push({
            from: v,
            to: value,
            numReplacements: results.numReplacements
          })
        }
      })
    })
    return this.files
  }

  getVar(v) {
    const match = v.match(this.delimiter)
    const key = match.slice(-4)[match.length - 1]
    return process.env[key]
  }

  escapeVar(v) {
    return new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
  }

  async getFiles() {
    if (!this.files) {
      this.files = await Finder.find(new RegExp(this.delimiter), this.dir, this.fileTypes)
      for (let file in this.files) {
        this.files[file]["results"] = {}
        this.files[file]["instances"] = Array.from([...new Set(this.files[file].matches)])
      }
    }
    return this.files
  }

  async getMatches() {
    let files = await this.getFiles()
    return Object.keys(files).map(async f => {
      return await this.getMatchesFor(f, files)
    })
  }

  async getMatchesFor(f, files) {
    files = files || (await this.files)
    const matches = Utils.filterByProperty(await this.getFiles(), [f])[f].matches
    return Utils.uniq(matches)
  }
}

module.exports = Replace
