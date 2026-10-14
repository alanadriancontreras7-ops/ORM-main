from flask import Blueprint, jsonify
from flasgger import swag_from 

error_bp = Blueprint('error', __name__) 
@error_bp.errorhandler(400) 
def error_400(err): 

  return jsonify({            
     "error":"Solicitud incorrecta",          
           "descripcion":str(err)      
                 }), 400 


@error_bp.errorhandler(404)
def error_404(err):        
    return jsonify({           
         "error":"Recurso no encontrado",          
               "descripcion":str(err)       
              }), 404 

@error_bp.errorhandler(422)
def error_422(err):     
      return jsonify({      
          "error": "Validación fallida",         
          "descripcion": str(err)  
       }), 422 

@error_bp.errorhandler(500) 
def error_500(err):        
     return jsonify({ 
       "error":"Error interno del servidor",    
       "descripcion":str(err)         
      }), 500 