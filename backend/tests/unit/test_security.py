from datetime import timedelta

import pytest

from app.core.security import (
    InvalidTokenError,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


class TestPasswordHashing:
    def test_hash_is_not_the_plain_password(self):
        assert hash_password("s3cret-pass") != "s3cret-pass"

    def test_same_password_hashes_differently_each_time(self):
        assert hash_password("s3cret-pass") != hash_password("s3cret-pass")

    def test_verify_accepts_correct_password(self):
        hashed = hash_password("s3cret-pass")
        assert verify_password("s3cret-pass", hashed) is True

    def test_verify_rejects_wrong_password(self):
        hashed = hash_password("s3cret-pass")
        assert verify_password("wrong-pass", hashed) is False


class TestAccessTokens:
    def test_token_round_trips_subject_and_role(self):
        token = create_access_token(subject="42", role="admin")

        payload = decode_access_token(token)

        assert payload["sub"] == "42"
        assert payload["role"] == "admin"

    def test_expired_token_is_rejected(self):
        token = create_access_token(subject="42", role="user", expires_in=timedelta(seconds=-1))

        with pytest.raises(InvalidTokenError):
            decode_access_token(token)

    def test_tampered_token_is_rejected(self):
        token = create_access_token(subject="42", role="user")

        with pytest.raises(InvalidTokenError):
            decode_access_token(token + "tampered")

    def test_garbage_token_is_rejected(self):
        with pytest.raises(InvalidTokenError):
            decode_access_token("not-a-jwt")
