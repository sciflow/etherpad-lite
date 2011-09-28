Branch: pad-resources
=====================

Description
-----------

The pad-resources branch provides the functionality to upload arbitrary files or data to an etherpad-lite instance, to bound that data to a specific pad and to retrieve this data be some special access handlers. This can be used to store images or files, which belong to a pad and to reference them, using normal urls.

### Example

One could store an image named _foo.png_ using a specific padId. More precisely, one would store the file using the _resources_ datastore of a pad specified by its padId.


Requirements
------------

This branch needs the functionality from the [datastore branch](https://github.com/sciflow/etherpad-lite/tree/datastore). Therefor the datastore functionality is has to be merged into this branch.
