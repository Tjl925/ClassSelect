<template>
  <view class="pages">
    <view class="topbar">
      <view class="title">精选资料列表</view>
    </view>
    <view style="margin-top: 8%;overflow: hidden;">
      <uni-list border="false">
        <!-- 列表渲染 -->
        <uni-list-item :to="'/pages/material/detail?id='+item._id+'&title='+item.material_name"
          v-for="(item,index) in materials.slice(0,pageSize) " :key="index" direction="row">
          <template v-slot:body>
            <view class="course-card">
              <text class="course-name">{{item.material_name}}</text>
              <text class="teacher-name">{{item.userInfo.nickname}}</text>
              <text class="rating">{{ displayRating(item.average_rating )}}</text>
            </view>
          </template>
        </uni-list-item>
      </uni-list>
    </view>
  </view>
</template>

<script>
  let cdbRef;
  import statusBar from "@/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-status-bar";
  const db = uniCloud.database();

  export default {
    components: {
      statusBar
    },
    data() {
      return {
        materials: [],
        keyword: "",
        showRefresh: false,
        listHight: 0,
        pageSize: 8,
      }
    },
    async onReady() {
      // #ifdef APP-NVUE
      /* 可用窗口高度 - 搜索框高 - 状态栏高 */
      this.listHight = uni.getSystemInfoSync().windowHeight - uni.getSystemInfoSync().statusBarHeight - 50 + 'px';
      // #endif
      // #ifndef APP-NVUE
      this.listHight = 'auto'
      // #endif
    },
    async onShow() {
      this.getMaterials();
    },
    onReachBottom() {
      // 检查MyCourse的长度和当前页面大小
      console.log(this.materials);
      if (this.materials.length > this.pageSize) {
        console.log("当前资料数量：" + this.materials.length);
        // 如果MyCourse的数据量大于当前页面大小，增加页面大小
        this.pageSize += 5;
      } else {
        // 如果MyCourse的数据量不大于当前页面大小，提示已加载所有记录
        uni.showToast({
          title: '已加载全部记录',
          icon: 'none',
        });
      }
    },
    methods: {
      displayRating(Rating) {
        if (!Rating) {
          return '待评分';
        } else {
          return Rating.toFixed(1);
        }
      },
      // 获取资料数据
      getMaterials() {
        uni.showLoading({
          title: "加载中...",
          mask: true,
        });

        // 构建查询条件
        let collectionQuery = db.collection("materials").where({
          average_rating: db.command.gt(3.9)
        }).orderBy('average_rating', 'desc');
        // 获取资料数据
        collectionQuery
          .get()
          .then(async (res) => {
            if (res.result.data && Array.isArray(res.result.data)) {
              console.log('资料信息', res)
              // 并行获取每个资料的评分和用户信息
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
              this.materials = []; // 如果返回数据为空，则清空资料列表
            }
          })
          .catch((error) => {
            console.error("获取资料数据失败:", error);
            uni.showToast({
              title: "加载资料数据失败",
              icon: "none",
            });
          })
          .finally(() => {
            uni.hideLoading(); // 隐藏加载动画
          });
      },
      // 获取用户信息
      getUserInfo(userId) {
        return db.collection("uni-id-users").where({
            _id: userId
          })
          .field('nickname')
          .get()
          .then((res) => {
            if (res.result.data && res.result.data.length > 0) {
              const user = res.result.data[0];
              return {
                nickname: user.nickname || '匿名用户',
              };
            } else {
              return {
                nickname: '匿名用户',
              };
            }
          })
          .catch((error) => {
            console.error("获取用户信息失败:", error);
            return {
              nickname: '匿名用户',
            };
          });
      },
    }
  }
</script>

<style lang="scss">
  @import '@/common/uni-ui.scss';


  /* #ifndef APP-NVUE */
  view {
    display: flex;
    box-sizing: border-box;
    flex-direction: column;
  }

  /* #endif */
  page {
    min-height: 100%;
  }

  .course-card {
    display: flex;
    flex-direction: row;
    width: 100%;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
    padding: 25px;
  }

  .avatar {
    width: 10rpx;
    height: 10rpx;
  }

  .materialName {
    font-size: 10px;
    font-weight: bold;
  }

  .author {
    font-size: 10px;
    color: #999999;
  }

  .averageRating {
    font-size: 10px;
    font-weight: bold;
  }

  .load-state {
    justify-content: center;
    width: 750rpx;
  }

  .button-back {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: white;
    width: 25%;
    position: fixed;
    right: 1%;
    top: 10%;
    height: 50px;
    z-index: 999;
  }

  .create-button {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 6px;
    right: 2%;
    width: 70%;
    height: 34px;
    background-color: royalblue;
    color: #FFFFFF;
    font-weight: bold;
    border-radius: 5px;
    box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.1);
  }

  .course-name {
    font-weight: bold;
  }

  .teacher-name {
    position: absolute;
    right: 21%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    color: gray;
  }


  .teacher-icon {
    width: 20px;
    height: 20px;
    margin-top: 3px;
  }

  .rating {
    position: absolute;
    color: rgb(253, 131, 116);
    right: 6%;
  }

  .course-list {
    z-index: -1;
    display: flex;
    flex-direction: column;
    padding: 10px;
    gap: 15px;
    background-color: transparent;
  }

  .course-card {
    width: 100%;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
    padding: 25px;
    display: flex;
    flex-direction: row;
  }

  .course-title {
    font-size: 18px;
    font-weight: bold;
    color: #333333;
    margin-bottom: 10px;
  }

  .course-info text {
    line-height: 1.5;
  }

  .uni-search-box {
    background-color: #FFFFFF;
    position: sticky;
    height: 50px;
    top: 10%;
    left: 0;
    /* #ifndef APP-PLUS */
    z-index: 9;
    /* #endif */
    /* #ifdef MP-WEIXIN */
    width: 580rpx;
    /* #endif */
  }

  .cover-search-bar {
    height: 50px;
    position: relative;
    top: -50px;
    margin-bottom: -50px;
    /* #ifndef APP-NVUE */
    z-index: 999;
    /* #endif */
  }

  .load-state {
    justify-content: center;
    width: 750rpx;
  }

  .title {
    margin-top: 30px;
    text-align: center;
    font-size: 20px;
  }

  .topbar {
    width: 100%;
    background-color: white;
    height: 10%;
    z-index: 999;
  }

  .uni-list {
    background-color: transparent;
  }
</style>