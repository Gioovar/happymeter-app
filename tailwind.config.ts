import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/actions/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            animation: {
                "spin-reverse": "spin-reverse 1s linear infinite",
                "spin-slow": "spin 4s linear infinite", // New for laser border
                "float": "float 6s ease-in-out infinite",
                "text-gradient": "text-gradient 3s ease infinite",
            },
            keyframes: {
                "spin-reverse": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(-360deg)" },
                },
                "float": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-20px)" },
                },
                "text-gradient": {
                    "0%, 100%": {
                        "background-size": "200% 200%",
                        "background-position": "left center"
                    },
                    "50%": {
                        "background-size": "200% 200%",
                        "background-position": "right center"
                    },
                },
            },
        },
    },
    plugins: [],
};
export default config;
