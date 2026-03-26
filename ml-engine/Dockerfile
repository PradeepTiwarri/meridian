# =============================================================================
# Meridian ML Engine — FastAPI + River Online ML
# =============================================================================
# Lightweight Python image (~200MB) for 1GB EC2 Free Tier
# =============================================================================

FROM python:3.11-slim

WORKDIR /app

# Install dependencies (no cache to save disk)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Non-root user for security
RUN useradd -m -u 1001 meridian
USER meridian

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
