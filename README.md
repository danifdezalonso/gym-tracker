# Gym Tracker

Aplicación móvil para registrar entrenamientos de gimnasio (Push / Pull / Piernas).

## Setup

### 1. Supabase — ya creado

Crea las tablas en el editor SQL de Supabase:

```sql
-- Sessions: one row per gym visit
create table sessions (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  day_type text not null,
  created_at timestamp default now()
);

-- Sets: one row per set logged
create table sets (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade,
  exercise text not null,
  set_number integer not null,
  weight_kg numeric,
  reps integer,
  completed boolean default false,
  created_at timestamp default now()
);
```

### 2. Variables de entorno

Crea `.env.local` en la raíz del proyecto:

```
NEXT_PUBLIC_SUPABASE_URL=https://idbumpfdwqlzhpsoskky.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Instalar y correr

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu teléfono o browser.

### 4. Deploy en Vercel

```bash
npx vercel
```

Agrega las dos variables de entorno en el dashboard de Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Funcionalidades

- Rutina fija: Empuje (lunes) / Jale (martes) / Piernas (jueves)
- Detección automática del día con opción de cambio manual
- Log de peso y reps por serie
- Timer de descanso configurable (90s por defecto) con alerta de sonido
- Historial de sesiones
- Gráfico de progreso por ejercicio
- Referencia de la última sesión al lado de cada serie
- UI en español, modo oscuro, optimizado para móvil
