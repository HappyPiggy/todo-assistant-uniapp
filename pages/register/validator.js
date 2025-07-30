// 密码验证规则（本地化版本，避免模块导入问题）
const passwordRules = {
	weak: /^(?=.*[0-9])(?=.*[a-zA-Z])[0-9a-zA-Z~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/]{6,16}$/
}

const ERROR = {
	normal: {
		noPwd: '请输入密码',
		noRePwd: '再次输入密码',
		rePwdErr: '两次输入密码不一致'
	},
	passwordStrengthError: {
		weak: '密码必须包含字母，密码长度必须在6-16位之间'
	}
}

function validPwd(password) {
	if (!new RegExp(passwordRules.weak).test(password)) {
		return ERROR.passwordStrengthError.weak
	}
	return true
}

function getPwdRules(pwdName = 'password', rePwdName = 'password2') {
	const rules = {}
	rules[pwdName] = {
		rules: [{
				required: true,
				errorMessage: ERROR.normal.noPwd,
			},
			{
				validateFunction: function(rule, value, data, callback) {
					const checkRes = validPwd(value)
					if (checkRes !== true) {
						callback(checkRes)
					}
					return true
				}
			}
		]
	}

	if (rePwdName) {
		rules[rePwdName] = {
			rules: [{
					required: true,
					errorMessage: ERROR.normal.noRePwd,
				},
				{
					validateFunction: function(rule, value, data, callback) {
						if (value != data[pwdName]) {
							callback(ERROR.normal.rePwdErr)
						}
						return true
					}
				}
			]
		}
	}
	return rules
}

export default {
	"username": {
		"rules": [{
				required: true,
				errorMessage: '请输入用户名',
			},
			{
				minLength: 3,
				maxLength: 32,
				errorMessage: '用户名长度在 {minLength} 到 {maxLength} 个字符',
			},
			{
				validateFunction: function(rule, value, data, callback) {
					// console.log(value);
					if (/^1\d{10}$/.test(value) || /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/.test(value)) {
						callback('用户名不能是：手机号或邮箱')
					};
					if (/^\d+$/.test(value)) {
						callback('用户名不能为纯数字')
					};
					if(/[\u4E00-\u9FA5\uF900-\uFA2D]{1,}/.test(value)){
						callback('用户名不能包含中文')
					}
					return true
				}
			}
		],
		"label": "用户名"
	},
	"nickname": {
		"rules": [{
				minLength: 3,
				maxLength: 32,
				errorMessage: '昵称长度在 {minLength} 到 {maxLength} 个字符',
			},
			{
				validateFunction: function(rule, value, data, callback) {
					// console.log(value);
					if (/^1\d{10}$/.test(value) || /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/.test(value)) {
						callback('昵称不能是：手机号或邮箱')
					};
					if (/^\d+$/.test(value)) {
						callback('昵称不能为纯数字')
					};
					if(/[\u4E00-\u9FA5\uF900-\uFA2D]{1,}/.test(value)){
						callback('昵称不能包含中文')
					}
					return true
				}
			}
		],
		"label": "昵称"
	},
	...getPwdRules()
}
