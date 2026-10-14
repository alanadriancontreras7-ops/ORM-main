from flask import Blueprint 
from flasgger import swag_from 
from app.services import (     entrada_list,     
                          entrada_detail,     
                          entrada_add,     
                          entrada_update,     
                          entrada_delete )  

entrada_bp = Blueprint("entradas", __name__) 

# LISTAR ENTRADAS 
@swag_from({     "summary": "Consulta general de entradas",     
            "responses": {        
                 200: {"description": "Lista de entradas"},         
                 404: {"description": "No se encontraron registros"}     
                 } })

@entrada_bp.route("/entradas", methods=["GET"]) 
def get_entrada_list():     
    return entrada_list() 

 # DETALLE ENTRADA 
@swag_from({     
     "summary": "Consulta individual de entrada",     
     "parameters": [         
         {             
             "name": "entrada_id",             
             "in": "path",             
             "type": "integer",             
             "required": True,             
             "description": "ID de la entrada",             
             "example": 1         }   
             ],     
             "responses":
               {         
                   200: {"description": "Detalle de entrada"},         
                   404: {"description": "Entrada no encontrada"}    
                     } }) 
@entrada_bp.route("/entradas/<int:entrada_id>", methods=["GET"])
def get_entrada_detail(entrada_id):     
    return entrada_detail(entrada_id) 

 # CREAR ENTRADA 
@swag_from({     
 "summary": "Registro de entrada",     
 "parameters": [         
     {             
         "name": "body",             
         "in": "body",             
         "required": True,             
         "schema": {                 
             "type": "object",                 
             "required": ["entra_producto_id", "entra_cantidad", "entra_stock_min"],                 
             "properties": {                     
                "entra_producto_id": {"type": "integer", "example": 1},                     
                "entra_cantidad": {"type": "integer", "example": 10},                     
                "entra_stock_min": {"type": "integer", "example": 5},                     
                "entra_stand": {"type": "string", "example": "A1"},                     
                "entra_ubicacion": {"type": "string", "example": "Bodega Central"}                
                  }             
                  }         
                  }     
                  ],     
                  "responses": {         
                      201: {"description": "Entrada creada correctamente"},
                      400: {"description": "Error en el registro"}     
                      } }) 
@entrada_bp.route("/entradas", methods=["POST"]) 
def get_entrada_add():    
    return entrada_add()  

# ACTUALIZAR ENTRADA 
@entrada_bp.route("/entradas/<int:entrada_id>", methods=["PUT"]) 
def get_entrada_update(entrada_id):     
    return entrada_update(entrada_id)  

# ELIMINAR ENTRADA 
@entrada_bp.route("/entradas/<int:entrada_id>", methods=["DELETE"]) 
def get_entrada_delete(entrada_id):     
    return entrada_delete(entrada_id)