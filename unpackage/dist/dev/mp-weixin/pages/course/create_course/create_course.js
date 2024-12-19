"use strict";
const common_vendor = require("../../../common/vendor.js");
const uni_modules_uniIdPages_common_store = require("../../../uni_modules/uni-id-pages/common/store.js");
const common_assets = require("../../../common/assets.js");
common_vendor.Vs.importObject("uni-id-co");
const db = common_vendor.Vs.database();
const _sfc_main = {
  data() {
    return {
      course: {
        course_name: "",
        course_location: "",
        teacher_name: "",
        course_number: "",
        college: "",
        credit: "",
        average_rating: 0,
        status: 1
      }
    };
  },
  computed: {
    userInfo() {
      return uni_modules_uniIdPages_common_store.store.userInfo;
    }
  },
  onLoad() {
    common_vendor.index.setNavigationBarTitle({
      title: "上传课程信息"
      // 替换为你的标题
    });
  },
  methods: {
    navBack() {
      common_vendor.index.navigateBack();
    },
    async submitCourseInfo() {
      try {
        common_vendor.index.showLoading({
          title: "提交中...",
          mask: true
        });
        const courseData = {
          creator_id: this.userInfo._id,
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          course_name: this.course.course_name,
          course_location: this.course.course_location,
          teacher_name: this.course.teacher_name,
          course_number: this.course.course_number,
          credit: this.course.credit,
          college: this.course.college,
          average_rating: this.course.average_rating,
          status: 1
        };
        const result = await db.collection("course-info").add(courseData);
        if (result.result.id) {
          common_vendor.index.showToast({
            title: "创建成功",
            icon: "success"
          });
          this.course = {
            course_name: "",
            course_location: "",
            teacher_name: "",
            course_number: "",
            average_rating: 0
          };
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 2e3);
        } else {
          throw new Error("创建成功");
        }
      } catch (error) {
        console.error("提交课程信息失败:", error);
        common_vendor.index.showToast({
          title: error.message || "提交失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
        setTimeout(() => {
          common_vendor.index.switchTab({
            url: "/pages/course/course"
          });
        }, 2500);
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_assets._imports_0$3,
    b: $data.course.course_name,
    c: common_vendor.o(($event) => $data.course.course_name = $event.detail.value),
    d: common_assets._imports_0$1,
    e: $data.course.teacher_name,
    f: common_vendor.o(($event) => $data.course.teacher_name = $event.detail.value),
    g: common_assets._imports_2$2,
    h: $data.course.credit,
    i: common_vendor.o(($event) => $data.course.credit = $event.detail.value),
    j: common_assets._imports_3$1,
    k: $data.course.college,
    l: common_vendor.o(($event) => $data.course.college = $event.detail.value),
    m: common_assets._imports_4,
    n: common_vendor.t($data.course.course_location || "请选择开课校区"),
    o: ["江安", "望江", "华西"],
    p: common_vendor.o((e) => $data.course.course_location = ["江安", "望江", "华西"][e.detail.value]),
    q: common_assets._imports_5,
    r: $data.course.course_number,
    s: common_vendor.o(($event) => $data.course.course_number = $event.detail.value),
    t: common_vendor.o(($event) => $options.navBack()),
    v: common_vendor.o((...args) => $options.submitCourseInfo && $options.submitCourseInfo(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-01998c18"]]);
wx.createPage(MiniProgramPage);
