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
      isMaterialCreator: false,
      // 判断是否为创建者
      materialImage: "",
      title: "",
      category: "",
      courseName: "",
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
    this.id = options.id;
    this.title = options.title ? decodeURIComponent(options.title) : "未命名";
    this.fetchInitialRating();
    this.loadRating();
    this.fetchMaterialDetails();
    this.fetchComments();
  },
  onShow() {
    this.fetchMaterialDetails();
  },
  methods: {
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
        const materialsCollection = db.collection("materials");
        const materialRes = await materialsCollection.doc(this.id).get();
        if (materialRes.result.data.length > 0 && materialRes.result.data[0].creator_id === this.userInfo._id) {
          this.isMaterialCreator = true;
        }
      } catch (error) {
        console.error("检查资料创建者失败:", error);
      }
    },
    goToModifyPage() {
      common_vendor.index.navigateTo({
        url: `/pages/material/modify_material?_id=${this.id}`
      });
    },
    goToReportPage(Id) {
      common_vendor.index.navigateTo({
        url: `/uni_modules/uni-feedback/pages/opendb-report/opendb-report?reported_id=${Id}&type=资料`
      });
    },
    // 查询数据库获取初始评分
    async fetchInitialRating() {
      try {
        const db2 = common_vendor.Vs.database();
        const res = await db2.collection("materials").doc(this.id).get();
        if (res.result.data.length > 0) {
          this.averageRating = res.result.data[0].average_rating || 0;
          this.generateStarRating(this.averageRating);
        } else {
          console.error("资料不存在");
        }
      } catch (error) {
        console.error("获取初始评分失败", error);
      }
    },
    loadRating() {
      const ratingsCollection = db.collection("material_ratings");
      const userId = this.userInfo._id;
      console.log("当前用户ID:", userId);
      const materialId = this.id;
      ratingsCollection.where({
        material_id: materialId,
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
    fetchMaterialDetails() {
      db.collection("materials").doc(this.id).get().then((res) => {
        if (res.result.data && res.result.data.length > 0) {
          const material = res.result.data[0];
          this.materialImage = material.material_image && material.material_image.length > 0 ? material.material_image[0].url : "/static/default-image.png";
          this.title = material.material_name || "未命名";
          this.category = material.category || "未定义类别";
          this.courseName = material.course_name || "未定义课程";
        } else {
          common_vendor.index.showToast({
            title: "资料不存在",
            icon: "none"
          });
          this.materialImage = "/static/default-image.png";
        }
      }).catch((err) => {
        console.error("获取资料详情失败:", err);
        common_vendor.index.showToast({
          title: "资料加载失败",
          icon: "none"
        });
        this.materialImage = "/static/default-image.png";
      });
    },
    async fetchComments() {
      const commentsCollection = db.collection("material_comments").orderBy("created_at", "desc");
      const usersCollection = db.collection("uni-id-users");
      this.isCommentsLoading = true;
      try {
        const res = await commentsCollection.where({
          material_id: this.id
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
        await db.collection("material_comments").doc(commentId).remove();
        this.comments = this.comments.filter((comment) => comment._id !== commentId);
      } catch (error) {
        console.error("删除评论失败:", error);
        throw error;
      }
    },
    rate(star) {
      const ratingsCollection = db.collection("material_ratings");
      db.collection("materials");
      const userId = this.userInfo._id;
      const materialId = this.id;
      console.log("当前用户ID", userId);
      if (!userId) {
        common_vendor.index.showModal({
          title: "未登录",
          content: "您未登录，是否前往登录？",
          success: (modalRes) => {
            if (modalRes.confirm) {
              common_vendor.index.navigateTo({
                url: "/uni_modules/uni-id-pages/pages/login/login-withpwd"
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
        material_id: materialId,
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
                  material_id: materialId,
                  user_id: userId,
                  rating: star,
                  created_at: currentTime
                }).then(() => {
                  common_vendor.index.showToast({
                    title: `评分成功: ${star} 星`,
                    icon: "success"
                  });
                  console.log("评分记录已添加:", {
                    material_id: materialId,
                    user_id: userId,
                    rating: star,
                    created_at: currentTime
                  });
                  this.currentRating = star;
                  this.updateAverageRating(materialId);
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
    async updateAverageRating(materialId) {
      try {
        const ratingsCollection = db.collection("material_ratings");
        const materialsCollection = db.collection("materials");
        const res = await ratingsCollection.where({
          material_id: materialId
        }).get();
        if (res.result.data && res.result.data.length > 0) {
          const ratings = res.result.data.map((item) => item.rating);
          const newAverageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
          await materialsCollection.doc(materialId).update({
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
    },
    downloadMaterial() {
      const materialsCollection = db.collection("materials");
      const materialId = this.id;
      materialsCollection.doc(materialId).get().then((res) => {
        if (res.result.data && res.result.data.length > 0) {
          const material = res.result.data[0];
          const downloadLink = material.download_link;
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
            title: "资料不存在",
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
                url: "/uni_modules/uni-id-pages/pages/login/login-withpwd"
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
            const materialId = this.id;
            const currentTime = (/* @__PURE__ */ new Date()).toISOString();
            console.log("当前用户ID", userId);
            console.log("当前时间", currentTime);
            db.collection("material_comments").add({
              user_id: userId,
              material_id: materialId,
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
    formatData(timestamp) {
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.materialImage
  }, $data.materialImage ? {
    b: $data.materialImage
  } : {}, {
    c: $data.isAdmin || $data.isMaterialCreator
  }, $data.isAdmin || $data.isMaterialCreator ? {
    d: common_assets._imports_0$4,
    e: common_vendor.o((...args) => $options.goToModifyPage && $options.goToModifyPage(...args))
  } : {
    f: common_assets._imports_1$4,
    g: common_vendor.o(($event) => $options.goToReportPage($data.id))
  }, {
    h: common_vendor.t($data.title),
    i: common_vendor.t($options.displayRating),
    j: common_vendor.f($data.starRating, (star, index, i0) => {
      return {
        a: index,
        b: star === "full" ? "/static/full-star.png" : "/static/half-star.png"
      };
    }),
    k: common_vendor.t($data.category),
    l: common_vendor.t($data.courseName),
    m: $data.isCommentsLoading
  }, $data.isCommentsLoading ? {} : {}, {
    n: common_vendor.f($data.comments, (comment, index, i0) => {
      return {
        a: comment.avatar,
        b: common_vendor.t(comment.nickname),
        c: common_vendor.t($options.formatData(comment.created_at)),
        d: common_vendor.t(comment.comment_text),
        e: common_vendor.o(($event) => $options.handleLongPress(comment), index),
        f: index
      };
    }),
    o: common_vendor.f(5, (n, k0, i0) => {
      return {
        a: n,
        b: n <= $data.currentRating ? 1 : "",
        c: common_vendor.o(($event) => $options.rate(n), n)
      };
    }),
    p: common_vendor.o((...args) => $options.downloadMaterial && $options.downloadMaterial(...args)),
    q: common_vendor.o((...args) => $options.postComment && $options.postComment(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
