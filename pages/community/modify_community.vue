<template>
	<view class="form-container">
		<form @submit.prevent="submitPostInfo" class="form-content">
			<view class="form-item">
				<view class="row">
					<text class="label">贴子标题：</text>
				</view>
				<input v-model="post.title" placeholder="请输入标题" required />
			</view>
			<view class="form-item">
				<view class="row">
					<text class="label">内容：</text>
				</view>
				<input v-model="post.content" placeholder="请输入内容" required />
			</view>
			<template>
				<uni-forms-item name="imgs" label="图片列表">
					<uni-file-picker file-mediatype="image" :limit="1" return-type="array" v-model="post.imgs">
					</uni-file-picker>
				</uni-forms-item>
			</template>
			<view class="button-group">
				<button @click="navBack()" class="back-btn">返回</button>
				<button @click="submitPostInfo()" class="submit-btn">提交</button>
			</view>
			<view class="button-group">
				<button @longpress="deletePost()" class="delete-btn">长按以删除</button>
			</view>
		</form>
	</view>
</template>

<script>
	const db = uniCloud.database();
	import {
		store,
		mutations
	} from '@/uni_modules/uni-id-pages/common/store.js'

	import UniIdPagesAvatar from '@/uni_modules/uni-id-pages/components/uni-id-pages-avatar/uni-id-pages-avatar.vue'; // 请根据实际路径修改
	export default {
		data() {
			return {
				post: {
					"content": "",
					"imgs": [],
					"title": "",
					"user_id": "",
					"likes_count": 0,
					"ans_count": 0,
					"article_status": 1
				},
				CurrentAvatar_file: {
					extname: '',
					name: '',
					url: ''
				},

				width: '200px', // 设置按钮宽度
				height: '200px', // 设置按钮高度
				border: false, // 控制是否显示边框
			}
		},
		methods: {
			deletePost() {
				uni.showModal({
					title: '确认删除',
					content: '确定要删除这个贴子吗？',
					success: async (res) => {
						if (res.confirm) {
							try {
								uni.showLoading({
									title: '删除中...',
									mask: true
								});

								const result = await db.collection('community_post').doc(this.post._id)
									.remove();
								console.log(result);
								getApp().globalData.community_status = 0;
								if (result.result.deleted === 1) {
									uni.showToast({
										title: '删除成功',
										icon: 'success'
									});
									// 删除成功后返回上一页
									setTimeout(() => {
										uni.navigateBack({
											delta: 2
										});
									}, 2000);
								} else {
									throw new Error('删除失败');
								}
							} catch (error) {
								console.error('删除贴子失败:', error);
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

			async fetchPostDetails() {
				try {
					const result = await db.collection('community_post').doc(this.post._id).get();
					console.log(result);
					if (result.result.data && Array.isArray(result.result.data) && result.result.data.length > 0) {
						const postData = result.result.data[0];
						this.post.title = postData.title;
						this.post.content = postData.content;
						if (postData.imgs && postData.imgs[0] && postData.imgs[0].path) {
							this.post.imgs = postData.imgs;
						}
					} else {
						throw new Error('未找到贴子信息');
					}
				} catch (error) {
					console.error('获取贴子信息失败:', error);
					uni.showToast({
						title: '获取贴子信息失败',
						icon: 'none'
					});
				}
			},

			//不是路径的话可以先传入云，之后删去即可。
			async Mybindchooseavatar(res) {
				let avatarUrl = res.detail.avatarUrl
				let avatar_file = {
					extname: avatarUrl.split('.')[avatarUrl.split('.').length - 1],
					name: '',
					url: ''
				}

				//上传到服务器
				let cloudPath = store.userInfo._id + '' + Date.now()
				avatar_file.name = cloudPath
				try {
					uni.showLoading({
						title: "上传中",
						mask: true
					});
					let {
						fileID
					} = await uniCloud.uploadFile({
						filePath: avatarUrl,
						cloudPath: '/cloudstorage/community_image/' + cloudPath,
						fileType: "image",
						cloudPathAsRealPath: true,
						onUploadProgress: function(progressEvent) {
							console.log(progressEvent);
							var percentCompleted = Math.round(
								(progressEvent.loaded * 100) / progressEvent.total
							);
						}
					});
					avatar_file.url = fileID
					this.post.avatar_file.extname = avatar_file.extname
					this.post.avatar_file.name = avatar_file.name
					this.post.avatar_file.url = avatar_file.url
					console.log(fileID)
					uni.hideLoading()
				} catch (e) {
					console.error(e);
				}
				//this.setAvatarFile(avatar_file)
			},


			async submitPostInfo() {
				if (this.post.content.trim() === '') {
					uni.showToast({
						title: '内容不能为空',
						icon: 'none'
					});
					return;
				}
				if (this.post.title.trim() === '') {
					uni.showToast({
						title: '标题不能为空',
						icon: 'none'
					});
					return;
				}
				console.log(this.post.content);
				try {
					uni.showLoading({
						title: '提交中...',
						mask: true
					});

					// 更新贴子信息
					console.log(this.post._id);
					const result = await db.collection('community_post').doc(this.post._id).update({
						title: this.post.title,
						content: this.post.content,
						imgs: this.post.imgs,
					});
					console.log(result);
					if (result.result.updated) {
						uni.showToast({
							title: '修改成功',
							icon: 'success'
						});
						// 修改成功后返回上一页
						setTimeout(() => {
							uni.navigateBack();
						}, 2000);
					} else {
						throw new Error('修改失败');
					}
				} catch (error) {
					console.error('提交贴子信息失败:', error);
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
			this.post._id = options.postId; // 获取传递的贴子ID

			uni.setNavigationBarTitle({
				title: '修改贴子信息' // 替换为你的标题
			});

			this.fetchPostDetails();
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

	.box {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: none;
		background-color: #f8f8f8;
		outline: none;
		cursor: pointer;
		transition: background-color 0.3s, transform 0.3s;
		width: 80px;
		max-height: 80px;
		overflow: hidden;
	}

	.box:hover {
		background-color: #ebebeb;
	}

	.box:active {
		transform: translateY(2px);
	}

	.chooseAvatar {
		font-size: 18px;
	}

	.showBorder {
		border: solid 1px #ddd;
	}
</style>