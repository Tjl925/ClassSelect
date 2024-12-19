"use strict";
const common_vendor = require("../../common/vendor.js");
const uni_modules_uniIdPages_common_store = require("../../uni_modules/uni-id-pages/common/store.js");
const common_assets = require("../../common/assets.js");
const db = common_vendor.Vs.database();
const dbCollectionName = "community_post";
const UniIdPagesAvatar = () => "../../uni_modules/uni-id-pages/components/uni-id-pages-avatar/uni-id-pages-avatar.js";
const _sfc_main = {
  computed: {
    inputPlaceholder(e) {
      if (common_vendor.index.getStorageSync("CURRENT_LANG") == "en") {
        return "Please enter the search content";
      } else {
        return "请输入搜索内容";
      }
    },
    whereCondition() {
      let baseCondition = '"article_status" == 1';
      if (this.keyword) {
        return `${baseCondition} && (/${this.keyword}/.test(title) || /${this.keyword}/.test(content))`;
      } else {
        return baseCondition;
      }
    },
    userInfo() {
      return uni_modules_uniIdPages_common_store.store.userInfo;
    }
  },
  data() {
    let postData = {
      "content": "",
      "imgs": [],
      "title": "",
      "user_id": "",
      "likes_count": 0,
      "ans_count": 0,
      "article_status": 1
    };
    return {
      pageSize: 6,
      postData,
      formOptions: {},
      test_url: "https://mp-55788fb7-2392-4142-8486-dfaba6fb925c.cdn.bspapp.com/cloudstorage/user.png",
      where: '"article_status" == 1',
      keyword: "",
      width: "200px",
      // 设置按钮宽度
      height: "200px",
      // 设置按钮高度
      border: false,
      // 控制是否显示边框
      // 数据表名
      collection: "community_post",
      // 查询字段，多个字段用 , 分割
      field: "_id,user_id,content,created_at,likes_count,ans_count,title",
      formData: {
        status: "loading"
        // 加载状态
      },
      tipShow: false,
      // 是否显示顶部提示框
      posts: [],
      // 存储贴子信息
      newPost: {
        title: "",
        // 新帖子的标题
        content: "",
        // 新帖子的内容
        article_status: 1
      },
      CurrentAvatar_file: {
        extname: "",
        name: "",
        url: ""
      },
      isAddingPost: false,
      // 控制是否显示添加新帖子的表单
      overlayVisible: false,
      // 控制遮罩的显示
      isLiking: false
      //点赞防抖
    };
  },
  watch: {
    keyword(newKeyword) {
      this.updateWhereCondition();
      this.posts = [];
      console.log("根据关键字重新加载");
      this.getPosts().then(() => {
        this.getLikes();
      });
    }
  },
  methods: {
    cancelAddPost() {
      this.isAddingPost = false;
      this.overlayVisible = false;
      this.postData.content = "";
      this.postData.imgs = [];
      this.postData.title = "";
    },
    /**
     * 触发表单提交
     */
    submit() {
      common_vendor.index.showLoading({
        mask: true
      });
      this.submitForm(this.postData);
      common_vendor.index.hideLoading();
      console.log("提交");
      this.getPosts().then(() => {
        this.getLikes();
      });
    },
    submitForm(value) {
      this.postData.user_id = uni_modules_uniIdPages_common_store.store.userInfo._id;
      this.postData.created_at = (/* @__PURE__ */ new Date()).toISOString();
      db.collection(dbCollectionName).add(value).then((res) => {
        common_vendor.index.showToast({
          icon: "none",
          title: "提交成功"
        });
        setTimeout(() => this.cancelAddPost(), 500);
      }).catch((err) => {
        common_vendor.index.showModal({
          content: "标题或内容不能为空！",
          showCancel: false
        });
      }).finally(() => {
        common_vendor.index.hideLoading();
      });
    },
    load(data, ended) {
      if (ended) {
        this.formData.status = "noMore";
      }
    },
    updateWhereCondition() {
      let baseCondition = '"article_status" == 1';
      this.where = this.keyword ? `${baseCondition} && (/${this.keyword}/.test(title) || /${this.keyword}/.test(content))` : baseCondition;
    },
    searchClick(e) {
      common_vendor.index.hideKeyboard();
      this.posts = [];
      common_vendor.index.navigateTo({
        url: "/pages/community/search/search",
        animationType: "fade-in"
      });
    },
    // 获取点赞数据
    async getLikes() {
      if (!uni_modules_uniIdPages_common_store.store.hasLogin) {
        this.posts.forEach((post) => {
          post.liked = false;
        });
        return;
      }
      try {
        const promises = this.posts.map((post) => {
          return this.getlikes(post._id).then((liked) => {
            post.liked = liked;
          });
        });
        await Promise.all(promises);
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
          // 确保查询条件中包含 post_id
        }).field("post_id").get().then((res) => {
          if (res.result.data && res.result.data.length > 0) {
            const exists = res.result.data.some((item) => item.post_id === post_id);
            resolve(exists);
          } else {
            resolve(false);
          }
        }).catch((error) => {
          console.error("获取点赞失败:", error);
          resolve(false);
        });
      });
    },
    // 获取贴子数据
    getPosts() {
      return new Promise((resolve, reject) => {
        this.posts = [];
        common_vendor.index.showLoading({
          mask: true
        });
        db.collection("community_post").where(this.where).orderBy("created_at", "desc").get().then((res) => {
          if (res.result.data && Array.isArray(res.result.data)) {
            const postsGetName = res.result.data.map((post) => {
              return this.getPostName(post.user_id).then((nickname) => {
                return {
                  ...post,
                  nickname
                };
              });
            });
            Promise.all(postsGetName).then((posts) => {
              this.posts = posts;
              resolve();
            });
          } else {
            this.posts = [];
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
    // 获取贴主名称
    getPostName(user_id) {
      return new Promise((resolve, reject) => {
        db.collection("uni-id-users").where({
          _id: user_id
        }).field("nickname").get().then((res) => {
          if (res.result.data && res.result.data.length > 0) {
            const nickname = res.result.data[0].nickname;
            console.log(`ID: ${user_id}`);
            console.log(`名称: ${nickname}`);
            resolve(nickname);
          } else {
            console.log(`ID: ${user_id}`);
            console.log("没有数据");
            resolve("未知用户");
          }
        }).catch((error) => {
          console.error("获取失败:", error);
          resolve("未知用户");
        });
      });
    },
    ChangeLike(item) {
      if (!uni_modules_uniIdPages_common_store.store.hasLogin) {
        common_vendor.index.showToast({
          title: "请登陆后再点赞",
          icon: "none"
        });
        return;
      }
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
    },
    formatDate(timestamp) {
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    },
    goToAddPage() {
      if (!uni_modules_uniIdPages_common_store.store.hasLogin) {
        common_vendor.index.showToast({
          title: "请登陆后再发贴",
          icon: "none"
        });
        return;
      }
      this.isAddingPost = true;
      this.overlayVisible = true;
    },
    addPost() {
      if (this.newPost.title.trim() === "" || this.newPost.content.trim() === "") {
        common_vendor.index.showToast({
          title: "标题和内容不能为空",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showLoading({
        mask: true,
        title: "发布中"
      });
      db.collection("community_post").add({
        user_id: uni_modules_uniIdPages_common_store.store.userInfo._id,
        content: this.newPost.content,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        likes_count: 0,
        ans_count: 0,
        title: this.newPost.title,
        avatar_file: this.CurrentAvatar_file,
        article_status: 1
      }).then((res) => {
        common_vendor.index.hideLoading();
        this.cancelAddPost();
        console.log("提交1");
        this.getPosts().then(() => {
          this.getLikes();
        });
      }).catch((err) => {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "发布失败",
          icon: "none"
        });
        console.error("创建帖子失败:", err);
      });
    },
    //不是路径的话可以先传入云，之后删去即可。
    async Mybindchooseavatar(res) {
      let avatarUrl = res.detail.avatarUrl;
      let avatar_file = {
        extname: avatarUrl.split(".")[avatarUrl.split(".").length - 1],
        name: "",
        url: ""
      };
      let cloudPath = uni_modules_uniIdPages_common_store.store.userInfo._id + "" + Date.now();
      avatar_file.name = cloudPath;
      try {
        common_vendor.index.showLoading({
          title: "上传中",
          mask: true
        });
        let {
          fileID
        } = await common_vendor.Vs.uploadFile({
          filePath: avatarUrl,
          cloudPath: "/cloudstorage/community_image/" + cloudPath,
          fileType: "image",
          cloudPathAsRealPath: true,
          onUploadProgress: function(progressEvent) {
            console.log(progressEvent);
          }
        });
        avatar_file.url = fileID;
        this.CurrentAvatar_file.extname = avatar_file.extname;
        this.CurrentAvatar_file.name = avatar_file.name;
        this.CurrentAvatar_file.url = avatar_file.url;
        console.log(fileID);
        common_vendor.index.hideLoading();
      } catch (e) {
        console.error(e);
      }
    },
    uploadAvatarImg() {
      UniIdPagesAvatar.methods.uploadAvatarImg();
    }
  },
  //这里是method结束
  /**
   * 下拉刷新回调函数
   */
  onShow() {
    this.keyword = getApp().globalData.searchText;
    console.log(this.keyword);
    console.log(this.where);
    getApp().globalData.searchText = "";
    console.log(111);
    console.log(getApp().globalData.community_status);
    if (getApp().globalData.community_status) {
      if (getApp().globalData.community_status == 1) {
        console.log(getApp().globalData.community_status);
        getApp().globalData.community_status = 0;
      }
    } else if (getApp().globalData.community_status == 0) {
      console.log("show");
      this.getPosts().then(() => {
        this.getLikes();
      });
    }
  },
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
    console.log("下滑刷新");
    this.getPosts().then(() => {
      this.getLikes();
    });
  },
  /**
   * 上拉加载回调函数
   */
  onReachBottom() {
    this.$refs.udb.loadMore();
  },
  onLoad(options) {
    console.log("加载");
    this.getPosts().then(() => {
      this.getLikes();
    });
  },
  onReachBottom() {
    console.log(this.posts);
    if (this.posts.length > this.pageSize) {
      console.log("当前课程数量：" + this.posts.length);
      this.pageSize += 6;
    } else {
      common_vendor.index.showToast({
        title: "已加载全部记录",
        icon: "none"
      });
    }
  }
};
if (!Array) {
  const _component_statusBar = common_vendor.resolveComponent("statusBar");
  const _easycom_uni_search_bar2 = common_vendor.resolveComponent("uni-search-bar");
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  const _easycom_uni_load_more2 = common_vendor.resolveComponent("uni-load-more");
  const _easycom_unicloud_db2 = common_vendor.resolveComponent("unicloud-db");
  const _easycom_uni_forms_item2 = common_vendor.resolveComponent("uni-forms-item");
  const _easycom_uni_easyinput2 = common_vendor.resolveComponent("uni-easyinput");
  const _easycom_uni_file_picker2 = common_vendor.resolveComponent("uni-file-picker");
  const _easycom_uni_forms2 = common_vendor.resolveComponent("uni-forms");
  (_component_statusBar + _easycom_uni_search_bar2 + _easycom_uni_list_item2 + _easycom_uni_list2 + _easycom_uni_load_more2 + _easycom_unicloud_db2 + _easycom_uni_forms_item2 + _easycom_uni_easyinput2 + _easycom_uni_file_picker2 + _easycom_uni_forms2)();
}
const _easycom_uni_search_bar = () => "../../uni_modules/uni-search-bar/components/uni-search-bar/uni-search-bar.js";
const _easycom_uni_list_item = () => "../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../uni_modules/uni-list/components/uni-list/uni-list.js";
const _easycom_uni_load_more = () => "../../uni_modules/uni-load-more/components/uni-load-more/uni-load-more.js";
const _easycom_unicloud_db = () => "../../node-modules/@dcloudio/uni-components/lib/unicloud-db/unicloud-db.js";
const _easycom_uni_forms_item = () => "../../uni_modules/uni-forms/components/uni-forms-item/uni-forms-item.js";
const _easycom_uni_easyinput = () => "../../uni_modules/uni-easyinput/components/uni-easyinput/uni-easyinput.js";
const _easycom_uni_file_picker = () => "../../uni_modules/uni-file-picker/components/uni-file-picker/uni-file-picker.js";
const _easycom_uni_forms = () => "../../uni_modules/uni-forms/components/uni-forms/uni-forms.js";
if (!Math) {
  (_easycom_uni_search_bar + _easycom_uni_list_item + _easycom_uni_list + _easycom_uni_load_more + _easycom_unicloud_db + _easycom_uni_forms_item + _easycom_uni_easyinput + _easycom_uni_file_picker + _easycom_uni_forms)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.sr("searchBar", "52b1dce7-1"),
    b: common_vendor.o(($event) => $data.keyword = $event),
    c: common_vendor.p({
      radius: "100",
      cancelButton: "none",
      disabled: true,
      placeholder: $options.inputPlaceholder,
      modelValue: $data.keyword
    }),
    d: common_vendor.o((...args) => $options.searchClick && $options.searchClick(...args)),
    e: $data.tipShow ? 1 : "",
    f: common_vendor.w(({
      data,
      loading,
      error,
      options
    }, s0, i0) => {
      return common_vendor.e({
        a: common_vendor.f($data.posts.slice(0, $data.pageSize), (item, k1, i1) => {
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
            j: common_vendor.o(($event) => $options.ChangeLike(item), item._id),
            k: common_vendor.t($options.formatDate(item.created_at)),
            l: item._id,
            m: "52b1dce7-4-" + i0 + "-" + i1 + "," + ("52b1dce7-3-" + i0),
            n: common_vendor.p({
              direction: "column",
              to: "/pages/community/detail?id=" + item._id + "&title=" + item.title
            })
          });
        }),
        b: "52b1dce7-3-" + i0 + ",52b1dce7-2",
        c: loading || options.status === "noMore"
      }, loading || options.status === "noMore" ? {
        d: "52b1dce7-5-" + i0 + ",52b1dce7-2",
        e: common_vendor.p({
          status: options.status
        })
      } : {}, {
        f: i0,
        g: s0
      });
    }, {
      name: "d",
      path: "f",
      vueId: "52b1dce7-2"
    }),
    g: common_assets._imports_1,
    h: common_vendor.sr("udb", "52b1dce7-2"),
    i: common_vendor.o($options.load),
    j: common_vendor.p({
      options: $data.formData,
      collection: $data.collection,
      field: $data.field,
      where: $options.whereCondition
    }),
    k: common_assets._imports_1$1,
    l: common_vendor.o((...args) => $options.goToAddPage && $options.goToAddPage(...args)),
    m: $data.overlayVisible
  }, $data.overlayVisible ? {
    n: common_vendor.o((...args) => $options.cancelAddPost && $options.cancelAddPost(...args))
  } : {}, {
    o: $data.isAddingPost
  }, $data.isAddingPost ? {
    p: common_vendor.o([($event) => $data.postData.content = $event.detail.value, ($event) => _ctx.binddata("content", $event.detail.value)]),
    q: $data.postData.content,
    r: common_vendor.p({
      name: "content",
      label: "内容",
      required: true
    }),
    s: common_vendor.o(($event) => $data.postData.title = $event),
    t: common_vendor.p({
      trim: "both",
      modelValue: $data.postData.title
    }),
    v: common_vendor.p({
      name: "contact",
      label: "标题",
      required: true
    }),
    w: common_vendor.o(($event) => $data.postData.imgs = $event),
    x: common_vendor.p({
      ["file-mediatype"]: "image",
      limit: 1,
      ["return-type"]: "array",
      modelValue: $data.postData.imgs
    }),
    y: common_vendor.p({
      name: "imgs",
      label: "图片"
    }),
    z: common_vendor.o((...args) => $options.submit && $options.submit(...args)),
    A: common_vendor.o((...args) => $options.cancelAddPost && $options.cancelAddPost(...args)),
    B: common_vendor.sr("form", "52b1dce7-6"),
    C: common_vendor.p({
      value: $data.postData,
      ["validate-trigger"]: "submit",
      ["err-show-type"]: "toast"
    })
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
