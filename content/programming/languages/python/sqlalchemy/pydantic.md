---
title: Pydantic models in SQLAlchemy
description: We have MongoDB at home
tags: [observations]
published: 2025-01-06T22:15:19-05:00
---

I've been using this snippet a lot recently to transparently de/serialize Pydantic models and JSON transparently with SQLAlchemy.

```python
from sqlalchemy import DateTime, Dialect, func
from sqlalchemy.types import JSON, TypeDecorator, TypeEngine
from sqlalchemy.dialects.postgresql import JSONB
from pydantic import BaseModel
from typing import cast


class PydanticModelType[T: BaseModel](TypeDecorator[T]):
    cache_ok = True
    impl = JSON()

    def __init__(self, pydantic_model: type[T]) -> None:
        self.pydantic_model = pydantic_model
        super().__init__()

    @override
    def load_dialect_impl(self, dialect: Dialect) -> TypeEngine[T]:
        # Use JSONB for PostgreSQL and JSON for other databases.
        if dialect.name == "postgresql":
            return dialect.type_descriptor(JSONB())

        return dialect.type_descriptor(JSON())

    @override
    def process_bind_param(
        self, value: T | None, dialect: Dialect
    ) -> dict[str, Any] | None:
        if value is not None:
            return value.model_dump()
        return value

    @override
    def process_result_value(
        self, value: dict[str, Any] | None, dialect: Dialect
    ) -> T | None:
        if value is not None:
            return self.pydantic_type.model_validate(value)
        return value

    @classmethod
    def _resolve_for_python_type(
        cls,
        pytype: type,
        subtype: type,
        matched_on: type[BaseModel],
    ) -> PydanticModelType[T] | None:
        if (
            isinstance(pytype, type)
            and issubclass(pytype, BaseModel)
            and pytype is not BaseModel
        ):
            specific_py_type = cast(Type[_T], pytype)
            return cls(specific_py_type)
        else:
            return None
```

If using python<3.12, the `T` can be replaced with `T = TypeVar("T", bound=BaseModel)` and it should also subclass `Generic[T]`.

Then, inside a subclass of `DeclarativeBase`, you can use with the modern `Mapped/mapped_column` syntax like:

```python
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
)
from pydantic import BaseModel


class BaseTable(DeclarativeBase):
    type_annotation_map = {
        BaseModel: PydanticModelType
    }


class MyModel(BaseModel):
    pass


class MyTable(BaseTable):
    __tablename__ = "my_table"
    config: Mapped[MyModel]
```

Unfortunately, SQLAlchemy doesn't have a nice way to infer that `MyModel` should be passed to `PydanticModelType` in an easy way, so we have to repeat ourselves.

Additionally, when instantiating your SQLAlchemy engine, you need to pass Pydantic's JSON serializer. Otherwise, it will use Python's default JSON serializer, causing it to freak out.

```python
from pydantic_core import to_json


def _json_serializer(obj: Any) -> str:
    return to_json(obj).decode("utf-8")


engine = create_engine(..., json_serializer=_json_serializer)
```

Note that there isn't a really good way to do change detection via the SQLAlchemy Session API, so you should always manually track your changes and commit when needed.

This package looks like an interesting way to solve the problem, but I have no clue if it works: [`pydantic-changedetect`](https://github.com/team23/pydantic-changedetect/tree/main).
