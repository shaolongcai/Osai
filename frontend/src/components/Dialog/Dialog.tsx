import React, { ReactNode } from 'react';
import {
    Dialog as MuiDialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    Typography
} from '@mui/material';
import styles from './Dialog.module.scss';
import { Close } from '@mui/icons-material';

/**
 * 对话框组件属性接口
 */
interface DialogProps {
    /**
     * 对话框标题
     */
    title?: string;
    /**
     * 是否打开对话框
     */
    open: boolean;
    /**
     * 关闭对话框的回调函数
     */
    onClose: () => void;
    /**
     * 主要按钮文本
     */
    primaryButtonText?: string;
    /**
     * 次要按钮文本
     */
    secondaryButtonText?: string;
    /**
     * 主要按钮点击回调
     */
    onPrimaryButtonClick?: () => void;
    /**
     * 次要按钮点击回调
     */
    onSecondaryButtonClick?: () => void;
    /**
     * 是否禁用主要按钮
     */
    primaryButtonDisabled?: boolean;
    /**
     * 对话框内容
     */
    children: React.ReactNode;
    /**
     * 对话框最大宽度
     */
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
    /**
     * 是否全屏显示
     */
    fullWidth?: boolean;
    icon?: ReactNode; //标题icon
    tips?: ReactNode | string; //对话框左下角的提示信息
    primaryButtonColor?: "primary" | "secondary" | "inherit" | "success" | "error" | "warning" | "info";
    loading?: boolean; //是否显示loading
    hideBackdrop?: boolean; //是否隐藏 backdrop
}

/**
 * 通用对话框组件
 * 可自定义标题、按钮和内容
 * @params fullWidth 全屏显示
 * @params maxWidth 最大宽度
 * @params children 子元素
 */
const Dialog: React.FC<DialogProps> = ({
    title,
    open,
    onClose,
    primaryButtonText,
    secondaryButtonText,
    onPrimaryButtonClick,
    onSecondaryButtonClick,
    primaryButtonDisabled = false,
    children,
    maxWidth = 'sm',
    fullWidth = true,
    icon,
    tips,
    primaryButtonColor = 'primary',
    loading = false,
    hideBackdrop = false,
}) => {
    /**
     * 处理主要按钮点击
     */
    const handlePrimaryButtonClick = () => {
        if (onPrimaryButtonClick) {
            onPrimaryButtonClick();
        }
    };

    /**
     * 处理次要按钮点击
     */
    const handleSecondaryButtonClick = () => {
        if (onSecondaryButtonClick) {
            onSecondaryButtonClick();
        } else {
            onClose();
        }
    };

    return (
        <MuiDialog
            open={open}
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth={fullWidth}
            className={styles.dialog}
            hideBackdrop={hideBackdrop}
        >
            {title && (
                <DialogTitle className={styles.dialogTitle}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        {icon && <div className={styles.iconContainer}>{icon}</div>}
                        <Typography variant="h6" className={styles.text}>{title}</Typography>
                    </Stack>
                    <Close className={styles.close} onClick={onClose} />
                </DialogTitle>
            )}
            <DialogContent className={styles.dialogContent}>
                {children}
            </DialogContent>
            {(primaryButtonText || secondaryButtonText) && (
                <DialogActions className={styles.dialogActions}>
                    <Typography className={styles.tips}>
                        {tips && tips}
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        {secondaryButtonText && (
                            <Button
                                sx={{
                                    borderRadius: 2,
                                }}
                                size='large'
                                onClick={handleSecondaryButtonClick}
                                variant="outlined"
                                color="inherit"
                            >
                                {secondaryButtonText}
                            </Button>
                        )}
                        {primaryButtonText && (
                            <Button
                                sx={{
                                    borderRadius: 2,
                                }}
                                size='large'
                                loading={loading}
                                onClick={handlePrimaryButtonClick}
                                variant="contained"
                                color={primaryButtonColor}
                                disabled={primaryButtonDisabled}
                            >
                                {primaryButtonText}
                            </Button>
                        )}
                    </Stack>
                </DialogActions>
            )}
        </MuiDialog>
    );
};

export default Dialog;