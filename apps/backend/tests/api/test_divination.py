"""Tests for divination endpoints."""

import logging
import os
import random
from uuid import UUID

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from src.models.divination import IChingImage

# Get the logger
logger = logging.getLogger("divination_tests")


class TestDivination:
    """Test suite for divination endpoints."""

    def _cleanup_test_user(self, client, user_id, token):
        """Helper method to clean up test user."""
        if user_id and token:
            headers = {"Authorization": f"Bearer {token}"}
            delete_response = client.delete(
                f"/api/auth/users/{user_id}", headers=headers
            )
            logger.info(
                f"Cleanup: Deleted user {user_id}, status: {delete_response.status_code}"
            )
            return delete_response
        return None

    def test_iching_text_retrieval_non_authenticated(self, client):
        """Test retrieving I-Ching text without providing authentication tokens."""
        # Test coordinates
        test_parent_coord = "1-1"
        test_child_coord = "2"

        # Make request without auth tokens
        iching_response = client.post(
            "/api/divination/iching-text",
            json={"parent_coord": test_parent_coord, "child_coord": test_child_coord},
        )

        # Verify the request fails with the correct status code
        assert (
            iching_response.status_code == 422
        ), "Request should fail with validation error when tokens are missing"

        # Log the error response for debugging
        error_data = iching_response.json()
        logger.info(f"Expected error response: {error_data}")

        # Verify error details mention the missing required parameters
        assert "detail" in error_data
        assert any(
            "access_token" in str(item).lower() for item in error_data["detail"]
        ), "Error should mention missing access_token"
        assert any(
            "refresh_token" in str(item).lower() for item in error_data["detail"]
        ), "Error should mention missing refresh_token"

        logger.info("Non-authenticated token test passed successfully!")

    def test_iching_text_retrieval_authenticated(self, test_user, client, auth_headers):
        """Test retrieving I-Ching text using access and refresh tokens."""
        # The auth_headers fixture already handles signup and login
        # Extract bearer token from auth_headers
        auth_token = auth_headers["Authorization"].replace("Bearer ", "")
        logger.info(f"Using auth token: {auth_token[:10]}...")

        # Get user ID for cleanup
        user_response = client.get("/api/auth/me", headers=auth_headers)
        user_id = (
            user_response.json().get("id") if user_response.status_code == 200 else None
        )

        try:
            # Get a refresh token - we still need to do a login
            login_response = client.post("/api/auth/login", json=test_user)
            assert (
                login_response.status_code == 200
            ), f"Login failed: {login_response.text}"

            # Extract refresh token
            login_data = login_response.json()
            refresh_token = login_data["data"]["session"]["refresh_token"]
            logger.info(f"Using refresh token: {refresh_token[:10]}...")

            # Test coordinates
            test_parent_coord = "1-1"
            test_child_coord = "2"

            # Make the API request with tokens as query parameters
            iching_response = client.post(
                "/api/divination/iching-text",
                json={
                    "parent_coord": test_parent_coord,
                    "child_coord": test_child_coord,
                },
                params={"access_token": auth_token, "refresh_token": refresh_token},
            )

            # Verify successful response
            assert (
                iching_response.status_code == 200
            ), f"I-Ching text retrieval failed: {iching_response.text}"

            # Verify response structure and content
            iching_data = iching_response.json()
            assert "parent_coord" in iching_data
            assert "child_coord" in iching_data
            assert "parent_text" in iching_data
            assert "child_text" in iching_data

            # Verify coordinates match request
            assert iching_data["parent_coord"] == test_parent_coord
            assert iching_data["child_coord"] == test_child_coord

            # Log a preview of the text content
            parent_text = iching_data.get("parent_text", "")
            child_text = iching_data.get("child_text", "")

            if parent_text:
                preview = (
                    parent_text[:50] + "..." if len(parent_text) > 50 else parent_text
                )
                logger.info(f"Parent text preview: {preview}")

            if child_text:
                preview = (
                    child_text[:50] + "..." if len(child_text) > 50 else child_text
                )
                logger.info(f"Child text preview: {preview}")

            logger.info("I-Ching text retrieval test passed successfully!")
        finally:
            # Clean up the test user
            if user_id:
                self._cleanup_test_user(client, user_id, auth_token)

    def test_iching_image_retrieval_non_authenticated(self, client):
        """Test retrieving I-Ching image without providing authentication tokens."""
        # Test coordinates
        test_parent_coord = "1-1"
        test_child_coord = "2"

        # Make request without auth tokens
        iching_response = client.get(
            "/api/divination/iching-image",
            params={
                "parent_coord": test_parent_coord,
                "child_coord": test_child_coord,
            },
        )

        # Verify the request fails with the correct status code
        assert (
            iching_response.status_code == 422
        ), "Request should fail with validation error when tokens are missing"

        # Log the error response for debugging
        error_data = iching_response.json()
        logger.info(f"Expected error response: {error_data}")

        # Verify error details mention the missing required parameters
        assert "detail" in error_data
        assert any(
            "access_token" in str(item).lower() for item in error_data["detail"]
        ), "Error should mention missing access_token"
        assert any(
            "refresh_token" in str(item).lower() for item in error_data["detail"]
        ), "Error should mention missing refresh_token"

        logger.info("Non-authenticated image retrieval test passed successfully!")

    def test_iching_image_retrieval_authenticated(
        self,
        test_user,
        client,
        auth_headers,
    ):
        """Test retrieving I-Ching image using access and refresh tokens."""
        # The auth_headers fixture already handles signup and login
        # Extract bearer token from auth_headers
        auth_token = auth_headers["Authorization"].replace("Bearer ", "")
        logger.info(f"Using auth token: {auth_token[:10]}...")

        # Get user ID for cleanup
        user_response = client.get("/api/auth/me", headers=auth_headers)
        user_id = (
            user_response.json().get("id") if user_response.status_code == 200 else None
        )

        try:
            # Get a refresh token - we still need to do a login
            login_response = client.post("/api/auth/login", json=test_user)
            assert (
                login_response.status_code == 200
            ), f"Login failed: {login_response.text}"

            # Extract refresh token
            login_data = login_response.json()
            refresh_token = login_data["data"]["session"]["refresh_token"]
            logger.info(f"Using refresh token: {refresh_token[:10]}...")

            # Test coordinates
            test_parent_coord = "1-1"
            test_child_coord = "2"

            # Make the API request with tokens as query parameters
            iching_response = client.get(
                "/api/divination/iching-image",
                params={
                    "parent_coord": test_parent_coord,
                    "child_coord": test_child_coord,
                    "access_token": auth_token,
                    "refresh_token": refresh_token,
                },
            )

            # Verify successful response
            assert (
                iching_response.status_code == 200
            ), f"I-Ching image retrieval failed: {iching_response.text}"

            # Verify response structure - should be an IChingImage object
            image_data = iching_response.json()
            assert isinstance(image_data, dict), "Response should be a JSON object"
            assert "parent_coord" in image_data, "Response should contain parent_coord"
            assert "child_coord" in image_data, "Response should contain child_coord"
            assert "image_url" in image_data, "Response should contain image_url"

            # Verify the coordinates match what we requested
            assert image_data["parent_coord"] == test_parent_coord
            assert image_data["child_coord"] == test_child_coord

            # Verify the image URL is valid
            image_url = image_data["image_url"]
            assert isinstance(image_url, str), "Image URL should be a string"
            assert image_url.startswith("http"), "Image URL should be valid"

            # Verify the URL contains expected path components
            assert (
                test_parent_coord in image_url
                or test_parent_coord.replace("-", "/") in image_url
            ), f"URL should contain '{test_parent_coord}'"
            assert (
                test_child_coord in image_url
            ), f"URL should contain '{test_child_coord}'"
            assert "hexagram.jpg" in image_url, "URL should contain 'hexagram.jpg'"

            logger.info(
                f"Image URL: {image_url[:50]}..." if len(image_url) > 50 else image_url
            )
            logger.info("I-Ching image retrieval test passed successfully!")
        finally:
            # Clean up the test user
            if user_id:
                self._cleanup_test_user(client, user_id, auth_token)
