module.exports = [
    {
        strategy_name:"ma_rsi_long",
        options: {
            ma_length_1:10,
            ma_length_2:20,
            rsi_length:14,
            rsi_top:80,
            rsi_bot:40,
            open_difference:1,
            close_difference:1
        },
        enable: false,
    },
    {
        strategy_name:"ma_rsi_short",
        options: {
            ma_length_1:10,
            ma_length_2:20,
            rsi_length:14,
            rsi_top:80,
            rsi_bot:40,
            open_difference:1,
            close_difference:1
        },
        enable: false,
    },
    {
        strategy_name:"rsi_long",
        options: {
            rsi_length:14,
            rsi_top:80,
            rsi_bot:40,
        },
        enable: false,
    },
    {
        strategy_name:"rsi_short",
        options: {
            rsi_length:14,
            rsi_top:80,
            rsi_bot:40,
        },
        enable: false,
    },
]