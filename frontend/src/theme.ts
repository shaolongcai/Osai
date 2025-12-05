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
                    // // Card 中的paper
                    // '&.MuiCard-root': {
                    //     borderRadius: '16px',
                    //     boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.08)',
                    // },

                    // //表格中的paper圆角
                    // '&.MuiTableContainer-root': {
                    //     borderRadius: '4px',
                    // },
                    // //Drawer组件中的Paper圆角为0
                    // '&.MuiDrawer-paper': {
                    //     borderRadius: '0px',
                    // },
                    // //菜单组件中的Paper圆角为4px
                    // '&.MuiMenu-paper': {
                    //     borderRadius: '4px',
                    // },
                    // // 当Paper组件elevation为1时  阴影
                    // '&.MuiPaper-elevation1': {
                    //     padding: '24px',
                    //     boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.08)',
                    // },
                    // '&.MuiPaper-elevation0': {
                    //     padding: '8px',
                    //     // boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.08)',
                    // }
                },
            }
        },

        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '16px',
                    padding: '24px',
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

        // 字体
        MuiTypography: {
            styleOverrides: {
                root: {

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


    //调色板
    palette: {
        text: {
            primary: 'rgba(0, 0, 0, 0.85)', //在背景上的颜色
            secondary: 'rgba(0, 0, 0, 0.65)',
            tertiary: 'rgba(0, 0, 0, 0.45)',
            disabled: 'rgba(0, 0, 0, 0.25)',
        },
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