const Replace = require("./lib/replace")
const Utils = require("./lib/utils")

module.exports = {
  onPostBuild: async ({ constants, inputs, utils: { status } }) => {
    const results = await new Replace(constants.PUBLISH_DIR, inputs).perform()
    let replacements = new Set()

    for (let file in results) {
      Utils.log(file, true)
      results[file].results.forEach(result => {
        Utils.log(`\t(${result.numReplacements}) ${result.from}=${result.to}`, true)
        replacements.add(result.from)
      })
      Utils.log("\n")
    }

    let n = Object.keys(results).length
    status.show({
      summary: `Replaced ${replacements.size} ${Utils.pluralize(
        "variable",
        replacements.size
      )} across ${n} ${Utils.pluralize("file", n)}.`
    })
  }
}
