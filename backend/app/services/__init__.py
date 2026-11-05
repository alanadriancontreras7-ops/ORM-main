from .product_services import (

    product_list,     
    product_detail, 
    product_add,     
    product_update,     
    product_delete 
) 

# Servicios de Categoria 
from . categoria_services import ( 

    categoria_list,     
    categoria_detail,     
    categoria_add,     
    categoria_update,     
    categoria_delete 
) 

# Servicios de Entrada 
from .entrada_services import (  

    entrada_list,     
    entrada_detail,     
    entrada_add,     
    entrada_update,     
    entrada_delete
)  

__all__ = [     
    # Producto     
    "product_list",     
    "product_detail",     
    "product_add",     
    "product_update",     
    "product_delete",      

    # Categoria     
    "categoria_list", 
    "categoria_detail",     
    "categoria_add",     
    "categoria_update",     
    "categoria_delete",     

      # Entrada     
      "entrada_list",     
      "entrada_detail",     
      "entrada_add",     
      "entrada_update",     
      "entrada_delete", 
] 
