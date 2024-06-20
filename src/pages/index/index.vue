<template>
  <view class="page">
    <view class="img-container" :style="{ '--img-base64': `url(${imgBase64})` }"></view>
    <view class="btn-container">
      <button @click="takePhoto">拍摄照片</button>
      <button @click="loadPhoto">加载图片</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useFileHandle } from "@/utils/hooks";
const imgBase64 = ref<string>("");

const saveImgList = reactive<SplitFile[]>([]);

const { useReadFile, useSplitBase64AndSave, useCheckFileIfExit, useAssemblyFile, useDeleteFile } = useFileHandle();

/**
 * 拍摄图片
 */
const takePhoto = () => {
  uni.chooseImage({
    count: 1,
    sourceType: ["camera"],
    success: async (chooseImgSuccess: UniApp.ChooseImageSuccessCallbackResult) => {
      const filePath = chooseImgSuccess.tempFilePaths[0] as string;
      const base64String = await useReadFile(filePath);
      useDeleteFile(filePath);
      if (!base64String) {
        uni.showToast({
          icon: "none",
          title: "文件读取失败",
        });
        return;
      }
      const saveList = await useSplitBase64AndSave(base64String, new Date().getTime().toString());
      saveImgList.length = 0;
      saveImgList.push(...saveList);
      uni.showToast({
        icon: "none",
        title: "文件分片存储完成",
      });
    },
  });
};

/**
 * 加载图片
 */
const loadPhoto = async () => {
  if (!saveImgList.length) {
    uni.showToast({
      icon: "none",
      title: "文件存储列表为空",
    });
    return;
  }
  uni.showLoading({
    title: "加载中",
  });
  const ifExsit = await useCheckFileIfExit(saveImgList.map(ele => ele.path));
  if (!ifExsit) {
    uni.hideLoading();
    uni.showToast({
      icon: "none",
      title: "该文件不存在",
    });
    return;
  }
  const fullBase64 = await useAssemblyFile(saveImgList);
  imgBase64.value = fullBase64;

  uni.hideLoading();
  uni.showToast({
    icon: "none",
    title: "文件读取完成",
  });
};
</script>

<style lang="scss">
.page {
  display: flex;
  flex-direction: column;
  padding: calc(20rpx + var(--status-bar-height)) 20rpx 20rpx;
  .img-container {
    width: 100%;
    height: 400rpx;
    border: 5rpx dashed #eee;
    background: no-repeat center/80% var(--img-base64);
  }
  .btn-container {
    margin-top: 80rpx;
    & > button {
      color: #fff;
      width: 60%;
    }
    & > button:nth-child(2n + 1) {
      background-color: #01beff;
      margin-bottom: 50rpx;
    }
    & > button:nth-child(2n) {
      background-color: #00d886;
    }
  }
}
</style>
