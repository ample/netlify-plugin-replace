const Replace = require("./lib/replace")
const Utils = require("./lib/utils")

module.exports = {
  onPostBuild: async ({ constants, inputs, utils: { status } }) => {
    const results = await new Replace(constants.PUBLISH_DIR, inputs).perform()
    let replacements = new Set()

    for (let file in results) {
      results[file].results.forEach(result => {
        replacements.add(result.from)
      })
    }

    const n = Object.keys(results).length
    const summary = `Replaced ${replacements.size} ${Utils.pluralize(
      "variable",
      replacements.size
    )} across ${n} ${Utils.pluralize("file", n)}.`

    Utils.log(summary)
    status.show({ summary: summary })
  }
}
