# NEO — Team Management Platform

NEO es una aplicación full-stack para la gestión de equipos y tareas.

El proyecto comenzó como una API de autenticación y evolucionó hasta convertirse en una aplicación completa que integra autenticación, Organizations, Teams, gestión de miembros, Join Requests, Tasks, Notifications, Team Activity y un Dashboard adaptado al usuario.

El objetivo de NEO es demostrar la capacidad de diseñar, desarrollar, probar, desplegar y evolucionar una aplicación full-stack real manteniendo una arquitectura clara, reglas de negocio consistentes y una experiencia de usuario cuidada.

## 🌍 Live Demo

**Frontend**

https://neo-frontend-0b1h.onrender.com/

**Backend**

https://neo-31hl.onrender.com

**Health Check**

https://neo-31hl.onrender.com/ping

La aplicación está desplegada públicamente y puede probarse directamente desde el navegador.

## 📸 Screenshots

### Landing Page

![NEO Landing Page](./docs/screenshots/LANDING.png)

La Landing presenta el propósito de NEO, su workflow principal, sus funcionalidades principales y una preview visual del producto.

### Dashboard

![NEO Dashboard](./docs/screenshots/DASHBOARD.png)

El Dashboard adapta la información mostrada al usuario autenticado y proporciona una visión rápida del estado actual del trabajo.

### Tasks

![NEO Tasks](./docs/screenshots/TASK.png)

La pantalla de Tasks centraliza la asignación, progreso, revisión y finalización del trabajo.

### Team & Recent Activity

![NEO Team and Recent Activity](./docs/screenshots/TEAM.png)

La página de Team combina gestión de miembros con un feed de actividad reciente basado en eventos reales de las Tasks.

## 🚀 Qué es NEO

NEO está pensado como una herramienta interna sencilla para equipos pequeños.

El producto se centra en un workflow concreto:

```text
Registro
   ↓
Login
   ↓
Organization + Team
   ↓
Manager
   ↓
Join Request
   ↓
Aprobación
   ↓
MEMBER
   ↓
Tasks
   ↓
Trabajo
   ↓
Submit
   ↓
Manager Review
   ↓
DONE
```

El dominio está deliberadamente limitado para mantener el producto pequeño, fácil de entender y sencillo de evolucionar.

### Modelo actual

* Una Organization tiene un Team.
* Un Team tiene un único Manager.
* Un usuario puede pertenecer como máximo a un Team.
* Un usuario sin Team mantiene el rol `user`.
* Cuando entra en un Team pasa a ser `MEMBER`.
* El Manager controla la gestión del Team.
* Las Tasks siguen un workflow definido.
* Las acciones importantes generan Notifications.
* El Team muestra actividad reciente relacionada con las Tasks.

La decisión de mantener una Organization con un solo Team en esta versión es deliberada. El objetivo de NEO no es maximizar el número de funcionalidades, sino mantener un dominio pequeño y suficientemente completo para demostrar capacidades full-stack reales.

## ✨ Funcionalidades

### 🔐 Autenticación y cuentas

* Registro de usuarios.
* Login con JWT.
* Bearer Authentication.
* Persistencia y rehidratación de sesión.
* Logout.
* Protected Routes.
* Gestión de sesiones expiradas o inválidas.
* Consulta del usuario autenticado mediante `/auth/me`.
* Actualización del perfil.
* Desactivación lógica de usuarios.
* Hash de contraseñas mediante bcrypt.
* Validación de entradas con Zod.

### 🏢 Organizations y Teams

* Creación de Organization + Team.
* El creador se convierte automáticamente en Manager.
* Consulta del Team y sus miembros.
* Renombrado del Team.
* Eliminación del Team.
* Abandonar un Team.
* Expulsar miembros.
* Promover usuarios a `MEMBER`.
* Limpieza transaccional al eliminar un Team.
* Visualización del contexto Organization → Team.
* Visualización del Manager, número de miembros y rol actual.
* Copia rápida del Team ID para compartirlo con nuevos miembros.

La eliminación de un Team mantiene la integridad del sistema:

```text
Delete Team
    ↓
Eliminar Join Requests
    ↓
Eliminar Tasks
    ↓
Limpiar teamId de los usuarios
    ↓
Restaurar Manager → user
    ↓
Eliminar Team
```

### 🤝 Join Requests

Los usuarios sin Team pueden solicitar acceso utilizando un Team ID.

```text
USER
  ↓
Create Join Request
  ↓
Pending
  ↓
Manager
  ├── Approve
  └── Reject
```

El sistema:

* evita solicitudes pendientes duplicadas;
* permite aprobar o rechazar solicitudes;
* permite volver a solicitar acceso después de una solicitud aprobada o rechazada;
* restringe la gestión de solicitudes al Manager correspondiente;
* genera Notifications asociadas a los eventos relevantes.

### 📋 Tasks

Las Tasks utilizan un workflow controlado:

```text
SENT
  ↓
WORKING
  ↓
SUBMITTED
  ↓
DONE
```

El significado de cada estado es:

| Estado      | Significado                                                       |
| ----------- | ----------------------------------------------------------------- |
| `SENT`      | Task asignada y esperando a comenzar.                             |
| `WORKING`   | El MEMBER está trabajando en la Task.                             |
| `SUBMITTED` | El MEMBER ha enviado el trabajo y espera la revisión del Manager. |
| `DONE`      | El Manager ha revisado y completado la Task.                      |

Flujo principal:

```text
Manager
   ↓
Create + Assign Task
   ↓
MEMBER
   ↓
Start Task
   ↓
Work
   ↓
Submit Task
   ↓
Manager
   ↓
Review
   ↓
Complete Task
   ↓
DONE
```

El backend valida tanto los permisos como las transiciones de estado permitidas.

La interfaz separa las Tasks activas de las completadas y permite mostrar progresivamente las Tasks `DONE` para evitar listas innecesariamente largas.

El workflow fue diseñado deliberadamente sin introducir un sistema de revisión más complejo con comentarios, adjuntos o estados adicionales, ya que el dominio actual no los necesita.

### 🔔 Notifications

El sistema genera Notifications asociadas a eventos relevantes del producto.

Actualmente incluye:

* Tasks asignadas.
* Tasks entregadas.
* Tasks completadas.
* Join Requests.

El frontend permite:

* consultar Notifications;
* mostrar el contador de no leídas;
* marcar una Notification como leída;
* marcar todas como leídas;
* navegar automáticamente hacia la sección correspondiente;
* persistir las Notifications;
* actualizar el estado periódicamente mediante polling.

La navegación es contextual:

```text
TASK_ASSIGNED
TASK_SUBMITTED
TASK_COMPLETED
        ↓
/tasks
```

y:

```text
TEAM_JOIN_REQUEST
TEAM_JOIN_APPROVED
TEAM_JOIN_REJECTED
        ↓
/team
```

No se utiliza navegación individual mediante `/tasks/:id`, ya que el tamaño y alcance actual de NEO no justifican esa complejidad.

### 📈 Recent Team Activity

NEO muestra un feed de actividad reciente del Team.

El feed reutiliza los eventos de Notifications relacionados con Tasks en lugar de introducir un sistema independiente de Activity Logs.

Actualmente muestra:

* `TASK_ASSIGNED`
* `TASK_SUBMITTED`
* `TASK_COMPLETED`

El flujo es:

```text
Task event
   ↓
Notification existente
   ↓
Task → Team
   ↓
Recent Team Activity
```

La actividad se refresca automáticamente mediante polling periódico.

No se utilizan WebSockets porque NEO no requiere sincronización en tiempo real. La aplicación está orientada a equipos que asignan trabajo, trabajan durante el día y revisan el progreso de forma periódica.

### 📊 Dashboard

El Dashboard adapta su información al usuario autenticado.

**Manager**

Muestra una visión general de las Tasks de su Team.

**MEMBER**

Muestra una visión de sus propias Tasks.

**Usuario sin Team**

Recibe un onboarding contextual:

```text
No Team yet

Create your own organization
or join an existing Team.

[Create Organization]
[Join a Team]
```

El objetivo del Dashboard es mostrar información útil sin añadir estadísticas o gráficos únicamente por motivos visuales.

### 🎨 Frontend y UX

La interfaz incluye:

* Landing Page pública.
* Login y Register.
* Navegación pública compartida.
* Dashboard.
* Tasks.
* Team.
* Organization.
* Join Requests.
* Dark Mode / Light Mode mediante un toggle global.
* Responsive layout.
* Navegación móvil.
* Empty states para onboarding.
* Estados de loading.
* Estados de éxito.
* Estados de error.
* Prevención de acciones duplicadas.
* Componentes UI reutilizables.
* Navegación contextual de Notifications.
* Team Activity.
* Interacciones con feedback visual.

No existe una página independiente de Settings. El cambio de tema está integrado directamente en la navegación global porque mantener una pantalla completa para una única preferencia no aportaba suficiente valor al producto.

## 👥 Roles y permisos

NEO mantiene tres estados de usuario principales relacionados con Team membership:

```text
user
↓
Usuario autenticado que todavía no pertenece a un Team.

MEMBER
↓
Usuario que pertenece a un Team y puede trabajar en Tasks.

manager
↓
Manager responsable de gestionar el Team.
```

La diferencia entre `user` y `MEMBER` representa principalmente pertenencia al Team.

| Acción                      | Manager | MEMBER | user |
| --------------------------- | :-----: | :----: | :--: |
| Gestionar Team              |    ✅    |    ❌   |   ❌  |
| Gestionar Join Requests     |    ✅    |    ❌   |   ❌  |
| Crear Tasks                 |    ✅    |    ❌   |   ❌  |
| Trabajar en Tasks asignadas |    ❌    |    ✅   |   ❌  |
| Completar Tasks             |    ✅    |    ❌   |   ❌  |
| Abandonar Team              |    ❌    |    ✅   |   ❌  |
| Expulsar miembros           |    ✅    |    ❌   |   ❌  |
| Promover a `MEMBER`         |    ✅    |    ❌   |   ❌  |

El backend es la autoridad final para todas las reglas de autorización.

La interfaz no sustituye las comprobaciones de seguridad del backend.

## 🧪 Testing

La suite de backend cuenta actualmente con:

```text
6 archivos de test
100 tests
100 passed
0 failed
```

Los tests utilizan **Vitest + Supertest** junto con una base de datos de testing aislada.

La cobertura incluye:

### Auth

* Registro.
* Login.
* Autenticación.
* Perfil.
* Desactivación de usuarios.
* Casos de error.

### Organization y Team

* Creación.
* Acceso.
* Miembros.
* Leave Team.
* Remove Member.
* Actualización de roles.
* Rename Team.
* Delete Team.
* Permisos.
* Usuarios pertenecientes a otros Teams.
* Limpieza de relaciones.

### Join Requests

* Creación.
* Solicitudes duplicadas.
* Approve.
* Reject.
* Autorización del Manager.
* Managers de otros Teams.
* Reutilización después de `approved`.
* Reutilización después de `rejected`.
* Eliminación asociada a un Team eliminado.

### Tasks

* Creación.
* Asignación.
* Validación del Team.
* Validación del miembro.
* Acceso a Tasks propias.
* Transiciones de estado.
* Protección de Tasks ajenas.
* Completion por Manager.
* Transiciones inválidas.

La suite no se limita a comprobar el camino correcto: también valida reglas de negocio, autorización y casos límite relevantes.

## 🏗️ Arquitectura

### Backend

NEO utiliza una arquitectura por capas:

```text
Routes
  ↓
Controllers
  ↓
Models
  ↓
Prisma
  ↓
PostgreSQL
```

Responsabilidades principales:

* `routes` → definición de endpoints;
* `controllers` → gestión HTTP y coordinación del flujo;
* `models` → acceso a datos mediante Prisma;
* `schemas` → validación de entradas con Zod;
* `middleware` → autenticación y lógica transversal;
* `utils` y `lib` → utilidades e integraciones de infraestructura.

Los Controllers no acceden directamente a Prisma.

### Frontend

La aplicación React sigue una separación similar:

```text
App
 ↓
React Router
 ↓
Pages
 ↓
Hooks / Context
 ↓
Services
 ↓
Backend API
```

Los Services centralizan las peticiones HTTP y los Hooks encapsulan lógica reutilizable.

El frontend también utiliza Context para responsabilidades globales como autenticación y theme management.

## 🛠️ Stack

### Backend

* Node.js
* Express
* PostgreSQL
* Prisma ORM
* JWT
* bcrypt
* Zod
* Docker

### Frontend

* React
* Vite
* React Router
* Axios
* Context API
* Tailwind CSS
* Lucide React

### Testing

* Vitest
* Supertest

### Production

* Render
* Neon PostgreSQL

## 📁 Estructura del proyecto

```text
neo-team-management/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│   ├── controllers/
│   ├── lib/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── schemas/
│   ├── utils/
│   ├── app.js
│   └── server.js
│
├── tests/
│
├── auth-client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
│
├── docs/
│   └── screenshots/
│
├── .env.example
├── docker-compose.yml
├── package.json
├── prisma.config.ts
└── README.md
```

## 🔐 Seguridad

La autenticación utiliza JWT.

Las peticiones protegidas utilizan:

```http
Authorization: Bearer <token>
```

La API diferencia entre:

```text
401 → problema de autenticación o sesión
403 → usuario autenticado pero sin permisos
```

La autorización se comprueba siempre en backend.

Ejemplos:

* Un Manager no puede gestionar otro Team.
* Un usuario no puede acceder a otra Organization.
* Un MEMBER no puede modificar Tasks ajenas.
* Un Manager no puede eliminarse a sí mismo del Team.
* Las transiciones de Task inválidas son rechazadas.
* Los usuarios inactivos no pueden acceder a recursos protegidos.
* Las Join Requests solo pueden ser gestionadas por el Manager correspondiente.
* Los usuarios solo pueden consultar recursos de los Teams a los que pertenecen.

Los secretos como `JWT_SECRET` y `DATABASE_URL` no forman parte del repositorio.

## 🗄️ Base de datos

NEO utiliza PostgreSQL con Prisma.

Modelos principales:

```text
User
Organization
Team
TeamJoinRequest
Task
Notification
```

La base de datos utiliza relaciones, restricciones de integridad e índices donde resultan útiles.

Las Tasks pertenecen a un Team y tienen un usuario asignado.

Las Notifications mantienen una referencia opcional a una Task.

Esto permite relacionar eventos de trabajo con su Task y, mediante ella, obtener la actividad reciente del Team.

La eliminación de Teams se ejecuta mediante una transacción para garantizar la consistencia de los datos relacionados.

## 📡 Endpoints principales

### Auth

| Método | Endpoint         | Descripción                 |
| ------ | ---------------- | --------------------------- |
| GET    | `/ping`          | Health check                |
| POST   | `/auth/register` | Registrar usuario           |
| POST   | `/auth/login`    | Iniciar sesión              |
| GET    | `/auth/me`       | Obtener usuario autenticado |
| PUT    | `/auth/me`       | Actualizar usuario          |
| DELETE | `/auth/me`       | Desactivar usuario          |

### Organizations

| Método | Endpoint                                 | Descripción               |
| ------ | ---------------------------------------- | ------------------------- |
| POST   | `/organizations`                         | Crear Organization + Team |
| GET    | `/organizations/:organizationId`         | Obtener Organization      |
| GET    | `/organizations/:organizationId/members` | Obtener miembros          |

### Teams

| Método | Endpoint                              | Descripción            |
| ------ | ------------------------------------- | ---------------------- |
| GET    | `/teams/:teamId`                      | Obtener Team           |
| GET    | `/teams/:teamId/members`              | Obtener miembros       |
| GET    | `/teams/:teamId/tasks`                | Obtener Tasks del Team |
| DELETE | `/teams/:teamId/members/me`           | Abandonar Team         |
| DELETE | `/teams/:teamId/members/:userId`      | Expulsar miembro       |
| PATCH  | `/teams/:teamId/members/:userId/role` | Actualizar rol         |
| PATCH  | `/teams/:teamId`                      | Actualizar Team        |
| DELETE | `/teams/:teamId`                      | Eliminar Team          |

### Join Requests

| Método | Endpoint                          | Descripción                    |
| ------ | --------------------------------- | ------------------------------ |
| POST   | `/team-join-requests`             | Crear solicitud                |
| GET    | `/team-join-requests`             | Obtener solicitudes pendientes |
| PATCH  | `/team-join-requests/:id/approve` | Aprobar solicitud              |
| PATCH  | `/team-join-requests/:id/reject`  | Rechazar solicitud             |

### Tasks

| Método | Endpoint                | Descripción               |
| ------ | ----------------------- | ------------------------- |
| POST   | `/teams/:teamId/tasks`  | Crear Task                |
| GET    | `/tasks/me`             | Obtener Tasks del usuario |
| PATCH  | `/tasks/:taskId/status` | Actualizar estado         |

### Notifications

| Método | Endpoint                      | Descripción                         |
| ------ | ----------------------------- | ----------------------------------- |
| GET    | `/notifications`              | Obtener Notifications del usuario   |
| GET    | `/notifications/unread`       | Obtener Notifications no leídas     |
| GET    | `/notifications/unread/count` | Obtener contador de no leídas       |
| GET    | `/notifications/team`         | Obtener actividad reciente del Team |
| PATCH  | `/notifications/:id/read`     | Marcar Notification como leída      |
| PATCH  | `/notifications/read-all`     | Marcar todas como leídas            |

## ⚙️ Instalación

### Requisitos

* Node.js
* Docker
* Docker Compose

### 1. Clonar el repositorio

```bash
git clone https://github.com/pablorb044/neo-team-management.git
cd neo-team-management
```

### 2. Instalar dependencias del backend

```bash
npm install
```

### 3. Configurar variables de entorno

Copiar `.env.example` como `.env` y configurar los valores correspondientes.

Ejemplo:

```env
PORT=3000
JWT_SECRET=your_jwt_secret_here
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auth_api"
FRONTEND_URL=http://localhost:5173
```

### 4. Iniciar PostgreSQL

```bash
docker compose up -d
```

### 5. Aplicar migraciones

```bash
npx prisma migrate dev
```

### 6. Iniciar el backend

```bash
npm run dev
```

Backend:

http://localhost:3000

### 7. Iniciar el frontend

En otra terminal:

```bash
cd auth-client
npm install
npm run dev
```

Frontend:

http://localhost:5173

## 🧰 Comandos útiles

### Backend

```bash
npm run dev
npm run lint
npm run test
```

### Frontend

```bash
cd auth-client
npm run dev
npm run lint
npm run build
```

## 🔄 Flujo end-to-end

El flujo principal del producto es:

```text
REGISTER
   ↓
LOGIN
   ↓
CREATE ORGANIZATION + TEAM
   ↓
MANAGER
   ↓
USER REQUESTS TO JOIN
   ↓
MANAGER APPROVES
   ↓
USER BECOMES MEMBER
   ↓
MANAGER CREATES TASK
   ↓
MEMBER RECEIVES NOTIFICATION
   ↓
MEMBER STARTS TASK
   ↓
MEMBER WORKS
   ↓
MEMBER SUBMITS
   ↓
MANAGER RECEIVES NOTIFICATION
   ↓
MANAGER REVIEWS
   ↓
MANAGER COMPLETES
   ↓
DONE
   ↓
MEMBER RECEIVES NOTIFICATION
```

El flujo de trabajo se complementa con Team Activity:

```text
Task event
   ↓
Notification
   ↓
Team Activity
   ↓
Recent activity
```

Este flujo ha sido probado de extremo a extremo en la aplicación y está respaldado por la suite de integración del backend.

## 🎯 Filosofía del proyecto

NEO no pretende convertirse en una plataforma completa de RRHH ni en una suite empresarial.

El proyecto sigue unas reglas sencillas:

* Mantener el dominio pequeño.
* Reutilizar infraestructura antes que rehacerla.
* Mantener responsabilidades claras.
* Validar autorización en backend.
* Testear las reglas de negocio importantes.
* Priorizar utilidad sobre complejidad visual.
* Evitar funcionalidades especulativas.
* Evolucionar el producto de forma incremental.
* Mantener la arquitectura proporcional al tamaño del dominio.

Durante el desarrollo se tomaron deliberadamente decisiones de alcance.

Por ejemplo:

* No se añadió Search sin una funcionalidad real detrás.
* No se mantuvo una página Settings separada para una única preferencia.
* No se introdujeron WebSockets porque el producto no necesita sincronización en tiempo real.
* No se creó un Activity Log independiente cuando las Notifications existentes ya representaban los eventos necesarios.
* No se convirtió el workflow de revisión de Tasks en un sistema complejo de comentarios, archivos o estados adicionales.
* No se añadió una arquitectura de microservicios porque el dominio y la escala actual no la justifican.

El objetivo no es tener el mayor número posible de funcionalidades.

El objetivo es construir una aplicación full-stack pequeña, completa, mantenible y realista tomando decisiones técnicas y de producto justificadas.

## 📌 Estado actual

```text
AUTH                       ✅
ORGANIZATION               ✅
TEAM                       ✅
TEAM MANAGEMENT            ✅
JOIN REQUESTS              ✅
TASKS                      ✅
TASK REVIEW UX             ✅
DASHBOARD                  ✅
NOTIFICATIONS              ✅
TEAM ACTIVITY              ✅
DARK / LIGHT THEME         ✅
RESPONSIVE UI              ✅
TESTS                      ✅ 100/100
PRODUCTION                 ✅
PUBLIC DEMO                ✅
PRODUCT REVIEW             ✅
UX / PRODUCT POLISH        ✅
```

NEO se encuentra en su fase final de preparación como proyecto de portfolio.

El producto principal está terminado y desplegado públicamente.

## 👨‍💻 Sobre el proyecto

NEO es un proyecto de portfolio orientado a demostrar experiencia práctica en:

* diseño de APIs REST;
* autenticación y autorización;
* modelado relacional;
* PostgreSQL y Prisma;
* arquitectura de aplicaciones React;
* gestión de estado;
* Context API;
* custom hooks;
* componentes reutilizables;
* testing de integración;
* responsive UI/UX;
* deployment y configuración de producción;
* evolución incremental de producto;
* toma de decisiones técnicas y de producto.

El proyecto está construido como una aplicación real con reglas de negocio, persistencia, autorización, testing y despliegue, en lugar de como una colección de ejercicios técnicos independientes.

El objetivo principal de NEO como portfolio es demostrar no solo la capacidad de escribir código, sino también la capacidad de decidir qué construir, qué no construir y por qué.

## 🔗 Enlaces

**GitHub**

https://github.com/pablorb044/neo-team-management

**Live Demo**

https://neo-frontend-0b1h.onrender.com/

**Backend**

https://neo-31hl.onrender.com

**Health Check**

https://neo-31hl.onrender.com/ping
