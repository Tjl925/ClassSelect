"use strict";
const common_vendor = require("../../common/vendor.js");
const uni_modules_uniIdPages_common_store = require("../../uni_modules/uni-id-pages/common/store.js");
const common_assets = require("../../common/assets.js");
common_vendor.Vs.importObject("uni-id-co");
const db = common_vendor.Vs.database();
const _sfc_main = {
  data() {
    return {
      isAdmin: false,
      // 判断是否为管理员
      isCourseCreator: false,
      // 判断是否为创建者
      hasComment: false,
      course_name: "",
      course_location: "",
      college: "",
      teacher_name: "",
      credit: "",
      rate_count: 0,
      comments: [],
      isCommentsLoading: true,
      // 控制加载中提示的变量
      rating: 0,
      // 当前评分
      currentRating: 0,
      id: "",
      averageRating: 0,
      // 接收的平均评分
      starRating: []
      // 用于存放星级的数组
    };
  },
  computed: {
    userInfo() {
      return uni_modules_uniIdPages_common_store.store.userInfo;
    },
    displayRating() {
      if (this.averageRating === 0) {
        return "暂无评分";
      } else {
        return this.averageRating.toFixed(1);
      }
    }
  },
  onLoad(options) {
    this.checkUserRole();
    this.checkCreator();
    this.id = options._id;
    this.fetchInitialRating();
    this.loadRating();
    this.fetchcourseDetails();
    this.fetchComments();
  },
  onShow() {
    this.fetchcourseDetails();
  },
  methods: {
    toCreate() {
      common_vendor.index.navigateTo({
        url: "/pages/course/create_course/create_course"
      });
    },
    $log(...args) {
      console.log("args", ...args, this.id);
    },
    async checkUserRole() {
      try {
        const usersCollection = db.collection("uni-id-users");
        const userRes = await usersCollection.doc(this.userInfo._id).field("user_role").get();
        if (userRes.result.data.length > 0 && userRes.result.data[0].user_role === "admin") {
          this.isAdmin = true;
        }
      } catch (error) {
        console.error("检查用户角色失败:", error);
      }
    },
    async checkCreator() {
      try {
        const coursesCollection = db.collection("course-info");
        const courseRes = await coursesCollection.doc(this.id).get();
        if (courseRes.result.data.length > 0 && courseRes.result.data[0].creator_id === this.userInfo._id) {
          this.isCourseCreator = true;
        }
      } catch (error) {
        console.error("检查课程信息创建者失败:", error);
      }
    },
    goToModifyPage() {
      common_vendor.index.navigateTo({
        url: `/pages/course/modify_course?_id=${this.id}`
      });
    },
    goToReportPage(Id) {
      common_vendor.index.navigateTo({
        url: `/uni_modules/uni-feedback/pages/opendb-report/opendb-report?reported_id=${Id}&type=课程信息`
      });
    },
    // 查询数据库获取初始评分
    async fetchInitialRating() {
      try {
        const db2 = common_vendor.Vs.database();
        const res = await db2.collection("course-info").doc(this.id).get();
        if (res.result.data.length > 0) {
          this.averageRating = res.result.data[0].average_rating || 0;
          this.generateStarRating(this.averageRating);
        } else {
          console.error("课程不存在");
        }
      } catch (error) {
        console.error("获取初始评分失败", error);
      }
    },
    loadRating() {
      const ratingsCollection = db.collection("course_ratings");
      const userId = this.userInfo._id;
      console.log("当前用户ID:", userId);
      const courseId = this.id;
      ratingsCollection.where({
        course_id: courseId,
        user_id: userId
      }).get().then((res) => {
        if (res.result.data && res.result.data.length > 0) {
          const userRating = res.result.data[0].rating;
          this.currentRating = userRating;
          console.log("已评分:", userRating);
        } else {
          this.currentRating = 0;
          console.log("用户尚未评分");
        }
      }).catch((err) => {
        console.error("查询评分记录失败:", err);
      });
    },
    generateStarRating(rating) {
      const fullStars = Math.floor(rating);
      const halfStar = rating - fullStars >= 0.5 ? 1 : 0;
      this.starRating = Array(fullStars).fill("full").concat(halfStar ? ["half"] : []);
    },
    fetchcourseDetails() {
      db.collection("course-info").doc(this.id).get().then((res) => {
        if (res.result.data && res.result.data.length > 0) {
          const course = res.result.data[0];
          this.course_name = course.course_name || "未记录";
          this.course_location = course.course_location || "未记录";
          this.college = course.college || "未记录";
          this.teacher_name = course.teacher_name || "未记录";
          this.credit = course.credit || "未记录";
          this.course_number = course.course_number || "未记录";
        } else {
          common_vendor.index.showToast({
            title: "课程不存在",
            icon: "none"
          });
        }
      }).catch((err) => {
        console.error("获取详情失败:", err);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      });
      db.collection("course_ratings").where({
        course_id: this.id
      }).get().then((res) => {
        console.log(res.result);
        this.rate_count = res.result.data.length;
      });
    },
    async fetchComments() {
      const commentsCollection = db.collection("course_comments").orderBy("created_at", "desc");
      const usersCollection = db.collection("uni-id-users");
      this.isCommentsLoading = true;
      try {
        const res = await commentsCollection.where({
          course_id: this.id
        }).get();
        const commentsData = res.result.data || [];
        const userRequests = commentsData.map(async (comment) => {
          var _a;
          try {
            const userRes = await usersCollection.doc(comment.user_id).field("avatar_file, nickname").get();
            return ((_a = userRes.result.data) == null ? void 0 : _a[0]) || {};
          } catch (err) {
            console.error(`加载用户 ${comment.user_id} 信息失败:`, err);
            return {};
          }
        });
        const userResults = await Promise.all(userRequests);
        this.comments = commentsData.map((comment, index) => {
          var _a;
          const user = userResults[index];
          return {
            avatar: ((_a = user.avatar_file) == null ? void 0 : _a.url) || "/static/default-avatar.png",
            nickname: user.nickname || "匿名用户",
            _id: comment._id,
            user_id: comment.user_id,
            comment_text: comment.comment_text,
            created_at: comment.created_at
          };
        });
      } catch (err) {
        console.error("加载评论失败:", err);
        common_vendor.index.showToast({
          title: "评论加载失败",
          icon: "none"
        });
      } finally {
        this.isCommentsLoading = false;
      }
    },
    handleLongPress(comment) {
      common_vendor.index.showActionSheet({
        itemList: ["删除"],
        success: async (res) => {
          if (res.tapIndex === 0) {
            try {
              const isCommentCreator = comment.user_id === this.userInfo._id;
              if (isCommentCreator || this.isAdmin) {
                await this.deleteComment(comment._id);
                common_vendor.index.showToast({
                  title: "删除成功",
                  icon: "success"
                });
              } else {
                common_vendor.index.showToast({
                  title: "没有权限删除",
                  icon: "none"
                });
              }
            } catch (err) {
              common_vendor.index.showToast({
                title: "操作失败",
                icon: "none"
              });
            }
          }
        },
        fail: () => {
          console.log("取消操作");
        }
      });
    },
    async deleteComment(commentId) {
      try {
        await db.collection("course_comments").doc(commentId).remove();
        this.comments = this.comments.filter((comment) => comment._id !== commentId);
      } catch (error) {
        console.error("删除评论失败:", error);
        throw error;
      }
    },
    rate(star) {
      const ratingsCollection = db.collection("course_ratings");
      const userId = this.userInfo._id;
      const courseId = this.id;
      console.log("当前用户ID", userId);
      if (!userId) {
        common_vendor.index.showModal({
          title: "未登录",
          content: "您未登录，是否前往登录？",
          success: (modalRes) => {
            if (modalRes.confirm) {
              common_vendor.index.navigateTo({
                url: "/pages/login/login"
                // 假设登录页面路径为 /pages/login/login
              });
            } else {
              console.log("用户取消跳转到登录页面");
            }
          }
        });
        return;
      }
      ratingsCollection.where({
        course_id: courseId,
        user_id: userId
      }).get().then((res) => {
        if (res.result.data && res.result.data.length > 0) {
          common_vendor.index.showToast({
            title: "您已评过分，请勿重复评分",
            icon: "none"
          });
          console.log("评分记录已存在:", res.result.data[0]);
        } else {
          common_vendor.index.showModal({
            title: "确认评分",
            content: `您确定要给 ${star} 星评分吗？`,
            success: (modalRes) => {
              if (modalRes.confirm) {
                const currentTime = (/* @__PURE__ */ new Date()).toISOString();
                ratingsCollection.add({
                  course_id: courseId,
                  user_id: userId,
                  rating: star,
                  created_at: currentTime
                }).then(() => {
                  common_vendor.index.showToast({
                    title: `评分成功: ${star} 星`,
                    icon: "success"
                  });
                  console.log("评分记录已添加:", {
                    course_id: courseId,
                    user_id: userId,
                    rating: star,
                    created_at: currentTime
                  });
                  this.currentRating = star;
                  this.updateAverageRating(courseId);
                }).catch((err) => {
                  console.error("评分失败:", err);
                  common_vendor.index.showToast({
                    title: "评分失败，请稍后再试",
                    icon: "none"
                  });
                });
              } else {
                console.log("用户取消评分");
              }
            }
          });
        }
      }).catch((err) => {
        console.error("查询评分记录失败:", err);
        common_vendor.index.showToast({
          title: "评分查询失败，请稍后再试",
          icon: "none"
        });
      });
    },
    // 更新资料的平均评分
    async updateAverageRating(courseId) {
      try {
        const ratingsCollection = db.collection("course_ratings");
        const coursesCollection = db.collection("course-info");
        const res = await ratingsCollection.where({
          course_id: courseId
        }).get();
        if (res.result.data && res.result.data.length > 0) {
          const ratings = res.result.data.map((item) => item.rating);
          const newAverageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
          await coursesCollection.doc(courseId).update({
            average_rating: newAverageRating
          });
          console.log("平均评分已更新:", newAverageRating);
          this.averageRating = newAverageRating;
          this.generateStarRating(newAverageRating);
        } else {
          console.warn("未找到评分记录，无法计算平均评分");
        }
      } catch (error) {
        console.error("更新平均评分失败:", error);
        common_vendor.index.showToast({
          title: "更新评分失败，请稍后再试",
          icon: "none"
        });
      }
      this.rate_count += 1;
    },
    downloadcourse() {
      const coursesCollection = db.collection("courses");
      const courseId = this.id;
      coursesCollection.doc(courseId).get().then((res) => {
        if (res.result.data && res.result.data.length > 0) {
          const course = res.result.data[0];
          const downloadLink = course.download_link;
          if (downloadLink) {
            common_vendor.index.showModal({
              title: "下载资料",
              content: `资料下载链接：${downloadLink}`,
              confirmText: "复制链接",
              success: (modalRes) => {
                if (modalRes.confirm) {
                  common_vendor.index.setClipboardData({
                    data: downloadLink,
                    success: () => {
                      common_vendor.index.showToast({
                        title: "下载链接已复制",
                        icon: "success"
                      });
                    }
                  });
                } else {
                  console.log("用户取消复制链接");
                }
              }
            });
          } else {
            common_vendor.index.showToast({
              title: "未找到下载链接",
              icon: "none"
            });
          }
        } else {
          common_vendor.index.showToast({
            title: "课程不存在",
            icon: "none"
          });
        }
      }).catch((err) => {
        console.error("获取下载链接失败:", err);
        common_vendor.index.showToast({
          title: "获取下载链接失败",
          icon: "none"
        });
      });
    },
    postComment() {
      const userId = this.userInfo._id;
      if (!userId) {
        common_vendor.index.showModal({
          title: "未登录",
          content: "您未登录，是否前往登录？",
          success: (modalRes) => {
            if (modalRes.confirm) {
              common_vendor.index.navigateTo({
                url: "/pages/login/login"
                // 假设登录页面路径为 /pages/login/login
              });
            } else {
              console.log("用户取消跳转到登录页面");
            }
          }
        });
        return;
      }
      common_vendor.index.showModal({
        title: "发表评论",
        content: "",
        editable: true,
        placeholderText: "请输入评论内容（100字以内）",
        success: (modalRes) => {
          if (modalRes.confirm) {
            const commentText = modalRes.content.trim();
            if (commentText.length === 0) {
              common_vendor.index.showToast({
                title: "评论内容不能为空",
                icon: "none"
              });
              return;
            }
            if (commentText.length > 100) {
              common_vendor.index.showToast({
                title: "评论内容超过100字",
                icon: "none"
              });
              return;
            }
            const courseId = this.id;
            const currentTime = (/* @__PURE__ */ new Date()).toISOString();
            console.log("当前用户ID", userId);
            console.log("当前时间", currentTime);
            db.collection("course_comments").add({
              user_id: userId,
              course_id: courseId,
              comment_text: commentText,
              created_at: currentTime
            }).then((res) => {
              var _a;
              console.log("评论发布成功:", res);
              const newComment = {
                avatar: ((_a = this.userInfo.avatar_file) == null ? void 0 : _a.url) || "/static/default-avatar.png",
                nickname: this.userInfo.nickname || "匿名用户",
                comment_text: commentText,
                created_at: currentTime
              };
              this.comments.unshift(newComment);
              this.fetchComments();
              common_vendor.index.showToast({
                title: "评论发布成功",
                icon: "success"
              });
            }).catch((err) => {
              console.error("评论发布失败:", err);
              common_vendor.index.showToast({
                title: "评论发布失败",
                icon: "none"
              });
            });
          } else {
            console.log("用户取消评论");
          }
        }
      });
    },
    formatDate(timestamp) {
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.isAdmin || $data.isCourseCreator
  }, $data.isAdmin || $data.isCourseCreator ? {
    b: common_assets._imports_0$4,
    c: common_vendor.o((...args) => $options.goToModifyPage && $options.goToModifyPage(...args))
  } : {
    d: common_assets._imports_1$4,
    e: common_vendor.o(($event) => $options.goToReportPage($data.id))
  }, {
    f: common_vendor.t($data.course_name),
    g: common_vendor.t($data.teacher_name),
    h: common_vendor.t($data.credit),
    i: common_vendor.t($data.rate_count),
    j: common_vendor.t($data.college),
    k: common_vendor.t($data.course_location),
    l: common_vendor.t(_ctx.course_number),
    m: common_vendor.t($options.displayRating),
    n: common_vendor.f($data.starRating, (star, index, i0) => {
      return {
        a: index,
        b: star === "full" ? "/static/full-star.png" : "/static/half-star.png"
      };
    }),
    o: $data.isCommentsLoading
  }, $data.isCommentsLoading ? {} : {}, {
    p: common_vendor.f($data.comments, (comment, index, i0) => {
      return {
        a: comment.avatar,
        b: common_vendor.t(comment.nickname),
        c: common_vendor.t($options.formatDate(comment.created_at)),
        d: common_vendor.t(comment.comment_text),
        e: common_vendor.o(($event) => $options.handleLongPress(comment), index),
        f: index
      };
    }),
    q: common_vendor.f(5, (n, k0, i0) => {
      return {
        a: n,
        b: n <= $data.currentRating ? 1 : "",
        c: common_vendor.o(($event) => $options.rate(n), n)
      };
    }),
    r: common_vendor.o((...args) => $options.toCreate && $options.toCreate(...args)),
    s: common_vendor.o((...args) => $options.postComment && $options.postComment(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
