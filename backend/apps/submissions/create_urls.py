from django.urls import path
from .views import PonenciaCreateView

urlpatterns = [
    path('', PonenciaCreateView.as_view(), name='ponencia-create'),
]
