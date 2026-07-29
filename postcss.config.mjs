// Tailwind подключается только во frontend-стилях (src/app/(frontend)/styles.css).
// Админка Payload живёт в своей route-группе со своим layout и сюда не попадает.
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
