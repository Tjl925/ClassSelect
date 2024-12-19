"use strict";const e=require("../../../../common/vendor.js"),o=require("../../js_sdk/validator/opendb-feedback.js"),t=e.Zs.database(),n={data:()=>({queryWhere:"",loadMore:{contentdown:"",contentrefresh:"",contentnomore:""},options:{...o.enumConverter}}),onLoad(e){this._id=e.id},onReady(){this._id&&(this.queryWhere='_id=="'+this._id+'"')},methods:{handleConfirm(){e.index.showModal({title:"确认回复",content:"您确认已回复该反馈吗？",success:o=>{if(o.confirm){t.collection("opendb-feedback").where({_id:this._id}).update({status:1}).then((()=>{e.index.showToast({title:"确认成功！",icon:"success"}),setTimeout((()=>{e.index.redirectTo({url:"./list"})}),2e3)})).catch((o=>{console.error("确认失败:",o),e.index.showToast({title:"确认失败！，请稍后再试",icon:"none"})}))}else console.log("用户取消确认")}})},handleDelete(){this.$refs.udb.remove(this._id,{success:o=>{e.index.navigateTo({url:"./list"})}})}}};if(!Array){(e.resolveComponent("uni-load-more")+e.resolveComponent("unicloud-db"))()}Math||((()=>"../../../uni-load-more/components/uni-load-more/uni-load-more.js")+(()=>"../../../../node-modules/@dcloudio/uni-components/lib/unicloud-db/unicloud-db.js"))();const d=e._export_sfc(n,[["render",function(o,t,n,d,i,s){return{a:e.w((({data:o,loading:t,error:n,options:d},s,a)=>e.e({a:n},n?{b:e.t(n.message)}:t?{d:"3b4f9f41-1-"+a+",3b4f9f41-0",e:e.p({contentText:i.loadMore,status:"loading"})}:o?{g:e.t(o.content),h:e.t(o.created_at),i:e.f(o.imgs,((e,o,t)=>({a:e.path}))),j:e.t(o.contact),k:e.t(o.mobile)}:{},{c:t,f:o,l:a,m:s})),{name:"d",path:"a",vueId:"3b4f9f41-0"}),b:e.sr("udb","3b4f9f41-0"),c:e.p({options:i.options,collection:"opendb-feedback",field:"content,imgs,contact,mobile,created_at",where:i.queryWhere,getone:!0,manual:!0}),d:e.o(((...e)=>s.handleConfirm&&s.handleConfirm(...e))),e:e.o(((...e)=>s.handleDelete&&s.handleDelete(...e)))}}]]);wx.createPage(d);
