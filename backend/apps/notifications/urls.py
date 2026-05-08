from django.urls import path

from apps.notifications.views import test_bienvenida

urlpatterns = [
    path(
        "test/bienvenida/",
        test_bienvenida,
        name="test_bienvenida"
    ),
]