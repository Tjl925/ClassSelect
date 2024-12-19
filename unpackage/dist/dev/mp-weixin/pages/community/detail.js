"use strict";
const common_vendor = require("../../common/vendor.js");
const uni_modules_uniIdPages_common_store = require("../../uni_modules/uni-id-pages/common/store.js");
require("../../common/html-parser.js");
const common_assets = require("../../common/assets.js");
const db = common_vendor.Vs.database();
const _sfc_main = {
  data() {
    return {
      overlayVisible: false,
      // 控制遮罩的显示
      isAddingAns: false,
      isLiking: false,
      //点赞防抖
      // 当前显示 _id == "60fa38e79c77390001e2b3a7" ,只做演示使用，可通过详情页传递id过来
      id: "",
      title: "",
      // 查询字段，多个字段用 , 分割
      field: "_id,user_id,content,created_at,likes_count,ans_count,title,avatar_file",
      formData: {
        status: "loading"
        // 加载状态
      },
      tipShow: false,
      // 是否显示顶部提示框
      post: {
        liked: false
      },
      //有liked
      post_avatar_file: "",
      //博主头像
      answers: [],
      //回复数据 有 avatarUrl, content, created_at, nickname, post_id, user_id, _id
      newAns: {
        content: ""
      }
    };
  },
  computed: {
    where() {
      console.log(this.id);
      return `_id =="${this.id}"`;
    },
    checkRole() {
      if (uni_modules_uniIdPages_common_store.store.userInfo.user_role && uni_modules_uniIdPages_common_store.store.userInfo.user_role == "admin" || uni_modules_uniIdPages_common_store.store.userInfo._id == this.post.user_id) {
        return true;
      } else {
        return false;
      }
    }
  },
  onLoad(event) {
    if (event.id) {
      this.id = event.id;
    }
  },
  onReady() {
    if (this.id) {
      this.getPosts(this.id).then(() => {
        this.getAns(this.id).then(() => {
          this.getAnsIMG().then(() => {
            this.getLikes();
          });
        });
      });
    } else {
      common_vendor.index.showToast({
        icon: "none",
        title: "出错了，新闻ID为空"
      });
    }
  },
  methods: {
    checkItemRole(item) {
      return uni_modules_uniIdPages_common_store.store.userInfo.user_role === "admin" || uni_modules_uniIdPages_common_store.store.userInfo._id === item.user_id;
    },
    editReply(replyId) {
      console.log(`/pages/community/modify_reply?replyId=${replyId}&post_id=${this.post._id}`);
      common_vendor.index.navigateTo({
        url: `/pages/community/modify_reply?replyId=${replyId}&post_id=${this.post._id}`
      });
    },
    reportReply(replyId) {
      common_vendor.index.navigateTo({
        url: `/uni_modules/uni-feedback/pages/opendb-report/opendb-report?reported_id=${replyId}&type=评论`
      });
    },
    editPost(postId) {
      common_vendor.index.navigateTo({
        url: `/pages/community/modify_community?postId=${postId}`
      });
    },
    //修改传入的参数和连接即可
    reportPost(postId) {
      common_vendor.index.navigateTo({
        url: `/uni_modules/uni-feedback/pages/opendb-report/opendb-report?reported_id=${postId}&type=帖子`
      });
    },
    goToAddPage() {
      if (!uni_modules_uniIdPages_common_store.store.hasLogin) {
        common_vendor.index.showToast({
          title: "请登陆后再回复",
          icon: "none"
        });
        return;
      }
      this.isAddingAns = true;
      this.overlayVisible = true;
    },
    addAns() {
      if (this.newAns.content.trim() === "") {
        common_vendor.index.showToast({
          title: "内容不能为空",
          icon: "none"
        });
        return;
      }
      this.post.ans_count += 1;
      common_vendor.index.showLoading({
        mask: true,
        title: "发布中"
      });
      db.collection("community_ans").add({
        user_id: uni_modules_uniIdPages_common_store.store.userInfo._id,
        content: this.newAns.content,
        post_id: this.post._id,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      }).then(() => {
        db.collection("community_post").doc(this.post._id).update({
          ans_count: this.post.ans_count
        }).then(() => {
          common_vendor.index.hideLoading();
          this.cancelAddAns();
          this.getPosts(this.id).then(() => {
            this.getAns(this.id).then(() => {
              this.getAnsIMG().then(() => {
                this.getLikes();
              });
            });
          });
          console.log("回复成功");
          getApp().globalData.community_status = 0;
        }).catch((error) => {
          console.error("更新帖子回复计数失败:", error);
        });
      }).catch((error) => {
        console.error("添加回复记录失败:", error);
      });
    },
    load(data, ended) {
      if (ended) {
        this.formData.status = "noMore";
      }
      if (data) {
        this.post = data;
      }
    },
    formatDate(timestamp) {
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    },
    cancelAddAns() {
      this.newAns.content = "";
      this.isAddingAns = false;
      this.overlayVisible = false;
    },
    // 获取贴子数据
    // 获取贴子数据
    getPosts(post_id) {
      return new Promise((resolve, reject) => {
        common_vendor.index.showLoading({
          mask: true
        });
        db.collection("community_post").where({
          _id: post_id
        }).get().then((res) => {
          common_vendor.index.hideLoading();
          if (res.result.data && res.result.data.length > 0) {
            const post = res.result.data[0];
            this.getNickName(post.user_id).then((nickname) => {
              post.nickname = nickname;
              post.liked = false;
              this.post = post;
              this.getImg(post.user_id).then((avatarUrl) => {
                this.post_avatar_file = avatarUrl;
                resolve(this.post);
              }).catch((error) => {
                console.error("获取头像失败:", error);
                this.post_avatar_file = "";
                resolve(this.post);
              });
            });
          } else {
            this.post = {
              liked: false
            };
            this.post_avatar_file = "";
            resolve(this.post);
          }
        }).catch((error) => {
          console.error("获取帖子数据失败:", error);
          common_vendor.index.showToast({
            title: "加载帖子数据失败",
            icon: "none"
          });
          this.post = {};
          this.post_avatar_file = "";
          resolve(this.post);
        });
      });
    },
    // 获取贴主名称
    getNickName(user_id) {
      return db.collection("uni-id-users").where({
        _id: user_id
      }).field("nickname").get().then((res) => {
        if (res.result.data && res.result.data.length > 0) {
          const nickname = res.result.data[0].nickname;
          console.log(`ID: ${user_id}`);
          console.log(`名称: ${nickname}`);
          return nickname;
        } else {
          console.log(`ID: ${user_id}`);
          console.log("没有数据");
          return "未知用户";
        }
      }).catch((error) => {
        console.error("获取失败:", error);
        return "未知用户";
      });
    },
    //获取回复
    getAns(post_id) {
      return new Promise((resolve, reject) => {
        this.answers = [];
        common_vendor.index.showLoading({
          mask: true
        });
        db.collection("community_ans").where({
          post_id
        }).orderBy("created_at", "asc").get().then((res) => {
          if (res.result.data && Array.isArray(res.result.data)) {
            const getName = res.result.data.map((ans) => {
              return this.getNickName(ans.user_id).then((nickname) => {
                return {
                  ...ans,
                  nickname
                };
              });
            });
            Promise.all(getName).then((ans) => {
              this.answers = ans;
              resolve();
            });
          } else {
            this.answers = [];
            resolve();
          }
        }).catch((error) => {
          console.error("获取用户名称失败:", error);
          common_vendor.index.showToast({
            title: "加载用户名称失败",
            icon: "none"
          });
          resolve();
        }).finally(() => {
          common_vendor.index.hideLoading();
        });
      });
    },
    async getAnsIMG() {
      try {
        const promises = this.answers.map((answer) => {
          return this.getImg(answer.user_id).then((user) => {
            return {
              ...answer,
              avatarUrl: user.avatarUrl || ""
              // 确保如果没有头像URL，使用空字符串
            };
          });
        });
        const updatedAnswers = await Promise.all(promises);
        this.answers = updatedAnswers;
      } catch (error) {
        console.error("获取头像数据失败:", error);
      }
    },
    getImg(user_id) {
      return db.collection("uni-id-users").where({
        _id: user_id
      }).field("avatar_file").get().then((res) => {
        if (res.result.data && res.result.data.length > 0 && res.result.data[0]) {
          const avatarUrl = res.result.data[0].avatar_file.url;
          return {
            avatarUrl
          };
        } else {
          return {
            avatarUrl: ""
          };
        }
      }).catch((error) => {
        console.error("获取头像失败:", error);
        return {
          avatarUrl: ""
        };
      });
    },
    async getLikes() {
      if (!uni_modules_uniIdPages_common_store.store.hasLogin) {
        this.post.liked = false;
        return;
      }
      try {
        await this.getlikes(this.post._id).then((liked) => {
          this.post.liked = liked;
        });
      } catch (error) {
        console.error("获取点赞数据失败:", error);
      }
    },
    getlikes(post_id) {
      return new Promise((resolve, reject) => {
        const user_id = uni_modules_uniIdPages_common_store.store.userInfo._id;
        db.collection("community_like").where({
          user_id,
          post_id
        }).field("post_id").limit(1).get().then((res) => {
          if (res.result.data && res.result.data.length > 0) {
            resolve(true);
          } else {
            resolve(false);
          }
        }).catch((error) => {
          console.error("获取点赞失败:", error);
          resolve(false);
        });
      });
    },
    ChangeLike(item) {
      if (this.isLiking) {
        return;
      }
      this.isLiking = true;
      db.collection("community_like").where({
        post_id: item._id,
        user_id: uni_modules_uniIdPages_common_store.store.userInfo._id
      }).get().then((res) => {
        if (res.result.data.length > 0) {
          this.cancelLike(item);
        } else {
          this.addLike(item);
        }
      }).catch((error) => {
        console.error("查询点赞状态失败:", error);
      }).finally(() => {
        this.isLiking = false;
      });
      getApp().globalData.community_status = 0;
    },
    // 添加点赞
    addLike(post) {
      post.likes_count += 1;
      post.liked = true;
      db.collection("community_like").add({
        post_id: post._id,
        user_id: uni_modules_uniIdPages_common_store.store.userInfo._id,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      }).then(() => {
        db.collection("community_post").doc(post._id).update({
          likes_count: post.likes_count
        }).then(() => {
          console.log("点赞成功");
        }).catch((error) => {
          console.error("更新帖子点赞计数失败:", error);
        });
      }).catch((error) => {
        console.error("添加点赞记录失败:", error);
      });
    },
    // 取消点赞
    cancelLike(post) {
      post.likes_count -= 1;
      post.liked = false;
      db.collection("community_like").where({
        post_id: post._id,
        user_id: uni_modules_uniIdPages_common_store.store.userInfo._id
      }).remove().then(() => {
        db.collection("community_post").doc(post._id).update({
          likes_count: post.likes_count
        }).then(() => {
          console.log("取消点赞成功");
        }).catch((error) => {
          console.error("更新帖子点赞计数失败:", error);
        });
      }).catch((error) => {
        console.error("删除点赞记录失败:", error);
      });
    }
  },
  // 上一行是method结束
  onPullDownRefresh() {
    this.formData.status = "more";
    this.$refs.udb.loadData({
      clear: true
    }, () => {
      this.tipShow = true;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.tipShow = false;
      }, 1e3);
      common_vendor.index.stopPullDownRefresh();
    });
    this.getPosts(this.id).then(() => {
      this.getAns(this.id).then(() => {
        this.getAnsIMG().then(() => {
          this.getLikes();
        });
      });
      console.log("帖子数据加载完成");
    });
  },
  /**
   * 上拉加载回调函数
   */
  onReachBottom() {
    this.$refs.udb.loadMore();
  },
  onShow() {
    if (this.id) {
      this.getPosts(this.id).then(() => {
        this.getAns(this.id).then(() => {
          this.getAnsIMG().then(() => {
            this.getLikes();
          });
        });
      });
    }
  }
};
if (!Array) {
  const _component_template = common_vendor.resolveComponent("template");
  const _easycom_uni_load_more2 = common_vendor.resolveComponent("uni-load-more");
  const _easycom_unicloud_db2 = common_vendor.resolveComponent("unicloud-db");
  (_component_template + _easycom_uni_load_more2 + _easycom_unicloud_db2)();
}
const _easycom_uni_load_more = () => "../../uni_modules/uni-load-more/components/uni-load-more/uni-load-more.js";
const _easycom_unicloud_db = () => "../../node-modules/@dcloudio/uni-components/lib/unicloud-db/unicloud-db.js";
if (!Math) {
  (_easycom_uni_load_more + _easycom_unicloud_db)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.tipShow ? 1 : "",
    b: common_vendor.w(({
      data,
      loading,
      error,
      options
    }, s0, i0) => {
      return common_vendor.e({
        a: !loading && data
      }, !loading && data ? common_vendor.e({
        b: common_vendor.t($data.post.title),
        c: $data.post_avatar_file.avatarUrl
      }, $data.post_avatar_file.avatarUrl ? {
        d: $data.post_avatar_file.avatarUrl,
        e: common_vendor.t($data.post.nickname),
        f: common_vendor.t($options.formatDate($data.post.created_at))
      } : {}, {
        g: data.content,
        h: $data.post.imgs && $data.post.imgs[0] && $data.post.imgs[0].path
      }, $data.post.imgs && $data.post.imgs[0] && $data.post.imgs[0].path ? {
        i: $data.post.imgs[0].path
      } : {}, {
        j: common_assets._imports_1,
        k: common_vendor.o((...args) => $options.goToAddPage && $options.goToAddPage(...args)),
        l: $data.post
      }, $data.post ? {
        m: $data.post.liked ? "/static/community/like_active.png" : "/static/community/like.png",
        n: common_vendor.o(($event) => $options.ChangeLike($data.post))
      } : {}, {
        o: $options.checkRole
      }, $options.checkRole ? {
        p: common_assets._imports_1$2,
        q: common_vendor.o(($event) => $options.editPost($data.id))
      } : {
        r: common_assets._imports_2,
        s: common_vendor.o(($event) => $options.reportPost($data.id))
      }) : {}, $data.post && Object.keys($data.post).length ? {} : {}, {
        t: common_vendor.f($data.answers, (item, k1, i1) => {
          return common_vendor.e({
            a: item.avatarUrl,
            b: common_vendor.t(item.nickname),
            c: $options.checkItemRole(item)
          }, $options.checkItemRole(item) ? {
            d: common_assets._imports_1$2,
            e: common_vendor.o(($event) => $options.editReply(item._id), item._id)
          } : {
            f: common_assets._imports_2,
            g: common_vendor.o(($event) => $options.reportReply(item._id), item._id)
          }, {
            h: common_vendor.t(item.content),
            i: common_vendor.t($options.formatDate(item.created_at)),
            j: item._id
          });
        }),
        v: loading || options.status === "noMore"
      }, loading || options.status === "noMore" ? {
        w: "24ebfd43-1-" + i0 + ",24ebfd43-0",
        x: common_vendor.p({
          status: options.status
        })
      } : {}, {
        y: i0,
        z: s0
      });
    }, {
      name: "d",
      path: "b",
      vueId: "24ebfd43-0"
    }),
    c: $data.post && Object.keys($data.post).length,
    d: common_vendor.sr("udb", "24ebfd43-0"),
    e: common_vendor.o($options.load),
    f: common_vendor.p({
      options: $data.formData,
      collection: "community_post",
      where: $options.where,
      field: $data.field,
      getone: true,
      manual: true
    }),
    g: $data.overlayVisible
  }, $data.overlayVisible ? {
    h: common_vendor.o((...args) => $options.cancelAddAns && $options.cancelAddAns(...args))
  } : {}, {
    i: $data.isAddingAns
  }, $data.isAddingAns ? {
    j: $data.newAns.content,
    k: common_vendor.o(($event) => $data.newAns.content = $event.detail.value),
    l: common_vendor.o((...args) => $options.addAns && $options.addAns(...args)),
    m: common_vendor.o((...args) => $options.cancelAddAns && $options.cancelAddAns(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
