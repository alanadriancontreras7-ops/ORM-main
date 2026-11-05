import os
import pymysql
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS 
from flasgger import Swagger 

from app.models import db, Producto, Categoria, Entrada
from app.common import error_bp, Config 
from app.controller import productos_bp, categoria_bp, entrada_bp

# Helper para verificar y crear la base de datos automáticamente si no existe
def ensure_database_exists():
    try:
        conn = pymysql.connect(
            host=Config.HOST,
            user=Config.USER,
            password=Config.PASSWORD,
            port=int(getattr(Config, 'PORT', 3306))
        )
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{Config.DATABASE}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        conn.close()
    except Exception as e:
        print(f"Advertencia al verificar la base de datos MySQL: {e}")

ensure_database_exists()

# Directorio del frontend
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))

# Crear aplicación Flask
app = Flask(__name__, static_folder=frontend_dir, static_url_path="") 
app.config.from_object(Config)

# Inicializar extensiones 
CORS(app, resources={r"/*": {"origins": "*"}}) 
swagger = Swagger(app) 
db.init_app(app) 

# Crear tablas automáticamente en la base de datos
with app.app_context():   
    db.create_all() 

# Ruta de prueba de salud / API
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "OK",
        "mensaje": "API del Sistema de Inventario funcionando correctamente"
    }), 200

# Ruta principal: servir la interfaz frontend si existe
@app.route("/", methods=["GET"]) 
def home():     
    if os.path.exists(os.path.join(frontend_dir, "index.html")):
        return send_from_directory(frontend_dir, "index.html")
    return jsonify({"mensaje": "API funcionando correctamente"}), 200

# Registrar blueprints 
app.register_blueprint(error_bp)
app.register_blueprint(productos_bp) 
app.register_blueprint(categoria_bp)
app.register_blueprint(entrada_bp) 

if __name__ == "__main__":    
    print("Iniciando servidor en http://127.0.0.1:5000 ...")
    app.run(host="0.0.0.0", port=5000, debug=True)
