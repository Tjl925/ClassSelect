"use strict";
const common_vendor = require("../../../common/vendor.js");
const uni_modules_uniIdPages_common_store = require("../../../uni_modules/uni-id-pages/common/store.js");
const db = common_vendor.Vs.database();
const _sfc_main = {
  data() {
    return {
      showDialog: false,
      isLoading: true,
      loadMore: {
        contentdown: "",
        contentrefresh: "",
        contentnomore: ""
      },
      Myans: []
    };
  },
  onLoad() {
    this.getMyAns();
  },
  //下拉刷新
  onPullDownRefresh() {
    this.refreshData();
  },
  //上拉加载更多
  onReachBottom() {
    this.$refs.udb.loadMore();
  },
  methods: {
    formatDate(timestamp) {
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
    },
    showDialog(index) {
      this.showDialog = true;
    },
    cancelDialog() {
      this.showDialog = false;
    },
    getMyAns() {
      common_vendor.index.showLoading({
        title: "加载中...",
        mask: true
      });
      console.log("开始加载");
      let collectionQuery = db.collection("community_ans").orderBy("created_at", "desc");
      collectionQuery = collectionQuery.where({
        user_id: uni_modules_uniIdPages_common_store.store.userInfo._id
      });
      console.log(uni_modules_uniIdPages_common_store.store.userInfo._id);
      collectionQuery.get().then(async (res) => {
        if (res.result.data && Array.isArray(res.result.data)) {
          const ansinfo = await Promise.all(
            res.result.data.map(
              (ans) => this.getpostinfo(ans.post_id).then((postInfo) => ({
                ...ans,
                ...postInfo
                // 使用正确的变量名
              }))
            )
          );
          this.Myans = ansinfo;
        } else {
          this.Myans = [];
        }
        this.isLoading = false;
      }).catch((error) => {
        console.error("获取帖子数据失败:", error);
        common_vendor.index.showToast({
          title: "加载帖子数据失败",
          icon: "none"
        });
        this.isLoading = false;
      }).finally(() => {
        common_vendor.index.hideLoading();
      });
    },
    async getpostinfo(postid) {
      return db.collection("community_post").where({
        _id: postid
        // 确保这里是文档的ID字段，通常是 _id
      }).field({
        title: true,
        likes_count: true,
        ans_count: true
      }).get().then((res) => {
        if (res.result.data && res.result.data.length > 0) {
          const postInfo = res.result.data[0];
          return {
            title: postInfo.title,
            // 返回帖子标题
            likes_count: postInfo.likes_count,
            // 返回点赞数
            ans_count: postInfo.ans_count
          };
        } else {
          return {
            title: "-文章已被删除-",
            likes_count: 0
            // 如果没有找到帖子，返回默认值
          };
        }
      }).catch((error) => {
        console.error("获取帖子信息失败:", error);
        return {
          title: "错误",
          likes_count: 0
          // 如果发生错误，返回错误信息和默认的点赞数
        };
      });
    },
    //导航函数
    handleItemClick(item) {
      console.log(item);
      common_vendor.index.navigateTo({
        url: "/pages/community/detail?id=" + item.post_id + "&title=" + item.title
      });
    },
    showOptions(item) {
      common_vendor.index.showActionSheet({
        itemList: ["删除", "修改"],
        success: function(res) {
          console.log("用户选择了选项：" + (res.tapIndex + 1));
          if (res.tapIndex + 1 == 1) {
            console.log("用户选择了删除");
            const db2 = common_vendor.Vs.database();
            const collection = db2.collection(
              "community_ans"
            );
            collection.doc(item._id).remove().then((res2) => {
              common_vendor.index.showToast({
                title: "删除成功",
                icon: "success"
              });
              console.log("删除成功", res2);
              common_vendor.index.redirectTo({
                url: "/pages/ucenter/historicComments/historicComments"
              });
            }).catch((err) => {
              console.error("删除失败", err);
              common_vendor.index.showToast({
                title: "删除失败",
                icon: "none"
              });
            });
            item.ans_count -= 1;
            const postcollection = db2.collection(
              "community_post"
            );
            postcollection.doc(item.post_id).update({
              ans_count: item.ans_count
            }).then((res2) => {
              console.log("修改成功", res2);
            }).catch((err) => {
              console.error("修改失败", err);
              common_vendor.index.showToast({
                title: "修改失败",
                icon: "none"
              });
            });
          } else if (res.tapIndex == 1) {
            console.log("用户选择了修改");
            console.log(`/pages/community/modify_reply?replyId=${item._id}&post_id=${item.post_id}`);
            common_vendor.index.navigateTo({
              url: `/pages/community/modify_reply?replyId=${item._id}&post_id=${item.post_id}`
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
    }
    //showoptions层
  }
  //  method层
};
if (!Array) {
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  const _easycom_uni_load_state2 = common_vendor.resolveComponent("uni-load-state");
  const _easycom_unicloud_db2 = common_vendor.resolveComponent("unicloud-db");
  (_easycom_uni_list_item2 + _easycom_uni_list2 + _easycom_uni_load_state2 + _easycom_unicloud_db2)();
}
const _easycom_uni_list_item = () => "../../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../../uni_modules/uni-list/components/uni-list/uni-list.js";
const _easycom_uni_load_state = () => "../../../components/uni-load-state/uni-load-state.js";
const _easycom_unicloud_db = () => "../../../node-modules/@dcloudio/uni-components/lib/unicloud-db/unicloud-db.js";
if (!Math) {
  (_easycom_uni_list_item + _easycom_uni_list + _easycom_uni_load_state + _easycom_unicloud_db)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.w(({
      data,
      pagination,
      loading,
      hasMore,
      error
    }, s0, i0) => {
      return common_vendor.e(!$data.Myans || $data.Myans.length === 0 ? {
        a: "0d2d51ee-2-" + i0 + "," + ("0d2d51ee-1-" + i0)
      } : {}, {
        b: common_vendor.f($data.Myans, (item, index, i1) => {
          return {
            a: common_vendor.t(item.content.length > 10 ? item.content.slice(0, 10) + "..." : item.content),
            b: common_vendor.t(item.title),
            c: common_vendor.t($options.formatDate(item.created_at)),
            d: index,
            e: common_vendor.o(($event) => $options.handleItemClick(item), index),
            f: common_vendor.o(($event) => this.showOptions(item), index),
            g: "0d2d51ee-3-" + i0 + "-" + i1 + "," + ("0d2d51ee-1-" + i0)
          };
        }),
        c: "0d2d51ee-1-" + i0 + ",0d2d51ee-0",
        d: "0d2d51ee-4-" + i0 + ",0d2d51ee-0",
        e: common_vendor.p({
          state: {
            Myans: $data.Myans,
            pagination,
            hasMore,
            loading,
            error
          }
        }),
        f: i0,
        g: s0
      });
    }, {
      name: "d",
      path: "a",
      vueId: "0d2d51ee-0"
    }),
    b: !$data.Myans || $data.Myans.length === 0,
    c: common_vendor.p({
      clickable: true
    }),
    d: common_vendor.o(_ctx.refreshData),
    e: common_vendor.sr("udb", "0d2d51ee-0"),
    f: common_vendor.o(($event) => $data.isLoading == false),
    g: common_vendor.o(($event) => $data.isLoading == false),
    h: common_vendor.p({
      collection: "opendb-news-articles",
      ["page-size"]: 10
    }),
    i: $options.showDialog
  }, $options.showDialog ? {
    j: common_vendor.o((...args) => $options.cancelDialog && $options.cancelDialog(...args)),
    k: common_vendor.o(($event) => _ctx.deleteItem(_ctx.index)),
    l: common_vendor.o(($event) => _ctx.modifyItem(_ctx.index))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
