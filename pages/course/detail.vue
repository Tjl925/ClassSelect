<template>
  <button @click="goToModifyPage" class="action-button" v-if="isAdmin || isCourseCreator">
    <image class="modify-icon" src="/static/modify.png" alt="修改" />
    <text class="button-text">修改</text>
  </button>
  <button @click="goToReportPage(id)" class="action-button" v-else>
    <image class="modify-icon" src="/static/report.png" alt="举报" />
    <text class="button-text">举报</text>
  </button>


  <!-- 平均分和静态星星图标 -->
  <view class="info-container">
    <view class="course-title">{{course_name}}</view>
    <!-- 属性信息 -->
    <view class="attributes">
      <text class="info">教师：<text class="variant">{{teacher_name}}</text></text>
      <text class="info">学分：<text class="variant">{{credit}}</text></text>
      <text class="info">评分人数：<text class="variant">{{rate_count}}</text></text>
      <text class="info">开课学院：<text class="variant">{{college}}</text></text>
      <text class="info">开课校区：<text class="variant">{{course_location}}</text></text>
      <text class="info">课程号：<text class="variant">{{course_number}}</text></text>
    </view>

    <view class="rating-container">
      <text class="rating-text">{{ displayRating }}</text>
      <view class="stars1">
        <image v-for="(star, index) in starRating" :key="index"
          :src="star === 'full' ? '/static/full-star.png' : '/static/half-star.png'" class="star-image"></image>
      </view>
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
            <text class="created-at">{{ formatDate(comment.created_at) }}</text>
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
    <button @click="toCreate" style="font-size: 20px; font-weight: bold;">创建课程</button>
    <button @click="postComment" style="font-size: 20px; font-weight: bold;">评论</button>
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
        isCourseCreator: false, // 判断是否为创建者
        hasComment: false,
        course_name: '',
        course_location: '',
        college: '',
        teacher_name: '',
        credit: '',
        rate_count: 0,
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
      this.id = options._id;
      this.fetchInitialRating();
      this.loadRating(); // 页面加载时查询评分记录

      // 模拟获取数据
      this.fetchcourseDetails();
      this.fetchComments();
    },
    onShow() {
      this.fetchcourseDetails(); // 页面显示时刷新数据
    },

    methods: {
      toCreate() {
        uni.navigateTo({
          url: "/pages/course/create_course/create_course"
        })
      },
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
          const coursesCollection = db.collection('course-info');
          // 查询当前资料的创建者
          const courseRes = await coursesCollection.doc(this.id).get();
          if (courseRes.result.data.length > 0 && courseRes.result.data[0].creator_id === this.userInfo._id) {
            this.isCourseCreator = true; // 如果是创建者
          }
        } catch (error) {
          console.error('检查课程信息创建者失败:', error);
        }
      },
      goToModifyPage() {
        uni.navigateTo({
          url: `/pages/course/modify_course?_id=${this.id}`,
        });
      },

      goToReportPage(Id) {
        uni.navigateTo({
          url: `/uni_modules/uni-feedback/pages/opendb-report/opendb-report?reported_id=${Id}&type=课程信息`
        });
      },
      // 查询数据库获取初始评分
      async fetchInitialRating() {
        try {
          const db = uniCloud.database();
          const res = await db.collection("course-info").doc(this.id).get();
          if (res.result.data.length > 0) {
            this.averageRating = res.result.data[0].average_rating || 0; // 获取平均评分
            this.generateStarRating(this.averageRating); // 绘制评分星星
          } else {
            console.error("课程不存在");
          }
        } catch (error) {
          console.error("获取初始评分失败", error);
        }
      },
      loadRating() {
        const ratingsCollection = db.collection('course_ratings');
        const userId = this.userInfo._id;
        console.log('当前用户ID:', userId);
        const courseId = this.id;

        ratingsCollection
          .where({
            course_id: courseId,
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
      fetchcourseDetails() {
        db.collection('course-info') // 访问表
          .doc(this.id) // 使用传入的 ID 查询
          .get() // 获取资料的详细信息
          .then(res => {
            if (res.result.data && res.result.data.length > 0) {
              const course = res.result.data[0]; // 获取查询到的第一个数据
              this.course_name = course.course_name || '未记录';
              this.course_location = course.course_location || '未记录';
              this.college = course.college || '未记录';
              this.teacher_name = course.teacher_name || '未记录';
              this.credit = course.credit || '未记录';
              this.course_number = course.course_number || '未记录';
            } else {
              // 处理未找到数据的情况
              uni.showToast({
                title: '课程不存在',
                icon: 'none'
              });
            }
          })
          .catch(err => {
            console.error('获取详情失败:', err);
            uni.showToast({
              title: '加载失败',
              icon: 'none'
            });
          });

        db.collection('course_ratings')
          .where({
            course_id: this.id
          }) // 使用传入的 ID 查询
          .get()
          .then(res => {
            console.log(res.result);
            this.rate_count = res.result.data.length;
          })
      },
      async fetchComments() {
        const commentsCollection = db.collection('course_comments').orderBy("created_at", "desc");
        const usersCollection = db.collection('uni-id-users');

        // 设置加载中提示
        this.isCommentsLoading = true;

        try {
          // 获取当前资料的所有评论记录
          const res = await commentsCollection.where({
            course_id: this.id
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
        };

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
          await db.collection('course_comments').doc(commentId).remove();
          // 更新本地数据
          this.comments = this.comments.filter(comment => comment._id !== commentId);
        } catch (error) {
          console.error('删除评论失败:', error);
          throw error;
        }
      },
      rate(star) {
        const ratingsCollection = db.collection('course_ratings');
        const userId = this.userInfo._id; // 当前用户 ID
        const courseId = this.id; // 当前资料 ID

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
                  url: '/pages/login/login' // 假设登录页面路径为 /pages/login/login
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
            course_id: courseId,
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
                        course_id: courseId,
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
                          course_id: courseId,
                          user_id: userId,
                          rating: star,
                          created_at: currentTime
                        });
                        this.currentRating = star; // 更新页面显示的评分状态
                        this.updateAverageRating(courseId);
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
      async updateAverageRating(courseId) {
        try {
          const ratingsCollection = db.collection('course_ratings');
          const coursesCollection = db.collection('course-info');

          // 查询该资料所有评分记录
          const res = await ratingsCollection.where({
            course_id: courseId
          }).get();

          if (res.result.data && res.result.data.length > 0) {
            // 计算新的平均评分
            const ratings = res.result.data.map(item => item.rating);
            const newAverageRating =
              ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

            // 更新资料表中的 average_rating 字段
            await coursesCollection.doc(courseId).update({
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
        };
        this.rate_count += 1;
      },
      downloadcourse() {
        const coursesCollection = db.collection('courses');
        const courseId = this.id; // 当前资料 ID

        // 查询资料下载链接
        coursesCollection
          .doc(courseId)
          .get()
          .then(res => {
            if (res.result.data && res.result.data.length > 0) {
              const course = res.result.data[0];
              const downloadLink = course.download_link;

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
              // 如果不存在
              uni.showToast({
                title: '课程不存在',
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
                  url: '/pages/login/login' // 假设登录页面路径为 /pages/login/login
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

              const courseId = this.id; // 当前资料的ID
              const currentTime = new Date().toISOString(); // 获取本地时间（日期和时间）
              console.log('当前用户ID', userId);
              console.log('当前时间', currentTime);
              // 将评论数据保存到course_comments表
              db.collection('course_comments')
                .add({
                  user_id: userId,
                  course_id: courseId,
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
    }
  }
</script>

<style lang="scss">
  @import '@/common/uni-ui.scss';

  page {
    background-color: #f8f8f8;
  }

  .container {
    background-color: white;
  }

  .image-container {
    width: 100%;
    height: 20%;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .image-container image {
    object-fit: contain;
    width: 60%;
    max-height: 100%;
  }

  .action-button {
    position: fixed;
    right: 4%;
    top: 3%;
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
    flex-wrap: wrap;
  }

  .info {
    font-size: 17px;
    width: 50%;
    margin-bottom: 20px;
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
    width: 90%;
    margin-left: auto;
    margin-right: auto;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
    border-radius: 5px;
    height: 52vh;
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
    position: absolute;
    bottom: 10%;
    font-size: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
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
  }

  .footer button {
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

  .course-title {
    margin-left: 5%;
    padding-top: 10px;
    padding-bottom: 15px;
    margin-top: 20px;
    font-size: 28px;
    font-weight: bold;
  }

  .variant {
    color: rgb(253, 131, 116);
  }

  .info-container {
    width: 95%;
    margin-left: auto;
    margin-right: auto;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
    border-radius: 5px;
    background-color: white;
  }
</style>