from flask import jsonify, request, abort
from app.models import Producto, Categoria, db


# LISTAR PRODUCTOS
def product_list():
    productos = db.session.execute(
        db.select(Producto)
    ).scalars().all()

    return jsonify([p.to_dict() for p in productos]), 200


# DETALLE PRODUCTO
def product_detail(producto_id):
    producto = db.session.get(Producto, producto_id)

    if not producto:
        abort(404, description="Producto no encontrado")

    return jsonify(producto.to_dict()), 200


# CREAR PRODUCTO
def product_add():
    data = request.get_json()

    if not data:
        abort(400, description="No se recibió información en formato JSON")

    # Campos obligatorios
    required_fields = ["nombre", "precio", "categoria_id"]
    for field in required_fields:
        if field not in data:
            abort(400, description=f"Falta el campo obligatorio: {field}")

    # Validar precio
    if not isinstance(data["precio"], (int, float)) or data["precio"] <= 0:
        return jsonify({"mensaje": "El precio debe ser un número mayor a cero"}), 422

    # Verificar que la categoría exista
    categoria = db.session.get(Categoria, data["categoria_id"])
    if not categoria:
        abort(400, description="La categoría no existe")

    nuevo_producto = Producto(
        nombre=data["nombre"],
        descripcion=data.get("descripcion"),
        precio=data["precio"],
        categoria_id=data["categoria_id"],
        disponible=data.get("disponible", True),
        stock_min=data.get("stock_min")
    )

    db.session.add(nuevo_producto)
    db.session.commit()

    return jsonify(nuevo_producto.to_dict()), 201


# ACTUALIZAR PRODUCTO
def product_update(producto_id):
    data = request.get_json()

    if not data:
        abort(400, description="No se recibió información en formato JSON")

    producto = db.session.get(Producto, producto_id)

    if not producto:
        abort(404, description="Producto no encontrado")

    if "precio" in data:
        if not isinstance(data["precio"], (int, float)) or data["precio"] <= 0:
            abort(422, description="El precio debe ser mayor a cero")

    if "categoria_id" in data:
        categoria = db.session.get(Categoria, data["categoria_id"])
        if not categoria:
            abort(400, description="La categoría no existe")
        producto.categoria_id = data["categoria_id"]

    # Actualización parcial
    producto.nombre = data.get("nombre", producto.nombre)
    producto.descripcion = data.get("descripcion", producto.descripcion)
    producto.precio = data.get("precio", producto.precio)
    producto.disponible = data.get("disponible", producto.disponible)
    producto.stock_min = data.get("stock_min", producto.stock_min)

    db.session.commit()

    return jsonify(producto.to_dict()), 200


# ELIMINAR PRODUCTO
def product_delete(producto_id):
    producto = db.session.get(Producto, producto_id)

    if not producto:
        abort(404, description="Producto no encontrado")

    db.session.delete(producto)
    db.session.commit()

    return jsonify({"mensaje": "Producto eliminado exitosamente"}), 200