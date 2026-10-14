from . import db
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String


class Categoria(db.Model):
    __tablename__ = "categorias"

    categoria_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    categoria_nombre: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False
    )
    descripcion: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    def to_dict(self):
        return {
            "id": self.categoria_id,
            "nombre": self.categoria_nombre,
            "descripcion": self.descripcion
        }