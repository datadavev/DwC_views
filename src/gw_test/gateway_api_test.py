# -*- coding: utf-8 -*-
'''Unit tests for the DwC Views Gateway API

This work was created by participants in projects sponsored by the National 
Science Foundation (NSF-DBI-0415600, NSF-DBI-0955076) and is copyrighted by 
The University of Kansas. For more information on DataONE, see our web site 
at http://naturalhistory.ku.edu/.

    Copyright 2011, University of Kansas

Licensed under the Apache License, Version 2.0 (the "License"); you may not 
use this file except in compliance with the License. You may obtain a copy 
of the License at

    http://www.apache.org/licenses/LICENSE-2.0 

Unless required by applicable law or agreed to in writing, software 
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT 
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the 
License for the specific language governing permissions and limitations 
under the License.
'''

import unittest
import logging
import urllib
import urllib2
import urlparse
import simplejson as json
import restclient


class TestGatewayApi(unittest.TestCase):
  '''Simple exercise of the gateway API. Currently checks for status 
  of response and that the structure of the response objects matches 
  the specifications_.
  
  .. _specifications: https://github.com/vdave/DwC_views/wiki/GatewayAPIs
  '''

  def setUp(self):
    self.serviceUrl = "http://coreyosandbox.appspot.com/gateway/"
    self.cli = restclient.RESTClient()


  def testGetSummary(self):
    response = self.cli.GET(self.serviceUrl)
    self.assertEqual(response.status, 200)
    resobj = json.loads(response.read(), 'utf-8')
    self.assertTrue(resobj.has_key('url'))
    self.assertTrue(resobj.has_key('numRecords'))
    self.assertTrue(resobj.has_key('lastModified'))
    self.assertTrue(resobj.has_key('currentTime'))


  def testGetSummaryError(self):
    #add data to send requests using POST instead of GET
    cli = restclient.RESTClient()
    response = cli.POST(self.serviceUrl, fields={'bogus':'data'})
    #Should be "Method Not Allowed" HTTP error
    self.assertEqual(response.status, 405)
    
    
  def testGetFields(self):
    url = urlparse.urljoin(self.serviceUrl,"fields")
    logging.debug("getfields url = %s" % url)
    response = self.cli.GET(url)
    self.assertEqual(response.status, 200)
    resobj = json.loads(response.read(), 'utf-8')
    self.assertTrue(isinstance(resobj, list))


  def testGetFieldInfo(self):
    fieldname = "id"
    url = urlparse.urljoin(self.serviceUrl,"fields/%s" % fieldname)
    logging.debug("getfieldinfo url = %s" % url)
    response = self.cli.GET(url)
    self.assertEqual(response.status, 200)
    field = json.loads(response.read(), 'utf-8')
    self.assertTrue(field.has_key('name'))
    self.assertEqual(fieldname, field['name'])
    self.assertTrue(field.has_key('type'))
    self.assertTrue(field.has_key('distinct'))
    self.assertTrue(field.has_key('stored'))


  def testGetFieldInfoError(self):
    fieldname = "does_not_exist"
    url = urlparse.urljoin(self.serviceUrl,"fields/%s" % fieldname)
    logging.debug("getfieldinfo url = %s" % url)
    response = self.cli.GET(url)
    self.assertEqual(response.status, 404)
    err = json.loads(response.read(), 'utf-8')
    self.assertTrue(err.has_key('name'))
    self.assertTrue(err.has_key('description'))
    self.assertEqual(err['name'], u'Not Found')


  def testGetFieldValues(self):
    fieldname = "genus_s"
    url = urlparse.urljoin(self.serviceUrl,"fields/%s/values" % fieldname)
    logging.debug("getfieldvalues url = %s" % url)
    response = self.cli.GET(url)
    self.assertEqual(response.status, 200)
    values = json.loads(response.read(), 'utf-8')
    self.assertTrue(isinstance(values, list))
    v0 = values[0]
    self.assertTrue(isinstance(values, list))
    self.assertEqual(len(v0), 2)

    
  def testGetFieldValuesError(self):
    fieldname = "genus_s"
    #bogus parameters provided
    params = {'start':-10,
              'count':10, }
    url = urlparse.urljoin(self.serviceUrl,"fields/%s/values" % fieldname)
    logging.debug("getfieldvalues url = %s" % url)
    response = self.cli.GET(url, url_params=params)
    self.assertEqual(response.status, 400)
    err = json.loads(response.read(), 'utf-8')
    self.assertTrue(err.has_key('name'))
    self.assertTrue(err.has_key('description'))
    #non-existent field
    fieldname = "genus_not_exist"
    url = urlparse.urljoin(self.serviceUrl,"fields/%s/values" % fieldname)
    logging.debug("getfieldvalues url = %s" % url)
    response = self.cli.GET(url)
    self.assertEqual(response.status, 404)
    err = json.loads(response.read(), 'utf-8')
    self.assertTrue(err.has_key('name'))
    self.assertTrue(err.has_key('description'))
    
    
  def testGetRecords(self):
    params = {'start':0,
              'count':10,
              'fields':'id,genus_s',
              'filter':'*:*'}
  
    url = urlparse.urljoin(self.serviceUrl,"records")
    logging.debug("get records url = %s" % url)
    response = self.cli.GET(url, url_params=params)
    self.assertEqual(response.status, 200)
    records = json.loads(response.read(), 'utf-8')
    self.assertTrue(records.has_key('numFound'))
    self.assertTrue(records.has_key('start'))
    self.assertTrue(records.has_key('docs'))
    self.assertTrue(isinstance(records['docs'], list))
    rec0 = records['docs'][0]
    self.assertTrue(rec0.has_key('id'))
    self.assertTrue(rec0.has_key('genus_s'))
    

  def testGetRecordsUnicode(self):
    '''Simple unicode test - basically checks that text being passed through 
    the gateway is as expected from the original input to SOLR. 
    '''
    params = {'start':0,
              'count':10,
              'fields':'id,genus_s,stateProvince_s,locality_t',
              'filter':'stateProvince_s:Ogoou*'}
  
    url = urlparse.urljoin(self.serviceUrl,"records")
    logging.debug("get records url = %s" % url)
    response = self.cli.GET(url, url_params=params)
    self.assertEqual(response.status, 200)
    records = json.loads(response.read(), 'utf-8')
    #A few known test values
    testvalues = ['Ogooué-Invindo', 'Ogooué/Ivindo', 'Ogooué-Ivindo']
    for rec in records['docs']:
      print u"%s,  %s" % (rec['stateProvince_s'][0], rec['locality_t'][0])
      self.assertTrue(rec['stateProvince_s'][0] in testvalues)


  def testGetRecord(self):
    id = "UAM.Fish.3368."
    url = urlparse.urljoin(self.serviceUrl, "record/%s" % urllib.quote(id))
    logging.debug("get record url = %s" % url)
    response = self.cli.GET(url)
    self.assertEqual(response.status, 200)
    

  def testGetRecordError(self):
    id = "I.Dont.Exist"
    url = urlparse.urljoin(self.serviceUrl, "record/%s" % urllib.quote(id))
    logging.debug("get record url = %s" % url)
    response = self.cli.GET(url)
    self.assertEqual(response.status, 404)
    err = json.loads(response.read(), 'utf-8')
    self.assertTrue(err.has_key('name'))
    self.assertTrue(err.has_key('description'))
    


#===============================================================================

if __name__ == "__main__":
  logging.basicConfig(level=logging.INFO)
  #import sys;sys.argv = ['', 'Test.testName']
  unittest.main()
  
