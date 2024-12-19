"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const db = common_vendor.Vs.database();
let cdbRef;
const statusBar = () => "../../uni_modules/uni-nav-bar/components/uni-nav-bar/uni-status-bar.js";
const _sfc_main = {
  components: {
    statusBar
  },
  computed: {
    inputPlaceholder(e) {
      if (common_vendor.index.getStorageSync("CURRENT_LANG") == "en") {
        return "Please enter the search content";
      } else {
        return "请输入搜索内容";
      }
    }
  },
  data() {
    return {
      where: '"status" == 1',
      courses: [],
      // 存储课程信息
      keyword: "",
      // 搜索关键词
      pageSize: 15
    };
  },
  watch: {
    keyword(keyword, oldValue) {
      let where = '"status" == 1 ';
      if (keyword) {
        this.where = where + `&& /${keyword}/.test(course_name)`;
      } else {
        this.where = where;
      }
    }
  },
  async onReady() {
    this.listHight = "auto";
    cdbRef = this.$refs.udb;
  },
  onShow() {
    this.keyword = getApp().globalData.searchText || "";
    getApp().globalData.searchText = "";
    this.getCourses();
  },
  onLoad() {
    common_vendor.index.setNavigationBarTitle({
      title: "课程列表"
      // 替换为你的标题
    });
  },
  onReachBottom() {
    console.log(this.courses);
    if (this.courses.length > this.pageSize) {
      console.log("当前课程数量：" + this.courses.length);
      this.pageSize += 5;
    } else {
      common_vendor.index.showToast({
        title: "已加载全部记录",
        icon: "none"
      });
    }
  },
  methods: {
    displayRating(Rating) {
      if (!Rating) {
        return "待评分";
      } else {
        return Rating.toFixed(1);
      }
    },
    toCreate() {
      common_vendor.index.navigateTo({
        url: "/pages/course/create_course/create_course"
      });
    },
    // 点击搜索按钮，跳转到搜索页
    searchClick(e) {
      common_vendor.index.hideKeyboard();
      common_vendor.index.navigateTo({
        url: "/pages/course/search/search",
        animationType: "fade-in"
      });
    },
    retry() {
      this.refresh();
    },
    refresh() {
      cdbRef.loadData({
        clear: true
      }, () => {
        common_vendor.index.stopPullDownRefresh();
        console.log("end");
      });
      console.log("refresh");
    },
    loadMore() {
      cdbRef.loadMore();
    },
    onqueryerror(e) {
      console.error(e);
    },
    onpullingdown(e) {
      console.log(e);
      this.showRefresh = true;
      if (e.pullingDistance > 100) {
        this.refresh();
      }
    },
    // 获取课程数据
    getCourses() {
      common_vendor.index.showLoading({
        title: "加载中...",
        mask: true
      });
      let collectionQuery = db.collection("course-info").orderBy("created_at", "desc");
      if (this.keyword.trim()) {
        const keyword = this.keyword.trim();
        collectionQuery = collectionQuery.where(
          db.command.or([
            {
              "teacher_name": new RegExp(keyword, "i")
            },
            // 匹配教师名
            {
              "course_name": new RegExp(keyword, "i")
            }
            // 匹配课程名
          ])
        );
      }
      collectionQuery.get().then(async (res) => {
        if (res.result.data && Array.isArray(res.result.data)) {
          const coursesWithRatings = await Promise.all(
            res.result.data.map((course) => {
              return {
                ...course
              };
            })
          );
          this.courses = coursesWithRatings;
        } else {
          this.courses = [];
        }
      }).catch((error) => {
        console.error("获取课程数据失败:", error);
        common_vendor.index.showToast({
          title: "加载课程数据失败",
          icon: "none"
        });
      }).finally(() => {
        common_vendor.index.hideLoading();
      });
    },
    // 获取课程评分的平均值
    getCourseRating(courseId) {
      return db.collection("course_ratings").where({
        course_id: courseId
      }).get().then((res) => {
        if (res.result.data && res.result.data.length > 0) {
          const ratings = res.result.data.map((item) => item.rating);
          const totalRating = ratings.reduce((acc, rating) => acc + rating, 0);
          return totalRating / ratings.length;
        } else {
          return "待评分";
        }
      }).catch((error) => {
        console.error("获取课程评分失败:", error);
        return 0;
      });
    }
  }
};
if (!Array) {
  const _easycom_uni_search_bar2 = common_vendor.resolveComponent("uni-search-bar");
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  (_easycom_uni_search_bar2 + _easycom_uni_list_item2 + _easycom_uni_list2)();
}
const _easycom_uni_search_bar = () => "../../uni_modules/uni-search-bar/components/uni-search-bar/uni-search-bar.js";
const _easycom_uni_list_item = () => "../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../uni_modules/uni-list/components/uni-list/uni-list.js";
if (!Math) {
  (_easycom_uni_search_bar + _easycom_uni_list_item + _easycom_uni_list)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.sr("searchBar", "4238b733-0"),
    b: common_vendor.o(($event) => $data.keyword = $event),
    c: common_vendor.p({
      radius: "100",
      cancelButton: "none",
      disabled: true,
      placeholder: $options.inputPlaceholder,
      modelValue: $data.keyword
    }),
    d: common_vendor.o((...args) => $options.searchClick && $options.searchClick(...args)),
    e: common_vendor.f($data.courses.slice(0, $data.pageSize), (course, index, i0) => {
      return {
        a: common_vendor.t(course.course_name),
        b: common_vendor.t(course.teacher_name),
        c: common_vendor.t($options.displayRating(course.average_rating)),
        d: index,
        e: "4238b733-2-" + i0 + ",4238b733-1",
        f: common_vendor.p({
          to: "/pages/course/detail?_id=" + course._id
        })
      };
    }),
    f: common_assets._imports_0$1,
    g: common_vendor.p({
      border: "false"
    }),
    h: common_vendor.o((...args) => $options.toCreate && $options.toCreate(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
