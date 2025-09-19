const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    name: 'Osai',
    executableName: 'Osai',
    icon: './dist-electron/resources/assets/logo-256',
    prune: true,
    asar: {
      unpack: '**/node_modules/@lancedb/**'
    },
    extraResource: [
      'dist-electron/resources/pythonScript',
      'dist-electron/resources/venv'
    ],
    ignore: [
      '^electron($|/)',
      '^frontend/(?!dist($|/))',
      '^\\.venv($|/)',
      '^/\\.git($|/)',
      '^/\\.vscode($|/)',
      '\\.log$',
      '^/node_modules/\\.cache($|/)',
      '__pycache__',
      '^venv($|/)'
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'Osai'
      },
      platforms: ['win32']
    },
    // {
    //   name: '@electron-forge/maker-zip',
    //   platforms: ['darwin']
    // },
    // {
    //   name: '@electron-forge/maker-deb',
    //   config: {}
    // },
    // {
    //   name: '@electron-forge/maker-rpm',
    //   config: {}
    // }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    },
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // Vite config options
        build: [
          {
            entry: 'electron/main.ts',
            config: 'vite.main.config.js'
          },
          {
            entry: 'electron/preload.ts',
            config: 'vite.preload.config.js'
          }
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.js'
          }
        ]
      }
    },
    // 可选：添加 Fuses 插件用于安全性
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true
    })
  ],
  publishers: []
};