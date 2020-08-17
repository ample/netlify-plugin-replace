const { it, describe } = require("mocha")
const assert = require("assert")
const Path = require("path")
const Utils = require("../lib/utils")
const intercept = require("intercept-stdout")

describe("utils", () => {
  it("return absolute path to file", () => {
    assert.equal(Utils.cwd("somefile"), Path.join(process.cwd(), "somefile"))
  })
  it("returns uniq items from array", () => {
    assert.deepEqual(Utils.uniq([1, 2, 4, 4, 2, 6, 7]), [1, 2, 4, 6, 7])
  })
  it("pluralizes a string", () => {
    assert.equal(Utils.pluralize("egg", 5), "eggs")
    assert.equal(Utils.pluralize("egg", 1), "egg")
  })
  it("filters an object by property", () => {
    const obj = {
      one: [1, 2, 3],
      two: "something",
      three: false
    }
    assert.deepEqual(Utils.filterByProperty(obj, ["two", "three"]), {
      two: "something",
      three: false
    })
  })
  describe("log()", () => {
    it("displays messages via stdout", () => {
      const str = "ever thus to deadbeats, lebowski"
      let captured_text
      // Capture stdout
      var unhook_intercept = intercept(function (text) {
        captured_text += text
        return ""
      })
      Utils.log(str, true)

      // Stop capturing stdout.
      unhook_intercept()

      assert(captured_text.includes(str))
    })
  })
})
