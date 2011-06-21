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
import urlparse
import json


class TestGatewayApi(unittest.TestCase):
  '''Simple exercise of the gateway API. Currently checks for status 
  of response and that the structure of the response objects matches 
  the specifications_.
  
  .. _specifications: https://github.com/vdave/DwC_views/wiki/GatewayAPIs
  '''

  def setUp(self):
    self.serviceUrl = "http://coreyosandbox.appspot.com/gateway/"


  def testGetSummary(self):
    response = urllib.urlopen(self.serviceUrl)
    self.assertEqual(response.getcode(), 200)
    resobj = json.loads(response.read(), 'utf-8')
    self.assertTrue(resobj.has_key('url'))
    self.assertTrue(resobj.has_key('numRecords'))
    self.assertTrue(resobj.has_key('lastModified'))
    self.assertTrue(resobj.has_key('currentTime'))
    

  def testGetFields(self):
    url = urlparse.urljoin(self.serviceUrl,"fields")
    logging.debug("getfields url = %s" % url)
    response = urllib.urlopen(url)
    self.assertEqual(response.getcode(), 200)
    resobj = json.loads(response.read(), 'utf-8')
    self.assertTrue(isinstance(resobj, list))


  def testGetFieldInfo(self):
    fieldname = "id"
    url = urlparse.urljoin(self.serviceUrl,"fields/%s" % fieldname)
    logging.debug("getfieldinfo url = %s" % url)
    response = urllib.urlopen(url)
    self.assertEqual(response.getcode(), 200)
    field = json.loads(response.read(), 'utf-8')
    self.assertTrue(field.has_key('name'))
    self.assertEqual(fieldname, field['name'])
    self.assertTrue(field.has_key('type'))
    self.assertTrue(field.has_key('distinct'))
    self.assertTrue(field.has_key('stored'))
    

  def testGetFieldValues(self):
    fieldname = "genus_s"
    url = urlparse.urljoin(self.serviceUrl,"fields/%s/values" % fieldname)
    logging.debug("getfieldvalues url = %s" % url)
    response = urllib.urlopen(url)
    self.assertEqual(response.getcode(), 200)
    values = json.loads(response.read(), 'utf-8')
    self.assertTrue(isinstance(values, list))
    v0 = values[0]
    self.assertTrue(isinstance(values, list))
    self.assertEqual(len(v0), 2)

    
  def testGetRecods(self):
    params = {'start':0,
              'count':10,
              'fields':'id,genus_s',
              'filter':'*:*'}
  
    url = urlparse.urljoin(self.serviceUrl,"records?%s" % urllib.urlencode(params))
    logging.debug("getfieldrecords url = %s" % url)
    response = urllib.urlopen(url)
    self.assertEqual(response.getcode(), 200)
    records = json.loads(response.read(), 'utf-8')
    self.assertTrue(records.has_key('numFound'))
    self.assertTrue(records.has_key('start'))
    self.assertTrue(records.has_key('docs'))
    self.assertTrue(isinstance(records['docs'], list))
    rec0 = records['docs'][0]
    self.assertTrue(rec0.has_key('id'))
    self.assertTrue(rec0.has_key('genus_s'))
    
    
#================================================================================

if __name__ == "__main__":
  logging.basicConfig(level=logging.DEBUG)
  #import sys;sys.argv = ['', 'Test.testName']
  unittest.main()
  
