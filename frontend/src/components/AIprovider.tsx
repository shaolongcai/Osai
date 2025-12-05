import { ConfigParams } from "@/types/electron";
import { Button, Card, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material"
import { useRequest } from "ahooks";
import { useState } from "react";


interface Props {
    onFinish: () => void;
}

const AIProvider: React.FC<Props> = ({
    onFinish
}) => {

    const [apiHost, setApiHost] = useState('http://127.0.0.1:11434');
    const [apiHostError, setApiHostError] = useState('');
    const [modelID, setModelID] = useState('');
    const [modelIDError, setModelIDError] = useState('');

    useRequest(window.electronAPI.getConfig, {
        defaultParams: ['ai_provider'],
        onSuccess: (dataString: string) => {
            const data = JSON.parse(dataString);
            setApiHost(data.host);
            setModelID(data.model);
            console.log('data', data)
        }
    });

    // 应用配置
    const handleApply = async () => {
        console.log('应用配置', apiHost, modelID)

        // 检查
        if (!apiHost || !modelID) {
            setApiHostError(!apiHost ? 'please input API Host' : '');
            setModelIDError(!modelID ? 'please input Model ID' : '');
            return;
        }

        const data = JSON.stringify({
            host: apiHost,
            model: modelID,
            provider: 'ollama',
        })
        const params: ConfigParams = {
            key: 'ai_provider',
            value: data,
            type: 'string',
        }
        await window.electronAPI.setConfig(params);  // 接口设置配置
        onFinish();
    }

    return (
        <Card elevation={1} className="w-[480px] min-h-[400px]">
            <Stack spacing={3} alignItems='center'>
                <Typography variant='headlineSmall' className="w-full text-left">
                    AI Provider
                </Typography>
                <Stack spacing={2} className="w-full" alignItems="center">
                    <Typography variant='titleSmall' color='text.secondary' className="w-full" >
                        Ollama
                    </Typography>
                    <TextField
                        required
                        label='API Host'
                        variant='standard'
                        placeholder='Please input API address'
                        onChange={(e) => setApiHost(e.target.value)}
                        value={apiHost}
                        fullWidth
                        error={Boolean(apiHostError)}
                        helperText={apiHostError}
                    />
                    <TextField
                        required
                        select
                        label='Model ID'
                        variant='standard'
                        value={modelID}
                        fullWidth
                        onChange={(e) => setModelID(e.target.value)}
                        error={Boolean(modelIDError)}
                        helperText={modelIDError}
                    >
                        <MenuItem value='Qwen2.5:3b'>Qwen2.5:3b</MenuItem>
                        <MenuItem value='Qwen3:3b'>Qwen3:3b</MenuItem>
                    </TextField>
                    <Button
                        variant='contained'
                        className="w-fit"
                        fullWidth={false}
                        onClick={handleApply}
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
        </Card>
    )
}

export default AIProvider