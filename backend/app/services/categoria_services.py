from flask import jsonify, request, abort
from app.models import Categoria, db


# LISTAR CATEGORIAS
def categoria_list():
    categorias = db.session.execute(
        db.select(Categoria)
    ).scalars().all()

    return jsonify([c.to_dict() for c in categorias]), 200


# DETALLE CATEGORIA
def categoria_detail(categoria_id):
    categoria = db.session.get(Categoria, categoria_id)

    if not categoria:
        abort(404, description="Categoría no encontrada")

    return jsonify(categoria.to_dict()), 200


# CREAR CATEGORIA
def categoria_add():
    data = request.get_json()

    if not data:
        abort(400, description="No se recibió información en formato JSON")

    if "nombre" not in data or not str(data["nombre"]).strip():
        abort(400, description="El campo nombre es obligatorio")

    nombre = str(data["nombre"]).strip()
    descripcion = str(data.get("descripcion", "")).strip()

    # Validar nombre único
    existente = db.session.execute(
        db.select(Categoria).where(Categoria.categoria_nombre == nombre)
    ).scalar_one_or_none()
    if existente:
        abort(400, description=f"Ya existe una categoría con el nombre '{nombre}'")

    nueva_categoria = Categoria(
        categoria_nombre=nombre,
        descripcion=descripcion
    )

    db.session.add(nueva_categoria)
    db.session.commit()

    return jsonify(nueva_categoria.to_dict()), 201


# ACTUALIZAR CATEGORIA
def categoria_update(categoria_id):
    data = request.get_json()

    if not data:
        abort(400, description="No se recibió información en formato JSON")

    categoria = db.session.get(Categoria, categoria_id)

    if not categoria:
        abort(404, description="Categoría no encontrada")

    if "nombre" in data:
        nuevo_nombre = str(data["nombre"]).strip()
        if not nuevo_nombre:
            abort(400, description="El nombre de la categoría no puede estar vacío")
        existente = db.session.execute(
            db.select(Categoria).where(
                Categoria.categoria_nombre == nuevo_nombre,
                Categoria.categoria_id != categoria_id
            )
        ).scalar_one_or_none()
        if existente:
            abort(400, description=f"Ya existe otra categoría con el nombre '{nuevo_nombre}'")
        categoria.categoria_nombre = nuevo_nombre

    if "descripcion" in data:
        categoria.descripcion = str(data.get("descripcion", "")).strip()

    db.session.commit()

    return jsonify(categoria.to_dict()), 200


# ELIMINAR CATEGORIA
def categoria_delete(categoria_id):
    categoria = db.session.get(Categoria, categoria_id)

    if not categoria:
        abort(404, description="Categoría no encontrada")

    if categoria.productos and len(categoria.productos) > 0:
        abort(400, description="No se puede eliminar la categoría porque tiene productos asociados")

    db.session.delete(categoria)
    db.session.commit()

    return jsonify({"mensaje": "Categoría eliminada correctamente"}), 200
