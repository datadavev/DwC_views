from django.shortcuts import render_to_response, get_object_or_404
#from django.http import HttpResponse
from django.core.servers.basehttp import FileWrapper
from apps.solrclient import SolrConnection, SOLRSearchResponseIterator, SOLRValuesResponseIterator, SOLRArrayResponseIterator

def index(request):
  return render_to_response('index.html')

# dynamic css (python css) file handler
def pcss(request, stylefile, download=False):
	return render_to_response('pcss/' + stylefile, mimetype='text/css')

# serve static content (for development only)
#def static(request, staticfile):
#	return render_to_response('static/' + stylefile)

def test(request):
  client = SolrConnection(host="serrano.speciesanalyst.net", solrBase="/solr")
  results = client.search({'q':'*:*'})
  #results = client.search({'q':'basis_s:PreservedSpecimen'})
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
