.. DwC Views documentation master file, created by
   sphinx-quickstart on Thu Jun  9 16:01:12 2011.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

DwC Views
=========

DwC_Views provides implementation of viewers for `Darwin Core`_ records. The
implementation is structured as two major components: the gateway, and the
browser.

The gateway is a Django_ application that acts as a proxy and cache for
resources that expose Darwin Core records. It supports a simple service
interface for retrieving records and exposes them as JSON objects that can be
rendered by JavaScript in the web browser. The API is described under */docs*.

The browser is a set of JavaScript and HTML that enables viewing of record
lists and individual records, as well as other metadata retrieved from the
gateway.


**Contents:**

.. toctree::
   :maxdepth: 2

   gateway_api



License
-------

This work was created by participants in projects sponsored by the National
Science Foundation (`NSF-DBI-0415600`_, `NSF-DBI-0955076`_) and is copyrighted
by The University of Kansas. For more information on DataONE, see our web site
at http://naturalhistory.ku.edu/.

  Copyright 2011, University of Kansas

Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.


Citation
--------

The following citation should be used when referencing this work:

  Darwin Core Views (2011). [https://github.com/vdave/DwC_views] Supported by
  US National Science Foundation Grants 0955076 and 0415600.

.. _Darwin Core: http://rs.tdwg.org/dwc/

.. _Django: https://www.djangoproject.com/

.. _NSF-DBI-0955076: http://nsf.gov/awardsearch/showAward.do?AwardNumber=0955076

.. _NSF-DBI-0415600: http://nsf.gov/awardsearch/showAward.do?AwardNumber=0415600


Indices and tables
------------------

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`


