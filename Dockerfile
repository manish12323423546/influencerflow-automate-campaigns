# Base image
FROM python:3.11-slim

# Create non-root user
RUN useradd -m -u 1000 user

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=10000 \
    SHEET_ID=1srvBC83XVx1LS4d8gIiwkWM41sS0Yu3puOHmzwlixrY \
    APIFY_TOKEN=apify_api_XF8XWq7MpAjKR1Yj4TKPBVhqTBGAVj2gHL0D \
    LINKEDIN_USERNAME=kvtvpxgaming@gmail.com \
    LINKEDIN_PASSWORD=Hello@1055 \
    PATH="/home/user/.local/bin:$PATH"

# Set Chrome environment variables
ENV CHROME_BIN=/usr/bin/chromium \
    CHROMEDRIVER_PATH=/home/user/chromedriver

# Create directory for ChromeDriver
RUN mkdir -p /home/user/chrome \
    && chown -R user:user /home/user/chrome

# Temporarily switch to root for installing system packages
USER root
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    wget \
    gnupg \
    && cp /usr/bin/chromedriver /home/user/chromedriver \
    && chown user:user /home/user/chromedriver \
    && chmod +x /home/user/chromedriver \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set working directory
WORKDIR /app

# Copy requirements and install them
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app
COPY --chown=user . .

# Create necessary directories with correct permissions
RUN mkdir -p /home/user/.cache \
    && chown -R user:user /home/user/.cache \
    && chmod -R 755 /home/user/.cache

# Switch back to non-root user
USER user

# Expose the port
EXPOSE 10000

# Start the app
CMD ["python3", "app.py"]