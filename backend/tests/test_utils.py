import pytest
import uuid
from app.utils import generate_short_code, uuid7

def test_generate_short_code():
    """Test that the generated short code has the correct format and length."""
    code = generate_short_code()
    assert len(code) == 7  # 6 chars + 1 hyphen
    assert "-" in code
    
    parts = code.split("-")
    assert len(parts[0]) == 3
    assert len(parts[1]) == 3
    
    # Test uniqueness
    codes = {generate_short_code() for _ in range(100)}
    assert len(codes) == 100

def test_uuid7_v7():
    """Test that uuid7 returns a valid UUID."""
    u = uuid7()
    assert isinstance(u, uuid.UUID)
    
def test_uuid7_ordering():
    """Test that uuid7 is time-sortable."""
    u1 = uuid7()
    import time
    time.sleep(0.001)
    u2 = uuid7()
    assert u1 < u2
