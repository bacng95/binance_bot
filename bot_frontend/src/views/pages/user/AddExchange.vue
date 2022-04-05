<template>
<div>
    <form-wizard color="#7367F0" :title="null" :subtitle="null" layout="vertical" finish-button-text="Submit" back-button-text="Previous" class="wizard-vertical mb-3" @on-complete="formSubmitted">
        <tab-content title="Chọn mã giao dịch" :before-change="validationForm1">
            <validation-observer ref="infoRules" tag="form">
                <b-row>
                    <b-col cols="12" class="mb-2">
                        <h5 class="mb-0">
                            Chọn mã giao dịch
                        </h5>
                        <small class="text-muted">
                            Chọn 1 mã giao dịch và tiếp tục
                        </small>
                    </b-col>
                    <b-col md="12">
                        <b-table class="border" ref="selectableTable" selectable select-mode="single" :items="exchangeEnableItems" :fields="fields" responsive="sm" @row-selected="onRowSelected">
                            <template #cell(symbol)="data">
                                <div class="d-flex align-items-center">
                                    <b-avatar class="mr-1" variant="light-primary">
                                        <feather-icon size="18" icon="DollarSignIcon" />
                                    </b-avatar>
                                    <div>
                                        <div class="font-weight-bolder">
                                            {{ data.item.symbol }}
                                        </div>
                                    </div>
                                </div>
                            </template>
                            <template #cell(type)="data">
                                <div class="d-flex align-items-center">
                                    <b-badge :variant="data.item.type === 'SPOT' ? 'secondary' : 'dark'">{{ data.item.type }}</b-badge>
                                </div>
                            </template>
                        </b-table>
                    </b-col>
                </b-row>
            </validation-observer>
        </tab-content>
        <tab-content title="Cài đặt lệnh vào" :before-change="validationForm2">
            <validation-observer ref="infoRules" tag="form">
                <b-row>
                    <b-col cols="12" class="mb-2">
                        <h5 class="mb-0">
                            Cài đặt lệnh vào
                        </h5>
                        <small class="text-muted">
                            Đặt số lượng vào lệnh và đòn bảy
                        </small>
                    </b-col>
                    <b-col md="12">
                        <b-form-group label="Số lượng vào lệnh (USDT)" label-for="order-amount">
                            <b-form-input type="number" id="order-amount" v-model="orderAmount" placeholder="Số lượng vào lệnh" />
                        </b-form-group>
                    </b-col>
                    <b-col md="12">
                        <b-form-group label="Đòn bảy" label-for="order-leverage">
                            <b-form-input type="number" id="order-leverage" v-model="orderLeverage" placeholder="Đòn bảy" />
                        </b-form-group>
                    </b-col>
                </b-row>
            </validation-observer>
        </tab-content>
        <tab-content title="TP/SL" :before-change="validationForm3">
            <validation-observer ref="infoRules" tag="form">
                <b-row>
                    <b-col cols="12" class="mb-2">
                        <h5 class="mb-0">
                            Take Profit - Stoploss
                        </h5>
                        <small class="text-muted">
                            Cài đặt các thông số take profit và stoploss
                        </small>
                    </b-col>
                    <b-col md="12">
                        <b-form-group label="Take profit so với điểm vào lệnh (%)" label-for="order-take-profit">
                            <b-form-input type="number" id="order-take-profit" v-model="takeprofit" placeholder="Take profit so với điểm vào lệnh" />
                        </b-form-group>
                    </b-col>
                    <b-col md="12">
                        <b-form-group label="Stoploss so với điểm vào lệnh (%)" label-for="order-stoploss">
                            <b-form-input type="number" id="order-stoploss" v-model="stoploss" placeholder="Đòn bảy" />
                        </b-form-group>
                    </b-col>
                </b-row>
            </validation-observer>
        </tab-content>
        <tab-content title="Trailing stop" :before-change="validationForm4">
            <validation-observer ref="infoRules" tag="form">
                <b-row>
                    <b-col cols="12" class="mb-2">
                        <h5 class="mb-0">
                            Trailing stop
                        </h5>
                        <small class="text-muted">
                            Cài đặt các thông số trailing stop
                        </small>
                    </b-col>
                    <b-col md="12">
                        <b-form-group label="Tỉ lệ hồi vốn (%)" label-for="order-take-profit">
                            <b-form-input type="number" id="order-take-profit" v-model="callbackRate" placeholder="Tỉ lệ hồi vốn (%)" />
                        </b-form-group>
                    </b-col>
                </b-row>
            </validation-observer>
        </tab-content>
        <tab-content title="Cài đặt chiến thuật" :before-change="validationForm5">
            <b-row>
                <b-col cols="12" class="mb-2">
                    <h5 class="mb-0">
                        Cài đặt chiến thuật
                    </h5>
                    <small class="text-muted">Chọn các chiến thuật sử dụng cho <b>{{ exchangeName }}</b>. Bấm vào chiến thuật để tủy chỉnh các thông số</small>
                </b-col>
                <b-col md="12" v-if="strategySelect.length == 0">
                    <b-alert variant="primary" show >
                        <div class="alert-body">
                            <span>Chưa có chiến thuật nào được áp dụng cho mã giao dịch này.</span>
                        </div>
                    </b-alert>
                </b-col>
                <b-col md="6">
                    <div class="strategy-list">
                        <div class="strategy-item" @click="strategyOptionSelect(index)" :class="{ 'selected': strategySelectIndex == index }" v-for="(item, index) in strategySelect" :key="index">
                            <b-form-checkbox v-model="strategySelect[index].enable" class="custom-control-success" name="check-button" switch />
                            <b-card-text class="mb-0">{{ item.strategy_name }}</b-card-text>
                        </div>
                    </div>
                </b-col>
                <b-col md="6" v-if="strategySelectIndex !== null">
                    <b-form-group v-for="(item, index) in strategySelect[strategySelectIndex].options" :key="index" :label="strategyText(index).title" :label-for="index">
                        <b-form-input type="number" v-model="strategyOptions[index]" :id="index" :placeholder="strategyText(index).description" />
                    </b-form-group>
                </b-col>
            </b-row>
        </tab-content>
        <tab-content title="DCA" :before-change="validationForm6">
            <validation-observer ref="infoRules" tag="form">
                <b-row>
                    <b-col cols="12" class="mb-2">
                        <h5 class="mb-0">
                            DCA
                        </h5>
                        <small class="text-muted">
                            Cài đặt các thông số chiến thuật DCA
                        </small>
                    </b-col>
                    <b-col md="12" class="mb-1">
                        <b-form-checkbox v-model="dca.buyState" name="check-button" switch inline>DCA Lệnh mua</b-form-checkbox>
                    </b-col>
                    <b-col md="12" class="mb-1">
                        <b-form-checkbox v-model="dca.sellState" name="check-button" switch inline>DCA Lệnh bán khống</b-form-checkbox>
                    </b-col>
                    <b-col md="12">
                        <b-form-group label="Số lần DCA" label-for="order-take-profit">
                            <b-form-input type="number" id="order-take-profit" v-model="dca.dcaLenght" placeholder="Số lần DCA" />
                        </b-form-group>
                    </b-col>
                    <b-col md="12">
                        <b-form-group label="Giá trị bước nhảy DCA (%)" label-for="order-take-profit">
                            <b-form-input type="number" id="order-take-profit" v-model="dca.step" placeholder="Giá trị bước nhảy DCA" />
                        </b-form-group>
                    </b-col>
                </b-row>
            </validation-observer>
        </tab-content>
    </form-wizard>

</div>
</template>

<script>

import {
    FormWizard,
    TabContent
} from 'vue-form-wizard'
import { ValidationProvider, ValidationObserver } from 'vee-validate'
import vSelect from 'vue-select'
import 'vue-form-wizard/dist/vue-form-wizard.min.css'
import {
    BRow,
    BCol,
    BFormGroup,
    BFormInput,
    BTable,
    BAvatar,
    BBadge,
    BFormCheckbox,
    BCardText,
    BAlert
} from 'bootstrap-vue'
import ToastificationContent from '@core/components/toastification/ToastificationContent.vue'
import strategyTextDefine from '../strategy-define'

export default {
    components: {
        FormWizard,
        TabContent,
        BRow,
        BCol,
        BFormGroup,
        BFormInput,
        BTable,
        BAvatar,
        BBadge,
        BFormCheckbox,
        BCardText,
        ValidationProvider,
        ValidationObserver,
        BAlert,
        vSelect,
        // eslint-disable-next-line vue/no-unused-components
        ToastificationContent,
    },
    data() {
        return {
            fields: [
                { key: 'symbol', label: 'SYMBOL' },
                { key: 'type', label: 'TYPE' },
            ],
            exchangeEnableItems: [],
            exchangeSelect: null,
            strategySelect: [],
            strategySelectIndex: null,
            strategyOptions: [],
            exchangeUser: [],
            orderAmount: 5,
            orderLeverage: 10,
            takeprofit: 5,
            stoploss: 3,
            callbackRate: 1,
            dca: {
                buyState: false,
                sellState: false,
                dcaLenght: 1,
                dcaStep: 2
            }
        }
    },
    created() {
        // this.fetchExchangeEnableData()
        this.fetchDataExchange()
    },
    computed: {
        exchangeName () {
            return this.exchangeSelect ? `${this.exchangeSelect.type}_${this.exchangeSelect.symbol}` : '';
        },
        strategyList () {
            return this.exchangeSelect?.strategy ? this.exchangeSelect.strategy : []
        }
    },
    methods: {
        strategyOptionSelect(index) {
            this.strategySelectIndex = index
            this.strategyOptions = this.strategySelect[index].options
        },
        strategyText (key) {
            let result = {
                title: '',
                description: ''
            }
            if (strategyTextDefine[key]) { result = strategyTextDefine[key] }
            return result
        },
        validationForm1() {
            if (this.exchangeSelect) {
                return true
            }
            this.$toast({
                component: ToastificationContent,
                props: {
                    title: "Hãy chọn 1 mã giao dịch và tiếp tục",
                    icon: 'EditIcon',
                    variant: 'danger',
                },
            })
            return false
        },
        validationForm2() {
            if (this.orderAmount && this.orderLeverage) {
                return true
            }
            this.$toast({
                component: ToastificationContent,
                props: {
                    title: "Dữ liệu không hợp lệ",
                    icon: 'EditIcon',
                    variant: 'danger',
                },
            })
            return false
        },
        validationForm3() {
            if (this.takeprofit && this.stoploss) {
                return true
            }
            this.$toast({
                component: ToastificationContent,
                props: {
                    title: "Dữ liệu không hợp lệ",
                    icon: 'EditIcon',
                    variant: 'danger',
                },
            })
            return false
        },
        validationForm4() {
            if (this.callbackRate) {
                return true
            }
            this.$toast({
                component: ToastificationContent,
                props: {
                    title: "Dữ liệu không hợp lệ",
                    icon: 'EditIcon',
                    variant: 'danger',
                },
            })
            return false
        },
        validationForm5() {
            if (this.strategySelect) {
                const strategyChoose = this.strategySelect.filter(el => {
                    return el.enable === 1 || el.enable === true
                })

                if (strategyChoose.length) {
                    return true
                }
            }
            this.$toast({
                component: ToastificationContent,
                props: {
                    title: "Hãy chọn ít nhất 1 chiến thuật và tiếp tục",
                    icon: 'EditIcon',
                    variant: 'danger',
                },
            })
            return false
        },
        validationForm6() {
            if (this.dca.dcaLenght) {
                return true
            }
            this.$toast({
                component: ToastificationContent,
                props: {
                    title: "Hãy chọn ít nhất 1 chiến thuật và tiếp tục",
                    icon: 'EditIcon',
                    variant: 'danger',
                },
            })
            return false
        },
        fetchDataExchange() {
            this.$http.get('/exchange-setting/user-list')
            .then((requrest) => {
                if (requrest.data.code == 1) {
                    this.exchangeUser = requrest.data.data
                    this.fetchExchangeEnableData()
                }
            })
        },
        fetchExchangeEnableData() {
            this.$http.get('/exchange/list-enable')
            .then((requrest) => {
                if (requrest.data.code == 1) {

                    for (let index = 0; index < requrest.data.data.length; index++) {
                        const element = requrest.data.data[index];
                        const checkExchangeUser = this.exchangeUser.find(el => el.exchange_id == element.id)
                        if (!checkExchangeUser) {
                            this.exchangeEnableItems.push(element)
                        }
                    }
                }
            })
        },
        onRowSelected(items) {
            console.log(items[0])
            this.exchangeSelect = items[0]


            if (this.exchangeSelect?.strategy) {
                this.strategySelect = []

                for (const [key, value] of Object.entries(this.exchangeSelect.strategy)) {
                    if (value.enable) {
                        this.strategySelect.push({
                            ...value,
                            enable: false,
                        })
                    }
                }

                // for (let index = 0; index < this.exchangeSelect.strategy.length; index++) {
                //     const element = this.exchangeSelect.strategy[index];
                //     if (element.enable) {
                //         this.strategySelect.push({
                //             ...element,
                //             enable: false,
                //         })
                //     }
                // }
            }

            if (this.strategySelect.length > 0) {
                this.strategyOptionSelect(0)
            }
        },
        formSubmitted() {
            this.$http.post('/exchange-setting/add', {
                exchange: this.exchangeSelect.id,
                strategy: this.strategySelect,
                orderAmount: this.orderAmount,
                orderLeverage: this.orderLeverage,
                takeprofit: this.takeprofit,
                stoploss: this.stoploss,
                callbackRate: this.callbackRate,
                dca: this.dca
            })
            .then(res => {
                if (res.data.code) {
                    this.$toast({
                        component: ToastificationContent,
                        props: {
                            title: res.data.msg,
                            icon: 'EditIcon',
                            variant: 'success',
                        },
                    })

                    this.$router.push({ name: 'user-exchange'})
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
    },
}
</script>

<style lang="scss">
@import '@core/scss/vue/libs/vue-wizard.scss';
@import '@core/scss/vue/libs/vue-select.scss';
</style>


<style scoped>
.strategy-item {
    display: flex;
    align-items: center;
    margin: 10px 0px;
    padding: 6px;
    background-color: #f3f3f3;
    border-radius: 20px;
    cursor: pointer;
}

.strategy-item.selected {
    background-color: #ea5455 !important;
    color: #fff;
}
</style>