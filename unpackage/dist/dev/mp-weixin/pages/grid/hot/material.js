"use strict";
const common_vendor = require("../../../common/vendor.js");
const statusBar = () => "../../../uni_modules/uni-nav-bar/components/uni-nav-bar/uni-status-bar.js";
const db = common_vendor.Vs.database();
const _sfc_main = {
  components: {
    statusBar
  },
  data() {
    return {
      materials: [],
      keyword: "",
      showRefresh: false,
      listHight: 0,
      pageSize: 8
    };
  },
  async onReady() {
    this.listHight = "auto";
  },
  async onShow() {
    this.getMaterials();
  },
  onReachBottom() {
    console.log(this.materials);
    if (this.materials.length > this.pageSize) {
      console.log("当前资料数量：" + this.materials.length);
      this.pageSize += 5;
    } else {
      common_vendor.index.showToast({
        title: "已加载全部记录",
        icon: "none"
      });
    }
  },
  methods: {
    displayRating(Rating) {
      if (!Rating) {
        return "待评分";
      } else {
        return Rating.toFixed(1);
      }
    },
    // 获取资料数据
    getMaterials() {
      common_vendor.index.showLoading({
        title: "加载中...",
        mask: true
      });
      let collectionQuery = db.collection("materials").where({
        average_rating: db.command.gt(3.9)
      }).orderBy("average_rating", "desc");
      collectionQuery.get().then(async (res) => {
        if (res.result.data && Array.isArray(res.result.data)) {
          console.log("资料信息", res);
          const materialsWithDetails = await Promise.all(
            res.result.data.map(async (material) => {
              const userInfo = await this.getUserInfo(material.creator_id);
              return {
                ...material,
                userInfo
              };
            })
          );
          this.materials = materialsWithDetails;
        } else {
          this.materials = [];
        }
      }).catch((error) => {
        console.error("获取资料数据失败:", error);
        common_vendor.index.showToast({
          title: "加载资料数据失败",
          icon: "none"
        });
      }).finally(() => {
        common_vendor.index.hideLoading();
      });
    },
    // 获取用户信息
    getUserInfo(userId) {
      return db.collection("uni-id-users").where({
        _id: userId
      }).field("nickname").get().then((res) => {
        if (res.result.data && res.result.data.length > 0) {
          const user = res.result.data[0];
          return {
            nickname: user.nickname || "匿名用户"
          };
        } else {
          return {
            nickname: "匿名用户"
          };
        }
      }).catch((error) => {
        console.error("获取用户信息失败:", error);
        return {
          nickname: "匿名用户"
        };
      });
    }
  }
};
if (!Array) {
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  (_easycom_uni_list_item2 + _easycom_uni_list2)();
}
const _easycom_uni_list_item = () => "../../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../../uni_modules/uni-list/components/uni-list/uni-list.js";
if (!Math) {
  (_easycom_uni_list_item + _easycom_uni_list)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.materials.slice(0, $data.pageSize), (item, index, i0) => {
      return {
        a: common_vendor.t(item.material_name),
        b: common_vendor.t(item.userInfo.nickname),
        c: common_vendor.t($options.displayRating(item.average_rating)),
        d: index,
        e: "aed80814-1-" + i0 + ",aed80814-0",
        f: common_vendor.p({
          to: "/pages/material/detail?id=" + item._id + "&title=" + item.material_name,
          direction: "row"
        })
      };
    }),
    b: common_vendor.p({
      border: "false"
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
