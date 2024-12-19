"use strict";
const common_vendor = require("../../../../common/vendor.js");
const uni_modules_uniIdPages_common_store = require("../../../uni-id-pages/common/store.js");
const db = common_vendor.Vs.database();
const dbCollectionName = "reports";
common_vendor.Vs.importObject("uni-id-co");
const _sfc_main = {
  data() {
    let formData = {
      "content": "",
      "reason": "",
      "imgs": [],
      "nickname": "",
      "created_at": "",
      "status": 0,
      "type": "",
      "reported_id": ""
    };
    return {
      formData,
      formOptions: {}
    };
  },
  computed: {
    userInfo() {
      return uni_modules_uniIdPages_common_store.store.userInfo;
    }
  },
  onLoad(options) {
    this.formData.reported_id = options.reported_id;
    this.formData.type = options.type;
    this.getUserNickname(this.userInfo._id);
    common_vendor.index.setNavigationBarTitle({
      title: "填写举报单"
      // 替换为你的标题
    });
  },
  methods: {
    getUserNickname(userId) {
      return db.collection("uni-id-users").where({
        _id: userId
      }).field("nickname").get().then((res) => {
        if (res.result.data && res.result.data.length > 0) {
          const user = res.result.data[0];
          this.formData.nickname = user.nickname;
        }
      }).catch((error) => {
        console.error("获取用户信息失败:", error);
        return "匿名用户";
      });
    },
    submit() {
      this.formData.created_at = (/* @__PURE__ */ new Date()).toISOString();
      this.submitForm(this.formData).catch(() => {
        common_vendor.index.hideLoading();
      });
    },
    submitForm(value) {
      db.collection(dbCollectionName).add(value).then((res) => {
        common_vendor.index.showToast({
          icon: "none",
          title: "提交成功"
        });
        this.getOpenerEventChannel().emit("refreshData");
        setTimeout(() => common_vendor.index.navigateBack(), 500);
      }).catch((err) => {
        common_vendor.index.showModal({
          content: err.message || "请求服务失败",
          showCancel: false
        });
      }).finally(() => {
        common_vendor.index.hideLoading();
      });
    }
  }
};
if (!Array) {
  const _easycom_uni_forms_item2 = common_vendor.resolveComponent("uni-forms-item");
  const _easycom_uni_file_picker2 = common_vendor.resolveComponent("uni-file-picker");
  const _easycom_uni_forms2 = common_vendor.resolveComponent("uni-forms");
  (_easycom_uni_forms_item2 + _easycom_uni_file_picker2 + _easycom_uni_forms2)();
}
const _easycom_uni_forms_item = () => "../../../uni-forms/components/uni-forms-item/uni-forms-item.js";
const _easycom_uni_file_picker = () => "../../../uni-file-picker/components/uni-file-picker/uni-file-picker.js";
const _easycom_uni_forms = () => "../../../uni-forms/components/uni-forms/uni-forms.js";
if (!Math) {
  (_easycom_uni_forms_item + _easycom_uni_file_picker + _easycom_uni_forms)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.t($data.formData.reason || "请选择举报原因"),
    b: ["人身攻击", "违法违规", "广告", "错误信息"],
    c: common_vendor.o((e) => $data.formData.reason = ["人身攻击", "违法违规", "广告", "错误信息"][e.detail.value]),
    d: common_vendor.p({
      name: "content",
      label: "举报原因",
      required: true
    }),
    e: common_vendor.o([($event) => $data.formData.content = $event.detail.value, ($event) => _ctx.binddata("content", $event.detail.value)]),
    f: $data.formData.content,
    g: common_vendor.p({
      name: "content",
      label: "举报阐述",
      required: true
    }),
    h: common_vendor.o(($event) => $data.formData.imgs = $event),
    i: common_vendor.p({
      ["file-mediatype"]: "image",
      limit: 6,
      ["return-type"]: "array",
      modelValue: $data.formData.imgs
    }),
    j: common_vendor.p({
      name: "imgs",
      label: "说明图片"
    }),
    k: common_vendor.o((...args) => $options.submit && $options.submit(...args)),
    l: common_vendor.sr("form", "7bbcbaa3-0"),
    m: common_vendor.p({
      value: $data.formData,
      ["validate-trigger"]: "submit",
      ["err-show-type"]: "toast"
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
