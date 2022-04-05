import Vue from 'vue'
import VueRouter from 'vue-router'

// Routes
import { canNavigate } from '@/libs/acl/routeProtection'
import { isUserLoggedIn, getUserData, getHomeRouteForLoggedInUser } from '@/auth/utils'
// import apps from './routes/apps'
// import dashboard from './routes/dashboard'
// import uiElements from './routes/ui-elements/index'
// import pages from './routes/pages'
// import chartsMaps from './routes/charts-maps'
// import formsTable from './routes/forms-tables'
// import others from './routes/others'

Vue.use(VueRouter)

const router = new VueRouter({
	mode: 'history',
	base: process.env.BASE_URL,
	scrollBehavior() {
		return { x: 0, y: 0 }
	},
	routes: [
		{ path: '/', redirect: { name: 'dashboard' } },
		{
			path: '/',
			name: 'dashboard',
			component: () => import('@/views/dashboard.vue'),
			meta: {
			},
		},
		{
			path: '/admin/exchange',
			name: 'admin-exchange',
			component: () => import('@/views/pages/admin/Exchange.vue'),
			meta: {
			  resource: 'manager',
			  pageTitle: 'Exchange',
				breadcrumb: [
					{
						text: 'Admin',
					},
					{
						text: 'Exchange',
						active: true,
					},
				],
			},
		},
		{
			path: '/user/account-setting',
			name: 'account-setting',
			component: () => import('@/views/pages/account-setting/AccountSetting.vue'),
			meta: {
			  resource: 'Auth',
			  pageTitle: 'Account setting',
				breadcrumb: [
					{
						text: 'User',
					},
					{
						text: 'Account setting',
						active: true,
					},
				],
			},
		},
		{
			path: '/user/exchange',
			name: 'user-exchange',
			component: () => import('@/views/pages/user/Exchange.vue'),
			meta: {
			  resource: 'manager',
			  pageTitle: 'Exchange',
				breadcrumb: [
					{
						text: 'User',
					},
					{
						text: 'Exchange',
						active: true,
					},
				],
			},
		},
		{
			path: '/user/exchange/add',
			name: 'user-exchange-add',
			component: () => import('@/views/pages/user/AddExchange.vue'),
			meta: {
			  resource: 'manager',
			  pageTitle: 'Exchange',
				breadcrumb: [
					{
						text: 'User',
					},
					{
						text: 'Exchange',
					},
					{
						text: 'Add',
						active: true,
					},
				],
			},
		},
		{
			path: '/login',
			name: 'auth-login',
			component: () => import('@/views/authentication/Login.vue'),
			meta: {
			  layout: 'full',
			  resource: 'Auth',
			  redirectIfLoggedIn: true,
			},
		},
		{
			path: '/register',
			name: 'auth-register',
			component: () => import('@/views/authentication/Register.vue'),
			meta: {
			  layout: 'full',
			  resource: 'Auth',
			  redirectIfLoggedIn: true,
			},
		},
		{
			path: '/forgot-password',
			name: 'auth-forgot-password',
			component: () => import('@/views/authentication/ForgotPassword-v1.vue'),
			meta: {
			  layout: 'full',
			  resource: 'Auth',
			  redirectIfLoggedIn: true,
			},
		},
		{
			path: '/pages/miscellaneous/not-authorized',
			name: 'misc-not-authorized',
			component: () => import('@/views/pages/miscellaneous/NotAuthorized.vue'),
			meta: {
			  layout: 'full',
			  resource: 'Auth',
			},
		},
		{
			path: '/error-404',
			name: 'error-404',
			component: () => import('@/views/error/Error404.vue'),
			meta: {
				layout: 'full',
				resource: 'Auth',
				action: 'read',
			},
		},
		{
			path: '*',
			redirect: 'error-404',
		},
	],
})

router.beforeEach((to, _, next) => {
	const isLoggedIn = isUserLoggedIn()

	if (!canNavigate(to)) {
		// Redirect to login if not logged in
		if (!isLoggedIn) return next({ name: 'auth-login' })

		// If logged in => not authorized
		return next({ name: 'misc-not-authorized' })
	}

	// Redirect if logged in
	if (to.meta.redirectIfLoggedIn && isLoggedIn) {
		const userData = getUserData()
		next(getHomeRouteForLoggedInUser(userData ? userData.role : null))
	}

	return next()
})

// ? For splash screen
// Remove afterEach hook if you are not using splash screen
router.afterEach(() => {
	// Remove initial loading
	const appLoading = document.getElementById('loading-bg')
	if (appLoading) {
		appLoading.style.display = 'none'
	}
})

export default router
