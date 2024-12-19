<template>

  <view class="container">
    <!-- #ifdef APP-PLUS -->
    <uni-nav-bar :statusBar="true" :border="false"></uni-nav-bar>
    <!-- #endif -->
    <!-- 顶部图片区域 -->


    <!-- 属性信息 -->
    <view class="info-container">
      <view v-if="materialImage" class="image-container">
        <image :src="materialImage" mode="aspectFill"></image>
      </view>
      <!-- 判断用户角色，显示修改或举报按钮 -->
      <button @click="goToModifyPage" class="action-button" v-if="isAdmin || isMaterialCreator">
        <image class="modify-icon" src="/static/modify.png" alt="修改" />
        <text class="button-text">修改</text>
      </button>
      <button @click="goToReportPage(id)" class="action-button" v-else>
        <image class="modify-icon" src="/static/report.png" alt="举报" />
        <text class="button-text">举报</text>
      </button>
      <!-- 资料名称 -->
      <view class="title">《{{ title }}》</view>

      <!-- 平均分和静态星星图标 -->
      <view class="rating-container">
        <text class="rating-text">{{ displayRating }}</text>
        <view class="stars1">
          <image v-for="(star, index) in starRating" :key="index"
            :src="star === 'full' ? '/static/full-star.png' : '/static/half-star.png'" class="star-image"></image>
        </view>

      </view>
      <view class="attributes">
        <text class="info">资料类别：<text class="variant">{{ category }}</text></text>
        <text class="info">相关课程：<text class="variant">{{ courseName }}</text></text>
      </view>
    </view>

    <!-- 评论区 -->
    <view v-if="isCommentsLoading" class="loading-container">
      <text>评论加载中...</text>
    </view>
    <scroll-view class="comments-container" scroll-y="true">
      <block v-for="(comment, index) in comments" :key="index">
        <view class="comment-item" @longpress="handleLongPress(comment)">
          <image class="avatar" :src="comment.avatar" alt="用户头像" />
          <view class="comment-info">
            <view class="header">
              <text class="nickname">{{ comment.nickname }}</text>
              <text class="created-at">{{ formatData(comment.created_at) }}</text>
            </view>
            <view class="comment-text">{{ comment.comment_text }}</view>
          </view>
        </view>
      </block>
    </scroll-view>


    <!-- 动态评分栏 -->

    <view class="dynamic-rating">
      <text style="font-size: 20px">评分：</text>
      <view class="rating">
        <view v-for="n in 5" :key="n" class="star" :class="{ active: n <= currentRating }" @click="rate(n)">
          ★
        </view>
      </view>
    </view>

    <!-- 底部固定状态栏 -->
    <view class="footer">
      <button @click="downloadMaterial" style="font-size: 20px; font-weight: bold;">下载</button>
      <button @click="postComment" style="font-size: 20px; font-weight: bold;">评论</button>
    </view>
  </view>

</template>

<script>
  // #ifdef APP-PLUS
  import UniShare from '@/uni_modules/uni-share/js_sdk/uni-share.js';
  import uniNavBar from '@/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-nav-bar.vue';
  const uniShare = new UniShare()
  // #endif
  import {
    store
  } from '@/uni_modules/uni-id-pages/common/store.js';
  const uniIdCo = uniCloud.importObject("uni-id-co");
  const db = uniCloud.database();
  export default {
    // #ifdef APP-PLUS
    components: {
      "uni-nav-bar": uniNavBar
    },
    onBackPress({
      from
    }) {
      if (from == 'backbutton') {
        if (uniShare.isShow) {
          this.$nextTick(function() {
            console.log(uniShare);
            uniShare.hide()
          })
        }
        return uniShare.isShow;
      }
    },
    // #endif

    data() {
      return {
        isAdmin: false, // 判断是否为管理员
        isMaterialCreator: false, // 判断是否为创建者
        materialImage: '',
        title: '',
        category: '',
        courseName: '',
        comments: [],
        isCommentsLoading: true, // 控制加载中提示的变量
        rating: 0, // 当前评分
        currentRating: 0,
        id: '',
        averageRating: 0, // 接收的平均评分
        starRating: [] // 用于存放星级的数组
      }
    },
    computed: {
      userInfo() {
        return store.userInfo;
      },
      displayRating() {
        if (this.averageRating === 0) {
          return '暂无评分';
        } else {
          return this.averageRating.toFixed(1);
        }
      }
    },
    onLoad(options) {
      // 1. 检查当前用户是否为管理员
      this.checkUserRole();

      // 2. 检查当前用户是否为资料创建者
      this.checkCreator();
      this.id = options.id;
      this.title = options.title ? decodeURIComponent(options.title) : '未命名';
      this.fetchInitialRating(); // 查询初始评分
      this.loadRating(); // 页面加载时查询评分记录

      // 模拟获取数据
      this.fetchMaterialDetails();
      this.fetchComments();
    },
    onShow() {
      this.fetchMaterialDetails(); // 页面显示时刷新数据
    },
    methods: {
      $log(...args) {
        console.log('args', ...args, this.id)
      },
      async checkUserRole() {
        try {
          const usersCollection = db.collection('uni-id-users');

          // 查询当前用户的角色
          const userRes = await usersCollection.doc(this.userInfo._id).field('user_role').get();
          if (userRes.result.data.length > 0 && userRes.result.data[0].user_role === 'admin') {
            this.isAdmin = true; // 如果是管理员
          }
        } catch (error) {
          console.error('检查用户角色失败:', error);
        }
      },

      async checkCreator() {
        try {
          const materialsCollection = db.collection('materials');

          // 查询当前资料的创建者
          const materialRes = await materialsCollection.doc(this.id).get();
          if (materialRes.result.data.length > 0 && materialRes.result.data[0].creator_id === this.userInfo._id) {
            this.isMaterialCreator = true; // 如果是资料创建者
          }
        } catch (error) {
          console.error('检查资料创建者失败:', error);
        }
      },

      goToModifyPage() {
        uni.navigateTo({
          url: `/pages/material/modify_material?_id=${this.id}`,
        });
      },

      goToReportPage(Id) {
        uni.navigateTo({
          url: `/uni_modules/uni-feedback/pages/opendb-report/opendb-report?reported_id=${Id}&type=资料`
        });
      },

      // 查询数据库获取初始评分
      async fetchInitialRating() {
        try {
          const db = uniCloud.database();
          const res = await db.collection("materials").doc(this.id).get();
          if (res.result.data.length > 0) {
            this.averageRating = res.result.data[0].average_rating || 0; // 获取平均评分
            this.generateStarRating(this.averageRating); // 绘制评分星星
          } else {
            console.error("资料不存在");
          }
        } catch (error) {
          console.error("获取初始评分失败", error);
        }
      },

      loadRating() {
        const ratingsCollection = db.collection('material_ratings');
        const userId = this.userInfo._id;
        console.log('当前用户ID:', userId);
        const materialId = this.id;

        ratingsCollection
          .where({
            material_id: materialId,
            user_id: userId
          })
          .get()
          .then(res => {
            if (res.result.data && res.result.data.length > 0) {
              const userRating = res.result.data[0].rating; // 用户评分
              this.currentRating = userRating; // 设置当前评分状态
              console.log('已评分:', userRating);
            } else {
              this.currentRating = 0; // 未评分
              console.log('用户尚未评分');
            }
          })
          .catch(err => {
            console.error('查询评分记录失败:', err);
          });
      },
      generateStarRating(rating) {
        const fullStars = Math.floor(rating); // 整数部分
        const halfStar = rating - fullStars >= 0.5 ? 1 : 0; // 是否显示半颗星
        this.starRating = Array(fullStars).fill('full').concat(halfStar ? ['half'] : []);
      },
      fetchMaterialDetails() {
        db.collection('materials') // 访问 'materials' 表
          .doc(this.id) // 使用传入的资料 ID 查询
          .get() // 获取资料的详细信息
          .then(res => {
            if (res.result.data && res.result.data.length > 0) {
              const material = res.result.data[0]; // 获取查询到的第一个数据
              this.materialImage =
                (material.material_image && material.material_image.length > 0) ?
                material.material_image[0].url :
                '/static/default-image.png'; // 没有图片，使用占位图
              this.title = material.material_name || '未命名';
              this.category = material.category || '未定义类别'; // 获取资料类别
              this.courseName = material.course_name || '未定义课程'; // 获取相关课程名
            } else {
              // 处理未找到数据的情况
              uni.showToast({
                title: '资料不存在',
                icon: 'none'
              });
              this.materialImage = '/static/default-image.png'; // 使用占位图
            }
          })
          .catch(err => {
            console.error('获取资料详情失败:', err);
            uni.showToast({
              title: '资料加载失败',
              icon: 'none'
            });
            this.materialImage = '/static/default-image.png'; // 使用占位图
          });
      },
      async fetchComments() {
        const commentsCollection = db.collection('material_comments').orderBy("created_at", "desc");
        const usersCollection = db.collection('uni-id-users');

        // 设置加载中提示
        this.isCommentsLoading = true;

        try {
          // 获取当前资料的所有评论记录
          const res = await commentsCollection.where({
            material_id: this.id
          }).get();
          const commentsData = res.result.data || [];

          // 获取每条评论对应的用户数据，捕获单个错误
          const userRequests = commentsData.map(async (comment) => {
            try {
              const userRes = await usersCollection
                .doc(comment.user_id)
                .field('avatar_file, nickname')
                .get();
              return userRes.result.data?.[0] || {};
            } catch (err) {
              console.error(`加载用户 ${comment.user_id} 信息失败:`, err);
              return {}; // 返回空对象以便后续处理
            }
          });

          // 并行获取用户数据
          const userResults = await Promise.all(userRequests);

          // 合并评论和用户数据
          this.comments = commentsData.map((comment, index) => {
            const user = userResults[index];
            return {
              avatar: user.avatar_file?.url || '/static/default-avatar.png',
              nickname: user.nickname || '匿名用户',
              _id: comment._id,
              user_id: comment.user_id,
              comment_text: comment.comment_text,
              created_at: comment.created_at,
            };
          });
        } catch (err) {
          console.error('加载评论失败:', err);
          uni.showToast({
            title: '评论加载失败',
            icon: 'none'
          });
        } finally {
          // 加载完成后隐藏加载中提示
          this.isCommentsLoading = false;
        }
      },
      handleLongPress(comment) {
        uni.showActionSheet({
          itemList: ['删除'],
          success: async (res) => {
            if (res.tapIndex === 0) { // 点击删除
              try {
                const isCommentCreator = comment.user_id === this.userInfo._id;
                if (isCommentCreator || this.isAdmin) {
                  await this.deleteComment(comment._id); // 调用删除评论的逻辑
                  uni.showToast({
                    title: '删除成功',
                    icon: 'success'
                  });
                } else {
                  uni.showToast({
                    title: '没有权限删除',
                    icon: 'none'
                  });
                }
              } catch (err) {
                uni.showToast({
                  title: '操作失败',
                  icon: 'none'
                });
              }
            }
          },
          fail: () => {
            console.log('取消操作');
          }
        });
      },
      async deleteComment(commentId) {
        try {
          await db.collection('material_comments').doc(commentId).remove();
          // 更新本地数据
          this.comments = this.comments.filter(comment => comment._id !== commentId);
        } catch (error) {
          console.error('删除评论失败:', error);
          throw error;
        }
      },
      rate(star) {
        const ratingsCollection = db.collection('material_ratings');
        const materialsCollection = db.collection('materials'); // 资料表
        const userId = this.userInfo._id; // 当前用户 ID
        const materialId = this.id; // 当前资料 ID

        console.log('当前用户ID', userId);

        if (!userId) {
          // 如果用户未登录，弹出提示框询问是否跳转到登录
          uni.showModal({
            title: '未登录',
            content: '您未登录，是否前往登录？',
            success: (modalRes) => {
              if (modalRes.confirm) {
                // 用户点击确定，跳转到登录页面
                uni.navigateTo({
                  url: '/uni_modules/uni-id-pages/pages/login/login-withpwd' // 假设登录页面路径为 /pages/login/login
                });
              } else {
                // 用户点击取消
                console.log('用户取消跳转到登录页面');
              }
            }
          });
          return; // 退出函数，避免执行评分逻辑
        }

        // 如果已登录，继续原有的评分逻辑
        ratingsCollection
          .where({
            material_id: materialId,
            user_id: userId
          })
          .get()
          .then(res => {
            if (res.result.data && res.result.data.length > 0) {
              // 如果已经评分
              uni.showToast({
                title: '您已评过分，请勿重复评分',
                icon: 'none'
              });
              console.log('评分记录已存在:', res.result.data[0]);
            } else {
              // 如果未评分，弹出确认提示
              uni.showModal({
                title: '确认评分',
                content: `您确定要给 ${star} 星评分吗？`,
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    // 用户确认评分
                    const currentTime = new Date().toISOString(); // 获取本地时间（日期和时间）
                    ratingsCollection
                      .add({
                        material_id: materialId,
                        user_id: userId,
                        rating: star,
                        created_at: currentTime
                      })
                      .then(() => {
                        uni.showToast({
                          title: `评分成功: ${star} 星`,
                          icon: 'success'
                        });
                        console.log('评分记录已添加:', {
                          material_id: materialId,
                          user_id: userId,
                          rating: star,
                          created_at: currentTime
                        });
                        this.currentRating = star; // 更新页面显示的评分状态
                        // 更新资料的平均评分
                        this.updateAverageRating(materialId);
                      })
                      .catch(err => {
                        console.error('评分失败:', err);
                        uni.showToast({
                          title: '评分失败，请稍后再试',
                          icon: 'none'
                        });
                      });
                  } else {
                    console.log('用户取消评分');
                  }
                }
              });
            }
          })
          .catch(err => {
            console.error('查询评分记录失败:', err);
            uni.showToast({
              title: '评分查询失败，请稍后再试',
              icon: 'none'
            });
          });
      },
      // 更新资料的平均评分
      async updateAverageRating(materialId) {
        try {
          const ratingsCollection = db.collection('material_ratings');
          const materialsCollection = db.collection('materials');

          // 查询该资料所有评分记录
          const res = await ratingsCollection.where({
            material_id: materialId
          }).get();

          if (res.result.data && res.result.data.length > 0) {
            // 计算新的平均评分
            const ratings = res.result.data.map(item => item.rating);
            const newAverageRating =
              ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

            // 更新资料表中的 average_rating 字段
            await materialsCollection.doc(materialId).update({
              average_rating: newAverageRating
            });

            console.log('平均评分已更新:', newAverageRating);

            // 更新页面显示
            this.averageRating = newAverageRating;
            this.generateStarRating(newAverageRating);
          } else {
            console.warn('未找到评分记录，无法计算平均评分');
          }
        } catch (error) {
          console.error('更新平均评分失败:', error);
          uni.showToast({
            title: '更新评分失败，请稍后再试',
            icon: 'none'
          });
        }
      },
      downloadMaterial() {
        const materialsCollection = db.collection('materials');
        const materialId = this.id; // 当前资料 ID

        // 查询资料下载链接
        materialsCollection
          .doc(materialId)
          .get()
          .then(res => {
            if (res.result.data && res.result.data.length > 0) {
              const material = res.result.data[0];
              const downloadLink = material.download_link;

              if (downloadLink) {
                // 弹出提示框显示下载链接
                uni.showModal({
                  title: '下载资料',
                  content: `资料下载链接：${downloadLink}`,
                  confirmText: '复制链接',
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      // 用户点击复制链接
                      uni.setClipboardData({
                        data: downloadLink,
                        success: () => {
                          uni.showToast({
                            title: '下载链接已复制',
                            icon: 'success'
                          });
                        }
                      });
                    } else {
                      console.log('用户取消复制链接');
                    }
                  }
                });
              } else {
                // 如果没有下载链接
                uni.showToast({
                  title: '未找到下载链接',
                  icon: 'none'
                });
              }
            } else {
              // 如果资料不存在
              uni.showToast({
                title: '资料不存在',
                icon: 'none'
              });
            }
          })
          .catch(err => {
            console.error('获取下载链接失败:', err);
            uni.showToast({
              title: '获取下载链接失败',
              icon: 'none'
            });
          });
      },
      postComment() {
        const userId = this.userInfo._id; // 获取当前用户id（从本地存储获取）

        if (!userId) {
          // 如果用户未登录，弹出提示框询问是否跳转到登录
          uni.showModal({
            title: '未登录',
            content: '您未登录，是否前往登录？',
            success: (modalRes) => {
              if (modalRes.confirm) {
                // 用户点击确定，跳转到登录页面
                uni.navigateTo({
                  url: '/uni_modules/uni-id-pages/pages/login/login-withpwd' // 假设登录页面路径为 /pages/login/login
                });
              } else {
                // 用户点击取消
                console.log('用户取消跳转到登录页面');
              }
            }
          });
          return; // 退出函数，避免执行评论逻辑
        }

        // 如果已登录，弹出输入框进行评论
        uni.showModal({
          title: '发表评论',
          content: '',
          editable: true,
          placeholderText: '请输入评论内容（100字以内）',
          success: (modalRes) => {
            if (modalRes.confirm) {
              const commentText = modalRes.content.trim(); // 获取评论内容并去除两端空格
              if (commentText.length === 0) {
                uni.showToast({
                  title: '评论内容不能为空',
                  icon: 'none'
                });
                return;
              }

              if (commentText.length > 100) {
                uni.showToast({
                  title: '评论内容超过100字',
                  icon: 'none'
                });
                return;
              }

              const materialId = this.id; // 当前资料的ID
              const currentTime = new Date().toISOString(); // 获取时间（日期和时间）
              console.log('当前用户ID', userId);
              console.log('当前时间', currentTime);
              // 将评论数据保存到material_comments表
              db.collection('material_comments')
                .add({
                  user_id: userId,
                  material_id: materialId,
                  comment_text: commentText,
                  created_at: currentTime
                })
                .then((res) => {
                  console.log('评论发布成功:', res);
                  const newComment = {
                    avatar: this.userInfo.avatar_file?.url || '/static/default-avatar.png',
                    nickname: this.userInfo.nickname || '匿名用户',
                    comment_text: commentText,
                    created_at: currentTime
                  };
                  this.comments.unshift(newComment); // 将新评论插入到评论列表顶部
                  this.fetchComments();
                  uni.showToast({
                    title: '评论发布成功',
                    icon: 'success'
                  });
                })
                .catch((err) => {
                  console.error('评论发布失败:', err);
                  uni.showToast({
                    title: '评论发布失败',
                    icon: 'none'
                  });
                });
            } else {
              console.log('用户取消评论');
            }
          }
        });
      },
      formatData(timestamp) {
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
    }
  }
</script>

<style lang="scss">
  @import '@/common/uni-ui.scss';

  page {
    background-color: #f8f8f8;
  }



  .image-container {

    width: 100%;
    height: 18%;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .image-container image {
    margin-top: 10px;
    object-fit: contain;
    width: 60%;
    height: 210px;
    width: 210px;
    max-height: 80%;
    border-radius: 5px;
  }

  .action-button {
    position: fixed;
    right: 4%;
    top: 2%;
    box-shadow: 1px 2px 5px rgba(0, 0, 0, 0.2);
    width: 55px;
    height: 55px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .button-text {
    margin-top: -5px;
    font-size: 12px;
    word-spacing: 10px;
    letter-spacing: 1px;
  }

  .modify-icon {
    width: 30px;
    height: 30px;
  }

  .title {
    font-weight: bold;
    font-size: 25px;
    text-align: center;
    margin: 10px 0;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .rating-container {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
    margin-bottom: 10px;
    background-color: transparent;
  }

  .stars1 {
    display: flex;
    margin-bottom: 5px;
  }

  .star-image {
    width: 25px;
    height: 25px;
    margin-right: 5px;
  }

  .rating-text {
    margin-right: 10px;
    margin-bottom: 4px;
    font-size: 20px;
    color: #f39c12;
  }

  .attributes {
    width: 90%;
    margin-left: auto;
    margin-right: auto;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
  }

  .info {
    font-size: 17px;
    width: 100%;
    margin-bottom: 8px;
  }

  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    text-align: center;
    font-size: 16px;
    color: #888;
    background-color: rgba(255, 255, 255, 0.6);
    /* 使背景透明，突出显示加载提示 */
    position: absolute;
    /* 让它覆盖在评论区框内 */
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 10px;
    /* 和评论区的圆角一致 */
  }

  .comments-container {
    margin-top: 10px;
    width: 90%;
    margin-left: auto;
    margin-right: auto;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
    border-radius: 5px;
    height: 37vh;
    overflow-y: auto;
    background-color: white;
    padding: 10px;
    border-radius: 10px;
  }

  .comment-item {
    display: flex;
    align-items: flex-start;
    padding: 12px 16px;
    border-bottom: 1px solid #eaeaea;
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 12px;
  }

  .comment-info {
    flex: 1;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .nickname {
    font-size: 14px;
    font-weight: bold;
    color: #333;
  }

  .created-at {
    font-size: 12px;
    color: #888;
  }

  .comment-text {
    margin-top: 4px;
    font-size: 14px;
    color: #555;
    word-wrap: break-word;
  }

  .dynamic-rating {
    margin: 15px, 0, 10px, 0;
    font-size: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    background-color: transparent;
  }

  .rating {
    display: flex;
    justify-content: center;
  }

  .star {
    font-size: 30px;
    color: #ccc;
    cursor: pointer;
  }

  .star.active {
    color: #f39c12;
    /* 已评分的星星颜色 */
  }

  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background-color: transparent;
  }

  .info-container {
    margin-top: 2%;
    width: 95%;
    margin-left: auto;
    margin-right: auto;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
    border-radius: 5px;
    background-color: white;
  }

  .footer button {
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
    flex: 1;
    height: 50px;
    margin: 0 10px;
    border: none;
    border-radius: 25px;
    background-color: #f8dccd;
    color: #333;
    font-size: 18px;
    font-weight: bold;
    text-align: center;
    cursor: pointer;
  }

  .footer button:first-child {
    margin-left: 0;
  }

  .footer button:last-child {
    margin-right: 0;
  }

  .footer button:active {
    background-color: #f4bfb6;
  }

  .variant {
    color: rgb(253, 131, 116);
  }
</style>