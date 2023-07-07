// src/utils/stringUtils.ts

/**
 * 规范化字符串，去除空格和特殊字符
 * @param str 待规范化的字符串
 * @returns 规范化后的字符串
 */
export const normalizeString = (str: string): string => {
  return str
    .trim() // 去掉前后空格
    .toLowerCase() // 将字符串转为小写
    .replace(/[\s\-\_\,\.\/\\\(\)（）]/g, ""); // 去掉空格、-、_、,、.、/、\ 以及中英文括号
};
