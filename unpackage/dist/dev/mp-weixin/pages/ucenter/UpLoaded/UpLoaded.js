"use strict";
const common_vendor = require("../../../common/vendor.js");
const uni_modules_uniIdPages_common_store = require("../../../uni_modules/uni-id-pages/common/store.js");
const common_assets = require("../../../common/assets.js");
const db = common_vendor.Vs.database();
const _sfc_main = {
  data() {
    return {
      pageSize: 10,
      iconnection: [],
      Mycourse: [],
      // 存储用户所有发布过的课程的相关信息
      Mymaterials: [],
      Mypost: [],
      courseInfowithRtings: [],
      // 在Mycourse的基础上保存该项课程的平均分
      tabs: ["已发布的课程", "已发布的资料", "已发布帖子"],
      currentTab: 0,
      currentUserId: uni_modules_uniIdPages_common_store.store.userInfo._id || "",
      // 确保有值
      isLoading: true,
      loadMore: {
        contentdown: "",
        contentrefresh: "",
        contentnomore: ""
      }
    };
  },
  onReachBottom() {
    console.log(this.Mycourse);
    if (this.Mycourse.length > this.pageSize) {
      console.log("当前课程数量：" + this.Mycourse.length);
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
    // 获取课程数据
    formatDate(timestamp) {
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
    },
    getMyCourse() {
      common_vendor.index.showLoading({
        title: "加载中...",
        mask: true
      });
      let collectionQuery = db.collection("course-info").orderBy("created_at", "desc");
      collectionQuery = collectionQuery.where({
        creator_id: this.currentUserId
      });
      collectionQuery.get().then(async (res) => {
        if (res.result.data && Array.isArray(res.result.data)) {
          const coursesWithRatings = await Promise.all(
            res.result.data.map((course) => {
              return {
                ...course
              };
            })
          );
          this.Mycourse = coursesWithRatings;
        } else {
          this.Mycourse = [];
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
    getMyMaterials() {
      common_vendor.index.showLoading({
        title: "加载中...",
        mask: true
      });
      let collectionQuery = db.collection("materials").orderBy("created_at", "desc");
      collectionQuery = collectionQuery.where({
        creator_id: this.currentUserId
      });
      collectionQuery.get().then(async (res) => {
        if (res.result.data && Array.isArray(res.result.data)) {
          const materialWithRatings = await Promise.all(
            res.result.data.map(
              (materials) => this.getMaterialsRating(materials._id).then((averageRating) => ({
                ...materials,
                averageRating
              }))
            )
          );
          this.Mymaterials = materialWithRatings;
        } else {
          this.Mymaterials = [];
        }
      }).catch((error) => {
        console.error("获取资料数据失败:", error);
        common_vendor.index.showToast({
          title: "加载资料数据失败",
          icon: "none"
        });
      }).finally(() => {
        common_vendor.index.hideLoading();
      });
    },
    getMyPost() {
      let collectionQuery = db.collection("community_post");
      collectionQuery = collectionQuery.where({
        user_id: uni_modules_uniIdPages_common_store.store.userInfo._id
      });
      collectionQuery.get().then(async (res) => {
        if (res.result.data && Array.isArray(res.result.data)) {
          const postinfo = await Promise.all(
            res.result.data.map(
              (post) => this.getNickNameinfo(post.user_id).then((userinfo) => ({
                ...post,
                ...userinfo
                // 使用正确的变量名
              }))
            )
          );
          this.Mypost = postinfo;
        } else {
          this.Mypost = [];
        }
      }).catch((err) => {
        console.error("获取帖子数据失败:", err);
      });
    },
    async getNickNameinfo(uid) {
      console.log("当前的用户id" + uid);
      return db.collection("uni-id-users").where({
        _id: uid
        // 确保这里是文档的ID字段，通常是 _id
      }).field({
        nickname: true,
        avatar: true
      }).get().then((res) => {
        if (res.result.data && res.result.data.length > 0) {
          const userinfo = res.result.data[0];
          return {
            nickname: userinfo.nickname,
            // 返回昵称
            avatar: userinfo.avatar
          };
        } else {
          return {
            nickname: "无昵称",
            // 返回昵称
            avatar: ""
          };
        }
      }).catch((error) => {
        console.error("获取用户昵称失败:", error);
        common_vendor.index.showToast({
          title: "加载用户昵称失败",
          icon: "none"
        });
        this.isLoading = false;
      });
    },
    async getMaterialsRating(materialId) {
      return db.collection("material_ratings").where({
        material_id: materialId
      }).get().then((res) => {
        if (res.result.data && res.result.data.length > 0) {
          const ratings = res.result.data.map((item) => item.rating);
          const totalRating = ratings.reduce((acc, rating) => acc + rating, 0);
          return totalRating / ratings.length;
        } else {
          return "待评分";
        }
      }).catch((error) => {
        console.error("获取资料评分失败:", error);
        return 0;
      });
    },
    // 获取课程评分的平均值
    async getCourseRating(courseId) {
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
    },
    async onLoad() {
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
      console.error("Error loading data:", error);
      this.isLoading = true;
    },
    showOptions(id, currentTab) {
      common_vendor.index.showActionSheet({
        itemList: ["修改"],
        success: function(res) {
          console.log("用户当前页面编号：" + currentTab);
          if (res.tapIndex + 1 == 1) {
            console.log("用户选择了删除");
            let url = "";
            if (currentTab === 0) {
              console.log(id);
              url = "/pages/course/modify_course?_id=" + id;
            } else if (currentTab === 1) {
              console.log(id);
              url = "/pages/material/modify_material?_id=" + id;
            } else if (currentTab === 2) {
              url = "/pages/community/modify_community?postId=" + id;
            }
            common_vendor.index.navigateTo({
              url
            });
          }
        },
        //success层
        fail: function(res) {
          console.log("操作菜单调用失败");
        },
        //  fail层
        complete: function() {
          console.log("操作菜单调用结束");
        }
      });
    },
    //showoptions层
    PosthandleItemClick(item) {
      let url = "";
      if (this.currentTab === 0) {
        url = "/pages/course/detail?_id=" + item._id + "&title=" + item.course_name + "&averageRating=" + item.averageRating;
      } else if (this.currentTab === 1) {
        url = "/pages/material/detail?id=" + item._id + "&title=" + item.material_name + "&averageRating=" + item.averageRating;
      } else if (this.currentTab === 2) {
        url = "/pages/list/detail?id=" + item._id + "&title=" + item.title;
      }
      common_vendor.index.navigateTo({
        url
      });
    }
  },
  mounted() {
    this.onLoad();
  }
};
if (!Array) {
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  const _easycom_uni_load_state2 = common_vendor.resolveComponent("uni-load-state");
  const _easycom_unicloud_db2 = common_vendor.resolveComponent("unicloud-db");
  const _easycom_uni_load_more2 = common_vendor.resolveComponent("uni-load-more");
  (_easycom_uni_list_item2 + _easycom_uni_list2 + _easycom_uni_load_state2 + _easycom_unicloud_db2 + _easycom_uni_load_more2)();
}
const _easycom_uni_list_item = () => "../../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../../uni_modules/uni-list/components/uni-list/uni-list.js";
const _easycom_uni_load_state = () => "../../../components/uni-load-state/uni-load-state.js";
const _easycom_unicloud_db = () => "../../../node-modules/@dcloudio/uni-components/lib/unicloud-db/unicloud-db.js";
const _easycom_uni_load_more = () => "../../../uni_modules/uni-load-more/components/uni-load-more/uni-load-more.js";
if (!Math) {
  (_easycom_uni_list_item + _easycom_uni_list + _easycom_uni_load_state + _easycom_unicloud_db + _easycom_uni_load_more)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.f($data.tabs, (tab, index, i0) => {
      return {
        a: common_vendor.t(tab),
        b: tab,
        c: $data.currentTab === index ? 1 : "",
        d: common_vendor.o(($event) => $options.switchTab(index), tab)
      };
    }),
    b: $data.currentTab === 0 && $data.currentUserId
  }, $data.currentTab === 0 && $data.currentUserId ? {
    c: common_vendor.w(({
      data,
      pagination,
      loading,
      hasMore,
      error
    }, s0, i0) => {
      return {
        a: common_vendor.f($data.Mycourse.slice(0, $data.pageSize), (item, index, i1) => {
          return {
            a: common_vendor.t(item.course_name),
            b: common_vendor.t(item.teacher_name),
            c: common_vendor.t($options.displayRating(item.average_rating)),
            d: index,
            e: common_vendor.o(($event) => $options.PosthandleItemClick(item), index),
            f: common_vendor.o(($event) => $options.showOptions(item._id, $data.currentTab), index),
            g: "56f50e8e-2-" + i0 + "-" + i1 + "," + ("56f50e8e-1-" + i0)
          };
        }),
        b: "56f50e8e-1-" + i0 + ",56f50e8e-0",
        c: "56f50e8e-3-" + i0 + ",56f50e8e-0",
        d: common_vendor.p({
          state: {
            Mycourse: $data.Mycourse,
            pagination,
            hasMore,
            loading,
            error
          }
        }),
        e: i0,
        f: s0
      };
    }, {
      name: "d",
      path: "c",
      vueId: "56f50e8e-0"
    }),
    d: common_assets._imports_0$1,
    e: common_vendor.p({
      clickable: true
    }),
    f: common_vendor.sr("udbCourses", "56f50e8e-0"),
    g: common_vendor.o($options.onLoad),
    h: common_vendor.o($options.onError),
    i: common_vendor.p({
      collection: "course_ratings,course-info",
      field: "course_id,course_name, teacher_name,rating",
      ["page-size"]: 5
    })
  } : {}, {
    j: $data.currentTab === 1 && $data.currentUserId
  }, $data.currentTab === 1 && $data.currentUserId ? {
    k: common_vendor.w(({
      data,
      pagination,
      loading,
      hasMore,
      error
    }, s0, i0) => {
      return {
        a: common_vendor.f($data.Mymaterials, (item, index, i1) => {
          return {
            a: common_vendor.t(item.material_name),
            b: common_vendor.t($options.displayRating(item.average_rating)),
            c: index,
            d: common_vendor.o(($event) => $options.PosthandleItemClick(item), index),
            e: common_vendor.o(($event) => $options.showOptions(item._id, $data.currentTab), index),
            f: "56f50e8e-6-" + i0 + "-" + i1 + "," + ("56f50e8e-5-" + i0)
          };
        }),
        b: "56f50e8e-5-" + i0 + ",56f50e8e-4",
        c: "56f50e8e-7-" + i0 + ",56f50e8e-4",
        d: common_vendor.p({
          state: {
            Mymaterials: $data.Mymaterials,
            pagination,
            hasMore,
            loading,
            error
          }
        }),
        e: i0,
        f: s0
      };
    }, {
      name: "d",
      path: "k",
      vueId: "56f50e8e-4"
    }),
    l: common_vendor.p({
      clickable: true
    }),
    m: common_vendor.sr("udbMaterials", "56f50e8e-4"),
    n: common_vendor.o($options.onLoad),
    o: common_vendor.o($options.onError),
    p: common_vendor.p({
      collection: "materials",
      field: "material_name,creator_id",
      ["page-size"]: 10
    })
  } : {}, {
    q: $data.currentTab === 2 && $data.currentUserId
  }, $data.currentTab === 2 && $data.currentUserId ? {
    r: common_vendor.w(({
      data,
      loading,
      error,
      options
    }, s0, i0) => {
      return common_vendor.e({
        a: common_vendor.f($data.Mypost, (item, k1, i1) => {
          return common_vendor.e({
            a: item.imgs && item.imgs[0] && item.imgs[0].path
          }, item.imgs && item.imgs[0] && item.imgs[0].path ? {
            b: item.imgs[0].path
          } : {}, {
            c: common_vendor.t(item.title),
            d: common_vendor.t(item.content),
            e: common_vendor.t(item.nickname),
            f: common_vendor.t(item.ans_count),
            g: common_vendor.o(($event) => _ctx.goToDetail(item._id), item._id),
            h: item.liked ? "/static/community/like_active.png" : "/static/community/like.png",
            i: common_vendor.t(item.likes_count),
            j: common_vendor.o(($event) => _ctx.ChangeLike(item), item._id),
            k: common_vendor.t($options.formatDate(item.created_at)),
            l: item._id,
            m: common_vendor.o(($event) => $options.showOptions(item._id, $data.currentTab), item._id),
            n: "56f50e8e-10-" + i0 + "-" + i1 + "," + ("56f50e8e-9-" + i0),
            o: common_vendor.p({
              direction: "column",
              to: "/pages/community/detail?id=" + item._id + "&title=" + item.title
            })
          });
        }),
        b: "56f50e8e-9-" + i0 + ",56f50e8e-8",
        c: loading || options.status === "noMore"
      }, loading || options.status === "noMore" ? {
        d: "56f50e8e-11-" + i0 + ",56f50e8e-8",
        e: common_vendor.p({
          status: options.status
        })
      } : {}, {
        f: i0,
        g: s0
      });
    }, {
      name: "d",
      path: "r",
      vueId: "56f50e8e-8"
    }),
    s: common_assets._imports_1,
    t: common_vendor.sr("udb", "56f50e8e-8"),
    v: common_vendor.o(_ctx.load),
    w: common_vendor.p({
      options: _ctx.formData,
      collection: _ctx.collection,
      field: _ctx.field,
      where: _ctx.whereCondition
    })
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
