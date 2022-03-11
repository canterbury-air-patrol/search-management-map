FROM python:3
ENV PYTHONUNBUFFERED 1
RUN apt-get update && apt-get install -y libgdal-dev nodejs && rm -fr /var/lib/apt/lists/*
RUN mkdir /code
WORKDIR /code
COPY . /code/
RUN rm -fr /code/smm/local_settings.py /code/venv
RUN ./setup-venv.sh
CMD ./docker/app/start.sh
