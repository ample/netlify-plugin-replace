const { it, describe } = require("mocha")
const assert = require("assert")
const fs = require("fs-extra")
const toml = require("toml")
const yaml = require("yaml")
const Ignore = require("ignore")

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

    publishDir = "tmp/test"
    fs.emptyDirSync(publishDir)
    fs.copySync(this.config.build.publish, publishDir)

    const inputs = {
      delimiter: this.manifest.inputs[0].default,
      fileTypes: this.manifest.inputs[1].default
    }

    this.subject = new Replace(publishDir, inputs)
  })

  after(() => {
    fs.removeSync(publishDir)
  })

  describe("perform()", () => {
    let results
    before(async () => {
      results = await this.subject.perform()
    })

    it("should replace values", async () => {
      const files = ["index.html", "contact.html", "about.html", "_redirects"]
      const dirFiles = fs.readdirSync(publishDir).filter(f => !f.includes("admin"))
      assert.deepEqual(dirFiles, files.sort())

      for (let i in files) {
        const file = files[i]
        const pathToFile = `${publishDir}/${file}`
        const buffer = fs.readFileSync(pathToFile)
        const contents = buffer.toString()
        const instances = this.subject.files[pathToFile].instances.filter(
          i => i !== "${env:UNDEFINED}"
        )
        instances.forEach(instance => {
          let value = this.subject.getVar(instance)
          assert(!contents.includes(instance))
          assert(contents.includes(value))
        })
      }
    })
    it("should return results", () => {
      assert.deepEqual(results[`${publishDir}/index.html`].results, [
        { from: "${env:SITE_TITLE}", to: "something", numReplacements: 1 },
        { from: "${env:APP_ENDPOINT}", to: "https://ample.co", numReplacements: 2 }
      ])
      assert.deepEqual(results[`${publishDir}/contact.html`].results, [
        { from: "${env:SITE_TITLE}", to: "something", numReplacements: 1 }
      ])
      assert.deepEqual(results[`${publishDir}/about.html`].results, [
        { from: "${env:SITE_TITLE}", to: "something", numReplacements: 1 },
        { from: "${env:APP_ENDPOINT}", to: "https://ample.co", numReplacements: 1 }
      ])
      assert.deepEqual(results[`${publishDir}/_redirects`].results, [
        { from: "${env:REDIR_ROLE}", to: "user", numReplacements: 1 },
        { from: "${env:APP_ENDPOINT}", to: "https://ample.co", numReplacements: 1 }
      ])
    })
  })

  describe("getFiles()", () => {
    it("should observe contents of .gitignore", async () => {
      const files = await this.subject.getFiles()
      assert(Object.keys(files).indexOf("tmp/test/admin.html") === -1)

      const isIgnored = Ignore()
        .add(fs.readFileSync(".gitignore").toString())
        .test("tmp/test/admin.html").ignored

      assert(isIgnored)
    })

    it("should return all files and matches for each file", async () => {
      const files = await this.subject.getFiles()
      assert.deepEqual(Object.keys(files), [
        `${publishDir}/index.html`,
        `${publishDir}/contact.html`,
        `${publishDir}/about.html`,
        `${publishDir}/_redirects`
      ])
    })

    it("it should return matches, instances and results for each file", async () => {
      const files = await this.subject.getFiles()
      assert.deepEqual(Object.keys(files[`${publishDir}/index.html`]), [
        "matches",
        "count",
        "line",
        "results",
        "instances"
      ])
      assert.deepEqual(files[`${publishDir}/index.html`].matches, [
        "${env:SITE_TITLE}",
        "${env:APP_ENDPOINT}",
        "${env:APP_ENDPOINT}"
      ])
      assert.deepEqual(files[`${publishDir}/index.html`].instances, [
        "${env:SITE_TITLE}",
        "${env:APP_ENDPOINT}"
      ])
    })
  })

  it("should parse and return variable", () => {
    let str = "ever thus to deadbeats, lebowski"
    process.env.NETLIFY_PLUGIN_REPLACE_TEST_VALUE = str
    assert.equal(this.subject.getVar("${env:NETLIFY_PLUGIN_REPLACE_TEST_VALUE}"), str)
    delete process.env.NETLIFY_PLUGIN_REPLACE_TEST_VALUE
  })

  it("should parse and return variable", () => {
    let str = "ever thus to deadbeats, lebowski"
    process.env.NETLIFY_PLUGIN_REPLACE_TEST_VALUE = str
    assert.equal(this.subject.getVar("${env:NETLIFY_PLUGIN_REPLACE_TEST_VALUE}"), str)
    delete process.env.NETLIFY_PLUGIN_REPLACE_TEST_VALUE
  })

  it("should return all matches", async () => {
    const expected = [
      ["${env:SITE_TITLE}", "${env:APP_ENDPOINT}"],
      ["${env:SITE_TITLE}", "${env:UNDEFINED}"],
      ["${env:SITE_TITLE}", "${env:APP_ENDPOINT}"],
      ["${env:REDIR_ROLE}", "${env:APP_ENDPOINT}"]
    ]
    const matches = await this.subject.getMatches()
    Promise.all(matches).then(function (results) {
      assert(Array.isArray(results))
      assert.deepEqual(results, expected)
    })
  })

  it("should return all matches in a file", async () => {
    const matches = await this.subject.getMatchesFor(`${publishDir}/index.html`)
    assert.deepEqual(matches, ["${env:SITE_TITLE}", "${env:APP_ENDPOINT}"])
  })
})
