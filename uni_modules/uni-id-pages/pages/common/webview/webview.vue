<!-- 网络链接内容展示页（uni-id-pages中用于展示隐私政策协议内容） -->
<template>
	<view>
		<web-view v-if="url" :src="url"></web-view>
	</view>
</template>

<script>
	export default {
		onLoad({url,title}) {
			// 支持本地静态文件和网络链接
			if(url.substring(0, 4) != 'http' && !url.startsWith('/static/')){
				uni.showModal({
					title:"错误",
					content: '不是一个有效的链接,'+'"'+url+'"',
					showCancel: false,
					confirmText:"知道了",
					complete: () => {
						uni.navigateBack()
					}
				});
				title = "页面路径错误"
			}else{
				// 如果是本地静态文件，需要添加域名前缀（H5平台）
				// #ifdef H5
				if(url.startsWith('/static/')){
					// H5平台下，将相对路径转换为完整URL
					this.url = window.location.origin + url;
				}else{
					this.url = url;
				}
				// #endif
				
				// #ifndef H5
				// 非H5平台直接使用原始URL
				this.url = url;
				// #endif
			}
			if(title){
				uni.setNavigationBarTitle({title});
			}
		},
		data() {
			return {
				url:null
			};
		}
	}
</script>
