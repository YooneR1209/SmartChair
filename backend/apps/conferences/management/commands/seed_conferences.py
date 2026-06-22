from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.utils import timezone
from apps.accounts.models import User
from apps.conferences.models import Conferencia, ConferenciaUsuario


CONFERENCES = [
    {
        'nombre': 'Conferencia Internacional de Inteligencia Artificial',
        'descripcion': 'Un espacio para compartir los avances más recientes en inteligencia artificial, '
                       'machine learning y deep learning. Se aceptan trabajos originales de investigación '
                       'aplicada y teórica.',
        'slug': 'ia-2026',
        'lugar': 'Universidad Nacional de Loja',
        'areas_tematicas': [
            'INTELIGENCIA ARTIFICIAL',
            'MACHINE LEARNING',
            'PROCESAMIENTO DE LENGUAJE NATURAL',
            'VISIÓN POR COMPUTADORA',
        ],
        'fecha_inicio': '2026-12-10',
        'fecha_fin': '2026-12-12',
        'fecha_apertura_postulaciones': '2026-06-01',
        'fecha_cierre_postulaciones': '2026-10-15',
        'fecha_limite_cambios': '2026-11-15',
        'es_de_pago': True,
        'monto_inscripcion': 50.00,
        'sitio_web': 'https://ia-conference.unl.edu.ec',
    },
    {
        'nombre': 'Simposio de Ingeniería de Software y Tecnologías Web',
        'descripcion': 'Simposio dedicado a las últimas tendencias en ingeniería de software, '
                       'desarrollo web, devops y arquitecturas de microservicios.',
        'slug': 'sistweb-2026',
        'lugar': 'Universidad Nacional de Loja',
        'areas_tematicas': [
            'INGENIERÍA DE SOFTWARE',
            'TECNOLOGÍAS WEB',
            'DEVOPS',
            'ARQUITECTURAS DE SOFTWARE',
        ],
        'fecha_inicio': '2026-11-20',
        'fecha_fin': '2026-11-22',
        'fecha_apertura_postulaciones': '2026-05-15',
        'fecha_cierre_postulaciones': '2026-10-01',
        'fecha_limite_cambios': '2026-10-30',
        'es_de_pago': False,
        'monto_inscripcion': None,
        'sitio_web': 'https://sistweb.unl.edu.ec',
    },
    {
        'nombre': 'Congreso de Ciencia de Datos y Big Data',
        'descripcion': 'Congreso internacional sobre ciencia de datos, analítica, big data, '
                       'visualización de datos y bases de datos NoSQL.',
        'slug': 'datascience-2026',
        'lugar': 'Universidad Nacional de Loja',
        'areas_tematicas': [
            'CIENCIA DE DATOS',
            'BIG DATA',
            'BASES DE DATOS',
            'ANALÍTICA',
        ],
        'fecha_inicio': '2026-10-05',
        'fecha_fin': '2026-10-07',
        'fecha_apertura_postulaciones': '2026-04-01',
        'fecha_cierre_postulaciones': '2026-09-01',
        'fecha_limite_cambios': '2026-09-20',
        'es_de_pago': True,
        'monto_inscripcion': 75.00,
        'sitio_web': 'https://datascience.unl.edu.ec',
    },
    {
        'nombre': 'Jornadas de Ciberseguridad y Privacidad Digital',
        'descripcion': 'Jornadas enfocadas en seguridad informática, ethical hacking, '
                       'privacidad de datos, criptografía y cumplimiento normativo.',
        'slug': 'ciberseguridad-2026',
        'lugar': 'Universidad Nacional de Loja',
        'areas_tematicas': [
            'CIBERSEGURIDAD',
            'PRIVACIDAD',
            'CRIPTOGRAFÍA',
            'SEGURIDAD INFORMÁTICA',
        ],
        'fecha_inicio': '2026-11-10',
        'fecha_fin': '2026-11-12',
        'fecha_apertura_postulaciones': '2026-05-01',
        'fecha_cierre_postulaciones': '2026-10-10',
        'fecha_limite_cambios': '2026-10-25',
        'es_de_pago': False,
        'monto_inscripcion': None,
        'sitio_web': 'https://ciberseguridad.unl.edu.ec',
    },
    {
        'nombre': 'Encuentro de Innovación Educativa y Tecnología',
        'descripcion': 'Encuentro sobre innovación en educación mediada por tecnología, '
                       'plataformas de aprendizaje, gamificación y realidad virtual aplicada '
                       'a la enseñanza.',
        'slug': 'edtech-2026',
        'lugar': 'Universidad Nacional de Loja',
        'areas_tematicas': [
            'INNOVACIÓN EDUCATIVA',
            'TECNOLOGÍA EDUCATIVA',
            'GAMIFICACIÓN',
            'REALIDAD VIRTUAL',
        ],
        'fecha_inicio': '2026-12-01',
        'fecha_fin': '2026-12-03',
        'fecha_apertura_postulaciones': '2026-06-15',
        'fecha_cierre_postulaciones': '2026-11-01',
        'fecha_limite_cambios': '2026-11-20',
        'es_de_pago': True,
        'monto_inscripcion': 35.00,
        'sitio_web': 'https://edtech.unl.edu.ec',
    },
    {
        'nombre': 'Workshop de Desarrollo de Software Ágil',
        'descripcion': 'Workshop práctico sobre metodologías ágiles, Scrum, Kanban, '
                       'CI/CD y gestión de proyectos de software con equipos distribuidos.',
        'slug': 'agile-2026',
        'lugar': 'Universidad Nacional de Loja',
        'areas_tematicas': [
            'METODOLOGÍAS ÁGILES',
            'SCRUM',
            'KANBAN',
            'GESTIÓN DE PROYECTOS',
        ],
        'fecha_inicio': '2026-09-15',
        'fecha_fin': '2026-09-16',
        'fecha_apertura_postulaciones': '2026-04-01',
        'fecha_cierre_postulaciones': '2026-08-30',
        'fecha_limite_cambios': '2026-09-10',
        'es_de_pago': False,
        'monto_inscripcion': None,
        'sitio_web': 'https://agile.unl.edu.ec',
    },
]


class Command(BaseCommand):
    help = 'Crea conferencias de prueba con estado abierto para postular'

    def handle(self, *args, **options):
        organizador = User.objects.filter(
            rol__in=[User.Rol.ORGANIZADOR, User.Rol.ADMINISTRADOR]
        ).first()

        if not organizador:
            self.stdout.write(self.style.WARNING(
                'No hay usuarios organizadores. Creando organizador de prueba...'
            ))
            organizador = User.objects.create_user(
                email='organizador@unl.edu.ec',
                password='Test1234!',
                nombres='Organizador',
                apellidos='Sistema',
                rol=User.Rol.ORGANIZADOR,
                is_staff=True,
            )
            self.stdout.write(self.style.SUCCESS(
                f'Organizador creado: organizador@unl.edu.ec / Test1234!'
            ))

        creadas = 0
        for data in CONFERENCES:
            slug = data['slug']
            if Conferencia.objects.filter(slug=slug).exists():
                self.stdout.write(f'  ↺ {data["nombre"]} — ya existe, omitiendo')
                continue

            conf = Conferencia.objects.create(
                nombre=data['nombre'],
                descripcion=data['descripcion'],
                slug=slug,
                organizador=organizador,
                lugar=data['lugar'],
                areas_tematicas=data['areas_tematicas'],
                estado=Conferencia.Estado.ABIERTA,
                visibilidad=Conferencia.Visibilidad.PUBLICA,
                fecha_inicio=data['fecha_inicio'],
                fecha_fin=data['fecha_fin'],
                fecha_apertura_postulaciones=data['fecha_apertura_postulaciones'],
                fecha_cierre_postulaciones=data['fecha_cierre_postulaciones'],
                fecha_limite_cambios=data['fecha_limite_cambios'],
                es_de_pago=data['es_de_pago'],
                monto_inscripcion=data['monto_inscripcion'],
                sitio_web=data['sitio_web'],
                max_autores=5,
                min_revisores=2,
                max_revisores=3,
            )

            ConferenciaUsuario.objects.create(
                conferencia=conf,
                usuario=organizador,
                rol=ConferenciaUsuario.RolEnConferencia.ORGANIZADOR,
            )

            creadas += 1
            self.stdout.write(self.style.SUCCESS(f'  ✓ {data["nombre"]}'))

        self.stdout.write(self.style.SUCCESS(
            f'\nSe crearon {creadas} conferencias correctamente.'
        ))
