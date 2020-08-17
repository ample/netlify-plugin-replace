const { it, describe } = require("mocha")
const assert = require("assert")
const fs = require("fs-extra")
const toml = require("toml")
const yaml = require("yaml")

const Replace = require("../lib/replace")
const Utils = require("../lib/utils")

describe("Replace", () => {
  let publishDir

  before(() => {
    const manifest = fs.readFileSync(Utils.cwd("manifest.yml"), "utf8")
    this.manifest = yaml.parse(manifest)

    const netlify_config = fs.readFileSync(Utils.cwd("netlify.toml"), "utf8")
    this.config = toml.parse(netlify_config)
    this.env_vars = this.config.build.environment

    publishDir = "tmp"
    fs.emptyDirSync(publishDir)
    fs.copySync(this.config.build.publish, publishDir)

    const inputs = {
      delimiter: this.manifest.inputs[0].default,
      fileTypes: this.manifest.inputs[1].default
    }

    this.subject = new Replace(publishDir, inputs)
  })

  describe("perform()", () => {
    let results
    before(async () => {
      results = await this.subject.perform()
    })

    it("should replace values", async () => {
      const files = ["index.html", "contact.html", "about.html", "_redirects"]
      assert.deepEqual(fs.readdirSync(publishDir), files.sort())

      for (let i in files) {
        const file = files[i]
        const pathToFile = `${publishDir}/${file}`
        const buffer = fs.readFileSync(pathToFile)
        const contents = buffer.toString()
        const instances = this.subject.files[pathToFile].instances.filter(i => i !== "${UNDEFINED}")
        instances.forEach(instance => {
          let value = this.subject.getVar(instance)
          assert(!contents.includes(instance))
          assert(contents.includes(value))
        })
      }
    })
    it("should return results", () => {
      assert.deepEqual(results["tmp/index.html"].results, [
        { from: "${SITE_TITLE}", to: "something", numReplacements: 1 },
        { from: "${APP_ENDPOINT}", to: "https://ample.co", numReplacements: 2 }
      ])
      assert.deepEqual(results["tmp/contact.html"].results, [
        { from: "${SITE_TITLE}", to: "something", numReplacements: 1 }
      ])
      assert.deepEqual(results["tmp/about.html"].results, [
        { from: "${SITE_TITLE}", to: "something", numReplacements: 1 },
        { from: "${APP_ENDPOINT}", to: "https://ample.co", numReplacements: 1 }
      ])
      assert.deepEqual(results["tmp/_redirects"].results, [
        { from: "${REDIR_ROLE}", to: "user", numReplacements: 1 },
        { from: "${APP_ENDPOINT}", to: "https://ample.co", numReplacements: 1 }
      ])
    })
  })

  describe("getFiles()", () => {
    it("should return all files and matches for each file", async () => {
      const files = await this.subject.getFiles()
      assert.deepEqual(Object.keys(files), [
        "tmp/index.html",
        "tmp/contact.html",
        "tmp/about.html",
        "tmp/_redirects"
      ])
    })

    it("it should return matches, instances and results for each file", async () => {
      const files = await this.subject.getFiles()
      assert.deepEqual(Object.keys(files["tmp/index.html"]), [
        "matches",
        "count",
        "line",
        "results",
        "instances"
      ])
      assert.deepEqual(files["tmp/index.html"].matches, [
        "${SITE_TITLE}",
        "${APP_ENDPOINT}",
        "${APP_ENDPOINT}"
      ])
      assert.deepEqual(files["tmp/index.html"].instances, ["${SITE_TITLE}", "${APP_ENDPOINT}"])
    })
  })

  it("should parse and return variable", () => {
    let str = "ever thus to deadbeats, lebowski"
    process.env.NETLIFY_PLUGIN_REPLACE_TEST_VALUE = str
    assert.equal(this.subject.getVar("${NETLIFY_PLUGIN_REPLACE_TEST_VALUE}"), str)
    delete process.env.NETLIFY_PLUGIN_REPLACE_TEST_VALUE
  })

  it("should parse and return variable", () => {
    let str = "ever thus to deadbeats, lebowski"
    process.env.NETLIFY_PLUGIN_REPLACE_TEST_VALUE = str
    assert.equal(this.subject.getVar("${NETLIFY_PLUGIN_REPLACE_TEST_VALUE}"), str)
    delete process.env.NETLIFY_PLUGIN_REPLACE_TEST_VALUE
  })

  it("should return all matches", async () => {
    const expected = [
      ["${SITE_TITLE}", "${APP_ENDPOINT}"],
      ["${SITE_TITLE}", "${UNDEFINED}"],
      ["${SITE_TITLE}", "${APP_ENDPOINT}"],
      ["${REDIR_ROLE}", "${APP_ENDPOINT}"]
    ]
    const matches = await this.subject.getMatches()
    Promise.all(matches).then(function (results) {
      assert(Array.isArray(results))
      assert.deepEqual(results, expected)
    })
  })

  it("should return all matches in a file", async () => {
    const matches = await this.subject.getMatchesFor("tmp/index.html")
    assert.deepEqual(matches, ["${SITE_TITLE}", "${APP_ENDPOINT}"])
  })
})
