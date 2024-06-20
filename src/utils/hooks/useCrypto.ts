import { SM4 } from "gm-crypto";

const publicKey = "0123456789abcdeffedcba9876543210";

/**
 * 数据加密
 * @param data 加密或解密的数据——string or object
 * @param key  加密或解密的密钥——string
 * @param type 选择进行加密还是解密——string，"encrypt"-加密 "decrypt"-解密
 * @returns 加密或解密后的字符串结果
 */
export const useCrypto: (data: string | AnyObject, type?: "encrypt" | "decrypt") => string = (data, type = "encrypt") => {
  let res = "";
  const handleData = typeof data === "string" ? data : JSON.stringify(data);

  type === "encrypt"
    ? (res = SM4.encrypt(handleData, publicKey, {
        inputEncoding: "utf8",
        outputEncoding: "base64",
      }))
    : (res = SM4.decrypt(handleData, publicKey, {
        inputEncoding: "base64",
        outputEncoding: "utf8",
      }));

  return res;
};
