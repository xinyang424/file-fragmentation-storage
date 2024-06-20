import { useRandomNumber } from "./useRandomNumber";
import { useCrypto } from "./useCrypto";

/**
 * 创建文件阅读器，根据存储的路径读取文件，返回base64或者文本内容
 * @param path 文件存储的路径
 * @param readAsText 是否读取为text文本，非必传，默认为false，false-读取为base64，true读取为文本内容
 * @returns 读取为文本内容或者base64
 */
export const useReadFile = (path: string, readAsText?: boolean): Promise<string> => {
  return new Promise((resolve, reject) => {
    plus.io.requestFileSystem(
      plus.io.PRIVATE_DOC,
      (fs: PlusIoFileSystem) => {
        fs.root?.getFile(
          path,
          { create: false },
          (fileEntry: PlusIoFileEntry) => {
            fileEntry.file(
              (file: PlusIoFile) => {
                const fileReader: PlusIoFileReader = new plus.io.FileReader();
                fileReader.onloadend = (evt: PlusIoFileEvent) => {
                  // @ts-ignore
                  let base64String = evt.target?.result;
                  resolve(base64String);
                };
                readAsText ? fileReader.readAsText(file) : fileReader.readAsDataURL(file, "utf-8");
              },
              fileError => {
                reject("获取文件对象失败：" + fileError);
              },
            );
          },
          fileEntryError => {
            reject("读取文件失败：" + fileEntryError);
          },
        );
      },
      fsError => {
        reject("读取文件失败：" + fsError);
      },
    );
  });
};

/**
 * 删除文件，支持删除单个路径或者文件夹下的所有文件
 * @param path 要删除的路径
 * @returns 是否删除成功
 */
export const useDeleteFile = (path: string): Promise<boolean> => {
  return new Promise(resolve => {
    plus.io.requestFileSystem(
      plus.io.PRIVATE_DOC,
      (fs: PlusIoFileSystem) => {
        fs.root?.getFile(
          path,
          { create: false },
          (fileEntry: PlusIoFileEntry) => {
            fileEntry.remove(
              () => {
                resolve(true);
              },
              () => {
                resolve(false);
              },
            );
          },
          () => {
            // 根据路径找不到文件
            resolve(true);
          },
        );
      },
      error => {
        resolve(false);
      },
    );
  });
};

/**
 * 将base64进行随机分块，截取，并存储。
 * @param base64String
 * @param fullFilename
 * @returns 返回每一块存储的路径，以及每一块截取出来经过 sm4 加密后的结果
 * 返回示例：
 * [
 *    {
 *      "path": "",
 *      "extractContent": ""
 *    }
 * ]
 */
export const useSplitBase64AndSave = async (base64String: string, fullFilename: string): Promise<SplitFile[]> => {
  const len = base64String.length;
  const splitNumber = useRandomNumber(2, 4);
  const eachPartLength = Math.ceil(len / splitNumber);
  const allBase64PartList = new Array(splitNumber);
  for (let index = 0; index < splitNumber; index++) {
    allBase64PartList[index] = base64String.slice(index * eachPartLength, eachPartLength * (index + 1));
  }

  const handleAllPart = allBase64PartList.map((base64: string) => {
    const extractLength = useRandomNumber(20, 60);
    const extractStr = base64.slice(0, extractLength);

    return {
      path: "",
      base64: base64.slice(extractLength),
      extractContent: useCrypto(extractStr),
    };
  });

  const promiseList: Promise<SplitFile>[] = handleAllPart.map((element: SplitFile, index) => {
    return new Promise(resolve => {
      plus.io.requestFileSystem(
        plus.io.PRIVATE_DOC,
        (fs: PlusIoFileSystem) => {
          const filepath = "_doc/" + fullFilename + (index + 1) * 20;
          fs.root?.getFile(
            filepath,
            { create: true },
            (fileEntry: PlusIoFileEntry) => {
              fileEntry.createWriter(
                res => {
                  res.write(element.base64 || "");
                  res.onwrite = event => {
                    element.path = filepath;
                    delete element.base64;
                    resolve(element);
                    // console.log("文件写入完成", event);
                  };
                },
                error => {
                  resolve(element);
                },
              );
            },
            fileEntryError => {
              resolve(element);
              // console.log("读取文件失败：" + fileEntryError);
            },
          );
        },
        fsError => {
          resolve(element);
          // console.log("读取文件失败：" + fsError);
        },
      );
    });
  });
  const pathList = await Promise.all(promiseList);
  return pathList;
};

/**
 * 根据传入的文件存储路径验证该文件是否存在
 * @param path 存储的文件路径，类型：string | string[]
 * @returns 是否存在，true为存在，false 不存在
 */
export const useCheckFileIfExit = async (path: string | string[]): Promise<boolean> => {
  const pathList = typeof path === "string" ? [path] : path;
  const pathPromiseList: Promise<boolean>[] = pathList.map(
    item =>
      new Promise(resolve => {
        plus.io.requestFileSystem(
          plus.io.PRIVATE_DOC,
          (fs: PlusIoFileSystem) => {
            fs.root?.getFile(
              item,
              { create: false },
              res => {
                resolve(true);
              },
              error => {
                resolve(false);
              },
            );
          },
          () => {
            resolve(false);
          },
        );
      }),
  );
  const checkAllExists: boolean[] = await Promise.all(pathPromiseList);
  return !checkAllExists.includes(false);
};

/**
 * 根据传入的分块存储信息和截取加密内容，重新将文件组装起来
 * @param pathList 分块存储信息和截取加密内容
 * @returns 组装完成的base64
 */
export const useAssemblyFile = async (pathList: SplitFile[]): Promise<string> => {
  const promiseList = pathList.map(
    ele =>
      new Promise(async resolve => {
        useReadFile(ele.path, true).then((base64: string) => {
          const originExtractContent = useCrypto(ele.extractContent, "decrypt");
          resolve(originExtractContent + base64);
        });
      }),
  );
  const base64List = await Promise.all(promiseList);
  const fullBase64 = base64List.join("");
  return fullBase64;
};

export const useFileHandle = () => {
  return {
    useReadFile,
    useSplitBase64AndSave,
    useCheckFileIfExit,
    useAssemblyFile,
    useDeleteFile,
  };
};
