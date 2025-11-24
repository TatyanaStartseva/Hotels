from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base
from sqlalchemy import String, Boolean

class UsersOrm(Base):
    __tablename__ = 'users'
    id:Mapped[int] = mapped_column(primary_key = True)
    email: Mapped[str] = mapped_column(String(100), unique=True)
    hashed_password: Mapped[str] = mapped_column(String(200))
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)