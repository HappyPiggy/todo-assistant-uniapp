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
 * 生成随机字符串（数字+字母）
 * @param {Number} length - 字符串长度
 * @returns {String} 随机字符串
 */
function generateRandomString(length = 5) {
	const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
	let result = ''
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length))
	}
	return result
}

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
	
	// 直接设置默认昵称，不请求授权也不询问用户
	setSimpleDefaultNickname(context, loginResult)
}

/**
 * 简单设置默认昵称（不询问用户）
 * @param {Object} context - Vue组件上下文
 * @param {Object} loginResult - 登录结果
 */
async function setSimpleDefaultNickname(context, loginResult) {
	// 生成默认昵称：微信用户 + 5位随机字符
	const defaultNickname = '微信用户' + generateRandomString(5)
	
	try {
		const userCo = uniCloud.importObject('user-co')
		const result = await userCo.updateProfile({
			nickname: defaultNickname
		}, {
			skipNicknameTimeLimit: true  // 默认昵称设置时跳过时间限制
		})
		
		if (result.code === 0) {
			// 更新成功，更新登录结果中的用户信息
			if (loginResult.userInfo) {
				loginResult.userInfo.nickname = defaultNickname
			}
			
			console.log('已设置默认昵称：', defaultNickname)
			
			// 完成登录流程
			context.loginSuccess({
				...loginResult,
				uniIdRedirectUrl: context.uniIdRedirectUrl
			})
		} else {
			throw new Error(result.message || '设置昵称失败')
		}
	} catch (error) {
		console.error('设置默认昵称失败:', error)
		
		// 设置失败，直接完成登录流程，不影响用户体验
		context.loginSuccess({
			...loginResult,
			uniIdRedirectUrl: context.uniIdRedirectUrl
		})
	}
}

// #endif