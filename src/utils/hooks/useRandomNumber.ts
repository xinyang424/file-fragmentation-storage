/**
 * 传入最大值和最小值，返回其构成的区间范围内的随机数
 * @param max 最大值
 * @param min 最小值，非必传，默认值为 0
 * @returns 返回其构成的区间范围内的随机数，包括最大值和最小值
 */
export const useRandomNumber: (min: number, max: number) => number = (max, min = 0) => {
  return Math.floor(Math.random() * (max - min) + min);
};
