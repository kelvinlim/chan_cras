import pytest
import uuid
from app.utils import (
    generate_short_code, 
    uuid7,
    generate_study_code,
    generate_event_code,
    generate_subject_code
)

def test_generate_short_code_default():
    """Test that the generated short code has the old format if requested."""
    code = generate_short_code(use_mid_hyphen=True)
    assert len(code) == 7  # 6 chars + 1 hyphen
    assert "-" in code
    
    parts = code.split("-")
    assert len(parts[0]) == 3
    assert len(parts[1]) == 3

def test_generate_short_code_no_hyphen():
    """Test that the generated short code has no hyphen if requested."""
    code = generate_short_code(use_mid_hyphen=False)
    assert len(code) == 6
    assert "-" not in code

def test_generate_short_code_prefix():
    """Test that the generated short code has the correct prefix."""
    code = generate_short_code(prefix="st-", use_mid_hyphen=False)
    assert code.startswith("st-")
    assert len(code) == 9 # 3 (st-) + 6

def test_specialized_generators():
    """Test specialized generators for different entities."""
    study_code = generate_study_code()
    assert study_code.startswith("st-")
    assert "-" not in study_code[3:]
    
    event_code = generate_event_code()
    assert event_code.startswith("ev-")
    assert "-" not in event_code[3:]

    subject_code = generate_subject_code()
    assert subject_code.startswith("su-")
    assert "-" not in subject_code[3:]

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
