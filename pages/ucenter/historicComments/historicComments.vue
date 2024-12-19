<template>
  <view class="container">
    <unicloud-db ref="udb" v-slot:default="{data, pagination, loading, hasMore, error}"
      collection="opendb-news-articles" @load="isLoading == false" @error="isLoading == false" :page-size="10">
      <uni-list>
        <uni-list-item v-if="!Myans || Myans.length === 0" class="no-data">
        </uni-list-item>
        <uni-list-item v-for="(item, index) in Myans" :key="index" :clickable="true" @click="handleItemClick(item)"
          @longpress="this.showOptions(item)">
          <template v-slot:body>
            <view class=" item">
              <view class="reply-content-box">
                <text
                  class="reply-content">我的回复：{{ item.content.length > 10 ? item.content.slice(0, 10) + '...' : item.content }}</text>
              </view>
              <view class="meta-box">
                <view class="post-title">{{ item.title }}</view>
              </view>
              <view class="comment-date">{{ formatDate(item.created_at) }}</view>
            </view>

          </template>

        </uni-list-item>
      </uni-list>
      <uni-load-state @networkResume="refreshData" :state="{Myans,pagination,hasMore, loading, error}"></uni-load-state>
    </unicloud-db>
  </view>
  <view v-if="showDialog" class="dialog">
    <view class="dialog-title">操作选项</view>
    <view class="dialog-buttons">
      <view @click="cancelDialog" class="dialog-button">取消</view>
      <view @click="deleteItem(index)" class="dialog-button">删除</view>
      <view @click="modifyItem(index)" class="dialog-button">修改</view>
    </view>
  </view>

</template>

<script>
  import {
    store
  } from '@/uni_modules/uni-id-pages/common/store.js';
  const db = uniCloud.database();
  export default {
    data() {
      return {
        showDialog: false,
        isLoading: true,
        loadMore: {
          contentdown: '',
          contentrefresh: '',
          contentnomore: '',
        },
        Myans: []
      }
    },
    onLoad() {
      this.getMyAns();
    },
    //下拉刷新
    onPullDownRefresh() {
      this.refreshData();
    },
    //上拉加载更多
    onReachBottom() {
      this.$refs.udb.loadMore()
    },

    methods: {
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
        .padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
      },
      showDialog(index) {
        this.showDialog = true; // 显示对话框
      },
      cancelDialog() {
        this.showDialog = false; // 隐藏对话框
      },
      getMyAns() {
        uni.showLoading({
          title: "加载中...",
          mask: true,
        });
        console.log("开始加载");
        let collectionQuery = db.collection("community_ans").orderBy("created_at", "desc");
        collectionQuery = collectionQuery.where({
          user_id: store.userInfo._id
        });
        console.log(store.userInfo._id);
        collectionQuery
          .get()
          .then(async (res) => {
            if (res.result.data && Array.isArray(res.result.data)) {
              // 并行获取每个答案对应的帖子数据
              const ansinfo = await Promise.all(
                res.result.data.map((ans) =>
                  this.getpostinfo(ans.post_id).then(postInfo => ({
                    ...ans,
                    ...postInfo, // 使用正确的变量名
                  }))
                )
              );
              this.Myans = ansinfo;
            } else {
              this.Myans = []; // 如果返回数据为空，则清空答案列表
            }
            this.isLoading = false;
          })
          .catch((error) => {
            console.error("获取帖子数据失败:", error);
            uni.showToast({
              title: "加载帖子数据失败",
              icon: "none",
            });
            this.isLoading = false;
          })
          .finally(() => {
            uni.hideLoading(); // 隐藏加载动画
          });
      },

      async getpostinfo(postid) {
        return db
          .collection("community_post")
          .where({
            _id: postid // 确保这里是文档的ID字段，通常是 _id
          })
          .field({
            title: true,
            likes_count: true,
            ans_count: true,
          })
          .get()
          .then((res) => {
            if (res.result.data && res.result.data.length > 0) {
              const postInfo = res.result.data[0]; // 获取帖子信息
              return {
                title: postInfo.title, // 返回帖子标题
                likes_count: postInfo.likes_count, // 返回点赞数
                ans_count: postInfo.ans_count,
              }; // 返回一个对象，包含标题和点赞数
            } else {
              return {
                title: "-文章已被删除-",
                likes_count: 0 // 如果没有找到帖子，返回默认值
              }; // 返回一个对象，包含标题和点赞数的默认值
            }
          })
          .catch((error) => {
            console.error("获取帖子信息失败:", error);
            return {
              title: "错误",
              likes_count: 0 // 如果发生错误，返回错误信息和默认的点赞数
            }; // 返回一个对象，包含错误信息和默认的点赞数
          });
      },

      //导航函数
      handleItemClick(item) {
        console.log(item);
        uni.navigateTo({
          url: '/pages/community/detail?id=' + item.post_id + '&title=' + item.title
        })
      },
      showOptions(item) {
        uni.showActionSheet({
          itemList: ['删除', '修改'],
          success: function(res) {
            console.log('用户选择了选项：' + (res.tapIndex + 1));
            if (res.tapIndex + 1 == 1) { // 索引从0开始，所以需要与操作列表匹配
              console.log('用户选择了删除');
              //删除逻辑
              const db = uniCloud.database();
              const collection = db.collection(
                'community_ans'); // 替换 'community_ans' 为您的数据集合名称
              collection.doc(item._id).remove().then(res => {
                uni.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
                console.log('删除成功', res);
                uni.redirectTo({
                  url: "/pages/ucenter/historicComments/historicComments"
                });
              }).catch(err => {
                console.error('删除失败', err);
                uni.showToast({
                  title: '删除失败',
                  icon: 'none'
                });
              });
              //修改逻辑
              item.ans_count -= 1;
              const postcollection = db.collection(
                'community_post');
              postcollection.doc(item.post_id).update({
                ans_count: item.ans_count
              }).then(res => {
                console.log('修改成功', res);
              }).catch(err => {
                console.error('修改失败', err);
                uni.showToast({
                  title: '修改失败',
                  icon: 'none'
                });
              });
            } else if (res.tapIndex == 1) {
              console.log('用户选择了修改');
              console.log(`/pages/community/modify_reply?replyId=${item._id}&post_id=${item.post_id}`);
              uni.navigateTo({
                url: `/pages/community/modify_reply?replyId=${item._id}&post_id=${item.post_id}`
              });
            }
          }, //success层
          fail: function(res) {
            console.log('操作菜单调用失败');
          }, //  fail层
          complete: function() {
            console.log('操作菜单调用结束');
          }
        }); //  showActions层
      } //showoptions层
    } //  method层
  } // export 层
</script>
<style>
  .container {
    padding: 10px;
  }

  .item {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 10px;
    border-bottom: 1px solid #eee;
  }

  .reply-content-box {
    background-color: #f9f9f9;
    padding: 8px 12px;
    border-radius: 4px;
    margin-bottom: 8px;
  }

  .reply-content {
    font-size: 16px;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .meta-box {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .post-title {
    font-size: 16px;
    color: #555;
    flex-grow: 1;
  }

  .likes-count {
    font-size: 14px;
    color: #888;
  }

  .comment-date {
    font-size: 12px;
    color: #999;
    padding: 4px 0;
  }

  .dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #fff;
    border-radius: 10px;
    width: 80%;
    max-width: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
  }

  .dialog-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .dialog-buttons {
    display: flex;
    justify-content: space-around;
    margin-top: 20px;
  }

  .dialog-button {
    padding: 10px 20px;
    background-color: #007AFF;
    color: #fff;
    border-radius: 5px;
    margin: 5px;
  }
</style>