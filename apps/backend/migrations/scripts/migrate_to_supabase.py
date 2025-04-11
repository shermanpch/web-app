#!/usr/bin/env python3
"""
Script to migrate I Ching data from local storage to Supabase database.

This script reads text files from the data directory and
imports them into the Supabase iching_texts table.

Requirements:
- You must have Supabase credentials configured in your app config

Usage:
    python migrate_to_supabase.py
"""

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
from supabase import create_client

from app.config import settings

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


def process_items_in_queue(
    task_queue, worker_function, max_workers, processor_args=None
):
    """Process items from a queue using multiple worker threads."""
    success_count = 0
    error_count = 0
    skipped_count = 0
    all_messages = []
    failed_records = []

    def worker():
        nonlocal success_count, error_count, skipped_count

        while True:
            try:
                item = task_queue.get_nowait()
            except queue.Empty:
                break

            try:
                if processor_args:
                    result = worker_function(item, *processor_args)
                else:
                    result = worker_function(item)

                if isinstance(result, tuple) and len(result) == 5:
                    s_count, sk_count, e_count, messages, failed = result
                    with count_lock:
                        success_count += s_count
                        skipped_count += sk_count
                        error_count += e_count
                        all_messages.extend(messages)
                        failed_records.extend(failed)
                else:
                    with count_lock:
                        all_messages.append(result)

            except Exception as e:
                with count_lock:
                    error_count += 1
                    all_messages.append(f"Error processing item {item}: {str(e)}")
                logger.error(f"Error in worker thread: {str(e)}")

            finally:
                task_queue.task_done()

    # Create and start worker threads
    threads = []
    for _ in range(max_workers):
        t = threading.Thread(target=worker)
        t.start()
        threads.append(t)

    # Wait for all threads to complete
    for t in threads:
        t.join()

    return success_count, skipped_count, error_count, all_messages, failed_records


def migrate_texts_to_supabase():
    """Migrate I Ching text data to Supabase."""
    logger.info("Starting I Ching text migration")

    # Define the path to the data directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, "data")

    if not os.path.exists(data_dir):
        logger.error(f"Data directory not found: {data_dir}")
        return

    # Check if the iching_texts table exists
    if not check_if_table_exists("iching_texts"):
        logger.error("iching_texts table does not exist in Supabase")
        return

    # First, collect all parent texts
    parent_texts = {}
    for parent_dir in glob.glob(os.path.join(data_dir, "*-*")):
        parent_coord = os.path.basename(parent_dir)
        parent_text_path = os.path.join(parent_dir, "html", "body.txt")

        if os.path.exists(parent_text_path):
            try:
                with open(parent_text_path, "r", encoding="utf-8") as f:
                    parent_texts[parent_coord] = f.read()
            except Exception as e:
                logger.error(f"Error reading parent text for {parent_coord}: {str(e)}")

    # Create a queue of parent directories to process
    task_queue = queue.Queue()
    for parent_dir in glob.glob(os.path.join(data_dir, "*-*")):
        task_queue.put(parent_dir)

    def process_text_item(parent_dir):
        return process_text_record(parent_dir, parent_texts, data_dir, supabase)

    # Process the queue with multiple workers
    (
        success_count,
        skipped_count,
        error_count,
        messages,
        failed_records,
    ) = process_items_in_queue(task_queue, process_text_item, max_workers=5)

    # Log results
    logger.info("Text migration completed!")
    logger.info(f"Successfully processed: {success_count}")
    logger.info(f"Skipped (already existed): {skipped_count}")
    logger.info(f"Errors: {error_count}")

    if failed_records:
        logger.warning("Failed records:")
        for record in failed_records:
            logger.warning(f"  {record}")

    return success_count, error_count


def main():
    """Main function to run the migration script."""
    logger.info("Starting text migration...")
    success_count, error_count = migrate_texts_to_supabase()
    logger.info(
        f"Text migration completed with {success_count} successes and {error_count} errors"
    )


if __name__ == "__main__":
    main()
