"use strict";
const common_vendor = require("../../../../common/vendor.js");
const db = common_vendor.Vs.database();
const _sfc_main = {
  data() {
    return {
      queryWhere: "",
      loadMore: {
        contentdown: "",
        contentrefresh: "",
        contentnomore: ""
      },
      options: {},
      reported_id: "",
      type: "",
      reported_post: "",
      reply_content: "",
      _id: ""
      // 添加到 data 以便统一管理
    };
  },
  async onLoad(e) {
    this._id = e.id;
    if (this._id) {
      this.queryWhere = `_id=="${this._id}"`;
      try {
        await this.getReportedInfo();
        console.log("已获取被举报信息，准备获取评论内容");
        await this.getReplyContent();
      } catch (error) {
        console.error("加载数据出错", error);
        common_vendor.index.showToast({
          title: "加载数据失败，请稍后再试",
          icon: "none"
        });
      }
    }
  },
  computed: {
    isReply() {
      return this.type === "评论";
    }
  },
  methods: {
    async getReplyContent() {
      if (this.isReply && this.reported_id) {
        console.log("正在获取评论讯息:", this.reported_id);
        try {
          const res = await db.collection("community_ans").doc(this.reported_id).get();
          console.log(res);
          if (res.result.data && Array.isArray(res.result.data) && res.result.data.length > 0) {
            this.reported_post = res.result.data[0].post_id;
            this.reply_content = res.result.data[0].content;
            this.options = {
              ...this.options
            };
          } else {
            throw new Error("数据为空或格式不正确");
          }
        } catch (error) {
          console.error("获取评论讯息失败", error);
          common_vendor.index.showToast({
            title: `获取被举报评论失败！`,
            icon: "none"
          });
        }
      }
    },
    async getReportedInfo() {
      try {
        const res = await db.collection("reports").doc(this._id).get();
        console.log(res);
        if (res.result.data && Array.isArray(res.result.data) && res.result.data.length > 0) {
          this.reported_id = res.result.data[0].reported_id;
          console.log(this.reported_id);
          this.type = res.result.data[0].type;
        } else {
          throw new Error("数据为空或格式不正确");
        }
      } catch (error) {
        console.error("获取被举报信息失败", error);
        common_vendor.index.showToast({
          title: `获取被举报信息失败！`,
          icon: "none"
        });
        throw error;
      }
    },
    handleConfirm() {
      common_vendor.index.showModal({
        title: "确认处理",
        content: `您确认已处理该举报了吗？`,
        success: async (modalRes) => {
          if (modalRes.confirm) {
            try {
              await db.collection("reports").where({
                _id: this._id
              }).update({
                status: 1
              });
              common_vendor.index.showToast({
                title: `确认成功！`,
                icon: "success"
              });
              setTimeout(() => {
                common_vendor.index.redirectTo({
                  url: "./list"
                });
              }, 2e3);
            } catch (error) {
              console.error("确认失败:", error);
              common_vendor.index.showToast({
                title: "确认失败！，请稍后再试",
                icon: "none"
              });
            }
          } else {
            console.log("用户取消确认");
          }
        }
      });
    },
    handleDelete() {
      this.$refs.udb.remove(this._id, {
        success: (res) => {
          common_vendor.index.navigateTo({
            url: "./list"
          });
        },
        fail: (err) => {
          console.error("删除失败", err);
          common_vendor.index.showToast({
            title: "删除失败，请稍后再试",
            icon: "none"
          });
        }
      });
    },
    handleDeal(reported_id) {
      if (this.type === "帖子") {
        common_vendor.index.navigateTo({
          url: `/pages/community/detail?id=${reported_id}`
        });
      } else if (this.type === "评论") {
        common_vendor.index.navigateTo({
          url: `/pages/community/detail?id=${this.reported_post}`
        });
      } else if (this.type === "课程信息") {
        common_vendor.index.navigateTo({
          url: `/pages/course/detail?_id=${reported_id}`
        });
      } else if (this.type === "资料") {
        common_vendor.index.navigateTo({
          url: `/pages/material/detail?id=${reported_id}`
        });
      }
    },
    formatDate(timestamp) {
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    }
  }
};
if (!Array) {
  const _easycom_uni_load_more2 = common_vendor.resolveComponent("uni-load-more");
  const _easycom_unicloud_db2 = common_vendor.resolveComponent("unicloud-db");
  (_easycom_uni_load_more2 + _easycom_unicloud_db2)();
}
const _easycom_uni_load_more = () => "../../../uni-load-more/components/uni-load-more/uni-load-more.js";
const _easycom_unicloud_db = () => "../../../../node-modules/@dcloudio/uni-components/lib/unicloud-db/unicloud-db.js";
if (!Math) {
  (_easycom_uni_load_more + _easycom_unicloud_db)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.w(({
      data,
      loading,
      error,
      options
    }, s0, i0) => {
      return common_vendor.e({
        a: error
      }, error ? {
        b: common_vendor.t(error.message)
      } : loading ? {
        d: "6ae6af12-1-" + i0 + ",6ae6af12-0",
        e: common_vendor.p({
          contentText: $data.loadMore,
          status: "loading"
        })
      } : data ? common_vendor.e({
        g: common_vendor.t(data.type),
        h: $options.isReply
      }, $options.isReply ? {
        i: common_vendor.t($data.reply_content)
      } : {}, {
        j: common_vendor.t($options.formatDate(data.created_at)),
        k: common_vendor.t(data.reason),
        l: common_vendor.t(data.content),
        m: common_vendor.f(data.imgs, (file, j, i1) => {
          return {
            a: file.path,
            b: j
          };
        })
      }) : {}, {
        c: loading,
        f: data,
        n: i0,
        o: s0
      });
    }, {
      name: "d",
      path: "a",
      vueId: "6ae6af12-0"
    }),
    b: common_vendor.sr("udb", "6ae6af12-0"),
    c: common_vendor.p({
      options: $data.options,
      collection: "reports",
      field: "content,imgs,created_at,status,reason,type",
      where: $data.queryWhere,
      getone: true,
      manual: true
    }),
    d: common_vendor.o(($event) => $options.handleDeal($data.reported_id)),
    e: common_vendor.o((...args) => $options.handleConfirm && $options.handleConfirm(...args)),
    f: common_vendor.o((...args) => $options.handleDelete && $options.handleDelete(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
