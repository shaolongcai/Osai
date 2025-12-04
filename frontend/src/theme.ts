import { createTheme } from "@mui/material";
// When using TypeScript 3.x and below
// import '@mui/lab/themeAugmentation';

//主题
export const theme = createTheme({

    //组件
    components: {

        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: '16px',
                    padding: '24px',
                    //表格中的paper圆角
                    '&.MuiTableContainer-root': {
                        borderRadius: '4px',
                    },
                    //Drawer组件中的Paper圆角为0
                    '&.MuiDrawer-paper': {
                        borderRadius: '0px',
                    },
                    //菜单组件中的Paper圆角为4px
                    '&.MuiMenu-paper': {
                        borderRadius: '4px',
                    },
                    // 当Paper组件elevation为1时  阴影
                    '&.MuiPaper-elevation1': {
                        boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.08)',
                    }
                },
            }
        },

        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '16px',
                    // 变体为elevation时  阴影
                    '&.MuiCard-elevation': {
                        boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.08)',
                    }
                }
            }
        },

        MuiChip: {
            styleOverrides: {
                colorPrimary: {
                    // 只有在filled变体时才应用这个背景色
                    '&.MuiChip-filled': {
                        backgroundColor: '#DBF0FF',
                        color: '#1890FF', // 设置文字颜色，与主题色匹配
                    }
                },
                outlinedPrimary: {
                    borderColor: '#3AACFF',
                    color: '#1890FF',
                }
            }
        },

        // 更具体的图标颜色设置
        MuiSvgIcon: {
            styleOverrides: {
                root: {
                    '&.MuiChip-deleteIcon': {
                        color: '#3AACFF', // 只对Button组件的图标应用
                    }
                }
            }
        },


        // MuiButton: {
        //     styleOverrides: {
        //         //全局定制按钮样式
        //         root: {
        //             borderRadius: '4px',
        //             padding: '10px 24px',
        //             fontSize: '14px',
        //             lineHeight: '20px',
        //             fontWeight: 500,
        //         },
        //         containedSecondary: {
        //             color: '#fff',
        //         },
        //     },
        // },
    },

    //字体
    typography: {
        //页面大标题
        headlineLarge: {
            fontSize: '32px',
            lineHeight: '40px',
            fontWeight: "bold",
        },
        //页面中标题
        headlineMedium: {
            fontSize: '28px',
            lineHeight: '36px',
            fontWeight: "bold",
        },
        //页面小标题
        headlineSmall: {
            fontSize: '24px',
            lineHeight: '32px',
            fontWeight: "bold",
        },
        //卡片等大标题
        titleLarge: {
            fontSize: '22px',
            lineHeight: '28px',
            fontWeight: "bold",
        },

        //卡片等中标题
        titleMedium: {
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: "bold",
        },

        //卡片等小标题
        titleSmall: {
            fontSize: '14px',
            lineHeight: '20px',
            fontWeight: "bold",
        },

        //大标签
        labelLarge: {
            fontSize: '14px',
            lineHeight: '20px',
            fontWeight: 'Regular',
        },
        //中标签
        labelMedium: {
            fontSize: '12px',
            lineHeight: '16px',
            fontWeight: 'Regular',
        },
        //小标签
        labelSmall: {
            fontSize: '11px',
            lineHeight: '16px',
            fontWeight: 'Regular',
        },

        //内容文字
        bodyLarge: {
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: 'Regular',
        },

        bodyMedium: {
            fontSize: '14px',
            lineHeight: '20px',
            fontWeight: 'Regular',
        },

        //内容文字(小号)
        bodySmall: {
            fontSize: '12px',
            lineHeight: '16px',
            fontWeight: 'Regular',
        },
    },

    // color: {
    //     onBg: '#1A1C1EFF', //在背景上的颜色
    //     surface: '#FCFCFF', //中性颜色
    //     onSurface: '#1A1C1E', //在中性颜色上
    //     surfaceVariant: "#DEE3EB", //中性变体颜色
    //     onSurfaceVariant: "#42474E", //在中性变体颜色上
    //     primary: '#006397', //主题色
    //     second: '#51606F', //次要色
    //     tertiary:'#67587A', //第三色
    //     error: '#BA1A1A', //错误色
    // },

    //调色板
    palette: {
        primary: {
            main: '#1890FF',
        },
        // secondary: {
        //     main: '#D4E4F6',
        // },
        error: {
            main: '#FF4D4F',
        },
    }
})