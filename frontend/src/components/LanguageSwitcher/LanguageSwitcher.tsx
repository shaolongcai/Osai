// React 核心庫導入
import React from 'react';
// 導入國際化翻譯 Hook
import { useTranslation } from '../../contexts/I18nContext';
// 導入語言類型定義和配置
import { Language } from '../../types/i18n';
import { LANGUAGE_CONFIGS, getLanguageConfig } from '../../config/languages';
// 導入 Material-UI 組件
import { Button, ButtonGroup, Box, Select, MenuItem, FormControl } from '@mui/material';

// 動態導入國旗圖片的輔助函數
// 使用 Vite 的動態導入功能，根據國旗名稱動態載入對應的 SVG 圖片
const importFlag = (flagName: string) => {
  return new URL(`../../assets/flags/svg/${flagName}.svg`, import.meta.url).href;
};

/**
 * 語言切換器組件的屬性接口
 * @interface LanguageSwitcherProps
 */
interface LanguageSwitcherProps {
  /** 顯示變體：按鈕、按鈕組或下拉選單 */
  variant?: 'button' | 'button-group' | 'select';
  /** 組件大小 */
  size?: 'small' | 'medium' | 'large';
  /** 是否顯示標籤文字 */
  showLabel?: boolean;
}

/**
 * 語言切換器組件
 * 支援多種顯示模式：按鈕、按鈕組、下拉選單
 * 提供8種語言的切換功能，每種語言都有對應的國旗圖示
 */
const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'button-group',  // 預設使用按鈕組模式
  size = 'small',           // 預設使用小尺寸
  showLabel = true          // 預設顯示標籤
}) => {
  // 從國際化上下文中獲取翻譯函數、當前語言、設定語言函數和載入狀態
  const { t, currentLanguage, setLanguage, isLoading } = useTranslation();

  // 支援的語言列表
  // 從統一配置文件中提取所有語言代碼，用於遍歷渲染
  const languages: Language[] = LANGUAGE_CONFIGS.map(config => config.code as Language);

  /**
   * 根據語言代碼獲取國旗圖片路徑
   * @param languageCode 語言代碼
   * @returns 國旗圖片的 URL 路徑
   */
  const getFlagByLanguage = (languageCode: Language): string => {
    // 從統一配置中獲取對應的語言配置
    const config = getLanguageConfig(languageCode);
    // 如果找到配置則返回國旗圖片路徑，否則返回空字串
    return config ? importFlag(config.flagName) : '';
  };

  /**
   * 根據語言代碼獲取翻譯文本
   * @param languageCode 語言代碼
   * @returns 該語言的顯示名稱（已翻譯）
   */
  const getLanguageText = (languageCode: Language): string => {
    // 使用翻譯函數獲取語言的本地化名稱
    return t(`app.language.${languageCode}` as any);
  };

  /**
   * 處理語言切換事件
   * 異步函數，支援錯誤處理
   * @param language 要切換到的語言
   */
  const handleLanguageChange = async (language: Language) => {
    try {
      // 調用上下文中的設定語言函數
      await setLanguage(language);
    } catch (error) {
      // 如果切換失敗，在控制台輸出錯誤信息
      console.error('切换语言失败？请告知我们:', error);
    }
  };

  /**
   * 獲取按鈕的變體樣式
   * @param language 語言代碼
   * @returns 按鈕變體：當前語言為實心，其他為輪廓
   */
  const getButtonVariant = (language: Language) => {
    return currentLanguage === language ? 'contained' : 'outlined';
  };

  /**
   * 獲取按鈕的顏色主題
   * @param language 語言代碼
   * @returns 按鈕顏色：當前語言為主色，其他為繼承
   */
  const getButtonColor = (language: Language) => {
    return currentLanguage === language ? 'primary' : 'inherit';
  };

  /**
   * 共用的按鈕渲染函數
   * 生成所有語言的按鈕元素，用於按鈕和按鈕組模式
   * @returns 語言按鈕陣列
   */
  const renderLanguageButtons = () => {
    return languages.map((lang) => (
      <Button
        key={lang}                                    // 使用語言代碼作為 key
        size={size}                                   // 按鈕大小
        variant={getButtonVariant(lang)}              // 按鈕變體樣式
        color={getButtonColor(lang) as any}           // 按鈕顏色主題
        onClick={() => handleLanguageChange(lang)}    // 點擊事件處理
        disabled={isLoading}                          // 載入時禁用按鈕
      >
        {/* 按鈕內容：國旗圖示 + 語言名稱 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <img src={getFlagByLanguage(lang)} alt={`${lang} flag`} style={{ width: 16, height: 16 }} />
          <span>{getLanguageText(lang)}</span>
        </Box>
      </Button>
    ));
  };

  // 載入狀態的渲染
  // 當語言切換正在進行時顯示載入提示
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* 條件渲染標籤 */}
        {showLabel && <span>{t('app.language.title')}</span>}
        {/* 禁用的載入按鈕 */}
        <Button disabled size={size}>
          載入中...
        </Button>
      </Box>
    );
  }

  // 下拉選單模式的渲染
  if (variant === 'select') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* 條件渲染標籤 */}
        {showLabel && <span>{t('app.language.title')}</span>}
        {/* Material-UI 表單控制器 */}
        <FormControl size={size === 'small' ? 'small' : 'medium'} sx={{ minWidth: 160 }}>
          <Select
            value={currentLanguage}                                           // 當前選中的語言
            onChange={(e) => handleLanguageChange(e.target.value as Language)} // 選擇變更事件
            // 自定義選中值的顯示方式：國旗 + 語言名稱
            renderValue={(value) => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <img 
                  src={getFlagByLanguage(value as Language)} 
                  alt={`${value} flag`}
                  style={{ width: 16, height: 16, objectFit: 'contain' }}
                />
                <span>{getLanguageText(value as Language)}</span>
              </Box>
            )}
            // 下拉選單的樣式配置
            sx={{
              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                paddingY: '8px',
              },
              minHeight: size === 'small' ? 36 : 40,  // 根據尺寸設定最小高度
              borderRadius: 1.5,                      // 圓角邊框
            }}
          >
            {/* 遍歷語言配置生成選項 */}
            {LANGUAGE_CONFIGS.map((config) => (
              <MenuItem key={config.code} value={config.code}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <img 
                    src={getFlagByLanguage(config.code as Language)} 
                    alt={config.altText}
                    style={{ width: 18, height: 18, objectFit: 'contain' }}
                  />
                  <span>{getLanguageText(config.code as Language)}</span>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    );
  }

  // 單獨按鈕模式的渲染
  if (variant === 'button') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* 條件渲染標籤 */}
        {showLabel && <span>{t('app.language.title')}</span>}
        {/* 渲染所有語言按鈕 */}
        {renderLanguageButtons()}
      </Box>
    );
  }

  // 預設為 button-group 變體
  // 按鈕組模式：將所有按鈕組合在一起，形成統一的按鈕組
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* 條件渲染標籤 */}
      {showLabel && <span>{t('app.language.title')}</span>}
      {/* Material-UI 按鈕組組件 */}
      <ButtonGroup size={size}>
        {/* 渲染所有語言按鈕 */}
        {renderLanguageButtons()}
      </ButtonGroup>
    </Box>
  );
};

// 導出語言切換器組件
export default LanguageSwitcher;