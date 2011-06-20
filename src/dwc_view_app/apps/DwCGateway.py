#from google.appengine.api import memcache
from django.utils import simplejson
from solrclient import SolrConnection
from datetime import datetime

class SOLRGateway:

  fields = None
  connection = None

  def __init__(self, connection):
    self.connection = connection

  def _FetchFields(self):
    if self.fields == None:
      self.fields = self.connection.getFields()

  def _CacheFields(self):
    return

  def GetSummary(self):
    summary_params = {}
    summary_params['url'] = self.connection.host + self.connection.solrBase
    # get the current system time (note, this is time on
    # localhost, not the actual solr server)
    summary_params['currentTime'] = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.0Z')
    # get the total record and last-modified count
    results = self.connection.search({"q":"*:*",
                                      "fields":"modified",
                                      "sort":"modified desc",
                                      "rows":1})
    response = results['response']
    summary_params['numRecords'] = response['numFound']
    summary_params['lastModified'] = response['docs'][0]["modified"]
    json = simplejson.JSONEncoder().encode(summary_params)
    return json

  def GetFields(self):
    self._FetchFields()
    json = simplejson.JSONEncoder().encode(self.fields['fields'].keys())
    return json

  def GetField(self, name):
    self._FetchFields()
    field = self.fields['fields'][name]
    f_attributes = {}
    f_attributes['name'] = name
    f_attributes['type'] = field['type']
    f_attributes['distinct'] = field['distinct']
    json = simplejson.JSONEncoder().encode(f_attributes)
    return json

  def GetFieldValues(self, name):
    values = self.connection.fieldValues(name)
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
    params = {'q': q,
              'fl': fields,
              'rows': count,
              'start': start,
             }
    if orderby != None:
      params['sort'] = "%s %s" % (orderby, order)

    results = self.connection.search(params)
    response = results['response']
    json = simplejson.JSONEncoder().encode(response)
    return json

  def GetRecord(self, record_id):
     record = self.connection.get(record_id)
     json = simplejson.JSONEncoder().encode(record)
     return json
