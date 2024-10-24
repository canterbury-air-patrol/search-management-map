FROM python:3
ENV PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends libgdal-dev && rm -fr /var/lib/apt/lists/*
RUN mkdir /code
WORKDIR /code
COPY . /code/
RUN rm -fr /code/smm/local_settings.py /code/venv
RUN NODE_DONE=yes ./setup-venv.sh

ENTRYPOINT ["/code/docker/app/start.sh"]
