<template>
	<view class="form-container">
		<form @submit.prevent="submitAnsInfo" class="form-content">
			<view class="form-item">
				<view class="row">
					<text class="label">内容：</text>
				</view>
				<input v-model="ans.content" placeholder="请输入内容" required />
			</view>
			<view class="button-group">
				<button @click="navBack()" class="back-btn">返回</button>
				<button @click="submitAnsInfo()" class="submit-btn">提交</button>
			</view>
			<view class="button-group">
				<button @longpress="deleteAns()" class="delete-btn">长按以删除</button>
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
				ans: {
					_id: '',
					content: '',
					post_id: '',
				},
				ans_count: 0,
				width: '200px', // 设置按钮宽度
				height: '200px', // 设置按钮高度
				border: false, // 控制是否显示边框
			}
		},
		methods: {
			deleteAns() {
				uni.showModal({
					title: '确认删除',
					content: '确定要删除这个回复吗？',
					success: async (res) => {
						if (res.confirm) {
							try {
								uni.showLoading({
									title: '删除中...',
									mask: true
								});
								const result = await db.collection('community_ans').doc(this.ans._id).remove();
								console.log(result);
								if (result.result.deleted === 1) {
									this.ans_count -= 1;

									// 更新 community_post 表中的 ans_count
									await db.collection('community_post').doc(this.ans.post_id).update({
										ans_count: this.ans_count
									});
									console.log(this.ans_count);
									uni.navigateBack();
								} else {
									throw new Error('删除失败');
								}
							} catch (error) {
								console.error('删除回复失败:', error);
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
					// 首先查询回复信息
					const ansResult = await db.collection('community_ans').doc(this.ans._id).get();
					if (ansResult.result.data && Array.isArray(ansResult.result.data) && ansResult.result.data.length >
						0) {
						const ansData = ansResult.result.data[0];
						this.ans.content = ansData.content;
						this.ans.post_id = ansData.post_id; // 确保获取了 post_id
					} else {
						throw new Error('未找到回复信息');
					}
				} catch (error) {
					console.error('获取信息失败:', error);
					uni.showToast({
						title: '获取信息失败',
						icon: 'none'
					});
				}
			},
			async fetchCountDetails() {
				try {
					// 首先查询回复信息
					const ansResult = await db.collection('community_post').doc(this.ans.post_id).get();
					if (ansResult.result.data && Array.isArray(ansResult.result.data) && ansResult.result.data.length >
						0) {
						const ansData = ansResult.result.data[0];
						this.ans_count = ansData.ans_count; // 确保获取了 
					} else {
						throw new Error('未找到点赞信息');
					}
				} catch (error) {
					console.error('获取点赞信息失败:', error);
					uni.showToast({
						title: '获取点赞信息失败',
						icon: 'none'
					});
				}
			},

			async submitAnsInfo() {
				if (this.ans.content.trim() === '') {
					uni.showToast({
						title: '内容不能为空',
						icon: 'none'
					});
					return;
				}
				console.log(this.ans.content);
				try {
					uni.showLoading({
						title: '提交中...',
						mask: true
					});
					this.ans_count -= 1;
					// 更新回复信息
					console.log(this.ans._id);
					const result = await db.collection('community_ans').doc(this.ans._id).update({
						content: this.ans.content
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
					console.error('提交回复信息失败:', error);
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
			this.ans._id = options.replyId; // 获取传递的回复ID
			this.ans.post_id = options.post_id;

			uni.setNavigationBarTitle({
				title: '修改回复信息' // 替换为你的标题
			});

			this.fetchPostDetails().then(() => {
				this.fetchCountDetails();
			});
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