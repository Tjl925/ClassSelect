"use strict";
const common_vendor = require("../../common/vendor.js");
require("../../uni_modules/uni-id-pages/common/store.js");
const db = common_vendor.Vs.database();
const _sfc_main = {
  data() {
    return {
      ans: {
        _id: "",
        content: "",
        post_id: ""
      },
      ans_count: 0,
      width: "200px",
      // 设置按钮宽度
      height: "200px",
      // 设置按钮高度
      border: false
      // 控制是否显示边框
    };
  },
  methods: {
    deleteAns() {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这个回复吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              common_vendor.index.showLoading({
                title: "删除中...",
                mask: true
              });
              const result = await db.collection("community_ans").doc(this.ans._id).remove();
              console.log(result);
              if (result.result.deleted === 1) {
                this.ans_count -= 1;
                await db.collection("community_post").doc(this.ans.post_id).update({
                  ans_count: this.ans_count
                });
                console.log(this.ans_count);
                common_vendor.index.navigateBack();
              } else {
                throw new Error("删除失败");
              }
            } catch (error) {
              console.error("删除回复失败:", error);
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
    async fetchPostDetails() {
      try {
        const ansResult = await db.collection("community_ans").doc(this.ans._id).get();
        if (ansResult.result.data && Array.isArray(ansResult.result.data) && ansResult.result.data.length > 0) {
          const ansData = ansResult.result.data[0];
          this.ans.content = ansData.content;
          this.ans.post_id = ansData.post_id;
        } else {
          throw new Error("未找到回复信息");
        }
      } catch (error) {
        console.error("获取信息失败:", error);
        common_vendor.index.showToast({
          title: "获取信息失败",
          icon: "none"
        });
      }
    },
    async fetchCountDetails() {
      try {
        const ansResult = await db.collection("community_post").doc(this.ans.post_id).get();
        if (ansResult.result.data && Array.isArray(ansResult.result.data) && ansResult.result.data.length > 0) {
          const ansData = ansResult.result.data[0];
          this.ans_count = ansData.ans_count;
        } else {
          throw new Error("未找到点赞信息");
        }
      } catch (error) {
        console.error("获取点赞信息失败:", error);
        common_vendor.index.showToast({
          title: "获取点赞信息失败",
          icon: "none"
        });
      }
    },
    async submitAnsInfo() {
      if (this.ans.content.trim() === "") {
        common_vendor.index.showToast({
          title: "内容不能为空",
          icon: "none"
        });
        return;
      }
      console.log(this.ans.content);
      try {
        common_vendor.index.showLoading({
          title: "提交中...",
          mask: true
        });
        this.ans_count -= 1;
        console.log(this.ans._id);
        const result = await db.collection("community_ans").doc(this.ans._id).update({
          content: this.ans.content
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
        console.error("提交回复信息失败:", error);
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
    this.ans._id = options.replyId;
    this.ans.post_id = options.post_id;
    common_vendor.index.setNavigationBarTitle({
      title: "修改回复信息"
      // 替换为你的标题
    });
    this.fetchPostDetails().then(() => {
      this.fetchCountDetails();
    });
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.ans.content,
    b: common_vendor.o(($event) => $data.ans.content = $event.detail.value),
    c: common_vendor.o(($event) => $options.navBack()),
    d: common_vendor.o(($event) => $options.submitAnsInfo()),
    e: common_vendor.o(($event) => $options.deleteAns()),
    f: common_vendor.o((...args) => $options.submitAnsInfo && $options.submitAnsInfo(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-a4594d10"]]);
wx.createPage(MiniProgramPage);
