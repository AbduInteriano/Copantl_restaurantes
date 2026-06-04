# Copantl Reservaciones

Sitio web premium (publico + panel admin) para reservaciones de restaurantes del Hotel Copantl en San Pedro Sula, construido con Next.js 14, Tailwind, Framer Motion y Supabase.

## Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Framer Motion
- Supabase (DB/Auth/Storage)
- React Hook Form + Nodemailer / Microsoft 365 SMTP (correos de reservas)
- TipTap (editor de promociones)

## Configuracion local

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Copiar variables de entorno:
   ```bash
   cp .env.example .env.local
   ```
3. Completar las variables en `.env.local`.
4. Ejecutar SQL inicial en Supabase: `supabase/schema.sql`.
5. Crear un usuario admin en Supabase Auth (email/password).
6. Ejecutar el proyecto:
   ```bash
   npm run dev
   ```

## Rutas principales

- Sitio publico: `/`
- Admin login: `/admin/login`
- Panel admin: `/admin`

## Deploy

- Frontend: Vercel
- Base de datos/autenticacion/storage: Supabase
