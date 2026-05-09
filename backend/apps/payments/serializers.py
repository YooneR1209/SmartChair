from rest_framework import serializers

class CrearPagoSerializer(serializers.Serializer):
    monto = serializers.DecimalField(max_digits=8, decimal_places=2)
    moneda = serializers.CharField(max_length=3, default="usd")
    referencia_tipo = serializers.CharField(max_length=50, required=False, default="")
    referencia_id = serializers.IntegerField(required=False, allow_null=True)