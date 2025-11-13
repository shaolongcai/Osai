import { Box, Chip, ClickAwayListener, Menu, MenuItem, Paper, Tooltip } from "@mui/material"
import React, { useEffect, useMemo, useState } from "react";
import styles from './TableRelust.module.scss'
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow, { TableRowProps } from '@mui/material/TableRow';
import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import dayjs from "dayjs";
import { getFileTypeByExtension } from "@/utils/tools";
import {
    ArrowDropUp as UpwardIcon,
    ArrowDropDown as DownwardIcon,
} from "@mui/icons-material";
import AIMarkDialog from "../AIMarkDialog/AIMarkDialog";
import { useGlobalContext } from "@/contexts/globalContext";
import { useTranslation } from '@/contexts/I18nContext'


interface Props {
    sortedData: SearchDataItem[]
    sortConfig: {
        key: string | null;
        direction: 'asc' | 'desc' | null;
    },
    setSortConfig: (config: {
        key: string | null;
        direction: 'asc' | 'desc' | null;
    }) => void
}

/**
 * 搜索后，表格呈现的结果组件
 */
const TableRelust: React.FC<Props> = ({
    sortedData,
    sortConfig,
    setSortConfig,
}) => {

    const [isShowAIMark, setIsShowAIMark] = useState(true); // 是否显示AImark功能
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        item: SearchDataItem | null;
    } | null>(null);
    const [aiMarkDialogOpen, setAIMarkDialogOpen] = useState(false);

    const context = useGlobalContext(); //使用在内存的配置
    const { t } = useTranslation();


    // 处理右键点击事件
    const handleContextMenu = (event: React.MouseEvent, item: SearchDataItem) => {
        event.preventDefault();
        setContextMenu({
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
            item: item,
        });
    };

    // 关闭右键菜单
    const handleClose = () => {
        setContextMenu(null);
    };

    // 菜单项点击处理
    const handleMenuItemClick = (action: 'openFile' | 'openFolder' | 'aiMark') => {
        if (!contextMenu?.item) return;

        const item = contextMenu.item;
        const isAIMarkDialogOpen = Number(localStorage.getItem('isAIMarkDialogOpen')) || 0 //是否已经弹出过AI提示窗
        switch (action) {
            case 'openFile':
                // 打开文件
                window.electronAPI.openDir('openFile', item.path);
                if (!context.isReadyAI && !isAIMarkDialogOpen) {
                    localStorage.setItem('isAIMarkDialogOpen', '1');
                    setAIMarkDialogOpen(true);
                }
                break;
            case 'openFolder':
                // 打开所在文件夹
                window.electronAPI.openDir('openFileDir', item.path);
                if (!context.isReadyAI && !isAIMarkDialogOpen) {
                    localStorage.setItem('isAIMarkDialogOpen', '1');
                    setAIMarkDialogOpen(true);
                }
                break;
            case 'aiMark':
                const isReadyAI = context.isReadyAI;
                if (isReadyAI) {
                    window.electronAPI.aiMark(item.path);
                }
                else {
                    // 打开弹窗
                    setAIMarkDialogOpen(true);
                }
                break;
            default:
                break;
        }

        handleClose();
    };


    const columns: ColumnData[] = [
        {
            width: 60,
            label: t('app.table.columns.name'),
            dataKey: 'name',

        },
        {
            width: 100,
            label: t('app.table.columns.path'),
            dataKey: 'path',
            styles: {
                fontColor: '#00000065',
            },
            // render: (value) => {
            //     return <Tooltip title={value}>
            //         <div style={{
            //             whiteSpace: 'nowrap',
            //             overflow: 'hidden',
            //             textOverflow: 'ellipsis',
            //         }}>
            //             {value}
            //         </div>
            //     </Tooltip>
            // },
        },
        {
            width: 50,
            label: t('app.table.columns.modifiedAt'),
            dataKey: 'modified_at',
            styles: {
                fontColor: '#00000065',
            },
            render: (value) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
            sortable: true
        },
        {
            width: 50,
            label: t('app.table.columns.fileType'),
            dataKey: 'ext',
            styles: {
                fontColor: '#00000065',
            },
            render: (value) => getFileTypeByExtension(value as string),
            sortable: true // 标记该列可排序
        },
    ];


    // 通用排序处理函数
    const handleSort = (columnKey: string) => {
        let direction: 'asc' | 'desc' | null = 'asc';

        if (sortConfig.key === columnKey) {
            if (sortConfig.direction === 'asc') {
                direction = 'desc';
            } else if (sortConfig.direction === 'desc') {
                direction = null;
            }
        }

        setSortConfig({ key: columnKey, direction });
    };

    // 通用的排序图标渲染函数
    const renderSortIcon = (columnKey: string) => {
        if (sortConfig.key !== columnKey) {
            return (
                <>
                    <UpwardIcon sx={{ fontSize: 14, marginBottom: '-8px', color: 'rgba(0, 0, 0, 0.65)' }} />
                    <DownwardIcon sx={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.65)' }} />
                </>
            );
        }

        if (sortConfig.direction === 'asc') {
            return <UpwardIcon sx={{ fontSize: 14, color: '#1976d2' }} />;
        } else if (sortConfig.direction === 'desc') {
            return <DownwardIcon sx={{ fontSize: 14, color: '#1976d2' }} />;
        }

        return (
            <>
                <UpwardIcon sx={{ fontSize: 14, marginBottom: '-8px', color: 'rgba(0, 0, 0, 0.65)' }} />
                <DownwardIcon sx={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.65)' }} />
            </>
        );
    };

    // 固定的表头
    function fixedHeaderContent() {
        return (
            <TableRow>
                {columns.map((column) => (
                    <TableCell
                        key={column.dataKey}
                        onClick={column.sortable ? () => handleSort(column.dataKey) : undefined}
                        variant="head"
                        align={column.numeric || false ? 'right' : 'left'}
                        style={{ width: column.width }}
                        sx={{
                            cursor: column.sortable ? 'pointer' : 'default',
                            backgroundColor: '#FAFDFC;',
                            borderBottom: 'none',
                            // borderRight: '1px solid #cccccc',
                            height: '8px',
                            fontSize: '14px',
                            color: '#00000085',
                            fontWeight: 600,
                            p: '8px',
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={0.5}>
                            {column.label}
                            {column.sortable && (
                                <Box display="flex" flexDirection="column" sx={{ opacity: 0.6 }}>
                                    {renderSortIcon(column.dataKey)}
                                </Box>
                            )}
                        </Box>
                    </TableCell>
                ))}
            </TableRow>
        );
    }

    // 表格内容
    function rowContent(index: number, row: SearchDataItem) {
        return (
            <React.Fragment>
                {columns.map((column) => (
                    <TableCell
                        key={column.dataKey}
                        align={column.numeric || false ? 'right' : 'left'}
                        sx={{
                            borderBottom: 'none',
                            p: '8px', //row内边距
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: sortedData[index].ai_mark === 1 ? '#4F5494' : '#00000065',
                        }}
                    >
                        {column.render ? column.render(row[column.dataKey]) : row[column.dataKey]}
                    </TableCell>
                ))}
            </React.Fragment>
        );
    }

    //表格内容
    // 使用 useMemo 缓存 VirtuosoTableComponents，避免每次渲染都重新创建
    const VirtuosoTableComponents: TableComponents<SearchDataItem> = useMemo(() => ({
        Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
            <TableContainer component={Paper} {...props} ref={ref}
                sx={{
                    boxShadow: 'none',
                    border: 'none',
                    // 使用 ::-webkit-scrollbar 系列伪元素来自定义滚动条
                    // 这些样式会覆盖浏览器默认的滚动条外观
                    '&::-webkit-scrollbar': {
                        width: '6px', // 滚动条宽度
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'transparent', // 轨道背景透明
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0, 0, 0, 0.2)', // 滑块颜色
                        borderRadius: '3px', // 滑块圆角
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.4)', // 鼠标悬停时滑块颜色变深
                    },
                }}
            />
        )),
        Table: (props) => (
            <Table {...props} sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }} />
        ),
        TableHead: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
            <TableHead {...props} ref={ref} />
        )),
        TableRow: (props: TableRowProps & { item: SearchDataItem }) => {
            const { item, ...rest } = props;
            const handleRowClick = () => {
                if (item) {
                    window.electronAPI.openDir('openFileDir', item.path);
                    const isAIMarkDialogOpen = Number(localStorage.getItem('isAIMarkDialogOpen')) || 0
                    // 没有准备AI功能则弹窗提示(没有弹过窗时)
                    if (!context.isReadyAI && !isAIMarkDialogOpen) {
                        localStorage.setItem('isAIMarkDialogOpen', '1');
                        setAIMarkDialogOpen(true);
                    }
                }
            };
            // 处理右键菜单
            const handleRowContextMenu = (event: React.MouseEvent) => {
                setIsShowAIMark(true);
                // 文件夹不显示AI mark
                if (!item.ext) {
                    setIsShowAIMark(false);
                }
                handleContextMenu(event, item);
            };
            return <TableRow {...rest} onClick={handleRowClick} onContextMenu={handleRowContextMenu} />;
        },
        TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
            <TableBody {...props} ref={ref}
                sx={{
                    '& .MuiTableRow-root:hover': {
                        backgroundColor: '#1890FF25', // 应用您想要的蓝色背景
                        cursor: 'pointer',
                        // transition: 'background-color 0.1s ease',

                        // b. 为该行的第一个单元格设置左侧圆角
                        '& .MuiTableCell-root:first-of-type': {
                            borderRadius: '8px 0 0 8px',
                        },
                        // c. 为该行的最后一个单元格设置右侧圆角
                        '& .MuiTableCell-root:last-of-type': {
                            borderRadius: '0 8px 8px 0',
                        },
                    },
                }}
            />
        )),
    }), []); // 依赖为空数组，确保只在组件挂载时创建一次

    return <Box className={styles.table}>
        <AIMarkDialog
            open={aiMarkDialogOpen}
            onClose={() => setAIMarkDialogOpen(false)}
        />
        <TableVirtuoso
            className={styles.TableContainer}
            fixedHeaderContent={fixedHeaderContent}
            data={sortedData}
            components={VirtuosoTableComponents}
            itemContent={rowContent}
        />
        <ClickAwayListener onClickAway={handleClose}>
            <Menu
                disableAutoFocus={true}
                disableEnforceFocus={true}
                disableRestoreFocus={true}
                open={contextMenu !== null}
                onClose={handleClose}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
                slotProps={{
                    root: {
                        style: {
                            // 限制大小，否则会挡着整个表格
                            width: '200px',
                            height: '300px'
                        }
                    },
                    paper: {
                        style: {
                            color: 'rgba(0, 0, 0, 0.65)',
                            borderRadius: '16px',
                        }
                    }
                }}
                hideBackdrop={true}
            >
                <MenuItem sx={{ fontSize: '14px' }} onClick={() => handleMenuItemClick('openFile')}>{t('app.table.menu.openFile')}</MenuItem>
                <MenuItem sx={{ fontSize: '14px' }} onClick={() => handleMenuItemClick('openFolder')}>{t('app.table.menu.openFolder')}</MenuItem>
                {
                    isShowAIMark &&
                    <MenuItem sx={{ fontSize: '14px', color: '#FF4D4F' }} onClick={() => handleMenuItemClick('aiMark')}>
                        {t('app.table.menu.aiMark')}
                    </MenuItem>
                }
            </Menu>
        </ClickAwayListener>
    </Box>
}

export default TableRelust