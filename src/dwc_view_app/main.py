import logging, os

# Must set this env var before importing any part of Django
# 'project' is the name of the project created with django-admin.py
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'

from google.appengine.dist import use_library
use_library('django', '1.2')

# Google App Engine imports.
from google.appengine.ext.webapp import util

# Force Django to reload its settings.
from django.conf import settings
settings._target = None

import logging
import django.core.handlers.wsgi
import django.core.signals
import django.db
import django.dispatch.dispatcher

def log_exception(*args, **kwds):
    logging.exception('Exception in request:')

# Force sys.path to have our own directory first, so we can import from it.
import sys
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Log errors.
django.dispatch.Signal.connect(
   django.core.signals.got_request_exception, log_exception)

# Unregister the rollback event handler.
django.dispatch.Signal.disconnect(
    django.core.signals.got_request_exception,
    django.db._rollback_on_exception)

def main():
    # Create a Django application for WSGI.
    application = django.core.handlers.wsgi.WSGIHandler()

    # Run the WSGI CGI handler with that application.
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
