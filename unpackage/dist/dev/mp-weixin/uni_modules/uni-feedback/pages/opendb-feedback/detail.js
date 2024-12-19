"use strict";
const common_vendor = require("../../../../common/vendor.js");
const uni_modules_uniFeedback_js_sdk_validator_opendbFeedback = require("../../js_sdk/validator/opendb-feedback.js");
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
      options: {
        // 将scheme enum 属性静态数据中的value转成text
        ...uni_modules_uniFeedback_js_sdk_validator_opendbFeedback.enumConverter
      }
    };
  },
  onLoad(e) {
    this._id = e.id;
  },
  onReady() {
    if (this._id) {
      this.queryWhere = '_id=="' + this._id + '"';
    }
  },
  methods: {
    handleConfirm() {
      common_vendor.index.showModal({
        title: "确认回复",
        content: `您确认已回复该反馈吗？`,
        success: (modalRes) => {
          if (modalRes.confirm) {
            const dbCollection = db.collection("opendb-feedback");
            dbCollection.where({
              _id: this._id
            }).update({
              status: 1
            }).then(() => {
              common_vendor.index.showToast({
                title: `确认成功！`,
                icon: "success"
              });
              setTimeout(() => {
                common_vendor.index.redirectTo({
                  url: "./list"
                });
              }, 2e3);
            }).catch((err) => {
              console.error("确认失败:", err);
              common_vendor.index.showToast({
                title: "确认失败！，请稍后再试",
                icon: "none"
              });
            });
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
        }
      });
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
        d: "0dc95cc6-1-" + i0 + ",0dc95cc6-0",
        e: common_vendor.p({
          contentText: $data.loadMore,
          status: "loading"
        })
      } : data ? {
        g: common_vendor.t(data.content),
        h: common_vendor.t(data.created_at),
        i: common_vendor.f(data.imgs, (file, j, i1) => {
          return {
            a: file.path
          };
        }),
        j: common_vendor.t(data.contact),
        k: common_vendor.t(data.mobile)
      } : {}, {
        c: loading,
        f: data,
        l: i0,
        m: s0
      });
    }, {
      name: "d",
      path: "a",
      vueId: "0dc95cc6-0"
    }),
    b: common_vendor.sr("udb", "0dc95cc6-0"),
    c: common_vendor.p({
      options: $data.options,
      collection: "opendb-feedback",
      field: "content,imgs,contact,mobile,created_at",
      where: $data.queryWhere,
      getone: true,
      manual: true
    }),
    d: common_vendor.o((...args) => $options.handleConfirm && $options.handleConfirm(...args)),
    e: common_vendor.o((...args) => $options.handleDelete && $options.handleDelete(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
