# Modelo de Datos — Módulo Submissions

> Diagrama y descripción de los modelos del módulo, incluyendo relaciones con modelos de otros módulos.

---

## Diagrama de clases

```
┌─────────────────────────────────────────────────────────────────┐
│                      conferences.Conferencia                     │
├─────────────────────────────────────────────────────────────────┤
│ + id: int (PK)                                                  │
│ + nombre: str                                                   │
│ + slug: str (unique)                                            │
│ + estado: Enum[BORRADOR, ABIERTA, EN_REVISION, CERRADA,         │
│                ARCHIVADA]                                        │
│ + organizador: FK → accounts.User                               │
│ + areas_tematicas: JSON (list[str])                             │
│ + formulario_postulacion: JSON (list[FieldDef])                 │
│ + formatos_archivo_permitidos: JSON (list[str])                 │
│ + max_autores: int (default=5)                                  │
│ + es_de_pago: bool                                              │
│ + monto_inscripcion: Decimal (nullable)                         │
│ + fecha_apertura_postulaciones: date (nullable)                 │
│ + fecha_cierre_postulaciones: date (nullable)                   │
│ + fecha_limite_cambios: date (nullable)                         │
│ + min_revisores: int (default=2)                                │
│ + max_revisores: int (default=3)                                │
│ + rubrica: JSON (list[CriterioRubrica])                         │
├─────────────────────────────────────────────────────────────────┤
│ + esta_abierta_postulacion(): bool                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 1
                           │ CASCADE
                           │ *
┌──────────────────────────▼──────────────────────────────────────┐
│                      submissions.Ponencia                        │
├─────────────────────────────────────────────────────────────────┤
│ + id: int (PK)                                                  │
│ + conferencia: FK → conferences.Conferencia                     │
│ + autor_principal: FK → accounts.User (PROTECT)                 │
│ + titulo: str (max 300)                                         │
│ + resumen: text                                                 │
│ + area_tematica: str (max 100)                                  │
│ + autores: JSON (list[AutorExterno])                            │
│ + archivo: file → ponencias/archivos/                           │
│ + archivo_revisado: file → ponencias/revisados/ (nullable)      │
│ + estado: Enum[POSTULADA, EN_REVISION, ACEPTADA, RECHAZADA,     │
│               ACEPTADA_CON_CAMBIOS, CAMBIOS_ENVIADOS]           │
│ + comentario_estado: text (blank)                               │
│ + pago_confirmado: bool (default=False)                         │
│ + pago_referencia: str (max 100, blank)                         │
│ + postulada_en: datetime (auto)                                 │
│ + actualizado_en: datetime (auto)                               │
│ + cambios_enviados_en: datetime (nullable)                      │
├─────────────────────────────────────────────────────────────────┤
│ CONSTRAINT: UNIQUE (autor_principal, conferencia)               │
│ ORDERING: -postulada_en                                         │
├─────────────────────────────────────────────────────────────────┤
│ @property total_autores: int                                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 1
                           │ CASCADE
                           │ *
┌──────────────────────────▼──────────────────────────────────────┐
│               submissions.RespuestaFormulario                    │
├─────────────────────────────────────────────────────────────────┤
│ + id: int (PK)                                                  │
│ + ponencia: FK → Ponencia                                       │
│ + nombre_campo: str (max 100)                                   │
│ + valor: text (blank)                                           │
├─────────────────────────────────────────────────────────────────┤
│ CONSTRAINT: UNIQUE (ponencia, nombre_campo)                     │
└─────────────────────────────────────────────────────────────────┘


───────────────────────────────────────────────────────────────────
  Relaciones con otros módulos
───────────────────────────────────────────────────────────────────

accounts.User ──────────────────────────────── (PROTECT, no delete)
  │                                                               │
  │ autor_principal (1 → *)                     organizador (1 → *)
  │                                                               │
  ▼                                                               ▼
submissions.Ponencia                 conferences.Conferencia


reviews.AsignacionRevisor ──── FK ──▶ submissions.Ponencia
reviews.Veredicto         ──── FK ──▶ submissions.Ponencia  (OneToOne)
payments.Pago             ──── (referencia_tipo / referencia_id genérica)
```

---

## Modelo: `Ponencia`

**Archivo:** `backend/apps/submissions/models.py:5`

### Campos

| Campo | Tipo Django | Restricciones | Descripción |
|-------|-------------|---------------|-------------|
| `id` | `AutoField` | PK | Identificador interno |
| `conferencia` | `ForeignKey` | CASCADE, `related_name='ponencias'` | Conferencia a la que pertenece |
| `autor_principal` | `ForeignKey` | PROTECT, `related_name='ponencias'` | Usuario registrado que postula |
| `titulo` | `CharField(300)` | requerido | Título del trabajo |
| `resumen` | `TextField` | requerido | Abstract o resumen |
| `area_tematica` | `CharField(100)` | requerido | Validado contra `conferencia.areas_tematicas` |
| `autores` | `JSONField` | default=`[]` | Lista de coautores externos (no usuarios del sistema) |
| `archivo` | `FileField` | requerido, `upload_to='ponencias/archivos/'` | Documento original del trabajo |
| `archivo_revisado` | `FileField` | nullable, `upload_to='ponencias/revisados/'` | Archivo reenviado tras RF-16 |
| `estado` | `CharField(25)` | choices, default=`POSTULADA` | Estado actual en el flujo |
| `comentario_estado` | `TextField` | blank | Feedback del organizador, visible al autor |
| `pago_confirmado` | `BooleanField` | default=`False` | ¿El pago fue confirmado por el organizador? |
| `pago_referencia` | `CharField(100)` | blank | ID de transacción Stripe o referencia manual |
| `postulada_en` | `DateTimeField` | `auto_now_add=True` | Fecha de creación |
| `actualizado_en` | `DateTimeField` | `auto_now=True` | Última modificación |
| `cambios_enviados_en` | `DateTimeField` | nullable | Timestamp del reenvío RF-16 |

### Estados y transiciones

```
          ┌──────────────┐
  inicio  │   POSTULADA  │
  ───────▶│              │
          └──────┬───────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
  ┌──────────────┐  ┌──────────────┐
  │  EN_REVISION │  │  RECHAZADA   │ ← estado final
  └──────┬───────┘  └──────────────┘
         │
   ┌─────┼──────────────────┐
   ▼     ▼                  ▼
┌──────────┐  ┌──────────────┐  ┌────────────────────┐
│ ACEPTADA │  │  RECHAZADA   │  │ ACEPTADA_CON_CAMBIOS│
│ (final)  │  │  (final)     │  └──────────┬──────────┘
└──────────┘  └──────────────┘             │
                                           │ autor sube
                                           │ archivo
                                           ▼
                                  ┌─────────────────┐
                                  │ CAMBIOS_ENVIADOS │
                                  └────────┬────────┘
                                           │
                              ┌────────────┼────────────┐
                              ▼            ▼            ▼
                         ┌────────┐  ┌──────────┐  ┌────────────────────┐
                         │ACEPTADA│  │RECHAZADA │  │ACEPTADA_CON_CAMBIOS│
                         │(final) │  │(final)   │  │(nuevo ciclo)       │
                         └────────┘  └──────────┘  └────────────────────┘
```

### Estructura JSON de `autores`

```json
[
  {
    "nombre": "María López",
    "email": "m.lopez@universidad.edu",
    "institucion": "Universidad Nacional"
  }
]
```

> El autor principal **no** aparece en este array. `total_autores = 1 + len(autores)`.

---

## Modelo: `RespuestaFormulario`

**Archivo:** `backend/apps/submissions/models.py:96`

Almacena las respuestas a los campos personalizados definidos en `Conferencia.formulario_postulacion`.

### Campos

| Campo | Tipo Django | Restricciones | Descripción |
|-------|-------------|---------------|-------------|
| `id` | `AutoField` | PK | — |
| `ponencia` | `ForeignKey` | CASCADE, `related_name='respuestas'` | Ponencia a la que corresponde |
| `nombre_campo` | `CharField(100)` | requerido | Nombre del campo en `formulario_postulacion` |
| `valor` | `TextField` | blank | Respuesta del autor |

### Estructura JSON de `formulario_postulacion` (referencia)

El JSON en `Conferencia.formulario_postulacion` define qué campos se esperan:

```json
[
  {
    "nombre": "url_repositorio",
    "tipo": "texto",
    "requerido": false,
    "opciones": []
  },
  {
    "nombre": "categoria",
    "tipo": "seleccion",
    "requerido": true,
    "opciones": ["Educación", "Tecnología", "Ciencias"]
  }
]
```

Cada campo del formulario genera una fila en `RespuestaFormulario` cuando se postula.

---

## Relaciones con otros módulos

### → `accounts.User`

- `Ponencia.autor_principal` es FK a `User` con `PROTECT`. No se puede eliminar un usuario que tenga ponencias.
- `Conferencia.organizador` es FK a `User`. El organizador aparece en la lógica de permisos de submissions pero no en los modelos del módulo.

### → `conferences.Conferencia`

- `Ponencia.conferencia` es FK con `CASCADE`: si se elimina una conferencia, se eliminan todas sus ponencias.
- El módulo submissions **lee** configuración de la conferencia (`areas_tematicas`, `formatos_archivo_permitidos`, `max_autores`, `fecha_limite_cambios`, `es_de_pago`) para validar las postulaciones, pero **no modifica** los modelos de `conferences`.

### ← `reviews.AsignacionRevisor`

- El módulo `reviews` tiene FK hacia `Ponencia`. La ponencia no referencia de vuelta a sus asignaciones directamente, pero el `related_name='asignaciones'` permite acceder desde una ponencia.

### ← `reviews.Veredicto`

- `Veredicto.ponencia` es `OneToOneField` hacia `Ponencia`. Una ponencia puede tener como máximo un veredicto.

### ← `payments.Pago`

- El módulo `payments` usa una FK genérica (`referencia_tipo`, `referencia_id`) para vincular pagos a ponencias. El módulo `submissions` no tiene FK directa hacia `payments`.

---

## Índices y constraints

```sql
-- Generados automáticamente por Django
UNIQUE INDEX unique_autor_por_conferencia (autor_principal_id, conferencia_id)
UNIQUE INDEX submissions_respuestaformulario_ponencia_id_nombre_campo (ponencia_id, nombre_campo)

-- Índices de FK (automáticos)
INDEX ON ponencia (conferencia_id)
INDEX ON ponencia (autor_principal_id)
INDEX ON respuestaformulario (ponencia_id)
```

---

## Archivos en disco

Los archivos subidos se almacenan en `backend/media/` (configurable en `settings.MEDIA_ROOT`):

```
media/
├── ponencias/
│   ├── archivos/     ← Ponencia.archivo     (trabajo original)
│   └── revisados/    ← Ponencia.archivo_revisado (reenvío RF-16)
```

> `media/` está en `.gitignore`. Los archivos no se versionan en git.
