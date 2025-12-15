"""
A standalone, minimal htpasswd parser.

This implementation currently supports bcrypt and SHA1 passwords. SHA1 is insecure.
"""

from __future__ import annotations

import base64
import hashlib
from pathlib import Path

import bcrypt


class HtpasswdFile:
    def __init__(self, content: str):
        """
        Create a HtpasswdFile from a string.
        """
        self.users: dict[str, str] = {}
        for line in content.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if ":" not in line:
                raise ValueError(f"Malformed htpasswd line: {line!r}")
            user, pwhash = line.split(":", 1)
            if not user:
                raise ValueError(f"Malformed htpasswd line: {line!r}")

            is_sha = pwhash.startswith("{SHA}")
            is_bcrypt = pwhash.startswith(("$2y$", "$2b$", "$2a$"))
            if not is_sha and not is_bcrypt:
                raise ValueError(f"Unsupported htpasswd format for user {user!r}")

            self.users[user] = pwhash

    @classmethod
    def from_file(cls, path: Path) -> HtpasswdFile:
        """
        Initializes and loads an htpasswd file.

        Args:
            path: The path to the htpasswd file.

        Raises:
            OSError: If the file cannot be read.
            ValueError: If the file is malformed.
        """
        try:
            content = path.read_text("utf-8")
        except FileNotFoundError:
            raise OSError(f"Htpasswd file not found: {path}") from None
        return cls(content)

    def check_password(self, username: str, password: str) -> bool:
        """
        Checks if a username and password combination is valid.

        Args:
            username: The username to check.
            password: The password to check.

        Returns:
            True if the password is valid, False otherwise.
        """
        pwhash = self.users.get(username)
        if pwhash is None:
            return False

        pwhash = pwhash.split(":", 1)[0]

        if pwhash.startswith("{SHA}"):
            # SHA-1 is insecure for password hashing. Reject authentication.
            raise ValueError(
                "Refusing to authenticate against SHA-1 htpasswd entry for user '{}'. "
                "SHA-1 is insecure and should not be used for password storage. "
                "Please upgrade your htpasswd file to use bcrypt or another secure hash.".format(username)
            )
        else:
            return bcrypt.checkpw(password.encode("utf-8"), pwhash.encode("utf-8"))
