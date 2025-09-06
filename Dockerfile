# Base image with Pandoc + LaTeX preinstalled (cost-effective)
FROM pandoc/latex:3.5

# Python runtime
RUN apk add --no-cache python3 py3-pip bash && \
    python3 -m pip install --upgrade pip

WORKDIR /app

COPY Toolchain /app/Toolchain
COPY Toolchain/pyproject.toml /app/Toolchain/pyproject.toml

# Install minimal runtime deps
RUN pip install --no-cache-dir \
    flask==3.* flask-sqlalchemy==3.* gunicorn==23.* email-validator==2.* werkzeug==3.*

ENV FLASK_ENV=production \
    PYTHONUNBUFFERED=1

WORKDIR /app/Toolchain

EXPOSE 8080

CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:8080", "app:app"]

