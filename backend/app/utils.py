import secrets
import uuid
from uuid6 import uuid7 as v7_generator

# Custom alphabet excluding ambiguous chars (0/O, 1/I)
ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

def generate_short_code(length: int = 6, prefix: str = "", use_mid_hyphen: bool = False) -> str:
    """
    Generates a readable code with optional prefix and middle hyphen.
    Example: 'st-A7B9X2' or 'A9X-2M4'.
    
    :param length: Total length of the alphanumeric part.
    :param prefix: Optional string prefix (e.g., 'st-').
    :param use_mid_hyphen: Whether to insert a hyphen in the middle of the code.
    :return: A string containing the formatted code.
    """
    code = ''.join(secrets.choice(ALPHABET) for _ in range(length))
    if use_mid_hyphen:
        mid = length // 2
        code = f"{code[:mid]}-{code[mid:]}"
    return f"{prefix}{code}"

def uuid7() -> uuid.UUID:
    """
    Generates a time-sortable UUID v7.
    
    :return: A UUID v7 object.
    """
    return v7_generator()

def generate_study_code() -> str:
    return generate_short_code(prefix="st-", use_mid_hyphen=False)

def generate_event_code() -> str:
    return generate_short_code(prefix="ev-", use_mid_hyphen=False)

def generate_procedure_code() -> str:
    return generate_short_code(prefix="pr-", use_mid_hyphen=False)

def generate_subject_code() -> str:
    return generate_short_code(prefix="su-", use_mid_hyphen=False)

def generate_user_code() -> str:
    return generate_short_code(prefix="us-", use_mid_hyphen=False)
