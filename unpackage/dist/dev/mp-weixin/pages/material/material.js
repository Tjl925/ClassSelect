"use strict";
const common_vendor = require("../../common/vendor.js");
const statusBar = () => "../../uni_modules/uni-nav-bar/components/uni-nav-bar/uni-status-bar.js";
const db = common_vendor.Vs.database();
const _sfc_main = {
  components: {
    statusBar
  },
  computed: {
    inputPlaceholder(e) {
      if (common_vendor.index.getStorageSync("CURRENT_LANG") == "en") {
        return "Please enter the search content";
      } else {
        return "请输入搜索内容";
      }
    }
  },
  data() {
    return {
      materials: [],
      where: '"article_status" == 1',
      keyword: "",
      showRefresh: false,
      listHight: 0,
      pageSize: 8
    };
  },
  watch: {
    keyword(keyword, oldValue) {
      let where = '"article_status" == 1 ';
      if (keyword) {
        this.where = where + `&& /${keyword}/.test(material_name)`;
      } else {
        this.where = where;
      }
    }
  },
  async onReady() {
    this.listHight = "auto";
  },
  async onShow() {
    this.keyword = getApp().globalData.searchText;
    getApp().globalData.searchText = "";
    this.getMaterials();
  },
  onReachBottom() {
    console.log(this.materials);
    if (this.materials.length > this.pageSize) {
      console.log("当前课程数量：" + this.materials.length);
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
    toCreate() {
      common_vendor.index.navigateTo({
        url: "/pages/material/create_material/create_material"
      });
    },
    // 获取资料数据
    getMaterials() {
      common_vendor.index.showLoading({
        title: "加载中...",
        mask: true
      });
      let collectionQuery = db.collection("materials");
      if (this.keyword.trim()) {
        const keyword = this.keyword.trim();
        collectionQuery = collectionQuery.where(
          db.command.or([
            {
              "material_name": new RegExp(keyword, "i")
            },
            // 匹配资料名
            {
              "course_name": new RegExp(keyword, "i")
            }
            // 匹配课程名
          ])
        );
      }
      collectionQuery.get().then(async (res) => {
        if (res.result.data && Array.isArray(res.result.data)) {
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
    },
    searchClick(e) {
      common_vendor.index.hideKeyboard();
      common_vendor.index.navigateTo({
        url: "/pages/material/search/search",
        animationType: "fade-in"
      });
    }
  }
};
if (!Array) {
  const _easycom_uni_search_bar2 = common_vendor.resolveComponent("uni-search-bar");
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  (_easycom_uni_search_bar2 + _easycom_uni_list_item2 + _easycom_uni_list2)();
}
const _easycom_uni_search_bar = () => "../../uni_modules/uni-search-bar/components/uni-search-bar/uni-search-bar.js";
const _easycom_uni_list_item = () => "../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../uni_modules/uni-list/components/uni-list/uni-list.js";
if (!Math) {
  (_easycom_uni_search_bar + _easycom_uni_list_item + _easycom_uni_list)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.sr("searchBar", "42c4727e-0"),
    b: common_vendor.o(($event) => $data.keyword = $event),
    c: common_vendor.p({
      radius: "100",
      cancelButton: "none",
      disabled: true,
      placeholder: $options.inputPlaceholder,
      modelValue: $data.keyword
    }),
    d: common_vendor.o((...args) => $options.searchClick && $options.searchClick(...args)),
    e: common_vendor.f($data.materials.slice(0, $data.pageSize), (item, index, i0) => {
      return {
        a: common_vendor.t(item.material_name),
        b: common_vendor.t(item.userInfo.nickname),
        c: common_vendor.t($options.displayRating(item.average_rating)),
        d: index,
        e: "42c4727e-2-" + i0 + ",42c4727e-1",
        f: common_vendor.p({
          to: "/pages/material/detail?id=" + item._id + "&title=" + item.material_name,
          direction: "row"
        })
      };
    }),
    f: $data.listHight,
    g: common_vendor.p({
      border: true
    }),
    h: common_vendor.o((...args) => $options.toCreate && $options.toCreate(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-42c4727e"]]);
wx.createPage(MiniProgramPage);
