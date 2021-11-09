import { assertEquals, assertThrows, assertObjectMatch } from "../../deps.ts";
import {
  toNumber,
  isNumber,
  canBeNumber,
  parseVersion,
  compare,
} from "./semver.ts";

/**
 * toNumber
 */
Deno.test({
  name: "toNumber - 字符串",
  fn: () => {
    assertEquals(toNumber("157"), 157);
    assertEquals(toNumber("0"), 0);
  },
});

Deno.test({
  name: "toNumber - 数字",
  fn: () => {
    assertEquals(toNumber(157), 157);
    assertEquals(toNumber(0), 0);
  },
});

Deno.test({
  name: "toNumber - 非数字字符",
  fn: () => {
    assertEquals(toNumber(""), NaN);
    assertEquals(toNumber("1t57"), NaN);
    assertEquals(toNumber("157m"), NaN);
    assertEquals(toNumber("157 "), NaN);
    assertEquals(toNumber("+1t57"), NaN);
    assertEquals(toNumber("-1t57"), NaN);
  },
});

Deno.test({
  name: "isNumber - 正确数字",
  fn: () => {
    assertEquals(isNumber(213), true);
    assertEquals(isNumber(0), true);
  },
});

Deno.test({
  name: "isNumber - 非正确数字",
  fn: () => {
    assertEquals(isNumber(""), false);
    assertEquals(isNumber("+0"), false);
    assertEquals(isNumber(NaN), false);
    assertEquals(isNumber(null), false);
    assertEquals(isNumber(undefined), false);
  },
});

Deno.test({
  name: "canBeNumber - 能转换为数字",
  fn: () => {
    assertEquals(canBeNumber(1), true);
    assertEquals(canBeNumber("1"), true);
    assertEquals(canBeNumber("0"), true);
  },
});

Deno.test({
  name: "canBeNumber - 不能转换为数字",
  fn: () => {
    assertEquals(canBeNumber(NaN), false);
    assertEquals(canBeNumber("+1"), false);
    assertEquals(canBeNumber("-1"), false);
  },
});

/**
 * compare
 */
Deno.test({
  name: "compare - 符合预期",
  fn: () => {
    assertEquals(compare(1, 1, "gt"), 0);
    assertEquals(compare(1, 1, "lt"), 0);
    assertEquals(compare(1, 1, "eq"), 1);
    assertEquals(compare(1, 1, "neq"), 0);
    assertEquals(compare(1, 1, "ge"), 1);
    assertEquals(compare(1, 1, "le"), 1);

    assertEquals(compare("", "", "eq"), 1);
    assertEquals(compare("nono", "nono", "le"), -1);
    assertEquals(compare("nono", "nono", "eq"), 1);
    assertEquals(compare("nono", "nono1", "neq"), 1);
  },
});

Deno.test({
  name: "compare - 不符合预期",
  fn: () => {
    assertEquals(compare("1", 1, "gt"), -1);
    assertEquals(compare("1", "1", "gt"), -1);
    assertEquals(compare(1, "1", "lt"), -1);
    assertEquals(compare(1, 1, "neq"), 0);
    assertEquals(compare(1, 2, "eq"), 0);
  },
});

/**
 * parseVersion
 */
Deno.test({
  name: "compare - x.y.z不符合格式 x.y",
  fn: () => {
    assertThrows(() => parseVersion("1.10"), Error, "版本号不符合X.Y.Z格式");
  },
});

Deno.test({
  name: "compare - x.y.z不符合格式 x.y.z.n",
  fn: () => {
    assertThrows(
      () => parseVersion("1.10.4.4"),
      Error,
      "版本号不符合X.Y.Z格式"
    );
  },
});

Deno.test({
  name: "compare - x.y.z只允许有一个短横线",
  fn: () => {
    assertThrows(
      () => parseVersion("1.10.4-latest-bate"),
      Error,
      "版本号内只允许有一个短横线"
    );
  },
});

Deno.test({
  name: "compare - x.y.z带字符",
  fn: () => {
    assertThrows(
      () => parseVersion("1.10.4b"),
      Error,
      "版本号 major.minor.patch 中不能有数字以外的字符"
    );
  },
});

Deno.test({
  name: "compare - 版本号中.符号不能相连",
  fn: () => {
    assertThrows(
      () =>
        assertObjectMatch(parseVersion("1.5.6-1..1d35k623.n"), {
          major: 1,
          minor: 5,
          patch: 6,
          preVersion: { version: [1, "1d35k623", "n"] },
        }),
      Error,
      "版本号中.符号不能相连"
    );
  },
});

Deno.test({
  name: "compare - 正确解析",
  fn: () => {
    assertObjectMatch(parseVersion("1.5.6"), { major: 1, minor: 5, patch: 6 });
    assertObjectMatch(parseVersion("1.5.6-latest"), {
      major: 1,
      minor: 5,
      patch: 6,
      preVersion: { tag: "latest" },
    });
    assertObjectMatch(parseVersion("1.5.6-latest.1.2.4.7"), {
      major: 1,
      minor: 5,
      patch: 6,
      preVersion: { tag: "latest", version: [1, 2, 4, 7] },
    });
    assertObjectMatch(parseVersion("1.5.6-latest.1d35k623"), {
      major: 1,
      minor: 5,
      patch: 6,
      preVersion: { tag: "latest", version: ["1d35k623"] },
    });
    assertObjectMatch(parseVersion("1.5.6-latest.1d35k623.n"), {
      major: 1,
      minor: 5,
      patch: 6,
      preVersion: { tag: "latest", version: ["1d35k623", "n"] },
    });

    assertObjectMatch(parseVersion("1.5.6-1d35k623.n"), {
      major: 1,
      minor: 5,
      patch: 6,
      preVersion: { tag: "1d35k623", version: ["n"] },
    });

    assertObjectMatch(parseVersion("1.5.6-1.1d35k623.n"), {
      major: 1,
      minor: 5,
      patch: 6,
      preVersion: { version: [1, "1d35k623", "n"] },
    });

    assertObjectMatch(parseVersion("1.10.6-latest.0.0"), {
      major: 1,
      minor: 10,
      patch: 6,
      preVersion: { tag: "latest", version: [0, 0] },
    });
  },
});
