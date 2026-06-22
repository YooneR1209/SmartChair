workspace "SmartChair - Sistema de Gestión de Congresos" "Modelo C4 - Nivel Componentes (Fase 3)" {

    model {
        // ============================================================
        // PERSONAS (Actores del Sistema)
        // ============================================================
        autor = person "Autor" "Investigador que envía artículos y consulta estados"
        revisor = person "Revisor" "Evaluador académico que revisa y califica artículos"
        organizador = person "Organizador" "Gestiona eventos, asigna revisores, valida pagos"
        administrador = person "Administrador" "Control total del sistema y configuración global"

        // ============================================================
        // SISTEMA DE SOFTWARE
        // ============================================================
        smartchair = softwareSystem "SmartChair" "Plataforma integral para gestión de congresos académicos" {
            // ============================================================
            // CONTENEDOR: Frontend Web App
            // ============================================================
            frontend = container "Single Page Application" "Aplicación web React que consume la API REST" {
                // --- Componentes de Páginas ---
                landingPage = component "LandingPage" "Página de aterrizaje pública con información del sistema" "React + Vite"
                loginPage = component "LoginPage" "Autenticación de usuarios mediante JWT" "React"
                registerPage = component "RegisterPage" "Registro independiente de usuarios (RF-04)" "React"
                dashboardPage = component "DashboardPage" "Panel principal con estadísticas y resumen" "React"
                conferenciasPage = component "ConferenciasPage" "Listado y detalle de conferencias" "React"
                detalleConferenciaPage = component "DetalleConferenciaPage" "Vista detalle con postulación e inscripción" "React"
                misPonenciasPage = component "MisPonenciasPage" "Gestión de ponencias del autor" "React"
                misPostulacionesPage = component "MisPostulacionesPage" "Estado de postulaciones realizadas" "React"
                misRevisionesPage = component "MisRevisionesPage" "Asignaciones de revisión del revisor" "React"
                pagosPage = component "PagosPage" "Historial y gestión de pagos" "React"
                certificadosPage = component "CertificadosPage" "Descarga de certificados generados" "React"
                perfilPage = component "PerfilPage" "Edición de perfil y cambio de contraseña" "React"
                adminPanelPage = component "AdminPanelPage" "Panel de administración con estadísticas y gestión" "React"

                // --- Componentes Compartidos ---
                uiKit = component "UI Kit" "Componentes reutilizables: LoadingScreen, AlertBox, etc." "React"
                authComponents = component "AuthComponents" "LoginForm, RoleSelector, ProtectedRoute" "React"
                commonModals = component "CommonModals" "PostularModal, ParticiparModal, CreateConferenceModal, AssignReviewersModal" "React"
                dashboardComponents = component "DashboardComponents" "StatCards, PaperCard para métricas" "React"
                paymentComponents = component "PaymentComponents" "StripePaymentForm para checkout" "React"
                toastContext = component "ToastContext" "Sistema de notificaciones toast globales" "React Context API"

                // --- Servicios Frontend ---
                apiService = component "ApiService" "Cliente HTTP con autenticación JWT, token refresh y errores" "Fetch API"
                eventBus = component "EventBus" "Pub/Sup desacoplado para comunicación entre componentes" "events.js"
                authService = component "AuthService" "Login, registro, logout, perfil, cambio password" "ApiService"
                conferenceService = component "ConferenceService" "CRUD conferencias, plantillas, invitaciones" "ApiService"
                submissionService = component "SubmissionService" "Postulación, cambios, certificados" "ApiService"
                reviewService = component "ReviewService" "Asignaciones, evaluaciones, veredictos" "ApiService"
                paymentService = component "PaymentService" "Crear PaymentIntent, listar, reembolsar" "ApiService"
                adminService = component "AdminService" "Stats, usuarios, roles, pagos" "ApiService"
                notificationService = component "NotificationService" "Endpoints test de notificaciones" "ApiService"
            }

            // ============================================================
            // CONTENEDOR: Backend API (Django REST)
            // ============================================================
            backend = container "API REST" "Backend Django con DRF que expone la lógica de negocio" "Python + Django + DRF" {
                // --- API Gateway ---
                apiGateway = component "ApiGateway" "Enrutador principal de URLs (/api/*). Middleware: CORS, Auth JWT, CSRF" "config/urls.py"

                // --- APP: Accounts ---
                accountsApp = component "Accounts App" "Autenticación, registro, perfiles, roles y administración de usuarios" "apps/accounts" {
                    registroView = component "RegistroView" "CreateAPIView: registro de nuevos usuarios (RF-04)" "accounts/views.py"
                    loginView = component "LoginView" "TokenObtainPairView: autenticación JWT" "simplejwt"
                    perfilView = component "PerfilView" "RetrieveUpdateAPIView: ver/editar perfil propio" "accounts/views.py"
                    cambiarPasswordView = component "CambiarPasswordView" "APIView: cambio de contraseña con validación" "accounts/views.py"
                    adminUsuariosView = component "AdminUsuariosView" "APIView: listar usuarios con búsqueda (admin)" "accounts/admin_views.py"
                    adminCambiarRolView = component "AdminCambiarRolView" "APIView: cambiar rol de usuario" "accounts/admin_views.py"
                    adminToggleEstadoView = component "AdminToggleEstadoView" "APIView: activar/desactivar usuario" "accounts/admin_views.py"
                    adminPostulacionesView = component "AdminPostulacionesView" "APIView: listar todas las postulaciones" "accounts/admin_views.py"
                    adminPagosView = component "AdminPagosView" "APIView: listar todos los pagos" "accounts/admin_views.py"
                    adminStatsView = component "AdminStatsView" "APIView: estadísticas del sistema" "accounts/admin_views.py"
                    userModel = component "UserModel" "Modelo personalizado: AbstractBaseUser, email as username, roles (ADMIN, ORG, REV, AUTOR)" "accounts/models.py"
                    registroSerializer = component "RegistroSerializer" "Validación y creación de usuarios" "accounts/serializers.py"
                    perfilSerializer = component "PerfilSerializer" "Serialización de datos del perfil" "accounts/serializers.py"
                }

                // --- APP: Conferences ---
                conferencesApp = component "Conferences App" "CRUD de conferencias, plantillas, participantes e invitaciones" "apps/conferences" {
                    conferenciaListCreateView = component "ConferenciaListCreateView" "ListCreateAPIView: listar/crear conferencias" "conferences/views.py"
                    conferenciaDetailView = component "ConferenciaDetailView" "RetrieveUpdateDestroyAPIView: detalle/editar/eliminar" "conferences/views.py"
                    conferenciaDesdeTemplateView = component "ConferenciaDesdeTemplateView" "APIView: clonar desde plantilla (RF-03)" "conferences/views.py"
                    participantesView = component "ParticipantesView" "ListCreateAPIView: gestionar participantes" "conferences/views.py"
                    invitarRevisorView = component "InvitarRevisorView" "CreateAPIView: invitar revisor por email (RF-11)" "conferences/views.py"
                    aceptarInvitacionView = component "AceptarInvitacionView" "APIView: aceptar/rechazar invitación" "conferences/views.py"
                    inscribirView = component "InscribirView" "APIView: inscribirse como asistente con Stripe" "conferences/views.py"
                    conferenciaModel = component "ConferenciaModel" "Modelo: Evento -> Conferencia con estado, visibilidad, rúbrica, áreas temáticas" "conferences/models.py"
                    conferenciaUsuarioModel = component "ConferenciaUsuarioModel" "Modelo M2M: usuario-rol por conferencia" "conferences/models.py"
                    invitacionRevisorModel = component "InvitacionRevisorModel" "Modelo: invitaciones con token y expiración" "conferences/models.py"
                    esOrganizadorOAdminPermission = component "EsOrganizadorOAdmin" "Permission: solo organizador/admin modifican" "conferences/permissions.py"
                }

                // --- APP: Submissions ---
                submissionsApp = component "Submissions App" "Gestión de ponencias, postulaciones, estados y certificados" "apps/submissions" {
                    ponenciaListCreateView = component "PonenciaListCreateView" "ListCreateAPIView: listar/crear ponencias" "submissions/views.py"
                    ponenciaDetailView = component "PonenciaDetailView" "RetrieveUpdateDestroyAPIView: detalle/editar" "submissions/views.py"
                    cambiarEstadoView = component "CambiarEstadoView" "APIView: transicionar estados de ponencia" "submissions/views.py"
                    confirmarPagoView = component "ConfirmarPagoView" "APIView: confirmar pago de ponencia (RF-10)" "submissions/views.py"
                    enviarCambiosView = component "EnviarCambiosView" "APIView: reenvío de paper corregido (RF-16)" "submissions/views.py"
                    misPostulacionesView = component "MisPostulacionesView" "APIView: postulaciones del usuario autenticado" "submissions/views.py"
                    certificadoListView = component "CertificadoListView" "APIView: listar certificados disponibles" "submissions/certificate_views.py"
                    certificadoDescargarView = component "CertificadoDescargarView" "APIView: descargar PDF certificado" "submissions/certificate_views.py"
                    ponenciaModel = component "PonenciaModel" "Modelo: título, resumen, archivo, estado, autores, área temática" "submissions/models.py"
                    respuestaFormularioModel = component "RespuestaFormularioModel" "Modelo: respuestas a campos personalizados (RF-06)" "submissions/models.py"
                    postularPonenciaService = component "PostularPonenciaService" "Servicio: valida apertura, formato, crea ponencia + respuestas (RF-05)" "submissions/services.py"
                    cambiarEstadoService = component "CambiarEstadoService" "Servicio: máquina de estados con transiciones válidas" "submissions/services.py"
                    enviarCambiosService = component "EnviarCambiosService" "Servicio: valida plazo, autor, formato y actualiza (RF-16)" "submissions/services.py"
                    puedeVerPonenciaPermission = component "PuedeVerPonencia" "Permission: autor, organizador o revisor activo" "submissions/permissions.py"
                }

                // --- APP: Reviews ---
                reviewsApp = component "Reviews App" "Asignación de revisores, evaluación ciega, veredictos" "apps/reviews" {
                    asignarRevisorView = component "AsignarRevisorView" "APIView: asignación manual de revisor (RF-13)" "reviews/views.py"
                    asignarAutomaticoView = component "AsignarAutomaticoView" "APIView: asignación automática por área temática (RF-13)" "reviews/views.py"
                    misAsignacionesView = component "MisAsignacionesView" "APIView: asignaciones activas del revisor" "reviews/views.py"
                    detalleRevisionView = component "DetalleRevisionView" "APIView: detalle de revisión (ciego al autor)" "reviews/views.py"
                    completarRevisionView = component "CompletarRevisionView" "APIView: enviar evaluación (RF-15)" "reviews/views.py"
                    revisionesPonenciaView = component "RevisionesPonenciaView" "APIView: todas las revisiones de una ponencia (RF-17)" "reviews/views.py"
                    veredictoView = component "VeredictoView" "APIView: emitir/consultar veredicto final (RF-15)" "reviews/views.py"
                    asignacionRevisorModel = component "AsignacionRevisorModel" "Modelo: puente ponencia-revisor con es_desempate" "reviews/models.py"
                    revisionModel = component "RevisionModel" "Modelo: evaluación con rúbrica, comentarios, veredicto" "reviews/models.py"
                    veredictoModel = component "VeredictoModel" "Modelo: resultado final con plazo_cambios y notificación" "reviews/models.py"
                    asignarRevisorService = component "AsignarRevisorService" "Servicio: valida límites, crea asignación + revisión (RF-13)" "reviews/services.py"
                    completarRevisionService = component "CompletarRevisionService" "Servicio: guarda evaluación, verifica mayoría (RF-14/15)" "reviews/services.py"
                    emitirVeredictoService = component "EmitirVeredictoService" "Servicio: crea veredicto, cambia estado, reembolsa si aplica (RF-09/15/18)" "reviews/services.py"
                }

                // --- APP: Payments ---
                paymentsApp = component "Payments App" "Integración con Stripe, gestión de pagos y reembolsos" "apps/payments" {
                    crearPagoView = component "CrearPagoView" "APIView: crear PaymentIntent en Stripe" "payments/views.py"
                    stripeWebhookView = component "StripeWebhookView" "APIView: webhook Stripe (confirmación, fallo)" "payments/views.py"
                    listarPagosView = component "ListarPagosView" "APIView: historial de pagos del usuario" "payments/views.py"
                    detallePagoView = component "DetallePagoView" "APIView: detalle de un pago específico" "payments/views.py"
                    reembolsarPagoView = component "ReembolsarPagoView" "APIView: reembolsar pago completado" "payments/views.py"
                    pagoModel = component "PagoModel" "Modelo: payment intent, charge, refund, estado, referencia genérica" "payments/models.py"
                    crearPaymentIntentService = component "CrearPaymentIntentService" "Servicio: crea PaymentIntent + registro Pago" "payments/services.py"
                    confirmarPagoService = component "ConfirmarPagoService" "Servicio: webhook confirma pago, registra charge_id" "payments/services.py"
                    reembolsarPagoService = component "ReembolsarPagoService" "Servicio: crea Refund en Stripe, actualiza estado" "payments/services.py"
                }

                // --- APP: Notifications ---
                notificationsApp = component "Notifications App" "Envío de emails y auditoría de notificaciones" "apps/notifications" {
                    testBienvenidaView = component "TestBienvenidaView" "Endpoint test: email de bienvenida" "notifications/views.py"
                    testAsignacionView = component "TestAsignacionView" "Endpoint test: email asignación revisor" "notifications/views.py"
                    testVeredictoView = component "TestVeredictoView" "Endpoint test: email veredicto + feedback anónimo (RF-18)" "notifications/views.py"
                    testPaperReenviadoView = component "TestPaperReenviadoView" "Endpoint test: email paper reenviado" "notifications/views.py"
                    emailLogModel = component "EmailLogModel" "Modelo: log de emails con tipo, estado, error" "notifications/models.py"
                    enviarEmailService = component "EnviarEmailService" "Servicio: envía email HTML+texto con template, registra log" "notifications/services.py"
                }

                // --- Componente Compartido: Core ---
                coreComponent = component "Core (Abstract)" "Modelo abstracto Evento como base polimórfica para conferencias y futuros eventos" "apps/core/models.py"
            }

            // ============================================================
            // CONTENEDOR: Base de Datos
            // ============================================================
            database = container "Base de Datos" "Almacenamiento persistente de datos del sistema" "MariaDB 10.x"
        }

        // ============================================================
        // SISTEMAS EXTERNOS
        // ============================================================
        stripe = softwareSystem "Stripe API" "Pasarela de pagos: PaymentIntents, Charges, Refunds" {
            stripeApi = component "Stripe API" "API REST de Stripe para procesar pagos" "REST"
        }

        smtpServer = softwareSystem "Servidor SMTP" "Servicio de correo saliente (Gmail SMTP)" {
            smtpApi = component "SMTP Server" "Envío de correos electrónicos" "SMTP"
        }

        // ============================================================
        // RELACIONES (Personas -> Sistema)
        // ============================================================
        autor -> smartchair "Envía artículos, consulta estados, descarga certificados"
        revisor -> smartchair "Evalúa trabajos, emite comentarios, recibe asignaciones"
        organizador -> smartchair "Crea eventos, asigna revisores, valida pagos"
        administrador -> smartchair "Configura sistema, gestiona usuarios, monitorea"

        // ============================================================
        // RELACIONES (Usuarios -> Frontend Components)
        // ============================================================
        autor -> landingPage "Visualiza información pública"
        autor -> loginPage "Se autentica"
        autor -> registerPage "Se registra (RF-04)"
        autor -> dashboardPage "Ve resumen de actividad"
        autor -> conferenciasPage "Explora conferencias"
        autor -> detalleConferenciaPage "Ve detalle y se postula"
        autor -> misPonenciasPage "Gestiona sus ponencias"
        autor -> misPostulacionesPage "Consulta estado postulaciones"
        autor -> pagosPage "Gestiona pagos"
        autor -> certificadosPage "Descarga certificados"
        autor -> perfilPage "Edita perfil"

        revisor -> loginPage "Se autentica"
        revisor -> dashboardPage "Ve resumen"
        revisor -> misRevisionesPage "Revisa asignaciones y evalúa"
        revisor -> perfilPage "Edita perfil"

        organizador -> loginPage "Se autentica"
        organizador -> dashboardPage "Ve métricas"
        organizador -> conferenciasPage "Gestiona conferencias"
        organizador -> detalleConferenciaPage "Administra conferencia"
        organizador -> adminPanelPage "Panel de gestión"

        administrador -> loginPage "Se autentica"
        administrador -> adminPanelPage "Administra sistema completo"
        administrador -> perfilPage "Edita perfil"

        // ============================================================
        // RELACIONES (Frontend Components -> Frontend Services)
        // ============================================================
        loginPage -> authService "Autentica usuario"
        registerPage -> authService "Registra nuevo usuario"
        dashboardPage -> apiService "Consume datos del dashboard"
        conferenciasPage -> conferenceService "Lista conferencias"
        detalleConferenciaPage -> conferenceService "Detalle y CRUD"
        detalleConferenciaPage -> submissionService "Postular ponencia"
        detalleConferenciaPage -> paymentService "Inscripción paga"
        misPonenciasPage -> submissionService "Gestiona ponencias"
        misPostulacionesPage -> submissionService "Consulta postulaciones"
        misRevisionesPage -> reviewService "Gestiona revisiones"
        pagosPage -> paymentService "Historial de pagos"
        certificadosPage -> submissionService "Lista certificados"
        perfilPage -> authService "Actualiza perfil"
        adminPanelPage -> adminService "Estadísticas y gestión"

        apiService -> eventBus "Emite eventos de error y éxito"

        // ============================================================
        // RELACIONES (Frontend Services -> Backend API Gateway)
        // ============================================================
        authService -> apiGateway "HTTP POST /api/auth/*"
        conferenceService -> apiGateway "HTTP /api/conferencias/*"
        submissionService -> apiGateway "HTTP /api/conferencias/* + mis-postulaciones"
        reviewService -> apiGateway "HTTP /api/reviews/*"
        paymentService -> apiGateway "HTTP /api/payments/*"
        adminService -> apiGateway "HTTP /api/auth/admin/*"
        notificationService -> apiGateway "HTTP /api/notifications/*"

        // ============================================================
        // RELACIONES (Backend API Gateway -> Backend Components)
        // ============================================================
        apiGateway -> accountsApp "Rutas /api/auth/*"
        apiGateway -> conferencesApp "Rutas /api/conferencias/*"
        apiGateway -> submissionsApp "Rutas /api/conferencias/<slug>/ponencias/*"
        apiGateway -> reviewsApp "Rutas /api/reviews/*"
        apiGateway -> paymentsApp "Rutas /api/payments/*"
        apiGateway -> notificationsApp "Rutas /api/notifications/*"

        // ============================================================
        // RELACIONES INTERNAS: Accounts App
        // ============================================================
        registroView -> registroSerializer "Valida y serializa datos"
        registroView -> userModel "Crea usuario en BD"
        loginView -> userModel "Verifica credenciales"
        perfilView -> perfilSerializer "Serializa perfil"
        perfilView -> userModel "Actualiza perfil"
        adminUsuariosView -> userModel "Consulta usuarios"
        adminCambiarRolView -> userModel "Actualiza rol"
        adminToggleEstadoView -> userModel "Cambia is_active"

        // ============================================================
        // RELACIONES INTERNAS: Conferences App
        // ============================================================
        conferenciaListCreateView -> conferenciaModel "CRUD conferencias"
        conferenciaDetailView -> conferenciaModel "CRUD detalle"
        conferenciaDetailView -> esOrganizadorOAdminPermission "Controla acceso"
        conferenciaDesdeTemplateView -> conferenciaModel "Clona desde plantilla"
        participantesView -> conferenciaUsuarioModel "Gestiona participantes"
        invitarRevisorView -> invitacionRevisorModel "Crea invitación"
        aceptarInvitacionView -> invitacionRevisorModel "Actualiza estado"
        inscribirView -> conferenciaUsuarioModel "Registra inscripción"
        inscribirView -> paymentsApp "Crea PaymentIntent"

        // ============================================================
        // RELACIONES INTERNAS: Submissions App
        // ============================================================
        ponenciaListCreateView -> postularPonenciaService "Delega creación"
        ponenciaDetailView -> ponenciaModel "CRUD ponencia"
        ponenciaDetailView -> puedeVerPonenciaPermission "Controla acceso"
        cambiarEstadoView -> cambiarEstadoService "Delega transición"
        confirmarPagoView -> ponenciaModel "Confirma pago"
        enviarCambiosView -> enviarCambiosService "Delega reenvío"
        misPostulacionesView -> ponenciaModel "Filtra por autor"
        certificadoListView -> ponenciaModel "Lista aceptadas"
        certificadoDescargarView -> ponenciaModel "Genera PDF"

        postularPonenciaService -> ponenciaModel "Crea ponencia"
        postularPonenciaService -> respuestaFormularioModel "Crea respuestas"
        cambiarEstadoService -> ponenciaModel "Actualiza estado"
        enviarCambiosService -> ponenciaModel "Actualiza archivo y estado"

        // ============================================================
        // RELACIONES INTERNAS: Reviews App
        // ============================================================
        asignarRevisorView -> asignarRevisorService "Delega asignación"
        asignarAutomaticoView -> asignarRevisorService "Asignación automática"
        completarRevisionView -> completarRevisionService "Delega evaluación"
        veredictoView -> emitirVeredictoService "Delega veredicto"

        asignarRevisorService -> asignacionRevisorModel "Crea asignación"
        asignarRevisorService -> revisionModel "Crea revisión"
        completarRevisionService -> revisionModel "Actualiza evaluación"
        completarRevisionService -> emitirVeredictoService "Dispara veredicto si mayoría"
        emitirVeredictoService -> veredictoModel "Crea veredicto"
        emitirVeredictoService -> submissionsApp "Cambia estado ponencia"
        emitirVeredictoService -> paymentsApp "Solicita reembolso si RECHAZADO"

        // ============================================================
        // RELACIONES INTERNAS: Payments App
        // ============================================================
        crearPagoView -> crearPaymentIntentService "Delega creación"
        stripeWebhookView -> confirmarPagoService "Confirma pago"
        reembolsarPagoView -> reembolsarPagoService "Delega reembolso"

        crearPaymentIntentService -> pagoModel "Crea registro Pago"
        crearPaymentIntentService -> stripe "POST /v1/payment_intents"
        confirmarPagoService -> pagoModel "Actualiza estado COMPLETADO"
        reembolsarPagoService -> pagoModel "Actualiza estado REEMBOLSADO"
        reembolsarPagoService -> stripe "POST /v1/charges/{id}/refund"

        // ============================================================
        // RELACIONES INTERNAS: Notifications App
        // ============================================================
        testBienvenidaView -> enviarEmailService "Envía bienvenida"
        testAsignacionView -> enviarEmailService "Envía asignación"
        testVeredictoView -> enviarEmailService "Envía veredicto"
        testPaperReenviadoView -> enviarEmailService "Envía reenvío"

        enviarEmailService -> emailLogModel "Registra envío"
        enviarEmailService -> smtpServer "Envía email vía SMTP"

        // ============================================================
        // RELACIONES: Backend -> Database
        // ============================================================
        userModel -> database "CRUD usuarios"
        conferenciaModel -> database "CRUD conferencias"
        conferenciaUsuarioModel -> database "CRUD participantes"
        invitacionRevisorModel -> database "CRUD invitaciones"
        ponenciaModel -> database "CRUD ponencias"
        respuestaFormularioModel -> database "CRUD respuestas"
        asignacionRevisorModel -> database "CRUD asignaciones"
        revisionModel -> database "CRUD revisiones"
        veredictoModel -> database "CRUD veredictos"
        pagoModel -> database "CRUD pagos"
        emailLogModel -> database "CRUD logs email"
    }

    // ============================================================
    // VISTAS
    // ============================================================

    views {
        // --- Vista Nivel 1: System Context ---
        systemContext smartchair "VistaContexto" "Diagrama de contexto del sistema SmartChair (Nivel 1)" {
            include *
            autolayout lr
        }

        // --- Vista Nivel 2: Containers ---
        containerView smartchair "VistaContenedores" "Diagrama de contenedores de SmartChair (Nivel 2)" {
            include *
            autolayout lr
        }

        // --- Vista Nivel 3: Componentes del Frontend ---
        componentView frontend "VistaComponentesFrontend" "Componentes del Frontend SPA (Nivel 3)" {
            include *
            autolayout lr
        }

        // --- Vista Nivel 3: Componentes del Backend ---
        componentView backend "VistaComponentesBackend" "Componentes del Backend API REST (Nivel 3)" {
            include *
            autolayout lr
        }

        // --- Vista Nivel 3: Componentes de Accounts App ---
        componentView accountsApp "VistaComponentesAccounts" "Componentes internos de Accounts App (Nivel 3)" {
            include *
            autolayout lr
        }

        // --- Vista Nivel 3: Componentes de Conferences App ---
        componentView conferencesApp "VistaComponentesConferences" "Componentes internos de Conferences App (Nivel 3)" {
            include *
            autolayout lr
        }

        // --- Vista Nivel 3: Componentes de Submissions App ---
        componentView submissionsApp "VistaComponentesSubmissions" "Componentes internos de Submissions App (Nivel 3)" {
            include *
            autolayout lr
        }

        // --- Vista Nivel 3: Componentes de Reviews App ---
        componentView reviewsApp "VistaComponentesReviews" "Componentes internos de Reviews App (Nivel 3)" {
            include *
            autolayout lr
        }

        // --- Vista Nivel 3: Componentes de Payments App ---
        componentView paymentsApp "VistaComponentesPayments" "Componentes internos de Payments App (Nivel 3)" {
            include *
            autolayout lr
        }

        // ============================================================
        // ESTILOS
        // ============================================================
        styles {
            element "Person" {
                shape Person
                background #08427b
                color #ffffff
                fontSize 14
            }
            element "Software System" {
                background #1168bd
                color #ffffff
                fontSize 14
            }
            element "Container" {
                background #438dd5
                color #ffffff
                fontSize 14
            }
            element "Component" {
                background #85bbf0
                color #000000
                fontSize 12
                border solid
            }

            // --- Estilos por tag ---
            element "Tag:accounts" {
                background #e74c3c
                color #ffffff
            }
            element "Tag:conferences" {
                background #2ecc71
                color #ffffff
            }
            element "Tag:submissions" {
                background #f39c12
                color #ffffff
            }
            element "Tag:reviews" {
                background #9b59b6
                color #ffffff
            }
            element "Tag:payments" {
                background #1abc9c
                color #ffffff
            }
            element "Tag:notifications" {
                background #34495e
                color #ffffff
            }
            element "Tag:services" {
                background #f1c40f
                color #000000
            }
            element "Tag:models" {
                background #95a5a6
                color #ffffff
            }
            element "Tag:external" {
                background #e67e22
                color #ffffff
                shape Hexagon
            }
            element "Database" {
                shape Cylinder
                background #000000
                color #ffffff
            }
            element "Component:Tag:page" {
                shape RoundedBox
                background #3498db
                color #ffffff
            }

            relationship {
                color #707070
                fontSize 10
                dashed false
                routing Direct
            }
            relationship "Tag:async" {
                dashed true
            }
            relationship "Tag:http" {
                color #2c3e50
                fontSize 10
            }
        }

        // ============================================================
        // DESCRIPCIONES DE LOS ELEMENTOS
        // ============================================================
        branding {
            logo "https://raw.githubusercontent.com/YooneR1209/SmartChair/main/images/logo.png"
        }
    }
}
