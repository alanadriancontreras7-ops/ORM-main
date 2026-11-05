from flask import Blueprint 
from flasgger import swag_from 
from app.services import (     
    product_add,     
    product_delete,     
    product_detail,     
    product_list,     
    product_update 
    )  
productos_bp = Blueprint('productos', __name__)  

# LISTAR PRODUCTOS
@swag_from({     'summary': 'Consulta general de productos',     'responses': 
            {        
                 200: {'description': 'Lista de productos'},         
                 400: {'description': 'Error en la consulta'}     
                 } })
@productos_bp.route("/products", methods=["GET"]) 
def get_product_list():     
    return product_list()  

# DETALLE PRODUCTO 
@swag_from({     'summary': 'Consulta individual de producto',     'parameters': 
            [         
                {             
                    'name': 'producto_id',             
                    'in': 'path',             
                    'type': 'integer',             
                    'required': True,             
                    'description': 'ID del producto a consultar',             
                    'example': 1         
                    }     
                    ],     
                    'responses': {         
                        200: {'description': 'Información individual del producto'},         
                        404: {'description': 'Producto no encontrado'}    
                          } }) 

@productos_bp.route("/products/<int:producto_id>", methods=["GET"]) 
def get_product_detail(producto_id):
     return product_detail(producto_id)  

# CREAR PRODUCTO 
@swag_from({     
     'summary': 'Registro de productos',     
     'description': 'Crea un nuevo producto en la base de datos',     
     'parameters': [         
          {             
               'name': 'body',             
               'in': 'body',             
               'required': True,             
               'schema': {                 
                    'type': 'object',                 
                    'required': ['nombre', 'precio', 'categoria_id'],                 
                    'properties': {                     
                         'nombre': {'type': 'string', 'example': 'Manzana'},                     
                         'descripcion': {'type': 'string', 'example': 'Manzana Chilena'},                     
                         'precio': {'type': 'number', 'format': 'float', 'example': 10.5},                     
                         'categoria_id': {'type': 'integer', 'example': 1},                     
                         'disponible': {'type': 'boolean', 'example': True}                 
                         }             
                         }         
                         }     
                         ],     
                         'responses': {
                               201: {'description': 'Producto agregado exitosamente'},         
                               400: {'description': 'Error en el registro'},         
                               422: {'description': 'Datos inválidos'}     
                               } }) 
@productos_bp.route("/products", methods=["POST"]) 
def get_product_add():     
    return product_add()  

# ACTUALIZAR PRODUCTO 
@swag_from({     
    'summary': 'Actualización de productos',     
    'description': 'Actualiza un producto por ID',     
    'parameters': [         
        {             
            'name': 'producto_id',             
            'in': 'path',             
            'type': 'integer',             
            'required': True,             
            'description': 'ID del producto a actualizar',             
            'example': 1         
            },         
            {             
                'name': 'body',             
                'in': 'body',             
                'required': True,             
                'schema': {                 
                    'type': 'object',                 
                    'properties': {                     
                        'nombre': {'type': 'string', 'example': 'Manzana Roja'},
                         'descripcion': {'type': 'string', 'example': 'Manzana Chilena Premium'},                     
                         'precio': {'type': 'number', 'format': 'float', 'example': 12.5},                     
                         'categoria_id': {'type': 'integer', 'example': 2},                     
                         'disponible': {'type': 'boolean', 'example': True}                 
                         }             
                         }         
                         }     
                         ],     
                         'responses': {        
                              200: {'description': 'Producto actualizado exitosamente'},         
                              400: {'description': 'Error en la actualización'},         
                              404: {'description': 'Producto no encontrado'}     
                              } }) 
@productos_bp.route("/products/<int:producto_id>", methods=["PUT"]) 
def get_product_update(producto_id):     
    return product_update(producto_id)  

# ELIMINAR PRODUCTO 
@swag_from({     
    'summary': 'Eliminación de productos',     
    'parameters': [         
        {             
            'name': 'producto_id',             
            'in': 'path',             
            'type': 'integer',             
            'required': True,
            'description': 'ID del producto a eliminar', 'example': 1 
            } ], 
            'responses': 
            { 200: {'description': 'Producto eliminado exitosamente'}, 
             404: {'description': 'Producto no encontrado'} 
             } }) 
@productos_bp.route("/products/<int:producto_id>", methods=['DELETE']) 
def get_product_delete(producto_id): 
    return product_delete(producto_id)  