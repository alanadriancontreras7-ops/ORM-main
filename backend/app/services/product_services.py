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
        if field not in data or data[field] is None:
            abort(400, description=f"Falta el campo obligatorio: {field}")

    # Validar precio
    try:
        precio_val = float(data["precio"])
        if precio_val <= 0:
            return jsonify({"mensaje": "El precio debe ser un número mayor a cero"}), 422
    except (ValueError, TypeError):
        return jsonify({"mensaje": "El precio debe ser un número válido mayor a cero"}), 422

    # Verificar que la categoría exista
    try:
        cat_id = int(data["categoria_id"])
    except (ValueError, TypeError):
        abort(400, description="El ID de categoría debe ser un número entero")

    categoria = db.session.get(Categoria, cat_id)
    if not categoria:
        abort(400, description="La categoría no existe")

    stock_min_val = 0
    if "stock_min" in data and data["stock_min"] is not None:
        try:
            stock_min_val = max(0, int(data["stock_min"]))
        except (ValueError, TypeError):
            stock_min_val = 0

    disponible_val = True
    if "disponible" in data:
        disponible_val = bool(data["disponible"])

    nuevo_producto = Producto(
        nombre=str(data["nombre"]).strip(),
        descripcion=data.get("descripcion") or "",
        precio=precio_val,
        categoria_id=cat_id,
        disponible=disponible_val,
        stock_min=stock_min_val
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

    if "precio" in data and data["precio"] is not None:
        try:
            precio_val = float(data["precio"])
            if precio_val <= 0:
                abort(422, description="El precio debe ser mayor a cero")
            producto.precio = precio_val
        except (ValueError, TypeError):
            abort(422, description="El precio debe ser un número válido")

    if "categoria_id" in data and data["categoria_id"] is not None:
        try:
            cat_id = int(data["categoria_id"])
            categoria = db.session.get(Categoria, cat_id)
            if not categoria:
                abort(400, description="La categoría no existe")
            producto.categoria_id = cat_id
        except (ValueError, TypeError):
            abort(400, description="El ID de categoría no es válido")

    if "nombre" in data and data["nombre"] is not None:
        nom = str(data["nombre"]).strip()
        if not nom:
            abort(400, description="El nombre no puede estar vacío")
        producto.nombre = nom

    if "descripcion" in data:
        producto.descripcion = data.get("descripcion") or ""

    if "disponible" in data and data["disponible"] is not None:
        producto.disponible = bool(data["disponible"])

    if "stock_min" in data and data["stock_min"] is not None:
        try:
            producto.stock_min = max(0, int(data["stock_min"]))
        except (ValueError, TypeError):
            pass

    db.session.commit()

    return jsonify(producto.to_dict()), 200


# ELIMINAR PRODUCTO
def product_delete(producto_id):
    producto = db.session.get(Producto, producto_id)

    if not producto:
        abort(404, description="Producto no encontrado")

    if producto.entradas and len(producto.entradas) > 0:
        abort(400, description="No se puede eliminar el producto porque tiene entradas de inventario registradas")

    db.session.delete(producto)
    db.session.commit()

    return jsonify({"mensaje": "Producto eliminado exitosamente"}), 200
