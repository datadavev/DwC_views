REST API Exposed by the Gateway
===============================

.. module:: gateway

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
   :rtype: CollectionSummary
   :returns: A summary of the collection


.. function:: getFields()

   Returns a list of fields available in records in this collections

  :URL: {base}/fields
  :rtype:
  :returns:


.. function:: getRecords()

   Returns a page of records.

   :URL: {base}/records
   :param start:
   :type start: integer
   :param count:
   :type count: integer
   :param orderby:
   :type orderby: OrderByEnum
   :param fields: 
   :type fields: FieldList
   :param filter:
   :type filter: Filter
   :rtype:
   :returns:

   Example::

    curl http://service/base/records?start=0&count=10


.. class:: CollectionSummary

   A summary of the collection.


.. class:: FieldList

   A list of field names.


.. class:: Filter

   A filter for specifying a subset of records.


