import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'
export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    console.log(__dirname);
    return {
        define: {
            __APP_ENV__: env.APP_ENV
        },
        root: "src",
        build: {
            outDir: "../dist",
            rollupOptions: {
                input: {
                    main: resolve(__dirname, 'src/index.html'),
                    dashboard: resolve(__dirname, 'src/dashboard/dashboard.html'),
                    login: resolve(__dirname, 'src/login/login.html')
                }
            }
        }
    }
})