import { Paper, Stack, Typography } from "@mui/material";
import styles from './SearchPanel.module.scss'
import placeholder from '@/assets/images/weChat.png'


interface SearchResultItemProps {
    name: string;
    icon?: string;
}
/**
 * 搜索的结果项目
 */
const SearchResultItem: React.FC<SearchResultItemProps> = ({
    name,
    icon,
}) => {
    return <Paper
        elevation={0}
        className={styles.searchResultItem}
    >
        <Stack direction='row' spacing={1} alignItems="center">
            <img src={placeholder} />
            <Stack justifyContent='space-between'>
                <Typography variant="titleLarge" sx={{
                    fontWeight: 'bold',
                    color: 'rgba(0, 0, 0,0.85)'
                }}>
                    {name}
                </Typography>
                {/* <Typography>
                    将来放地址
                </Typography> */}
            </Stack>
        </Stack>
    </Paper>
}



interface Props {
    data: shortSearchDataItem[];
}
const SearchPanel: React.FC<Props> = ({
    data,
}) => {
    return <Paper
        elevation={3}
        className={styles.root}
    >
        <Stack spacing={2} alignItems='flex-start'>
            {data.map((item) => (
                <div key={item.id} 
                className={styles.searchResultItem}
                onClick={() => {
                    console.log('点击了', item.path);
                    window.electronAPI.openDir('openFile', item.path);
                }}>
                    <SearchResultItem name={item.name} icon={item.icon} />
                </div>
            ))}
        </Stack>
    </Paper>
}

export default SearchPanel;