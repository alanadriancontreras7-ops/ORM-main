from . import db 
from datetime import date 
from sqlalchemy.orm import Mapped, mapped_column, relationship 
from sqlalchemy import Integer, String, Date, ForeignKey 
from flask_sqlalchemy import SQLAlchemy 

class Entrada(db.Model):     
    __tablename__ = "entradas" 


    entra_id: Mapped[int] = mapped_column(         
        Integer,         
        primary_key=True     
        )      
    entra_producto_id: Mapped[int] = mapped_column(         
       Integer,         
       ForeignKey("productos.producto_id"),           
       nullable=False     )      
    entra_cantidad: Mapped[int] = mapped_column(         
       Integer,         
       nullable=False     
       )          

    entra_factura: Mapped[str] = mapped_column(         
       String(100),         
       nullable=False     )      
    entra_stand: Mapped[str] = mapped_column(        
        String(50),         
        nullable=False     
        )      
    entra_ubicacion: Mapped[str] = mapped_column(         
       String(100),         
       nullable=False     
       )      
    entra_fecha: Mapped[date] = mapped_column(         
       Date, 
    default=date.today    
        )

     # Relación ORM     
    producto = relationship("Producto", backref="entradas")      
    def to_dict(self):         
       return {             
         "id": self.entra_id,             
         "producto_id": self.entra_producto_id,             
         "producto_nombre": self.producto.nombre 
         if self.producto else None,             
         "cantidad": self.entra_cantidad,             
         "factura": self.entra_factura,             
         "stand": self.entra_stand,             
         "ubicacion": self.entra_ubicacion,             
         "fecha": self.entra_fecha.isoformat() 
         if self.entra_fecha else None         
} 


