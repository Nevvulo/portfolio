import { joinClasses } from "./dom";

describe("DOM utilities", () => {
  describe("joinClasses", () => {
    it("should return empty string when empty string is provided", () => {
      expect(joinClasses("")).toStrictEqual("");
    });
    it("should return same string when second parameter is not provided", () => {
      expect(joinClasses("test")).toStrictEqual("test");
    });
    it("should join 2 class names together", () => {
      expect(joinClasses("test", "test2")).toStrictEqual("test test2");
    });
    it("should join 3 class names together", () => {
      expect(joinClasses("test", "test2", "test3")).toStrictEqual("test test2 test3");
    });
  });
});
