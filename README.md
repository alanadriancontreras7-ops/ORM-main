# StockMaster - Sistema de Gestión de Inventario (ORM)

Sistema completo de gestión de inventario, catálogo de productos, categorías y registro de movimientos de entrada desarrollado con arquitectura cliente-servidor (**Backend REST API en Flask con SQLAlchemy ORM y MySQL**, y **Frontend SPA interactivo en tiempo real**).

---

## 🚀 Arquitectura y Tecnologías

### 📦 Backend (`/backend`)
- **Lenguaje:** Python 3.13 / 3.14
- **Framework Web:** Flask 3.1
- **ORM:** Flask-SQLAlchemy / SQLAlchemy 2.x
- **Driver de Base de Datos:** PyMySQL
- **Motor de Base de Datos:** MySQL Server (Base de datos: `db_productos`)
- **Documentación de API:** Flasgger / Swagger UI interactivo (`/apidocs`)
- **CORS:** `flask-cors` habilitado para permitir peticiones locales y remotas
- **Patrón de Diseño:** MVC / Blueprints modularizado (Modelos, Controladores/Rutas, Servicios, Configuración y Manejo de Errores)

### 🎨 Frontend (`/frontend`)
- **Formato:** Single Page Application (SPA)
- **Estilos:** Tailwind CSS + CSS personalizado con efectos glassmorphism y animaciones suaves
- **Iconografía:** FontAwesome 6
- **Notificaciones y Confirmaciones:** SweetAlert2
- **Lógica:** Vanilla JavaScript (ES6+) con cálculo dinámico de stock, alertas de stock mínimo, filtros en vivo y validación de formularios
- **Modos de visualización:**
  1. Servido directamente por Flask en `http://127.0.0.1:5000`
  2. Abierto directamente desde el archivo `frontend/index.html` con detección automática de API y selector de host

---

## 📋 Estructura del Proyecto

```text
ORM-main/
├── backend/
│   ├── app/
│   │   ├── common/
│   │   │   ├── config.py           # Configuración de base de datos y entorno
│   │   │   └── error.py            # Manejo global de errores HTTP (400, 404, 422, 500)
│   │   ├── controller/
│   │   │   ├── categoria_routes.py # Endpoints de Categorías con Swagger
│   │   │   ├── product_routes.py   # Endpoints de Productos con Swagger
│   │   │   └── entrada_routes.py   # Endpoints de Entradas con Swagger
│   │   ├── models/
│   │   │   ├── categoria.py        # Modelo ORM Categoria
│   │   │   ├── producto.py         # Modelo ORM Producto
│   │   │   └── entrada.py          # Modelo ORM Entrada
│   │   └── services/
│   │       ├── categoria_services.py # Lógica de negocio de Categorías
│   │       ├── product_services.py   # Lógica de negocio de Productos
│   │       └── entrada_services.py   # Lógica de negocio de Entradas
│   ├── .env                        # Variables de conexión a la base de datos
│   ├── main.py                     # Punto de entrada de la aplicación Flask
│   └── requirements.txt            # Dependencias Python
├── frontend/
│   ├── index.html                  # Interfaz principal SPA y estructura visual
│   ├── styles.css                  # Estilos adicionales, modales y animaciones
│   └── app.js                      # Lógica de frontend, consumo de API y estado
├── iniciar_servidor.bat            # Script de inicio rápido en 1 clic para Windows
└── README.md                       # Documentación del proyecto
```

---

## ⚙️ Requisitos Previos

1. **Python 3.13+ o 3.14+** instalado en el sistema.
2. **Servicio MySQL en ejecución** (MySQL Server, XAMPP o Laragon).
   - Por defecto el proyecto se conecta a `localhost:3306`, usuario `root`, contraseña `1234`.
   - La base de datos `db_productos` y todas sus tablas se crean automáticamente al iniciar la app.
   - Si deseas cambiar la contraseña o usuario, edita el archivo `backend/.env`.

---

## 🏃‍♂️ Cómo Ejecutar la Aplicación

### Opción 1: Con el script automático (Recomendado)
Haz doble clic en el archivo `iniciar_servidor.bat` en la raíz del proyecto. El script iniciará el servidor Flask y abrirá automáticamente tu navegador web en `http://127.0.0.1:5000`.

### Opción 2: Desde la terminal (PowerShell / CMD)
```powershell
cd backend
py -3.14 main.py
```
*(O `python main.py` según tu versión predeterminada).*

Una vez iniciado el servidor, accede a:
- **Aplicación Web (Frontend):** [http://127.0.0.1:5000](http://127.0.0.1:5000)
- **Documentación Swagger:** [http://127.0.0.1:5000/apidocs](http://127.0.0.1:5000/apidocs)
- **Comprobación de Salud API:** [http://127.0.0.1:5000/api/health](http://127.0.0.1:5000/api/health)

---

## 📚 Endpoints de la API REST

### 🏷️ Categorías (`/categorias`)
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/categorias` | Listar todas las categorías |
| `GET` | `/categorias/<id>` | Obtener detalle de una categoría |
| `POST` | `/categorias` | Crear nueva categoría (`nombre`, `descripcion`) |
| `PUT` | `/categorias/<id>` | Actualizar categoría existente |
| `DELETE` | `/categorias/<id>` | Eliminar categoría (valida que no tenga productos asociados) |

### 📦 Productos (`/products`)
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/products` | Listar todos los productos con datos de su categoría |
| `GET` | `/products/<id>` | Obtener información individual de un producto |
| `POST` | `/products` | Crear nuevo producto (`nombre`, `precio`, `categoria_id`, `stock_min`, `descripcion`, `disponible`) |
| `PUT` | `/products/<id>` | Actualizar producto por ID |
| `DELETE` | `/products/<id>` | Eliminar producto (valida que no tenga entradas asociadas) |

### 📥 Entradas de Inventario (`/entradas`)
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/entradas` | Listar todos los movimientos de entrada |
| `GET` | `/entradas/<id>` | Obtener información de una entrada específica |
| `POST` | `/entradas` | Registrar ingreso al almacén (`entra_producto_id`, `entra_cantidad`, `entra_factura`, `entra_stand`, `entra_ubicacion`) |
| `PUT` | `/entradas/<id>` | Modificar una entrada registrada |
| `DELETE` | `/entradas/<id>` | Eliminar entrada del inventario |

