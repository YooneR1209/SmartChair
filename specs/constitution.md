# Constitución del Proyecto SmartChair

> Documento de referencia canónico para el desarrollo del sistema. Todo agente IA, desarrollador y colaborador debe leerlo antes de escribir cualquier línea de código.

---

## 1. Identidad y Propósito

**SmartChair** es un sistema web para la gestión integral de conferencias académicas. Permite a organizadores crear y administrar conferencias, a autores postular trabajos (ponencias), a revisores evaluar esos trabajos mediante revisión por pares ciegos, y a todos los actores interactuar en un flujo de estados bien definido.

### Actores del sistema

| Rol | Descripción |
|-----|-------------|
| `ADMINISTRADOR` | Control total del sistema |
| `ORGANIZADOR` | Crea y gestiona conferencias, invita revisores, emite veredictos |
| `AUTOR` | Postula ponencias y responde a veredictos |
| `REVISOR` | Evalúa ponencias asignadas mediante rúbrica |
| `SUPERVISOR` | Observa el estado de la conferencia sin intervenir |

Los roles son **por conferencia** (`ConferenciaUsuario.rol`) y no globales, salvo `ADMINISTRADOR`.

### Dominio central

```
Conferencia → Ponencia → AsignacionRevisor → Revision → Veredicto
```

Cada entidad tiene un ciclo de vida propio con estados discretos y transiciones controladas.

---

## 2. Enfoque Spec-Driven Development (SDD)

Este proyecto sigue **Spec-Driven Development**: ninguna feature se implementa sin una especificación aprobada.

### Flujo obligatorio

```
1. spec escrita en specs/  →  2. revisión y aprobación  →  3. implementación  →  4. verificación contra spec
```

### Estructura de specs

```
specs/
├── constitution.md          ← este archivo (no se modifica sin revisión del equipo)
├── backend/
│   ├── accounts.md
│   ├── conferences.md
│   ├── submissions.md
│   ├── reviews.md
│   ├── payments.md
│   └── notifications.md
└── frontend/
    ├── auth.md
    ├── dashboard.md
    ├── conferences.md
    ├── submissions.md
    └── reviews.md
```

### Formato de spec

Cada spec debe incluir:
- **Propósito**: qué resuelve esta feature
- **Requisitos funcionales (RF-XX)**: numerados y rastreables
- **Modelos / endpoints involucrados**: con referencia a código existente
- **Criterios de aceptación**: condiciones binarias verificables
- **Casos límite**: escenarios de error y borde

### Regla fundamental

> Un agente IA **no puede iniciar implementación** si no existe una spec aprobada para esa feature. Si la spec no existe, la primera tarea es escribirla.

---

## 3. Stack Tecnológico Oficial

### Backend

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| Framework web | Django | 5.2 |
| API REST | Django REST Framework | latest compatible |
| Autenticación | djangorestframework-simplejwt | latest |
| Base de datos | MariaDB / MySQL | 5.7+ |
| Driver BD | mysqlclient | latest |
| Pagos | Stripe SDK | latest |
| Imágenes | Pillow | latest |
| Filtros API | django-filter | latest |
| CORS | django-cors-headers | latest |
| Variables de entorno | python-dotenv | latest |

### Frontend

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| Framework UI | React | 19.2.5 |
| Build tool | Vite | 8.x |
| Estilos | Tailwind CSS | 4.2.4 |
| Routing | React Router | 7.14.2 |
| HTTP client | Axios | 1.x |
| Iconos | Lucide React | 1.x |

### Restricciones de stack

- **No agregar** librerías de gestión de estado global (Redux, Zustand) sin aprobación explícita.
- **No agregar** librerías de componentes UI (MUI, Ant Design, Chakra) — el diseño usa Tailwind CSS puro.
- **No cambiar** el motor de base de datos. Solo MariaDB/MySQL.
- **No usar** `requirements.txt` con versiones sin fijar en producción.

---

## 4. Estructura del Monorepo y Rutas Autorizadas

```
SmartChair/
├── backend/
│   ├── apps/
│   │   ├── core/           # Modelos abstractos base (Evento)
│   │   ├── accounts/       # Usuarios, autenticación, perfiles
│   │   ├── conferences/    # Conferencias, participantes, invitaciones
│   │   ├── submissions/    # Ponencias y respuestas de formulario
│   │   ├── reviews/        # Asignaciones, revisiones, veredictos
│   │   ├── payments/       # Integración Stripe
│   │   └── notifications/  # Email log y envíos
│   ├── config/
│   │   ├── settings.py     # Configuración central Django
│   │   ├── urls.py         # Enrutador raíz
│   │   └── wsgi.py / asgi.py
│   ├── media/              # Archivos subidos (no commitear)
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── layouts/        # Layouts de página
│   │   ├── pages/          # Vistas de página (una por ruta)
│   │   ├── services/       # Llamadas a la API (axios)
│   │   ├── utils/          # Funciones puras reutilizables
│   │   └── config/         # Constantes y configuración
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── specs/
│   ├── constitution.md     ← este archivo
│   ├── backend/
│   └── frontend/
├── docs/
├── .env.example
└── .gitignore
```

### Rutas de la API (prefijos autorizados)

```
/api/auth/          → accounts.urls
/api/conferencias/  → conferences.urls + submissions.urls
/api/reviews/       → reviews.urls
/api/payments/      → payments.urls
/api/notifications/ → notifications.urls
/admin/             → Django Admin
```

### Reglas de estructura

- Cada nueva feature Django va en una app dentro de `backend/apps/`. **No crear archivos sueltos en `backend/`**.
- Los archivos de página React van en `pages/`. Los componentes que se reutilizan en más de una página van en `components/`.
- Los archivos de llamada a API van **exclusivamente** en `services/`. Las páginas no hacen llamadas axios directas.
- **No crear carpetas** fuera de la estructura autorizada sin documentarlo en la spec correspondiente.

---

## 5. Fases del Proyecto

### Fase 1 — Backend (completada en su mayor parte)

El backend implementa las siguientes apps con su flujo de estados:

**accounts**: Registro, login, logout, perfil, cambio de contraseña. JWT como mecanismo de autenticación.

**conferences**: CRUD de conferencias con soporte para plantillas (`es_plantilla`, `plantilla_origen`). Gestión de participantes por rol. Invitación de revisores por email con token.

**submissions**: Postulación de ponencias con formulario dinámico (`RespuestaFormulario`). Flujo de estados: `POSTULADA → EN_REVISION → ACEPTADA | RECHAZADA | ACEPTADA_CON_CAMBIOS → CAMBIOS_ENVIADOS`.

**reviews**: Asignación manual y automática de revisores. Revisión ciega con rúbrica configurable. Veredicto consolidado con feedback anónimo para el autor.

**payments**: Integración Stripe. Registro de transacciones con estados `PENDIENTE → COMPLETADO | REEMBOLSADO | FALLIDO`.

**notifications**: Envío de emails con log persistente (`EmailLog`). Tipos: bienvenida, asignación de revisor, veredicto, feedback, cambio de fecha, paper reenviado.

### Fase 2 — Frontend (en progreso)

Construcción de la interfaz React que consume la API REST del backend.

**Pantallas prioritarias (en orden):**

1. Autenticación: login, registro, recuperación de contraseña
2. Dashboard: vista según rol del usuario
3. Conferencias: listado público, detalle, crear/editar (organizador)
4. Postulación: formulario dinámico, estado de ponencia (autor)
5. Revisión: lista de asignaciones, formulario de evaluación (revisor)
6. Veredictos: emisión de veredicto, feedback al autor (organizador)
7. Pagos: flujo de pago con Stripe Elements
8. Perfil: edición de datos y foto

---

## 6. Reglas para la API REST

### Convenciones de nomenclatura

- **URLs**: en español, en plural, usando guiones. Ejemplo: `/api/conferencias/`, `/api/conferencias/{id}/ponencias/`
- **Campos JSON**: `snake_case` en español. Ejemplo: `fecha_inicio`, `autor_principal`, `es_publica`
- **Acciones no-CRUD**: verbo en la URL como acción. Ejemplo: `/api/conferencias/{id}/invitar-revisor/`

### Estructura de respuesta estándar

**Éxito con datos:**
```json
{
  "id": 1,
  "campo": "valor"
}
```

**Lista paginada:**
```json
{
  "count": 100,
  "next": "http://...",
  "previous": null,
  "results": [...]
}
```

**Error de validación (400):**
```json
{
  "campo": ["Mensaje de error específico."]
}
```

**Error de negocio (400/403/404):**
```json
{
  "detail": "Mensaje explicando el error."
}
```

### Códigos HTTP

| Situación | Código |
|-----------|--------|
| Creación exitosa | 201 |
| Acción exitosa sin retorno | 204 |
| Recurso no encontrado | 404 |
| Sin permisos para el recurso | 403 |
| No autenticado | 401 |
| Datos inválidos | 400 |
| Error interno | 500 |

### Paginación

- Tamaño de página por defecto: **20 registros**
- Máximo por página: **100 registros**
- Parámetros: `?page=N&page_size=N`

### Filtros

Todas las vistas de listado deben soportar:
- `django_filters.DjangoFilterBackend` para filtros exactos
- `SearchFilter` para búsqueda de texto
- `OrderingFilter` para ordenamiento

### Serializers

- Usar serializers distintos para listado (`ListSerializer`) y detalle (`DetailSerializer`) cuando los campos difieran.
- Los serializers de escritura no deben exponer campos calculados o de solo lectura.
- Los campos de relación en escritura usan `PrimaryKeyRelatedField`. En lectura usan el serializer anidado correspondiente.

---

## 7. Seguridad y Autenticación JWT

### Configuración JWT activa

```python
ACCESS_TOKEN_LIFETIME  = 2 horas
REFRESH_TOKEN_LIFETIME = 7 días
ROTATE_REFRESH_TOKENS  = True   # cada refresh genera un nuevo refresh token
BLACKLIST_AFTER_ROTATION = True
```

### Flujo de tokens

```
POST /api/auth/login/    → { access, refresh }
POST /api/auth/refresh/  → { access, refresh }  (invalida el refresh anterior)
POST /api/auth/logout/   → blacklist del refresh token
```

### Cabecera de autenticación

```
Authorization: Bearer <access_token>
```

### Permisos por vista

Cada vista debe declarar explícitamente su política de permisos:

```python
permission_classes = [IsAuthenticated]          # la mayoría de vistas
permission_classes = [IsAuthenticated, EsOrganizador]   # vistas de gestión
permission_classes = [AllowAny]                 # registro, login, listado público
```

Los permisos de negocio (EsOrganizador, EsRevisor, EsAutor) se definen en `permissions.py` de cada app. No usar lógica de permisos dentro de los métodos del view.

### Seguridad obligatoria

- **No exponer** tokens JWT en logs, respuestas de error ni URLs.
- **No aceptar** campos que no estén declarados en el serializer (`Meta.fields` explícito, nunca `'__all__'` en vistas públicas).
- **No confiar** en datos del cliente para determinar el usuario propietario: usar siempre `request.user`.
- **Validar** que el usuario tiene rol en la conferencia antes de ejecutar cualquier acción sobre ella.
- **CORS** restringido a `http://localhost:5173` en desarrollo. En producción, solo el dominio del frontend.

---

## 8. GitFlow y Conventional Commits

### Ramas

| Rama | Propósito | Merge hacia |
|------|-----------|-------------|
| `main` | Producción estable | — |
| `develop` | Integración continua | `main` |
| `feature/<nombre>` | Nueva feature o spec | `develop` |
| `fix/<nombre>` | Corrección de bug | `develop` |
| `hotfix/<nombre>` | Fix urgente en producción | `main` + `develop` |

### Reglas de ramas

- **Nunca** hacer push directo a `main` o `develop`.
- Toda feature parte de `develop` actualizado: `git checkout -b feature/X develop`
- El merge a `develop` se hace mediante Pull Request con al menos una revisión.
- Las ramas `feature/` se eliminan después del merge.

### Conventional Commits

Formato obligatorio:

```
<tipo>(<scope>): <descripción en imperativo, en español>

[cuerpo opcional]

[pie opcional: BREAKING CHANGE o referencia a issue]
```

**Tipos válidos:**

| Tipo | Uso |
|------|-----|
| `feat` | Nueva feature |
| `fix` | Corrección de bug |
| `docs` | Solo documentación o specs |
| `refactor` | Refactoring sin cambio de comportamiento |
| `test` | Agregar o corregir tests |
| `chore` | Mantenimiento, dependencias, configuración |
| `style` | Formateo, sin cambio de lógica |

**Ejemplos correctos:**

```
feat(submissions): agregar endpoint para enviar cambios de ponencia
fix(reviews): corregir validación de veredicto cuando no hay revisiones
docs(specs): agregar spec de submissions frontend
chore(deps): actualizar djangorestframework a 3.16
```

**Scopes válidos:** `accounts`, `conferences`, `submissions`, `reviews`, `payments`, `notifications`, `core`, `frontend`, `specs`, `config`, `deps`

---

## 9. Criterios de Tarea Terminada (Definition of Done)

Una tarea se considera **terminada** únicamente cuando cumple todos los criterios aplicables:

### Backend

- [ ] El endpoint responde con el código HTTP correcto en el caso exitoso
- [ ] El endpoint responde con errores descriptivos en casos inválidos (400, 403, 404)
- [ ] Los permisos están declarados en `permission_classes`, no en la lógica del método
- [ ] El serializer usa `Meta.fields` explícito (no `'__all__'`)
- [ ] La lógica de negocio compleja está en `services.py`, no en el view ni el serializer
- [ ] Los modelos nuevos tienen `__str__` definido
- [ ] Los modelos tienen `Meta.verbose_name` y `Meta.verbose_name_plural` en español
- [ ] Las migraciones están generadas y no hay migraciones pendientes
- [ ] El comportamiento está cubierto por la spec correspondiente

### Frontend

- [ ] La página o componente funciona en el flujo dorado (happy path)
- [ ] Los estados de carga (`loading`) y error están manejados visualmente
- [ ] Las llamadas a la API están en `services/`, no dentro del componente
- [ ] No hay `console.log` de depuración en el código final
- [ ] El diseño es consistente con Tailwind CSS (no hay estilos inline ad hoc)
- [ ] La pantalla es usable en viewport mobile (≥ 375px) y desktop (≥ 1024px)

### General

- [ ] El commit sigue Conventional Commits
- [ ] El código está en la rama `feature/` correcta, no en `develop` directamente
- [ ] No se han introducido dependencias no autorizadas por la constitución

---

## 10. Reglas Obligatorias para Agentes IA

Estas reglas se aplican a **cualquier agente IA** (Claude Code u otro) que trabaje en este proyecto.

### Reglas de acción

**R-01 — Leer antes de escribir.** Antes de modificar cualquier archivo, leerlo completo. Antes de crear un modelo, leer los modelos relacionados. Nunca asumir la estructura del código.

**R-02 — Spec primero.** No implementar ninguna feature si no existe su spec en `specs/`. Si la spec no existe, escribirla y esperar aprobación antes de continuar con el código.

**R-03 — No inventar rutas.** Seguir estrictamente las rutas de la API definidas en `config/urls.py` y en las specs. No crear nuevos prefijos de URL sin actualizar el enrutador raíz.

**R-04 — No tocar migraciones manualmente.** Las migraciones se generan con `manage.py makemigrations`. Nunca editar archivos de migración a mano salvo casos de `RunPython` documentados en la spec.

**R-05 — Usar el entorno virtual del proyecto.** Siempre usar `.venv\Scripts\python.exe manage.py ...` para comandos de Django. Nunca el Python del sistema.

**R-06 — No usar `__all__` en serializers de vistas públicas.** Declarar siempre `Meta.fields` explícitamente para evitar exposición accidental de datos.

**R-07 — No agregar dependencias sin actualizar `requirements.txt`.** Toda nueva librería debe aparecer en `requirements.txt` en el mismo commit en que se usa.

**R-08 — No hardcodear configuración.** URLs, claves, hostnames y valores de entorno van en `.env` y se leen con `os.environ` o `python-dotenv`. Nunca en el código.

**R-09 — No modificar la constitución.** Este archivo (`specs/constitution.md`) no puede ser modificado por un agente IA de forma autónoma. Requiere revisión explícita del equipo.

**R-10 — Conservar el idioma del dominio.** Los nombres de modelos, campos, variables de negocio y mensajes de error se escriben en **español**. El código técnico (nombres de funciones Python genéricas, variables locales de algoritmos) puede estar en inglés si es más claro, pero el dominio del negocio siempre en español.

**R-11 — Respetar la separación de capas.**
- Lógica de negocio compleja → `services.py`
- Serialización y validación de entrada → `serializers.py`
- Autorización y permisos → `permissions.py`
- Orquestación HTTP → `views.py`
- Llamadas a API → `frontend/src/services/`

**R-12 — Verificar antes de reportar como terminado.** Un agente no debe reportar una tarea como terminada sin haber verificado que: (a) el servidor arranca sin errores, (b) el endpoint responde correctamente a una petición de prueba, y (c) los criterios de la Definition of Done se cumplen.

---

## Apéndice A — Modelos del Dominio (referencia rápida)

```
accounts.User
  email (PK lógico), nombres, apellidos, institucion, biografia, foto_perfil
  rol: ADMINISTRADOR | ORGANIZADOR | REVISOR | AUTOR | SUPERVISOR

core.Evento (abstract)
  nombre, descripcion, fecha_inicio, fecha_fin, es_publico

conferences.Conferencia (hereda Evento)
  organizador → User, slug, visibilidad, estado
  areas_tematicas (JSON), formulario_postulacion (JSON), rubrica (JSON)
  es_plantilla, plantilla_origen → Conferencia

conferences.ConferenciaUsuario
  conferencia → Conferencia, usuario → User
  rol: ORGANIZADOR | REVISOR | AUTOR | SUPERVISOR
  UNIQUE(conferencia, usuario, rol)

conferences.InvitacionRevisor
  conferencia → Conferencia, email, usuario → User (opcional), token
  estado: PENDIENTE | ACEPTADA | RECHAZADA | EXPIRADA

submissions.Ponencia
  conferencia → Conferencia, autor_principal → User
  titulo, resumen, area_tematica, autores (JSON)
  archivo, archivo_revisado
  estado: POSTULADA | EN_REVISION | ACEPTADA | RECHAZADA | ACEPTADA_CON_CAMBIOS | CAMBIOS_ENVIADOS
  UNIQUE(autor_principal, conferencia)

submissions.RespuestaFormulario
  ponencia → Ponencia, nombre_campo, valor
  UNIQUE(ponencia, nombre_campo)

reviews.AsignacionRevisor
  ponencia → Ponencia, revisor → User, es_desempate
  UNIQUE(ponencia, revisor)

reviews.Revision
  asignacion → AsignacionRevisor (OneToOne)
  respuestas_rubrica (JSON), comentario_privado, comentario_autor
  veredicto: ACEPTADO | RECHAZADO | ACEPTADO_CON_CAMBIOS
  estado: PENDIENTE | EN_PROGRESO | COMPLETADA

reviews.Veredicto
  ponencia → Ponencia (OneToOne), emitido_por → User
  resultado: ACEPTADO | RECHAZADO | ACEPTADO_CON_CAMBIOS
  resumen_para_autor, plazo_cambios, notificado

payments.Pago
  usuario → User, stripe_payment_intent_id (único)
  monto, moneda, estado: PENDIENTE | COMPLETADO | REEMBOLSADO | FALLIDO

notifications.EmailLog
  destinatario, tipo, asunto, estado: ENVIADO | ERROR
  objeto_tipo, objeto_id (FK genérica)
```

---

*Versión: 1.0 — Mayo 2026*
*Proyecto: SmartChair — Gestión de Conferencias Académicas*
