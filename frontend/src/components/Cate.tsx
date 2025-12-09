import { theme } from "@/theme";
import { FileCate } from "@/utils/enum";
import { Chip, rgbToHex, Stack } from "@mui/material"



const CATE = Object.values(FileCate);

interface Props {
    onClick: (label: FileCate) => void
    currentCate: FileCate
}
/**
 * 筛选分类
 */
const Cate: React.FC<Props> = ({
    onClick,
    currentCate
}) => {

    return <Stack direction='row' spacing={1}>
        {CATE.map(cate => {
            return <Chip
                key='cate'
                label={cate}
                onClick={() => onClick(cate)}
                variant='filled'
                color={currentCate === cate ? 'primary' : 'info'}
                sx={{
                    opacity: currentCate === cate ? 1 : 0.65
                }}
            />
        })}
    </Stack>
}

export default Cate