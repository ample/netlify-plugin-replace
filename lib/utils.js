const Path = require("path")

class Utils {
  static uniq(arr) {
    return Array.from([...new Set(arr)])
  }
  static cwd(relativePath) {
    return Path.join(process.cwd(), relativePath)
  }
  static filterByProperty(raw, properties) {
    return Object.keys(raw)
      .filter(key => properties.includes(key))
      .reduce((obj, key) => {
        obj[key] = raw[key]
        return obj
      }, {})
  }
  static pluralize(str, count) {
    return `${str}${count > 1 ? "s" : ""}`
  }
  static log(str, newline = false) {
    process.stdout.write(str + (newline ? "\n" : ""))
  }
}

module.exports = Utils
