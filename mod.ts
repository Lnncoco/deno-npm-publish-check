import {
  initDATA,
  jsoncParser,
  processUpdateList,
  loopGetPackageVersion,
  loopTriggerJenkins,
} from "./src/launch.ts";
import type { curPackageItem } from "./src/launch.ts";

/**
 * npmPublishCheck
 */
export default (configData: string) => {
  let DATA = initDATA(jsoncParser(configData));

  /**
   * 初始化
   * @param configData
   */
  const setConfig = (configData: string) => {
    DATA = initDATA(jsoncParser(configData));
  };

  /**
   * 扫描指定tag
   * @param tagsList
   * @param callback 返回当进度信息
   */
  const findData = async (
    tagsList: string[],
    callback?: (text: string) => void
  ) => {
    if (!DATA) throw Error(`DATA 数据未初始化`);
    let packageData = DATA.findData(tagsList);
    packageData = await loopGetPackageVersion(packageData, callback);
    return processUpdateList(packageData);
  };

  /**
   * 触发Jenkins
   * @param selected
   * @param callback 返回当进度信息
   */
  const triggerJenkins = async (
    selected: curPackageItem[],
    callback?: (text: string) => void
  ) => {
    return await loopTriggerJenkins(selected, callback);
  };

  return {
    setConfig,
    findData,
    triggerJenkins,
  };
};
