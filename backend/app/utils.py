import secrets
import uuid
from uuid6 import uuid7 as v7_generator

# Custom alphabet excluding ambiguous chars (0/O, 1/I)
ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

def generate_short_code(length: int = 6) -> str:
    """
    Generates a readable code like 'A9X-2M4'.
    
    :param length: Total length of the alphanumeric part (excluding hyphen).
    :return: A string containing the formatted short code.
    """
    code = ''.join(secrets.choice(ALPHABET) for _ in range(length))
    # Insert hyphen in the middle
    mid = length // 2
    return f"{code[:mid]}-{code[mid:]}"

def uuid7() -> uuid.UUID:
    """
    Generates a time-sortable UUID v7.
    
    :return: A UUID v7 object.
    """
    return v7_generator()
