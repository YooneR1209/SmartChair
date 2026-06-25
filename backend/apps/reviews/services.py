# apps/reviews/services.py

from django.core.exceptions import ValidationError, PermissionDenied
from django.db import transaction
from django.utils import timezone

from .models import AsignacionRevisor, Revision, Veredicto
from apps.submissions.models import Ponencia
from apps.submissions.services import cambiar_estado
from django.contrib.auth import get_user_model


def asignar_revisor(ponencia, revisor, es_desempate=False, usuario=None):
    if revisor == ponencia.autor_principal:
        raise ValidationError("El revisor no puede ser el autor de la ponencia.")

    actuales = AsignacionRevisor.objects.filter(ponencia=ponencia, activo=True).count()

    if actuales >= 5:
        raise ValidationError("La ponencia ya tiene el máximo de 5 revisores.")

    asignacion, creada = AsignacionRevisor.objects.get_or_create(
        ponencia=ponencia,
        revisor=revisor,
        defaults={"es_desempate": es_desempate, "activo": True},
    )

    if not creada:
        raise ValidationError("Este revisor ya está asignado a esta ponencia.")

    Revision.objects.create(asignacion=asignacion)

    if usuario:
        try:
            cambiar_estado(ponencia, Ponencia.Estado.EN_REVISION, usuario)
        except (ValidationError, PermissionDenied):
            pass

    return asignacion


def asignar_revisores_automatico(ponencia):
    from apps.accounts.models import User
    from apps.conferences.models import ConferenciaUsuario
    from collections import namedtuple

    Revisor = namedtuple("Revisor", ("usuario", "categoria_revisor"))

    ids_excluir = {ponencia.autor_principal_id}

    globales_qs = User.objects.filter(rol="revisor", is_active=True).exclude(
        id__in=ids_excluir
    )
    globales_ids = set(globales_qs.values_list("id", flat=True))

    todos_ids = globales_ids
    todos = []
    for uid in todos_ids:
        u = User.objects.filter(id=uid).first()
        if u:
            todos.append(Revisor(usuario=u, categoria_revisor=""))

    min_rev = 1
    if len(todos) < min_rev:
        raise ValidationError(
            f"No hay suficientes revisores disponibles. "
            f"Se necesitan {min_rev}, hay {len(todos)}."
        )

    asignados = 0
    for cu in todos[:min_rev]:
        try:
            asignar_revisor(ponencia, cu.usuario)
            asignados += 1
        except ValidationError:
            continue

    if asignados < min_rev:
        raise ValidationError(
            f"No se pudieron asignar {min_rev} revisores. "
            f"Solo se asignaron {asignados}."
        )

    try:
        cambiar_estado(ponencia, Ponencia.Estado.EN_REVISION, usuario=None)
    except (ValidationError, PermissionDenied):
        pass
    return asignados


def completar_revision(
    revision, veredicto, comentario_autor, comentario_privado, respuestas_rubrica
):
    """RF-15: el revisor completa su evaluación."""
    if revision.esta_completa():
        raise ValidationError("Esta revisión ya fue completada.")

    revision.veredicto = veredicto
    revision.comentario_autor = comentario_autor
    revision.comentario_privado = comentario_privado
    revision.respuestas_rubrica = respuestas_rubrica
    with transaction.atomic():
        revision.estado = Revision.Estado.COMPLETADA
        revision.completada_en = timezone.now()
        revision.save()

        verificar_y_emitir_veredicto(revision.asignacion.ponencia)
    return revision


def verificar_y_emitir_veredicto(ponencia):
    asignaciones = AsignacionRevisor.objects.filter(ponencia=ponencia, activo=True)
    revisiones = [a.revision for a in asignaciones if hasattr(a, "revision")]
    completadas = [r for r in revisiones if r.esta_completa()]

    if len(completadas) < asignaciones.count():
        return None

    votos = [r.veredicto for r in completadas]

    if len(completadas) == 2 and votos[0] != votos[1]:
        _asignar_revisor_desempate(ponencia)
        return None

    resultado = max(set(votos), key=votos.count)
    return emitir_veredicto_final(ponencia, resultado, completadas)


def _asignar_revisor_desempate(ponencia):
    ya_asignados = AsignacionRevisor.objects.filter(
        ponencia=ponencia
    ).values_list("revisor_id", flat=True)

    candidato = (
        get_user_model().objects.filter(rol="revisor", is_active=True)
        .exclude(id__in=ya_asignados)
        .exclude(id=ponencia.autor_principal_id)
        .first()
    )
    if candidato:
        asignar_revisor(ponencia, candidato, es_desempate=True)
        return

    raise ValidationError("No hay revisores disponibles para el desempate.")


def emitir_veredicto_final(ponencia, resultado, revisiones_completadas):
    feedback_anonimo = [
        r.comentario_autor for r in revisiones_completadas if r.comentario_autor
    ]

    veredicto, created = Veredicto.objects.update_or_create(
        ponencia=ponencia,
        defaults={
            "emitido_por": None,
            "resultado": resultado,
            "resumen_para_autor": " | ".join(feedback_anonimo),
            "notificado": True,
        },
    )

    mapa_estado = {
        Veredicto.Resultado.ACEPTADO: Ponencia.Estado.ACEPTADA,
        Veredicto.Resultado.RECHAZADO: Ponencia.Estado.RECHAZADA,
        Veredicto.Resultado.ACEPTADO_CON_CAMBIOS: Ponencia.Estado.ACEPTADA_CON_CAMBIOS,
    }
    cambiar_estado(
        ponencia,
        mapa_estado[resultado],
        usuario=None,
    )

    if veredicto.es_rechazado() and ponencia.pago_confirmado:
        _reembolsar_ponencia(ponencia)

    return veredicto


def _reembolsar_ponencia(ponencia):
    from apps.payments.models import Pago
    from apps.payments.services import reembolsar_pago

    pago = Pago.objects.filter(
        referencia_tipo="Ponencia",
        referencia_id=ponencia.id,
        estado=Pago.Estado.COMPLETADO,
    ).first()

    if pago:
        reembolsar_pago(pago)
