<template>
  <view>
    <!-- #ifndef H5 -->
    <statusBar></statusBar>
    <!-- #endif -->

    <!-- 搜索功能 -->
    <view class="uni-search-box">
      <uni-search-bar v-model="keyword" ref="searchBar" radius="100" cancelButton="none" disabled
        :placeholder="inputPlaceholder" />
      <view class="cover-search-bar" @click="searchClick"></view>
    </view>
    <!-- 刷新页面后的顶部提示框 -->
    <view class="tips" :class="{ 'tips-ani': tipShow }">已经为您刷新贴子啦</view>
    <unicloud-db ref="udb" v-slot:default="{data, loading, error, options}" :options="formData" :collection="collection"
      :field="field" :where="whereCondition" @load="load">
      <!-- 基于 uni-list 的页面布局 -->
      <uni-list>
        <!-- to 属性携带参数跳转详情页面，当前只为参考 -->
        <uni-list-item direction="column" v-for="item in posts.slice(0,pageSize)" :key="item._id"
          :to="'/pages/community/detail?id='+item._id+'&title='+item.title">
          <!-- 通过header插槽定义列表的标题 -->
          <!-- 通过body插槽定义列表内容显示 -->
          <template v-slot:body>
            <view class="uni-list-box">
              <!-- 有图片 -->
              <view v-if="item.imgs&&item.imgs[0]&&item.imgs[0].path">
                <image :src="item.imgs[0].path" mode="aspectFill" class="left-pic">
                </image>
              </view>
              <!-- 无图片 -->
              <view class="uni-content" style="margin-left: 10px;">
                <view class="uni-title">{{item.title}}</view>
                <view class="uni-title-sub uni-ellipsis-2" style="margin-bottom:20px ;">
                  {{item.content}}
                </view>

                <view class="icon-row" style="display: flex;justify-items: center;align-items: center;">
                  <view class="name-note">
                    {{item.nickname}}
                  </view>
                  <view @click="goToDetail(item._id)" class="footer-button comment-button" style="margin-right: 8px;">
                    <image src="/static/community/ans.png" mode="aspectFit" class="footer-image">
                    </image>
                    <text class="footer-text">{{item.ans_count}}</text>
                  </view>
                  <!-- 点赞图片按钮 -->
                  <view @click.stop="ChangeLike(item)" class="footer-button like-button">
                    <image :src="item.liked ? '/static/community/like_active.png' : '/static/community/like.png'"
                      mode="aspectFit" class="footer-image"></image>
                    <text class="footer-text">{{item.likes_count}}</text>
                  </view>
                  <view class="time-note">
                    {{formatDate(item.created_at)}}
                  </view>
                </view>

              </view>
            </view>
            <view class="post-separator"></view>
          </template>

        </uni-list-item>

      </uni-list>
      <uni-load-more v-if="loading || options.status === 'noMore'" :status="options.status" />
    </unicloud-db>
  </view>
  <!-- 右下角添加图片 -->
  <view class="add-button" @click="goToAddPage">
    <image src="/static/community/add.png" mode="aspectFit"></image>
  </view>
  <!-- 遮罩层 -->
  <view v-if="overlayVisible" class="overlay" @click="cancelAddPost"></view>
  <!-- 添加新帖子的模态框 -->
  <view v-if="isAddingPost" class="post-modal">
    <view class="uni-container">
      <uni-forms ref="form" :value="postData" validate-trigger="submit" err-show-type="toast">
        <uni-forms-item name="content" label="内容" required>
          <textarea @input="binddata('content', $event.detail.value)" class="uni-textarea-border"
            v-model="postData.content" trim="right"></textarea>
        </uni-forms-item>
        <uni-forms-item name="contact" label="标题" required>
          <uni-easyinput v-model="postData.title" trim="both"></uni-easyinput>
        </uni-forms-item>
        <uni-forms-item name="imgs" label="图片">
          <uni-file-picker file-mediatype="image" :limit="1" return-type="array" v-model="postData.imgs">
          </uni-file-picker>
        </uni-forms-item>
        <view class="uni-button-group" style="padding:20px;">
          <button type="primary" class="uni-button" @click="submit">提交</button> <button type="primary"
            class="uni-button" @click="cancelAddPost" style="margin-left: 20px;">取消</button>
        </view>


      </uni-forms>
    </view>
  </view>
</template>

<script>
  const db = uniCloud.database();
  const dbCollectionName = 'community_post';
  import {
    store,
    mutations
  } from '@/uni_modules/uni-id-pages/common/store.js'

  import UniIdPagesAvatar from '@/uni_modules/uni-id-pages/components/uni-id-pages-avatar/uni-id-pages-avatar.vue'; // 请根据实际路径修改

  export default {
    computed: {
      inputPlaceholder(e) {
        if (uni.getStorageSync('CURRENT_LANG') == "en") {
          return 'Please enter the search content'
        } else {
          return '请输入搜索内容'
        }
      },
      whereCondition() {
        let baseCondition = '"article_status" == 1';
        if (this.keyword) {
          return `${baseCondition} && (/${this.keyword}/.test(title) || /${this.keyword}/.test(content))`;
        } else {
          return baseCondition;
        }
      },
      userInfo() {
        return store.userInfo;
      }
    },
    data() {
      let postData = {
        "content": "",
        "imgs": [],
        "title": "",
        "user_id": "",
        "likes_count": 0,
        "ans_count": 0,
        "article_status": 1
      }
      return {
        pageSize: 6,
        postData,
        formOptions: {},
        test_url: "https://mp-55788fb7-2392-4142-8486-dfaba6fb925c.cdn.bspapp.com/cloudstorage/user.png",
        where: '"article_status" == 1',
        keyword: "",
        width: '200px', // 设置按钮宽度
        height: '200px', // 设置按钮高度
        border: false, // 控制是否显示边框
        // 数据表名
        collection: 'community_post',
        // 查询字段，多个字段用 , 分割
        field: '_id,user_id,content,created_at,likes_count,ans_count,title',
        formData: {
          status: 'loading' // 加载状态
        },
        tipShow: false, // 是否显示顶部提示框
        posts: [], // 存储贴子信息
        newPost: {
          title: '', // 新帖子的标题
          content: '', // 新帖子的内容
          article_status: 1,
        },
        CurrentAvatar_file: {
          extname: '',
          name: '',
          url: ''
        },
        isAddingPost: false, // 控制是否显示添加新帖子的表单
        overlayVisible: false, // 控制遮罩的显示
        isLiking: false, //点赞防抖
      };
    },
    watch: {
      keyword(newKeyword) {
        this.updateWhereCondition();
        this.posts = [];
        // 重新加载帖子
        console.log("根据关键字重新加载");
        this.getPosts().then(() => {
          this.getLikes();
        });
      }
    },

    methods: {
      cancelAddPost() {
        // 清空表单并隐藏
        this.isAddingPost = false;
        this.overlayVisible = false; // 隐藏遮罩
        this.postData.content = "";
        this.postData.imgs = [];
        this.postData.title = "";
      },
      /**
       * 触发表单提交
       */
      submit() {
        uni.showLoading({
          mask: true
        });
        this.submitForm(this.postData);
        uni.hideLoading();
        console.log("提交");
        this.getPosts().then(() => {
          this.getLikes();
        });
      },

      submitForm(value) {
        this.postData.user_id = store.userInfo._id;
        this.postData.created_at = new Date().toISOString();
        // 使用 clientDB 提交数据
        db.collection(dbCollectionName).add(value).then((res) => {
          uni.showToast({
            icon: 'none',
            title: '提交成功'
          })
          setTimeout(() => this.cancelAddPost(), 500)
        }).catch((err) => {
          uni.showModal({
            content: '标题或内容不能为空！',
            showCancel: false
          })
        }).finally(() => {
          uni.hideLoading()
        })
      },
      load(data, ended) {
        if (ended) {
          this.formData.status = 'noMore';
        }
      },
      updateWhereCondition() {
        let baseCondition = '"article_status" == 1';
        this.where = this.keyword ?
          `${baseCondition} && (/${this.keyword}/.test(title) || /${this.keyword}/.test(content))` :
          baseCondition;
      },
      searchClick(e) { //点击搜索框
        uni.hideKeyboard();
        this.posts = [];
        uni.navigateTo({
          url: '/pages/community/search/search',
          animationType: 'fade-in'
        });
      },
      // 获取点赞数据
      async getLikes() {
        if (!store.hasLogin) {
          this.posts.forEach(post => {
            post.liked = false;
          });
          return;
        }
        try {
          const promises = this.posts.map(post => {
            return this.getlikes(post._id).then(liked => {
              post.liked = liked;
            });
          });
          await Promise.all(promises);
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
              post_id: post_id // 确保查询条件中包含 post_id
            })
            .field('post_id') // 只获取 post_id 字段
            .get()
            .then(res => {
              if (res.result.data && res.result.data.length > 0) {
                // 检查 post_id 是否存在于查询结果中
                const exists = res.result.data.some(item => item.post_id === post_id);
                resolve(exists); // 如果存在，resolve 为 true
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
      // 获取贴子数据
      getPosts() {
        return new Promise((resolve, reject) => {
          this.posts = [];
          uni.showLoading({
            mask: true
          });
          db.collection("community_post")
            .where(this.where)
            .orderBy("created_at", "desc")
            .get()
            .then((res) => {
              if (res.result.data && Array.isArray(res.result.data)) {
                const postsGetName = res.result.data.map(post => {
                  return this.getPostName(post.user_id)
                    .then(nickname => {
                      return {
                        ...post,
                        nickname
                      };
                    });
                });
                Promise.all(postsGetName)
                  .then(posts => {
                    this.posts = posts;
                    resolve();
                  });
              } else {
                this.posts = [];
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
            }).finally(() => {
              uni.hideLoading(); // 隐藏加载动画
            });
        });
      },
      // 获取贴主名称
      getPostName(user_id) {
        return new Promise((resolve, reject) => {
          db.collection("uni-id-users")
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
                resolve(nickname); // 直接返回用户名字符串
              } else {
                console.log(`ID: ${user_id}`);
                console.log("没有数据");
                resolve('未知用户'); // 如果没有数据，返回 '未知用户'
              }
            })
            .catch(error => {
              console.error("获取失败:", error);
              resolve('未知用户'); // 出现错误时返回 '未知用户'
            });
        });
      },

      ChangeLike(item) {
        if (!store.hasLogin) {
          uni.showToast({
            title: '请登陆后再点赞',
            icon: 'none'
          });
          return;
        }
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


      formatDate(timestamp) {
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
      },


      goToAddPage() {
        if (!store.hasLogin) {
          uni.showToast({
            title: '请登陆后再发贴',
            icon: 'none'
          });
          return;
        }
        this.isAddingPost = true; // 显示添加新帖子的表单
        this.overlayVisible = true; // 显示遮罩
      },



      addPost() {
        if (this.newPost.title.trim() === '' || this.newPost.content.trim() === '') {
          uni.showToast({
            title: '标题和内容不能为空',
            icon: 'none'
          });
          return;
        }
        // 这里添加将新帖子数据提交到数据库的代码
        uni.showLoading({
          mask: true,
          title: '发布中'
        });
        db.collection('community_post')
          .add({
            user_id: store.userInfo._id,
            content: this.newPost.content,
            created_at: new Date().toISOString(),
            likes_count: 0,
            ans_count: 0,
            title: this.newPost.title,
            avatar_file: this.CurrentAvatar_file,
            article_status: 1
          })
          .then(res => {
            uni.hideLoading();
            // 帖子创建成功后，清空表单并隐藏表单
            this.cancelAddPost();
            // 刷新帖子列表
            console.log("提交1");
            this.getPosts().then(() => {
              this.getLikes();
            });
          })
          .catch(err => {
            uni.hideLoading();
            uni.showToast({
              title: '发布失败',
              icon: 'none'
            });
            console.error('创建帖子失败:', err);
          });
      },



      //不是路径的话可以先传入云，之后删去即可。
      async Mybindchooseavatar(res) {
        let avatarUrl = res.detail.avatarUrl
        let avatar_file = {
          extname: avatarUrl.split('.')[avatarUrl.split('.').length - 1],
          name: '',
          url: ''
        }

        //上传到服务器
        let cloudPath = store.userInfo._id + '' + Date.now()
        avatar_file.name = cloudPath
        try {
          uni.showLoading({
            title: "上传中",
            mask: true
          });
          let {
            fileID
          } = await uniCloud.uploadFile({
            filePath: avatarUrl,
            cloudPath: '/cloudstorage/community_image/' + cloudPath,
            fileType: "image",
            cloudPathAsRealPath: true,
            onUploadProgress: function(progressEvent) {
              console.log(progressEvent);
            }
          });
          avatar_file.url = fileID
          this.CurrentAvatar_file.extname = avatar_file.extname
          this.CurrentAvatar_file.name = avatar_file.name
          this.CurrentAvatar_file.url = avatar_file.url
          console.log(fileID)
          uni.hideLoading()
        } catch (e) {
          console.error(e);
        }
        //this.setAvatarFile(avatar_file)
      },

      uploadAvatarImg() {
        // 处理上传图片的逻辑
        UniIdPagesAvatar.methods.uploadAvatarImg();
        // 你需要根据实际情况实现图片上传，并保存图片信息到 newPost.images
      },

    }, //这里是method结束
    /**
     * 下拉刷新回调函数
     */
    onShow() {
      this.keyword = getApp().globalData.searchText
      console.log(this.keyword)
      console.log(this.where)
      getApp().globalData.searchText = ''
      //这里仅演示如何，在onShow生命周期获取设备位置，并在设备或者应用没有权限时自动引导。设置完毕自动重新获取。
      //你可以基于他做自己的业务，比如：根据距离由近到远排序列表数据等
      // uni.showLoading({
      // 	title:"获取定位中"
      // });
      //默认h5端不获取定位
      // if(location){
      // 	uni.showToast({
      // 		title: JSON.stringify(location),
      // 		icon: 'none'
      // 	});
      // }
      // uni.hideLoading()
      console.log(111)

      console.log(getApp().globalData.community_status)
      if (getApp().globalData.community_status) {
        if (getApp().globalData.community_status == 1) {
          console.log(getApp().globalData.community_status);
          getApp().globalData.community_status = 0;
        }
      } else if (getApp().globalData.community_status == 0) {
        console.log("show");
        this.getPosts().then(() => {
          this.getLikes();
        })
      }
    },
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
      console.log("下滑刷新");
      this.getPosts().then(() => {
        this.getLikes();
      });
    },
    /**
     * 上拉加载回调函数
     */
    onReachBottom() {
      this.$refs.udb.loadMore();
    },

    onLoad(options) {
      console.log("加载");
      this.getPosts().then(() => {
        this.getLikes();
      });
    },
    onReachBottom() {
      // 检查MyCourse的长度和当前页面大小
      console.log(this.posts);
      if (this.posts.length > this.pageSize) {
        console.log("当前课程数量：" + this.posts.length);
        // 如果MyCourse的数据量大于当前页面大小，增加页面大小
        this.pageSize += 6;
      } else {
        // 如果MyCourse的数据量不大于当前页面大小，提示已加载所有记录
        uni.showToast({
          title: '已加载全部记录',
          icon: 'none',
        });
      }
    },
  };
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

  .content {
    width: 100%;
    display: flex;
  }

  .list-picture {
    width: 100%;
    height: 145px;
  }

  .thumb-image {
    width: 100%;
    height: 100%;
  }

  .ellipsis {
    display: flex;
    overflow: hidden;
  }

  .uni-ellipsis-1 {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .uni-ellipsis-2 {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .add-button {
    position: fixed;
    right: 10px;
    bottom: 10px;
    z-index: 999;
  }

  .add-button image {
    width: 50px;
    height: 50px;
    border-radius: 25px;
    box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.2);
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
    padding: 0px;
    box-sizing: border-box;
    border: 1px solid #ddd;
  }

  .post-form button {
    margin-top: 10px;
  }

  .box {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    background-color: #f8f8f8;
    outline: none;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.3s;
    width: 80px;
    max-height: 80px;
    overflow: hidden;
  }

  .box:hover {
    background-color: #ebebeb;
  }

  .box:active {
    transform: translateY(2px);
  }

  .showBorder {
    border: solid 1px #ddd;
  }

  .chooseAvatar {
    font-size: 18px;
  }

  .uni-footer {
    display: flex;
    justify-content: space-between;
    /* 确保子元素分散对齐 */
    align-items: center;
    padding: 5px;
    /* 根据需要调整内边距 */
  }

  .footer-button {

    display: flex;
    align-items: center;
    /* 确保图片和文本垂直居中 */
  }

  .footer-image {
    width: 20px;
    /* 根据实际需要调整 */
    height: 20px;
    /* 根据实际需要调整 */
  }

  .footer-text {
    margin-left: 5px;
    /* 为文本和图片之间添加一些间距 */
    font-size: 14px;
    /* 根据需要调整字体大小 */
  }

  .uni-search-box {
    background-color: #FFFFFF;
    position: sticky;
    height: 50px;
    top: 0;
    left: 0;
    /* #ifndef APP-PLUS */
    z-index: 9;
    /* #endif */
    /* #ifdef MP-WEIXIN */
    width: 100%;
    /* #endif */
  }

  .cover-search-bar {
    height: 50px;
    position: relative;
    top: -50px;
    margin-bottom: -50px;
    /* #ifndef APP-NVUE */
    z-index: 999;
    /* #endif */
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

  .left-pic {
    height: 110px;
    width: 110px;
    border-radius: 8px;
  }

  .name-note {
    margin-right: 5px;
    color: #999;
    font-size: 17px;
  }

  .time-note {
    position: absolute;
    right: 1%;
    color: #999;
    font-size: 15px;
  }

  .like-button {
    position: absolute;
    right: 23%;
  }

  .comment-button {
    position: absolute;
    right: 30%;
  }

  .post-separator {
    height: 0.5px;
    /* 分割线高度 */
    background-color: gray;
    /* 分割线颜色 */
    margin-left: -8px;
    /* 分割线左外边距 */
    margin-right: -8px;
    /* 分割线右外边距 */
    margin-top: 5px;
    /* 分割线上外边距 */
    margin-bottom: 1px;
    /* 分割线下外边距 */
  }
</style>