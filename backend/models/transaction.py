from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    statement_id: Mapped[int] = mapped_column(
        ForeignKey("statements.id", ondelete="CASCADE"), nullable=False, index=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    merchant: Mapped[str] = mapped_column(String(512), nullable=False)
    normalized_merchant: Mapped[str | None] = mapped_column(String(512), nullable=True)
    raw_description: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True
    )
    is_anomalous: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_subscription: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    statement: Mapped["Statement"] = relationship(
        "Statement", back_populates="transactions", lazy="raise"
    )
    category: Mapped["Category | None"] = relationship(
        "Category", back_populates="transactions", lazy="raise"
    )

    def __repr__(self) -> str:
        return f"<Transaction(id={self.id}, date={self.date}, amount={self.amount}, merchant={self.merchant!r})>"
