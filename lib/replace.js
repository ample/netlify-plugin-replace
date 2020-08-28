const Finder = require("find-in-files")
const ReplaceUtil = require("replace-in-file")
const fs = require("fs-extra")
const Ignore = require("ignore")
const Utils = require("./utils")

class Replace {
  constructor(dir, inputs) {
    this.dir = dir
    this.delimiter = inputs.delimiter
    this.fileTypes = inputs.fileTypes
  }

  async perform() {
    const exists = await fs.pathExists(this.dir)
    if (exists) {
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
    } else {
      this.files = []
    }
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
      this.files = {}
      const matches = await Finder.find(new RegExp(this.delimiter), this.dir, this.fileTypes)
      const allowedFiles = Ignore()
        .add(fs.readFileSync(".gitignore").toString())
        .filter(Object.keys(matches))

      for (let i in allowedFiles) {
        let file = allowedFiles[i]
        this.files[file] = {
          ...matches[file],
          results: {},
          instances: Array.from([...new Set(matches[file].matches)])
        }
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
