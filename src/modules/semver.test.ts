import { assertEquals, assertThrows } from "../../deps.ts";
import { compareSemver, operation, preVersion } from "./semver.ts";

/**
 * compareSemver
 */
Deno.test({
  name: "compareSemver 对比符测试",
  fn: () => {
    assertEquals(compareSemver("1.10.6", "1.10.1", ">"), 1);
    assertEquals(compareSemver("1.10.1", "1.10.6", "<"), 1);
    assertEquals(compareSemver("1.10.6", "1.10.6", "="), 1);
    assertEquals(compareSemver("1.10.6", "1.10.6", "=="), 1);
    assertEquals(compareSemver("1.10.7", "1.10.6", "!="), 1);
    assertEquals(compareSemver("1.10.6", "1.10.1", ">="), 1);
    assertEquals(compareSemver("1.10.1", "1.10.6", "<="), 1);
    assertEquals(compareSemver("1.10.6", "1.10.1", "gt"), 1);
    assertEquals(compareSemver("1.10.1", "1.10.6", "le"), 1);
    assertEquals(compareSemver("1.10.6", "1.10.6", "eq"), 1);
    assertEquals(compareSemver("1.10.7", "1.10.6", "neq"), 1);
    assertEquals(compareSemver("1.10.6", "1.10.1", "ge"), 1);
    assertEquals(compareSemver("1.10.6", "1.10.6", "ge"), 1);
    assertEquals(compareSemver("1.10.1", "1.10.6", "le"), 1);
    assertEquals(compareSemver("1.10.1", "1.10.6", "le"), 1);
    assertEquals(compareSemver("1.10.6", "1.10.1", "="), 0);
  },
});

Deno.test({
  name: "主版本号Error - x.y.z不符合格式",
  fn: () => {
    assertThrows(
      () => compareSemver("1.10.6", "1.10", "="),
      Error,
      "版本号不符合X.Y.Z格式"
    );
  },
});

Deno.test({
  name: "主版本号Error - x.y.z只允许有一个短横线",
  fn: () => {
    assertThrows(
      () => compareSemver("1.10.6", "1.10.2-s-f", "="),
      Error,
      "版本号内只允许有一个短横线"
    );
  },
});

Deno.test({
  name: "主版本号Error - x.y.z带字符",
  fn: () => {
    assertThrows(
      () => compareSemver("1.10.6", "1.10.1ss", "="),
      Error,
      "版本号 major.minor.patch 中不能有数字以外的字符"
    );
  },
});

// 版本号对比
function compareSemverTest(
  param1: string,
  param2: string,
  operation: operation,
  result: -1 | 0 | 1,
  preVersion?: preVersion
) {
  Deno.test({
    name: `版本号对比 - ver1: ${param1} ver2: ${param2} operation: ${operation} | [${result}]`,
    fn: () => {
      if (typeof preVersion !== "undefined")
        assertEquals(
          compareSemver(param1, param2, operation, preVersion),
          result
        );
      else assertEquals(compareSemver(param1, param2, operation), result);
    },
  });
}

compareSemverTest("1.10.6", "1.10.6", "=", 1);
compareSemverTest("1.10.6-latest", "1.10.6-stable", "=", -1);
compareSemverTest("1.10.6-latest", "1.10.6-stable", ">", -1);
compareSemverTest("1.10.6-latest", "1.10.6-latest.0", "=", -1);
compareSemverTest("1.10.6-latest", "1.10.6-latest.0.0", "=", -1);
compareSemverTest("1.10.6-latest.1", "1.10.6-latest.0.0", ">", 1);
compareSemverTest("1.10.6-latest.0", "1.10.6-latest.0.0", "==", 1);
compareSemverTest("1.10.6-test.1", "1.10.6-test.1.0", "==", 1);
compareSemverTest("1.10.6-test.1", "1.10.6-noe.1", "!=", -1);
compareSemverTest("1.10.6-test.1", "1.10.6-noe.1", "==", 1, { tag: false });
compareSemverTest("1.10.6-test.1", "1.10.6-noe.2", "<", 1, { tag: false });
compareSemverTest("1.10.6-test.1", "1.10.6-noe.2", "==", 0, { tag: false });
compareSemverTest("1.10.6-test.1", "1.10.6-noe.2", "==", 1, {
  tag: false,
  version: false,
});
compareSemverTest("1.10.7-test.1", "1.10.6-noe.2", "gt", 1, {
  tag: false,
  version: false,
});
compareSemverTest("1.10.7-test.1", "1.10.6-test.2", "gt", 1, {
  version: false,
});
compareSemverTest("1.10.6-test.1", "1.10.6-noe.2", "eq", -1, {
  version: false,
});
compareSemverTest("1.10.6-1", "1.10.6-1.0", "eq", 1, {
  version: false,
});
compareSemverTest("1.10.6-1", "1.10.6-1.0", "eq", 1, false);
compareSemverTest("1.10.6-1", "1.10.6-1.0", "eq", 1, true);
compareSemverTest("1.10.6-d256kns", "1.10.6-d256kns", "eq", 1, true);
compareSemverTest("1.10.6-d256kns", "1.10.6-d256kns.1", "<", -1, true);
compareSemverTest("1.10.6-d256kns.0", "1.10.6-d256kns.1", "<", 1, true);
compareSemverTest("1.10.6-d256kns.0", "1.10.6-d256kns.1.tte", "<", -1, true);
compareSemverTest("1.10.6-d256kns.0.tte", "1.10.6-d256kns.1", "<", -1, true);
