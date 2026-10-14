from . import db 
from sqlalchemy.orm import Mapped, mapped_column, relationship 
from sqlalchemy import Integer, String, DECIMAL, Date, Boolean, Text, ForeignKey 
from datetime import date 

class Producto(db.Model):     
    __tablename__ = "productos"  

        
    producto_id: Mapped[int] = mapped_column(         
        Integer,         
        primary_key=True
         )      
    nombre: Mapped[str] = mapped_column(         
        String(150),         
        nullable=False     
        )      
    descripcion: Mapped[str] = mapped_column(         
        Text,         
        nullable=True     
        )      
    precio: Mapped[float] = mapped_column(         
        DECIMAL(10, 2),         
        nullable=True     
        )          
    stock_min: Mapped[int] = mapped_column(         
        Integer,         
        nullable=False     
        )      
    fecha_registro: Mapped[date] = mapped_column(         
        Date,         
        default=date.today     
        )      
    disponible: Mapped[bool] = mapped_column(         
        Boolean,         
        default=True     
        )      
    categoria_id: Mapped[int] = mapped_column( 
Integer,  

ForeignKey("categorias.categoria_id"),         
nullable=False     )      
    # Relación ORM     
categoria = relationship("Categoria", backref="productos")      
def to_dict(self):         
    return {             
        "id": self.producto_id,             
        "nombre": self.nombre,             
        "descripcion": self.descripcion,             
        "precio": float(self.precio) 
        if self.precio else None,             
        "stock_min": self.stock_min,             
        "fecha_registro": self.fecha_registro.isoformat() 
        if self.fecha_registro else None,             
        "disponible": self.disponible,             
        "categoria_id": self.categoria_id,             
        "categoria_nombre": self.categoria.categoria_nombre 
        if self.categoria else None        
    }  