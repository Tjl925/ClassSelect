<template>
  <!-- 刷新页面后的顶部提示框 -->
  <view class="tips" :class="{ 'tips-ani': tipShow }">已经为您刷新贴子啦</view>
  <view class="article">
    <unicloud-db v-slot:default="{data, loading, error, options}" :options="formData" collection="community_post"
      :where="where" :field="field" :getone="true" :manual="true" ref="udb" @load="load">
      <view class="post-container">
        <template v-if="!loading && data">
          <view class="article-title">{{post.title}}</view>
          <template>
            <view class="author-info" v-if="post_avatar_file.avatarUrl">
              <view class="author-avatar">
                <image :src="post_avatar_file.avatarUrl" mode="aspectFit" class="avatar-image"></image>
              </view>
              <view class="author-text">
                <view class="author-nickname">
                  {{ post.nickname }}
                </view>
                <view class="time-note">{{formatDate(post.created_at)}}</view>
              </view>
            </view>
          </template>
          <view class="article-content">
            <rich-text :nodes="data.content"></rich-text>
          </view>
          <view class="banner" v-if="post.imgs&&post.imgs[0]&&post.imgs[0].path">
            <image class="banner-img" :src="post.imgs[0].path" mode="aspectFit"></image>
          </view>
          <!-- 无图片 -->

          <!-- 按钮行 -->
          <view class="footer">
            <!-- 评论图片按钮 -->
            <view @click="goToAddPage" class="footer-button comment-button">
              <image src="/static/community/ans.png" mode="aspectFit" class="footer-image"></image>
            </view>
            <!-- 点赞图片按钮 -->
            <view v-if="post" @click.stop="ChangeLike(post)" class="footer-button like-button">
              <image :src="post.liked ? '/static/community/like_active.png' : '/static/community/like.png'"
                mode="aspectFit" class="footer-image"></image>
            </view>
            <view v-if="checkRole">
              <!-- 管理按钮 -->
              <view @click="editPost(id)" class="footer-button delete-button">
                <image src="/static/community/modify.png" mode="aspectFit" class="footer-image"></image>
                <!-- <text class="footer-text">管理</text> -->
              </view>
            </view>
            <!-- 举报按钮 -->
            <view v-else>
              <view @click="reportPost(id)" class="footer-button edit-button">
                <image src="/static/community/report.png" mode="aspectFit" class="footer-image"></image>
                <!-- <text class="footer-text">举报</text> -->
              </view>
            </view>

          </view>
        </template>
      </view>
      <view class="comments-container">
        <template>
          <view class="article-separator" v-if="post && Object.keys(post).length"></view>
          <view class="reply-list">
            <!-- 回复项 -->
            <view v-for="item in answers" :key="item._id">
              <view class="reply-item">
                <view class="reply-avatar">
                  <image :src="item.avatarUrl" mode="aspectFill" class="avatar-image"></image>
                </view>
                <view class="reply-content">
                  <view class="nickname">{{ item.nickname }}</view>
                </view>
                <view class="reply-actions">
                  <view v-if="checkItemRole(item)" @click="editReply(item._id)" class="footer-button edit-button">
                    <image src="/static/community/modify.png" mode="aspectFit" class="footer-image">
                    </image>
                  </view>
                  <view v-else @click="reportReply(item._id)" class="footer-button report-button">
                    <image src="/static/community/report.png" mode="aspectFit" class="footer-image">
                    </image>
                  </view>
                </view>
              </view>
              <view class="content">{{ item.content }}</view>
              <view class="uni-note">发布于 {{formatDate(item.created_at)}}</view>
              <!-- 回复之间的分割线 -->
              <view class="reply-separator"></view>
            </view>
          </view>
        </template>
      </view>
      <uni-load-more v-if="loading || options.status === 'noMore'" :status="options.status" />
    </unicloud-db>
  </view>
  <!-- 遮罩层 -->
  <view v-if="overlayVisible" class="overlay" @click="cancelAddAns"></view>
  <!-- 添加新帖子的模态框 -->
  <view v-if="isAddingAns" class="post-modal">
    <view class="post-form">
      <textarea v-model="newAns.content" placeholder="请输入内容"></textarea>
      <view style="display:flex;">
        <button @click="addAns">发布</button>
        <button @click="cancelAddAns">取消</button>
      </view>
    </view>
  </view>
</template>

<script>
  const db = uniCloud.database();

  import {
    store,
    mutations
  } from '@/uni_modules/uni-id-pages/common/store.js'

  import UniIdPagesAvatar from '@/uni_modules/uni-id-pages/components/uni-id-pages-avatar/uni-id-pages-avatar.vue'; // 请根据实际路径修改
  import htmlParser from '@/common/html-parser'
  export default {
    data() {
      return {
        overlayVisible: false, // 控制遮罩的显示
        isAddingAns: false,
        isLiking: false, //点赞防抖
        // 当前显示 _id == "60fa38e79c77390001e2b3a7" ,只做演示使用，可通过详情页传递id过来
        id: "",
        title: '',
        // 查询字段，多个字段用 , 分割
        field: '_id,user_id,content,created_at,likes_count,ans_count,title,avatar_file',
        formData: {
          status: 'loading' // 加载状态
        },
        tipShow: false, // 是否显示顶部提示框
        post: {
          liked: false,
        }, //有liked
        post_avatar_file: '', //博主头像
        answers: [], //回复数据 有 avatarUrl, content, created_at, nickname, post_id, user_id, _id
        newAns: {
          content: '',
        },
      }
    },
    computed: {
      where() {
        console.log(this.id);
        return `_id =="${this.id}"`
      },
      checkRole() {
        if ((store.userInfo.user_role && store.userInfo.user_role == "admin") || store.userInfo._id == this.post
          .user_id) {
          return true; //true时是管理
        } else {
          return false; //false时是举报
        }
      }
    },


    onLoad(event) {
      // 获取真实新闻id，通常 id 来自上一个页面
      if (event.id) {
        this.id = event.id;
      }
      // 若上一页传递了标题过来，则设置导航栏标题
    },

    onReady() {
      if (this.id) {
        this.getPosts(this.id).then(() => {
          this.getAns(this.id).then(() => {
            this.getAnsIMG().then(() => {
              this.getLikes();
            });
          });
        });
      } else {
        uni.showToast({
          icon: 'none',
          title: '出错了，新闻ID为空'
        });
      }
    },
    methods: {


      checkItemRole(item) {
        return (store.userInfo.user_role === "admin" || store.userInfo._id === item.user_id);
      },
      editReply(replyId) {
        // 导航到编辑回复页面
        console.log(`/pages/community/modify_reply?replyId=${replyId}&post_id=${this.post._id}`);
        uni.navigateTo({
          url: `/pages/community/modify_reply?replyId=${replyId}&post_id=${this.post._id}`
        });
      },
      reportReply(replyId) {
        // 导航到举报页面
        uni.navigateTo({
          url: `/uni_modules/uni-feedback/pages/opendb-report/opendb-report?reported_id=${replyId}&type=评论`
        });
      },

      editPost(postId) {
        uni.navigateTo({
          url: `/pages/community/modify_community?postId=${postId}`
        });
      },
      //修改传入的参数和连接即可
      reportPost(postId) {
        uni.navigateTo({
          url: `/uni_modules/uni-feedback/pages/opendb-report/opendb-report?reported_id=${postId}&type=帖子`
        });
      },

      goToAddPage() {
        if (!store.hasLogin) {
          uni.showToast({
            title: '请登陆后再回复',
            icon: 'none'
          });
          return;
        }
        this.isAddingAns = true; // 显示添加新帖子的表单
        this.overlayVisible = true; // 显示遮罩
      },
      addAns() {
        if (this.newAns.content.trim() === '') {
          uni.showToast({
            title: '内容不能为空',
            icon: 'none'
          });
          return;
        }
        this.post.ans_count += 1;
        // 这里添加将新帖子数据提交到数据库的代码
        uni.showLoading({
          mask: true,
          title: '发布中'
        });
        db.collection('community_ans').add({
          user_id: store.userInfo._id,
          content: this.newAns.content,
          post_id: this.post._id,
          created_at: new Date().toISOString()
        }).then(() => {
          // 更新帖子的回复计数
          db.collection('community_post').doc(this.post._id).update({
            ans_count: this.post.ans_count
          }).then(() => {
            uni.hideLoading();
            // 帖子创建成功后，清空表单并隐藏表单
            this.cancelAddAns();
            this.getPosts(this.id).then(() => {
              this.getAns(this.id).then(() => {
                this.getAnsIMG().then(() => {
                  this.getLikes();
                });
              });
            });
            console.log('回复成功');
            getApp().globalData.community_status = 0;
          }).catch(error => {
            console.error('更新帖子回复计数失败:', error);
          });
        }).catch(error => {
          console.error('添加回复记录失败:', error);
        });
      },
      load(data, ended) {
        if (ended) {
          this.formData.status = 'noMore';
        }
        if (data) {
          this.post = data; // 从 unicloud-db 加载的数据更新 post
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
      },

      cancelAddAns() {
        // 清空表单并隐藏
        this.newAns.content = '';
        this.isAddingAns = false;
        this.overlayVisible = false; // 隐藏遮罩
      },

      // 获取贴子数据
      // 获取贴子数据
      getPosts(post_id) {
        return new Promise((resolve, reject) => {
          uni.showLoading({
            mask: true
          });
          db.collection("community_post")
            .where({
              _id: post_id
            })
            .get()
            .then(res => {
              uni.hideLoading();
              if (res.result.data && res.result.data.length > 0) {
                const post = res.result.data[0];
                this.getNickName(post.user_id).then(nickname => {
                  post.nickname = nickname;
                  post.liked = false; // 确保 liked 属性被设置
                  this.post = post;

                  // 异步获取头像
                  this.getImg(post.user_id).then(avatarUrl => {
                    this.post_avatar_file = avatarUrl;
                    // console.log(this.post_avatar_file.avatarUrl);
                    resolve(this.post);
                  }).catch(error => {
                    console.error("获取头像失败:", error);
                    this.post_avatar_file = ''; // 如果获取头像失败，设置为空字符串
                    resolve(this.post);
                  });
                });
              } else {
                this.post = {
                  liked: false
                }; // 确保即使没有帖子数据，liked 属性也被设置
                this.post_avatar_file = ''; // 没有帖子数据时，头像也设置为空
                resolve(this.post);
              }
            })
            .catch(error => {
              console.error("获取帖子数据失败:", error);
              uni.showToast({
                title: "加载帖子数据失败",
                icon: "none"
              });
              this.post = {};
              this.post_avatar_file = ''; // 获取帖子数据失败时，头像也设置为空
              resolve(this.post);
            });
        });
      },
      // 获取贴主名称
      getNickName(user_id) {
        return db.collection("uni-id-users")
          .where({
            _id: user_id
          })
          .field('nickname')
          .get()
          .then(res => {
            if (res.result.data && res.result.data.length > 0) {
              const nickname = res.result.data[0].nickname;
              console.log(`ID: ${user_id}`);
              console.log(`名称: ${nickname}`);
              return nickname; // 直接返回用户名字符串
            } else {
              console.log(`ID: ${user_id}`);
              console.log("没有数据");
              return '未知用户'; // 如果没有数据，返回 '未知用户'
            }
          })
          .catch(error => {
            console.error("获取失败:", error);
            return '未知用户'; // 出现错误时返回 '未知用户'
          });
      },
      //获取回复
      getAns(post_id) {
        return new Promise((resolve, reject) => {
          this.answers = [];
          uni.showLoading({
            mask: true
          });
          db.collection("community_ans")
            .where({
              post_id: post_id
            })
            .orderBy("created_at", "asc")
            .get()
            .then((res) => {
              if (res.result.data && Array.isArray(res.result.data)) {
                const getName = res.result.data.map(ans => {
                  return this.getNickName(ans.user_id)
                    .then(nickname => {
                      return {
                        ...ans,
                        nickname
                      };
                    });
                });
                Promise.all(getName)
                  .then(ans => {
                    this.answers = ans;
                    resolve();
                  });
              } else {
                this.answers = [];
                resolve();
              }
            })
            .catch((error) => {
              console.error("获取用户名称失败:", error);
              uni.showToast({
                title: "加载用户名称失败",
                icon: "none"
              });
              resolve();
            })
            .finally(() => {
              uni.hideLoading();
            });
        });
      },

      async getAnsIMG() {
        try {
          const promises = this.answers.map(answer => {
            return this.getImg(answer.user_id).then(user => {
              return {
                ...answer,
                avatarUrl: user.avatarUrl || '' // 确保如果没有头像URL，使用空字符串
              };
            });
          });
          const updatedAnswers = await Promise.all(promises);
          this.answers = updatedAnswers; // 更新answers数组
        } catch (error) {
          console.error("获取头像数据失败:", error);
        }
      },

      getImg(user_id) {
        return db.collection("uni-id-users")
          .where({
            _id: user_id,
          })
          .field('avatar_file') // 只获取 avatar_file 字段
          .get()
          .then(res => {
            if (res.result.data && res.result.data.length > 0 && res.result.data[0]) {
              const avatarUrl = res.result.data[0].avatar_file.url; // 确保avatar_file存在且有url属性
              return {
                avatarUrl
              };
            } else {
              return {
                avatarUrl: ''
              }; // 如果查询结果为空或没有头像，返回空URL
            }
          })
          .catch(error => {
            console.error("获取头像失败:", error);
            return {
              avatarUrl: ''
            }; // 出现错误时返回空URL
          });
      },

      async getLikes() {
        if (!store.hasLogin) {
          this.post.liked = false;
          return;
        }
        try {
          // 直接调用 getlikes 方法，不需要使用 map 创建 promises 数组
          await this.getlikes(this.post._id).then(liked => {
            this.post.liked = liked;
          });
        } catch (error) {
          console.error("获取点赞数据失败:", error);
        }
      },

      getlikes(post_id) {
        return new Promise((resolve, reject) => {
          const user_id = store.userInfo._id;
          db.collection("community_like")
            .where({
              user_id: user_id,
              post_id: post_id
            })
            .field('post_id') // 只获取 post_id 字段
            .limit(1) // 优化查询，只要找到一条就停止
            .get()
            .then(res => {
              if (res.result.data && res.result.data.length > 0) {
                resolve(true); // 如果存在，resolve 为 true
              } else {
                resolve(false); // 如果查询结果为空，resolve 为 false
              }
            })
            .catch(error => {
              console.error("获取点赞失败:", error);
              resolve(false); // 出现错误时返回 false
            });
        });
      },

      ChangeLike(item) {
        if (this.isLiking) {
          // 如果正在执行点赞操作，则直接返回
          return;
        }
        this.isLiking = true; // 锁定点赞状态

        db.collection('community_like').where({
          post_id: item._id,
          user_id: store.userInfo._id
        }).get().then(res => {
          if (res.result.data.length > 0) {
            // 如果已点赞，则取消点赞
            this.cancelLike(item);
          } else {
            // 如果未点赞，则添加点赞
            this.addLike(item);
          }
        }).catch(error => {
          console.error("查询点赞状态失败:", error);
        }).finally(() => {
          this.isLiking = false; // 解锁点赞状态
        });
        getApp().globalData.community_status = 0;
      },

      // 添加点赞
      addLike(post) {
        // 增加点赞计数
        post.likes_count += 1;
        // 更新帖子的点赞状态
        post.liked = true;

        // 插入新的点赞记录
        db.collection('community_like').add({
          post_id: post._id,
          user_id: store.userInfo._id,
          created_at: new Date().toISOString()
        }).then(() => {
          // 更新帖子的点赞计数
          db.collection('community_post').doc(post._id).update({

            likes_count: post.likes_count

          }).then(() => {
            console.log('点赞成功');
          }).catch(error => {
            console.error('更新帖子点赞计数失败:', error);
          });
        }).catch(error => {
          console.error('添加点赞记录失败:', error);
        });
      },

      // 取消点赞
      cancelLike(post) {
        // 减少点赞计数
        post.likes_count -= 1;
        // 更新帖子的点赞状态
        post.liked = false;

        // 删除点赞记录
        db.collection('community_like').where({
          post_id: post._id,
          user_id: store.userInfo._id
        }).remove().then(() => {
          // 更新帖子的点赞计数
          db.collection('community_post').doc(post._id).update({

            likes_count: post.likes_count

          }).then(() => {
            console.log('取消点赞成功');
          }).catch(error => {
            console.error('更新帖子点赞计数失败:', error);
          });
        }).catch(error => {
          console.error('删除点赞记录失败:', error);
        });
      },
    },
    // 上一行是method结束
    onPullDownRefresh() {
      this.formData.status = 'more';
      this.$refs.udb.loadData({
        clear: true
      }, () => {
        this.tipShow = true;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          this.tipShow = false;
        }, 1000);
        uni.stopPullDownRefresh();
      });
      this.getPosts(this.id).then(() => {
        this.getAns(this.id).then(() => {
          this.getAnsIMG().then(() => {
            this.getLikes();
          });
        });
        console.log('帖子数据加载完成');
      });
    },
    /**
     * 上拉加载回调函数
     */
    onReachBottom() {
      this.$refs.udb.loadMore();
    },

    onShow() {
      if (this.id) {
        this.getPosts(this.id).then(() => {
          this.getAns(this.id).then(() => {
            this.getAnsIMG().then(() => {
              this.getLikes();
            });
          });
        });
      }
    }

  }
</script>

<style lang="scss">
  @import '@/common/uni-ui.scss';

  page {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    background-color: #efeff4;
    min-height: 100%;
    height: auto;
  }

  .header-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    font-size: 14px;
  }

  /* 标题 */
  .uni-title {
    display: flex;
    margin-bottom: 5px;
    font-size: 15px;
    font-weight: normal;
    color: #3b4144;
  }

  /* 描述 额外文本 */
  .uni-note {
    color: #999;
    font-size: 12px;
    text-align: left;
    margin-top: 15px;
    padding-right: 15px;
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-around;
    /* 使按钮之间有均匀的空间 */
    padding: 10px 0;
    /* 上下内边距 */
  }

  /* 单个按钮样式 */
  .footer-button {

    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    /* 按钮宽度 */
    height: 40px;
    /* 按钮高度 */
    font-size: 14px;
    /* 字体大小 */
    color: #ff0000;
    /* 字体颜色 */
    background-color: #ffffff;
    /* 背景颜色 */
    border-radius: 20px;
    /* 边框圆角 */
    margin: 0 5px;
    /* 按钮之间的外边距 */
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    /* 阴影效果 */
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    /* 过渡效果 */
  }

  /* 按钮内的图片样式 */
  .footer-image {
    width: 20px;
    /* 图片宽度 */
    height: 20px;
    /* 图片高度 */
  }

  /* 按钮内的文本样式 */
  .footer-text {
    /* 文本与图片之间的间距 */
  }

  /* 按钮 hover 效果 */
  .footer-button:hover {
    transform: scale(1.1);
    /* 鼠标悬停时放大 */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    /* 鼠标悬停时阴影效果增强 */
  }

  /* 点赞按钮的 active 状态 */
  .like-button image[src='/static/community/like_active.png'] {
    fill: red;
    /* 点赞时使用红色 */
  }



  .banner {
    border-radius: 15px;
    position: relative;
    margin: auto;
    height: 180px;
  }

  .banner-img {
    border-radius: 15px;
    /* 宽度设置为100%，填满容器 */
    width: 100%;
    height: 100%;
    /* 高度自动，保持图片宽高比 */
  }

  .banner-title {
    display: flex;
    align-items: center;
    position: absolute;
    padding: 0 15px;
    width: 100%;
    bottom: 0;
    height: 30px;
    font-size: 14px;
    color: #fff;
    background: rgba(0, 0, 0, 0.4);
    overflow: hidden;
    box-sizing: border-box;
  }

  .uni-ellipsis {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .article-title {
    padding: 15px 15px;
    margin-left: 0;
    padding-bottom: 0;
    font-size: 30px;
    /* 增大字体大小 */
    font-weight: bold;
    /* 加粗字体 */
    color: #333;
    /* 可以选择一个更深的颜色以突出标题 */
  }

  .article-content {
    padding-left: 15px;
    font-size: 15px;
    overflow: hidden;
    font-size: 20px;
    line-height: 1.8;
    color: #333;
    margin-bottom: 10px;
  }

  .reply-list {
    display: flex;
    flex-direction: column;
    padding: 10px;
  }

  .reply-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    /* 每个回复项之间的间距 */
  }

  .reply-avatar {
    margin-left: 2px;
    margin-right: 10px;
    /* 头像与内容之间的间距 */
  }

  .avatar-image {
    width: 40px;
    /* 头像宽度 */
    height: 40px;
    /* 头像高度 */
    border-radius: 50%;
    /* 圆形头像 */
  }

  .reply-content {
    display: flex;
    flex-direction: column;
    /* 昵称和内容垂直排列 */
  }

  .reply-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-left: 10px;
  }

  .edit-button,
  .report-button {
    width: 30px;
    height: 30px;
    margin-bottom: 5px;
  }


  .nickname {
    font-weight: bold;
    /* 昵称加粗 */
  }

  .content {
    margin-top: 5px;
    /* 昵称与内容之间的间距 */
  }

  .tips {
    color: #67c23a;
    font-size: 14px;
    line-height: 40px;
    text-align: center;
    background-color: #f0f9eb;
    height: 0;
    opacity: 0;
    transform: translateY(-100%);
    transition: all 0.3s;
  }

  .tips-ani {
    transform: translateY(0);
    height: 40px;
    opacity: 1;
  }

  .author-info {
    display: flex;
    /* 确保头像和昵称垂直居中对齐 */
    margin-bottom: 10px;
    margin-top: 20px;
    padding-left: 15px;
    /* 根据需要调整间距 */
  }

  .author-avatar {
    margin-right: 5px;
    /* 头像与昵称之间的间距 */
  }

  .avatar-image {
    width: 40px;
    /* 头像宽度 */
    height: 40px;
    /* 头像高度 */
    border-radius: 50%;
    /* 圆形头像 */
    object-fit: cover;
    /* 确保图片内容适应圆形 */
  }

  .author-nickname {
    font-weight: bold;
    /* 昵称加粗 */
  }

  .post-separator {
    height: 0.5px;
    /* 分割线高度 */
    background-color: gray;
    /* 分割线颜色 */
    margin-left: 8px;
    /* 分割线左外边距 */
    margin-right: 8px;
    /* 分割线右外边距 */
    margin-top: 5px;
    /* 分割线上外边距 */
    margin-bottom: 1px;
    /* 分割线下外边距 */
  }

  .reply-separator {
    height: 0.5px;
    /* 分割线高度 */
    background-color: gray;
    /* 分割线颜色 */
    margin-left: 2px;
    /* 分割线左外边距 */
    margin-right: 2px;
    /* 分割线右外边距 */
    margin-top: 1px;
    /* 分割线上外边距 */
    margin-bottom: 7px;
    /* 分割线下外边距 */
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  .post-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #fff;
    padding: 20px;
    border-radius: 5px;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 400px;
    max-height: 90%;
    overflow-y: auto;
  }

  .post-form {
    display: flex;
    flex-direction: column;
  }

  .post-form input,
  .post-form textarea {
    width: 100%;
    margin-bottom: 10px;
    padding: 10px;
    box-sizing: border-box;
    border: 1px solid #ddd;
  }

  .post-form button {
    margin-top: 10px;
  }

  .time-note {
    margin-top: 2px;
    color: #999;
    font-size: 14px;
  }

  .post-container {
    margin-top: 5px;
    width: 97%;
    background-color: white;
    margin-left: auto;
    margin-right: auto;
    border-radius: 5px;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
  }

  .comments-container {
    margin-top: 5px;
    width: 97%;
    background-color: white;
    margin-left: auto;
    margin-right: auto;
    border-radius: 5px;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
  }
</style>