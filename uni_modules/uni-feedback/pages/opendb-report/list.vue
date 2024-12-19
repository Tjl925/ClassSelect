<template>
  <view class="container">
    <unicloud-db ref="udb" v-slot:default="{data, pagination, loading, hasMore, error}" collection="reports"
      field="content,imgs,created_at,status,nickname,type" orderby="status">
      <view v-if="error">{{error.message}}</view>
      <view v-else-if="data">
        <uni-list>
          <uni-list-item v-for="(item, index) in data" :key="index" showArrow :clickable="true"
            @click="handleItemClick(item._id)">
            <template v-slot:body>
              <view style="display: flex;">
                <text class="contact-text">{{item.nickname}}</text>
                <text class="type-text">{{item.type}}</text>
                <view class="responded" v-if="item.status">已处理</view>
                <view class="unrespond" v-else>未处理</view>
              </view>
              <text class="time-text">{{formatDate(item.created_at)}}</text>
            </template>
          </uni-list-item>
        </uni-list>
      </view>
      <uni-load-more :status="loading?'loading':(hasMore ? 'more' : 'noMore')"></uni-load-more>
    </unicloud-db>
    <uni-fab ref="fab" horizontal="right" vertical="bottom" :pop-menu="false" @fabClick="fabClick" />
  </view>
</template>

<script>
  export default {
    data() {
      return {
        loadMore: {
          contentdown: '',
          contentrefresh: '',
          contentnomore: ''
        }
      }
    },
    onPullDownRefresh() {
      this.$refs.udb.loadData({
        clear: true
      }, () => {
        uni.stopPullDownRefresh()
      })
    },
    onReachBottom() {
      this.$refs.udb.loadMore()
    },
    methods: {
      formatDate(timestamp) {
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
        .getHours()
        .toString()
        .padStart(2, "0")}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
      },
      handleItemClick(id) {
        uni.navigateTo({
          url: './detail?id=' + id
        })
      },
      fabClick() {
        // 打开新增页面
        uni.navigateTo({
          url: './opendb-report',
          events: {
            // 监听新增数据成功后, 刷新当前页面数据
            refreshData: () => {
              this.$refs.udb.loadData({
                clear: true
              })
            }
          }
        })
      }
    }
  }
</script>

<style>
  .contact-text {
    margin-right: 40px;
  }

  .type-text {
    position: absolute;
    left: 42%;
  }

  .time-text {
    color: gray;
    font-size: 15px;
  }

  .responded {
    position: absolute;
    background-color: #1AAD19;
    border-radius: 8px;
    color: white;
    margin-top: 2px;
    padding-left: 5px;
    padding-right: 5px;
    padding-up: 1px;
    padding-bottom: 1px;
    font-size: 18px;
    left: 80%;
  }

  .unrespond {
    position: absolute;
    background-color: red;
    border-radius: 8px;
    color: white;
    margin-top: 2px;
    padding-left: 5px;
    padding-right: 5px;
    padding-up: 1px;
    padding-bottom: 1px;
    font-size: 18px;
    left: 80%;
  }
</style>