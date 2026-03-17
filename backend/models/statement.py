import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base


class BankType(str, enum.Enum):
    chase = "chase"
    boa = "boa"
    apple_card = "apple_card"
    wells_fargo = "wells_fargo"


class Statement(Base):
    __tablename__ = "statements"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    filename: Mapped[str] = mapped_column(String(256), nullable=False)
    bank_type: Mapped[BankType] = mapped_column(
        Enum(BankType), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction", back_populates="statement", lazy="raise"
    )

    def __repr__(self) -> str:
        return f"<Statement(id={self.id}, filename={self.filename}, bank_type={self.bank_type})>"
