const { sqlForPartialUpdate } = require("./sql");


describe("sqlForPartialUpdate", function () {
  test("works with only 1 item", function () {
    const result = sqlForPartialUpdate(
        { data: "data" },
        { numEmployees: "num_employees"});
    expect(result).toEqual({
      setCols: "\"num_employees\"=$1",
      values: ["data"],
    });
  });

  test("works with only 2 items", function () {
    const result = sqlForPartialUpdate(
        { f1: "v1", jsF2: "v2" },
        { jsF2: "f2" });
    expect(result).toEqual({
      setCols: "\"f1\"=$1, \"f2\"=$2",
      values: ["v1", "v2"],
    });
  });
});
