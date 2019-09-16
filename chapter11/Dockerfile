FROM python:3.6-alpine

RUN apk update && apk add postgresql-dev gcc python3-dev musl-dev

# make working dir
RUN mkdir -p /app

# Install dependencies
ADD requirements.txt /tmp
RUN pip install --no-cache-dir -q -r /tmp/requirements.txt

# Add app code
ADD ./app /app
WORKDIR /app

# Run the app.  CMD is required to run on Heroku
ENV FLASK_APP /app/main.py
CMD flask run -h 0.0.0.0 -p $PORT --debugger --reload
