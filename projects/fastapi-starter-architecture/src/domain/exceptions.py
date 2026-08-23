class DomainException(Exception):
    """Base domain business logic exception."""
    pass


class UserAlreadyExistsError(DomainException):
    def __init__(self, field: str, value: str):
        super().__init__(f"User with {field} '{value}' already exists.")
        self.field = field
        self.value = value


class UserNotFoundError(DomainException):
    def __init__(self, user_id: int):
        super().__init__(f"User with ID '{user_id}' was not found.")
        self.user_id = user_id


class ItemNotFoundError(DomainException):
    def __init__(self, item_id: int):
        super().__init__(f"Item with ID '{item_id}' was not found.")
        self.item_id = item_id


class InvalidItemPriceError(DomainException):
    def __init__(self, price: float):
        super().__init__(f"Price '{price}' is invalid. Must be greater than or equal to zero.")
        self.price = price
