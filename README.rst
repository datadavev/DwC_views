README for DwC_Views
====================

DwC_Views provides implementation of viewers for `Darwin Core`_ records. The
implementation is structured as two major components: the gateway, and the
browser.

The gateway is a Django application that acts as a proxy and cache for
resources that expose Darwin Core records. It supports a simple service
interface for retrieving records and exposes them as JSON objects that can be
rendered by JavaScript in the web browser.

The browser is a set of JavaScript and HTML that enables viewing of record
lists and individual records, as well as other metadata retrieved from the
gateway.


.. _Darwin Core: http://rs.tdwg.org/dwc/
