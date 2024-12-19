<template>
  <view class="container">
    <unicloud-db ref="udb" v-slot:default="{ data, loading, error, options }" :options="options" collection="reports"
      field="content,imgs,created_at,status,reason,type" :where="queryWhere" :getone="true" :manual="true">
      <view v-if="error">{{error.message}}</view>
      <view v-else-if="loading">
        <uni-load-more :contentText="loadMore" status="loading"></uni-load-more>
      </view>
      <view v-else-if="data">
        <view class="report-row">
          <text class="report-label">举报类型：</text>
          <text class="report-content">{{data.type}}</text>
        </view>
        <view class="report-row" v-if="isReply">
          <text class="report-label">评论内容：</text>
          <text class="report-content">{{reply_content}}</text> <!-- 绑定 reply_content -->
        </view>
        <view class="report-row">
          <text class="report-label">举报时间：</text>
          <text class="report-content">{{formatDate(data.created_at)}}</text>
        </view>
        <view class="report-row">
          <text class="report-label">举报原因：</text>
          <text class="report-content">{{data.reason}}</text>
        </view>
        <view class="report-row">
          <text class="report-label">举报说明：</text>
          <text class="report-content">{{data.content}}</text>
        </view>
        <view class="report-row">
          <view><text class="report-label">说明图片：</text></view>
          <template v-for="(file, j) in data.imgs" :key="j">
            <image class="report-img" mode="aspectFit" :src="file.path"></image>
          </template>
        </view>
      </view>
    </unicloud-db>

    <view class="btns">
      <button class="btn-deal" @click="handleDeal(reported_id)">前往处理</button>
    </view>
    <view class="btns">
      <button type="primary" @click="handleConfirm">确认处理</button>
      <button type="warn" class="btn-delete" @click="handleDelete">删除</button>
    </view>
  </view>
</template>

<script>
  const db = uniCloud.database();

  export default {
    data() {
      return {
        queryWhere: '',
        loadMore: {
          contentdown: '',
          contentrefresh: '',
          contentnomore: ''
        },
        options: {},
        reported_id: "",
        type: "",
        reported_post: "",
        reply_content: "",
        _id: "" // 添加到 data 以便统一管理
      };
    },
    async onLoad(e) {
      this._id = e.id; // 直接从参数中获取 ID
      if (this._id) {
        this.queryWhere = `_id==\"${this._id}\"`;
        try {
          await this.getReportedInfo(); // 等待获取被举报信息
          console.log("已获取被举报信息，准备获取评论内容");
          await this.getReplyContent(); // 根据获取到的信息，获取评论内容
        } catch (error) {
          console.error("加载数据出错", error);
          uni.showToast({
            title: '加载数据失败，请稍后再试',
            icon: 'none'
          });
        }
      }
    },
    computed: {
      isReply() {
        return this.type === "评论";
      }
    },
    methods: {
      async getReplyContent() {
        if (this.isReply && this.reported_id) {
          console.log("正在获取评论讯息:", this.reported_id);
          try {
            const res = await db.collection("community_ans").doc(this.reported_id).get();
            console.log(res);
            if (res.result.data && Array.isArray(res.result.data) && res.result.data.length > 0) {
              this.reported_post = res.result.data[0].post_id;
              this.reply_content = res.result.data[0].content;

              // 更新 options 以触发渲染
              this.options = {
                ...this.options
              };
            } else {
              throw new Error("数据为空或格式不正确");
            }
          } catch (error) {
            console.error("获取评论讯息失败", error);
            uni.showToast({
              title: `获取被举报评论失败！`,
              icon: 'none'
            });
          }
        }
      },
      async getReportedInfo() {
        try {
          const res = await db.collection("reports").doc(this._id).get();
          console.log(res);
          if (res.result.data && Array.isArray(res.result.data) && res.result.data.length > 0) {
            this.reported_id = res.result.data[0].reported_id;
            console.log(this.reported_id);
            this.type = res.result.data[0].type;
          } else {
            throw new Error("数据为空或格式不正确");
          }
        } catch (error) {
          console.error("获取被举报信息失败", error);
          uni.showToast({
            title: `获取被举报信息失败！`,
            icon: 'none'
          });
          throw error; // 抛出错误以便 onLoad 捕获
        }
      },
      handleConfirm() {
        uni.showModal({
          title: '确认处理',
          content: `您确认已处理该举报了吗？`,
          success: async (modalRes) => {
            if (modalRes.confirm) {
              try {
                await db.collection('reports').where({
                  _id: this._id
                }).update({
                  status: 1
                });
                uni.showToast({
                  title: `确认成功！`,
                  icon: 'success'
                });
                setTimeout(() => {
                  uni.redirectTo({
                    url: "./list"
                  });
                }, 2000);
              } catch (error) {
                console.error('确认失败:', error);
                uni.showToast({
                  title: '确认失败！，请稍后再试',
                  icon: 'none'
                });
              }
            } else {
              console.log('用户取消确认');
            }
          }
        });
      },
      handleDelete() {
        this.$refs.udb.remove(this._id, {
          success: (res) => {
            uni.navigateTo({
              url: './list'
            });
          },
          fail: (err) => {
            console.error("删除失败", err);
            uni.showToast({
              title: '删除失败，请稍后再试',
              icon: 'none'
            });
          }
        });
      },
      handleDeal(reported_id) {
        if (this.type === "帖子") {
          uni.navigateTo({
            url: `/pages/community/detail?id=${reported_id}`
          });
        } else if (this.type === "评论") {
          uni.navigateTo({
            url: `/pages/community/detail?id=${this.reported_post}`
          });
        } else if (this.type === "课程信息") {
          uni.navigateTo({
            url: `/pages/course/detail?_id=${reported_id}`
          });
        } else if (this.type === "资料") {
          uni.navigateTo({
            url: `/pages/material/detail?id=${reported_id}`
          });
        }
      },
      formatDate(timestamp) {
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
        .getHours()
        .toString()
        .padStart(2, "0")}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
      }
    }
  };
</script>

<style>
  .report-img {
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

  .report-label {
    font-weight: bold;
    font-size: 20px;

  }

  .report-content {
    font-size: 18px;
  }

  .report-row {
    margin-bottom: 8px;
  }

  .btn-deal {
    background-color: cornflowerblue;
    color: white;
  }
</style>