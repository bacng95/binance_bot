<template>
<div class="auth-wrapper auth-v1 px-2">
    <div class="auth-inner py-2">
        <!-- Login v1 -->
        <b-card class="mb-0">
            <b-link class="brand-logo">
                <vuexy-logo />

                <h2 class="brand-text text-primary ml-1">Binb</h2>
            </b-link>

            <b-card-title class="mb-1">Chào mừng đến với Binb! 👋 </b-card-title>
            <b-card-text class="mb-2">Vui lòng đăng nhập vào tài khoản của bạn và bắt đầu cuộc phiêu lưu</b-card-text>

            <!-- form -->
            <validation-observer ref="loginForm" #default="{ invalid }">
                <b-form class="auth-login-form mt-2" @submit.prevent="login">
                    <!-- email -->
                    <b-form-group label-for="email" label="Email">
                        <validation-provider #default="{ errors }" name="Email" rules="required|email">
                            <b-form-input id="email" v-model="userEmail" name="login-email" :state="errors.length > 0 ? false : null" placeholder="john@example.com" autofocus />
                            <small class="text-danger">{{ errors[0] }}</small>
                        </validation-provider>
                    </b-form-group>

                    <!-- password -->
                    <b-form-group>
                        <div class="d-flex justify-content-between">
                            <label for="password">Password</label>
                            <b-link :to="{ name: 'auth-forgot-password' }">
                                <small>Quên mật khẩu?</small>
                            </b-link>
                        </div>
                        <validation-provider #default="{ errors }" name="Password" rules="required">
                            <b-input-group class="input-group-merge" :class="errors.length > 0 ? 'is-invalid' : null">
                                <b-form-input id="password" v-model="password" :type="passwordFieldType" class="form-control-merge" :state="errors.length > 0 ? false : null" name="login-password" placeholder="Password" />

                                <b-input-group-append is-text>
                                    <feather-icon class="cursor-pointer" :icon="passwordToggleIcon" @click="togglePasswordVisibility" />
                                </b-input-group-append>
                            </b-input-group>
                            <small class="text-danger">{{ errors[0] }}</small>
                        </validation-provider>
                    </b-form-group>

                    <!-- checkbox -->
                    <b-form-group>
                        <b-form-checkbox id="remember-me" v-model="status" name="checkbox-1">
                            Nhớ đăng nhập
                        </b-form-checkbox>
                    </b-form-group>

                    <!-- submit button -->
                    <b-button variant="primary" type="submit" block :disabled="invalid">
                        Đăng nhập
                    </b-button>
                </b-form>
            </validation-observer>

            <b-card-text class="text-center mt-2">
                <span>Bạn chưa có tài khoản ? </span>
                <b-link :to="{ name: 'auth-register' }">
                    <span>Tạo tài khoản</span>
                </b-link>
            </b-card-text>

            <div class="divider my-2">
                <div class="divider-text">Hoặc</div>
            </div>

            <!-- social button -->
            <div class="auth-footer-btn d-flex justify-content-center">
                <b-button href="javascript:void(0)" variant="twitter">
                    <feather-icon icon="SendIcon" />
                </b-button>
            </div>
        </b-card>
        <!-- /Login v1 -->
    </div>
</div>
</template>

<script>
import {
    ValidationProvider,
    ValidationObserver
} from "vee-validate";
import {
    BButton,
    BForm,
    BFormInput,
    BFormGroup,
    BCard,
    BLink,
    BCardTitle,
    BCardText,
    BInputGroup,
    BInputGroupAppend,
    BFormCheckbox,
} from "bootstrap-vue";
import VuexyLogo from "@core/layouts/components/Logo.vue";
import {
    required,
    email
} from "@validations";
import {
    togglePasswordVisibility
} from "@core/mixins/ui/forms";
import ToastificationContent from '@core/components/toastification/ToastificationContent.vue'
import useJwt from '@/auth/jwt/useJwt'
import { getHomeRouteForLoggedInUser } from '@/auth/utils'

export default {
    components: {
        // BSV
        BButton,
        BForm,
        BFormInput,
        BFormGroup,
        BCard,
        BCardTitle,
        BLink,
        VuexyLogo,
        BCardText,
        BInputGroup,
        BInputGroupAppend,
        BFormCheckbox,
        ValidationProvider,
        ValidationObserver,
    },
    mixins: [togglePasswordVisibility],
    data() {
        return {
            userEmail: "",
            password: "",
            status: "",
            // validation rules
            required,
            email,
        };
    },
    computed: {
        passwordToggleIcon() {
            return this.passwordFieldType === "password" ? "EyeIcon" : "EyeOffIcon";
        },
    },
    methods: {
        login() {
            this.$refs.loginForm.validate().then(success => {
                if (success) {
                    useJwt.login({
                        email: this.userEmail,
                        password: this.password,
                    })
                    .then(response => {
                        if (response.data.code == 1) {
                            const { userData } = response.data.data

                            useJwt.setToken(response.data.data.token.accessToken)
                            useJwt.setRefreshToken(response.data.data.token.refreshToken)

                            localStorage.setItem('userData', JSON.stringify(userData))

                            this.$ability.update(userData.ability)

                            this.$router.replace(getHomeRouteForLoggedInUser(userData.role))
                                .then(() => {
                                this.$toast({
                                    component: ToastificationContent,
                                    position: 'top-right',
                                    props: {
                                    title: `Welcome ${userData.email}`,
                                    icon: 'CoffeeIcon',
                                    variant: 'success',
                                    text: `Bạn đã đăng nhập thành công với ${userData.email}. Bây giờ bạn có thể bắt đầu khám phá!`,
                                    },
                                })
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
                        console.log(error)
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
    }
};
</script>

<style lang="scss">
@import "@core/scss/vue/pages/page-auth.scss";
</style>
