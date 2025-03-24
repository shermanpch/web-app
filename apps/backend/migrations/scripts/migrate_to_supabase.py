#!/usr/bin/env python3
"""
Script to migrate I Ching data from local storage to Supabase database.

This script reads text and image files from the data directory and
imports them into the Supabase iching_texts table and storage.

Requirements:
- You must have Supabase credentials configured in your app config

Usage:
    python migrate_to_supabase.py [--text] [--images]

    --text:   Migrate text data
    --images: Migrate image files

    If no arguments are provided, both text and images will be migrated.
"""

import argparse
import concurrent.futures
import glob
import logging
import os
import queue
import random
import sys
import threading
import time
from functools import wraps

# Add the parent directory to the system path to import config
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))
import postgrest
from app.config import settings
from supabase import create_client

# Set up logging
logs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../logs")
os.makedirs(logs_dir, exist_ok=True)

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),  # Console handler
        logging.FileHandler(os.path.join(logs_dir, "migration.log")),  # File handler
    ],
)

# Create a logger for this module
logger = logging.getLogger(__name__)

try:
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    logger.info("Connected to Supabase")
except Exception as e:
    logger.error(f"Failed to connect to Supabase: {str(e)}")
    sys.exit(1)

# Add locks for thread safety
db_lock = threading.Lock()
count_lock = threading.Lock()


# Retry decorator with exponential backoff
def retry_with_backoff(max_retries=3, initial_delay=1):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            delay = initial_delay
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    retries += 1
                    if retries >= max_retries:
                        raise
                    # Add jitter to the delay
                    sleep_time = delay * (1 + random.random())
                    logger.debug(
                        f"Retrying {func.__name__} after error: {str(e)}, attempt {retries}/{max_retries}, waiting {sleep_time:.2f}s"
                    )
                    time.sleep(sleep_time)
                    delay *= 2  # Exponential backoff
            return func(*args, **kwargs)  # Final attempt

        return wrapper

    return decorator


def check_if_table_exists(table_name):
    try:
        # Check if the table exists by running a simple query
        result = (
            supabase.table(table_name).select("count", count="exact").limit(1).execute()
        )
        return result is not None
    except postgrest.exceptions.APIError as e:
        if "relation" in str(e) and "does not exist" in str(e):
            return False
        raise


def process_text_record(parent_dir, parent_texts, data_dir, supabase_client):
    """Process a single parent directory's text records."""
    success_count = 0
    error_count = 0
    skipped_count = 0
    messages = []
    failed_records = []

    parent_coord = os.path.basename(parent_dir)
    parent_text = parent_texts.get(parent_coord)

    if not parent_text:
        messages.append(f"No parent text found for {parent_coord}, skipping children")
        return success_count, skipped_count, error_count, messages, failed_records

    for child_dir in glob.glob(os.path.join(parent_dir, "[0-9]")):
        child_coord = os.path.basename(child_dir)
        child_text_path = os.path.join(child_dir, "html", "body.txt")

        if not os.path.exists(child_text_path):
            messages.append(f"No child text file found at {child_text_path}")
            continue

        try:
            with open(child_text_path, "r", encoding="utf-8") as f:
                child_text = f.read()

            time.sleep(random.uniform(0.1, 0.5))

            try:
                with db_lock:

                    @retry_with_backoff(max_retries=3, initial_delay=1)
                    def check_record_exists():
                        return (
                            supabase_client.table("iching_texts")
                            .select("id")
                            .eq("parent_coord", parent_coord)
                            .eq("child_coord", child_coord)
                            .execute()
                        )

                    existing = check_record_exists()

                    if existing.data and len(existing.data) > 0:

                        @retry_with_backoff(max_retries=3, initial_delay=1)
                        def update_record():
                            record_id = existing.data[0]["id"]
                            return (
                                supabase_client.table("iching_texts")
                                .update(
                                    {
                                        "parent_text": parent_text,
                                        "child_text": child_text,
                                    }
                                )
                                .eq("id", record_id)
                                .execute()
                            )

                        update_record()
                        messages.append(
                            f"Updated child text record for {parent_coord}/{child_coord} (already existed, not counted as new)"
                        )
                        skipped_count += 1
                    else:

                        @retry_with_backoff(max_retries=3, initial_delay=1)
                        def insert_record():
                            return (
                                supabase_client.table("iching_texts")
                                .insert(
                                    {
                                        "parent_coord": parent_coord,
                                        "child_coord": child_coord,
                                        "parent_text": parent_text,
                                        "child_text": child_text,
                                    }
                                )
                                .execute()
                            )

                        insert_record()
                        messages.append(
                            f"Created child text record for {parent_coord}/{child_coord}"
                        )
                        success_count += 1
            except Exception as e:
                error_msg = f"Error processing child text for {parent_coord}/{child_coord} after retries: {str(e)}"
                messages.append(error_msg)
                error_count += 1
                failed_records.append(f"{parent_coord}/{child_coord}")

        except Exception as e:
            error_msg = f"Error processing child text for {parent_coord}/{child_coord}: {str(e)}"
            messages.append(error_msg)
            error_count += 1
            failed_records.append(f"{parent_coord}/{child_coord}")

    return success_count, skipped_count, error_count, messages, failed_records


def process_image_upload(img_file, data_dir, bucket_name, storage_client):
    """Process a single image upload to Supabase."""
    try:
        rel_path = os.path.relpath(img_file, data_dir)
        path_parts = rel_path.split(os.sep)

        parent_coord = path_parts[0]
        child_coord = path_parts[1]

        if not (
            parent_coord
            and child_coord
            and "-" in parent_coord
            and child_coord.isdigit()
        ):
            return (0, 0, 1, f"Invalid path format for {img_file}")

        dest_path = f"{parent_coord}/{child_coord}/hexagram.jpg"
        time.sleep(random.uniform(0.1, 0.5))

        try:

            @retry_with_backoff(max_retries=3, initial_delay=1)
            def check_file_exists():
                return storage_client.list(f"{parent_coord}/{child_coord}")

            files_response = check_file_exists()

            files = []
            if isinstance(files_response, list):
                files = files_response
            elif hasattr(files_response, "data"):
                files = files_response.data

            if files and any(
                isinstance(file, dict) and file.get("name") == "hexagram.jpg"
                for file in files
            ):
                return (
                    0,
                    1,
                    0,
                    f"Image already exists at {dest_path}. Skipping (this is not an error).",
                )
        except Exception:
            pass

        with open(img_file, "rb") as f:
            file_content = f.read()

        try:

            @retry_with_backoff(max_retries=3, initial_delay=1)
            def upload_file():
                storage_client.upload(dest_path, file_content)

            upload_file()
            return (
                1,
                0,
                0,
                f"Migrated image: {dest_path} (size: {len(file_content)} bytes)",
            )
        except Exception as e:
            error_str = str(e)
            if (
                "409" in error_str
                or "Duplicate" in error_str
                or "already exists" in error_str
            ):
                return (
                    0,
                    1,
                    0,
                    f"Image already exists at {dest_path} (409 Conflict). Skipping (this is not an error).",
                )
            else:
                raise
    except Exception as e:
        return (0, 0, 1, f"Error migrating image {img_file}: {str(e)}")


def process_items_in_queue(
    task_queue, worker_function, max_workers, processor_args=None
):
    """Generic queue processor for both text and image migration."""
    if processor_args is None:
        processor_args = {}

    success_count = 0
    error_count = 0
    skipped_count = 0
    conflict_count = 0
    failed_items = []

    semaphore = threading.Semaphore(max_workers)

    def worker():
        nonlocal success_count, error_count, skipped_count, conflict_count

        while True:
            try:
                item = task_queue.get(timeout=5)
            except queue.Empty:
                break

            try:
                with semaphore:
                    result = worker_function(item, **processor_args)

                    if result[0] == "text":
                        s_count, sk_count, e_count, msgs, failed = result[1]
                        with count_lock:
                            success_count += s_count
                            skipped_count += sk_count
                            error_count += e_count
                            failed_items.extend(failed)

                        for msg in msgs:
                            if "Error" in msg:
                                logger.error(msg)
                            elif "Warning" in msg or "No " in msg:
                                logger.warning(msg)
                            else:
                                logger.info(msg)
                    else:  # image
                        success, skipped, error, message = result[1]
                        with count_lock:
                            success_count += success
                            skipped_count += skipped
                            error_count += error
                            if "409 Conflict" in message:
                                conflict_count += 1
                            if error:
                                failed_items.append(item)

                        if success or skipped:
                            logger.info(message)
                        elif error:
                            logger.error(message)
            except Exception as exc:
                with count_lock:
                    error_count += 1
                    failed_items.append(item)
                logger.error(f"Processing error: {exc}", exc_info=True)
            finally:
                task_queue.task_done()

    workers = []
    for _ in range(max_workers):
        worker_thread = threading.Thread(target=worker)
        worker_thread.daemon = True
        worker_thread.start()
        workers.append(worker_thread)

    return workers, (
        success_count,
        skipped_count,
        error_count,
        conflict_count,
        failed_items,
    )


def migrate_texts_to_supabase():
    """Migrate all text files from local storage to Supabase database."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, "data")
    MAX_WORKERS = 5

    text_queue = queue.Queue()

    logger.info("Checking if iching_texts table exists...")
    if not check_if_table_exists("iching_texts"):
        logger.error(
            "The iching_texts table does not exist. Please run sql/iching_texts.sql first."
        )
        return False

    try:
        existing_records = supabase.table("iching_texts").select("id").execute()
        existing_count = (
            len(existing_records.data) if hasattr(existing_records, "data") else 0
        )
        logger.info(
            f"Found iching_texts table with approximately {existing_count} records."
        )
    except Exception as e:
        logger.warning(f"Found iching_texts table but couldn't count records: {str(e)}")

    parent_texts = {}
    logger.info(f"Starting to migrate text files from {data_dir} directory...")

    logger.info("Processing parent texts...")
    for parent_dir in glob.glob(f"{data_dir}/[0-9]*-[0-9]*"):
        parent_coord = os.path.basename(parent_dir)
        parent_text_path = os.path.join(parent_dir, "html", "body.txt")

        if not os.path.exists(parent_text_path):
            logger.warning(f"No parent text file found at {parent_text_path}")
            continue

        try:
            with open(parent_text_path, "r", encoding="utf-8") as f:
                parent_texts[parent_coord] = f.read()
            logger.info(f"Found parent text for {parent_coord}")
        except Exception as e:
            logger.error(f"Error reading parent text for {parent_coord}: {str(e)}")

    parent_dirs = glob.glob(f"{data_dir}/[0-9]*-[0-9]*")
    logger.info(f"Found {len(parent_dirs)} parent directories to process")

    # Queue up parent directories
    for parent_dir in parent_dirs:
        parent_coord = os.path.basename(parent_dir)
        if parent_texts.get(parent_coord):
            text_queue.put(parent_dir)

    def process_text_item(parent_dir):
        result = process_text_record(parent_dir, parent_texts, data_dir, supabase)
        return ("text", result)

    # Start workers and process queue
    workers, counters = process_items_in_queue(
        text_queue, process_text_item, MAX_WORKERS
    )

    # Wait for queue to be processed
    text_queue.join()

    # Extract results
    success_count, skipped_count, error_count, _, failed_records = counters

    logger.info(
        f"Text migration summary: {success_count} newly added, {skipped_count} updated (already existed), {error_count} failed"
    )

    if failed_records:
        logger.error("Failed to process the following records:")
        for i, coords in enumerate(failed_records, 1):
            logger.error(f"  {i}. {coords}")

    return success_count > 0 or skipped_count > 0


def migrate_images_to_supabase():
    """Migrate all image files from local storage to Supabase storage."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, "data")
    bucket_name = "iching-images"
    MAX_WORKERS = 5

    image_queue = queue.Queue()

    logger.info("Checking if storage bucket exists...")
    try:
        buckets_response = supabase.storage.list_buckets()

        buckets = []
        if isinstance(buckets_response, list):
            buckets = buckets_response
        elif hasattr(buckets_response, "data"):
            buckets = buckets_response.data

        bucket_exists = False
        for bucket in buckets:
            if isinstance(bucket, dict) and bucket.get("name") == bucket_name:
                bucket_exists = True
                break
            elif hasattr(bucket, "name") and bucket.name == bucket_name:
                bucket_exists = True
                break

        if not bucket_exists:
            logger.info(f"Bucket '{bucket_name}' does not exist. Creating it...")
            supabase.storage.create_bucket(bucket_name)
            logger.info(f"Created bucket: {bucket_name}")
        else:
            logger.info(f"Found existing bucket: {bucket_name}")
    except Exception as e:
        logger.error(f"Error checking/creating bucket: {str(e)}")
        return False

    storage_client = supabase.storage.from_(bucket_name)

    image_files = glob.glob(f"{data_dir}/**/images/hexagram.jpg", recursive=True)
    logger.info(f"Found {len(image_files)} images to process")

    # Queue up images
    for img_file in image_files:
        image_queue.put(img_file)

    def process_image_item(img_file):
        result = process_image_upload(img_file, data_dir, bucket_name, storage_client)
        return ("image", result)

    # Start workers and process queue
    processor_args = {}
    workers, counters = process_items_in_queue(
        image_queue, process_image_item, MAX_WORKERS, processor_args
    )

    # Wait for queue to be processed
    image_queue.join()

    # Extract results
    success_count, skipped_count, error_count, conflict_count, failed_files = counters

    # Log summary
    if conflict_count > 0:
        logger.info(
            f"Image migration summary: {success_count} newly uploaded, {skipped_count} skipped, "
            f"including {conflict_count} 409 conflicts, {error_count} failed"
        )
    else:
        logger.info(
            f"Image migration summary: {success_count} newly uploaded, {skipped_count} skipped, {error_count} failed"
        )

    if failed_files:
        logger.error("Failed to upload the following files:")
        for i, file_path in enumerate(failed_files, 1):
            logger.error(f"  {i}. {file_path}")

    return success_count > 0 or skipped_count > 0


def main():
    parser = argparse.ArgumentParser(description="Migrate I Ching data to Supabase")
    parser.add_argument(
        "--migrate-text",
        action="store_true",
        help="Migrate text data to Supabase",
    )
    parser.add_argument(
        "--migrate-images",
        action="store_true",
        help="Migrate image data to Supabase storage",
    )
    args = parser.parse_args()

    # Default: migrate both if no specific argument is provided
    if not args.migrate_text and not args.migrate_images:
        args.migrate_text = True
        args.migrate_images = True

    success = True

    if args.migrate_text:
        logger.info("Starting text migration...")
        text_success = migrate_texts_to_supabase()
        if text_success:
            logger.info("Text migration completed successfully.")
        else:
            logger.error("Text migration failed.")
            success = False

    if args.migrate_images:
        logger.info("Starting image migration...")
        image_success = migrate_images_to_supabase()
        if image_success:
            logger.info("Image migration completed successfully.")
        else:
            logger.error("Image migration failed.")
            success = False

    if success:
        logger.info("Migration completed successfully.")
        return 0
    else:
        logger.error("Migration completed with errors.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
