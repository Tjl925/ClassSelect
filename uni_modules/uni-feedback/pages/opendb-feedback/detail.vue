<template>
  <view class="container">
    <unicloud-db ref="udb" v-slot:default="{data, loading, error, options}" :options="options"
      collection="opendb-feedback" field="content,imgs,contact,mobile,created_at" :where="queryWhere" :getone="true"
      :manual="true">
      <view v-if="error">{{error.message}}</view>
      <view v-else-if="loading">
        <uni-load-more :contentText="loadMore" status="loading"></uni-load-more>
      </view>
      <view v-else-if="data">
        <view class="feedback-row">
          <text class="feedback-label">反馈内容：</text>
          <text class="feedback-content">{{data.content}}</text>
        </view>
        <view class="report-row">
          <text class="feedback-label">反馈时间：</text>
          <text class="feedback-content">{{data.created_at}}</text>
        </view>
        <view class="feedback-row">
          <view><text class="feedback-label">图片：</text></view>
          <template v-for="(file, j) in data.imgs">
            <image class="feedback-img" mode="aspectFit" :src="file.path"></image>
          </template>
        </view>
        <view class="feedback-row">
          <text class="feedback-label">联系人：</text>
          <text class="feedback-content">{{data.contact}}</text>
        </view>
        <view class="feedback-row">
          <text class="feedback-label">联系电话：</text>
          <text class="feedback-content">{{data.mobile}}</text>
        </view>
      </view>
    </unicloud-db>
    <view class="btns">
      <button type="primary" @click="handleConfirm">确认回复</button>
      <button type="warn" class="btn-delete" @click="handleDelete">删除</button>
    </view>
  </view>
</template>

<script>
  const db = uniCloud.database();
  // 由schema2code生成，包含校验规则和enum静态数据
  import {
    enumConverter
  } from '../../js_sdk/validator/opendb-feedback.js';

  export default {
    data() {
      return {
        queryWhere: '',
        loadMore: {
          contentdown: '',
          contentrefresh: '',
          contentnomore: ''
        },
        options: {
          // 将scheme enum 属性静态数据中的value转成text
          ...enumConverter
        }
      }
    },
    onLoad(e) {
      this._id = e.id
    },
    onReady() {
      if (this._id) {
        this.queryWhere = '_id=="' + this._id + '"'
      }
    },
    methods: {
      handleConfirm() {
        uni.showModal({
          title: '确认回复',
          content: `您确认已回复该反馈吗？`,
          success: (modalRes) => {
            if (modalRes.confirm) {
              // 用户确认评分
              const dbCollection = db.collection('opendb-feedback');
              dbCollection.where({
                  _id: this._id
                })
                .update({
                  status: 1
                })
                .then(() => {
                  uni.showToast({
                    title: `确认成功！`,
                    icon: 'success'
                  });
                  setTimeout(() => {
                    uni.redirectTo({
                      url: "./list"
                    });
                  }, 2000);
                })
                .catch(err => {
                  console.error('确认失败:', err);
                  uni.showToast({
                    title: '确认失败！，请稍后再试',
                    icon: 'none'
                  });
                });
            } else {
              console.log('用户取消确认');
            }
          }
        });
      },
      handleDelete() {
        this.$refs.udb.remove(this._id, {
          success: (res) => {
            // 删除数据成功后跳转到list页面
            uni.navigateTo({
              url: './list'
            })
          }
        })
      }
    }
  }
</script>

<style>
  .feedback-img {
    border-radius: 10px;
    border: dashed gray;
    max-height: 150px;
    border-width: 0.5px;
  }

  .container {
    padding: 10px;
  }

  .btns {
    margin-top: 10px;
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    flex-direction: row;
  }

  .btns button {
    flex: 1;
  }

  .btn-delete {
    margin-left: 10px;
  }

  .feedback-label {
    font-weight: bold;
    font-size: 20px;

  }

  .feedback-content {
    font-size: 18px;
  }

  .feedback-row {
    margin-bottom: 8px;
  }
</style>