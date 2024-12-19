<template>
  <view class="form-container">
    <form @submit.prevent="submitMaterialInfo" class="form-content">
      <uni-forms-item name="imgs" label="资料图片(可选)">
        <uni-file-picker file-mediatype="image" :limit="1" return-type="array" v-model="material.material_image">
        </uni-file-picker>
      </uni-forms-item>
      <view class="form-item">
        <view class="row">
          <image class="icon" src="/static/material.png"></image>
          <text class="label">资料名：</text>
        </view>
        <input v-model="material.material_name" placeholder={{material_name}} required />
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
        <input v-model="material.course_name" placeholder={{course_name}} required />
      </view>
      <view class="form-item">
        <view class="row">
          <image class="icon" src="/static/link.png"></image>
          <text class="label">下载链接：</text>
        </view>
        <input v-model="material.download_link" placeholder={{download_link}} required />
      </view>
      <view class="button-group">
        <button @click="navBack()" class="back-btn">返回</button>
        <button @click="submitMaterialInfo()" class="submit-btn">提交</button>
      </view>
      <view class="button-group">
        <button @longpress="deleteMaterial()" class="delete-btn">长按以删除</button>
      </view>
    </form>
  </view>
</template>

<script>
  const db = uniCloud.database();
  export default {
    data() {
      return {
        material: {
          created_at: '',
          material_name: '',
          _id: '',
          category: '',
          course_name: '',
          material_image: [],
          download_link: ''
        }

      }
    },
    methods: {
      deleteMaterial() {
        uni.showModal({
          title: '确认删除',
          content: '确定要删除这个资料吗？',
          success: async (res) => {
            if (res.confirm) {
              try {
                uni.showLoading({
                  title: '删除中...',
                  mask: true
                });

                const result = await db.collection('materials').doc(this._id).remove();
                console.log(result);

                if (result.result.deleted === 1) {
                  uni.showToast({
                    title: '删除成功',
                    icon: 'success'
                  });
                  // 删除成功后返回上一页
                  setTimeout(() => {
                    uni.switchTab({
                      url: "/pages/material/material"
                    });
                  }, 2000);
                } else {
                  throw new Error('删除失败');
                }
              } catch (error) {
                console.error('删除资料失败:', error);
                uni.showToast({
                  title: error.message || '删除失败',
                  icon: 'none'
                });
              } finally {
                uni.hideLoading();
              }
            } else if (res.cancel) {
              console.log('用户取消删除');
            }
          }
        });
      },

      async fetchMaterialDetails() {
        try {
          const result = await db.collection('materials').doc(this._id).get();
          console.log(result);
          // 检查 result.data 是否存在并且是数组
          if (result.result.data && Array.isArray(result.result.data) && result.result.data.length > 0) {
            const materialData = result.result.data[0];
            this.material = {
              material_name: materialData.material_name || '',
              category: materialData.category || '',
              course_name: materialData.course_name || '',
              material_image: materialData.material_image || [],
              download_link: materialData.download_link || ''
            };
          } else {
            throw new Error('未找到资料信息');
          }
        } catch (error) {
          console.error('获取资料信息失败:', error);
          uni.showToast({
            title: '获取资料信息失败',
            icon: 'none'
          });
        }
      },
      async submitMaterialInfo() {
        try {
          uni.showLoading({
            title: '提交中...',
            mask: true
          });

          // 更新资料信息
          const result = await db.collection('materials').doc(this._id).update({
            material_image: this.material.material_image,
            material_name: this.material.material_name,
            category: this.material.category,
            course_name: this.material.course_name,
            download_link: this.material.download_link
          });
          console.log(result);
          if (result.result.updated) {
            uni.showToast({
              title: '修改成功',
              icon: 'success'
            });
            // 修改成功后返回上一页
            setTimeout(() => {
              uni.navigateBack();
            }, 2000);
          } else {
            throw new Error('修改失败');
          }
        } catch (error) {
          console.error('提交资料信息失败:', error);
          uni.showToast({
            title: error.message || '提交失败',
            icon: 'none'
          });
        } finally {
          uni.hideLoading();
        }
      },

      navBack() {
        uni.navigateBack();
      }
    },

    onLoad(options) {
      this._id = options._id;

      uni.setNavigationBarTitle({
        title: '修改资料信息' // 替换为你的标题
      });

      this.fetchMaterialDetails();
    }
  }
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

  .delete-btn {
    margin-top: 20px;
    width: 90%;
    padding: 10px;
    background-color: red;
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