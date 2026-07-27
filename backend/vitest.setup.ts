// Any setup scripts you might need go here

// Load env files. test.env грузится ПЕРВЫМ и переопределяет DATABASE_URL
// на изолированную тестовую БД (dotenv не перезаписывает уже заданные vars).
import { config as loadEnv } from 'dotenv'

loadEnv({ path: './test.env' })
loadEnv() // .env — остальные переменные (PAYLOAD_SECRET и т.д.)
