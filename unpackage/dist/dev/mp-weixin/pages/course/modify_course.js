"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const db = common_vendor.Vs.database();
const _sfc_main = {
  data() {
    return {
      course: {
        created_at: "",
        course_name: "",
        course_location: "",
        teacher_name: "",
        course_number: "",
        credit: "",
        _id: "",
        college: ""
      }
    };
  },
  methods: {
    deleteCourse() {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这门课程吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              common_vendor.index.showLoading({
                title: "删除中...",
                mask: true
              });
              const result = await db.collection("course-info").doc(this._id).remove();
              console.log(result);
              if (result.result.deleted === 1) {
                common_vendor.index.showToast({
                  title: "删除成功",
                  icon: "success"
                });
                setTimeout(() => {
                  common_vendor.index.switchTab({
                    url: "/pages/course/course"
                  });
                  ;
                }, 2e3);
              } else {
                throw new Error("删除失败");
              }
            } catch (error) {
              console.error("删除课程失败:", error);
              common_vendor.index.showToast({
                title: error.message || "删除失败",
                icon: "none"
              });
            } finally {
              common_vendor.index.hideLoading();
            }
          } else if (res.cancel) {
            console.log("用户取消删除");
          }
        }
      });
    },
    async fetchCourseDetails() {
      try {
        console.log(this._id);
        const result = await db.collection("course-info").doc(this._id).get();
        console.log(result);
        if (result.data.length) {
          const courseData = result.data[0];
          this.course = {
            course_name: courseData.course_name,
            course_location: courseData.course_location,
            teacher_name: courseData.teacher_name,
            course_number: courseData.course_number,
            college: courseData.college,
            credit: courseData.credit
          };
        } else {
          throw new Error("未找到课程信息");
        }
      } catch (error) {
        console.error("获取课程信息失败:", error);
        common_vendor.index.showToast({
          title: "获取课程信息失败",
          icon: "none"
        });
      }
    },
    async fetchCourseDetails() {
      try {
        const result = await db.collection("course-info").doc(this._id).get();
        console.log(result);
        if (result.result.data && Array.isArray(result.result.data) && result.result.data.length > 0) {
          const courseData = result.result.data[0];
          this.course = {
            course_name: courseData.course_name || "",
            course_location: courseData.course_location || "",
            teacher_name: courseData.teacher_name || "",
            course_number: courseData.course_number || "",
            college: courseData.college || "",
            credit: courseData.credit || ""
          };
        } else {
          throw new Error("未找到课程信息");
        }
      } catch (error) {
        console.error("获取课程信息失败:", error);
        common_vendor.index.showToast({
          title: "获取课程信息失败",
          icon: "none"
        });
      }
    },
    async submitCourseInfo() {
      try {
        common_vendor.index.showLoading({
          title: "提交中...",
          mask: true
        });
        const result = await db.collection("course-info").doc(this._id).update({
          course_name: this.course.course_name,
          course_location: this.course.course_location,
          teacher_name: this.course.teacher_name,
          course_number: this.course.course_number,
          college: this.course.college,
          credit: this.course.credit
        });
        console.log(result);
        if (result.result.updated) {
          common_vendor.index.showToast({
            title: "修改成功",
            icon: "success"
          });
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 2e3);
        } else {
          throw new Error("修改失败");
        }
      } catch (error) {
        console.error("提交课程信息失败:", error);
        common_vendor.index.showToast({
          title: error.message || "提交失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    navBack() {
      common_vendor.index.navigateBack();
    }
  },
  onLoad(options) {
    this._id = options._id;
    common_vendor.index.setNavigationBarTitle({
      title: "修改课程信息"
      // 替换为你的标题
    });
    this.fetchCourseDetails();
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
    v: common_vendor.o(($event) => $options.submitCourseInfo()),
    w: common_vendor.o(($event) => $options.deleteCourse()),
    x: common_vendor.o((...args) => $options.submitCourseInfo && $options.submitCourseInfo(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-bda436fd"]]);
wx.createPage(MiniProgramPage);
