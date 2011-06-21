from string import atoi
from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse
from django.core.servers.basehttp import FileWrapper
from apps.DwCGateway import SOLRGateway
from apps.solrclient import SolrConnection, SOLRSearchResponseIterator, SOLRValuesResponseIterator, SOLRArrayResponseIterator

def index(request):
  return render_to_response('index.html')

# dynamic css (django css template) file handler
def pcss(request, stylefile, download=False):
  return render_to_response('pcss/' + stylefile, mimetype='text/css')

# serve static content (for development only)
#def static(request, staticfile):
#	return render_to_response('static/' + stylefile)


### Darwin Core Views Gateway Web Services ###
connection = SolrConnection(host="serrano.speciesanalyst.net", solrBase="/solr")
gateway = SOLRGateway(connection)

def getSummary(request):
  summary = gateway.GetSummary()
  return HttpResponse(summary)

def getFields(request):
  fields = gateway.GetFields()
  return HttpResponse(fields)

def getField(request, name):
  field = gateway.GetField(name)
  return HttpResponse(field)

def getFieldValues(request, name):
  values = gateway.GetFieldValues(name)
  return HttpResponse(values)

def getRecords(request):
  # collect query (GET) parameters
  params = {}
  if request.GET.has_key('filter'):
    params['q'] = request.GET['filter']
  else:
    params['q'] = "*:*"
  if request.GET.has_key('fields'):
    params['fields'] = request.GET['fields']
  else:
    params['fields'] = "*"
  if request.GET.has_key('orderby'):
    params['orderby'] = request.GET['orderby']
  else:
    params['orderby'] = None
  if request.GET.has_key('order'):
    params['order'] = request.GET['order'].lower()
  else:
    params['order'] = "asc"
  if request.GET.has_key('start'):
    params['start'] = string.atoi(request.GET['start'])
  else:
    params['start'] = 0
  if request.GET.has_key('count'):
    params['count'] = atoi(request.GET['count'])
  else:
    params['count'] = 1000
  results = gateway.GetRecords(q=params['q'], fields=params['fields'],
                               orderby=params['orderby'], order=params['order'],
                               start=params['start'], count=params['count'])
  return HttpResponse(results)

def getRecord(request, record_id):
  record = gateway.GetRecord(record_id)
  return HttpResponse(record)


# Proof of Concept View
def test(request):
  client = SolrConnection(host="serrano.speciesanalyst.net", solrBase="/solr")
  results = client.search({'q':'*:*'})
  rows = results['response']['docs']
  context = {
    "results": rows,
  }
  return render_to_response('test.html', context)

#def attachment(request, attachment_id):
#	attachment = get_object_or_404(models.Attachment, pk=attachment_id)
#	wrapper = FileWrapper(attachment.file_data)
#	response = HttpResponse(wrapper, mimetype=attachment.mime_type)
#	if request.GET.has_key('download'):
#		response['Content-Disposition'] = "attachment; filename=%s" % (attachment.filename())
#	response['Content-Length'] = attachment.file_data.size
#	return response
