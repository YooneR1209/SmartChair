# Plan Técnico — Módulo Submissions

> Plan de implementación del backend. El frontend se planifica en `specs/frontend/submissions.md`.

---

## Estado general

| Capa | Estado |
|------|--------|
| Modelos Django | Completado |
| Migraciones | Completado |
| Serializers | Completado (observaciones menores pendientes) |
| Permisos | Completado |
| Services | Completado |
| Vistas (views.py) | Completado |
| URLs | Completado |
| Tests unitarios | Pendiente |
| Tests de integración | Pendiente |

---

## Decisiones de diseño

### 1. Servicio como capa de dominio

La lógica de negocio vive en `services.py`, no en las vistas ni en los serializers. Las vistas orquestan: reciben la petición HTTP, delegan a `services`, y formatean la respuesta. Esto facilita testear la lógica sin levantar el servidor.

**Consecuencia:** al agregar nuevas validaciones de negocio, el punto de cambio es `services.py`, no `views.py`.

### 2. Doble validación (serializer + service)

Las reglas que dependen de la configuración de la conferencia (`area_tematica`, `archivo`, `max_autores`) se validan dos veces:

- En el serializer para feedback HTTP temprano y mensajes de error descriptivos por campo.
- En el service como garantía de integridad independiente de la capa HTTP.

Esto es correcto: el serializer es la frontera de entrada HTTP; el service es la frontera del dominio.

### 3. Formulario dinámico como JSON + tabla relacional

`Conferencia.formulario_postulacion` define la estructura de campos en JSON. Las respuestas se almacenan en `RespuestaFormulario` (una fila por campo respondido), no en JSON dentro de la ponencia. Esto permite consultas y validaciones individuales por campo.

### 4. Slug como identificador de conferencia en la URL

El listado y creación de ponencias usa el `slug` de la conferencia (`/api/conferencias/{slug}/ponencias/`). Las operaciones sobre una ponencia individual usan el `pk` entero de la ponencia (`/api/conferencias/ponencias/{pk}/...`). Esta asimetría es intencional: el slug es el identificador público de la conferencia, el pk es el identificador interno de la ponencia.

### 5. Coautores como JSON

Los coautores adicionales al autor principal se almacenan en `Ponencia.autores` como JSON array. No son usuarios del sistema: pueden ser personas externas sin cuenta en SmartChair. El autor principal sí es un `User` registrado con FK.

---

## Deuda técnica identificada

### DT-01 — `PonenciaDetailSerializer` usa `fields = '__all__'`

**Archivo:** `backend/apps/submissions/serializers.py:34`  
**Problema:** El serializer de detalle usa `fields = '__all__'`, que según la constitución (R-06) no está permitido en vistas públicas. Si se agregan campos sensibles al modelo en el futuro, se expondrían automáticamente.  
**Solución:** Reemplazar por lista explícita de campos.  
**Impacto:** Bajo — no hay exposición de datos sensibles actualmente. Prioridad media.

### DT-02 — `CambiarEstadoView` no verifica permisos por objeto

**Archivo:** `backend/apps/submissions/views.py:84-108`  
**Problema:** La vista `CambiarEstadoView` tiene `permission_classes = [IsAuthenticated]` y delega la verificación de organización a `services.cambiar_estado`. Si alguien llama al endpoint con un `pk` de otra conferencia, el service rechaza correctamente, pero el view no tiene `EsOrganizadorDeLaConferencia` declarado en `permission_classes`.  
**Solución:** Agregar `EsOrganizadorDeLaConferencia` a `permission_classes` o mover a `get_permissions()` con `check_object_permissions`.  
**Impacto:** Bajo — el service tiene la guardia correcta. Mejora de claridad arquitectónica.

### DT-03 — Tests vacíos

**Archivo:** `backend/apps/submissions/tests.py`  
**Problema:** El archivo de tests está vacío.  
**Solución:** Implementar tests como se detalla en la sección de testing más abajo.  
**Impacto:** Alto — sin cobertura de tests, los refactors futuros son de riesgo.

---

## Plan de testing

Los tests se escriben con `django.test.TestCase` y `rest_framework.test.APIClient`.

### Fixtures necesarios

```python
# Helpers reutilizables en todos los tests del módulo
def crear_usuario(rol='autor')
def crear_conferencia(estado='abierta', es_de_pago=False)
def crear_ponencia(conferencia, autor, estado='postulada')
```

### Tests de services (unitarios)

**`test_postular_ponencia.py`**

| Test | Caso |
|------|------|
| `test_postula_correctamente` | Happy path: crea la ponencia con datos válidos |
| `test_conferencia_cerrada_rechaza` | `estado != ABIERTA` → `ValidationError` |
| `test_area_invalida_rechaza` | Área fuera de la lista → `ValidationError` |
| `test_formato_invalido_rechaza` | Extensión no permitida → `ValidationError` |
| `test_exceso_autores_rechaza` | Total > `max_autores` → `ValidationError` |
| `test_duplicado_rechaza` | Segunda postulación del mismo autor → `ValidationError` |
| `test_respuestas_formulario_creadas` | Con `respuestas`, se crean filas en `RespuestaFormulario` |
| `test_sin_areas_tematicas_acepta_cualquier` | Lista vacía = sin restricción |
| `test_sin_formatos_acepta_cualquier` | Lista vacía = sin restricción de extensión |

**`test_cambiar_estado.py`**

| Test | Caso |
|------|------|
| `test_transicion_valida` | `POSTULADA → EN_REVISION` |
| `test_transicion_invalida_rechaza` | `ACEPTADA → EN_REVISION` → `ValidationError` |
| `test_no_organizador_rechaza` | Usuario sin rol → `PermissionDenied` |
| `test_admin_puede_cambiar` | Admin global puede cambiar en cualquier conferencia |
| `test_estados_finales_bloqueados` | `ACEPTADA` y `RECHAZADA` no tienen transiciones de salida |

**`test_enviar_cambios.py`**

| Test | Caso |
|------|------|
| `test_envia_correctamente` | Happy path: estado cambia a `CAMBIOS_ENVIADOS` |
| `test_estado_incorrecto_rechaza` | Estado ≠ `ACEPTADA_CON_CAMBIOS` → `ValidationError` |
| `test_no_autor_rechaza` | Otro usuario → `PermissionDenied` |
| `test_plazo_vencido_rechaza` | `hoy > fecha_limite_cambios` → `ValidationError` |
| `test_formato_invalido_rechaza` | Extensión no permitida → `ValidationError` |

**`test_confirmar_pago.py`**

| Test | Caso |
|------|------|
| `test_confirma_correctamente` | Happy path: `pago_confirmado = True` |
| `test_conferencia_gratuita_rechaza` | `es_de_pago = False` → `ValidationError` |
| `test_ya_confirmado_rechaza` | `pago_confirmado = True` → `ValidationError` |

### Tests de endpoints (integración)

**`test_api_ponencias.py`**

| Test | Endpoint | Verificación |
|------|----------|-------------|
| `test_lista_autor_solo_ve_propias` | `GET /ponencias/` | Autor no ve ponencias de otros |
| `test_lista_organizador_ve_todas` | `GET /ponencias/` | Organizador ve todas |
| `test_crear_ponencia_201` | `POST /ponencias/` | Respuesta 201 con datos correctos |
| `test_crear_sin_auth_401` | `POST /ponencias/` | 401 sin token |
| `test_detalle_autor_200` | `GET /ponencias/{pk}/` | Autor ve su propia ponencia |
| `test_detalle_revisor_activo_200` | `GET /ponencias/{pk}/` | Revisor activo puede ver |
| `test_detalle_revisor_inactivo_403` | `GET /ponencias/{pk}/` | Revisor inactivo: 403 |
| `test_eliminar_solo_autor` | `DELETE /ponencias/{pk}/` | 403 si otro usuario intenta |
| `test_cambiar_estado_200` | `POST /cambiar-estado/` | Organizador cambia estado |
| `test_cambiar_estado_403_autor` | `POST /cambiar-estado/` | Autor no puede cambiar estado |
| `test_confirmar_pago_200` | `POST /confirmar-pago/` | Organizador confirma pago |
| `test_enviar_cambios_200` | `POST /enviar-cambios/` | Autor reenvía archivo |

---

## Mejoras futuras (fuera del alcance actual)

Las siguientes mejoras están identificadas pero **no forman parte del alcance de la Fase 1**. No implementar sin nueva spec aprobada.

| ID | Mejora | Justificación de aplazamiento |
|----|--------|-------------------------------|
| MEJ-01 | Notificación al autor cuando cambia el estado | Depende del módulo `notifications` |
| MEJ-02 | Historial de cambios de estado (log de auditoría) | Requiere nuevo modelo `CambioEstado` |
| MEJ-03 | Permitir que el autor edite coautores sin repostular | Complejidad de validación de estado |
| MEJ-04 | Subir múltiples archivos por ponencia | Requiere refactor del modelo de archivos |
| MEJ-05 | Búsqueda full-text de ponencias | Requiere índice de texto en BD |
| MEJ-06 | Exportar ponencias a CSV / PDF | Fuera del alcance del MVP |
