/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // 全局 sans 改成使用你刚声明的 "Lora Local"
        sans: ['"Lora Local"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
