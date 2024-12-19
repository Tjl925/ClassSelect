<template>
  <view class="warp">
    <!-- #ifdef APP -->
    <statusBar></statusBar>
    <!-- #endif -->

    <!-- banner -->
    <unicloud-db ref="bannerdb" v-slot:default="{data, loading, error, options}" collection="opendb-banner"
      field="_id,bannerfile,open_url,title" @load="onqueryload">
      <!-- 当无banner数据时显示占位图 -->
      <image v-if="!(loading||data.length)" class="banner-image" src="/static/uni-center/headers.png" mode="aspectFill"
        :draggable="false" />

      <swiper v-else class="swiper-box" @change="changeSwiper" :current="current" indicator-dots :autoplay="true"
        :interval="3500" :circular="true" :duration="500">
        <swiper-item v-for="(item, index) in data" :key="item._id">
          <image class="banner-image" :src="item.bannerfile.url" mode="aspectFill" @click="clickBannerItem(item)"
            :draggable="false" />
        </swiper-item>
      </swiper>
    </unicloud-db>

    <!-- 宫格 -->
    <view class="section-box">
      <text class="decoration"></text>
      <text class="section-text">功能列表</text>
    </view>

    <view class="example-body">
      <uni-grid :column="3" :highlight="true" showBorder="false">
        <template v-for="(item,i) in gridList">
          <uni-grid-item :index="i" :key="i" v-if="i<6  || i>5&&checkadmin()" style="border: 0;">
            <view class="grid-item-box" style="background-color: #fff;">
              <image :src="'/static/grid/c'+(i+1)+'.png'" class="image" mode="aspectFill"
                @click="change(item.route,i+1)" />
              <text class="text">{{item.title}}</text>
            </view>
          </uni-grid-item>
        </template>
      </uni-grid>
    </view>
  </view>
</template>

<script>
  const uniIdCo = uniCloud.importObject("uni-id-co");
  const db = uniCloud.database();
  import statusBar from "@/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-status-bar";
  import {
    store
  } from '@/uni_modules/uni-id-pages/common/store.js';
  export default {
    // #ifdef APP
    components: {
      statusBar
    },
    // #endif
    data() {
      return {
        gridList: [],
        current: 0,
        hasLogin: false,
      }
    },
    computed: {
      userInfo() {
        return store.userInfo;
      }
    },
    onShow() {
      this.hasLogin = uniCloud.getCurrentUserInfo().tokenExpired > Date.now()
    },
    onLoad() {
      let gridList = []
      gridList.push({
        index: 1,
        title: '课程',
        route: "/pages/course/course"
      });
      gridList.push({
        index: 2,
        title: '资料',
        route: "/pages/material/material"
      });
      gridList.push({
        index: 3,
        title: '帖子',
        route: "/pages/community/community"
      });
      gridList.push({
        index: 4,
        title: '高分课程',
        route: "/pages/grid/hot/course"
      });
      gridList.push({
        index: 5,
        title: '精选资料',
        route: "/pages/grid/hot/material"
      });
      gridList.push({
        index: 6,
        title: '热门话题',
        route: "/pages/grid/hot/post"
      });
      gridList.push({
        index: 7,
        title: '管理发布',
        route: "/pages/grid/manage/manageUploaded"
      });
      gridList.push({
        index: 8,
        title: '查看反馈',
        route: "/uni_modules/uni-feedback/pages/opendb-feedback/list"
      });
      gridList.push({
        index: 9,
        title: '管理举报',
        route: "/uni_modules/uni-feedback/pages/opendb-report/list"
      });
      this.gridList = gridList
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
          uni.switchTab({
            url: route,
          });
        } else {
          uni.navigateTo({
            url: route,
          });
        }
      },
      /**
       * banner加载后触发的回调
       */
      onqueryload(data) {},
      changeSwiper(e) {
        this.current = e.detail.current
      },
      /**
       * 点击banner的处理
       */
      clickBannerItem(item) {
        // 有外部链接-跳转url
      }
    }
  }
</script>

<style>
  /* #ifndef APP-NVUE */
  page {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    background-color: #fff;
    min-height: 100%;
    height: auto;
  }

  view {
    font-size: 14px;
    line-height: inherit;
  }

  .example-body {
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    padding: 0;
    font-size: 14px;
    background-color: #ffffff;
  }

  /* #endif */

  .section-box {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 20rpx;
  }

  .decoration {
    width: 4px;
    height: 12px;
    border-radius: 10px;
    background-color: #2979ff;
  }

  .section-text {
    color: #333;
    margin-left: 15rpx;
  }

  /* #ifdef APP-NVUE */
  .warp {
    background-color: #fff;
  }

  /* #endif */

  .example-body {
    flex-direction: column;
    padding: 15px;
    background-color: white;
  }

  .image {
    width: 80rpx;
    height: 80rpx;
  }

  .text {
    text-align: center;
    font-size: 26rpx;
    margin-top: 10rpx;
  }

  .example-body {
    /* #ifndef APP-NVUE */
    display: flexbox;
    border-radius: 10px;
    /* #endif */
  }

  .grid-item-box {

    box-shadow: 2px 4px 5px rgba(0, 0, 0, 0.2);
    flex: 1;
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    border-width: 2px;
    border-radius: 15px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px;
    margin: 5px;
  }

  .banner-image {
    margin-left: auto;
    margin-right: auto;
    width: 100%;
    height: 400rpx;
    border-radius: 15px;
  }

  .swiper-box {
    margin-left: auto;
    margin-right: auto;
    width: 95%;
    height: 400rpx;
    border-radius: 15px;
  }

  .search-icons {
    padding: 16rpx;
  }

  .search-container-bar {
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    flex-direction: row;
    justify-content: center;
    align-items: center;
    position: fixed;
    left: 0;
    right: 0;
    z-index: 10;
    background-color: #fff;
  }

  /* #ifndef APP-NVUE || VUE3*/
  ::v-deep

  /* #endif */
  .uni-searchbar__box {
    border-width: 0;
  }

  /* #ifndef APP-NVUE || VUE3 */
  ::v-deep

  /* #endif */
  .uni-input-placeholder {
    font-size: 28rpx;
  }
</style>