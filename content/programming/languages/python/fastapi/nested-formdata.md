---
title: Handling nested models in FastAPI form models
description: Got a complex object you need to shove into a FastAPI form model? Here’s a clean way to do it.
tags: [thoughts]
published: 2025-05-30T21:56:00-04:00
---

I have an API that looks something like this:

```python
from fastapi import File, Form
from pydantic import BaseModel


class CreateMyObject(BaseModel):
    name: str
    file: File


@app.post("/my_object")
async def create_my_object(data: Annotated[CreateMyObject, Form()]) -> MyObject: ...
```

FastAPI has this cool concept of [ `Form Models`](https://fastapi.tiangolo.com/tutorial/request-form-models/) that allows you to treat a `FormData` input like a pydantic `BaseModel`. So, the API caller would send a `multipart/form-data` object.

```typescript
formData = new FormData();
formData.append("name", "my_name");
formData.append("file", myFile, "my_filename.png");
```

On the backend, I can treat it as though it's a JSON payload that FastAPI deserialized into a pydantic model for me. Nifty feature!

I recently had to extend this API to accept an arbitrary JSON payload:

```python
from fastapi import File, Form
from pydantic import BaseModel


class CreateMyObject(BaseModel):
    name: str
    file: File
    my_complicated_field: ComplicatedModel


@app.post("/my_object")
async def create_my_object(data: Annotated[CreateMyObject, Form()]) -> MyObject: ...
```

Here, `ComplicatedModel` is a heavily nested Pydantic object. This introduces an interesting problem: `FormData` only accepts primitive types—such as strings, blobs, or files—and, as you might imagine, `ComplicatedModel` is not primitive.

My naive approach was, client-side, to `JSON.stringify()` the object on my frontend, converting it to a string, to then pass to backend:

```typescript
formData = new FormData();
formData.append("name", "my_name");
formData.append("file", myFile, "my_filename.png");
formData.append("my_complicated_field", JSON.stringify(myComplicatedObject));
```

Unfortunately, this causes a 422 Validation Error, as FastAPI expects `my_complicated_field` to be a nested object, and _not_ a string. While we could annotate `my_complicated_field` as a `str` and manually perform Pydantic validation inside the model, I generally prefer to rely on API contracts. I really want to be able to statically tell my caller (as enforced via OpenAPI) that "I'm expecting this sort of payload, don't waste your time with something else, thanks"!

Instead, I discovered you can use a [field validator](https://docs.pydantic.dev/latest/concepts/validators/#field-validators) to achieve the desired solution.

```python
from fastapi import File, Form
from pydantic import BaseModel, BeforeValidator
from pydantic_core import from_json


class CreateMyObject(BaseModel):
    name: str
    file: File
    my_complicated_field: Annotated[
        ComplicatedModel, BeforeValidator(lambda val: from_json(val))
    ]


@app.post("/my_object")
async def create_my_object(data: Annotated[CreateMyObject, Form()]) -> MyObject: ...
```

This solution is declarative with the `BeforeValidator` construct, requiring zero changes to any other code. I also learned that `pydantic_core` exports a [`from_json`](https://docs.pydantic.dev/latest/api/pydantic_core/#pydantic_core.from_json), which acts as a faster drop-in replacement for `json.loads`. I'll take it!