from flask import Flask, jsonify
from flask_cors import CORS 
from flasgger import Swagger 

from app.models import db, Producto, Categoria, Entrada
from app.common import error_bp, Config 
from app.controller import productos_bp, categoria_bp, entrada_bp


# Crear aplicación 
app = Flask(__name__) 

app.config.from_object(Config)

# Inicializar extensiones 
CORS(app) 
swagger = Swagger(app) 
db.init_app(app) 

# Crear tablas automáticamente 
with app.app_context():   
      db.create_all() 
      
@app.route("/", methods=["GET"]) 
def home():     
     """    
     Ruta de prueba para verificar que la API 
      esté funcionando 

     """    
     return jsonify  ({ "mensaje": "API funcionando correctamente"}), 200 

# Registrar blueprints 
app.register_blueprint(error_bp)
app.register_blueprint(productos_bp) 
app.register_blueprint(categoria_bp)
app.register_blueprint(entrada_bp) 

if __name__ == "__main__":    
      app.run(host="0.0.0.0", port=5000, debug=True) 