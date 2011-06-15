from django.conf.urls.defaults import *

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    (r'^pcss/(?P<stylefile>.+)$', 'views.pcss'),
    (r'^$', 'views.test'),
    #(r'^$', 'views.index'),
    # Example:
    # (r'^coreyosandbox/', include('coreyosandbox.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # (r'^admin/', include(admin.site.urls)),
)
