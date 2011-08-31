'''
:mod:`DwCGateway`
=================

:Synopsis:
  Darwin Core Views Gateway Library
  API described at https://github.com/vdave/DwC_views/wiki/GatewayAPIs

'''
#from google.appengine.api import memcache
import logging
from django.utils import simplejson as json
from django.core.cache import cache
from solrclient import SolrConnection
from datetime import datetime

class SOLRGateway:
  '''Darwin Core Views Gateway Implementation for SOLR Backends
  '''

  __fields = None
  __connection = None
  __json_encoder = json.JSONEncoder(encoding='utf-8', separators=(',', ':')).encode
  __connection = None
  __identifier = 'solr'


  def __init__(self, host=None, basedir=None, encoder=__json_encoder, identifier='solr'):
    '''SOLRGateway constructor.
    
    :param host: SOLR Server Address (i.e. "serrano.speciesanalyst.net")
    :type host: string
    :param basedir: the direcotry of the SOLR service (i.e. "/solr")
    :type basedir: string
    :param encoder: a function that takes a Python object and encodes it into a JSON string (only used if you wish to override the default).
    :type encoder: function
    :returns: Structure as described in https://github.com/vdave/DwC_views/wiki/GatewayAPIs
    :rtype: SOLRGateway Object Instance
    '''

    #if host == None || basedir == None:
    #  raise Error('You Must Specify a Host/Dir')

    self.__connection = SolrConnection(host=host, solrBase=basedir)
    if encoder:
      self.__json_encoder = encoder
    self.__identifier = identifier
    

  # private function that fetches server's field information
  def __FetchFields(self):
    if self.__fields == None:
      self.__fields == cache.get(self.__identifier + '_fields')
      if self.__fields == None:
        self.__fields = self.__connection.getFields()
        self.__CacheFields(self.__fields)


  # private function that handles internel caching of fields and field values
  def __CacheFields(self, fields):
    cache.set(self.__identifier + '_fields', fields);

  def GetSummary(self):
    '''Provide a summary of the collection.

    *currentTime: It is important to note that the "currentTime" field displays the current time (as GMT) of the gateway server and not the current time of the Darwin Core backend database server.  Both machines *should* have the same time, but this is not necessarily ensured.
    *lastModified: If not supported directly by the data server, the "lastModified" field will use the max value from a "modified" field from the records themselves to determine when the database was last modified.
    
    :returns: Structure as described in https://github.com/vdave/DwC_views/wiki/GatewayAPIs
    :rtype: JSON UTF-8 encoded string
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

    json_dump = self.__json_encoder(summary_params)
    return json_dump


  def __formatFieldAttributes(self, field):

    field = self.__fields['fields'][field]

    f_attributes = {}
    f_attributes['type'] = field['type']
    f_attributes['distinct'] = field['distinct']
    f_attributes['stored'] = field['schema'][2] == 'S'
    f_attributes['multivalued'] = field['schema'][3] == 'M'
    if field.has_key('label'):
      f_attributes['label'] = field['label']

    return f_attributes


  def GetField(self, field, q='*:*', fq=None):
    '''Provide a listing of distinct values and value counts for the given field.
    
    :param field: The name of the field
    :type field: string
    :returns: Structure as described in https://github.com/vdave/DwC_views/wiki/GatewayAPIs
    :rtype: JSON UTF-8 encoded string
    '''

    self.__FetchFields();

    # fetch the standard field information
    f_attributes = self.__formatFieldAttributes(field)

    # add min/max values to the field attributes
    (min, max) = self.__connection.fieldMinMax(field, q, fq)
    f_attributes['minvalue'] = min;
    f_attributes['maxvalue'] = max;

    json_dump = self.__json_encoder({ field: f_attributes })

    return json_dump


  def GetFields(self):
    '''Provide a listing of different fields found within the server's records.
    
    :returns: Structure as described in https://github.com/vdave/DwC_views/wiki/GatewayAPIs
    :rtype: JSON UTF-8 encoded string
    '''

    self.__FetchFields();

    fields = {};
    # format our field information
    for field in self.__fields['fields']:
      fields[field] = self.__formatFieldAttributes(field)

    json_dump = self.__json_encoder(fields)
    return json_dump


  def GetFieldValues(self, field, q="*:*", count=100):
    '''Provide a listing of distinct values and value counts for the given field.
    
    :param field: The name of the field
    :type field: string
    :returns: Structure as described in https://github.com/vdave/DwC_views/wiki/GatewayAPIs
    :rtype: JSON UTF-8 encoded string
    '''

    values = self.__connection.fieldValues(field, q=q, maxvalues=count)
    response = {'numRecords':values['numFound'],
                'values':[]}
    logging.info(str(values))
    # values are wrapped in 3 levels of lists, exract the inner level
    values = values.items()[0][1]
    # fields and count are originally in a flat, alternating list:
    # i.e. [field1, count, field2, count, field3, count, ...]
    # we must transform them into a list of list "pairs":
    # i.e. [[field1, count], [field2, count], [field3, count], ...]
    #value_pairs = []
    i = 0
    while i < len(values):
      response['values'].append([values[i], values[i+1]])
      i = i+2

    json_dump = self.__json_encoder(response)
    return json_dump


  def GetFieldHistogram(self, field, q='*:*', nbins=10):
    '''Provides a histogram representing the distribution of values for a given field.
    
    :param field: The name of the field
    :type field: string
    :param filter: a solr-compatible query/filter
    :type filter: string
    :param bins: the number of equal division into which the field values will be split
    :type bins: integer
    :returns: Structure as described in https://github.com/vdave/DwC_views/wiki/GatewayAPIs
    :rtype: JSON UTF-8 encoded string
    '''

    json_dump = self.__json_encoder(self.__connection.fieldHistogram(name=field, q=q, nbins=nbins))

    return json_dump


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
    :rtype: JSON UTF-8 encoded string
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
    json_dump = self.__json_encoder(response)
    return json_dump


  def GetRecord(self, record_id):
    '''Retreives a record with the given id.
    
    :param record_id: The id of the record
    :type record_id: string
    :returns: Structure as described in https://github.com/vdave/DwC_views/wiki/GatewayAPIs
    :rtype: JSON UTF-8 encoded string
    '''

    record = self.__connection.get(record_id)
    json_dump = self.__json_encoder(record)
    return json_dump
