"use strict";
const common_vendor = require("../../common/vendor.js");
const uni_modules_uniIdPages_common_store = require("../../uni_modules/uni-id-pages/common/store.js");
const common_assets = require("../../common/assets.js");
common_vendor.Vs.importObject("uni-id-co");
common_vendor.Vs.database();
const _sfc_main = {
  data() {
    return {
      gridList: [],
      current: 0,
      hasLogin: false
    };
  },
  computed: {
    userInfo() {
      return uni_modules_uniIdPages_common_store.store.userInfo;
    }
  },
  onShow() {
    this.hasLogin = common_vendor.Vs.getCurrentUserInfo().tokenExpired > Date.now();
  },
  onLoad() {
    let gridList = [];
    gridList.push({
      index: 1,
      title: "课程",
      route: "/pages/course/course"
    });
    gridList.push({
      index: 2,
      title: "资料",
      route: "/pages/material/material"
    });
    gridList.push({
      index: 3,
      title: "帖子",
      route: "/pages/community/community"
    });
    gridList.push({
      index: 4,
      title: "高分课程",
      route: "/pages/grid/hot/course"
    });
    gridList.push({
      index: 5,
      title: "精选资料",
      route: "/pages/grid/hot/material"
    });
    gridList.push({
      index: 6,
      title: "热门话题",
      route: "/pages/grid/hot/post"
    });
    gridList.push({
      index: 7,
      title: "管理发布",
      route: "/pages/grid/manage/manageUploaded"
    });
    gridList.push({
      index: 8,
      title: "查看反馈",
      route: "/uni_modules/uni-feedback/pages/opendb-feedback/list"
    });
    gridList.push({
      index: 9,
      title: "管理举报",
      route: "/uni_modules/uni-feedback/pages/opendb-report/list"
    });
    this.gridList = gridList;
  },
  methods: {
    checkadmin() {
      console.log(this.userInfo);
      if (this.userInfo.user_role == "admin") {
        return 1;
      } else {
        return 0;
      }
    },
    change(route, index) {
      console.log(route);
      if (index < 4) {
        common_vendor.index.switchTab({
          url: route
        });
      } else {
        common_vendor.index.navigateTo({
          url: route
        });
      }
    },
    /**
     * banner加载后触发的回调
     */
    onqueryload(data) {
    },
    changeSwiper(e) {
      this.current = e.detail.current;
    },
    /**
     * 点击banner的处理
     */
    clickBannerItem(item) {
    }
  }
};
if (!Array) {
  const _easycom_unicloud_db2 = common_vendor.resolveComponent("unicloud-db");
  const _easycom_uni_grid_item2 = common_vendor.resolveComponent("uni-grid-item");
  const _easycom_uni_grid2 = common_vendor.resolveComponent("uni-grid");
  (_easycom_unicloud_db2 + _easycom_uni_grid_item2 + _easycom_uni_grid2)();
}
const _easycom_unicloud_db = () => "../../node-modules/@dcloudio/uni-components/lib/unicloud-db/unicloud-db.js";
const _easycom_uni_grid_item = () => "../../uni_modules/uni-grid/components/uni-grid-item/uni-grid-item.js";
const _easycom_uni_grid = () => "../../uni_modules/uni-grid/components/uni-grid/uni-grid.js";
if (!Math) {
  (_easycom_unicloud_db + _easycom_uni_grid_item + _easycom_uni_grid)();
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
        a: !(loading || data.length)
      }, !(loading || data.length) ? {
        b: common_assets._imports_0
      } : {
        c: common_vendor.f(data, (item, index, i1) => {
          return {
            a: item.bannerfile.url,
            b: common_vendor.o(($event) => $options.clickBannerItem(item), item._id),
            c: item._id
          };
        }),
        d: common_vendor.o((...args) => $options.changeSwiper && $options.changeSwiper(...args)),
        e: $data.current
      }, {
        f: i0,
        g: s0
      });
    }, {
      name: "d",
      path: "a",
      vueId: "7eb73d13-0"
    }),
    b: common_vendor.sr("bannerdb", "7eb73d13-0"),
    c: common_vendor.o($options.onqueryload),
    d: common_vendor.p({
      collection: "opendb-banner",
      field: "_id,bannerfile,open_url,title"
    }),
    e: common_vendor.f($data.gridList, (item, i, i0) => {
      return common_vendor.e({
        a: i < 6 || i > 5 && $options.checkadmin()
      }, i < 6 || i > 5 && $options.checkadmin() ? {
        b: "/static/grid/c" + (i + 1) + ".png",
        c: common_vendor.o(($event) => $options.change(item.route, i + 1)),
        d: common_vendor.t(item.title),
        e: i,
        f: "7eb73d13-2-" + i0 + ",7eb73d13-1",
        g: common_vendor.p({
          index: i
        })
      } : {});
    }),
    f: common_vendor.p({
      column: 3,
      highlight: true,
      showBorder: "false"
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
