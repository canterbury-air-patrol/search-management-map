FROM python:3
ENV PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends libgdal-dev && rm -fr /var/lib/apt/lists/*
WORKDIR /code
COPY requirements.txt /code/
RUN python3 -m venv venv && . venv/bin/activate && pip install wheel && pip install -r requirements.txt
COPY . /code/
RUN rm -f /code/smm/local_settings.py
RUN . /code/venv/bin/activate && NODE_DONE=yes ./setup.sh

ENTRYPOINT ["/code/docker/app/start.sh"]
