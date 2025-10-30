import '@mui/material/styles' //必须要引入，才能扩展
import React from 'react';

declare module '*.scss' {
    const content: { [className: string]: string };
    export default content;
}

declare module '*.png' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value: any;
    export default value;
}

declare module '@mui/material/styles' {
    // allow configuration using `createTheme`
    interface TypographyVariantsOptions {
        headlineLarge?: React.CSSProperties;
        headlineMedium?: React.CSSProperties;
        headlineSmall: React.CSSProperties;
        titleMedium: React.CSSProperties;
        titleSmall: React.CSSProperties;
        bodyLarge: React.CSSProperties;
        bodyMedium: React.CSSProperties;
        labelLarge: React.CSSProperties;
        labelMedium: React.CSSProperties;
        titleLarge: React.CSSProperties;
        labelSmall: React.CSSProperties;
        bodySmall: React.CSSProperties;
    }

    interface TypographyOptions {
        headlineLarge?: React.CSSProperties;
        headlineMedium?: React.CSSProperties;
        titleMedium: React.CSSProperties;
        titleSmall: React.CSSProperties;
        bodyLarge: React.CSSProperties;
        bodyMedium: React.CSSProperties;
        labelLarge: React.CSSProperties;
        labelMedium: React.CSSProperties;
        titleLarge: React.CSSProperties;
        labelSmall: React.CSSProperties;
        bodySmall: React.CSSProperties;
    }
}

// Update the Typography's variant prop options
declare module '@mui/material/Typography' {
    interface TypographyPropsVariantOverrides {
        headlineLarge: true;
        headlineMedium: true;
        headlineSmall: true;
        titleMedium: true;
        titleSmall: true;
        bodyMedium: true;
        labelLarge: true;
        labelMedium: true;
        titleLarge: true;
        bodyLarge: true;
        labelSmall: true;
        bodySmall: true;
    }
}

