REST API Exposed by the Gateway
===============================

.. list-table::
   :header-rows: 1

   * - URL
     - HTTP Method
     - Name
     - Parameters
     - Return
   * - {base}/
     - GET
     - getSummary
     - 
     - Collection summary
   * - {base}/fields
     - GET
     - getFields
     - 
     - List of Fields
   * - {base}/records
     - GET
     - getRecords
     - start, count [,orderby] [,fields] [,filter]
     - List of Records


.. function:: getSummary()

   Returns a summary of the collection held at this location.

   :URL: {base}/
   :rtype:
   :returns:


.. function:: getFields()

   Returns a list of fields available in records in this collections

  :URL: {base}/fields
  :rtype:
  :returns:


.. function:: getRecords()

   Returns a page of records.

   :URL: {base}/records
   :rtype:
   :returns:

   Example::

    curl http://service/base/records?start=0&count=10


