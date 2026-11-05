from flask import jsonify, request, abort
from app.models import Entrada, Producto, db


# LISTAR ENTRADAS
def entrada_list():
    entradas = db.session.execute(
        db.select(Entrada).order_by(Entrada.entra_id.desc())
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

    # Aceptar entra_producto_id o producto_id
    producto_id = data.get("entra_producto_id") if "entra_producto_id" in data else data.get("producto_id")
    cantidad = data.get("entra_cantidad") if "entra_cantidad" in data else data.get("cantidad")

    if producto_id is None:
        abort(400, description="Falta el campo obligatorio: entra_producto_id")
    if cantidad is None:
        abort(400, description="Falta el campo obligatorio: entra_cantidad")

    try:
        producto_id = int(producto_id)
    except (ValueError, TypeError):
        abort(400, description="El producto_id debe ser un número entero")

    try:
        cantidad = int(cantidad)
        if cantidad <= 0:
            abort(400, description="La cantidad debe ser mayor a cero")
    except (ValueError, TypeError):
        abort(400, description="La cantidad debe ser un número entero positivo")

    # Validar que el producto exista
    producto = db.session.get(Producto, producto_id)
    if not producto:
        abort(400, description=f"El producto con ID {producto_id} no existe")

    nueva_entrada = Entrada(
        entra_producto_id=producto_id,
        entra_cantidad=cantidad,
        entra_stand=data.get("entra_stand") or data.get("stand") or "",
        entra_ubicacion=data.get("entra_ubicacion") or data.get("ubicacion") or "",
        entra_factura=data.get("entra_factura") or data.get("factura") or ""
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

    producto_id = data.get("entra_producto_id") if "entra_producto_id" in data else data.get("producto_id")
    if producto_id is not None:
        try:
            prod_id = int(producto_id)
            producto = db.session.get(Producto, prod_id)
            if not producto:
                abort(400, description=f"El producto con ID {prod_id} no existe")
            entrada.entra_producto_id = prod_id
        except (ValueError, TypeError):
            abort(400, description="El producto_id debe ser un número entero")

    cantidad = data.get("entra_cantidad") if "entra_cantidad" in data else data.get("cantidad")
    if cantidad is not None:
        try:
            cant = int(cantidad)
            if cant <= 0:
                abort(400, description="La cantidad debe ser mayor a cero")
            entrada.entra_cantidad = cant
        except (ValueError, TypeError):
            abort(400, description="La cantidad debe ser un número entero válido")

    if "entra_stand" in data or "stand" in data:
        entrada.entra_stand = data.get("entra_stand") or data.get("stand") or ""

    if "entra_ubicacion" in data or "ubicacion" in data:
        entrada.entra_ubicacion = data.get("entra_ubicacion") or data.get("ubicacion") or ""

    if "entra_factura" in data or "factura" in data:
        entrada.entra_factura = data.get("entra_factura") or data.get("factura") or ""

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
