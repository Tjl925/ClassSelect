<template>
  <view class="form-container">
    <form @submit.prevent="submitMaterialInfo" class="form-content">
      <uni-forms-item name="imgs" label="(可选)">
        <uni-file-picker file-mediatype="image" :limit="1" return-type="array" v-model="material.material_image">
        </uni-file-picker>
      </uni-forms-item>
      <view class="form-item">
        <view class="row">
          <image class="icon" src="/static/material.png"></image>
          <text class="label">资料名：</text>
        </view>
        <input v-model="material.material_name" placeholder="请输入资料名" required />
      </view>
      <view class="form-item">
        <view class="row">
          <image class="icon" src="/static/category.png"></image>
          <text class="label">资料类别：</text>
        </view>
        <picker mode="selector" :range="['其他', '各类表单', '实验报告', '往年试卷', '竞赛','考研','课件','课后答案','软件','重点总结']"
          @change="(e) => material.category = ['其他', '各类表单', '实验报告', '往年试卷', '竞赛','考研','课件','课后答案','软件','重点总结'][e.detail.value]">
          <view class="picker">
            {{ material.category || '请选择资料类别' }}
          </view>
        </picker>
      </view>
      <view class="form-item">
        <view class="row">
          <image class="icon" src="/static/course.png"></image>
          <text class="label">相关课程：</text>
        </view>
        <input v-model="material.course_name" placeholder="请输入相关课程" required />
      </view>
      <view class="form-item">
        <view class="row">
          <image class="icon" src="/static/link.png"></image>
          <text class="label">下载链接：</text>
        </view>
        <input v-model="material.download_link" placeholder="请输入下载链接" required />
      </view>
      <view class="button-group">
        <button @click="navBack()" class="back-btn">返回</button>
        <button form-type="submit" class="submit-btn">提交</button>
      </view>
    </form>
  </view>
</template>

<script>
  const uniIdCo = uniCloud.importObject("uni-id-co");
  const db = uniCloud.database();
  import {
    store
  } from '@/uni_modules/uni-id-pages/common/store.js';

  export default {
    data() {
      return {
        material: {
          material_name: '',
          course_name: '',
          category: '',
          material_image: [],
          download_link: '',
          article_status: 1,
        }
      };
    },
    computed: {
      userInfo() {
        return store.userInfo;
      }
    },
    onLoad() {
      uni.setNavigationBarTitle({
        title: '上传资料信息' // 替换为你的标题
      });
    },
    methods: {
      navBack() {
        uni.navigateBack();
      },
      async submitMaterialInfo() {
        try {
          uni.showLoading({
            title: '提交中...',
            mask: true
          });

          // 获取当前用户ID

          // 合并资料信息与创建者ID
          const materialData = {
            creator_id: this.userInfo._id,
            created_at: new Date().toISOString(),
            material_name: this.material.material_name,
            course_name: this.material.course_name,
            category: this.material.category,
            material_image: this.material.material_image,
            download_link: this.material.download_link,
            article_status: 1,
          };

          // 调用数据库操作创建新课程
          const result = await db.collection('materials').add(materialData);

          if (result.result.id) {
            uni.showToast({
              title: '创建成功',
              icon: 'success'
            });
            // 清空表单数据
            this.material = {
              material_name: '',
              course_name: '',
              category: '',
              material_image: [],
              download_link: ''
            };
            setTimeout(() => {
              uni.navigateBack();
            }, 2000);
          } else {
            throw new Error('创建成功');
          }
        } catch (error) {
          console.error('提交资料信息失败:', error);
          uni.showToast({
            title: error.message || '提交失败',
            icon: 'none'
          });
        } finally {
          uni.hideLoading();
          setTimeout(() => {
            uni.switchTab({
              url: "/pages/material/material"
            })
          }, 2500);
        }
      }
    }
  };
</script>

<style scoped>
  .form-container {
    padding: 20px;
    margin-left: auto;
    margin-right: auto;
  }

  .form-item {
    margin-bottom: 20px;
    margin-left: auto;
    margin-right: auto;
  }

  .form-content {
    margin: auto;
  }

  .row {
    display: flex;
    /* 使用 Flex 布局 */
    align-items: center;
    /* 垂直方向居中 */
  }

  .icon {
    width: 30px;
    height: 30px;
    margin-right: 5px;
    margin-bottom: 5px;
    /* 调整图标与文字的间距 */
  }

  .label {
    margin-bottom: 5px;
    font-weight: bold;
  }

  input {
    width: 90%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
  }

  .submit-btn {
    width: 40%;
    padding: 10px;
    background-color: #007aff;
    color: white;
    border: none;
    border-radius: 5px;
    text-align: center;
  }

  .back-btn {
    width: 40%;
    padding: 10px;
    background-color: white;
    color: #007aff;
    border: none;
    border-radius: 5px;
    text-align: center;
  }

  .button-group {
    display: flex;
    flex-direction: row;
  }

  .picker {
    width: 90%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
  }
</style>