import { Button, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material"



interface Props {
    onFinish: () => void;
}

const AIProvider: React.FC<Props> = ({
    onFinish
}) => {
    return (
        <Paper elevation={1} className="w-[480px] min-h-[400px]">
            <Stack spacing={3} alignItems='center'>
                <Typography variant='headlineSmall' className="w-full text-left">
                    AI Provider
                </Typography>
                <Stack spacing={2} className="w-full" alignItems="center">
                    <Typography variant='titleSmall' color='text.secondary' className="w-full" >
                        Ollama
                    </Typography>
                    <TextField
                        label='API host'
                        variant='outlined'
                        fullWidth
                    />
                    <TextField
                        select
                        label='Model ID'
                        variant='outlined'
                        fullWidth
                    >
                        <MenuItem value='Qwen2.5:3b'>Qwen2.5:3b</MenuItem>
                        <MenuItem value='Qwen3:3b'>Qwen3:3b</MenuItem>
                    </TextField>
                    <Button
                        variant='contained'
                        className="w-fit"
                        fullWidth={false}
                        onClick={onFinish}
                    >
                        Apply
                    </Button>
                    <Button
                        variant='outlined'
                        className="w-fit"
                        fullWidth={false}
                        onClick={() => { onFinish() }}
                    >
                        Cancel
                    </Button>
                </Stack>
            </Stack>
        </Paper>
    )
}

export default AIProvider