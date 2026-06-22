# Spec — Módulo Submissions (Ponencias)

> Especificación completa del módulo de gestión de ponencias para SmartChair.  
> Fuente de verdad para implementación, revisión de código y pruebas.

---

## 1. Propósito

El módulo **submissions** gestiona el ciclo de vida completo de las ponencias enviadas a una conferencia: desde la postulación inicial del autor hasta la aceptación o rechazo final por parte del organizador, incluyendo el flujo de revisión, la confirmación de pago y el reenvío de cambios.

---

## 2. Actores y responsabilidades

| Actor | Acción permitida |
|-------|-----------------|
| `AUTOR` (autor principal) | Postular, ver detalle, editar metadatos, enviar archivo revisado |
| `ORGANIZADOR` | Ver todas las ponencias de su conferencia, cambiar estado, confirmar pago |
| `REVISOR` (activo en la conferencia) | Ver ponencias asignadas (solo lectura) |
| `ADMINISTRADOR` | Todo lo que puede el organizador en cualquier conferencia |

---

## 3. Requisitos Funcionales

### RF-05 — Postular ponencia

Un autor registrado puede postular una ponencia a una conferencia **abierta**.

**Precondiciones:**
- La conferencia tiene `estado = ABIERTA`
- `fecha_apertura_postulaciones <= hoy <= fecha_cierre_postulaciones`
- El autor no tiene una ponencia previa en la misma conferencia (`UNIQUE autor_principal + conferencia`)

**Validaciones:**
- `area_tematica` debe pertenecer a `Conferencia.areas_tematicas` (si la lista no está vacía)
- La extensión del `archivo` debe estar en `Conferencia.formatos_archivo_permitidos` (si la lista no está vacía)
- `total_autores` (principal + coautores del JSON) no puede superar `Conferencia.max_autores`
- Los campos del `formulario_postulacion` de la conferencia se guardan en `RespuestaFormulario`

**Resultado:**
- Ponencia creada con `estado = POSTULADA`
- Respuestas de formulario creadas en bulk

---

### RF-06 — Formulario personalizado

Cada conferencia puede definir campos adicionales en `Conferencia.formulario_postulacion` (JSON). Al postular, el autor puede responder esos campos. Las respuestas se almacenan en `RespuestaFormulario`.

**Formato del campo en `formulario_postulacion`:**
```json
{
  "nombre": "url_repositorio",
  "tipo": "texto",
  "requerido": false,
  "opciones": []
}
```

**Tipos soportados:** `texto`, `seleccion`, `multiple`

**Restricción:** `UNIQUE (ponencia, nombre_campo)` — una ponencia no puede tener dos respuestas al mismo campo.

---

### RF-07 — Ver ponencias (filtrado por rol)

El endpoint `GET /api/conferencias/{slug}/ponencias/` devuelve:
- Si el usuario es **organizador o admin**: todas las ponencias de la conferencia
- Si el usuario es **autor**: solo sus propias ponencias
- Si el usuario es **revisor**: este endpoint devuelve lista vacía (el revisor accede a sus ponencias asignadas desde el módulo `reviews`)

---

### RF-08 — Conferencias de pago

Si `Conferencia.es_de_pago = True`, la ponencia puede registrar un pago con `pago_referencia`. El campo `pago_confirmado` solo lo puede cambiar el organizador o admin mediante el endpoint `/ponencias/{pk}/confirmar-pago/`.

---

### RF-10 — Confirmar pago

**Actor:** Organizador o Administrador  
**Precondiciones:**
- `Conferencia.es_de_pago = True`
- `Ponencia.pago_confirmado = False`

**Acción:** El organizador proporciona la referencia Stripe o manual. El sistema marca `pago_confirmado = True` y guarda la `pago_referencia`.

**Error si:** la conferencia no requiere pago, o el pago ya fue confirmado.

---

### RF-15 / RF-19 — Cambiar estado de ponencia

**Actor:** Organizador o Administrador  
**Mecanismo:** El sistema valida las transiciones permitidas antes de ejecutar el cambio.

**Máquina de estados:**

```
POSTULADA
  ├─▶ EN_REVISION
  └─▶ RECHAZADA

EN_REVISION
  ├─▶ ACEPTADA          (estado final)
  ├─▶ RECHAZADA         (estado final)
  └─▶ ACEPTADA_CON_CAMBIOS

ACEPTADA_CON_CAMBIOS
  └─▶ RECHAZADA         (si el autor no envía cambios)

CAMBIOS_ENVIADOS
  ├─▶ ACEPTADA          (estado final)
  ├─▶ RECHAZADA         (estado final)
  └─▶ ACEPTADA_CON_CAMBIOS   (se piden más cambios)
```

**Estados finales:** `ACEPTADA` y `RECHAZADA` no admiten transición de salida.

El organizador puede incluir `comentario_estado` al cambiar el estado. Este campo es visible para el autor.

---

### RF-16 — Reenvío de archivo revisado

**Actor:** Autor principal  
**Precondiciones:**
- `Ponencia.estado = ACEPTADA_CON_CAMBIOS`
- `hoy <= Conferencia.fecha_limite_cambios` (si la fecha está configurada)

**Acción:** El autor sube un nuevo archivo. El sistema guarda el archivo en `archivo_revisado`, cambia el estado a `CAMBIOS_ENVIADOS` y registra `cambios_enviados_en`.

**Validaciones:**
- El archivo debe respetar `Conferencia.formatos_archivo_permitidos`
- Solo el autor principal puede enviar los cambios
- Si venció `fecha_limite_cambios`, se retorna error 400

---

## 4. Endpoints

### Tabla resumen

| Método | URL | Vista | Descripción |
|--------|-----|-------|-------------|
| `GET` | `/api/conferencias/{slug}/ponencias/` | `PonenciaListCreateView` | Lista ponencias según rol |
| `POST` | `/api/conferencias/{slug}/ponencias/` | `PonenciaListCreateView` | Postular ponencia (RF-05) |
| `GET` | `/api/conferencias/ponencias/{pk}/` | `PonenciaDetailView` | Ver detalle de ponencia |
| `PUT/PATCH` | `/api/conferencias/ponencias/{pk}/` | `PonenciaDetailView` | Editar metadatos (solo autor) |
| `DELETE` | `/api/conferencias/ponencias/{pk}/` | `PonenciaDetailView` | Eliminar ponencia (solo autor) |
| `POST` | `/api/conferencias/ponencias/{pk}/cambiar-estado/` | `CambiarEstadoView` | Cambiar estado (organizador) |
| `POST` | `/api/conferencias/ponencias/{pk}/confirmar-pago/` | `ConfirmarPagoView` | Confirmar pago (RF-10) |
| `POST` | `/api/conferencias/ponencias/{pk}/enviar-cambios/` | `EnviarCambiosView` | Reenviar archivo (RF-16) |

> **Prefijo raíz:** `/api/conferencias/` definido en `backend/config/urls.py`

---

### Detalle de payloads

#### `POST /api/conferencias/{slug}/ponencias/` — Postular

**Tipo de contenido:** `multipart/form-data` (requiere subida de archivo)

**Campos requeridos:**
```
titulo         string        max 300 chars
resumen        string        texto libre
area_tematica  string        debe estar en conferencia.areas_tematicas
archivo        file          extensión validada por conferencia
```

**Campos opcionales:**
```
autores        JSON array    [{"nombre": str, "email": str, "institucion": str}]
respuestas     JSON array    [{"nombre_campo": str, "valor": str}]
```

**Respuesta 201:**
```json
{
  "id": 1,
  "titulo": "...",
  "area_tematica": "...",
  "estado": "postulada",
  "pago_confirmado": false,
  "autor_principal": 5,
  "autor_nombre": "Ana García",
  "conferencia": 3,
  "resumen": "...",
  "autores": [],
  "archivo": "/media/ponencias/archivos/paper.pdf",
  "archivo_revisado": null,
  "comentario_estado": "",
  "pago_referencia": "",
  "postulada_en": "2026-05-01T10:00:00Z",
  "actualizado_en": "2026-05-01T10:00:00Z",
  "cambios_enviados_en": null,
  "respuestas": []
}
```

---

#### `POST .../cambiar-estado/` — Cambiar estado

```json
{
  "nuevo_estado": "en_revision",
  "comentario_estado": "Tu trabajo ha sido aceptado para revisión."
}
```

---

#### `POST .../confirmar-pago/` — Confirmar pago

```json
{
  "referencia": "pi_3OxZaA2eZvKYlo2C1234abcd"
}
```

---

#### `POST .../enviar-cambios/` — Enviar cambios

**Tipo de contenido:** `multipart/form-data`

```
archivo    file    (requerido)
```

---

## 5. Permisos

| Permiso | Clase | Descripción |
|---------|-------|-------------|
| `EsAutorDeLaPonencia` | `submissions/permissions.py` | `obj.autor_principal == request.user` |
| `EsOrganizadorDeLaConferencia` | `submissions/permissions.py` | `obj.conferencia.organizador == user` o rol admin |
| `PuedeVerPonencia` | `submissions/permissions.py` | Autor, organizador, admin, o revisor activo en la conferencia |

---

## 6. Lógica de negocio (services.py)

Toda la lógica de negocio vive en `backend/apps/submissions/services.py`. Las vistas no implementan lógica: orquestan y delegan.

| Función | Descripción |
|---------|-------------|
| `postular_ponencia(conferencia, autor, datos, respuestas)` | RF-05: valida reglas y crea la ponencia + respuestas |
| `cambiar_estado(ponencia, nuevo_estado, usuario)` | RF-15: valida transición y actualiza estado |
| `confirmar_pago(ponencia, referencia)` | RF-10: valida conferencia de pago y marca confirmado |
| `enviar_cambios(ponencia, archivo, autor)` | RF-16: valida estado y plazo, guarda archivo revisado |

**Transiciones de estado implementadas en `_TRANSICIONES_VALIDAS`:**

```python
{
  POSTULADA:            {EN_REVISION, RECHAZADA},
  EN_REVISION:          {ACEPTADA, RECHAZADA, ACEPTADA_CON_CAMBIOS},
  ACEPTADA_CON_CAMBIOS: {RECHAZADA},
  CAMBIOS_ENVIADOS:     {ACEPTADA, RECHAZADA, ACEPTADA_CON_CAMBIOS},
}
```

---

## 7. Validaciones cruzadas

Las validaciones que dependen de la configuración de la conferencia se realizan **en dos capas**:

1. **Serializer** (`PonenciaDetailSerializer`): valida `area_tematica`, `archivo` y `autores` usando la conferencia del contexto. Permite feedback temprano al cliente.
2. **Service** (`postular_ponencia`): re-valida las mismas reglas antes de persistir. Garantía ante llamadas directas a la capa de servicio.

Esta doble validación es intencional: el serializer es la frontera HTTP, el service es la frontera de dominio.

---

## 8. Criterios de aceptación

- [ ] Un autor puede postular una ponencia a una conferencia abierta (201)
- [ ] Un autor no puede postular dos veces a la misma conferencia (400 con mensaje claro)
- [ ] La validación de `area_tematica` rechaza valores fuera de la lista (400)
- [ ] La validación de formato de archivo rechaza extensiones no permitidas (400)
- [ ] El organizador puede cambiar el estado a `en_revision` (200)
- [ ] El sistema rechaza transiciones no permitidas, ej: `ACEPTADA → EN_REVISION` (400)
- [ ] El autor puede reenviar el paper cuando el estado es `aceptada_con_cambios` (200)
- [ ] El sistema rechaza reenvío si venció `fecha_limite_cambios` (400)
- [ ] El organizador puede confirmar pago; el endpoint falla si la conferencia no es de pago (400)
- [ ] Un revisor activo puede ver el detalle de una ponencia (200); uno no activo no puede (403)
- [ ] `GET /ponencias/` retorna solo las ponencias del autor si este no es organizador
- [ ] `DELETE /ponencias/{pk}/` solo lo puede ejecutar el autor principal (403 si otro intenta)

---

## 9. Casos límite y errores esperados

| Escenario | Código | Mensaje |
|-----------|--------|---------|
| Postular a conferencia cerrada | 400 | `La conferencia no está abierta para postulaciones.` |
| Duplicar postulación | 400 | `Ya tienes una ponencia postulada en esta conferencia.` |
| Área temática inválida | 400 | `El área "X" no está disponible. Áreas válidas: ...` |
| Formato de archivo no permitido | 400 | `Formato .X no permitido. Formatos aceptados: ...` |
| Exceder máximo de autores | 400 | `Se superó el máximo de N autores ...` |
| Transición de estado inválida | 400 | `No se puede pasar de "X" a "Y". Transiciones válidas: ...` |
| Reenviar cambios sin ser el autor | 403 | `Solo el autor principal puede enviar los cambios.` |
| Reenviar con estado incorrecto | 400 | `Solo se pueden enviar cambios cuando el estado es "aceptada_con_cambios".` |
| Reenviar fuera de plazo | 400 | `El plazo para enviar cambios venció el YYYY-MM-DD.` |
| Confirmar pago en conferencia gratuita | 400 | `Esta conferencia no requiere pago de inscripción.` |
| Confirmar pago ya confirmado | 400 | `El pago de esta ponencia ya fue confirmado anteriormente.` |
| Cambiar estado sin ser organizador | 403 | `Solo el organizador o un administrador puede cambiar el estado.` |
