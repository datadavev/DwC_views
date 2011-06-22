'''
:mod:`DwCGateway`
=================

:Synopsis:
  Darwin Core Views Gateway Library
  API described at https://github.com/vdave/DwC_views/wiki/GatewayAPIs

'''
#from google.appengine.api import memcache
from django.utils import simplejson
from solrclient import SolrConnection
from datetime import datetime

class SOLRGateway:
  '''Darwin Core Views Gateway Implementation for SOLR Backends
  '''
  __fields = None
  __connection = None

  def __init__(self, connection):
    '''SOLRGateway constructor.
    
    :param connection: SolrConnection object as described in the solrclient library
    :type connection: SolrConnection
    :returns: Structure as described in https://github.com/vdave/DwC_views/wiki/GatewayAPIs
    :rtype: dictionary
    '''
    self.__connection = connection

  # private function that fetches server's field information
  def __FetchFields(self):
    if self.__fields == None:
      self.__fields = self.__connection.getFields()

  # private function that handles internel caching of fields and field values
  def _CacheFields(self):
    return

  def GetSummary(self):
    '''Provide a summary of the collection.

    *currentTime: It is important to note that the "currentTime" field displays the current time (as GMT) of the gateway server and not the current time of the Darwin Core backend database server.  Both machines *should* have the same time, but this is not necessarily ensured.
    *lastModified: If not supported directly by the data server, the "lastModified" field will use the max value from a "modified" field from the records themselves to determine when the database was last modified.
    
    :returns: Structure as described in https://github.com/vdave/DwC_views/wiki/GatewayAPIs
    :rtype: dictionary
    '''
    summary_params = {}
    summary_params['url'] = self.__connection.host + self.__connection.solrBase
    # get the current system time (note, this is time on
    # localhost, not the actual solr server)
    summary_params['currentTime'] = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.0Z')
    # get the total record and last-modified count
    results = self.__connection.search({"q":"*:*",
                                      "fields":"modified",
                                      "sort":"modified desc",
                                      "rows":1})
    response = results['response']
    summary_params['numRecords'] = response['numFound']
    summary_params['lastModified'] = response['docs'][0]["modified"]
    json = simplejson.JSONEncoder().encode(summary_params)
    return json

  def GetFields(self):
    '''Provide a listing of different fields found within the server's records.
    
    :returns: Structure as described in https://github.com/vdave/DwC_views/wiki/GatewayAPIs
    :rtype: dictionary
    '''

    self.__FetchFields()
    json = simplejson.JSONEncoder().encode(self.__fields['fields'].keys())
    return json

  def GetField(self, name):
    '''Provide a listing of distinct values and value counts for the given field.
    
    :param name: The name of the field
    :type name: string
    :returns: Structure as described in https://github.com/vdave/DwC_views/wiki/GatewayAPIs
    :rtype: dictionary
    '''

    self.__FetchFields()
    field = self.__fields['fields'][name]
    f_attributes = {}
    f_attributes['name'] = name
    f_attributes['type'] = field['type']
    f_attributes['distinct'] = field['distinct']
    f_attributes['stored'] = "false"
    json = simplejson.JSONEncoder().encode(f_attributes)
    return json

  def GetFieldValues(self, name):
    '''Provide a listing of distinct values and value counts for the given field.
    
    :param name: The name of the field
    :type name: string
    :returns: Structure as described in https://github.com/vdave/DwC_views/wiki/GatewayAPIs
    :rtype: dictionary
    '''
    values = self.__connection.fieldValues(name)
    # values are wrapped in 3 levels of lists, exract the inner level
    values = values.items()[0][1]
    # fields and count are originally in a flat, alternating list:
    # i.e. [field1, count, field2, count, field3, count, ...]
    # we must transform them into a list of list "pairs":
    # i.e. [[field1, count], [field2, count], [field3, count], ...]
    value_pairs = []
    i = 0
    while i < len(values):
      value_pairs.append([values[i], values[i+1]])
      i = i+2

    json = simplejson.JSONEncoder().encode(value_pairs)
    return json

  def GetRecords(self, q="*:*", fields="*", orderby=None,
                 order="asc", start=0, count=1000):
    '''Retrieve a page of records from the SOLR service.
    
    :param q: Query string
    :type q: string
    :param fields: Comma delimited list of field names to return
    :type fields: string
    :param orderby: Name of field to sort results by
    :type orderby: string
    :param order: Indicates order of sorting, one of "asc" or "desc"
    :type orderby: string
    :param start: Zero based index of the first record in the response
    :type start: integer
    :param count: Number of records to return in results
    :type count: integer
    :return: List of records as described in https://github.com/vdave/DwC_views/wiki/GatewayAPIs
    :rtype: dictionary 
    '''
    params = {'q': q,
              'fl': fields,
              'rows': count,
              'start': start,
             }
    if orderby != None:
      params['sort'] = "%s %s" % (orderby, order)

    results = self.__connection.search(params)
    response = results['response']
    json = simplejson.JSONEncoder().encode(response)
    return json

  def GetRecord(self, record_id):
    '''Retreives a record with the given id.
    
    :param record_id: The id of the record
    :type record_id: string
    :returns: Structure as described in https://github.com/vdave/DwC_views/wiki/GatewayAPIs
    :rtype: dictionary
    '''
    record = self.__connection.get(record_id)
    json = simplejson.JSONEncoder().encode(record)
    return json
