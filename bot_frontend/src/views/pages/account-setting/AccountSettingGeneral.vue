<template>
<b-card>

    <!-- media -->
    <b-media no-body>
        <b-media-aside>
            <b-link>
                <b-img ref="previewEl" rounded :src="avatar" height="80" />
            </b-link>
            <!--/ avatar -->
        </b-media-aside>

        <b-media-body class="mt-75 ml-75">
            <!-- upload button -->
            <b-button v-ripple.400="'rgba(255, 255, 255, 0.15)'" disabled variant="primary" size="sm" class="mb-75 mr-75" @click="$refs.refInputEl.$el.click()">
                Upload
            </b-button>
            <b-form-file ref="refInputEl" v-model="profileFile" accept=".jpg, .png, .gif" :hidden="true" plain @input="inputImageRenderer" />
            <!--/ upload button -->

            <!-- reset -->
            <b-button v-ripple.400="'rgba(186, 191, 199, 0.15)'" disabled variant="outline-secondary" size="sm" class="mb-75 mr-75">
                Reset
            </b-button>
            <!--/ reset -->
            <b-card-text>Allowed JPG, GIF or PNG. Max size of 800kB</b-card-text>
        </b-media-body>
    </b-media>
    <!--/ media -->

    <!-- form -->
    <b-form class="mt-2">
        <b-row>
            <!-- <b-col sm="6">
                <b-form-group label="Username" label-for="account-username">
                    <b-form-input v-model="optionsLocal.username" placeholder="Username" name="username" />
                </b-form-group>
            </b-col>
            <b-col sm="6">
                <b-form-group label="Name" label-for="account-name">
                    <b-form-input v-model="optionsLocal.fullName" name="name" placeholder="Name" />
                </b-form-group>
            </b-col> -->
            <b-col sm="12">
                <b-form-group label="API KEY" label-for="api-key">
                    <b-form-input v-model="apiKey" name="api-key" id="api-key" placeholder="API KEY" />

                </b-form-group>
            </b-col>
            <b-col sm="12">
                <b-form-group label="SERECT KEY" label-for="api-serect">
                    <b-form-input v-model="apiSecret" name="serect-key" id="api-key" placeholder="SERECT KEY" />
                </b-form-group>
            </b-col>

            <!-- alert -->
            <!-- <b-col cols="12" class="mt-75">
                <b-alert show variant="warning" class="mb-50">
                    <h4 class="alert-heading">
                        Your email is not confirmed. Please check your inbox.
                    </h4>
                    <div class="alert-body">
                        <b-link class="alert-link">
                            Resend confirmation
                        </b-link>
                    </div>
                </b-alert>
            </b-col> -->
            <!--/ alert -->

            <b-col cols="12">
                <b-button v-ripple.400="'rgba(255, 255, 255, 0.15)'" variant="primary" class="mt-2 mr-1" @click="save">
                    Save changes
                </b-button>
            </b-col>
        </b-row>
    </b-form>
</b-card>
</template>

<script>
import {
    BFormFile,
    BButton,
    BForm,
    BFormGroup,
    BFormInput,
    BRow,
    BCol,
    BAlert,
    BCard,
    BCardText,
    BMedia,
    BMediaAside,
    BMediaBody,
    BLink,
    BImg,
} from 'bootstrap-vue'
import Ripple from 'vue-ripple-directive'
import {
    useInputImageRenderer
} from '@core/comp-functions/forms/form-utils'
import {
    ref
} from '@vue/composition-api'
import ToastificationContent from '@core/components/toastification/ToastificationContent.vue'

export default {
    components: {
        BButton,
        BForm,
        BImg,
        BFormFile,
        BFormGroup,
        BFormInput,
        BRow,
        BCol,
        BAlert,
        BCard,
        BCardText,
        BMedia,
        BMediaAside,
        BMediaBody,
        BLink,
    },
    directives: {
        Ripple,
    },
    data() {
        return {
            profileFile: null,
            avatar: require('@/assets/images/portrait/small/avatar-s-11.jpg'),
            username: '',
            fullName: '',
            apiKey: '',
            apiSecret: '',
        }
    },
    methods: {
        fetchData() {
            this.$http.get('/user/settings')
            .then(res => {
                if (res.data.code) {
                    this.apiKey = res.data.data.api_key
                    this.apiSecret = res.data.data.api_secret
                } else {
                    this.$toast({
                        component: ToastificationContent,
                        props: {
                            title: res.data.msg,
                            icon: 'EditIcon',
                            variant: 'danger',
                        },
                    })
                }
            })
        },
        save() {
            this.$http.post('/user/settings', {
                apiKey: this.apiKey,
                secrectKey: this.apiKey
            }).then(res => {
                if (res.data.code) {
                    this.$toast({
                        component: ToastificationContent,
                        props: {
                            title: res.data.msg,
                            icon: 'EditIcon',
                            variant: 'success',
                        },
                    })
                } else {
                    this.$toast({
                        component: ToastificationContent,
                        props: {
                            title: res.data.msg,
                            icon: 'EditIcon',
                            variant: 'danger',
                        },
                    })
                }
            })
        }
    },
    mounted() {
        this.fetchData()
    },
    setup() {
        const refInputEl = ref(null)
        const previewEl = ref(null)

        const {
            inputImageRenderer
        } = useInputImageRenderer(refInputEl, previewEl)

        return {
            refInputEl,
            previewEl,
            inputImageRenderer,
        }
    },
}
</script>
