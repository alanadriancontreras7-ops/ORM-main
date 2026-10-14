from flask import jsonify, request, abort
from app.models import Entrada, Producto, db


# LISTAR ENTRADAS
def entrada_list():
    entradas = db.session.execute(
        db.select(Entrada)
    ).scalars().all()

    return jsonify([e.to_dict() for e in entradas]), 200


# DETALLE ENTRADA
def entrada_detail(entrada_id):
    entrada = db.session.get(Entrada, entrada_id)

    if not entrada:
        abort(404, description="Entrada no encontrada")

    return jsonify(entrada.to_dict()), 200


# CREAR ENTRADA
def entrada_add():
    data = request.get_json()

    if not data:
        abort(400, description="No se recibió información en formato JSON")

    required_fields = ["entra_producto_id", "entra_cantidad"]

    for field in required_fields:
        if field not in data:
            abort(400, description=f"Falta el campo obligatorio: {field}")

    # Validar que el producto exista
    producto = db.session.get(Producto, data["entra_producto_id"])

    if not producto:
        abort(400, description="El producto no existe")

    nueva_entrada = Entrada(
        entra_producto_id=data["entra_producto_id"],
        entra_cantidad=data["entra_cantidad"],
        entra_stand=data.get("entra_stand"),
        entra_ubicacion=data.get("entra_ubicacion"),
        entra_factura=data.get("entra_factura")
    )

    db.session.add(nueva_entrada)
    db.session.commit()

    return jsonify(nueva_entrada.to_dict()), 201


# ACTUALIZAR ENTRADA
def entrada_update(entrada_id):
    data = request.get_json()

    if not data:
        abort(400, description="No se recibió información en formato JSON")

    entrada = db.session.get(Entrada, entrada_id)

    if not entrada:
        abort(404, description="Entrada no encontrada")

    entrada.entra_cantidad = data.get("entra_cantidad", entrada.entra_cantidad)
    entrada.entra_stand = data.get("entra_stand", entrada.entra_stand)
    entrada.entra_ubicacion = data.get("entra_ubicacion", entrada.entra_ubicacion)
    entrada.entra_factura = data.get("entra_factura", entrada.entra_factura)

    db.session.commit()

    return jsonify(entrada.to_dict()), 200


# ELIMINAR ENTRADA
def entrada_delete(entrada_id):
    entrada = db.session.get(Entrada, entrada_id)

    if not entrada:
        abort(404, description="Entrada no encontrada")

    db.session.delete(entrada)
    db.session.commit()

    return jsonify({"mensaje": "Entrada eliminada correctamente"}), 200