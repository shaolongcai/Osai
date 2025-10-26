import { Stack, Typography } from "@mui/material"
import Dialog from "../Dialog/Dialog"
import image from '@/assets/images/ai-mark.png'



const UpdateTipsDialog = ({ open, onClose }: { open: boolean, onClose: () => void }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            title="版本更新介绍"
            primaryButtonText="知道了"
            onPrimaryButtonClick={onClose}
        >
            <Stack alignItems="center">
                <img src={image} alt="" style={{ width: 400, marginBottom: 2 }} />
                <Typography variant="bodyMedium" sx={{
                    whiteSpace: "pre-line",
                    color: 'rgba(0, 0, 0, 0.85) !important',
                    lineHeight: 1.8,
                }}>
                    {`📌 新增AI Mark功能：你可以让AI帮你记住任何文件，以便让你后续可以更快地找到文件，或者询问问题。
📌 OCR功能：为了节省电脑资源，现在视觉索引会由OCR服务提供：只会摘取图片中的文字，不再使用AI模型摘要图片。若有需要，可以对图片使用AI Mark。
📌 增加右键菜单：你可以使用鼠标对着搜索结果敲击鼠标右键，可以使用AI Mark功能。`}
                </Typography>
            </Stack>
        </Dialog>
    )
}

export default UpdateTipsDialog
