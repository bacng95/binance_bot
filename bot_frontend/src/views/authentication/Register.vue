<template>
<div class="auth-wrapper auth-v1 px-2">
    <div class="auth-inner py-2">

        <!-- Register v1 -->
        <b-card class="mb-0">
            <b-link class="brand-logo">
                <vuexy-logo />
                <h2 class="brand-text text-primary ml-1">
                    Binb
                </h2>
            </b-link>

            <b-card-title class="mb-1">
                Cuộc phiêu lưu bắt đầu từ đây 🚀
            </b-card-title>
            <b-card-text class="mb-2">
                
            </b-card-text>

            <!-- form -->
            <validation-observer ref="registerForm">
                <b-form class="auth-register-form mt-2" @submit.prevent="validationForm">
                    <!-- username -->
                    <!-- <b-form-group label="Username" label-for="username">
                        <validation-provider #default="{ errors }" name="Username" rules="required">
                            <b-form-input id="username" v-model="username" :state="errors.length > 0 ? false:null" name="register-username" placeholder="johndoe" />
                            <small class="text-danger">{{ errors[0] }}</small>
                        </validation-provider>
                    </b-form-group> -->

                    <!-- email -->
                    <b-form-group label="Email" label-for="email">
                        <validation-provider #default="{ errors }" name="Email" rules="required|email">
                            <b-form-input id="email" v-model="regEmail" :state="errors.length > 0 ? false:null" name="register-email" placeholder="john@example.com" />
                            <small class="text-danger">{{ errors[0] }}</small>
                        </validation-provider>
                    </b-form-group>

                    <!-- password -->
                    <b-form-group label="Password" label-for="password">
                        <validation-provider #default="{ errors }" name="Password" rules="required">
                            <b-input-group class="input-group-merge" :class="errors.length > 0 ? 'is-invalid':null">
                                <b-form-input id="password" v-model="password" :type="passwordFieldType" :state="errors.length > 0 ? false:null" class="form-control-merge" name="register-password" placeholder="············" />
                                <b-input-group-append is-text>
                                    <feather-icon :icon="passwordToggleIcon" class="cursor-pointer" @click="togglePasswordVisibility" />
                                </b-input-group-append>
                            </b-input-group>
                            <small class="text-danger">{{ errors[0] }}</small>
                        </validation-provider>
                    </b-form-group>

                    <!-- checkbox -->
                    <b-form-group>
                        <b-form-checkbox id="register-privacy-policy" v-model="status" name="checkbox-1">
                            Đồng ý với 
                            <b-link>chính sách & điều khoản bảo mật</b-link>
                        </b-form-checkbox>
                    </b-form-group>

                    <!-- submit button -->
                    <b-button variant="primary" block type="submit">
                        Đăng ký
                    </b-button>
                </b-form>
            </validation-observer>

            <b-card-text class="text-center mt-2">
                <span>Bạn đã có tài khoản? </span>
                <b-link :to="{name:'auth-login'}">
                    <span>Đăng nhập ngay</span>
                </b-link>
            </b-card-text>

            <div class="divider my-2">
                <div class="divider-text">
                    or
                </div>
            </div>

            <!-- social buttons -->
            <div class="auth-footer-btn d-flex justify-content-center">
                <b-button variant="twitter" href="javascript:void(0)">
                    <feather-icon icon="SendIcon" />
                </b-button>
            </div>
        </b-card>
        <!-- /Register v1 -->
    </div>
</div>
</template>

<script>
import {
    ValidationProvider,
    ValidationObserver
} from 'vee-validate'
import {
    BCard,
    BLink,
    BCardTitle,
    BCardText,
    BForm,
    BButton,
    BFormInput,
    BFormGroup,
    BInputGroup,
    BInputGroupAppend,
    BFormCheckbox,
} from 'bootstrap-vue'
import VuexyLogo from '@core/layouts/components/Logo.vue'
import {
    required,
    email
} from '@validations'
import {
    togglePasswordVisibility
} from '@core/mixins/ui/forms'
import ToastificationContent from '@core/components/toastification/ToastificationContent.vue'
import useJwt from '@/auth/jwt/useJwt'

export default {
    components: {
        VuexyLogo,
        // BSV
        BCard,
        BLink,
        BCardTitle,
        BCardText,
        BForm,
        BButton,
        BFormInput,
        BFormGroup,
        BInputGroup,
        BInputGroupAppend,
        BFormCheckbox,
        // validations
        ValidationProvider,
        ValidationObserver,
    },
    mixins: [togglePasswordVisibility],
    data() {
        return {
            regEmail: '',
            username: '',
            password: '',
            status: '',

            // validation rules
            required,
            email,
        }
    },
    computed: {
        passwordToggleIcon() {
            return this.passwordFieldType === 'password' ? 'EyeIcon' : 'EyeOffIcon'
        },
    },
    methods: {
        validationForm() {
            this.$refs.registerForm.validate().then(success => {
                if (success) {
					useJwt.register({
						email: this.regEmail,
						password: this.password,
					})
					.then(response => {
						// useJwt.setToken(response.data.accessToken)
						// useJwt.setRefreshToken(response.data.refreshToken)

						// localStorage.setItem('userData', JSON.stringify(response.data.userData))

						// this.$ability.update(response.data.userData.ability)
						if (response.data.code === 1) {
							this.$router.push('/login')

							this.$toast({
								component: ToastificationContent,
								props: {
									title: 'Đăng ký thành công',
									icon: 'EditIcon',
									variant: 'success',
								}
							})
						} else {
							this.$toast({
								component: ToastificationContent,
								props: {
									title: response.data.msg,
									icon: 'EditIcon',
									variant: 'danger',
								}
							})
						}
					})
					.catch(error => {
						this.$toast({
							component: ToastificationContent,
							props: {
								title: error.response.data.msg,
								icon: 'EditIcon',
								variant: 'danger',
							}
						})
					})
                }
            })
        },
    },
}
</script>

<style lang="scss">
@import '@core/scss/vue/pages/page-auth.scss';
</style>
