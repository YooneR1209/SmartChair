# Tareas — Módulo Submissions

> Registro de tareas completadas y pendientes. Actualizar este archivo al completar o iniciar cada tarea.  
> Formato de estado: `[x]` completado · `[ ]` pendiente · `[~]` en progreso

---

## Fase Backend

### Modelos y base de datos

- [x] **SUB-M-01** — Definir modelo `Ponencia` con todos sus campos y choices de estado
- [x] **SUB-M-02** — Definir `Ponencia.Estado` como `TextChoices` con 6 valores
- [x] **SUB-M-03** — Agregar `UniqueConstraint(autor_principal, conferencia)`
- [x] **SUB-M-04** — Agregar `archivo` y `archivo_revisado` con rutas de subida separadas
- [x] **SUB-M-05** — Agregar campos de auditoría: `postulada_en`, `actualizado_en`, `cambios_enviados_en`
- [x] **SUB-M-06** — Definir modelo `RespuestaFormulario` con `unique_together (ponencia, nombre_campo)`
- [x] **SUB-M-07** — Agregar propiedad `total_autores` a `Ponencia`
- [x] **SUB-M-08** — Generar y aplicar migraciones

### Serializers

- [x] **SUB-S-01** — Implementar `PonenciaListSerializer` (campos resumidos para listado)
- [x] **SUB-S-02** — Implementar `PonenciaDetailSerializer` con contexto de conferencia
- [x] **SUB-S-03** — Implementar validación de `area_tematica` en `PonenciaDetailSerializer`
- [x] **SUB-S-04** — Implementar validación de formato de `archivo` en `PonenciaDetailSerializer`
- [x] **SUB-S-05** — Implementar validación de `max_autores` en `PonenciaDetailSerializer`
- [x] **SUB-S-06** — Implementar validación de duplicado en `PonenciaDetailSerializer.validate()`
- [x] **SUB-S-07** — Implementar `RespuestaFormularioSerializer`
- [x] **SUB-S-08** — Implementar `CambiarEstadoSerializer`
- [x] **SUB-S-09** — Implementar `ConfirmarPagoSerializer`
- [x] **SUB-S-10** — Implementar `EnviarCambiosSerializer`
- [ ] **SUB-S-11** — Reemplazar `fields = '__all__'` en `PonenciaDetailSerializer` por lista explícita *(DT-01)*

### Permisos

- [x] **SUB-P-01** — Implementar `EsAutorDeLaPonencia`
- [x] **SUB-P-02** — Implementar `EsOrganizadorDeLaConferencia`
- [x] **SUB-P-03** — Implementar `PuedeVerPonencia` (autor, organizador, admin, revisor activo)

### Services (lógica de negocio)

- [x] **SUB-SV-01** — Implementar `postular_ponencia()` con todas las validaciones de dominio
- [x] **SUB-SV-02** — Implementar tabla `_TRANSICIONES_VALIDAS`
- [x] **SUB-SV-03** — Implementar `cambiar_estado()` con validación de transición
- [x] **SUB-SV-04** — Implementar `confirmar_pago()` con validaciones de negocio
- [x] **SUB-SV-05** — Implementar `enviar_cambios()` con validación de plazo y formato

### Vistas

- [x] **SUB-V-01** — Implementar `PonenciaListCreateView` con filtrado por rol en `get_queryset()`
- [x] **SUB-V-02** — Implementar `PonenciaDetailView` con permisos diferenciados por método HTTP
- [x] **SUB-V-03** — Implementar `CambiarEstadoView`
- [x] **SUB-V-04** — Implementar `ConfirmarPagoView` con `EsOrganizadorDeLaConferencia`
- [x] **SUB-V-05** — Implementar `EnviarCambiosView` con `EsAutorDeLaPonencia`
- [ ] **SUB-V-06** — Agregar `EsOrganizadorDeLaConferencia` a `CambiarEstadoView.permission_classes` *(DT-02)*

### URLs

- [x] **SUB-U-01** — Registrar `<slug:slug>/ponencias/` → `PonenciaListCreateView`
- [x] **SUB-U-02** — Registrar `ponencias/<int:pk>/` → `PonenciaDetailView`
- [x] **SUB-U-03** — Registrar `ponencias/<int:pk>/cambiar-estado/`
- [x] **SUB-U-04** — Registrar `ponencias/<int:pk>/confirmar-pago/`
- [x] **SUB-U-05** — Registrar `ponencias/<int:pk>/enviar-cambios/`
- [x] **SUB-U-06** — Incluir `submissions.urls` en `config/urls.py` bajo el prefijo `api/conferencias/`

---

## Tests

- [ ] **SUB-T-01** — Crear fixtures de apoyo (`crear_usuario`, `crear_conferencia`, `crear_ponencia`)
- [ ] **SUB-T-02** — Tests de `postular_ponencia()`: happy path y todos los casos de error
- [ ] **SUB-T-03** — Tests de `cambiar_estado()`: transiciones válidas e inválidas
- [ ] **SUB-T-04** — Tests de `enviar_cambios()`: happy path, estado incorrecto, plazo vencido
- [ ] **SUB-T-05** — Tests de `confirmar_pago()`: happy path y casos de error
- [ ] **SUB-T-06** — Tests de API `GET /ponencias/`: filtrado por rol (autor vs organizador)
- [ ] **SUB-T-07** — Tests de API `POST /ponencias/`: creación exitosa y errores de validación
- [ ] **SUB-T-08** — Tests de API `GET /ponencias/{pk}/`: permisos (autor, revisor activo, revisor inactivo)
- [ ] **SUB-T-09** — Tests de API `DELETE /ponencias/{pk}/`: solo autor puede eliminar
- [ ] **SUB-T-10** — Tests de API `POST /cambiar-estado/`: organizador y rechazo a autor
- [ ] **SUB-T-11** — Tests de API `POST /confirmar-pago/`: organizador confirma, conferencia gratuita falla
- [ ] **SUB-T-12** — Tests de API `POST /enviar-cambios/`: autor reenvía, otro usuario falla

---

## Fase Frontend

> Detallado en `specs/frontend/submissions.md`. Estas tareas se planifican cuando comience la Fase 2 de submissions.

- [ ] **SUB-FE-01** — Diseñar spec frontend de submissions en `specs/frontend/submissions.md`
- [ ] **SUB-FE-02** — Crear página de listado de ponencias del autor (`/mis-ponencias`)
- [ ] **SUB-FE-03** — Crear formulario de postulación con campos dinámicos (RF-06)
- [ ] **SUB-FE-04** — Crear vista de detalle de ponencia con estado visible
- [ ] **SUB-FE-05** — Crear panel del organizador para gestión de ponencias
- [ ] **SUB-FE-06** — Implementar cambio de estado con confirmación (organizador)
- [ ] **SUB-FE-07** — Implementar flujo de reenvío de archivo corregido (RF-16)
- [ ] **SUB-FE-08** — Implementar confirmación de pago manual (organizador, RF-10)

---

## Resumen de progreso

| Área | Completadas | Pendientes | Total |
|------|:-----------:|:----------:|:-----:|
| Modelos | 8 | 0 | 8 |
| Serializers | 10 | 1 | 11 |
| Permisos | 3 | 0 | 3 |
| Services | 5 | 0 | 5 |
| Vistas | 5 | 1 | 6 |
| URLs | 6 | 0 | 6 |
| Tests | 0 | 12 | 12 |
| Frontend | 0 | 8 | 8 |
| **Total** | **37** | **22** | **59** |
