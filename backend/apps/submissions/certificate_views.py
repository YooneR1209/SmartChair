from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .models import Ponencia


class CertificadoListView(APIView):
    """GET — lista ponencias aceptadas del usuario (para certificados)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Ponencia.objects.filter(
            autor_principal=request.user,
            estado=Ponencia.Estado.ACEPTADA,
        )
        data = []
        for p in qs:
            data.append({
                'id': p.id,
                'titulo': p.titulo,
                'area_tematica': p.area_tematica,
                'estado': p.estado,
                'postulada_en': p.postulada_en,
                'fecha_creacion': p.postulada_en,
            })
        return JsonResponse(data, safe=False)


class CertificadoDescargarView(APIView):
    """GET — genera y descarga un certificado PDF para una ponencia aceptada."""
    permission_classes = [IsAuthenticated]

    def get(self, request, ponencia_id):
        ponencia = get_object_or_404(
            Ponencia,
            id=ponencia_id,
            autor_principal=request.user,
        )

        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        gold = HexColor('#D4AC0D')
        dark = HexColor('#1A1A2E')

        c.setStrokeColor(gold)
        c.setLineWidth(4)
        c.rect(36, 36, width - 72, height - 72)
        c.setLineWidth(2)
        c.rect(40, 40, width - 80, height - 80)

        c.setFillColor(dark)
        c.setFont('Helvetica-Bold', 28)
        c.drawCentredString(width / 2, height - 120, 'CERTIFICADO')

        c.setStrokeColor(gold)
        c.setLineWidth(1)
        c.line(200, height - 130, width - 200, height - 130)

        c.setFillColor(HexColor('#2C3E50'))
        c.setFont('Helvetica', 12)
        c.drawCentredString(width / 2, height - 165, 'Otorgado a')

        c.setFillColor(dark)
        c.setFont('Helvetica-Bold', 18)
        c.drawCentredString(width / 2, height - 195, ponencia.autor_principal.nombre_completo)

        c.setFillColor(HexColor('#5D6D7E'))
        c.setFont('Helvetica', 11)
        c.drawCentredString(width / 2, height - 225, 'Por la ponencia titulada')

        c.setFillColor(dark)
        c.setFont('Helvetica-Oblique', 14)
        c.drawCentredString(width / 2, height - 255, ponencia.titulo[:80])

        c.setFillColor(HexColor('#5D6D7E'))
        c.setFont('Helvetica', 11)
        c.drawCentredString(width / 2, height - 285, 'Presentada en SmartChair')

        c.setFillColor(HexColor('#5D6D7E'))
        c.setFont('Helvetica', 11)
        c.drawCentredString(width / 2, height - 310, f'Área: {ponencia.area_tematica or "General"}')

        from django.utils import timezone
        c.setFont('Helvetica', 10)
        c.setFillColor(HexColor('#9CA3AF'))
        c.drawCentredString(width / 2, 80, f'Expedido el {timezone.now().strftime("%d de %B de %Y")}')

        c.showPage()
        c.save()

        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="certificado-{ponencia.id}.pdf"'
        return response
