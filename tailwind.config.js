/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--color-bg)',
                panel: 'var(--color-panel)',
                primary: 'var(--color-primary)',
                accent: 'var(--color-accent)',
                foreground: 'var(--color-text)',
                'text-dim': 'var(--color-text-dim)',
                purple: {
                    500: '#8A2BE2',
                    400: '#9b4dca',
                    300: '#bc85e6',
                },
            }
        },
    },
    plugins: [],
}
