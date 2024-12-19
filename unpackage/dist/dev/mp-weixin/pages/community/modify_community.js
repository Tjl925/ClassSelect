"use strict";
const common_vendor = require("../../common/vendor.js");
const uni_modules_uniIdPages_common_store = require("../../uni_modules/uni-id-pages/common/store.js");
const db = common_vendor.Vs.database();
const _sfc_main = {
  data() {
    return {
      post: {
        "content": "",
        "imgs": [],
        "title": "",
        "user_id": "",
        "likes_count": 0,
        "ans_count": 0,
        "article_status": 1
      },
      CurrentAvatar_file: {
        extname: "",
        name: "",
        url: ""
      },
      width: "200px",
      // 设置按钮宽度
      height: "200px",
      // 设置按钮高度
      border: false
      // 控制是否显示边框
    };
  },
  methods: {
    deletePost() {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这个贴子吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              common_vendor.index.showLoading({
                title: "删除中...",
                mask: true
              });
              const result = await db.collection("community_post").doc(this.post._id).remove();
              console.log(result);
              getApp().globalData.community_status = 0;
              if (result.result.deleted === 1) {
                common_vendor.index.showToast({
                  title: "删除成功",
                  icon: "success"
                });
                setTimeout(() => {
                  common_vendor.index.navigateBack({
                    delta: 2
                  });
                }, 2e3);
              } else {
                throw new Error("删除失败");
              }
            } catch (error) {
              console.error("删除贴子失败:", error);
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
        const result = await db.collection("community_post").doc(this.post._id).get();
        console.log(result);
        if (result.result.data && Array.isArray(result.result.data) && result.result.data.length > 0) {
          const postData = result.result.data[0];
          this.post.title = postData.title;
          this.post.content = postData.content;
          if (postData.imgs && postData.imgs[0] && postData.imgs[0].path) {
            this.post.imgs = postData.imgs;
          }
        } else {
          throw new Error("未找到贴子信息");
        }
      } catch (error) {
        console.error("获取贴子信息失败:", error);
        common_vendor.index.showToast({
          title: "获取贴子信息失败",
          icon: "none"
        });
      }
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
            var percentCompleted = Math.round(
              progressEvent.loaded * 100 / progressEvent.total
            );
          }
        });
        avatar_file.url = fileID;
        this.post.avatar_file.extname = avatar_file.extname;
        this.post.avatar_file.name = avatar_file.name;
        this.post.avatar_file.url = avatar_file.url;
        console.log(fileID);
        common_vendor.index.hideLoading();
      } catch (e) {
        console.error(e);
      }
    },
    async submitPostInfo() {
      if (this.post.content.trim() === "") {
        common_vendor.index.showToast({
          title: "内容不能为空",
          icon: "none"
        });
        return;
      }
      if (this.post.title.trim() === "") {
        common_vendor.index.showToast({
          title: "标题不能为空",
          icon: "none"
        });
        return;
      }
      console.log(this.post.content);
      try {
        common_vendor.index.showLoading({
          title: "提交中...",
          mask: true
        });
        console.log(this.post._id);
        const result = await db.collection("community_post").doc(this.post._id).update({
          title: this.post.title,
          content: this.post.content,
          imgs: this.post.imgs
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
        console.error("提交贴子信息失败:", error);
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
    this.post._id = options.postId;
    common_vendor.index.setNavigationBarTitle({
      title: "修改贴子信息"
      // 替换为你的标题
    });
    this.fetchPostDetails();
  }
};
if (!Array) {
  const _easycom_uni_file_picker2 = common_vendor.resolveComponent("uni-file-picker");
  const _easycom_uni_forms_item2 = common_vendor.resolveComponent("uni-forms-item");
  const _component_template = common_vendor.resolveComponent("template");
  (_easycom_uni_file_picker2 + _easycom_uni_forms_item2 + _component_template)();
}
const _easycom_uni_file_picker = () => "../../uni_modules/uni-file-picker/components/uni-file-picker/uni-file-picker.js";
const _easycom_uni_forms_item = () => "../../uni_modules/uni-forms/components/uni-forms-item/uni-forms-item.js";
if (!Math) {
  (_easycom_uni_file_picker + _easycom_uni_forms_item)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.post.title,
    b: common_vendor.o(($event) => $data.post.title = $event.detail.value),
    c: $data.post.content,
    d: common_vendor.o(($event) => $data.post.content = $event.detail.value),
    e: common_vendor.o(($event) => $data.post.imgs = $event),
    f: common_vendor.p({
      ["file-mediatype"]: "image",
      limit: 1,
      ["return-type"]: "array",
      modelValue: $data.post.imgs
    }),
    g: common_vendor.p({
      name: "imgs",
      label: "图片列表"
    }),
    h: common_vendor.o(($event) => $options.navBack()),
    i: common_vendor.o(($event) => $options.submitPostInfo()),
    j: common_vendor.o(($event) => $options.deletePost()),
    k: common_vendor.o((...args) => $options.submitPostInfo && $options.submitPostInfo(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-f32a9752"]]);
wx.createPage(MiniProgramPage);
