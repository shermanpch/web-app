FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY apps/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY apps/backend/ .

# Expose port
EXPOSE 8000

# Start the application
CMD ["python", "main.py"] 