<template>
  <view class="form-container">
    <form @submit.prevent="submitCourseInfo" class="form-content">
      <view class="form-item">
        <view class="row">
          <image class="icon" src="/static/list.png"></image>
          <text class="label">课程名：</text>
        </view>
        <input v-model="course.course_name" placeholder="请输入课程名" required />
      </view>
      <view class="form-item">
        <view class="row">
          <image class="icon" src="/static/person.png"></image>
          <text class="label">授课老师：</text>
        </view>
        <input v-model="course.teacher_name" placeholder="请输入授课老师" required />
      </view>
      <view class="form-item">
        <view class="row">
          <image class="icon" src="/static/credit.png"></image>
          <text class="label">学分：</text>
        </view>
        <input v-model="course.credit" placeholder="请输入课程学分" required />
      </view>
      <view class="form-item">
        <view class="row">
          <image class="icon" src="/static/college.png"></image>
          <text class="label">开课学院：</text>
        </view>
        <input v-model="course.college" placeholder="请输入开课学院" required />
      </view>
      <view class="form-item">
        <view class="row">
          <image class="icon" src="/static/location.png"></image>
          <text class="label">开课校区：</text>
        </view>
        <picker mode="selector" :range="['江安', '望江', '华西']"
          @change="(e) => course.course_location = ['江安', '望江', '华西'][e.detail.value]">
          <view class="picker">
            {{ course.course_location || '请选择开课校区' }}
          </view>
        </picker>
      </view>
      <view class="form-item">
        <view class="row">
          <image class="icon" src="/static/number.png"></image>
          <text class="label">课程号：</text>
        </view>
        <input v-model="course.course_number" placeholder="请输入课程号" required />
      </view>
      <view class="button-group">
        <button @click="navBack()" class="back-btn">返回</button>
        <button form-type="submit" class="submit-btn">提交</button>
      </view>
    </form>
  </view>
</template>

<script>
  const uniIdCo = uniCloud.importObject("uni-id-co");
  const db = uniCloud.database();
  import {
    store
  } from '@/uni_modules/uni-id-pages/common/store.js';

  export default {
    data() {
      return {
        course: {
          course_name: '',
          course_location: '',
          teacher_name: '',
          course_number: '',
          college: '',
          credit: ''
        }
      };
    },
    computed: {
      userInfo() {
        return store.userInfo;
      }
    },
    onLoad() {
      uni.setNavigationBarTitle({
        title: '上传课程信息' // 替换为你的标题
      });
    },
    methods: {
      navBack() {
        uni.navigateBack();
      },
      async submitCourseInfo() {
        try {
          uni.showLoading({
            title: '提交中...',
            mask: true
          });

          // 获取当前用户ID

          // 合并课程信息与创建者ID
          const courseData = {
            creator_id: this.userInfo._id,
            created_at: new Date().toISOString(),
            course_name: this.course.course_name,
            course_location: this.course.course_location,
            teacher_name: this.course.teacher_name,
            course_number: this.course.course_number,
            credit: this.course.credit,
            college: this.course.college
          };

          // 调用数据库操作创建新课程
          const result = await db.collection('course-info').add(courseData);

          if (result.id) {
            uni.showToast({
              title: '创建成功',
              icon: 'success'
            });
            // 清空表单数据
            this.course = {
              course_name: '',
              course_location: '',
              teacher_name: '',
              course_number: ''
            };

          } else {
            throw new Error('创建成功');
          }
        } catch (error) {
          console.error('提交课程信息失败:', error);
          uni.showToast({
            title: error.message || '提交失败',
            icon: 'none'
          });
        } finally {
          uni.hideLoading();
          setTimeout(() => {
            uni.switchTab({
              url: "/pages/community/community"
            })
          }, 2500);
        }
      }
    }
  };
</script>

<style scoped>
  .form-container {
    padding: 20px;
    margin-left: auto;
    margin-right: auto;
  }

  .form-item {
    margin-bottom: 20px;
    margin-left: auto;
    margin-right: auto;
  }

  .form-content {
    margin: auto;
  }

  .row {
    display: flex;
    /* 使用 Flex 布局 */
    align-items: center;
    /* 垂直方向居中 */
  }

  .icon {
    width: 30px;
    height: 30px;
    margin-right: 5px;
    margin-bottom: 5px;
    /* 调整图标与文字的间距 */
  }

  .label {
    margin-bottom: 5px;
    font-weight: bold;
  }

  input {
    width: 90%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
  }

  .submit-btn {
    width: 40%;
    padding: 10px;
    background-color: #007aff;
    color: white;
    border: none;
    border-radius: 5px;
    text-align: center;
  }

  .back-btn {
    width: 40%;
    padding: 10px;
    background-color: white;
    color: #007aff;
    border: none;
    border-radius: 5px;
    text-align: center;
  }

  .button-group {
    display: flex;
    flex-direction: row;
  }

  .picker {
    width: 90%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
  }
</style>