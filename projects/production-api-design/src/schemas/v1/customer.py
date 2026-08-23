from pydantic import BaseModel, Field


class CustomerV1Out(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str
