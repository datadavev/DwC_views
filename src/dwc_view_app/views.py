'''
:mod:`views`
=================

:Synopsis:
  Django View Controllers for the Darwin Core Views Interface

'''
from string import atoi
from django.conf import settings
from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse
from django.core.servers.basehttp import FileWrapper
from django.utils.simplejson import JSONEncoder
from django.views.decorators.cache import cache_page
from apps.DwCGateway import SOLRGateway

def index(request):
  '''Default "index" view
  '''
  return render_to_response('index.html')

def pcss(request, stylefile):
  '''dynamic css (django css template) file handler
  
  :param stylefile: The name/path to the .pcss file relative to templates/pcss/ folder
  :type stylefile: string
  '''
  return render_to_response('pcss/' + stylefile, mimetype='text/css')

### Darwin Core Views Gateway Web Services ###
# use the encoder specified in the settings file
encoder=settings.JSON_ENCODER
gateway = SOLRGateway(host="serrano.speciesanalyst.net", basedir="/solr", encoder=encoder, identifier="MySolrID")

def getSummary(request):
  '''Output a general summary of the Darwin Core Database Server

  :returns: JSON structure from the getSummary() function as described in https://github.com/vdave/DwC_views/wiki/GatewayAPIs
  :rtype: json
  '''
  summary = gateway.GetSummary()
  return HttpResponse(summary, mimetype='application/json')

@cache_page()
def getFields(request):
  '''Output a listing of all fields found within the server's documents 
  :returns: JSON structure from the getFields() function as described in https://github.com/vdave/DwC_views/wiki/GatewayAPIs
  :rtype: json
  '''
  fields = gateway.GetFields()
  return HttpResponse(fields, mimetype='application/json')

def getField(request, name):
  '''Output general information about the requested field
  
  :param name: The name of the field
  :type name: string
  :returns: JSON structure from the getField() function as described in https://github.com/vdave/DwC_views/wiki/GatewayAPIs
  :rtype: json
  '''

  field = gateway.GetField(name)
  return HttpResponse(field, mimetype='application/json')

def getFieldValues(request, name):
  '''Output a listing of unique values and their occurance count for the given field
  
  :param name: The name of the field
  :type name: string
  :returns: JSON structure from the getFieldValues() function as described in https://github.com/vdave/DwC_views/wiki/GatewayAPIs
  :rtype: json
  '''
  params = {}
  if request.GET.has_key('filter'):
    params['query'] = request.GET['filter']
  else:
    params['query'] = "*:*"
  if request.GET.has_key('count'):
    params['count'] = atoi(request.GET['count'])
  else:
    params['count'] = 1000
  values = gateway.GetFieldValues(name, **params)
  return HttpResponse(values, mimetype='application/json')

def getRecords(request):
  '''Output a listing of all records found given the defined query parameters
  
  Query paramaters are passed as standard GET style variables in the URL:
  *filter: The SOLR query (i.e. the default: "*.*").
  *fields: Comma delineated list of fields to return in each record (i.e. "lng,lat").  The default is "*", which returns all fields.
  *orderby: name of the field by which the record set will be sorted (i.e. "phylum_s").  The default will be the server's default sort order.
  *order: Direction of sort order (i.e. "asc" or "desc").  The default is "asc".  Only used if the 'orderby' parameter is supplied.
  *start: First record of the result set to display (default "0").  Used for paging.
  *count: Maximum number of records to return (default: "1000")

  A proper request might look something like:

    http://www.example.com/gateway/{data_source}/record?filter=*:*&fields="id,sciName_s,long,lat&orderby=sciName_s&order=desc&start=0&count=100

  :returns: JSON structure from the getRecords() function as described in https://github.com/vdave/DwC_views/wiki/GatewayAPIs
  :rtype: json
  '''
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
    params['start'] = atoi(request.GET['start'])
  else:
    params['start'] = 0
  if request.GET.has_key('count'):
    params['count'] = atoi(request.GET['count'])
  else:
    params['count'] = 1000
  results = gateway.GetRecords(q=params['q'], fields=params['fields'],
                               orderby=params['orderby'], order=params['order'],
                               start=params['start'], count=params['count'])
  return HttpResponse(results, mimetype='application/json')

def getRecord(request, record_id):
  '''Output a server record as identified by its record_id
  
  :param record_id: The record's id.  This should be standard URL Encoded if it contains special characters.
  :type record_id: string
  :returns: JSON structure from the getRecord() function as described in https://github.com/vdave/DwC_views/wiki/GatewayAPIs
  :rtype: json
  '''
  record = gateway.GetRecord(record_id)
  return HttpResponse(record, mimetype='application/json')


# Proof of Concept View
def test(request):
  return render_to_response('test.html')
