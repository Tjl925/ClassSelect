<template>
  <view class="form-container">
    <form @submit.prevent="submitCourseInfo" class="form-content">
      <view class="form-item">
        <view class="row">
          <image class="icon" src="/static/list.png"></image>
          <text class="label">课程名：</text>
        </view>
        <input v-model="course.course_name" placeholder={{course_name}} required />
      </view>
      <view class="form-item">
        <view class="row">
          <image class="icon" src="/static/person.png"></image>
          <text class="label">授课老师：</text>
        </view>
        <input v-model="course.teacher_name" placeholder={{teacher_name}} required />
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
        <button @click="submitCourseInfo()" class="submit-btn">提交</button>
      </view>
      <view class="button-group">
        <button @longpress="deleteCourse()" class="delete-btn">长按以删除</button>
      </view>
    </form>
  </view>
</template>

<script>
  const db = uniCloud.database();
  export default {
    data() {
      return {
        course: {
          created_at: '',
          course_name: '',
          course_location: '',
          teacher_name: '',
          course_number: '',
          credit: '',
          _id: '',
          college: '',
        }

      }
    },
    methods: {
      deleteCourse() {
        uni.showModal({
          title: '确认删除',
          content: '确定要删除这门课程吗？',
          success: async (res) => {
            if (res.confirm) {
              try {
                uni.showLoading({
                  title: '删除中...',
                  mask: true
                });

                const result = await db.collection('course-info').doc(this._id).remove();
                console.log(result);

                if (result.result.deleted === 1) {
                  uni.showToast({
                    title: '删除成功',
                    icon: 'success'
                  });
                  // 删除成功后返回上一页
                  setTimeout(() => {
                    uni.switchTab({
                      url: "/pages/course/course"
                    });;
                  }, 2000);
                } else {
                  throw new Error('删除失败');
                }
              } catch (error) {
                console.error('删除课程失败:', error);
                uni.showToast({
                  title: error.message || '删除失败',
                  icon: 'none'
                });
              } finally {
                uni.hideLoading();
              }
            } else if (res.cancel) {
              console.log('用户取消删除');
            }
          }
        });
      },


      async fetchCourseDetails() {
        try {
          console.log(this._id);
          const result = await db.collection('course-info').doc(this._id).get();
          console.log(result);
          if (result.data.length) {
            const courseData = result.data[0];
            this.course = {
              course_name: courseData.course_name,
              course_location: courseData.course_location,
              teacher_name: courseData.teacher_name,
              course_number: courseData.course_number,
              college: courseData.college,
              credit: courseData.credit
            };
          } else {
            throw new Error('未找到课程信息');
          }
        } catch (error) {
          console.error('获取课程信息失败:', error);
          uni.showToast({
            title: '获取课程信息失败',
            icon: 'none'
          });
        }
      },

      async fetchCourseDetails() {
        try {
          const result = await db.collection('course-info').doc(this._id).get();
          console.log(result);
          // 检查 result.data 是否存在并且是数组
          if (result.result.data && Array.isArray(result.result.data) && result.result.data.length > 0) {
            const courseData = result.result.data[0];
            this.course = {
              course_name: courseData.course_name || '',
              course_location: courseData.course_location || '',
              teacher_name: courseData.teacher_name || '',
              course_number: courseData.course_number || '',
              college: courseData.college || '',
              credit: courseData.credit || ''
            };
          } else {
            throw new Error('未找到课程信息');
          }
        } catch (error) {
          console.error('获取课程信息失败:', error);
          uni.showToast({
            title: '获取课程信息失败',
            icon: 'none'
          });
        }
      },
      async submitCourseInfo() {
        try {
          uni.showLoading({
            title: '提交中...',
            mask: true
          });

          // 更新课程信息
          const result = await db.collection('course-info').doc(this._id).update({
            course_name: this.course.course_name,
            course_location: this.course.course_location,
            teacher_name: this.course.teacher_name,
            course_number: this.course.course_number,
            college: this.course.college,
            credit: this.course.credit
          });
          console.log(result);
          if (result.result.updated) {
            uni.showToast({
              title: '修改成功',
              icon: 'success'
            });
            // 修改成功后返回上一页
            setTimeout(() => {
              uni.navigateBack()
            }, 2000);
          } else {
            throw new Error('修改失败');
          }
        } catch (error) {
          console.error('提交课程信息失败:', error);
          uni.showToast({
            title: error.message || '提交失败',
            icon: 'none'
          });
        } finally {
          uni.hideLoading();
        }
      },

      navBack() {
        uni.navigateBack();
      }
    },

    onLoad(options) {
      this._id = options._id;

      uni.setNavigationBarTitle({
        title: '修改课程信息' // 替换为你的标题
      });

      this.fetchCourseDetails();
    }
  }
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

  .delete-btn {
    margin-top: 20px;
    width: 90%;
    padding: 10px;
    background-color: red;
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