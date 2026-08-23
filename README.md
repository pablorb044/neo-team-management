NEO — Team Management Platform

NEO es una aplicación full-stack para la gestión de equipos y tareas.

El proyecto comenzó como una API de autenticación y evolucionó hasta convertirse en un MVP completo que integra organizaciones, equipos, gestión de miembros, solicitudes de incorporación, tareas, notificaciones y dashboard.

El objetivo es demostrar la capacidad de diseñar, desarrollar, probar y evolucionar una aplicación full-stack real manteniendo una arquitectura clara, reglas de negocio consistentes y una experiencia de usuario cuidada.

🚀 Qué es NEO

NEO está pensado como una herramienta interna sencilla para equipos pequeños.

El flujo principal del producto es:

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
Team Member
   ↓
Tasks
   ↓
Notifications
   ↓
Trabajo completado

El dominio está deliberadamente limitado para mantener el producto pequeño y fácil de entender.

Actualmente:

Una Organization tiene un Team.
Un Team tiene un único Manager.
Un usuario puede pertenecer como máximo a un Team.
Los usuarios solicitan acceso mediante Join Requests.
El Manager controla la gestión del Team.
Las Tasks siguen un workflow definido.
Las acciones importantes generan Notifications.
✨ Funcionalidades
🔐 Autenticación y cuentas
Registro de usuarios.
Login con JWT.
Bearer Authentication.
Persistencia y rehidratación de sesión.
Logout.
Protected Routes.
Gestión automática de sesiones expiradas o inválidas.
Consulta del usuario autenticado mediante /auth/me.
Actualización del perfil.
Desactivación lógica de usuarios.
Hash de contraseñas mediante bcrypt.
Validación de entradas con Zod.
🏢 Organizations y Teams
Creación de Organization + Team.
El creador se convierte automáticamente en Manager.
Consulta del Team y sus miembros.
Renombrado del Team.
Eliminación del Team.
Abandonar un Team.
Expulsar miembros.
Promover usuarios a MEMBER.
Limpieza transaccional al eliminar un Team.

La eliminación de un Team mantiene la integridad del sistema:

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
🤝 Join Requests

Los usuarios pueden solicitar entrar en un Team utilizando su Team ID.

User
  ↓
Create Join Request
  ↓
Pending
  ↓
Manager
  ├── Approve
  └── Reject

El sistema:

evita solicitudes pendientes duplicadas;
permite aprobar o rechazar solicitudes;
permite volver a solicitar acceso después de una solicitud aprobada o rechazada;
restringe la gestión de solicitudes al Manager correspondiente.
📋 Tasks

Las Tasks utilizan un workflow controlado:

SENT
  ↓
WORKING
  ↓
SUBMITTED
  ↓
DONE

Flujo principal:

Manager
   ↓
Crear y asignar Task
   ↓
Member
   ↓
Start task
   ↓
Submit task
   ↓
Manager
   ↓
Complete task
   ↓
DONE

El backend valida tanto los permisos como las transiciones de estado permitidas.

La interfaz separa las Tasks activas de las completadas y muestra progresivamente las Tasks DONE para evitar listas innecesariamente largas.

🔔 Notifications

El sistema genera notificaciones asociadas a eventos relevantes del producto.

Actualmente incluye eventos relacionados con:

Tasks asignadas.
Tasks entregadas.
Tasks completadas.
Join Requests.

El frontend permite:

consultar notificaciones;
mostrar contador de no leídas;
marcar una notificación como leída;
marcar todas como leídas;
polling automático;
mantener las notificaciones persistidas.
📊 Dashboard

El Dashboard adapta su información al usuario autenticado.

Los Managers obtienen una visión general de las Tasks de su Team.

Los Members obtienen una visión de sus propias Tasks.

Los estados principales son:

SENT
WORKING
SUBMITTED
DONE

El objetivo es mostrar información útil sin añadir estadísticas o gráficos únicamente por motivos visuales.

🎨 Frontend y UX

La interfaz incluye:

Landing Page pública.
Login y Register.
navegación pública compartida;
Dashboard;
Tasks;
Team;
Organization;
Join Requests;
Settings;
Dark Mode / Light Mode;
responsive layout;
navegación móvil;
estados de loading;
estados de éxito;
estados de error;
prevención de acciones duplicadas;
componentes UI reutilizables.
👥 Roles y permisos

NEO mantiene tres roles principales:

Acción	Manager	MEMBER / user
Gestionar Team	✅	❌
Gestionar Join Requests	✅	❌
Crear Tasks	✅	❌
Trabajar en Tasks asignadas	❌	✅
Completar Tasks	✅	❌
Abandonar Team	❌	✅
Expulsar miembros	✅	❌
Promover a MEMBER	✅	❌

El backend es la autoridad final para todas las reglas de autorización.

🧪 Testing

La suite de backend cuenta actualmente con:

6 archivos de test
100 tests
100 passed
0 failed

Los tests utilizan Vitest + Supertest y una base de datos de testing aislada.

La cobertura incluye:

Auth
Registro.
Login.
Autenticación.
Perfil.
Desactivación de usuarios.
Casos de error.
Organization y Team
Creación.
Acceso.
Miembros.
Leave Team.
Remove Member.
Actualización de roles.
Rename Team.
Delete Team.
Permisos.
Usuarios pertenecientes a otros Teams.
Limpieza de relaciones.
Join Requests
Creación.
Solicitudes duplicadas.
Approve.
Reject.
Autorización del Manager.
Managers de otros Teams.
Reutilización después de approved.
Reutilización después de rejected.
Eliminación asociada a un Team eliminado.
Tasks
Creación.
Asignación.
Validación del Team.
Validación del miembro.
Acceso a Tasks propias.
Transiciones de estado.
Protección de Tasks ajenas.
Completion por Manager.
Transiciones inválidas.

La suite no se limita a comprobar el camino correcto: también valida reglas de negocio, autorización y casos límite relevantes.

🏗️ Arquitectura
Backend

NEO utiliza una arquitectura por capas:

Routes
  ↓
Controllers
  ↓
Models
  ↓
Prisma
  ↓
PostgreSQL

Responsabilidades principales:

routes → definición de endpoints;
controllers → gestión HTTP y coordinación del flujo;
models → acceso a datos mediante Prisma;
schemas → validación de entradas con Zod;
middleware → autenticación y lógica transversal;
utils y lib → utilidades e integraciones de infraestructura.

Los Controllers no acceden directamente a Prisma.

Frontend

La aplicación React sigue una separación similar:

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

Los Services centralizan las peticiones HTTP y los Hooks encapsulan lógica reutilizable.

🛠️ Stack
Backend
Node.js
Express
PostgreSQL
Prisma ORM
JWT
bcrypt
Zod
Docker
Frontend
React
Vite
React Router
Axios
Context API
Tailwind CSS
Lucide React
Testing
Vitest
Supertest
📁 Estructura del proyecto
auth-api/
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
├── .env.example
├── docker-compose.yml
├── package.json
├── prisma.config.ts
└── README.md
🔐 Seguridad

La autenticación utiliza JWT.

Las peticiones protegidas utilizan:

Authorization: Bearer <token>

La API diferencia entre:

401 → problema de autenticación o sesión
403 → usuario autenticado pero sin permisos

La autorización se comprueba siempre en backend.

Ejemplos:

Un Manager no puede gestionar otro Team.
Un usuario no puede acceder a otra Organization.
Un Member no puede modificar Tasks ajenas.
Un Manager no puede eliminarse a sí mismo del Team.
Las transiciones de Task inválidas son rechazadas.
Los usuarios inactivos no pueden acceder a recursos protegidos.

Los secretos como JWT_SECRET y DATABASE_URL no forman parte del repositorio.

🗄️ Base de datos

NEO utiliza PostgreSQL con Prisma.

Modelos principales:

User
Organization
Team
TeamJoinRequest
Task
Notification

La base de datos utiliza relaciones, restricciones de integridad e índices donde resultan útiles.

Las notificaciones mantienen la referencia a las Tasks como opcional para permitir conservar el historial aunque una Task desaparezca.

La eliminación de Teams se ejecuta mediante una transacción para garantizar la consistencia de los datos relacionados.

📡 Endpoints principales
Auth
Método	Endpoint	Descripción
GET	/ping	Health check
POST	/auth/register	Registrar usuario
POST	/auth/login	Iniciar sesión
GET	/auth/me	Obtener usuario autenticado
PUT	/auth/me	Actualizar usuario
DELETE	/auth/me	Desactivar usuario
Organizations
Método	Endpoint	Descripción
POST	/organizations	Crear Organization + Team
GET	/organizations/:organizationId	Obtener Organization
GET	/organizations/:organizationId/members	Obtener miembros
Teams
Método	Endpoint	Descripción
GET	/teams/:teamId	Obtener Team
GET	/teams/:teamId/members	Obtener miembros
GET	/teams/:teamId/tasks	Obtener Tasks del Team
DELETE	/teams/:teamId/members/me	Abandonar Team
DELETE	/teams/:teamId/members/:userId	Expulsar miembro
PATCH	/teams/:teamId/members/:userId/role	Actualizar rol
PATCH	/teams/:teamId	Actualizar Team
DELETE	/teams/:teamId	Eliminar Team
Join Requests
Método	Endpoint	Descripción
POST	/team-join-requests	Crear solicitud
GET	/team-join-requests	Obtener solicitudes pendientes
PATCH	/team-join-requests/:id/approve	Aprobar solicitud
PATCH	/team-join-requests/:id/reject	Rechazar solicitud
Tasks
Método	Endpoint	Descripción
POST	/teams/:teamId/tasks	Crear Task
GET	/tasks/me	Obtener Tasks del usuario
PATCH	/tasks/:taskId/status	Actualizar estado
⚙️ Instalación
Requisitos
Node.js
Docker
Docker Compose
1. Clonar el repositorio
git clone <repository-url>
cd auth-api
2. Instalar dependencias del backend
npm install
3. Configurar variables de entorno

Copiar .env.example como .env:

PORT=3000
JWT_SECRET=your_jwt_secret_here
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auth_api"
FRONTEND_URL=http://localhost:5173
4. Iniciar PostgreSQL
docker compose up -d
5. Aplicar migraciones
npx prisma migrate dev
6. Iniciar el backend
npm run dev

Backend:

http://localhost:3000
7. Iniciar el frontend

En otra terminal:

cd auth-client
npm install
npm run dev

Frontend:

http://localhost:5173
🧰 Comandos útiles
Backend
npm run dev
npm run lint
npm run test
Frontend
cd auth-client
npm run dev
npm run lint
npm run build
🔄 Flujo end-to-end

El flujo principal del producto es:

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
USER JOINS TEAM
   ↓
MANAGER CREATES TASK
   ↓
MEMBER RECEIVES NOTIFICATION
   ↓
MEMBER STARTS TASK
   ↓
MEMBER SUBMITS
   ↓
MANAGER RECEIVES NOTIFICATION
   ↓
MANAGER COMPLETES
   ↓
DONE
   ↓
MEMBER RECEIVES NOTIFICATION

Este flujo ha sido probado de extremo a extremo en la aplicación y está respaldado por la suite de integración del backend.

🎯 Filosofía del proyecto

NEO no pretende convertirse en una plataforma completa de RRHH ni en una suite empresarial.

El proyecto sigue unas reglas sencillas:

Mantener el dominio pequeño.
Reutilizar infraestructura antes que rehacerla.
Mantener responsabilidades claras.
Validar autorización en backend.
Testear las reglas de negocio importantes.
Priorizar utilidad sobre complejidad visual.
Evitar funcionalidades especulativas.
Evolucionar el producto de forma incremental.

El objetivo no es tener el mayor número posible de funcionalidades.

El objetivo es construir una aplicación full-stack pequeña, completa, mantenible y realista.

📌 Estado actual
AUTH                 ✅
ORGANIZATION         ✅
TEAM                 ✅
TEAM MANAGEMENT      ✅
JOIN REQUESTS        ✅
TASKS                ✅
DASHBOARD            ✅
NOTIFICATIONS        ✅
TESTS                ✅ 100/100
RESPONSIVE           ✅
MVP FUNCIONAL        ✅

NEO se encuentra en la fase final de preparación para su primera release pública de portfolio.

👨‍💻 Sobre el proyecto

NEO es un proyecto de portfolio orientado a demostrar experiencia práctica en:

diseño de APIs REST;
autenticación y autorización;
modelado relacional;
PostgreSQL y Prisma;
arquitectura de aplicaciones React;
gestión de estado;
componentes reutilizables;
testing de integración;
responsive UI/UX;
evolución incremental de producto.

El proyecto está construido como una aplicación real con reglas de negocio, persistencia, autorización y testing, en lugar de como una colección de ejercicios técnicos independientes.