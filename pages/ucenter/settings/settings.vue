<template>
	<view class="content">
		<!-- 功能列表 -->
		<uni-list class="mt10" :border="false">
			<uni-list-item title="个人信息" to="/uni_modules/uni-id-pages/pages/userinfo/userinfo" link="navigateTo"></uni-list-item>
			<uni-list-item v-if="userInfo.mobile" title="修改密码" :to="'/pages/ucenter/login-page/pwd-retrieve/pwd-retrieve?phoneNumber='+ userInfo.mobile" link="navigateTo"></uni-list-item>
		   <button @click="openDebugPage" class="debug-btn clear-btn">数据库调试</button>
		</uni-list>
		<uni-list class="mt10" :border="false">
		<!-- #ifndef H5 -->
			<!-- #ifdef APP-PLUS -->
			<!-- 检查push过程未结束不显示，push设置项 -->
			<uni-list-item title="清除缓存" @click="clearTmp" link></uni-list-item>
			<uni-list-item v-show="pushIsOn != 'wait'" title="推送服务" @click.native="pushIsOn?pushServer.off():pushServer.on()"  showSwitch :switchChecked="pushIsOn"></uni-list-item>
			<!-- #endif -->
			<uni-list-item v-if="supportMode.includes('fingerPrint')" title="指纹识别" @click.native="startSoterAuthentication('fingerPrint')" link></uni-list-item>
			<uni-list-item v-if="supportMode.includes('facial')" title="人脸识别" @click="startSoterAuthentication('facial')" link></uni-list-item>
		<!-- #endif -->
			<uni-list-item v-if="i18nEnable" title="切换语言" @click="changeLanguage" :rightText="currentLanguage" link></uni-list-item>
			<!-- <uni-list-item title="数据库调试" @click="openDebugPage" link></uni-list-item> -->
		</uni-list>
		
		<!-- 退出/登录 按钮 -->
		<view class="bottom-back" @click="changeLoginState">
			<text class="bottom-back-text" v-if="hasLogin">退出登录</text>
			<text class="bottom-back-text" v-else>登录</text>
		</view>
	</view>
</template>

<script>
	import pushServer from './dc-push/push.js';
	import {
		store,
		mutations
	} from '@/uni_modules/uni-id-pages/common/store.js'
	export default {
		data() {
			return {
				pushServer:pushServer,
				supportMode:[],
				pushIsOn:"wait",
				currentLanguage:"",
				userInfo:{}
			}
		},
		computed: {
			hasLogin(){
				return store.hasLogin
			},
			i18nEnable(){
				return getApp().globalData.config.i18n.enable
			}
		},
		onLoad() {
			this.currentLanguage = uni.getStorageSync('CURRENT_LANG') == "en"?'English':'简体中文'
			
			uni.setNavigationBarTitle({
				title: '设置'
			})
			// #ifdef APP || MP-WEIXIN || (APP-HARMONY && uniVersion > 4.31)
			uni.checkIsSupportSoterAuthentication({
				success: (res) => {
					this.supportMode = res.supportMode
				},
				fail: (err) => {
					console.log(err);
				}
			})
			// #endif
		},
		onShow() {
			// 检查手机端获取推送是否开启
			//#ifdef APP-PLUS
			setTimeout(()=>{
				this.pushIsOn = pushServer.isOn();
			},300)
			//#endif
		},
		methods: {
			async changeLoginState(){
				if(this.hasLogin){
					await mutations.logout()
				}else{
					uni.redirectTo({
						url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd',
					});
				}
			},
			/**
			 * 开始生物认证
			 */
			startSoterAuthentication(checkAuthMode) {
				console.log(checkAuthMode);
				let title = {"fingerPrint":'指纹识别',"facial":'人脸识别'}[checkAuthMode]
				// 检查是否开启认证
				this.checkIsSoterEnrolledInDevice({checkAuthMode,title})
					.then(() => {
						console.log(checkAuthMode,title);
						// 开始认证
						uni.startSoterAuthentication({
							requestAuthModes: [checkAuthMode],
							challenge: '123456', // 微信端挑战因子
							authContent: '请验证您的' + `${title}`,
							complete: (res) => {
								console.log(res);
							},
							success: (res) => {
								console.log(res);
								if (res.errCode == 0) {
									/**
									 * 验证成功后开启自己的业务逻辑
									 * 
									 * app端以此为依据 验证成功
									 * 
									 * 微信小程序需要再次通过后台验证resultJSON与resultJSONSignature获取最终结果
									 */
									return uni.showToast({
										title: `${title}`+'验证成功',
										icon: 'none'
									});
								}
								uni.showToast({
									title:'验证失败',
									icon: 'none'
								});
							},
							fail: (err) => {
								console.log(err);
								console.log(`认证失败:${err.errCode}`);
								uni.showToast({
									title:'认证失败',
									// title: `认证失败`,
									icon: 'none'
								});
							}
						})
					})
			},
			checkIsSoterEnrolledInDevice({checkAuthMode,title}) {
				return new Promise((resolve, reject) => {
					uni.checkIsSoterEnrolledInDevice({
						checkAuthMode,
						success: (res) => {
							console.log(res);
							if (res.isEnrolled) {
								return resolve(res);
							}
							uni.showToast({
								title: '未检测到' + `${title}` + '，请先在手机上注册',
								icon: 'none'
							});
							reject(res);
						},
						fail: (err) => {
							console.log(err);
							uni.showToast({
								title: `${title}` + '注册失败',
								icon: 'none'
							});
							reject(err);
						}
					})
				})
			},
			clearTmp() {
				uni.showLoading({
					title: '正在清除缓存',
					mask: true
				});
				/*
				任何临时存储或删除不直接影响程序运行逻辑（清除缓存必定造成业务逻辑的变化，如：打开页面的图片不从缓存中读取而从网络请求）的内容都可以视为缓存。主要有storage、和file写入。
				缓存分为三部分		
					原生层（如：webview、x5播放器的、第三方sdk的、地图组件等）
					前端框架（重启就会自动清除）
					开发者自己的逻辑（如：
						本示例的 检测更新功能下载了apk安装包，
						其他逻辑需要根据开发者自己的业务设计
						比如：有聊天功能的应用，聊天记录是否视为缓存，还是单独提供清除聊天记录的功能由开发者自己设计
					）
				*/
				uni.getSavedFileList({
					success:res=>{
						if (res.fileList.length > 0) {
							uni.removeSavedFile({
								filePath: res.fileList[0].filePath,
								complete:res=>{
									console.log(res);
									uni.hideLoading()
									uni.showToast({
										title: '清除缓存成功',
										icon: 'none'
									});
								}
							});
						}else{
							uni.hideLoading()
							uni.showToast({
								title: '清除缓存成功',
								icon: 'none'
							});
						}
					},
					complete:e=>{
						console.log(e);
					}
				});
			},
			changeLanguage(){
				console.log('语言切换')
				uni.showActionSheet({
					itemList: ["English","简体中文"],
					success: res => {
						console.log(res.tapIndex); 
						let language = uni.getStorageSync('CURRENT_LANG')
						if(
							!res.tapIndex && language=='zh-Hans' || res.tapIndex && language=='en'
						){
							const globalData = getApp().globalData
							if (language === 'en') {
								language = globalData.locale = 'zh-Hans'
							} else {
								language = globalData.locale = 'en'
							}
							uni.setStorageSync('CURRENT_LANG', language)
							getApp().globalData.$i18n.locale = language
							this.currentLanguage = res.tapIndex?'简体中文':'English'
							if(uni.setLocale){
								uni.setLocale(language)
							}
							uni.reLaunch({
								url: '/pages/list/list',
								complete: () => {
									uni.$emit("changeLanguage",language)
								}
							})
						}
					},
					fail: () => {},
					complete: () => {}
				});
			},
			openDebugPage(){
				uni.navigateTo({
					url: '/pages/debug/debug'
				})
			}
		}
	}
</script>

<style>
	/* #ifndef APP-NVUE */
	page {
		flex: 1;
		width: 100%;
		height: 100%;
	}

	uni-button:after {
		border: none;
		border-radius: 0;
	}
	/* #endif */
	.content {
		/* #ifndef APP-NVUE */
		display: flex;
		width: 100%;
		height: 100vh;
		/* #endif */
		flex-direction: column;
		flex: 1;
		background-color: #F9F9F9;
	}

	.bottom-back {
    flex-direction: column;
    justify-content: center;
    align-items: center;
		margin-top: 10px;
		width: 750rpx;
		height: 44px;
		/* #ifndef APP-NVUE */
		display: flex;
    width: 100%;
    border: none;
		/* #endif */
		border-width: 0;
		border-radius: 0;
		background-color: #FFFFFF;
	}

	.bottom-back-text {
		font-size: 33rpx;
	}

	.mt10 {
		margin-top: 10px;
	}
	/* #ifndef APP-NVUE  || VUE3 */
	.content ::v-deep .uni-list {
		background-color: #F9F9F9;
	}
	.content ::v-deep .uni-list-item--disabled,.list-item {
		height: 50px;
		margin-bottom: 1px;
	}
	/* #endif */

</style>