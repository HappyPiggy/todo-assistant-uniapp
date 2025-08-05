<!-- 账号密码登录页 -->
<template>
	<view class="uni-content">
		<view class="login-logo">
			<image :src="logo"></image>
		</view>
		<!-- 顶部文字 -->
		<text class="title title-box">账号密码登录</text>
		<uni-forms>
			<uni-forms-item name="username">
				<uni-easyinput :focus="focusUsername" @blur="focusUsername = false" class="input-box"
					:inputBorder="false" v-model="username" placeholder="请输入用户名" trim="all" />
			</uni-forms-item>
			<uni-forms-item name="password">
					<uni-easyinput :focus="focusPassword" @blur="focusPassword = false" class="input-box" clearable
					               type="password" :inputBorder="false" v-model="password" placeholder="请输入密码" trim="all" />
			</uni-forms-item>
		</uni-forms>
		<uni-captcha v-if="needCaptcha" focus ref="captcha" scene="login-by-pwd" v-model="captcha" />
		<!-- 带选择框的隐私政策协议组件 -->
		<uni-id-pages-agreements scope="login" ref="agreements"></uni-id-pages-agreements>
		<button class="uni-btn" type="primary" @click="pwdLogin">登录</button>
		<!-- 忘记密码 -->
		<view class="link-box">
			<view v-if="!config.isAdmin">
				<text class="forget">忘记了？</text>
				<text class="link" @click="toRetrievePwd">找回密码</text>
			</view>
			<text class="link" @click="toRegister">{{config.isAdmin ? '注册管理员账号': '注册账号'}}</text>
			<!-- <text class="link" @click="toRegister" v-if="!config.isAdmin">注册账号</text> -->
		</view>
		
		<!-- 第三方登录 -->
		<view class="third-party-login" v-if="hasWeixinLogin">
			<view class="divider">
				<view class="line"></view>
				<text class="divider-text">其他登录方式</text>
				<view class="line"></view>
			</view>
			<view class="login-icons">
				<view class="login-icon-item" @click="weixinLogin">
					<image class="login-icon" src="/uni_modules/uni-id-pages/static/login/uni-fab-login/weixin.png" mode="aspectFit"></image>
					<text class="login-icon-text">微信登录</text>
				</view>
			</view>
		</view>
		
		<!-- 带选择框的隐私政策协议组件（用于微信登录） -->
		<uni-id-pages-agreements v-if="false" scope="register" ref="weixinAgreements"></uni-id-pages-agreements>
		<!-- 悬浮登录方式组件 -->
		<!-- <uni-id-pages-fab-login ref="uniFabLogin"></uni-id-pages-fab-login> -->
	</view>
</template>

<script>
	import mixin from '@/uni_modules/uni-id-pages/common/login-page.mixin.js';
	import config from '@/uni_modules/uni-id-pages/config.js'
	import {store,mutations} from '@/uni_modules/uni-id-pages/common/store.js'
	const uniIdCo = uniCloud.importObject("uni-id-co", {
		errorOptions: {
			type: 'toast'
		}
	})
	export default {
		mixins: [mixin],
		data() {
			return {
				"password": "321123qw",
				"username": "qianda66",
				"captcha": "",
				"needCaptcha": false,
				"focusUsername": false,
				"focusPassword": false,
				"logo": "/static/logo.png",
				"uniIdRedirectUrl": "/pages/list/list"
			}
		},
		computed: {
			hasWeixinLogin() {
				// 检查配置中是否包含微信登录
				return config.loginTypes.includes('weixin')
			}
		},
		onShow() {
			// #ifdef H5
			document.onkeydown = event => {
				var e = event || window.event;
				if (e && e.keyCode == 13) { //回车键的键值为13
					this.pwdLogin()
				}
			};
			// #endif
		},
		methods: {
			// 页面跳转，找回密码
			toRetrievePwd() {
				let url = '/uni_modules/uni-id-pages/pages/retrieve/retrieve'
				//如果刚好用户名输入框的值为手机号码，就把它传到retrieve页面，根据该手机号找回密码
				if (/^1\d{10}$/.test(this.username)) {
					url += `?phoneNumber=${this.username}`
				}
				uni.navigateTo({
					url
				})
			},
			/**
			 * 密码登录
			 */
			pwdLogin() {
				if (!this.password.length) {
					this.focusPassword = true
					return uni.showToast({
						title: '请输入密码',
						icon: 'none',
						duration: 3000
					});
				}
				if (!this.username.length) {
					this.focusUsername = true
					return uni.showToast({
						title: '请输入用户名',
						icon: 'none',
						duration: 3000
					});
				}
				if (this.needCaptcha && this.captcha.length != 4) {
					this.$refs.captcha.getImageCaptcha()
					return uni.showToast({
						title: '请输入验证码',
						icon: 'none',
						duration: 3000
					});
				}

				if (this.needAgreements && !this.agree) {
					return this.$refs.agreements.popup(this.pwdLogin)
				}

				let data = {
					"password": this.password,
					"captcha": this.captcha
				}

				if (/^1\d{10}$/.test(this.username)) {
					data.mobile = this.username
				} else if (/@/.test(this.username)) {
					data.email = this.username
				} else {
					data.username = this.username
				}

				uniIdCo.login(data).then(e => {
					this.loginSuccess(e)
				}).catch(e => {
					if (e.errCode == 'uni-id-captcha-required') {
						this.needCaptcha = true
					} else if (this.needCaptcha) {
						//登录失败，自动重新获取验证码
						this.$refs.captcha.getImageCaptcha()
					}
				})
			},
			/* 前往注册 */
			toRegister() {
				uni.navigateTo({
					url: '/pages/register/register',
					fail(e) {
						console.error(e);
					}
				})
			},
			// 微信登录
			async weixinLogin() {
				// 判断是否需要弹出隐私协议授权框
				let needAgreements = (config?.agreements?.scope || []).includes('register')
				if (needAgreements && !this.agree) {
					// 使用当前页面的协议组件
					return this.$refs.agreements.popup(() => {
						this.weixinLogin()
					})
				}
				
				// H5平台微信登录
				// #ifdef H5
				if (true) {
					let ua = window.navigator.userAgent.toLowerCase();
					let isWeixin = ua.match(/MicroMessenger/i) == 'micromessenger'
					
					// #ifdef VUE2
					const baseUrl = process.env.BASE_URL
					// #endif
					// #ifdef VUE3
					const baseUrl = import.meta.env.BASE_URL
					// #endif
					
					let redirectUrl = location.protocol +
						'//' +
						location.host +
						baseUrl.replace(/\/$/, '') +
						(window.location.href.includes('#')?'/#':'') +
						'/uni_modules/uni-id-pages/pages/login/login-withoutpwd?is_weixin_redirect=true&type=weixin'
					
					if (isWeixin) {
						// 在微信公众号内
						return window.open(`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${config.appid.weixin.h5}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=snsapi_userinfo&state=STATE&connect_redirect=1#wechat_redirect`);
					} else {
						// 非微信公众号内
						return location.href = `https://open.weixin.qq.com/connect/qrconnect?appid=${config.appid.weixin.web}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=snsapi_login&state=STATE#wechat_redirect`
					}
				}
				// #endif
				
				// 非H5平台微信登录
				// #ifndef H5
				uni.showLoading({
					mask: true
				})
				
				uni.login({
					provider: 'weixin',
					onlyAuthorize: true,
					success: async e => {
						this.loginByWeixin({
							code: e.code
						})
					},
					fail: async (err) => {
						console.error(JSON.stringify(err));
						uni.showModal({
							content: `登录失败; code: ${err.errCode || -1}`,
							confirmText: "知道了",
							showCancel: false
						});
						uni.hideLoading()
					}
				})
				// #endif
			},
			// 执行微信登录
			loginByWeixin(params) {
				const uniIdCo = uniCloud.importObject("uni-id-co", {
					customUI: true
				})
				uniIdCo.loginByWeixin(params).then(result => {
					uni.showToast({
						title: '登录成功',
						icon: 'none',
						duration: 2000
					});
					// #ifdef H5
					result.loginType = 'weixin'
					// #endif
					this.loginSuccess({
						...result,
						uniIdRedirectUrl: this.uniIdRedirectUrl
					})
				})
				.catch(e => {
					uni.showModal({
						content: e.message,
						confirmText: "知道了",
						showCancel: false
					});
				})
				.finally(e => {
					uni.hideLoading()
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	@import "@/uni_modules/uni-id-pages/common/login-page.scss";


	@media screen and (min-width: 690px) {
		.uni-content {
			height: auto;
		}
	}

	.forget {
		font-size: 12px;
		color: #8a8f8b;
	}

	.link-box {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: row;
		justify-content: space-between;
		margin-top: 20px;
	}

	.link {
		font-size: 12px;
	}
	
	/* 第三方登录样式 */
	.third-party-login {
		margin-top: 50px;
	}
	
	.divider {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: row;
		align-items: center;
		margin: 20px 0;
	}
	
	.line {
		flex: 1;
		height: 1px;
		background-color: #e4e4e4;
	}
	
	.divider-text {
		padding: 0 15px;
		color: #999;
		font-size: 12px;
	}
	
	.login-icons {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: row;
		justify-content: center;
		align-items: center;
		padding: 10px 0;
	}
	
	.login-icon-item {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0 20px;
		cursor: pointer;
		transition: opacity 0.3s;
	}
	
	.login-icon-item:active {
		opacity: 0.6;
	}
	
	.login-icon {
		width: 45px;
		height: 45px;
		border-radius: 50%;
		border: 1px solid #f6f6f6;
	}
	
	.login-icon-text {
		margin-top: 8px;
		font-size: 12px;
		color: #666;
		text-align: center;
	}
</style>
