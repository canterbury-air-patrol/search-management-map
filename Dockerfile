FROM python:3
ENV PYTHONUNBUFFERED 1
RUN apt-get update && apt-get install -y libgdal-dev && rm -fr /var/lib/apt/lists/*
RUN mkdir /code
WORKDIR /code
COPY . /code/
RUN rm -fr /code/smm/local_settings.py /code/smm/venv
RUN pip install -r requirements.txt
RUN pip install gunicorn
RUN ./setup.sh
CMD ./docker/app/start.sh
