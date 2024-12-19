"use strict";
const common_vendor = require("../../../common/vendor.js");
const uni_modules_uniIdPages_common_store = require("../../../uni_modules/uni-id-pages/common/store.js");
const common_assets = require("../../../common/assets.js");
common_vendor.Vs.importObject("uni-id-co");
const db = common_vendor.Vs.database();
const _sfc_main = {
  data() {
    return {
      material: {
        material_name: "",
        course_name: "",
        category: "",
        material_image: [],
        download_link: "",
        article_status: 1
      }
    };
  },
  computed: {
    userInfo() {
      return uni_modules_uniIdPages_common_store.store.userInfo;
    }
  },
  onLoad() {
    common_vendor.index.setNavigationBarTitle({
      title: "上传资料信息"
      // 替换为你的标题
    });
  },
  methods: {
    navBack() {
      common_vendor.index.navigateBack();
    },
    async submitMaterialInfo() {
      try {
        common_vendor.index.showLoading({
          title: "提交中...",
          mask: true
        });
        const materialData = {
          creator_id: this.userInfo._id,
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          material_name: this.material.material_name,
          course_name: this.material.course_name,
          category: this.material.category,
          material_image: this.material.material_image,
          download_link: this.material.download_link,
          article_status: 1
        };
        const result = await db.collection("materials").add(materialData);
        if (result.result.id) {
          common_vendor.index.showToast({
            title: "创建成功",
            icon: "success"
          });
          this.material = {
            material_name: "",
            course_name: "",
            category: "",
            material_image: [],
            download_link: ""
          };
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 2e3);
        } else {
          throw new Error("创建成功");
        }
      } catch (error) {
        console.error("提交资料信息失败:", error);
        common_vendor.index.showToast({
          title: error.message || "提交失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
        setTimeout(() => {
          common_vendor.index.switchTab({
            url: "/pages/material/material"
          });
        }, 2500);
      }
    }
  }
};
if (!Array) {
  const _easycom_uni_file_picker2 = common_vendor.resolveComponent("uni-file-picker");
  const _easycom_uni_forms_item2 = common_vendor.resolveComponent("uni-forms-item");
  (_easycom_uni_file_picker2 + _easycom_uni_forms_item2)();
}
const _easycom_uni_file_picker = () => "../../../uni_modules/uni-file-picker/components/uni-file-picker/uni-file-picker.js";
const _easycom_uni_forms_item = () => "../../../uni_modules/uni-forms/components/uni-forms-item/uni-forms-item.js";
if (!Math) {
  (_easycom_uni_file_picker + _easycom_uni_forms_item)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.o(($event) => $data.material.material_image = $event),
    b: common_vendor.p({
      ["file-mediatype"]: "image",
      limit: 1,
      ["return-type"]: "array",
      modelValue: $data.material.material_image
    }),
    c: common_vendor.p({
      name: "imgs",
      label: "(可选)"
    }),
    d: common_assets._imports_0$2,
    e: $data.material.material_name,
    f: common_vendor.o(($event) => $data.material.material_name = $event.detail.value),
    g: common_assets._imports_1$3,
    h: common_vendor.t($data.material.category || "请选择资料类别"),
    i: ["其他", "各类表单", "实验报告", "往年试卷", "竞赛", "考研", "课件", "课后答案", "软件", "重点总结"],
    j: common_vendor.o((e) => $data.material.category = ["其他", "各类表单", "实验报告", "往年试卷", "竞赛", "考研", "课件", "课后答案", "软件", "重点总结"][e.detail.value]),
    k: common_assets._imports_2$1,
    l: $data.material.course_name,
    m: common_vendor.o(($event) => $data.material.course_name = $event.detail.value),
    n: common_assets._imports_3,
    o: $data.material.download_link,
    p: common_vendor.o(($event) => $data.material.download_link = $event.detail.value),
    q: common_vendor.o(($event) => $options.navBack()),
    r: common_vendor.o((...args) => $options.submitMaterialInfo && $options.submitMaterialInfo(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-a07c9e71"]]);
wx.createPage(MiniProgramPage);
