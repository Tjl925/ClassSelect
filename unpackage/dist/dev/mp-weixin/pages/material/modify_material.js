"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const db = common_vendor.Vs.database();
const _sfc_main = {
  data() {
    return {
      material: {
        created_at: "",
        material_name: "",
        _id: "",
        category: "",
        course_name: "",
        material_image: [],
        download_link: ""
      }
    };
  },
  methods: {
    deleteMaterial() {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这个资料吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              common_vendor.index.showLoading({
                title: "删除中...",
                mask: true
              });
              const result = await db.collection("materials").doc(this._id).remove();
              console.log(result);
              if (result.result.deleted === 1) {
                common_vendor.index.showToast({
                  title: "删除成功",
                  icon: "success"
                });
                setTimeout(() => {
                  common_vendor.index.switchTab({
                    url: "/pages/material/material"
                  });
                }, 2e3);
              } else {
                throw new Error("删除失败");
              }
            } catch (error) {
              console.error("删除资料失败:", error);
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
    async fetchMaterialDetails() {
      try {
        const result = await db.collection("materials").doc(this._id).get();
        console.log(result);
        if (result.result.data && Array.isArray(result.result.data) && result.result.data.length > 0) {
          const materialData = result.result.data[0];
          this.material = {
            material_name: materialData.material_name || "",
            category: materialData.category || "",
            course_name: materialData.course_name || "",
            material_image: materialData.material_image || [],
            download_link: materialData.download_link || ""
          };
        } else {
          throw new Error("未找到资料信息");
        }
      } catch (error) {
        console.error("获取资料信息失败:", error);
        common_vendor.index.showToast({
          title: "获取资料信息失败",
          icon: "none"
        });
      }
    },
    async submitMaterialInfo() {
      try {
        common_vendor.index.showLoading({
          title: "提交中...",
          mask: true
        });
        const result = await db.collection("materials").doc(this._id).update({
          material_image: this.material.material_image,
          material_name: this.material.material_name,
          category: this.material.category,
          course_name: this.material.course_name,
          download_link: this.material.download_link
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
        console.error("提交资料信息失败:", error);
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
    this._id = options._id;
    common_vendor.index.setNavigationBarTitle({
      title: "修改资料信息"
      // 替换为你的标题
    });
    this.fetchMaterialDetails();
  }
};
if (!Array) {
  const _easycom_uni_file_picker2 = common_vendor.resolveComponent("uni-file-picker");
  const _easycom_uni_forms_item2 = common_vendor.resolveComponent("uni-forms-item");
  (_easycom_uni_file_picker2 + _easycom_uni_forms_item2)();
}
const _easycom_uni_file_picker = () => "../../uni_modules/uni-file-picker/components/uni-file-picker/uni-file-picker.js";
const _easycom_uni_forms_item = () => "../../uni_modules/uni-forms/components/uni-forms-item/uni-forms-item.js";
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
      label: "资料图片(可选)"
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
    r: common_vendor.o(($event) => $options.submitMaterialInfo()),
    s: common_vendor.o(($event) => $options.deleteMaterial()),
    t: common_vendor.o((...args) => $options.submitMaterialInfo && $options.submitMaterialInfo(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-f8d8b9f9"]]);
wx.createPage(MiniProgramPage);
