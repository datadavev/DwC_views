'''
Created on Jun 21, 2011

@author: vieglais
'''
import unittest
import logging
import urllib
import urlparse
import json


class TestGatewayApi(unittest.TestCase):

  def setUp(self):
    self.serviceUrl = "http://coreyosandbox.appspot.com/gateway/"
    self.uparts = urlparse.urlsplit(self.serviceUrl)


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
    self.assertEqual(v0.length, 2)

    
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
    

if __name__ == "__main__":
  logging.basicConfig(level=logging.DEBUG)
  #import sys;sys.argv = ['', 'Test.testName']
  unittest.main()