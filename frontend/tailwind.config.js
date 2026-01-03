/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                hku: {
                    green: '#024638',
                    DEFAULT: '#024638',
                    success: '#2E7D32',
                    warning: '#F6BE00',
                    error: '#C8102E',
                },
            },
            fontFamily: {
                sans: ['Inter', 'Roboto', 'Arial', 'sans-serif'],
                serif: ['Merriweather', 'Times New Roman', 'serif'],
            },
        },
    },
    plugins: [],
}
