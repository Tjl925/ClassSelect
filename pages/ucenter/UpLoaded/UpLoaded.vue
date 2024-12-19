<template>
  <view class="container">
    <!-- 选项卡 -->
    <view class="tabs">
      <view v-for="(tab, index) in tabs" :key="tab" class="tab-item" :class="{ 'active': currentTab === index }"
        @click="switchTab(index)">
        {{ tab }}
      </view>
    </view>
    <!-- 已发布的课程 -->
    <unicloud-db v-if="currentTab === 0 && currentUserId" ref="udbCourses"
      v-slot:default="{data, pagination, loading, hasMore, error}" collection="course_ratings,course-info"
      @load="onLoad" @error="onError" field="course_id,course_name, teacher_name,rating" :page-size="5">
      <uni-list>
        <uni-list-item v-for="(item, index) in Mycourse.slice(0,pageSize)" :key="index" :clickable="true"
          @click="PosthandleItemClick(item)" @longpress="showOptions(item._id,currentTab)">
          <template class="course-list" v-slot:body>
            <view class="course-card">
              <text class="course-name">{{ item.course_name }}</text>
              <view class="teacher-name">
                <image class="teacher-icon" src="/static/person.png"></image>
                <text class="name-text">{{ item.teacher_name }}</text>
              </view>
              <text class="rating">{{displayRating(item.average_rating)}}</text>
            </view>
          </template>
        </uni-list-item>
      </uni-list>
      <uni-load-state :state="{Mycourse, pagination, hasMore, loading, error}"></uni-load-state>
    </unicloud-db>

    <!-- 已发布的资料 -->
    <unicloud-db v-if="currentTab === 1 && currentUserId" ref="udbMaterials"
      v-slot:default="{data, pagination, loading, hasMore, error}" collection="materials" @load="onLoad"
      @error="onError" field="material_name,creator_id" :page-size="10">
      <uni-list>
        <uni-list-item v-for="(item, index) in Mymaterials" :key="index" :clickable="true"
          @click="PosthandleItemClick(item)" @longpress="showOptions(item._id, currentTab)">
          <template class="course-list" v-slot:body>
            <view class="course-card">
              <text class="course-name">《{{ item.material_name }}》</text>
              <text class="rating">{{displayRating(item.average_rating ) }}</text>
            </view>
          </template>
        </uni-list-item>
      </uni-list>
      <uni-load-state :state="{Mymaterials, pagination, hasMore, loading, error}"></uni-load-state>
    </unicloud-db>
    <!-- 已发布的帖子 -->
    <view v-if="currentTab === 2 && currentUserId" class="post-list" :clickable="true" style="background-color:white;">
      <unicloud-db ref="udb" v-slot:default="{data, loading, error, options}" :options="formData"
        :collection="collection" :field="field" :where="whereCondition" @load="load">
        <!-- 基于 uni-list 的页面布局 -->
        <uni-list>
          <!-- to 属性携带参数跳转详情页面，当前只为参考 -->
          <uni-list-item direction="column" v-for="item in Mypost" :key="item._id"
            :to="'/pages/community/detail?id='+item._id+'&title='+item.title"
            @longpress="showOptions(item._id, currentTab)">
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
                      <image src="/static/community/ans.png" mode="aspectFit" class="footer-image"></image>
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
            </template>
          </uni-list-item>
        </uni-list>
        <uni-load-more v-if="loading || options.status === 'noMore'" :status="options.status" />
      </unicloud-db>
    </view>
  </view>
</template>

<script>
  import {
    ref
  } from 'vue';
  import {
    store
  } from '@/uni_modules/uni-id-pages/common/store.js';
  const db = uniCloud.database();
  export default {
    data() {
      return {
        pageSize: 10,
        iconnection: [],
        Mycourse: [], // 存储用户所有发布过的课程的相关信息
        Mymaterials: [],
        Mypost: [],
        courseInfowithRtings: [], // 在Mycourse的基础上保存该项课程的平均分
        tabs: ['已发布的课程', '已发布的资料', '已发布帖子'],
        currentTab: 0,
        currentUserId: store.userInfo._id || '', // 确保有值
        isLoading: true,
        loadMore: {
          contentdown: '',
          contentrefresh: '',
          contentnomore: '',
        }
      };
    },
    onReachBottom() {
      // 检查MyCourse的长度和当前页面大小
      console.log(this.Mycourse);
      if (this.Mycourse.length > this.pageSize) {
        console.log("当前课程数量：" + this.Mycourse.length);
        // 如果MyCourse的数据量大于当前页面大小，增加页面大小
        this.pageSize += 5;
      } else {
        // 如果MyCourse的数据量不大于当前页面大小，提示已加载所有记录
        uni.showToast({
          title: '已加载全部记录',
          icon: 'none',
        });
      }
    },
    methods: {
      displayRating(Rating) {
        if (!Rating) {
          return '待评分';
        } else {
          return Rating.toFixed(1);
        }
      },
      // 获取课程数据
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
      getMyCourse() {
        uni.showLoading({
          title: "加载中...",
          mask: true,
        });
        let collectionQuery = db.collection("course-info").orderBy("created_at", "desc");

        // 如果有关键词，添加模糊查询条件

        collectionQuery = collectionQuery.where({
          creator_id: this.currentUserId
        })

        // 获取课程数据
        collectionQuery
          .get()
          .then(async (res) => {
            if (res.result.data && Array.isArray(res.result.data)) {
              // 并行获取每门课程的评分数据
              const coursesWithRatings = await Promise.all(
                res.result.data.map((course) => {
                  return {
                    ...course
                  }
                })
              );
              this.Mycourse = coursesWithRatings;
            } else {
              this.Mycourse = []; // 如果返回数据为空，则清空课程列表
            }
          })
          .catch((error) => {
            console.error("获取课程数据失败:", error);
            uni.showToast({
              title: "加载课程数据失败",
              icon: "none",
            });
          })
          .finally(() => {
            uni.hideLoading(); // 隐藏加载动画
          });
      },
      getMyMaterials() {
        uni.showLoading({
          title: "加载中...",
          mask: true,
        });

        let collectionQuery = db.collection("materials").orderBy("created_at", "desc");

        // 如果有关键词，添加模糊查询条件

        collectionQuery = collectionQuery.where({
          creator_id: this.currentUserId
        })

        // 获取资料数据
        collectionQuery
          .get()
          .then(async (res) => {
            if (res.result.data && Array.isArray(res.result.data)) {
              // 并行获取每门课程的评分数据
              const materialWithRatings = await Promise.all(
                res.result.data.map((materials) =>
                  this.getMaterialsRating(materials._id).then((averageRating) => ({
                    ...materials,
                    averageRating,
                  }))
                )
              );
              this.Mymaterials = materialWithRatings;
            } else {
              this.Mymaterials = []; // 如果返回数据为空，则清空课程列表
            }
          })
          .catch((error) => {
            console.error("获取资料数据失败:", error);
            uni.showToast({
              title: "加载资料数据失败",
              icon: "none",
            });
          })
          .finally(() => {
            uni.hideLoading(); // 隐藏加载动画
          });
      },

      getMyPost() {
        let collectionQuery = db.collection('community_post');
        collectionQuery = collectionQuery.where({
          user_id: store.userInfo._id
        });
        collectionQuery.get().then(async (res) => {
          if (res.result.data && Array.isArray(res.result.data)) {
            // 并行获取每个帖子对应的用户数据
            const postinfo = await Promise.all(
              res.result.data.map((post) =>
                this.getNickNameinfo(post.user_id).then(userinfo => ({
                  ...post,
                  ...userinfo, // 使用正确的变量名
                }))
              )
            );
            this.Mypost = postinfo;
          } else {
            this.Mypost = []; // 如果返回数据为空，则清空答案列表
          }
          //this.isLoading = false;
        }).catch(err => {
          console.error("获取帖子数据失败:", err);
        });
      },
      async getNickNameinfo(uid) {
        console.log("当前的用户id" + (uid));
        return db
          .collection("uni-id-users")
          .where({
            _id: uid // 确保这里是文档的ID字段，通常是 _id
          })
          .field({
            nickname: true,
            avatar: true,
          })
          .get()
          .then((res) => {
            if (res.result.data && res.result.data.length > 0) {
              const userinfo = res.result.data[0]; // 获取帖子信息
              return {
                nickname: userinfo.nickname, // 返回昵称
                avatar: userinfo.avatar,
              }; // 返回一个对象，包含标题和点赞数
            } else {
              return {
                nickname: '无昵称', // 返回昵称
                avatar: '',
              }; // 返回一个对象，包含标题和点赞数的默认值
            }
          })
          .catch((error) => {
            console.error("获取用户昵称失败:", error);
            uni.showToast({
              title: "加载用户昵称失败",
              icon: "none",
            });
            this.isLoading = false;
          });
      },
      async getMaterialsRating(materialId) {
        return db
          .collection("material_ratings")
          .where({
            material_id: materialId
          }) // 查找对应课程的评分
          .get()
          .then((res) => {
            if (res.result.data && res.result.data.length > 0) {
              const ratings = res.result.data.map((item) => item.rating);
              const totalRating = ratings.reduce((acc, rating) => acc + rating, 0);
              return totalRating / ratings.length; // 返回平均分
            } else {
              return "待评分"; // 如果没有评分数据
            }
          })
          .catch((error) => {
            console.error("获取资料评分失败:", error);
            return 0; // 如果发生错误，返回 0
          });
      },
      // 获取课程评分的平均值
      async getCourseRating(courseId) {
        return db
          .collection("course_ratings")
          .where({
            course_id: courseId
          }) // 查找对应课程的评分
          .get()
          .then((res) => {
            if (res.result.data && res.result.data.length > 0) {
              const ratings = res.result.data.map((item) => item.rating);
              const totalRating = ratings.reduce((acc, rating) => acc + rating, 0);
              return totalRating / ratings.length; // 返回平均分
            } else {
              return "待评分"; // 如果没有评分数据
            }
          })
          .catch((error) => {
            console.error("获取课程评分失败:", error);
            return 0; // 如果发生错误，返回 0
          });
      },
      async onLoad() {
        // 用户已登录，执行数据加载逻辑
        await this.getMyCourse();
        console.log("课程信息", this.Mycourse);
        console.log("课程评分信息", this.courseInfowithRtings);
        await this.getMyMaterials();
        console.log("资料信息", this.Mymaterials);
        console.log("资料评分信息", this.Mymaterials);
        this.getMyPost();
        console.log("帖子信息", this.Mypost);
      },
      switchTab(index) {
        this.currentTab = index;
      },
      onError(error) {
        console.error('Error loading data:', error);
        this.isLoading = true; // 发生错误，设置 isLoading 为 true
      },
      showOptions(id, currentTab) {
        uni.showActionSheet({
          itemList: ['修改'],
          success: function(res) {
            console.log('用户当前页面编号：' + (currentTab));
            let icollection;
            if (res.tapIndex + 1 == 1) { // 索引从0开始，所以需要与操作列表匹配
              console.log('用户选择了删除');
              //删除逻辑
              let url = '';
              if (currentTab === 0) {
                console.log(id);
                url = '/pages/course/modify_course?_id=' + id;
              } else if (currentTab === 1) {
                console.log(id);
                url = '/pages/material/modify_material?_id=' + id;
              } else if (currentTab === 2) {
                url = '/pages/community/modify_community?postId=' + id;
              }
              uni.navigateTo({
                url: url
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
      }, //showoptions层
      PosthandleItemClick(item) {
        let url = '';
        if (this.currentTab === 0) {
          url = '/pages/course/detail?_id=' + item._id + '&title=' + item.course_name + '&averageRating=' +
            item.averageRating;
        } else if (this.currentTab === 1) {
          url = '/pages/material/detail?id=' + item._id + '&title=' + item.material_name + '&averageRating=' +
            item.averageRating;
        } else if (this.currentTab === 2) {
          url = '/pages/list/detail?id=' + item._id + '&title=' + item.title;
        }
        uni.navigateTo({
          url: url
        });
      }
    },

    mounted() {
      this.onLoad();
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
    right: -15%;
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

  .container {
    padding: 10px;
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid #ccc;
    margin-bottom: 10px;
  }

  .tab-item {
    padding: 10px;
    cursor: pointer;
    flex: 1;
    text-align: center;
  }

  .tab-item.active {
    border-bottom: 2px solid blue;
  }


  .article-date {
    color: #C8C7CC;
  }

  .course-name {
    font-weight: bold;
    position: absolute;
    left: 5%;
  }

  .teacher-name {
    position: absolute;
    right: 20%;
    padding: 10px;
  }



  .course-title {
    font-size: 18px;
    font-weight: bold;
    color: #333333;
    margin-bottom: 10px;
  }

  .course-info text {
    line-height: 1.5;
  }

  .name {
    color: green;
    /* 绿色 */
    font-weight: bold;
    /* 加粗 */
  }

  /* 设置评分和点赞数样式 */

  .likes_count {
    color: red;
    /* 红色 */
  }

  /* 设置发布时间样式 */
  .created_at {
    color: #ccc;
    /* 浅色 */
  }

  /* 设置容器样式，使内容水平排列 */
  .course-card,
  .material-card,
  .post-card {
    display: flex;
    align-items: center;
    /* 垂直居中 */
    justify-content: space-between;
    /* 两端对齐 */
    padding: 10px;
    /* 间距 */
  }

  /* 设置列表项样式 */
  .uni-list-item {
    display: flex;
    align-items: center;

  }

  /* 设置文本样式 */
  .text {
    flex-grow: 1;
    /* 允许文本占据更多空间 */
  }


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
    width: 100%
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

  .course-name {
    font-weight: bold;
  }

  .teacher-name {
    color: gray;
    position: absolute;
    right: 20%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
  }

  .name-text {}

  .teacher-icon {
    margin-top: 5px;
    width: 20px;
    height: 20px;
  }

  .rating {
    position: absolute;
    color: rgb(253, 131, 116);
    right: 6%;
  }


  .course-card {
    width: 100%;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.1);
    padding: 30px;
    display: flex;
    flex-direction: row;
  }
</style>