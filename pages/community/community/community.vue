<template>
  <view class="pages">
    <!-- #ifndef H5 -->
    <statusBar></statusBar>
    <!-- #endif -->

    <!-- 搜索功能 -->
    <view class="uni-search-box">
      <uni-search-bar v-model="keyword" ref="searchBar" radius="100" cancelButton="none" disabled
        :placeholder="inputPlaceholder" />
      <view class="cover-search-bar" @click="searchClick"></view>
    </view>

    <unicloud-db ref='udb' v-slot:default="{data,pagination,hasMore, loading, error, options}" @error="onqueryerror"
      :collection="colList" :page-size="10">
      <!test>
        <uni-list border="false">
          <uni-list-item v-for="(course, index) in courses" :key="index">
            <!-- 自定义 header -->
            <template v-slot:body class="course-list">
              <view class="course-card">
                <text class="course-name">{{ course.course_name }}</text>
                <view class="teacher-name">
                  <image class="teacher-icon" src="/static/person.png"></image>
                  <text class="name-text">{{ course.teacher_name }}</text>
                </view>
                <text class="rating">{{ course.averageRating }}</text>
              </view>
            </template>
          </uni-list-item>
        </uni-list>

    </unicloud-db>
  </view>
  <view class="create-button" @click="toCreate">发布课程信息</view>
</template>

<script>
  const db = uniCloud.database();
  let cdbRef;
  import statusBar from "@/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-status-bar";
  export default {
    components: {
      statusBar
    },
    computed: {
      inputPlaceholder(e) {
        if (uni.getStorageSync('CURRENT_LANG') == "en") {
          return 'Please enter the search content'
        } else {
          return '请输入搜索内容'
        }
      }
    },
    data() {
      return {
        where: '"status" == 1',
        courses: [], // 存储课程信息
        keyword: "", // 搜索关键词
      };
    },
    watch: {
      keyword(keyword, oldValue) {
        let where = '"status" == 1 '
        if (keyword) {
          this.where = where + `&& /${keyword}/.test(course_name)`;
        } else {
          this.where = where;
        }
      }
    },
    async onReady() {
      // #ifdef APP-NVUE
      /* 可用窗口高度 - 搜索框高 - 状态栏高 */
      this.listHight = uni.getSystemInfoSync().windowHeight - uni.getSystemInfoSync().statusBarHeight - 50 +
        'px';
      // #endif
      // #ifndef APP-NVUE
      this.listHight = 'auto'
      // #endif
      cdbRef = this.$refs.udb
    },
    onShow() {
      // 从全局变量中读取搜索关键词
      this.keyword = getApp().globalData.searchText || "";
      // 清空全局变量中的搜索关键词，防止干扰后续操作
      getApp().globalData.searchText = "";
      // 加载课程列表
      this.getCourses();
    },
    onLoad() {
      uni.setNavigationBarTitle({
        title: '课程列表' // 替换为你的标题
      });
    },
    methods: {
      toCreate() {
        uni.navigateTo({
          url: "/pages/community/create_course/create_course"
        })
      },
      // 点击搜索按钮，跳转到搜索页
      searchClick(e) { //点击搜索框
        uni.hideKeyboard();
        uni.navigateTo({
          url: '/pages/community/search/search',
          animationType: 'fade-in'
        });
      },
      retry() {
        this.refresh()
      },
      refresh() {
        cdbRef.loadData({
          clear: true
        }, () => {
          uni.stopPullDownRefresh()
          // #ifdef APP-NVUE
          this.showRefresh = false
          // #endif
          console.log('end');
        })
        console.log('refresh');
      },
      loadMore() {
        cdbRef.loadMore()
      },
      onqueryerror(e) {
        console.error(e);
      },
      onpullingdown(e) {
        console.log(e);
        this.showRefresh = true
        if (e.pullingDistance > 100) {
          this.refresh()
        }
      },
      // 获取课程数据
      getCourses() {
        uni.showLoading({
          title: "加载中...",
          mask: true,
        });

        let collectionQuery = db.collection("course-info").orderBy("created_at", "desc");

        // 如果有关键词，添加模糊查询条件
        if (this.keyword.trim()) {
          const keyword = this.keyword.trim();
          collectionQuery = collectionQuery.where(
            db.command.or([{
                "teacher_name": new RegExp(keyword, "i")
              }, // 匹配教师名
              {
                "course_name": new RegExp(keyword, "i")
              }, // 匹配课程名
            ])
          );
        }


        // 获取课程数据
        collectionQuery
          .get()
          .then(async (res) => {
            if (res.result.data && Array.isArray(res.result.data)) {
              // 并行获取每门课程的评分数据
              const coursesWithRatings = await Promise.all(
                res.result.data.map((course) =>
                  this.getCourseRating(course._id).then((averageRating) => ({
                    ...course,
                    averageRating,
                  }))
                )
              );
              this.courses = coursesWithRatings;
            } else {
              this.courses = []; // 如果返回数据为空，则清空课程列表
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

      // 获取课程评分的平均值
      getCourseRating(courseId) {
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

      // 格式化时间戳为日期字符串
      formatDate(timestamp) {
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date
        .getDate()
        .toString()
        .padStart(2, "0")} ${date
        .getHours()
        .toString()
        .padStart(2, "0")}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
      },
    },
  };
</script>


<style>
  .create-button {
    position: fixed;
    right: 5%;
    top: 92%;
    background-color: darkorange;
    color: #FFFFFF;
    font-weight: bold;
    padding: 15px;
    border-radius: 5px;
    box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.1);
  }

  .course-name {
    font-weight: bold;
  }

  .teacher-name {
    position: absolute;
    right: 20%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
  }

  .name-text {}

  .teacher-icon {
    width: 20px;
    height: 20px;
  }

  .rating {
    position: absolute;
    color: #FF0000;
    font-weight: bold;
    right: 5%;
  }

  .course-list {
    z-index: -1;
    display: flex;
    flex-direction: column;
    padding: 10px;
    gap: 15px;
  }

  .course-card {
    width: 100%;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
    padding: 25px;
    display: flex;
    flex-direction: row;
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

  .uni-search-box {
    background-color: #FFFFFF;
    position: sticky;
    height: 50px;
    top: 5%;
    left: 0;
    /* #ifndef APP-PLUS */
    z-index: 9;
    /* #endif */
    /* #ifdef MP-WEIXIN */
    width: 580rpx;
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

  .load-state {
    justify-content: center;
    width: 750rpx;
  }
</style>