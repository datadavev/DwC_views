from django.conf.urls.defaults import *
from django.conf import settings

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Dynamic CSS (Django CSS Templates)
    (r'^pcss/(?P<stylefile>.+)$', 'views.pcss'),
    # Serve Static Content (Should Only Be Used For Testing!)
    (r'^static/(?P<path>.*)$', 'django.views.static.serve',
      {'document_root': settings.STATIC_DOC_ROOT, 'show_indexes': False}),
    # Darwin Core Views Gateway Web Services
    (r'^gateway/$', 'views.getSummary'),
    (r'^gateway/fields$', 'views.getFields'),
    (r'^gateway/fields/(?P<name>[A-Za-z0-9_]+)$', 'views.getField'),
    (r'^gateway/fields/(?P<name>[A-Za-z0-9_]+)/values$', 'views.getFieldValues'),
    (r'^gateway/records$', 'views.getRecords'),
    (r'^gateway/record/(?P<record_id>.+)$', 'views.getRecord'),
    # Test Page
    (r'^$', 'views.test'),
    #(r'^$', 'views.index'),
    # Example:
    # (r'^coreyosandbox/', include('coreyosandbox.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # (r'^admin/', include(admin.site.urls)),
)
