<template>
  <view class="uni-container">
    <uni-forms ref="form" :value="formData" validate-trigger="submit" err-show-type="toast">
      <uni-forms-item name="content" label="举报原因" required>
        <picker mode="selector" :range="['人身攻击', '违法违规', '广告','错误信息']"
          @change="(e) => formData.reason = ['人身攻击', '违法违规', '广告','错误信息'][e.detail.value]">
          <view class="picker">
            {{ formData.reason || '请选择举报原因' }}
          </view>
        </picker>
      </uni-forms-item>

      <uni-forms-item name="content" label="举报阐述" required>
        <textarea @input="binddata('content', $event.detail.value)" class="uni-textarea-border"
          v-model="formData.content" trim="right"></textarea>
      </uni-forms-item>
      <uni-forms-item name="imgs" label="说明图片">
        <uni-file-picker file-mediatype="image" :limit="6" return-type="array" v-model="formData.imgs">
        </uni-file-picker>
      </uni-forms-item>
      <view class="uni-button-group">
        <button type="primary" class="uni-button" @click="submit">提交</button>
      </view>
    </uni-forms>
  </view>
</template>

<script>
  const db = uniCloud.database();
  const dbCollectionName = 'reports';
  const uniIdCo = uniCloud.importObject("uni-id-co");
  import {
    store
  } from '@/uni_modules/uni-id-pages/common/store.js';
  export default {
    data() {
      let formData = {
        "content": "",
        "reason": "",
        "imgs": [],
        "nickname": "",
        "created_at": "",
        "status": 0,
        "type": "",
        "reported_id": ""
      }
      return {
        formData,
        formOptions: {},
      }
    },
    computed: {
      userInfo() {
        return store.userInfo;
      }
    },
    onLoad(options) {
      this.formData.reported_id = options.reported_id;
      this.formData.type = options.type;
      this.getUserNickname(this.userInfo._id);
      uni.setNavigationBarTitle({
        title: '填写举报单' // 替换为你的标题
      });
    },
    methods: {

      getUserNickname(userId) {
        return db.collection("uni-id-users").where({
            _id: userId
          })
          .field('nickname')
          .get()
          .then((res) => {
            if (res.result.data && res.result.data.length > 0) {
              const user = res.result.data[0];
              this.formData.nickname = user.nickname;
            }
          })
          .catch((error) => {
            console.error("获取用户信息失败:", error);
            return '匿名用户';
          });
      },
      submit() {
        this.formData.created_at = new Date().toISOString();
        this.submitForm(this.formData).catch(() => {
          uni.hideLoading()
        })
      },

      submitForm(value) {
        // 使用 clientDB 提交数据
        db.collection(dbCollectionName).add(value).then((res) => {
          uni.showToast({
            icon: 'none',
            title: '提交成功'
          })
          this.getOpenerEventChannel().emit('refreshData')
          setTimeout(() => uni.navigateBack(), 500)
        }).catch((err) => {
          uni.showModal({
            content: err.message || '请求服务失败',
            showCancel: false
          })
        }).finally(() => {
          uni.hideLoading()
        })
      }
    }
  }
</script>

<style>
  .picker {
    width: 93%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;

  }

  .uni-container {
    padding: 15px;
  }

  .uni-input-border,
  .uni-textarea-border {
    width: 100%;
    font-size: 14px;
    color: #666;
    border: 1px #e5e5e5 solid;
    border-radius: 5px;
    box-sizing: border-box;
  }

  .uni-input-border {
    padding: 0 10px;
    height: 35px;

  }

  .uni-textarea-border {
    padding: 10px;
    height: 80px;
  }

  .uni-button-group {
    margin-top: 50px;
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    justify-content: center;
  }

  .uni-button {
    width: 184px;
    padding: 12px 20px;
    font-size: 14px;
    border-radius: 4px;
    line-height: 1;
    margin: 0;
  }
</style>