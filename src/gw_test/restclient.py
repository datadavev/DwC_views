# -*- coding: utf-8 -*-

# This work was created by participants in the DataONE project, and is
# jointly copyrighted by participating institutions in DataONE. For
# more information on DataONE, see our web site at http://dataone.org.
#
#   Copyright 2011
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

'''
Module d1_common.restclient
===========================

HTTP client that supports core REST operations using MIME multipart mixed
encoding.

:Created: 2010-03-09
:Author: DataONE (vieglais, dahl)
:Dependencies:
  - python 2.6
'''

import os
import sys
import logging
import urllib
import httplib
import urlparse
import mimetypes
import StringIO


URL_PATHELEMENT_SAFE_CHARS = ":@$!()',~*&="
URL_QUERYELEMENT_SAFE_CHARS = ":;@$!()',~*/?"
RESPONSE_TIMEOUT=30
MIMETYPE_OCTETSTREAM = 'application/octet-stream'

#===============================================================================

def encodePathElement(element):
  '''Encodes a URL path element according to RFC3986.
  
  :param element: The path element to encode for transmission in a URL.
  :type element: Unicode
  :return: URL encoded path element
  :return type: UTF-8 encoded string. 
  '''
  return urllib.quote(element.encode('utf-8'), \
               safe=URL_PATHELEMENT_SAFE_CHARS)

def decodePathElement(element):
  '''Decodes a URL path element according to RFC3986.
  
  :param element: The URL path element to decode.
  :type element: Unicode
  :return: decoded URL path element
  :return type: UTF-8 encoded string. 
  '''
  return urllib.unquote(element).decode('utf-8')

def encodeQueryElement(element):
  '''Encodes a URL query element according to RFC3986.
  
  :param element: The query element to encode for transmission in a URL.
  :type element: Unicode
  :return: URL encoded query element
  :return type: UTF-8 encoded string. 
  '''
  return urllib.quote(element.encode('utf-8'), \
               safe=URL_QUERYELEMENT_SAFE_CHARS)


def urlencode(query, doseq=0):
  '''Modified version of the standard urllib.urlencode that is conformant
  with RFC3986. The urllib version encodes spaces as '+' which can lead
  to inconsistency. This version will always encode spaces as '%20'.
  
  TODO: verify the unicode encoding process - looks a bit suspect.

  Encode a sequence of two-element tuples or dictionary into a URL query string.

  If any values in the query arg are sequences and doseq is true, each
  sequence element is converted to a separate parameter.

  If the query arg is a sequence of two-element tuples, the order of the
  parameters in the output will match the order of parameters in the
  input.
  '''
  if hasattr(query, "items"):
    # Remove None parameters from query. Dictionaries are mutable, so we can
    # remove the the items directly. dict.keys() creates a copy of the
    # dictionary keys, making it safe to remove elements from the dictionary
    # while iterating.
    for k in query.keys():
      if query[k] is None:
        del query[k]
    # mapping objects
    query = query.items()
  else:
    # Remove None parameters from query. Tuples are immutable, so we have to
    # build a new version that does not contain the elements we want to remove,
    # and replace the original with it.
    query = filter((lambda x: x[1] is not None), query)
    # it's a bother at times that strings and string-like objects are
    # sequences...
    try:
      # non-sequence items should not work with len()
      # non-empty strings will fail this
      if len(query) and not isinstance(query[0], tuple):
          raise TypeError
      # zero-length sequences of all types will get here and succeed,
      # but that's a minor nit - since the original implementation
      # allowed empty dicts that type of behavior probably should be
      # preserved for consistency
    except TypeError:
      ty,va,tb = sys.exc_info()
      raise TypeError, "not a valid non-string sequence or mapping object", tb

  l = []
  if not doseq:
    # preserve old behavior
    for k, v in query:
      k = encodeQueryElement(str(k))
      v = encodeQueryElement(str(v))
      l.append(k + '=' + v)
  else:
    for k, v in query:
      k = encodeQueryElement(str(k))
      if isinstance(v, str):
        v = encodeQueryElement(v)
        l.append(k + '=' + v)
      elif isinstance(v, unicode):
        # is there a reasonable way to convert to ASCII?
        # encode generates a string, but "replace" or "ignore"
        # lose information and "strict" can raise UnicodeError
        v = encodeQueryElement(v.encode("ASCII","replace"))
        l.append(k + '=' + v)
      else:
        try:
          # is this a sufficient test for sequence-ness?
          x = len(v)
        except TypeError:
          # not a sequence
          v = encodeQueryElement(str(v))
          l.append(k + '=' + v)
        else:
          # loop over the sequence
          for elt in v:
              l.append(k + '=' + encodeQueryElement(str(elt)))
  return '&'.join(l)

#===============================================================================

#!/usr/bin/env python
# -*- coding: utf-8 -*-

# This work was created by participants in the DataONE project, and is
# jointly copyrighted by participating institutions in DataONE. For
# more information on DataONE, see our web site at http://dataone.org.
#
#   Copyright ${year}
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

'''
Module d1_common.mime_multipart
===============================

Wrap files and return the file data wrapped in a mime multipart structure when
iterated, without buffering.

:Created: 2010-09-07
:Author: DataONE (dahl, vieglais)
:Dependencies:
  - python 2.6
'''

class multipart(object):
  '''Generate a MIME Multipart document based on a set of files and fields.

  The document can either be automatically posted to a web server with HTTP
  POST, retrieved in chunks using iteration or retrieved in chunks using the
  read interface.
  '''
  
  def __init__(self, fields, files, chunk_size=1024**2):
    '''Constructor for multipart.
    :param fields: sequence of (name, value) elements for regular form fields
    :type fields: [(string, string), ]
    :param files: sequence of (name, filename, value) elements for data to be
      uploaded as files.
    :type files: [(string, string, file-like object | string | unicode), ]
    :param chunk_size: Max number of bytes to return in a single iteration.
      If chunk_size is set lower than a few hundred bytes, chunks that include
      MMP headers and boundaries may exceed this number.
    :type chunk_size: integer
    :returns: None
    '''        
    self.chunk_size = chunk_size
    self.fields = fields
    self.files = files
    self.file_idx = 0
    self.state = 'form_fields'
    self.CRLF = '\r\n'
    self.BOUNDARY = '----------6B3C785C-6290-11DF-A355-A6ECDED72085_$'
    self.io = StringIO.StringIO()

  def get_content_length(self):
    '''Get the length, in bytes, of the MIME Multipart document that will be
    generated.
    
    :returns: length
    :returns type: integer
    '''
    m = multipart(self.fields, [(file[0], file[1], '') for file in self.files])
    content_length = len(m.read())
    for file in self.files:
      content_length += self._get_len(file)
    self.reset()
    return content_length

  def reset(self):
    '''Reset the mime_multipart object to its initial state.
    
    This allows the MIME Multipart document to be regenerated from the data with
    which the multipart object was instantiated.
    
    :returns: None
    '''
    self.file_idx = 0
    self.state = 'form_fields'
    self.io = StringIO.StringIO()

    for file in self.files:
      try:
        file[2].seek(0)
      except AttributeError, TypeError:
        pass

  def read(self, n=None):
    '''Read a chunk of the generated MIME Multipart document.
    
    The returned number of bytes will be equal to n for all chunks but the last
    one, which will most likely be smaller. When the method returns an empty
    string, there is no more data to be retrieved.

    If n is None, the entire MIME Multipart document is returned.
    
    :param n: Minimum number of bytes to read.
    :type n: integer
    :returns: The bytes that were read.
    :returns type: string
    '''
    if n is None:
      # Return everything at once.
      for s in self:
        self.io.write(s)
      return self.io.getvalue()
    else:
      # Return in chunks.
      
      # "top up" FLO.
      try:
        while True:
          self.io.seek(0, os.SEEK_END)
          if self.io.tell() >= n:
            break
          self.io.write(self.next())
      except StopIteration:
        pass

      # Get n bytes from front of FLO.
      self.io.seek(0)
      ret = self.io.read(n)
  
      # Remove n bytes from front of FLO.
      self.io = StringIO.StringIO(self.io.read())

    return ret

  def next(self):
    '''Iterate over the multipart object and return the next chunk of MIME
    Multipart data.

    The returned number of bytes will match the chunk_size with which the
    multipart object was instantiated when chunks of files are returned. When
    parts of the MIME Multipart structure is returned, the number of bytes
    returned will be between zero and a few hundred.

    :returns: The next chunk of MIME Multipart data.
    :returns type: string
    '''
        
    if self.state == 'form_fields':
      if len(self.files) > 0:
        self.state = 'file_head'
      else:
        self.state = 'body_foot'
      return self._form_fields()

    elif self.state == 'file_head':
      self.state = 'select'
      return self._file_head()
    
    elif self.state == 'select':
      key, filename, val = self.files[self.file_idx]
      if isinstance(val, str):
        self.state = 'str_val'
      elif isinstance(val, unicode):
        self.state = 'unicode_val'
      else:
        self.state = 'file_chunk'
      return ''
      
    elif self.state == 'str_val':
      self.state = 'file_foot'
      return self._str_val()

    elif self.state == 'unicode_val':
      self.state = 'file_foot'
      return self._unicode_val()

    elif self.state == 'file_chunk':
      data = self._file_chunk()
      if len(data) > 0:
        return data
      self.state = 'file_foot'
      return ''

    elif self.state == 'file_foot':
      self.state = 'next_file'
      return self._file_foot()

    elif self.state == 'next_file':
      self.file_idx += 1
      if self.file_idx < len(self.files):
        self.state = 'file_head'
        return ''
      else:
        self.state = 'body_foot'
        return ''
            
    elif self.state == 'body_foot':
      self.state = 'body_end'
      return self._body_foot()
    
    elif self.state == 'body_end':
      raise StopIteration

    else:
      raise Exception('Invalid state in {0}: {1}'.format(__file__, self.state))
  
  def _get_len(self, file):
    '''Get the length of a file or FLO.
    
    :param file: File of which to get the length.
    :type file: file object | file-like object
    '''
    try:
      pos = file[2].tell()
      file[2].seek(0, os.SEEK_END)
      size = file[2].tell()
      file[2].seek(pos)
      return size
    except AttributeError:
      return len(file[2])

  def get_content_type_header(self):
    '''Get the contents for the Content-Type header.
    '''
    return 'multipart/form-data; boundary={0}'.format(self.BOUNDARY)

  def _guess_mime_type(self, filename):
    '''Internal method that attempts to map a filename extension to a mimetype.
    
    :param filename: The name of a file, including extension.
    :type filename: string
    :returns: Mimetype.
    :returns type: string
    '''
    return mimetypes.guess_type(filename)[0] or MIMETYPE_OCTETSTREAM

  def _form_fields(self):
    '''Generate the MIME Multipart form fields.
    '''
    L = []
    for (key, val) in self.fields.items():
      L.append('--' + self.BOUNDARY)
      L.append('Content-Disposition: form-data; name="%s"' % key)
      L.append('')
      L.append(val)
    return self.CRLF.join(L)

  def _file_head(self):
    '''Generate the MIME Multipart header for a file.
    '''
    key, filename, val = self.files[self.file_idx]
    L = []
    L.append('--' + self.BOUNDARY)
    L.append('Content-Disposition: form-data; name="%s"; filename="%s"' % (key, filename))
    L.append('Content-Type: %s' % self._guess_mime_type(filename))
    L.append('')
    L.append('')
    return self.CRLF.join(L)

  def _file_chunk(self):
    '''Get a chunk of the file currently being iterated.
    '''
    key, filename, val = self.files[self.file_idx]
    return val.read(self.chunk_size)

  def _file_foot(self):
    '''Get the footer used to designate the end of a file.
    '''
    return self.CRLF

  def _str_val(self):
    '''Get information about the file currently being iterated. Used when the
    file is represented as a string.
    '''
    key, filename, val = self.files[self.file_idx]
    return val

  def _unicode_val(self):
    '''Get information about the file currently being iterated. Used when the
    file is represented as a Unicode string.
    '''
    key, filename, val = self.files[self.file_idx]
    return val.encode('utf-8')

  def _body_foot(self):
    '''Get the footer used to designate the end of the MIME Multipart
    document.
    '''
    L = []
    L.append('--' + self.BOUNDARY + '--')
    L.append('')
    return self.CRLF.join(L)

  def __iter__(self):
    '''Start the iteration. This automatically resets the object so that
    the object can be iterated multiple times and the result is the same
    each time.
    '''
    self.reset()
    return self


#===============================================================================

class RESTClient(object):
  '''REST HTTP client that encodes POST and PUT using MIME multipart encoding.
  '''

  def __init__(self, 
               defaultHeaders={}, 
               timeout=RESPONSE_TIMEOUT, 
               keyfile=None, 
               certfile=None, 
               strictHttps=True):
    '''Constructor for RESTClient.
    
    :param defaultHeaders: list of headers that will be sent with all requests.
    :type defaultHeaders: dictionary
    :param timeout: Time in seconds that requests will wait for a response.
    :type timeout: integer
    :param keyfile: name of a PEM formatted file that contains a private key. 
    :type keyfile: string
    :param certfile: PEM formatted certificate chain file.
    :type certfile: string
    :param strictHttps: 
    :type strictHttps: boolean
    '''
    self.defaultHeaders = defaultHeaders
    self.timeout = timeout
    self.keyfile = keyfile
    self.certfile = certfile
    self.strictHttps = strictHttps
    self.logger = logging.getLogger('RESTClient')
    self._lasturl = ''
    self._curlrequest = []


  def _getConnection(self, scheme, host, port):
    if scheme == 'http':
      conn = httplib.HTTPConnection(host, port, self.timeout)
    else:
      conn = httplib.HTTPSConnection(host=host,
                                     port=port, 
                                     key_file=self.keyfile,
                                     cert_file=self.certfile, 
                                     strict=self.strictHttps,
                                     timeout=self.timeout)
    if self.logger.getEffectiveLevel() == logging.DEBUG:
      conn.set_debuglevel(logging.DEBUG)
    return conn


  def _parseURL(self, url):
    parts = urlparse.urlsplit(url)
    res =  {'scheme': parts.scheme,
            'host': parts.netloc.split(':')[0],
            'path': parts.path,
            'query': parts.query,
            'fragment': parts.fragment}
    try:
      res['port'] = int(parts.port)
    except:
      if res['scheme'] == 'https':
        res['port'] = 443
      else:
        res['port'] = 80
    return res


  def _mergeHeaders(self, headers):
    res = self.defaultHeaders
    if headers is not None:
      for header in headers.keys():
        res[header] = headers[header]
    return res
  

  def _getResponse(self, conn):
    return conn.getresponse()


  def _doRequestNoBody(self, method, url, url_params=None, headers=None):
    parts = self._parseURL(url)
    targeturl = parts['path']  
    headers = self._mergeHeaders(headers)
    if not url_params is None:
      #URL encode url_params and append to URL
      if self.logger.getEffectiveLevel() == logging.DEBUG:
        self.logger.debug("DATA=%s" % str(url_params))
      if parts['query'] == '':
        parts['query'] = urlencode(url_params)
      else:
        parts['query'] = '%s&%s' % (parts['query'], \
                                    urlencode(url_params))
      targeturl = urlparse.urljoin(targeturl, "?%s" % parts['query'])
    if self.logger.getEffectiveLevel() == logging.DEBUG:
      self.logger.debug('targetURL=%s' % targeturl)
      self.logger.debug('HEADERS=%s' % str(headers))
    # Create the HTTP or HTTPS connection.
    conn = self._getConnection(parts['scheme'], parts['host'], parts['port'])
    # Store URL and equivalent CURL request for debugging.
    self._lasturl = '%s://%s:%s%s' % (parts['scheme'], parts['host'], 
                                      parts['port'], targeturl)
    self._curlrequest = ['curl', '-X %s' % method]
    for h in headers.keys():
      self._curlrequest.append('-H "%s: %s"' % (h, headers[h]))
    self._curlrequest.append('"%s"' % self._lasturl)
    # Perform request using specified HTTP verb.
    conn.request(method, targeturl, None, headers)
    return self._getResponse(conn)
    

  def _doRequestMMBody(self, method, url, url_params=None, headers=None, fields=None, files=None):
    parts = self._parseURL(url)
    targeturl = parts['path']
    headers = self._mergeHeaders(headers)
    if not url_params is None:
      try:
        url_params.__getattribute__('keys')
        fdata = []
        for k in url_params.keys():
          fdata.append((k, url_params[k]))
      except:
        pass
      url_params = fdata
    if headers is None:
      headers = {}
    if fields is None:
      fields = {}
    if files is None:
      files = []
    mm = multipart(fields, files)
    headers['Content-Type'] = mm.get_content_type_header()
    headers['Content-Length'] = mm.get_content_length()
    if self.logger.getEffectiveLevel() == logging.DEBUG:
      self.logger.debug('targetURL=%s' % targeturl)
      self.logger.debug('HEADERS=%s' % str(headers))
    # Create the HTTP or HTTPS connection.
    conn = self._getConnection(parts['scheme'], parts['host'], parts['port'])
    # Store URL and equivalent CURL request for debugging.
    self._lasturl = '%s://%s:%s%s' % (parts['scheme'], parts['host'], 
                                      parts['port'], targeturl)
    self._curlrequest = ['curl', '-X %s' % method]
    for h in headers.keys():
      self._curlrequest.append('-H "%s: %s"' % (h, headers[h]))
    for d in fields:
      self._curlrequest.append('-F %s=%s' % (d[0], d[1]))
    for f in files:
      #self._curlrequest.append('-F %s=@%s' % (f['name'], f['filename']))
      self._curlrequest.append('-F %s=@%s' % (f[0], f[1]))
    self._curlrequest.append('"%s"' % self._lasturl)
    # Perform request using specified HTTP verb.
    conn.request(method, targeturl, mm, headers)
    return self._getResponse(conn)


  def getLastRequestAsCurlCommand(self):
    '''Returns a curl command line equivalent of the last request issued by
    this client instance.
    
    :return type: unicode
    '''
    return u" ".join(self._curlrequest)


  def getlastUrl(self):
    '''Returns the last URL that was opened using this client instance.
    
    :return type: string
    '''
    return self._lasturl


  def GET(self, url, url_params=None, headers=None):
    '''Perform a HTTP GET and return the response. All values are to be UTF-8
    encoded - no Unicode encoding is done by this method.
    
    :param url: The full URL to the target
    :type url: String
    :param url_params: Parameters that will be encoded in the query portion of the 
      final URL.
    :type url_params: dictionary of key-value pairs, or list of (key, value)
    :param headers: Additional headers in addition to default to send
    :type headers: Dictionary
    :returns: The result of the HTTP request
    :return type: httplib.HTTPResponse 
    '''
    return self._doRequestNoBody('GET', url, url_params=url_params, headers=headers)

  
  def HEAD(self, url, url_params=None, headers=None):
    '''Perform a HTTP HEAD and return the response. All values are to be UTF-8
    encoded - no Unicode encoding is done by this method. Note that HEAD 
    requests return no body.
    
    :param url: The full URL to the target
    :type url: String
    :param url_params: Parameters that will be encoded in the query portion of the 
      final URL.
    :type url_params: dictionary of key-value pairs, or list of (key, value)
    :param headers: Additional headers in addition to default to send
    :type headers: Dictionary
    :returns: The result of the HTTP request
    :return type: httplib.HTTPResponse 
    '''
    return self._doRequestNoBody('HEAD', url, url_params, headers)

  
  def DELETE(self, url, url_params=None, headers=None):
    '''Perform a HTTP DELETE and return the response. All values are to be UTF-8
    encoded - no Unicode encoding is done by this method.
    
    :param url: The full URL to the target
    :type url: String
    :param url_params: Parameters that will be encoded in the query portion of the 
      final URL.
    :type url_params: dictionary of key-value pairs, or list of (key, value)
    :param headers: Additional headers in addition to default to send
    :type headers: Dictionary
    :return: The result of the HTTP request
    :type return: httplib.HTTPResponse 
    '''
    return self._doRequestNoBody('DELETE', url, url_params, headers)

  
  def POST(self, url, url_params=None, headers=None, fields=None, files=None):
    '''Perform a HTTP POST and return the response. All values are to be UTF-8
    encoded - no Unicode encoding is done by this method. The body of the POST 
    message is encoded using MIME multipart-mixed.
    
    :param url: The full URL to the target
    :type url: String
    :param url_params: Parameters that will be send in the message body.
    :type url_params: dictionary of key-value pairs, or list of (key, value)
    :param files: List of files that will be sent with the POST request. The
      "name" is the name of the parameter in the MM body, "filename" is the 
      value of the "filename" parameter in the MM body, and "value" is a 
      file-like object open for reading that will be transmitted. 
    :type files: list of (name, filename, value)
    :param headers: Additional headers in addition to default to send
    :type headers: Dictionary
    :returns: The result of the HTTP request
    :return type: httplib.HTTPResponse 
    '''
    return self._doRequestMMBody('POST', url, url_params, headers, fields, files)

  
  def PUT(self, url, url_params=None, headers=None, fields=None, files=None):
    '''Perform a HTTP PUT and return the response. All values are to be UTF-8
    encoded - no Unicode encoding is done by this method. The body of the POST 
    message is encoded using MIME multipart-mixed.
    
    :param url: The full URL to the target
    :type url: String
    :param url_params: Parameters that will be send in the message body.
    :type url_params: dictionary of key-value pairs, or list of (key, value)
    :param files: List of files that will be sent with the POST request. The
      "name" is the name of the parameter in the MM body, "filename" is the 
      value of the "filename" parameter in the MM body, and "value" is a 
      file-like object open for reading that will be transmitted. 
    :type files: list of (name, filename, value)
    :param headers: Additional headers in addition to default to send
    :type headers: Dictionary
    :returns: The result of the HTTP request
    :return type: httplib.HTTPResponse 
    '''
    return self._doRequestMMBody('PUT', url, url_params, headers, fields, files)

