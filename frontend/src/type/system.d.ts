



/**
 * 获取用户配置
 */
export type UserConfig = {
    hasGPU: boolean;
    ignore_hidden_files: boolean;
    ignored_folders: string[];
    index_interval: number;
    last_index_file_count: string;
    last_index_time: string;
    visual_index_enabled: boolean;
    cuda_installed: boolean;
    report_agreement: boolean; //是否同意用户体验改进计划
}
