const { it, describe } = require("mocha")
const assert = require("assert")
const Path = require("path")
const Utils = require("../lib/utils")

describe("utils", () => {
  it("return absolute path to file", () => {
    assert.equal(Utils.cwd("somefile"), Path.join(process.cwd(), "somefile"))
  })
  it("returns uniq items from array", () => {
    assert.deepEqual(Utils.uniq([1, 2, 4, 4, 2, 6, 7]), [1, 2, 4, 6, 7])
  })
})
