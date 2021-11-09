import { displayLog } from "./utils.ts";
import { Checkbox, Toggle, colors } from "../../deps.ts";
import type { curPackageItem } from "./DATA.ts";

type selectIitem = ReturnType<typeof updatePackageText>[];
type printList = ReturnType<typeof updatePackageText>[];

/**
 * 升级包选择列表
 * @param list
 * @returns
 */
export const selectUpdatePackage = async (list: printList) => {
  let confirmed;
  let result;
  do {
    result = await Checkbox.prompt({
      message: "请选择需要更新的包:",
      options: processUpdatePackageName(list),
      hint: colors.gray("向上：k ↑, 向下：j ↓, 选中：空格, 确认：回车"),
      search: false,
      uncheck: " ",
      // info: true,
      keys: {
        next: ["down", "j"],
        previous: ["up", "k"],
      },
    });
    confirmed = await Toggle.prompt({
      message: "确认更新？ (Y/n)",
      active: "Yes",
    });
  } while (!confirmed);

  return result;
};

/**
 * 列表文本格式生成
 * @param data
 */
export const updatePackageText = (
  data: {
    packageName: string;
    tag: string;
    canUpdate: boolean;
    anomalyUpdate: boolean; // 版本号异常 如NPM仓库版本比Git版本超前
    publishVersion?: string;
    publishTime?: string;
    updateVersion?: string;
    error: boolean;
    errorMessage?: string;
    checked?: boolean; // canUpdate为1时 true
    disabled?: boolean; // Jenkins没配置则为 true
  },
  option = { time: true }
) => {
  const { time } = option;
  const timeSeparator = `  ${colors.gray("|")}  `;

  const publishTimeStr = data.publishTime ?? "-";
  const disabledColorFn = data.disabled ? colors.gray : colors.green; // 未配置Jenkins信息则为灰色
  const publishTime = time ? `${colors.gray(publishTimeStr)}` : false;

  let updateInfo: string;
  if (!data.error) {
    if (data.canUpdate)
      updateInfo = disabledColorFn(
        `(${data.publishVersion ?? "⁇"} → ${data.updateVersion})`
      );
    else if (data.anomalyUpdate)
      updateInfo = colors.gray(
        `(${data.publishVersion ?? "⁇"} > ${data.updateVersion})`
      );
    else updateInfo = colors.gray(`(${data.publishVersion ?? "⁇"})`);
  } else {
    updateInfo = colors.gray(`("‼") [${data.errorMessage ?? "unknown error"}]`);
  }

  return {
    packageName: data.packageName,
    name: data.packageName, // Checkbox 组件使用的值
    tag: data.tag,
    version: updateInfo,
    publishTime,
    timeSeparator,
    value: data.packageName,
    checked: !!data.checked,
    disabled: !!data.disabled,
  };
};

/**
 * 处理更新列表
 * @param data
 */
export const processUpdateList = (data: curPackageItem[]) => {
  /**
   * 待升级版本列表
   */
  const canCheckList: selectIitem = [];
  /**
   * 无需升级版本列表
   */
  const cannotCheckList: selectIitem = [];
  /**
   * 发布版本比仓库版本超前列表
   */
  const anomalyCheckList: selectIitem = [];
  /**
   * 获取版本信息错误列表
   */
  const errorCheckList: selectIitem = [];

  data.forEach((item) => {
    const textData = {
      packageName: item.name,
      tag: item.tag,
      publishVersion: item.publishVersion,
      publishTime: item.publishTime,
      updateVersion: item.gitVersion,
      errorMessage: item.errorMessage,
      error: item.fetchGitError ?? item.fetchRegistryError ?? false,
      disabled: !item.jenkins,
    };

    if (item.canUpdate === 1)
      canCheckList.push(
        updatePackageText({
          ...textData,
          anomalyUpdate: false,
          canUpdate: true,
          checked: true,
        })
      );
    else {
      const list = {
        ...textData,
        anomalyUpdate: item.anomalyUpdate === 1,
        canUpdate: false,
        checked: false,
      };
      if (item.publishVersion) {
        if (item.anomalyUpdate === 1)
          anomalyCheckList.push(updatePackageText(list));
        else cannotCheckList.push(updatePackageText(list));
      } else errorCheckList.push(updatePackageText(list, { time: false }));
    }
  });

  return { canCheckList, cannotCheckList, anomalyCheckList, errorCheckList };
};

/**
 * 展示版本信息 获取更新列表
 * @param data
 */
export const getUpdateList = async (data: curPackageItem[]) => {
  const { canCheckList, cannotCheckList, anomalyCheckList, errorCheckList } =
    processUpdateList(data);

  // 所有包获取信息正常 且都是最新的
  if (
    !canCheckList.length &&
    !errorCheckList.length &&
    !anomalyCheckList.length &&
    cannotCheckList.length
  )
    printUpdatePackageInfo(
      colors.bold.green("✔ 所有包都是最新的："),
      cannotCheckList
    );

  // 存在获取信息错误的包
  if (errorCheckList.length)
    printUpdatePackageInfo(
      colors.bold.yellow("❕检测失败："),
      errorCheckList,
      false
    );

  // 存在升级版本异常的包
  if (anomalyCheckList.length)
    printUpdatePackageInfo(
      colors.bold.yellow("❕存在NPM仓库比Git仓库版本超前的包："),
      anomalyCheckList,
      false
    );

  // 没有需要更新的包 则列出所有包信息
  if (!canCheckList.length) {
    let allList: selectIitem = [];
    if (cannotCheckList.length) allList = allList.concat(cannotCheckList);
    if (anomalyCheckList.length) allList = allList.concat(anomalyCheckList);
    if (errorCheckList.length) allList = allList.concat(errorCheckList);
    printUpdatePackageInfo(
      colors.bold.green("✔ 暂时没有需要更新的包："),
      allList
    );
  }

  // 存在需要更新的包 展示交互界面
  const selected = await selectUpdatePackage([
    ...canCheckList,
    ...cannotCheckList,
  ]);

  return data.filter((item) => selected.includes(item.name));
};

/**
 * 输出包信息
 * @param data
 */
export const displayPackageList = (data: curPackageItem[], msg?: string) => {
  const maxLength = data.reduce(
    (len, item) => {
      len.name = item.name.length > len.name ? item.name.length : len.name;
      if (item.publishVersion) {
        len.publishVersion =
          item.publishVersion.length > len.publishVersion
            ? item.publishVersion.length
            : len.publishVersion;
      }
      if (item.gitVersion) {
        len.gitVersion =
          item.gitVersion.length > len.gitVersion
            ? item.gitVersion.length
            : len.gitVersion;
      }
      return len;
    },
    { name: 0, publishVersion: 0, gitVersion: 0 }
  );
  const list: string[] = [];

  data.forEach((item) => {
    const flag = item.jenkinsTriggerError ? `❌  [${item.errorMessage}]` : "✔";
    const text = `${item.name.padEnd(
      maxLength.name
    )}  (${item.publishVersion?.padEnd(
      maxLength.publishVersion
    )} → ${item.gitVersion?.padEnd(maxLength.gitVersion)})  ${flag}`;
    list.push(text);
  });
  printInfo(msg ?? "Jenkins触发结果：", list);
};

/**
 * 将数据处理成显示所需的格式
 * @param list
 */
const processUpdatePackageName = (list: printList) => {
  const maxLength = list.reduce(
    (len, item) => {
      len.packageName =
        item.packageName.length > len.packageName
          ? item.packageName.length
          : len.packageName;
      len.tag = item.tag.length > len.tag ? item.tag.length : len.tag;
      len.version =
        item.version.length > len.version ? item.version.length : len.version;
      return len;
    },
    { packageName: 0, tag: 0, version: 0 }
  );

  list.forEach((item) => {
    const publishTimeText = item.publishTime
      ? `${item.timeSeparator}${item.publishTime}`
      : "";
    const text = `${item.packageName.padEnd(
      maxLength.packageName
    )}  ${item.tag.padEnd(maxLength.tag)}  ${item.version.padEnd(
      maxLength.version
    )}${publishTimeText}`;
    if (item.disabled) return colors.gray(text);
    item.name = text;
  });
  return list;
};

/**
 * 显示updatePackageText函数返回的信息
 * @param msg 输出文字
 * @param list 包列表
 * @param exit 是否退出
 */
const printUpdatePackageInfo = (msg: string, list: printList, exit = true) => {
  const stringList = processUpdatePackageName(list).map((item) => item.name);
  printInfo(msg, stringList, exit);
};

/**
 * 信息显示函数
 * @param msg 输出文字
 * @param list 包列表
 * @param exit 是否退出
 */
const printInfo = (msg: string, list: string[], exit = true) => {
  if (exit) Deno.stdout.writeSync(new TextEncoder().encode(`\x1b[2K`));
  displayLog("");
  displayLog(msg);
  list.forEach((item) => {
    displayLog(`   - ${item}`);
  });
  displayLog("");
  if (exit) Deno.exit(0);
};
