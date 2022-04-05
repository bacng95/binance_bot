<template>
    <div>
        <b-modal size="lg" id="modal-edit-strategy" centered :title="exchangeEdit.type + '_' + exchangeEdit.symbol + ' settings'" ok-title="Lưu thay đổi" @ok="exchangeSetingChange">
            <b-card-text>
                <b-form-checkbox v-model="exchangeEdit.enable" name="check-button" switch inline >Kích hoạt</b-form-checkbox>
                <hr>
                <b-tabs>
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
                </b-tabs>
            </b-card-text>
        </b-modal>
        <b-card>
            <b-card-text>
                <b-row>
                    <!-- <b-col md="3">
                        <b-form-group label="Type" label-for="v-to-class">
                            <b-form-select v-model="typeChoose" :options="typeOptions" id="v-to-class"/>
                        </b-form-group>
                    </b-col> -->
                    <b-col md="3">
                        <b-form-group label="Symbol" label-for="v-to-age">
                            <b-form-input v-model="symbolFilter" placeholder="Symbol" id="v-to-age" />
                        </b-form-group>
                    </b-col>
                    <b-col md="3">
                        <b-form-group label="Status" label-for="v-to-class">
                            <b-form-select v-model="statusChoose" :options="statusOptions" id="v-to-class"/>
                        </b-form-group>
                    </b-col>
                    <!-- <b-col md="3">
                        <b-form-group label="-">
                            <b-button @click="fetchData" type="submit" variant="primary" class="w-100 mr-1">FILLTER</b-button>
                        </b-form-group>
                    </b-col> -->
                </b-row>
            </b-card-text>
        </b-card>
        <b-card no-body class="card-company-table">
            <b-table :items="tableDataFilter" responsive :fields="fields" class="mb-0">
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
                <template #cell(enable)="data">
                    <div class="d-flex align-items-center">
                        <b-badge :variant="data.item.enable ? 'success' : 'danger'" class="badge-glow">{{ data.item.enable ? 'Enabled' : 'Disabled' }}</b-badge>
                    </div>
                </template>
                <template #cell(type)="data">
                    <div class="d-flex align-items-center">
                        <b-badge :variant="data.item.type === 'SPOT' ? 'secondary' : 'dark'">{{ data.item.type }}</b-badge>
                    </div>
                </template>
                <template #cell(action)="data">
                    <div class="d-flex align-items-center">
                        <b-button size="sm" @click="openModalChangeSettings(data.item)" variant="info" class="mr-1">Settings</b-button>
                        <!-- <b-button size="sm" @click="changeStatus(data.item.id)" variant="secondary">{{ !data.item.enable ? 'Enabled' : 'Disabled' }}</b-button> -->
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
    BTable,
    BAvatar,
    BImg,
    BBadge,
    BButton,
    BTab,
    BTabs,
    BFormCheckbox
} from 'bootstrap-vue'

import ToastificationContent from '@core/components/toastification/ToastificationContent.vue'
import strategyTextDefine from '../strategy-define'
import strategy from '../strategy'

export default {
    components: {
        BCard,
        BCardText,
        BRow,
        BCol,
        BFormGroup,
        BFormSelect,
        BFormInput,
        BTable,
        BAvatar,
        BImg,
        BBadge,
        BButton,
        BTab,
        BTabs,
        BFormCheckbox
    },
    data() {
        return {
            symbolFilter: '',
            typeChoose: 'FUTURE',
            typeOptions: [
                { value: null, text: "Tất cả" },
                { value: "FUTURE", text: "FUTURE" },
                { value: "SPOT", text: "SPOT" },
            ],
            statusChoose: null,
            statusOptions: [
                { value: null, text: "Tất cả" },
                { value: 0, text: "Disabled" },
                { value: 1, text: "Enabled" },
            ],
            fields: [
                { key: 'id', label: 'ID' },
                { key: 'symbol', label: 'SYMBOL' },
                { key: 'type', label: 'TYPE' },
                { key: 'enable', label: 'EXCHANGE STATUS' },
                { key: 'action', label: 'ACTION' },
            ],
            tableData: [],
            strategySelectIndex: null,
            exchangeEdit: {
                enable: false
            },
            strategy
        }
    },
    computed: {
        tableDataFilter () {
            return this.tableData.filter(el => {
                return (this.typeChoose ? el.type == this.typeChoose : true) && (this.symbolFilter ? el.symbol == this.symbolFilter.toUpperCase() : true) && (this.statusChoose ? el.enable == this.statusChoose : true)
            })
        }
    },
    created() {
        this.fetchData()
    },
    watch: {
        exchangeEdit: {
            handler(value) {
                // console.log(value)
            },
            deep: true
        }
    },
    methods: {
        exchangeSetingChange() {
            this.$http.post('/exchange/edit', {
                exchange: this.exchangeEdit,
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
            this.exchangeEdit = JSON.parse(JSON.stringify(item))
            this.exchangeEdit.enable = this.exchangeEdit.enable ? true: false
            this.exchangeEdit.strategy = Object.assign(this.strategy, this.exchangeEdit.strategy)
            this.strategySelectIndex = 0
            this.$bvModal.show('modal-edit-strategy')
        },
        changeStatus(id) {
            const exchange = this.tableData.find(el => el.id === id)

            this.$bvModal
            .msgBoxConfirm(`${exchange.enable ? 'Disbale' : 'Enable'} ${exchange.type}_${exchange.symbol}`, {
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
                    this.$http.post('/exchange/change-status', {
                        id,
                        status: exchange.enable ? 0 : 1
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
            this.$http.get('/exchange/list')
            .then((requrest) => {
                if (requrest.data.code == 1) {
                    this.tableData = requrest.data.data
                }
            })
        }
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