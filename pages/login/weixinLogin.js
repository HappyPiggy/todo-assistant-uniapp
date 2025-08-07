/**
 * 微信登录相关逻辑
 * 用于处理微信登录、获取用户信息、处理昵称冲突等
 */

import config from '@/uni_modules/uni-id-pages/config.js'

/**
 * 微信登录主函数
 * @param {Object} context - Vue组件上下文
 */
export async function weixinLogin(context) {
	// 判断是否需要弹出隐私协议授权框
	let needAgreements = (config?.agreements?.scope || []).includes('register')
	if (needAgreements && !context.agree) {
		// 使用当前页面的协议组件
		return context.$refs.agreements.popup(() => {
			weixinLogin(context)
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
			loginByWeixin(context, {
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
}

/**
 * 执行微信登录
 * @param {Object} context - Vue组件上下文
 * @param {Object} params - 登录参数
 */
export function loginByWeixin(context, params) {
	const uniIdCo = uniCloud.importObject("uni-id-co", {
		customUI: true
	})
	uniIdCo.loginByWeixin(params).then(async result => {
		uni.showToast({
			title: '登录成功',
			icon: 'none',
			duration: 2000
		});
		
		// #ifdef MP-WEIXIN
		// 微信小程序：登录成功后尝试获取用户信息
		tryGetWeixinUserInfo(context, result);
		// #endif
		
		// #ifndef MP-WEIXIN
		// #ifdef H5
		result.loginType = 'weixin'
		// #endif
		context.loginSuccess({
			...result,
			uniIdRedirectUrl: context.uniIdRedirectUrl
		})
		// #endif
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

// #ifdef MP-WEIXIN
/**
 * 尝试获取微信用户信息
 * @param {Object} context - Vue组件上下文
 * @param {Object} loginResult - 登录结果
 */
export function tryGetWeixinUserInfo(context, loginResult) {
	// 先检查用户是否已有昵称
	if (loginResult.userInfo && loginResult.userInfo.nickname) {
		// 已有昵称，直接跳转
		context.loginSuccess({
			...loginResult,
			uniIdRedirectUrl: context.uniIdRedirectUrl
		})
		return
	}
	
	// 没有昵称，提示用户授权
	uni.showModal({
		title: '完善信息',
		content: '是否使用微信昵称和头像完善个人信息？',
		confirmText: '使用',
		cancelText: '跳过',
		success: (res) => {
			if (res.confirm) {
				// 用户同意，获取用户信息
				getWeixinProfile(context, loginResult)
			} else {
				// 用户拒绝，直接跳转
				context.loginSuccess({
					...loginResult,
					uniIdRedirectUrl: context.uniIdRedirectUrl
				})
			}
		}
	})
}

/**
 * 获取微信用户信息
 * @param {Object} context - Vue组件上下文
 * @param {Object} loginResult - 登录结果
 */
export function getWeixinProfile(context, loginResult) {
	uni.getUserProfile({
		desc: '用于完善用户资料',
		success: async (res) => {
			console.log('获取用户信息成功：', res.userInfo)
			
			// 更新用户资料
			await updateUserProfile(context, res.userInfo, loginResult)
		},
		fail: (err) => {
			console.log('用户拒绝授权：', err)
			// 用户拒绝授权，继续登录流程
			context.loginSuccess({
				...loginResult,
				uniIdRedirectUrl: context.uniIdRedirectUrl
			})
		}
	})
}

/**
 * 更新用户资料（处理昵称重复）
 * @param {Object} context - Vue组件上下文
 * @param {Object} wxUserInfo - 微信用户信息
 * @param {Object} loginResult - 登录结果
 * @param {Number} retryCount - 重试次数
 */
export async function updateUserProfile(context, wxUserInfo, loginResult, retryCount = 0) {
	try {
		const userCo = uniCloud.importObject('user-co')
		let nickname = wxUserInfo.nickName
		
		// 如果已经重试过，添加随机后缀
		if (retryCount > 0) {
			// 生成4位随机数字
			const suffix = Math.floor(1000 + Math.random() * 9000)
			nickname = `${wxUserInfo.nickName}_${suffix}`
		}
		
		const updateData = {
			nickname: nickname,
			avatar: wxUserInfo.avatarUrl
		}
		
		const result = await userCo.updateProfile(updateData)
		
		if (result.code === 0) {
			// 更新成功
			if (loginResult.userInfo) {
				loginResult.userInfo.nickname = nickname
				loginResult.userInfo.avatar = wxUserInfo.avatarUrl
			}
			
			if (retryCount > 0) {
				uni.showToast({
					title: `昵称已更新为：${nickname}`,
					icon: 'none',
					duration: 2500
				})
			} else {
				uni.showToast({
					title: '信息已更新',
					icon: 'success',
					duration: 1500
				})
			}
			
			// 继续登录流程
			context.loginSuccess({
				...loginResult,
				uniIdRedirectUrl: context.uniIdRedirectUrl
			})
		} else {
			throw new Error(result.message || '更新失败')
		}
	} catch (error) {
		console.error('更新用户信息失败：', error)
		
		// 判断是否是昵称重复错误
		if (error.message && 
		    (error.message.includes('昵称') && error.message.includes('已存在')) ||
		    (error.message.includes('nickname') && error.message.includes('exist')) ||
		    error.code === 'NICKNAME_EXISTS' ||
		    error.code === 'nickname-exists') {
			
			// 昵称重复，自动重试
			if (retryCount < 3) {
				console.log(`昵称重复，自动添加后缀重试，第${retryCount + 1}次`)
				// 递归调用，增加重试次数
				await updateUserProfile(context, wxUserInfo, loginResult, retryCount + 1)
			} else {
				// 重试次数过多，让用户手动设置
				uni.showModal({
					title: '昵称设置失败',
					content: '该昵称已被使用，请稍后在个人中心手动设置昵称',
					confirmText: '知道了',
					showCancel: false,
					success: () => {
						// 继续登录流程
						context.loginSuccess({
							...loginResult,
							uniIdRedirectUrl: context.uniIdRedirectUrl
						})
					}
				})
			}
		} else {
			// 其他错误，提示用户但不阻塞登录
			console.error('更新资料失败，但不影响登录：', error)
			uni.showToast({
				title: '资料更新失败，可稍后在个人中心设置',
				icon: 'none',
				duration: 2000
			})
			
			// 继续登录流程
			setTimeout(() => {
				context.loginSuccess({
					...loginResult,
					uniIdRedirectUrl: context.uniIdRedirectUrl
				})
			}, 2000)
		}
	}
}
// #endif