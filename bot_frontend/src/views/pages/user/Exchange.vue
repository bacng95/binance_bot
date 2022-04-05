<template>
    <div>
        <b-modal size="lg" id="modal-edit-strategy" centered :title="exchangeEdit.type + '_' + exchangeEdit.symbol + ' settings'" ok-title="Lưu thay đổi" @ok="exchangeSetingChange">
            <b-card-text>
                <b-tabs>
                    <b-tab title="Cài đặt lệnh vào">
                        <b-col md="12">
                            <b-form-group label="Số lượng vào lệnh (USDT)">
                                <b-form-input v-model="exchangeEdit.orderAmount" type="number" />
                            </b-form-group>
                            <b-form-group label="Đòn bảy">
                                <b-form-input v-model="exchangeEdit.orderLeverage" type="number" />
                            </b-form-group>
                        </b-col>
                    </b-tab>
                    <b-tab title="TP/SL">
                        <b-col md="12">
                            <b-form-group label="Take profit so với điểm vào lệnh (%)">
                                <b-form-input v-model="exchangeEdit.takeprofit" type="number" />
                            </b-form-group>
                            <b-form-group label="Stoploss so với điểm vào lệnh (%)">
                                <b-form-input v-model="exchangeEdit.stoploss" type="number" />
                            </b-form-group>
                        </b-col>
                    </b-tab>
                    <b-tab title="Trailing stop">
                        <b-col md="12">
                            <b-form-group label="Tỉ lệ hồi vốn (%)">
                                <b-form-input v-model="exchangeEdit.callbackRate" type="number" />
                            </b-form-group>
                        </b-col>
                    </b-tab>
                    <b-tab title="Chiến thuật">
                        <b-row>
                            <b-col md="6">
                                <div class="strategy-list">
                                    <div class="strategy-item" @click="strategySelectIndex = index" :class="{ 'selected': strategySelectIndex == index }" v-for="(item, index) in exchangeEdit.strategy" :key="index">
                                        <b-form-checkbox v-model="exchangeEdit.strategy[index].enable" class="custom-control-success" name="check-button" switch />
                                        <b-card-text class="mb-0">{{ item.strategy_name }}</b-card-text>
                                    </div>
                                </div>
                            </b-col>
                            <b-col md="6" v-if="strategySelectIndex !== null">
                                <b-form-group v-for="(item, index) in exchangeEdit.strategy[strategySelectIndex].options" :key="index" :label="strategyText(index).title" :label-for="index">
                                    <b-form-input type="number" v-model="exchangeEdit.strategy[strategySelectIndex].options[index]" :id="index" :placeholder="strategyText(index).description" />
                                </b-form-group>
                            </b-col>
                        </b-row>
                    </b-tab>
                    <b-tab title="DCA" v-if="exchangeEdit.dca">
                        <b-col md="12" class="mb-1">
                            <b-form-checkbox v-model="exchangeEdit.dca.buyState" name="check-button" switch inline>DCA Lệnh mua</b-form-checkbox>
                        </b-col>
                        <b-col md="12" class="mb-1">
                            <b-form-checkbox v-model="exchangeEdit.dca.sellState" name="check-button" switch inline>DCA Lệnh bán khống</b-form-checkbox>
                        </b-col>
                        <b-col md="12">
                            <b-form-group label="Số lần DCA" label-for="order-take-profit">
                                <b-form-input type="number" id="order-take-profit" v-model="exchangeEdit.dca.dcaLenght" placeholder="Số lần DCA" />
                            </b-form-group>
                        </b-col>
                        <b-col md="12">
                            <b-form-group label="Giá trị bước nhảy DCA (%)" label-for="order-take-profit">
                                <b-form-input type="number" id="order-take-profit" v-model="exchangeEdit.dca.step" placeholder="Giá trị bước nhảy DCA" />
                            </b-form-group>
                        </b-col>
                    </b-tab>
                </b-tabs>
            </b-card-text>
        </b-modal>
        <b-card>
            <b-card-text>
                <b-row>
                    <b-col md="9">
                    </b-col>
                    <b-col md="3">
                        <b-button :to="{name:'user-exchange-add'}" variant="success" class="w-100 mr-1">Add new trade</b-button>
                    </b-col>
                </b-row>
            </b-card-text>
        </b-card>
        <b-card no-body class="card-company-table">
            <b-table :items="tableData" responsive :fields="fields" class="mb-0">
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
                <template #cell(status)="data">
                    <div class="d-flex align-items-center">
                        <b-badge :variant="data.item.status ? 'success' : 'danger'" class="badge-glow">{{ data.item.status ? 'Enabled' : 'Disabled' }}</b-badge>
                    </div>
                </template>
                <template #cell(type)="data">
                    <div class="d-flex align-items-center">
                        <b-badge :variant="data.item.type === 'SPOT' ? 'secondary' : 'dark'">{{ data.item.type }}</b-badge>
                    </div>
                </template>
                <template #cell(action)="data">
                    <div class="d-flex align-items-center">
                        <b-button @click="openModalChangeSettings(data.item)" class="mr-1" size="sm" variant="info">Settings</b-button>
                        <b-button @click="changeStatus(data.item.id)" size="sm" variant="secondary">{{ !data.item.status ? 'Enabled' : 'Disabled' }}</b-button>
                    </div>
                </template>
            </b-table>
        </b-card>
    </div>
</template>


<script>

import {
    BCard,
    BCardText,
    BRow,
    BCol,
    BFormGroup,
    BFormSelect,
    BFormInput,
    BFormCheckbox,
    BTable,
    BAvatar,
    BImg,
    BBadge,
    BButton,
    BModal,
    BTab,
    BTabs
} from 'bootstrap-vue'

import ToastificationContent from '@core/components/toastification/ToastificationContent.vue'
import strategyTextDefine from '../strategy-define'

export default {
    components: {
        BCard,
        BCardText,
        BRow,
        BCol,
        BFormGroup,
        BFormSelect,
        BFormInput,
        BFormCheckbox,
        BTable,
        BAvatar,
        BImg,
        BBadge,
        BButton,
        BModal,
        BTab,
        BTabs
    },
    data() {
        return {
            symbolFilter: '',
            typeChoose: null,
            typeOptions: [
                { value: null, text: "Tất cả" },
                { value: "FUTURE", text: "FUTURE" },
                { value: "SPOT", text: "SPOT" },
            ],
            statusChoose: 1,
            statusOptions: [
                { value: null, text: "Tất cả" },
                { value: 0, text: "Disabled" },
                { value: 1, text: "Enabled" },
            ],
            fields: [
                { key: 'symbol', label: 'SYMBOL' },
                { key: 'type', label: 'TYPE' },
                { key: 'status', label: 'TRADE STATUS' },
                { key: 'action', label: 'ACTION' },
            ],
            tableData: [],
            exchangeEdit: {},
            strategySelectIndex: null
        }
    },
    computed: {
        tableDataFilter () {
            return this.tableData.filter(el => {
                return (this.typeChoose ? el.type == this.typeChoose : true) && (this.symbolFilter ? el.symbol == this.symbolFilter : true) && (this.statusChoose ? el.enable == this.statusChoose : true)
            })
        }
    },
    created() {
        this.fetchData()
    },
    methods: {
        exchangeSetingChange() {
            this.$http.post('/exchange-setting/edit', {
                exchange_id: this.exchangeEdit.id,
                strategy: this.exchangeEdit.strategy,
                orderAmount: this.exchangeEdit.orderAmount,
                orderLeverage: this.exchangeEdit.orderLeverage,
                takeprofit: this.exchangeEdit.takeprofit,
                stoploss: this.exchangeEdit.stoploss,
                callbackRate: this.exchangeEdit.callbackRate,
                dca: this.exchangeEdit.dca,
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

                    this.fetchData()
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
        strategyText (key) {
            let result = {
                title: '',
                description: ''
            }
            if (strategyTextDefine[key]) { result = strategyTextDefine[key] }
            return result
        },
        openModalChangeSettings(item) {
            this.exchangeEdit = item
            this.strategySelectIndex = 0
            this.$bvModal.show('modal-edit-strategy')
        },
        changeStatus(id) {

            const exchange = this.tableData.find(el => el.id === id)

            this.$bvModal
            .msgBoxConfirm(`${exchange.status ? 'Disbale' : 'Enable'} ${exchange.type}_${exchange.symbol}`, {
                title: 'Please Confirm',
                size: 'sm',
                okVariant: 'primary',
                okTitle: 'Yes',
                cancelTitle: 'No',
                cancelVariant: 'outline-secondary',
                hideHeaderClose: false,
                centered: true,
            })
            .then(value => {
                if (value) {
                    this.$http.post('/exchange-setting/change-status', {
                        id,
                        status: exchange.status ? 0 : 1
                    })
                    .then( res => {
                        if (res.data.code === 1) {
                            this.$toast({
                                component: ToastificationContent,
                                props: {
                                    title: 'Thành công',
                                    icon: 'CheckIcon',
                                    variant: 'success',
                                }
                            })

                            this.fetchData()
                        } else {
                            this.$toast({
                                component: ToastificationContent,
                                props: {
                                    title: res.data.msg,
                                    icon: 'XIcon',
                                    variant: 'danger',
                                }
                            })
                        }
                    })
                }
            })
        },
        fetchData() {
            this.$http.get('/exchange-setting/user-list')
            .then((requrest) => {
                if (requrest.data.code == 1) {
                    this.tableData = requrest.data.data
                }
            })
        },
    }
}
</script>

<style lang="scss" scoped>
@import '~@core/scss/base/bootstrap-extended/include';
@import '~@core/scss/base/components/variables-dark';

.card-company-table ::v-deep td .b-avatar.badge-light-company {
    .dark-layout & {
        background: $theme-dark-body-bg !important;
    }
}
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